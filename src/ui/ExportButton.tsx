import React, { useState, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { AudioAnalyzer } from '../core/AudioAnalyzerService';
import { EncodeSettings } from './EncodeSettings';
import { Flex, Button, Dialog, Text } from '@radix-ui/themes';
import { GearIcon, DownloadIcon, Cross2Icon } from '@radix-ui/react-icons';
import { EffectType, WaveformEffectConfig, AudioSource } from '../core/types';
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

    // WaveformEffectの元設定を保存
    let originalWaveformConfig: WaveformEffectConfig | null = null;
    let waveformEffect: WaveformEffect | undefined;

    try {
      setIsExporting(true);
      setIsCanceled(false);
      setExportProgress(0);

      // リアルタイム描画を停止
      manager.stopRenderLoop();

      // WaveformEffectを取得し、オフライン解析データを設定
      const effects = manager.getEffects();
      waveformEffect = effects.find(
        effect => effect.getConfig().type === EffectType.Waveform
      ) as WaveformEffect | undefined;

      if (waveformEffect) {
        // 元の設定を保存
        originalWaveformConfig = { ...waveformEffect.getConfig() } as WaveformEffectConfig;

        // オフライン用に一時的に設定を変更
        waveformEffect.updateConfig({
          ...originalWaveformConfig,
          options: {
            ...originalWaveformConfig.options,
            analysisMode: 'offline',
            // プレビューと同じセグメント数を使用して位置ずれを防ぐ
            segmentCount: originalWaveformConfig.options.segmentCount || 1024
          }
        } as WaveformEffectConfig);

        // 既存の解析データがあればそれを使用、なければ新規解析
        if (audioSource) {
          waveformEffect.setAudioSource(audioSource);
        } else {
          // 新規解析が必要な場合
          const analyzer = new AudioAnalyzer(videoSettings.frameRate);
          const wavBuffer = await createWavFromAudioBuffer(audioBuffer);
          const newAudioSource = await analyzer.processAudio(
            new File([wavBuffer], 'temp.wav', { type: 'audio/wav' })
          );
          waveformEffect.setAudioSource(newAudioSource);
        }
      }

      // エンコーダを初期化
      const encoder = new VideoEncoderService({
        ...videoSettings,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });
      await encoder.initialize();

      // フレーム数を計算（正確なフレーム数を算出）
      const totalFrames = Math.ceil(audioBuffer.duration * videoSettings.frameRate);

      // フレームごとの処理
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (isCanceled) {
          throw new Error('エクスポートがキャンセルされました');
        }

        // 現在の時間を計算（秒単位）
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

        // 音声データのエンコード（同じフレームインデックスを使用）
        await encoder.encodeAudioBuffer(audioBuffer, frameIndex);

        // 進捗更新
        const progress = (frameIndex / totalFrames) * 100;
        setExportProgress(progress);
        onProgress?.(progress);
      }

      // 完了処理
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
      // WaveformEffectを元の設定に戻す
      if (originalWaveformConfig && waveformEffect) {
        waveformEffect.updateConfig(originalWaveformConfig);
      }

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

// AudioBufferからWAVファイルを作成する関数
const createWavFromAudioBuffer = async (audioBuffer: AudioBuffer): Promise<ArrayBuffer> => {
  // WAVヘッダーの作成
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2; // 16-bit samples
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // WAVヘッダーを書き込む
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');                                // RIFFヘッダー
  view.setUint32(4, 36 + length, true);                 // ファイルサイズ
  writeString(8, 'WAVE');                               // WAVEヘッダー
  writeString(12, 'fmt ');                              // fmtチャンク
  view.setUint32(16, 16, true);                         // fmtチャンクサイズ
  view.setUint16(20, 1, true);                          // フォーマットID (1: PCM)
  view.setUint16(22, numOfChan, true);                  // チャンネル数
  view.setUint32(24, audioBuffer.sampleRate, true);     // サンプリングレート
  view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChan, true); // バイトレート
  view.setUint16(32, numOfChan * 2, true);              // ブロックサイズ
  view.setUint16(34, 16, true);                         // ビット深度
  writeString(36, 'data');                              // dataチャンク
  view.setUint32(40, length, true);                     // データサイズ

  // オーディオデータの書き込み
  const offset = 44;
  const samples = new Float32Array(audioBuffer.length * numOfChan);
  let sampleIndex = 0;

  // インターリーブ形式でサンプルを結合
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      samples[sampleIndex++] = channelData[i];
    }
  }

  // Float32からInt16に変換して書き込み
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
};