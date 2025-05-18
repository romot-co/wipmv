import React, { useState, useRef, useCallback } from 'react';
import { Button, Dialog, Flex, Text, IconButton } from '@radix-ui/themes';
import { EncodeSettings } from './EncodeSettings';
import { Cross2Icon, GearIcon } from '@radix-ui/react-icons';
import { ExportButtonProps } from '../core/types/core';
import { VideoEncoderService, ProgressCallback } from '../core/VideoEncoderService';
import { AppError, ErrorType } from '../core/types/error';
import { useApp } from '../contexts/AppContext';

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
  const { managerInstance, drawingManager } = useApp();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const encoderRef = useRef<VideoEncoderService | null>(null);

  const handleExport = useCallback(async () => {
    if (!managerInstance || !drawingManager) {
      onError(new AppError(
        ErrorType.INVALID_STATE,
        'EffectManager or DrawingManager is not available in context.'
      ));
      return;
    }

    const buffer = audioSource?.buffer;
    if (!buffer) {
      onError(new AppError(
        ErrorType.INVALID_STATE,
        'Valid AudioSource is not set. Cannot export.'
      ));
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      onExportStart?.();

      const handleProgress: ProgressCallback = (processedFrames, totalFrames) => {
        const progress = totalFrames > 0 ? (processedFrames / totalFrames) * 100 : 0;
        setExportProgress(progress);
        onProgress?.(progress);
        console.log(`Export Progress: ${progress.toFixed(1)}% (${processedFrames}/${totalFrames})`);
      };

      encoderRef.current = new VideoEncoderService({
        width: videoSettings.width,
        height: videoSettings.height,
        frameRate: videoSettings.frameRate,
        videoBitrate: videoSettings.videoBitrate,
        audioBitrate: videoSettings.audioBitrate,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels
      });
      const encoder = encoderRef.current;

      const totalFrames = Math.ceil(buffer.duration * videoSettings.frameRate);
      console.log(`Starting export for ${totalFrames} frames.`);

      await encoder.initialize(handleProgress, totalFrames);
      console.log("Encoder initialized successfully.");

      const canvas = drawingManager.createExportCanvas({
        width: videoSettings.width,
        height: videoSettings.height
      });

      console.log("Starting frame encoding loop...");
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const currentTime = (frameIndex / videoSettings.frameRate);

        managerInstance.updateAll(currentTime);
        drawingManager.renderExportFrame(canvas, currentTime);

        encoder.encodeVideoFrame(canvas, frameIndex);
        encoder.encodeAudioBuffer(buffer, frameIndex);
      }
      console.log("Frame encoding loop finished. Finalizing...");

      const mp4Binary = await encoder.finalize();
      console.log("Export finalized, MP4 size:", mp4Binary.byteLength);

      const blob = new Blob([mp4Binary], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("MP4 download initiated.");
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
    if (encoderRef.current) {
      console.log("User requested export cancellation...");
      encoderRef.current.cancel();
    } else {
       console.warn("Cannot cancel export: encoder instance not found.");
    }
    setIsExporting(false);
    setExportProgress(0);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

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
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Flex justify="end">
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" onClick={handleCloseSettings}>
                  <Cross2Icon />
              </IconButton>
            </Dialog.Close>
          </Flex>
          <Dialog.Title>Export Settings</Dialog.Title>
          <EncodeSettings
            {...videoSettings}
            onSettingsChange={onSettingsChange}
          />
        </Dialog.Content>
      </Dialog.Root>

      {!isExporting ? (
        <Button
          variant="solid"
          color="blue"
          size="2"
          disabled={isButtonDisabled}
          onClick={handleExport}
        >
          Export Video
        </Button>
      ) : (
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            Exporting... {Math.round(exportProgress)}%
          </Text>
          <Button variant="soft" color="red" size="2" onClick={handleCancel}>
            Cancel
          </Button>
        </Flex>
      )}
    </Flex>
  );
};
