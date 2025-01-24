import React, { useState, useRef, useCallback } from 'react';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { EncodeSettings } from './EncodeSettings';
import { EffectManager } from '../core/EffectManager';
import { AudioSource, VideoSettings } from '../core/types';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { Cross2Icon, GearIcon } from '@radix-ui/react-icons';
import { Renderer } from '../core/Renderer';

/**
 * ExportButtonProps
 * - manager:         EffectManager (エフェクト描画を管理するクラス)
 * - onError:         エラー発生時のコールバック
 * - onProgress:      進捗(%)更新時のコールバック
 * - videoSettings:   現在のビデオ設定 (解像度, FPS, ビットレート等)
 * - onSettingsChange: エクスポート設定変更時のコールバック
 * - audioSource:     AudioPlaybackService 等から取得した AudioSource (解析済み)
 */
interface ExportButtonProps {
  manager: EffectManager;
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
  videoSettings: VideoSettings;
  onSettingsChange: (settings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  }) => void;
  audioSource: AudioSource | null | undefined;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

/**
 * ExportButton コンポーネント
 *  - エクスポート設定ダイアログを開いて VideoEncoderService を呼び出す
 *  - オンライン/オフライン描画を行い、最終的にMP4を生成してダウンロードする
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  manager,
  onError,
  onProgress,
  videoSettings,
  onSettingsChange,
  audioSource,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const cancelRef = useRef(false);

  const handleExport = useCallback(async () => {
    if (!manager) {
      onError?.(new Error('EffectManager が存在しません。'));
      return;
    }
    if (!audioSource?.buffer) {
      onError?.(new Error('有効な AudioSource がセットされていないため、エクスポートできません。'));
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      cancelRef.current = false;
      onExportStart?.();

      // エンコーダーを初期化
      const encoder = new VideoEncoderService({
        width: videoSettings.width,
        height: videoSettings.height,
        frameRate: videoSettings.frameRate,
        videoBitrate: videoSettings.videoBitrate,
        audioBitrate: videoSettings.audioBitrate,
        sampleRate: audioSource.buffer.sampleRate,
        channels: audioSource.buffer.numberOfChannels
      });

      await encoder.initialize();

      // エクスポート用のキャンバスを作成
      const canvas = manager.createExportCanvas({
        width: videoSettings.width,
        height: videoSettings.height
      });

      // フレーム数を計算
      const totalFrames = Math.ceil(audioSource.buffer.duration * videoSettings.frameRate);

      // フレームごとに描画＋エンコード
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (cancelRef.current) {
          throw new Error('エクスポートがキャンセルされました。');
        }

        // 現在時刻を計算
        const currentTime = frameIndex / videoSettings.frameRate;

        // フレームをレンダリング
        manager.renderExportFrame(canvas, currentTime);

        // 1フレーム分の映像エンコード
        await encoder.encodeVideoFrame(canvas, frameIndex);

        // 進捗更新
        const progress = (frameIndex + 1) / totalFrames * 100;
        setExportProgress(progress);
        onProgress?.(progress);
      }

      // 音声をエンコード
      await encoder.encodeAudioBuffer(audioSource.buffer, 0);

      // エンコードを完了
      const mp4Binary = await encoder.finalize();
      const blob = new Blob([mp4Binary], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // ダウンロードリンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.mp4';
      a.click();

      URL.revokeObjectURL(url);
      onExportComplete?.();
    } catch (error: unknown) {
      console.error('エクスポートエラー:', error);
      if (error instanceof Error) {
        onExportError?.(error);
      } else {
        onExportError?.(new Error('不明なエラーが発生しました'));
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [manager, videoSettings, audioSource, onExportStart, onExportComplete, onExportError, onProgress, onError]);

  /**
   * エクスポートキャンセル処理
   */
  const handleCancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  /**
   * 設定ダイアログ開閉
   */
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <Flex align="center" gap="3">
      {/* 設定ダイアログのトリガーボタン */}
      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Trigger>
          <Button
            variant="surface"
            color="gray"
            size="2"
            disabled={isExporting}
            onClick={handleOpenSettings}
          >
            <GearIcon />
            &nbsp;エクスポート設定
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Close>
            <Button variant="ghost" className="dialog-close">
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <Dialog.Title>エクスポート設定</Dialog.Title>
          <EncodeSettings
            {...videoSettings}
            onSettingsChange={onSettingsChange}
          />
          <Dialog.Close>
            <Button variant="solid" onClick={handleCloseSettings}>
              OK
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>

      {/* エクスポート開始ボタン or キャンセルボタン */}
      {!isExporting && (
        <Button variant="solid" color="blue" size="2" onClick={handleExport}>
          エクスポート
        </Button>
      )}
      {isExporting && (
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            エクスポート中... {Math.round(exportProgress)}%
          </Text>
          <Button variant="soft" color="red" size="2" onClick={handleCancel}>
            キャンセル
          </Button>
        </Flex>
      )}
    </Flex>
  );
};