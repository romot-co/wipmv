import React, { useCallback, useEffect, useState } from 'react';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { Inspector } from './components/inspector/Inspector';
import { useEffects } from './hooks/useEffects';
import { usePreview } from './hooks/usePreview';
import { VisualEffectConfig } from './types/effects';
import { EffectType } from './types/effects/base';
import './App.css';

/**
 * アプリケーションのメインコンポーネント
 * 
 * エフェクトの管理とプレビュー機能を統合し、
 * ユーザーインターフェースを提供する
 */
export function App() {
  // オーディオの状態管理
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // エフェクト管理フック
  const {
    effects,
    selectedEffect,
    selectedEffectType,
    selectEffect,
    createEffect,
    updateEffect,
    removeEffect,
    clearEffects
  } = useEffects();

  // プレビュー管理フック
  const {
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
    initializeCanvas,
    updateEffects,
    play,
    pause,
    stop
  } = usePreview();

  // オーディオファイルのドロップハンドラー
  const handleAudioDrop = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setDuration(buffer.duration * 1000); // 秒からミリ秒に変換
    } catch (error) {
      console.error('オーディオファイルの読み込みに失敗しました:', error);
    }
  }, [setDuration]);

  // 再生/停止の切り替え
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (audioBuffer) {
      play(audioBuffer);
    }
  }, [isPlaying, play, pause, audioBuffer]);

  // エフェクトの選択
  const handleSelectEffect = useCallback((type: EffectType | null) => {
    selectEffect(type);
  }, [selectEffect]);

  // エフェクトの更新
  const handleEffectUpdate = useCallback((type: EffectType, config: Partial<VisualEffectConfig>) => {
    updateEffect(type, config);
  }, [updateEffect]);

  // エフェクトの削除
  const handleEffectRemove = useCallback((type: EffectType) => {
    removeEffect(type);
  }, [removeEffect]);

  // エフェクトの作成
  const handleEffectCreate = useCallback((type: EffectType, config: VisualEffectConfig) => {
    createEffect(type, config);
  }, [createEffect]);

  // エフェクトの更新監視
  useEffect(() => {
    updateEffects(effects);
  }, [effects, updateEffects]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>WIP MV Maker</h1>
      </header>

      <main className="app-main">
        <div className="preview-container">
          <PreviewPlayer
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            audioBuffer={audioBuffer}
            effects={effects}
            selectedEffectType={selectedEffectType}
            onPlayPause={handlePlayPause}
            onTimeUpdate={setCurrentTime}
            onDrop={handleAudioDrop}
            onCanvasInit={initializeCanvas}
            onSelectEffect={handleSelectEffect}
          />
        </div>

        <div className="inspector-container">
          <Inspector
            selectedEffect={selectedEffect}
            effectType={selectedEffectType}
            onEffectUpdate={handleEffectUpdate}
            onEffectRemove={handleEffectRemove}
            onEffectCreate={handleEffectCreate}
          />
        </div>
      </main>
    </div>
  );
}
