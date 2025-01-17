import React, { useState, useCallback, useMemo } from 'react';
import { Container, Flex, Box, Card, Section } from '@radix-ui/themes';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { ExportButton } from './ui/ExportButton';
import { AudioUploader } from './ui/AudioUploader';
import { useAudioControl } from './hooks/useAudioControl';
import { useApp } from './contexts/AppContext';
import { ErrorBoundary, CustomErrorFallback } from './ErrorBoundary';

import { 
  EffectType,
  AudioSource,
  EffectConfig,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig
} from './core/types';

import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
// import { ProjectService } from './core/ProjectService';
import { AudioAnalyzerService } from './core/AudioAnalyzerService';
import { EffectBase } from './core/EffectBase';
import { BackgroundEffect } from './features/background/BackgroundEffect';
import { TextEffect } from './features/text/TextEffect';
import { WaveformEffect } from './features/waveform/WaveformEffect';
import { WatermarkEffect } from './features/watermark/WatermarkEffect';
import { 
  createDefaultBackgroundEffect,
  createDefaultTextEffect,
  createDefaultWaveformEffect,
  createDefaultWatermarkEffect
} from './core/DefaultEffectService';
import './App.css';

// WithAudioSourceインターフェースの追加
interface WithAudioSource {
  setAudioSource: (source: AudioSource) => void;
}

// エフェクト追加時の型チェック関数
function hasSetAudioSource(effect: unknown): effect is WithAudioSource {
  return effect !== null && typeof effect === 'object' && 'setAudioSource' in effect && 
    typeof (effect as WithAudioSource).setAudioSource === 'function';
}

