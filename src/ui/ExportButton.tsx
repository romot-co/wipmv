import React, { useState, useRef, useCallback } from 'react';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { EncodeSettings } from './EncodeSettings';
import { EffectManager } from '../core/EffectManager';
import { AudioSource } from '../core/types';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { Cross2Icon, GearIcon } from '@radix-ui/react-icons';

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
  audioSource
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // キャンセルが指示されたかを示すフラグ
  const cancelRef = useRef<boolean>(false);

  /**
   * エクスポートメイン処理
   */
  const handleExport = useCallback(async () => {
    if (!manager) {
      onError(new Error('EffectManager が存在しません。'));
      return;
    }
    if (!audioSource || !audioSource.buffer) {
      onError(new Error('有効な AudioSource がセットされていないため、エクスポートできません。'));
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      cancelRef.current = false;

      // エンコードサービス初期化
      const encoder = new VideoEncoderService({
        width: videoSettings.width,
        height: videoSettings.height,
        frameRate: videoSettings.frameRate,
        videoBitrate: videoSettings.videoBitrate,
        audioBitrate: videoSettings.audioBitrate,
        sampleRate: audioSource.sampleRate,
        channels: audioSource.numberOfChannels
      });
      await encoder.initialize();

      // 仕様として、全フレームを順次描画→エンコード
      // 音声の総フレーム数を計算
      const totalFrames = Math.ceil(audioSource.duration * videoSettings.frameRate);

      // Export 前に EffectManager でリアルタイム描画ループ停止（必要に応じて）
      manager.stopRenderLoop();

      // フレームごとに描画＋エンコード
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (cancelRef.current) {
          // キャンセルされた場合はエラー扱いで抜ける(任意)
          throw new Error('エクスポートがキャンセルされました。');
        }

        // 現在時刻を計算
        const currentTime = frameIndex / videoSettings.frameRate;

        // managerに対して時間を更新
        manager.updateParams({
          currentTime,
          duration: audioSource.duration,
          isPlaying: false,
        });

        // 描画実行
        manager.render();

        // Canvas取得
        const canvas = manager.getCanvas();
        if (!canvas) {
          throw new Error('エクスポート用のCanvasが取得できません。');
        }

        // 1フレーム分の映像エンコード
        await encoder.encodeVideoFrame(canvas, frameIndex);

        // 1フレーム分の音声エンコード
        // → 必要に応じて区切ったAudio情報を渡す or 全体をまとめてencodeしておき
        //   ここでは例としてフレーム単位で呼んでいる想定
        await encoder.encodeAudioBuffer(audioSource.buffer, frameIndex);

        // 進捗更新
        const p = (frameIndex / totalFrames) * 100;
        setExportProgress(p);
        if (onProgress) {
          onProgress(p);
        }
      }

      // 完了処理
      const result = await encoder.finalize();
      encoder.dispose();

      // ダウンロード用処理
      const blob = new Blob([result], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      onError(err instanceof Error ? err : new Error('エクスポートに失敗しました。'));
    } finally {
      setIsExporting(false);
      // エクスポート完了後に何らかの再開処理やクリーンアップを行いたい場合はここ
      manager.startRenderLoop();
    }
  }, [manager, audioSource, videoSettings, onError, onProgress]);

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