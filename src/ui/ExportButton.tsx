import React, { useState, useCallback, useRef } from 'react';
import { Button, Dialog, Flex, Text, IconButton } from '@radix-ui/themes';
import { GearIcon, Cross2Icon } from '@radix-ui/react-icons';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { AppError, ErrorType } from '../core/types/error';
import { EncodeSettings } from './EncodeSettings';
import type { VideoSettings, AudioSource } from '../core/types/base';
import { useApp } from '../contexts/AppContext';

export interface ExportButtonProps {
  onError: (error: AppError) => void;
  onProgress?: (progress: number) => void;
  videoSettings: VideoSettings;
  onSettingsChange: (settings: VideoSettings) => void;
  audioSource?: AudioSource;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: AppError) => void;
  disabled?: boolean;
}

/**
 * ExportButton コンポーネント
 * - エクスポート設定ダイアログを開いて VideoEncoderService を呼び出す
 * - Worker ベースのオフライン描画を行い、最終的にMP4を生成してダウンロードする
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  onError,
  onProgress,
  videoSettings,
  onSettingsChange,
  audioSource,
  onExportStart,
  onExportComplete,
  onExportError,
  disabled
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const encoderRef = useRef<VideoEncoderService | null>(null);

  // コンテキストからマネージャーを取得
  const { managerInstance, drawingManager } = useApp();

  const handleExport = useCallback(async () => {
    if (!managerInstance || !drawingManager || !audioSource) {
      console.warn('Manager instances or audio source not available.');
      return;
    }

    const buffer = audioSource.buffer;
    if (!buffer) {
      console.warn('Audio buffer not available.');
      return;
    }

    try {
      console.log('Starting export process...');
      setIsExporting(true);
      setExportProgress(0);
      onExportStart?.();

      const handleProgress = (progress: { framesProcessed: number; totalFrames: number; progress: number; fps?: number }) => {
        const progressPercent = progress.progress * 100;
        setExportProgress(progressPercent);
        onProgress?.(progressPercent);
        console.log(`Export Progress: ${progressPercent.toFixed(1)}% (${progress.framesProcessed}/${progress.totalFrames})`);
        if (progress.fps) {
          console.log(`Encoding speed: ${progress.fps.toFixed(1)} fps`);
        }
      };

      // ネイティブWebCodecs用の設定を構築
      const encoderConfig = {
        width: videoSettings.width,
        height: videoSettings.height,
        frameRate: videoSettings.frameRate,
        videoBitrate: videoSettings.videoBitrate,
        audioBitrate: videoSettings.audioBitrate,
        sampleRate: videoSettings.sampleRate || buffer.sampleRate,
        channels: videoSettings.channels || buffer.numberOfChannels,
        codec: 'avc1.4d0034' as const, // H.264 Main Level 5.2
        keyFrameInterval: 2, // 2秒間隔でキーフレーム
        hardwareAcceleration: videoSettings.hardwareAcceleration || 'prefer-hardware'
      };

      encoderRef.current = new VideoEncoderService(encoderConfig);
      const encoder = encoderRef.current;

      const totalFrames = Math.ceil(buffer.duration * videoSettings.frameRate);
      console.log(`Starting export for ${totalFrames} frames.`);

      await encoder.initialize();
      encoder.setProgressCallback(handleProgress);
      console.log("Encoder initialized successfully.");

      await encoder.startEncoding(totalFrames);
      console.log("Encoding started.");

      const canvas = drawingManager.createExportCanvas({
        width: videoSettings.width,
        height: videoSettings.height
      });

      console.log("Starting frame encoding loop...");
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const currentTime = (frameIndex / videoSettings.frameRate);

        managerInstance.updateAll(currentTime);
        drawingManager.renderExportFrame(canvas, currentTime);

        const frameDuration = 1 / videoSettings.frameRate * 1_000_000; // マイクロ秒
        await encoder.encodeVideoFrame(canvas, currentTime, frameDuration);
      }
      console.log("Frame encoding loop finished.");

      console.log("Finalizing encoding...");
      const mp4Binary = await encoder.finalize();
      console.log("Export finalized, MP4 size:", mp4Binary.byteLength);

      // 注意: 現在の実装は簡易版で実際のMP4ファイルではない
      // 実際の使用にはmp4-muxerとの統合が必要
      const blob = new Blob([mp4Binary], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('MP4 download initiated.');
      onExportComplete?.();

    } catch (error) {
      console.error('エクスポート処理中にエラー発生:', error);
      if (error instanceof AppError) {
        if (error.type === ErrorType.EXPORT_CANCELLED) {
          console.log("Export was cancelled by user request.");
          onExportError?.(error);
        } else {
          onError(error);
          onExportError?.(error);
        }
      } else {
        const genericError = new AppError(ErrorType.EXPORT_ENCODE_FAILED, 'エクスポート中に予期せぬエラーが発生しました。', error);
        onError(genericError);
        onExportError?.(genericError);
      }
    } finally {
      console.log("Cleaning up export resources...");
      encoderRef.current?.dispose();
      encoderRef.current = null;
      setIsExporting(false);
      setExportProgress(0);
      setShowSettings(false);
    }
  }, [
    managerInstance,
    drawingManager,
    videoSettings,
    audioSource,
    onError,
    onProgress,
    onExportStart,
    onExportComplete,
    onExportError
  ]);

  const handleCancel = useCallback(() => {
    // キャンセル機能は現在の実装では未対応
    console.log("Export cancellation is not supported in current implementation");
    setIsExporting(false);
    setExportProgress(0);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleSettingsChange = useCallback((newSettings: VideoSettings) => {
    onSettingsChange(newSettings);
  }, [onSettingsChange]);

  const isButtonDisabled = disabled || !audioSource || !managerInstance || !drawingManager;

  return (
    <Flex align="center" gap="3">
      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Trigger>
          <Button
            variant="surface"
            color="gray"
            size="2"
            disabled={isExporting || disabled}
            onClick={handleOpenSettings}
          >
            <GearIcon />
            &nbsp;Export Settings
          </Button>
        </Dialog.Trigger>
        <Dialog.Content style={{ maxWidth: '700px', maxHeight: '90vh' }}>
          <Flex justify="end" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }}>
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" onClick={handleCloseSettings}>
                  <Cross2Icon />
              </IconButton>
            </Dialog.Close>
          </Flex>
          <EncodeSettings
            settings={videoSettings}
            onSettingsChange={handleSettingsChange}
            onExport={handleExport}
            onCancel={handleCloseSettings}
          />
        </Dialog.Content>
      </Dialog.Root>

      {/* エクスポート実行ボタン */}
      <Button
        variant="solid"
        color="blue"
        size="3"
        disabled={isButtonDisabled || isExporting}
        onClick={handleExport}
        style={{ minWidth: '120px' }}
      >
        {isExporting ? (
          <Flex align="center" gap="2">
            <Text size="2">エクスポート中...</Text>
            <Text size="1">{exportProgress.toFixed(0)}%</Text>
          </Flex>
        ) : (
          'エクスポート'
        )}
      </Button>
    </Flex>
  );
};