export const App: React.FC = () => {
  const { handleError, clearError } = useApp();

  // 動画設定
  const [videoSettings, setVideoSettings] = useState({
    width: 1280,
    height: 720,
    frameRate: 30,
    videoBitrate: 5000000,  // 5Mbps
    audioBitrate: 128000    // 128kbps
  });

  // エクスポート進捗
  const [exportProgress, setExportProgress] = useState(0);
  const handleExportProgress = useCallback((progress: number) => {
    setExportProgress(progress);
  }, []);

  const [selectedEffectId, setSelectedEffectId] = useState<string>();

  // AudioPlaybackServiceをシングルトン的に保持
  const audioService = useMemo(() => AudioPlaybackService.getInstance(), []);

  // 事前解析データを保持
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [manager, setManager] = useState<EffectManager | null>(null);
  const [effects, setEffects] = useState<EffectBase[]>([]);

  // デフォルトのエフェクトを作成
  const createDefaultEffects = useCallback((duration: number) => {
    const defaultBackground = new BackgroundEffect({
      ...createDefaultBackgroundEffect(),
      backgroundType: 'solid',
      color: '#1a1a1a',
      opacity: 1,
      zIndex: 0,
      startTime: 0,
      endTime: duration
    });

    const defaultWaveform = new WaveformEffect({
      ...createDefaultWaveformEffect(),
      waveformType: 'bar',
      barWidth: 4,
      barGap: 2,
      color: '#00ff00',
      sensitivity: 1.2,
      opacity: 0.8,
      zIndex: 1,
      startTime: 0,
      endTime: duration
    });

    const defaultWatermark = new WatermarkEffect({
      ...createDefaultWatermarkEffect(),
      position: { x: 20, y: 20 },
      size: { width: 100, height: 30 },
      opacity: 0.8,
      zIndex: 2,
      startTime: 0,
      endTime: duration
    });

    return [defaultBackground, defaultWaveform, defaultWatermark];
  }, []);

  // EffectManager初期化時に呼ばれる
  const handleManagerInit = useCallback((newManager: EffectManager) => {
    console.log('EffectManager初期化:', newManager);
    
    // 既に初期化済みの場合は何もしない
    if (manager) {
      console.log('EffectManagerは既に初期化済みです');
      return;
    }
    
    // AudioServiceを接続
    newManager.setAudioService(audioService);
    
    // レンダリングループを開始
    newManager.startPreviewLoop();

    setManager(newManager);

    // 音声ソースがある場合は初期エフェクトを作成
    const currentAudioSource = audioService.getAudioSource();
    if (currentAudioSource) {
      const initialEffects = createDefaultEffects(currentAudioSource.duration);
      initialEffects.forEach(effect => {
        if (hasSetAudioSource(effect)) {
          effect.setAudioSource(currentAudioSource);
        }
        newManager.addEffect(effect as EffectBase<EffectConfig>);
      });
      setEffects(initialEffects);
    }

    // エラーをクリア
    clearError('audio');

  }, [audioService, manager, createDefaultEffects, clearError]);

  // オーディオ制御フック (UI操作用)
  const {
    state: { currentTime, duration, isPlaying },
    play,
    pause,
    seek,
  } = useAudioControl(audioService);

  // オーディオファイルのロード処理
  const handleAudioLoad = useCallback(async (file: File) => {
    try {
      // 既存のエフェクトをクリア
      if (manager) {
        manager.getEffects().forEach(effect => effect.dispose());
        setEffects([]);
      }

      // オーディオの読み込みと解析
      const audioContext = audioService.getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // AudioAnalyzerServiceを使用して解析
      const analyzerService = AudioAnalyzerService.getInstance();
      const source = await analyzerService.analyzeAudio(audioBuffer);
      setAudioSource(source);
      await audioService.setAudioSource(source);

      // マネージャーが既に存在する場合は初期エフェクトを作成
      if (manager) {
        const initialEffects = createDefaultEffects(source.duration);
        initialEffects.forEach(effect => {
          if (hasSetAudioSource(effect)) {
            effect.setAudioSource(source);
          }
          manager.addEffect(effect as EffectBase<EffectConfig>);
        });
        setEffects(initialEffects);
      }

      clearError('audio');
    } catch (error) {
      handleError('audio', error instanceof Error ? error : new Error('音声ファイルの読み込みに失敗しました'));
    }
  }, [audioService, manager, createDefaultEffects, handleError, clearError]);

  // エフェクト追加
  const handleEffectAdd = useCallback(async (type: EffectType) => {
    if (!manager) {
      console.warn('EffectManagerが初期化されていません');
      return;
    }

    try {
      const currentEffects = manager.getEffects();
      const zIndex = currentEffects.length;
      let effect: EffectBase<EffectConfig>;
      const audioSource = audioService.getAudioSource();
      const defaultConfig = {
        startTime: 0,
        endTime: audioSource?.duration ?? 0,
        zIndex
      };

      // エフェクトの作成
      switch (type) {
        case EffectType.Background:
          effect = new BackgroundEffect({
            ...createDefaultBackgroundEffect(),
            ...defaultConfig
          } as BackgroundEffectConfig);
          break;
        case EffectType.Text:
          effect = new TextEffect({
            ...createDefaultTextEffect(),
            ...defaultConfig
          } as TextEffectConfig);
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect({
            ...createDefaultWaveformEffect(),
            ...defaultConfig
          } as WaveformEffectConfig);
          if (audioSource && hasSetAudioSource(effect)) {
            effect.setAudioSource(audioSource);
          }
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect({
            ...createDefaultWatermarkEffect(),
            ...defaultConfig
          } as WatermarkEffectConfig);
          break;
        default:
          throw new Error(`不正なエフェクトタイプ: ${type}`);
      }

      // エフェクト追加時に事前解析データを設定
      const currentAudioSource = audioService.getAudioSource();
      if (currentAudioSource && hasSetAudioSource(effect)) {
        effect.setAudioSource(currentAudioSource);
      }

      // エフェクトをマネージャーに追加
      manager.addEffect(effect);
      
      // エフェクト一覧を更新
      const updatedEffects = manager.getEffects();
      setEffects(updatedEffects);
      setSelectedEffectId(effect.getId());
      clearError('effect');

      // レンダリングを強制的に更新
      requestAnimationFrame(() => {
        if (manager) {
          const currentTime = audioService.getCurrentTime();
          manager.updateAll(currentTime);
          const canvas = document.createElement('canvas');
          canvas.width = videoSettings.width;
          canvas.height = videoSettings.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            manager.renderAll(ctx);
          }
        }
      });

    } catch (error) {
      console.error('エフェクト追加エラー:', error);
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [manager, handleError, audioService, clearError, videoSettings]);

  // エフェクト削除
  const handleEffectRemove = useCallback((id: string) => {
    if (!manager) return;
    manager.removeEffect(id);
    const updatedEffects = manager.getEffects();
    setEffects(updatedEffects);
    if (selectedEffectId === id) {
      setSelectedEffectId(undefined);
    }
  }, [manager, selectedEffectId]);

  // エフェクト移動
  const handleEffectMove = useCallback((id: string, direction: 'up' | 'down') => {
    if (!manager) return;
    
    // 現在のエフェクトリストを取得
    const currentEffects = manager.getEffects();
    
    // z-indexでソート
    const sortedEffects = [...currentEffects].sort((a, b) => 
      (b.getConfig().zIndex ?? 0) - (a.getConfig().zIndex ?? 0)
    );

    // 移動対象のインデックスを取得
    const currentIndex = sortedEffects.findIndex(e => e.getId() === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedEffects.length) return;

    // 移動対象と入れ替え先のエフェクトを取得
    const currentEffect = sortedEffects[currentIndex];
    const targetEffect = sortedEffects[newIndex];

    // z-indexを交換
    const currentZIndex = currentEffect.getConfig().zIndex ?? 0;
    const targetZIndex = targetEffect.getConfig().zIndex ?? 0;

    // エフェクトの設定を更新
    manager.updateEffectConfig(currentEffect.getId(), { zIndex: targetZIndex });
    manager.updateEffectConfig(targetEffect.getId(), { zIndex: currentZIndex });

    // 更新を通知
    setEffects(manager.getEffects());
  }, [manager]);

  // 選択中のエフェクトを取得
  const selectedEffect = useMemo(() => {
    if (!selectedEffectId || !manager) return null;
    return manager.getEffect(selectedEffectId) || null;
  }, [selectedEffectId, manager]);

  // エフェクト設定の更新
  const handleEffectUpdate = useCallback(<T extends EffectConfig>(id: string, newConfig: Partial<T>) => {
    if (!manager) return;
    try {
      const effect = manager.getEffect(id);
      if (effect) {
        effect.updateConfig(newConfig);

        // 画像URLが変更された場合は画像を設定
        if ('imageUrl' in newConfig && typeof newConfig.imageUrl === 'string') {
          if ('setImage' in effect && typeof effect.setImage === 'function') {
            effect.setImage(newConfig.imageUrl);
          }
        }

        const updatedEffects = manager.getEffects();
        setEffects(updatedEffects);
        clearError('effect');
      }
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
    }
  }, [manager, handleError, clearError]);

  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <div className="app">
        <Container>
          <Section>
            <Flex direction="column" gap="4">
              <Card className="upload-section">
                <AudioUploader
                  onFileSelect={handleAudioLoad}
                  onError={(error) => handleError('audio', error)}
                />
              </Card>

              {audioSource && (
                <Box className="main-content">
                  <Card className="preview-section">
                    <PreviewCanvas
                      onManagerInit={handleManagerInit}
                      videoSettings={videoSettings}
                    />
                    <Box className="controls-section">
                      <PlaybackControls
                        currentTime={currentTime}
                        duration={duration}
                        isPlaying={isPlaying}
                        onPlay={play}
                        onPause={pause}
                        onSeek={seek}
                        volume={audioService.getVolume()}
                        onVolumeChange={(v) => audioService.setVolume(v)}
                        loop={audioService.getLoop()}
                        onLoopChange={(l) => audioService.setLoop(l)}
                      />
                    </Box>
                  </Card>

                  <Card className="effects-panel">
                    <Flex direction="column" gap="4">
                      <EffectList
                        effects={effects}
                        selectedEffectId={selectedEffectId}
                        onEffectSelect={setSelectedEffectId}
                        onEffectAdd={handleEffectAdd}
                        onEffectRemove={handleEffectRemove}
                        onEffectMove={handleEffectMove}
                      />
                      {selectedEffect && (
                        <Box className="effect-settings-container">
                          <EffectSettings
                            effect={selectedEffect}
                            onUpdate={(config) => handleEffectUpdate(selectedEffect.getId(), config)}
                            duration={audioService.getDuration()}
                          />
                        </Box>
                      )}
                    </Flex>
                  </Card>

                  <Card className="export-section">
                    <ExportButton
                      manager={manager}
                      onError={(error) => handleError('export', error)}
                      onProgress={handleExportProgress}
                      videoSettings={videoSettings}
                      onSettingsChange={setVideoSettings}
                      audioSource={audioSource}
                    />
                    {exportProgress > 0 && exportProgress < 100 && (
                      <Box className="export-progress">
                        エクスポート中... {Math.round(exportProgress)}%
                      </Box>
                    )}
                  </Card>
                </Box>
              )}
            </Flex>
          </Section>
        </Container>
      </div>
    </ErrorBoundary>
  );
};

export default App;