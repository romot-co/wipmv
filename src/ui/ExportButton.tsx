import React, { useState, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { EncodeSettings } from './EncodeSettings';
import { Flex, Button, Dialog, Text } from '@radix-ui/themes';
import { GearIcon, DownloadIcon, Cross2Icon } from '@radix-ui/react-icons';
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
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  audioBuffer,
  manager,
  onError,
  onProgress,
  videoSettings,
  onSettingsChange
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

      const encoder = new VideoEncoderService({
        ...videoSettings,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      await encoder.initialize();

      // フレーム数の計算
      const totalFrames = Math.ceil(audioBuffer.duration * videoSettings.frameRate);
      let frameCount = 0;

      // フレームごとの処理
      for (let time = 0; time < audioBuffer.duration; time += 1 / videoSettings.frameRate) {
        if (isCanceled) {
          throw new Error('エクスポートがキャンセルされました');
        }

        // 現在の時刻をミリ秒に変換
        const timeMs = time * 1000;

        // プレビューの更新
        manager.updateParams({
          currentTime: time,
          duration: audioBuffer.duration,
          isPlaying: false
        });

        // フレームの描画とエンコード
        manager.render();
        const canvas = manager.getCanvas();
        await encoder.encodeVideoFrame(canvas, timeMs * 1000); // マイクロ秒に変換

        // 進捗の更新
        frameCount++;
        const progress = (frameCount / totalFrames * 100);
        setExportProgress(progress);
        onProgress?.(progress);
      }

      // 音声データのエンコード
      const samplesPerFrame = Math.floor(audioBuffer.sampleRate / videoSettings.frameRate);
      for (let startSample = 0; startSample < audioBuffer.length; startSample += samplesPerFrame) {
        if (isCanceled) {
          throw new Error('エクスポートがキャンセルされました');
        }

        await encoder.encodeAudioBuffer(
          audioBuffer,
          startSample,
          Math.min(samplesPerFrame, audioBuffer.length - startSample),
          (startSample / audioBuffer.sampleRate) * 1000000 // マイクロ秒
        );
      }

      // エンコード完了
      const result = await encoder.finalize();
      
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