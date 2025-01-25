import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { Container, Flex, Box, Card, Section } from '@radix-ui/themes';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { ExportButton } from './ui/ExportButton';
import { AudioUploader } from './ui/AudioUploader';
import { useApp } from './contexts/AppContext';
import { ErrorBoundary, CustomErrorFallback } from './ErrorBoundary';
import { EffectManager } from './core/EffectManager';
import { EffectBase } from './core/types/core';
import { 
  EffectType,
  EffectConfig,
} from './core/types/effect';
import { AudioSource, VideoSettings } from './core/types/base';
import debug from 'debug';
import { Renderer } from './core/Renderer';

// エフェクトのインポート
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

interface WithAudioSource {
  setAudioSource: (source: AudioSource) => void;
}

function hasSetAudioSource(effect: unknown): effect is WithAudioSource {
  return typeof (effect as WithAudioSource).setAudioSource === 'function';
}

// エフェクトの作成関数
function createEffectByType(type: EffectType): EffectBase<EffectConfig> {
  switch (type) {
    case 'background':
      return new BackgroundEffect(createDefaultBackgroundEffect());
    case 'text':
      return new TextEffect(createDefaultTextEffect());
    case 'waveform':
      return new WaveformEffect(createDefaultWaveformEffect());
    case 'watermark':
      return new WatermarkEffect(createDefaultWatermarkEffect());
    default:
      throw new Error(`Unknown effect type: ${type}`);
  }
}

const log = debug('app:App');

