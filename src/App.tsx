import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { AddEffectButton } from './ui/AddEffectButton';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { ExportButton } from './ui/ExportButton';
import { AudioUploader } from './ui/AudioUploader';
import { useAudioControl } from './hooks/useAudioControl';
import { EffectConfig, EffectType } from './core/types';
import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { EffectBase } from './core/EffectBase';
import { BackgroundEffect } from './features/background/BackgroundEffect';
import { TextEffect } from './features/text/TextEffect';
import { WaveformEffect } from './features/waveform/WaveformEffect';
import { WatermarkEffect } from './features/watermark/WatermarkEffect';
import './App.css';

export const App: React.FC = () => {
  // アプリケーションの状態を定義
  type AppState = 'initial' | 'ready' | 'error';
  const [appState, setAppState] = useState<AppState>('initial');
  
  // エラー状態の集約
  const [errors, setErrors] = useState<{
    audio?: Error;
    effect?: Error;
    export?: Error;
  }>({});

  const [selectedEffectId, setSelectedEffectId] = useState<string>();
  const [audioService] = useState(() => new AudioPlaybackService());
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [manager, setManager] = useState<EffectManager | null>(null);
  const [effects, setEffects] = useState<EffectBase[]>([]);

  // エラーハンドリングの統一
  const handleError = useCallback((type: keyof typeof errors, error: Error) => {
    console.error(`${type}エラー:`, error);
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
    setAppState('error');
  }, []);

  // 状態遷移を関数として定義
  const transition = useCallback((newState: AppState) => {
    console.log(`状態遷移: ${appState} -> ${newState}`);
    setAppState(newState);
  }, [appState]);

  // エラー状態のクリア
  const clearError = useCallback((type: keyof typeof errors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });
    if (Object.keys(errors).length === 1) {
      transition('ready');
    }
  }, [errors, transition]);

  const handleManagerInit = useCallback((newManager: EffectManager) => {
    console.log('EffectManager初期化:', newManager);
    setManager(newManager);
    transition('ready');
  }, [transition]);

  const handleEffectAdd = useCallback((type: EffectType) => {
    if (!manager) return;
    try {
      const zIndex = manager.getEffects().length;
      let effect: EffectBase;

      switch (type) {
        case EffectType.Background:
          effect = new BackgroundEffect({
            id: `background-${Date.now()}`,
            type: EffectType.Background,
            backgroundType: 'color',
            color: '#000000',
            zIndex,
            visible: true
          });
          break;
        case EffectType.Text:
          effect = new TextEffect({
            id: `text-${Date.now()}`,
            type: EffectType.Text,
            text: 'テキスト',
            style: {
              fontSize: 24,
              fontFamily: 'sans-serif',
              color: '#ffffff'
            },
            position: { x: 100, y: 100 },
            zIndex,
            visible: true
          });
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect({
            id: `waveform-${Date.now()}`,
            type: EffectType.Waveform,
            position: { x: 0, y: 0, width: 800, height: 200 },
            colors: {
              primary: '#ffffff'
            },
            zIndex,
            visible: true
          });
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect({
            id: `watermark-${Date.now()}`,
            type: EffectType.Watermark,
            imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            position: { x: 50, y: 50, width: 100, height: 100 },
            style: {
              opacity: 0.5,
              blendMode: 'source-over'
            },
            zIndex,
            visible: true
          });
          break;
      }

      manager.addEffect(effect);
      setEffects(manager.getEffects());
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [manager, handleError]);

  const handleEffectRemove = useCallback((id: string) => {
    if (!manager) return;
    manager.removeEffect(id);
    setEffects(manager.getEffects());
    if (selectedEffectId === id) {
      setSelectedEffectId(undefined);
    }
  }, [manager, selectedEffectId]);

  const handleEffectMove = useCallback((id: string, direction: 'up' | 'down') => {
    if (!manager) return;
    if (direction === 'up') {
      manager.moveEffectUp(id);
    } else {
      manager.moveEffectDown(id);
    }
    setEffects(manager.getEffects());
  }, [manager]);

  const handleEffectUpdate = useCallback((config: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;
    manager.updateEffect(selectedEffectId, config);
    manager.render();
  }, [manager, selectedEffectId]);

  const {
    currentTime,
    isPlaying,
    duration,
    play,
    pause,
    seek,
    getAnalyser,
    getWaveformData,
    getFrequencyData
  } = useAudioControl({ 
    manager,
    audioService
  });

  // 選択中のエフェクトを取得（メモ化）
  const selectedEffect = useMemo(() => {
    if (!selectedEffectId || !manager) return undefined;
    return manager.getEffects().find(e => e.getConfig().id === selectedEffectId);
  }, [selectedEffectId, manager]);

  // エフェクトの状態を監視（最適化）
  useEffect(() => {
    if (!manager) return;
    
    // 初期状態を設定
    setEffects(manager.getEffects());

    let timeoutId: number;
    const updateEffects = () => {
      const currentEffects = manager.getEffects();
      setEffects(prev => {
        // 変更がない場合は更新しない
        if (prev.length === currentEffects.length && 
            prev.every((e, i) => e.getConfig().id === currentEffects[i].getConfig().id)) {
          return prev;
        }
        return currentEffects;
      });

      // 次の更新をスケジュール
      timeoutId = window.setTimeout(updateEffects, 200);
    };

    // 初回更新を開始
    timeoutId = window.setTimeout(updateEffects, 200);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [manager]);

  // レンダリングループの制御（最適化）
  useEffect(() => {
    if (!manager) return;
    
    if (isPlaying) {
      manager.startRenderLoop();
    } else {
      manager.stopRenderLoop();
    }

    return () => {
      manager.stopRenderLoop();
    };
  }, [manager, isPlaying]);

  // プレビューキャンバスのプロパティをメモ化（最適化）
  const previewProps = useMemo(() => ({
    width: 960,
    height: 600,
    isPlaying,
    waveformData: getWaveformData(),
    frequencyData: getFrequencyData(),
    onManagerInit: handleManagerInit,
    onError: (error: Error) => handleError('effect', error)
  }), [isPlaying, getWaveformData, getFrequencyData, handleManagerInit, handleError]);

  // プレイバックコントロールのプロパティをメモ化
  const playbackProps = useMemo(() => ({
    isPlaying,
    currentTime,
    duration,
    onPlay: async () => await play(),
    onPause: async () => await pause(),
    onSeek: seek
  }), [isPlaying, currentTime, duration, play, pause, seek]);

  // エラー表示コンポーネント
  const ErrorMessage: React.FC<{
    type: keyof typeof errors;
    error: Error;
  }> = ({ type, error }) => (
    <div className="error-section">
      <p className="error-message">{error.message}</p>
      <button onClick={() => clearError(type)} className="retry-button">
        再試行
      </button>
    </div>
  );

  // AudioSourceの取得
  const analyser = getAnalyser();

  // 初期状態またはオーディオ未ロード時の表示
  if (appState === 'initial' || !isAudioLoaded || !duration || !analyser) {
    return (
      <div className="app app--empty">
        <AudioUploader 
          audioService={audioService}
          onAudioLoad={() => {
            setIsAudioLoaded(true);
            clearError('audio');
            transition('ready');
          }}
          onError={(error) => handleError('audio', error)}
        />
        {errors.audio && <ErrorMessage type="audio" error={errors.audio} />}
        {!analyser && <div className="loading-message">オーディオ解析を準備中...</div>}
      </div>
    );
  }

  // エラー状態の表示
  if (appState === 'error') {
    return (
      <div className="app app--error">
        <div className="error-container">
          {Object.entries(errors).map(([type, error]) => (
            <ErrorMessage 
              key={type} 
              type={type as keyof typeof errors} 
              error={error} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="preview-section">
        <PreviewCanvas {...previewProps} />
        {audioService.getAudioBuffer() && (
          <ExportButton
            audioBuffer={audioService.getAudioBuffer()!}
            manager={manager}
            onError={(error) => handleError('export', error)}
            onProgress={(progress) => console.log('Export progress:', progress)}
          />
        )}
      </div>
      <div className="controls-section">
        <PlaybackControls {...playbackProps} />
        <AddEffectButton onAdd={handleEffectAdd} />
      </div>
      <div className="effects-section">
        <EffectList
          effects={effects}
          selectedEffectId={selectedEffectId}
          onEffectSelect={setSelectedEffectId}
          onEffectRemove={handleEffectRemove}
          onEffectMove={handleEffectMove}
        />
        {selectedEffect && (
          <EffectSettings
            effect={selectedEffect}
            onUpdate={handleEffectUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default App;