import React, { useCallback, useEffect, useState } from 'react';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { Inspector } from './components/inspector/Inspector';
import { useEffects } from './hooks/useEffects';
import { usePreview } from './hooks/usePreview';
import { VisualEffectConfig } from './types/effects';
import { EffectType } from './hooks/useEffects';
import './App.css';

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const {
    effects,
    selectedEffectType,
    setSelectedEffectType,
    initializeDefaultEffects,
    updateEffect,
    getEffectConfig
  } = useEffects();

  const {
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
    initializeCanvas,
    updateEffects,
    play,
    stop
  } = usePreview();

  // オーディオファイルのドロップハンドラー
  const handleAudioDrop = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setDuration(buffer.duration * 1000);
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
    }
  }, [setDuration]);

  // 再生/停止の切り替え
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stop();
    } else if (audioBuffer) {
      play(audioBuffer);
    }
  }, [isPlaying, play, stop, audioBuffer]);

  // エフェクトの初期化
  useEffect(() => {
    initializeDefaultEffects();
  }, [initializeDefaultEffects]);

  // エフェクトの更新監視
  useEffect(() => {
    updateEffects(effects);
  }, [effects, updateEffects]);

  // インスペクタのエフェクト更新ハンドラー
  const handleEffectUpdate = useCallback((type: EffectType, config: VisualEffectConfig) => {
    updateEffect(type, config);
  }, [updateEffect]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>WIP MV Maker</h1>
      </header>

      <main className="app-main">
        <div className="preview-container">
          <PreviewPlayer
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            audioBuffer={audioBuffer}
            onPlayPause={handlePlayPause}
            onTimeUpdate={setCurrentTime}
            onDrop={handleAudioDrop}
            onCanvasInit={initializeCanvas}
            onSelectEffect={setSelectedEffectType}
          />
        </div>

        <div className="controls-container">
          <Inspector
            selectedEffect={selectedEffectType ? getEffectConfig(selectedEffectType) : null}
            effectType={selectedEffectType}
            onEffectUpdate={handleEffectUpdate}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
