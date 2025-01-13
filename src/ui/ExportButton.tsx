import React, { useRef, useState } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoEncoderService } from '../core/VideoEncoderService';
import { EncodeSettings } from './EncodeSettings';
import { EncodeCanvas } from './EncodeCanvas';
import './ExportButton.css';

interface ExportButtonProps {
  audioBuffer: AudioBuffer;
  manager: EffectManager | null;
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  audioBuffer,
  manager,
  onError,
  onProgress
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const encodeManagerRef = useRef<EffectManager | null>(null);

  // エンコード設定の初期値
  const [encodeSettings, setEncodeSettings] = useState({
    width: 960,
    height: 600,
    frameRate: 30,
    videoBitrate: 5000000,
    audioBitrate: 128000
  });

  const handleExport = async () => {
    if (!encodeManagerRef.current || isExporting || !manager) return;

    try {
      setIsExporting(true);
      setIsCanceled(false);

      const encoder = new VideoEncoderService({
        ...encodeSettings,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      await encoder.initialize();

      // 進捗計算用の変数
      const totalFrames = Math.ceil(audioBuffer.duration * encodeSettings.frameRate);
      let processedFrames = 0;

      // エフェクト状態を高解像度マネージャーにコピー
      encodeManagerRef.current.copyStateFrom(manager);

      // フレームごとの処理
      for (let time = 0; time < audioBuffer.duration; time += 1/encodeSettings.frameRate) {
        if (isCanceled) {
          throw new Error('エクスポートがキャンセルされました');
        }

        // 波形データを計算
        const waveformSamplesPerFrame = Math.floor(audioBuffer.sampleRate / encodeSettings.frameRate);
        const waveformStartSample = Math.floor(time * audioBuffer.sampleRate);
        const waveformData = new Float32Array(1024);
        
        // 波形データを生成
        for (let i = 0; i < waveformData.length; i++) {
          const start = waveformStartSample + Math.floor(i * waveformSamplesPerFrame / waveformData.length);
          const end = waveformStartSample + Math.floor((i + 1) * waveformSamplesPerFrame / waveformData.length);
          let sum = 0;
          let count = 0;
          
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let j = start; j < end && j < channelData.length; j++) {
              sum += Math.abs(channelData[j]);
              count++;
            }
          }
          
          waveformData[i] = count > 0 ? sum / count : 0;
        }

        // パラメータを更新
        encodeManagerRef.current.updateParams({
          currentTime: time,
          duration: audioBuffer.duration,
          isPlaying: true,
          waveformData
        });

        // フレームをレンダリング
        encodeManagerRef.current.render();

        // フレームをエンコード
        await encoder.encodeVideoFrame(
          encodeManagerRef.current.getCanvas(),
          time * 1000000
        );

        // 音声データをエンコード
        const audioSamplesPerFrame = Math.floor(audioBuffer.sampleRate / encodeSettings.frameRate);
        const audioStartSample = Math.floor(time * audioBuffer.sampleRate);
        await encoder.encodeAudioBuffer(
          audioBuffer,
          audioStartSample,
          audioSamplesPerFrame,
          time * 1000000
        );

        // 進捗を更新
        processedFrames++;
        onProgress?.(processedFrames / totalFrames);
      }

      // エンコード完了
      const data = await encoder.finalize();
      
      // ダウンロード
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
      onError(error instanceof Error ? error : new Error('エクスポートに失敗しました'));
    } finally {
      setIsExporting(false);
      setIsCanceled(false);
      onProgress?.(0);
    }
  };

  const handleCancel = () => {
    setIsCanceled(true);
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button settings"
        onClick={() => setShowSettings(!showSettings)}
        disabled={isExporting}
      >
        設定
      </button>

      {showSettings && (
        <EncodeSettings
          {...encodeSettings}
          onSettingsChange={setEncodeSettings}
        />
      )}

      <button
        className={`export-button ${isExporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'エクスポート中...' : 'エクスポート'}
      </button>

      {isExporting && (
        <button
          className="export-button cancel"
          onClick={handleCancel}
        >
          キャンセル
        </button>
      )}

      <EncodeCanvas
        width={encodeSettings.width}
        height={encodeSettings.height}
        onInit={(manager) => {
          encodeManagerRef.current = manager;
        }}
      />
    </div>
  );
}; 