import React, { useState, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { AudioAnalyzerService } from '../core/AudioAnalyzerService';
import { EncodeSettings } from './EncodeSettings';
import { Flex, Button, Dialog, Text } from '@radix-ui/themes';
import { GearIcon, DownloadIcon, Cross2Icon } from '@radix-ui/react-icons';
import { EffectType, AudioSource } from '../core/types';
import { WaveformEffect } from '../features/waveform/WaveformEffect';
import './ExportButton.css';

interface ExportButtonProps {
  audioBuffer: AudioBuffer;
  manager: EffectManager | null;
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
  videoSettings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  };
  onSettingsChange: (settings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  }) => void;
  audioSource?: AudioSource;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  audioBuffer,
  manager,
  onError,
  onProgress,
  videoSettings,
  onSettingsChange,
  audioSource
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!manager || !audioBuffer) return;

    try {
      setIsExporting(true);
      setIsCanceled(false);
      setExportProgress(0);

      // リアルタイム描画を停止
      manager.stopRenderLoop();

      // エンコーダを初期化
      const encoder = new VideoEncoderService({
        ...videoSettings,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });
      await encoder.initialize();

      // フレーム数を計算
      const totalFrames = Math.ceil(audioBuffer.duration * videoSettings.frameRate);

      // WaveformEffectの設定を一時的に変更
      const effects = manager.getEffects();
      const waveformEffect = effects.find(
        effect => effect.getConfig().type === EffectType.Waveform
      ) as WaveformEffect | undefined;

      if (waveformEffect) {
        // オフライン解析が必要な場合
        if (!audioSource) {
          const analyzer = AudioAnalyzerService.getInstance();
          const newAudioSource = await analyzer.analyzeAudio(audioBuffer);
          waveformEffect.updateConfig({ audioSource: newAudioSource });
        } else {
          waveformEffect.updateConfig({ audioSource });
        }
      }

      // フレームごとの処理
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (isCanceled) {
          throw new Error('エクスポートがキャンセルされました');
        }

        const currentTime = frameIndex / videoSettings.frameRate;

        // オフラインモードでの描画
        manager.updateParams({
          currentTime,
          duration: audioBuffer.duration,
          isPlaying: false
        });
        
        // 描画を実行
        manager.render();

        // ビデオフレームのエンコード
        const canvas = manager.getCanvas();
        await encoder.encodeVideoFrame(canvas, frameIndex);

        // 音声データのエンコード
        await encoder.encodeAudioBuffer(audioBuffer, frameIndex);

        // 進捗更新
        const progress = (frameIndex / totalFrames) * 100;
        setExportProgress(progress);
        onProgress?.(progress);
      }

      // エンコード完了処理
      const result = await encoder.finalize();
      encoder.dispose();

      // ダウンロード
      const blob = new Blob([result], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.mp4';
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      onError(error instanceof Error ? error : new Error('エクスポートに失敗しました'));
    } finally {
      // 必ずプレビュー用のレンダリングループを再開
      manager.startRenderLoop();

      setIsExporting(false);
      setIsCanceled(false);
      setExportProgress(0);
      onProgress?.(0);
    }
  };

  const handleCancel = useCallback(() => {
    setIsCanceled(true);
  }, []);

  return (
    <Flex gap="2">
      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Trigger>
          <Button variant="surface" color="gray" disabled={isExporting}>
            <GearIcon width="16" height="16" />
            エクスポート設定
          </Button>
        </Dialog.Trigger>

        <Dialog.Content>
          <Dialog.Title>エクスポート設定</Dialog.Title>
          <EncodeSettings
            {...videoSettings}
            onSettingsChange={onSettingsChange}
          />
        </Dialog.Content>
      </Dialog.Root>

      {!isExporting ? (
        <Button
          disabled={!manager}
          onClick={handleExport}
          color="blue"
        >
          <DownloadIcon width="16" height="16" />
          エクスポート
        </Button>
      ) : (
        <Flex gap="2">
          <Text size="2">エクスポート中... {Math.round(exportProgress)}%</Text>
          <Button
            onClick={handleCancel}
            color="red"
            variant="soft"
          >
            <Cross2Icon width="16" height="16" />
            キャンセル
          </Button>
        </Flex>
      )}
    </Flex>
  );
};