export const App: React.FC = () => {
  const {
    phase,
    projectState,
    audioState,
    effectState,
    transitionTo,
    createProject,
    saveProject,
    loadProject,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    addEffect,
    removeEffect,
    updateEffect,
    moveEffect,
    selectEffect,
    startExport,
    cancelExport,
    dispatch,
    services
  } = useApp();

  const currentTimeRef = useRef(0);
  const isLoopRunningRef = useRef(false);
  const lastStateRef = useRef({ currentTime: 0, isPlaying: false });
  const lastLogTimeRef = useRef<{ [key: string]: number }>({});

  // ログ出力を間引くヘルパー関数
  const shouldLog = (key: string, intervalMs: number = 1000): boolean => {
    const now = performance.now();
    const lastTime = lastLogTimeRef.current[key] || 0;
    if (now - lastTime > intervalMs) {
      lastLogTimeRef.current[key] = now;
      return true;
    }
    return false;
  };

  // エフェクトマネージャー
  const manager = useMemo(() => {
    if (shouldLog('manager-init')) {
      log('App: EffectManager初期化');
    }
    return new EffectManager();
  }, []);

  // プレビューキャンバスのレンダラー設定
  const handleRendererInit = useCallback((renderer: Renderer) => {
    if (shouldLog('renderer-init')) {
      log('App: レンダラーを設定');
    }
    manager.setRenderer(renderer);
  }, [manager]);

  // アニメーションループの制御
  useEffect(() => {
    let rafId: number;
    let lastLogTime = 0;
    const LOG_INTERVAL = 5000; // ログ出力の間隔を5秒に延長
    
    const animate = () => {
      if (!isLoopRunningRef.current) return;
      
      try {
        const currentTime = services.audioService.playback.getCurrentTime();
        
        if (manager && manager.getRenderer()) {
          const now = performance.now();
          
          // 状態が大きく変化した時のみログを出力
          if ((Math.abs(lastStateRef.current.currentTime - currentTime) > 1.0 || 
               lastStateRef.current.isPlaying !== audioState.isPlaying) &&
              now - lastLogTime > LOG_INTERVAL) {
            if (shouldLog('animation-frame')) {
              console.log('アニメーションフレーム詳細:', {
                currentTime,
                phase: phase.type,
                isPlaying: audioState.isPlaying,
                hasRenderer: true,
                effectCount: manager.getEffects().length,
                isLoopRunning: isLoopRunningRef.current
              });
            }
            
            lastStateRef.current = {
              currentTime,
              isPlaying: audioState.isPlaying
            };
            lastLogTime = now;
          }

          manager.updateAll(currentTime);
          manager.renderAll(currentTime);
          
          if (Math.abs(currentTime - audioState.currentTime) > 0.01) {
            dispatch({
              type: 'SET_AUDIO',
              payload: {
                currentTime
              }
            });
          }
        }
        
        rafId = requestAnimationFrame(animate);
      } catch (error) {
        console.error('アニメーションループエラー:', error);
        isLoopRunningRef.current = false;
      }
    };

    if (manager && manager.getRenderer() && !isLoopRunningRef.current) {
      if (shouldLog('animation-loop')) {
        console.log('アニメーションループ開始:', {
          phase: phase.type,
          currentTime: audioState.currentTime,
          hasManager: true,
          hasRenderer: true
        });
      }
      isLoopRunningRef.current = true;
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      if (isLoopRunningRef.current) {
        if (shouldLog('animation-loop')) {
          console.log('アニメーションループ停止');
        }
        isLoopRunningRef.current = false;
        cancelAnimationFrame(rafId);
      }
    };
  }, [manager, services, phase.type, dispatch]);

  // audioStateの変更を監視（ログ出力を間引く）
  const lastAudioStateLogRef = useRef(0);
  useEffect(() => {
    const now = performance.now();
    if (now - lastAudioStateLogRef.current > 1000) {
      console.log('audioState更新:', {
        currentTime: audioState.currentTime,
        isPlaying: audioState.isPlaying,
        phase: phase.type
      });
      lastAudioStateLogRef.current = now;
    }
  }, [audioState.currentTime, audioState.isPlaying, phase.type]);

  // エフェクトマネージャーの初期化
  useEffect(() => {
    if (!manager || !effectState.effects.length) return;

    if (shouldLog('effect-restore')) {
      log('App: 既存エフェクトの復元開始');
    }

    // 既存のエフェクトを復元
    effectState.effects.forEach((effect: EffectBase<EffectConfig>) => {
      manager.addEffect(effect);
      
      if (hasSetAudioSource(effect) && audioState.source) {
        const audioSource = {
          ...audioState.source,
          waveformData: audioState.analysis?.waveformData || [],
          frequencyData: audioState.analysis?.frequencyData?.map(data => 
            data instanceof Uint8Array ? data : new Uint8Array(data.length)
          ) || []
        };
        effect.setAudioSource(audioSource);
      }
    });

    try {
      manager.updateAll(0);
      manager.renderAll(0);
    } catch (error) {
      console.error('エフェクト初期描画エラー:', error);
    }

    if (shouldLog('effect-restore')) {
      log('App: 既存エフェクトの復元完了');
    }
  }, [manager, effectState.effects]);

  // エフェクト追加
  const handleAddEffect = useCallback(async (type: EffectType) => {
    try {
      if (shouldLog('effect-add')) {
        log('エフェクト追加:', type);
      }
      const effect = createEffectByType(type);
      await addEffect(effect);
      selectEffect(effect.getId());
    } catch (error) {
      log('エフェクト追加エラー:', error);
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [addEffect, selectEffect, transitionTo]);

  // エフェクト削除時の処理
  const handleEffectDelete = useCallback(async (id: string) => {
    try {
      await removeEffect(id);
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [removeEffect, transitionTo]);

  // エフェクト移動時の処理
  const handleEffectMove = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await moveEffect(sourceId, targetId);
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [moveEffect, transitionTo]);

  // エフェクト設定の更新
  const handleEffectUpdate = useCallback((id: string, newConfig: Partial<EffectConfig>) => {
    try {
      updateEffect(id, newConfig);
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [updateEffect, transitionTo]);

  // オーディオアップローダーのコールバック
  const handleAudioFileSelect = useCallback(async (file: File) => {
    try {
      await loadAudio(file);
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [loadAudio, transitionTo]);

  // 選択中のエフェクトを取得
  const selectedEffect = useMemo(() => {
    return effectState.selectedEffect;
  }, [effectState.selectedEffect]);

  // エクスポート設定の更新
  const handleVideoSettingsUpdate = useCallback(async (settings: VideoSettings) => {
    if (projectState.currentProject) {
      try {
        // プロジェクトの設定を更新
        const updatedProject = {
          ...projectState.currentProject,
          videoSettings: settings
        };
        // プロジェクトの状態を更新
        dispatch({
          type: 'SET_PROJECT',
          payload: {
            currentProject: updatedProject
          }
        });
        // プロジェクトを保存
        await saveProject();
      } catch (error) {
        transitionTo({ type: 'error', error: error as Error });
      }
    }
  }, [projectState.currentProject, dispatch, transitionTo, saveProject]);

  const onVolumeChange = useCallback((volume: number) => {
    dispatch({
      type: 'SET_AUDIO',
      payload: { volume }
    });
  }, [dispatch]);

  const onLoopChange = useCallback((loop: boolean) => {
    dispatch({
      type: 'SET_AUDIO',
      payload: { loop }
    });
  }, [dispatch]);

  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <div className="app">
        <Container>
          <Section>
            <Flex direction="column" gap="4">
              {phase.type === 'idle' ? (
                <Card className="upload-section">
                  <AudioUploader
                    onFileSelect={handleAudioFileSelect}
                    onError={(error: Error) => transitionTo({ type: 'error', error })}
                  />
                </Card>
              ) : (
                <Box className="main-content">
                  <Card className="preview-section">
                    <PreviewCanvas
                      width={1280}
                      height={720}
                      onRendererInit={handleRendererInit}
                    />
                    <Box className="controls-section">
                      <PlaybackControls
                        currentTime={audioState.currentTime}
                        duration={audioState.duration}
                        isPlaying={audioState.isPlaying}
                        onPlay={playAudio}
                        onPause={pauseAudio}
                        onSeek={seekAudio}
                        volume={audioState.volume}
                        onVolumeChange={onVolumeChange}
                        loop={audioState.loop}
                        onLoopChange={onLoopChange}
                      />
                    </Box>
                  </Card>

                  <Box className="right-pane">
                    <Card className="toolbar">
                      <ExportButton
                        manager={manager}
                        onError={(error: Error) => transitionTo({ type: 'error', error })}
                        videoSettings={projectState.currentProject?.videoSettings ?? {
                          width: 1280,
                          height: 720,
                          frameRate: 30,
                          videoBitrate: 5000000,
                          audioBitrate: 128000
                        }}
                        onSettingsChange={handleVideoSettingsUpdate}
                        audioSource={audioState.source}
                        onExportStart={() => {
                          const settings = projectState.currentProject?.videoSettings ?? {
                            width: 1280,
                            height: 720,
                            frameRate: 30,
                            videoBitrate: 5000000,
                            audioBitrate: 128000
                          };
                          startExport(settings);
                        }}
                        onExportComplete={() => console.log('エクスポート完了')}
                        onExportError={(error: Error) => transitionTo({ type: 'error', error })}
                        disabled={phase.type === 'error'}
                      />
                    </Card>

                    <Card className="effects-panel">
                      <Flex direction="column" gap="4">
                        <EffectList
                          effects={effectState.effects}
                          selectedEffectId={selectedEffect?.getId() ?? null}
                          onEffectSelect={(id) => selectEffect(id)}
                          onEffectAdd={handleAddEffect}
                          onEffectRemove={handleEffectDelete}
                          onEffectMove={handleEffectMove}
                          isLoading={phase.type === 'loadingAudio' || phase.type === 'analyzing'}
                          disabled={phase.type === 'error'}
                        />
                        {selectedEffect && (
                          <Box className="effect-settings-container">
                            <EffectSettings
                              effect={selectedEffect}
                              onUpdate={(config) => handleEffectUpdate(selectedEffect.getId(), config)}
                              duration={audioState.duration}
                            />
                          </Box>
                        )}
                      </Flex>
                    </Card>
                  </Box>
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