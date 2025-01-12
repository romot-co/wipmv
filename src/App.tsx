import React, { useCallback, useState } from 'react';
import { useAudioControl } from './hooks/useAudioControl';
import { useAudioData } from './hooks/useAudioData';
import { EffectManager } from './core/EffectManager';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { EffectConfig, EffectType } from './core/types';
import { BackgroundEffect } from './features/background/BackgroundEffect';
import { TextEffect } from './features/text/TextEffect';
import { WaveformEffect } from './features/waveform/WaveformEffect';
import { WatermarkEffect } from './features/watermark/WatermarkEffect';

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<AudioBuffer | null>(null);
  const [manager, setManager] = useState<EffectManager | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string | undefined>(undefined);
  const [encoderError, setEncoderError] = useState<Error | null>(null);
  const [encodingProgress, setEncodingProgress] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);

  const {
    isPlaying,
    currentTime,
    play,
    pause,
    seek,
    initAudioContext
  } = useAudioControl({ effectManager: manager });

  const { waveformData, frequencyData, updateAudioData } = useAudioData();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setAudioFile(audioBuffer);
      updateAudioData(audioBuffer);
      initAudioContext();
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
      if (error instanceof Error) {
        setEncoderError(error);
      }
    }
  }, [updateAudioData, initAudioContext]);

  const handleEffectChange = useCallback((newConfig: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;
    manager.updateEffect(selectedEffectId, newConfig);
  }, [manager, selectedEffectId]);

  const handleEffectSelect = (effectId: string | undefined) => {
    setSelectedEffectId(effectId);
  };

  const handleManagerInit = useCallback((newManager: EffectManager) => {
    setManager(newManager);
    
    // 初期エフェクトの追加
    const backgroundEffect = new BackgroundEffect({
      type: EffectType.Background,
      backgroundType: 'color',
      color: '#000000',
      visible: true,
      zIndex: 0,
    });
    newManager.addEffect(backgroundEffect, 'background');
    setSelectedEffectId('background');

    if (audioFile) {
      newManager.setAudioBuffer(audioFile);
    }
  }, [audioFile]);

  const handleAddEffect = useCallback((type: EffectType) => {
    if (!manager) return;

    const id = `${type}-${Date.now()}`;
    let effect;

    switch (type) {
      case EffectType.Background:
        effect = new BackgroundEffect({
          type: EffectType.Background,
          backgroundType: 'color',
          color: '#000000',
          visible: true,
          zIndex: manager.getEffects().size,
        });
        break;
      case EffectType.Text:
        effect = new TextEffect({
          type: EffectType.Text,
          text: 'テキストを入力',
          style: {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            align: 'center',
            baseline: 'middle',
          },
          position: { x: 400, y: 300 },
          visible: true,
          zIndex: manager.getEffects().size,
        });
        break;
      case EffectType.Waveform:
        effect = new WaveformEffect({
          type: EffectType.Waveform,
          style: 'bar',
          colors: {
            primary: '#ffffff',
            secondary: '#888888',
          },
          position: { x: 0, y: 400, width: 800, height: 200 },
          visible: true,
          zIndex: manager.getEffects().size,
        });
        break;
      case EffectType.Watermark:
        effect = new WatermarkEffect({
          type: EffectType.Watermark,
          imageUrl: '',
          position: { x: 0, y: 0, width: 100, height: 100 },
          style: { opacity: 1 },
          visible: true,
          zIndex: manager.getEffects().size,
        });
        break;
    }

    if (effect) {
      manager.addEffect(effect, id);
      setSelectedEffectId(id);
    }
  }, [manager]);

  const handleRemoveEffect = useCallback((id: string) => {
    if (!manager) return;
    manager.removeEffect(id);
    if (selectedEffectId === id) {
      setSelectedEffectId(undefined);
    }
  }, [manager, selectedEffectId]);

  const handleEncode = useCallback(async () => {
    if (!manager) return;

    try {
      setIsEncoding(true);
      setEncodingProgress(0);
      const chunks: Uint8Array[] = [];
      
      // エンコーディングを開始
      const encoder = new VideoEncoder({
        output: (chunk) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunks.push(data);
        },
        error: (error) => {
          console.error('Encoding error:', error);
          setEncoderError(error);
          setIsEncoding(false);
        }
      });

      // エンコーダーの設定
      await encoder.configure({
        codec: 'vp8',
        width: 800,
        height: 600,
        bitrate: 1_000_000, // 1Mbps
        framerate: 30,
      });

      // フレームをエンコード
      const duration = audioFile?.duration || 0;
      const frameCount = Math.ceil(duration * 30); // 30fps
      
      for (let i = 0; i < frameCount; i++) {
        const time = i / 30;
        manager.updateTime(time);
        manager.render();
        
        // キャンバスの内容をVideoFrameに変換
        const imageData = manager.getCanvas().getContext('2d')?.getImageData(0, 0, 800, 600);
        if (!imageData) continue;

        const imageBitmap = await createImageBitmap(imageData);
        const frame = new VideoFrame(imageBitmap, {
          timestamp: i * 1000000 / 30, // マイクロ秒単位
        });

        encoder.encode(frame);
        frame.close();
        imageBitmap.close();

        // プログレスの更新
        setEncodingProgress(Math.floor((i + 1) / frameCount * 100));
      }

      // エンコーディングを終了
      await encoder.flush();
      encoder.close();

      // WebMファイルの作成
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      // ダウンロードリンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // URLを解放
      URL.revokeObjectURL(url);
      setIsEncoding(false);
      setEncodingProgress(0);

    } catch (error) {
      console.error('Encoding failed:', error);
      setEncoderError(error instanceof Error ? error : new Error('Unknown encoding error'));
      setIsEncoding(false);
      setEncodingProgress(0);
    }
  }, [manager, audioFile]);

  return (
    <div className="app">
      <div className="main-area">
        <div className="upload-section">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>

        {audioFile && (
          <div className="playback-section">
            <PlaybackControls
              currentTime={currentTime}
              duration={audioFile.duration}
              isPlaying={isPlaying}
              onPlay={play}
              onPause={pause}
              onSeek={seek}
            />
          </div>
        )}

        <div className="preview-section">
          {audioFile && (
            <PreviewCanvas
              width={800}
              height={600}
              isPlaying={isPlaying}
              waveformData={waveformData}
              frequencyData={frequencyData}
              onManagerInit={handleManagerInit}
            />
          )}
        </div>

        {encoderError && (
          <div className="error-message">
            エラー: {encoderError.message}
          </div>
        )}
      </div>

      <div className="sidebar">
        <div className="effect-controls">
          <h3>エフェクトを追加</h3>
          <div className="effect-buttons">
            <button onClick={() => handleAddEffect(EffectType.Background)}>背景</button>
            <button onClick={() => handleAddEffect(EffectType.Text)}>テキスト</button>
            <button onClick={() => handleAddEffect(EffectType.Waveform)}>波形</button>
            <button onClick={() => handleAddEffect(EffectType.Watermark)}>ウォーターマーク</button>
          </div>
        </div>

        <EffectList
          manager={manager}
          selectedEffectId={selectedEffectId}
          onEffectSelect={handleEffectSelect}
          onEffectRemove={handleRemoveEffect}
        />
        <EffectSettings
          manager={manager}
          selectedEffectId={selectedEffectId}
          onEffectChange={handleEffectChange}
        />

        {audioFile && (
          <div className="encode-section">
            <button
              onClick={handleEncode}
              className="encode-button"
              disabled={!manager || isPlaying || isEncoding}
            >
              {isEncoding ? `エンコード中... ${encodingProgress}%` : 'エンコード＆ダウンロード'}
            </button>
            {isEncoding && (
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${encodingProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;