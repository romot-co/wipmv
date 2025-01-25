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

  // エフェクトマネージャー
  const manager = useMemo(() => {
    log('App: EffectManager初期化');
    return new EffectManager();
  }, []);

  // プレビューキャンバスのレンダラー設定
  const handleRendererInit = useCallback((renderer: Renderer) => {
    log('App: レンダラーを設定');
    manager.setRenderer(renderer);
  }, [manager]);

  // アニメーションループの制御
  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      if (!isLoopRunningRef.current) return;
      
      try {
        // AudioPlaybackServiceから直接currentTimeを取得
        const currentTime = audioState.source ? services.audioService.playback.getCurrentTime() : 0;
        
        // 再生中またはシーク時に更新
        if (manager && manager.getRenderer()) {
          console.log('アニメーションフレーム詳細:', {
            currentTime,
            phase: phase.type,
            isPlaying: audioState.isPlaying,
            hasRenderer: true,
            effectCount: manager.getEffects().length,
            isLoopRunning: isLoopRunningRef.current,
            duration: audioState.duration,
            audioBuffer: !!audioState.source?.buffer,
            bufferDuration: audioState.source?.buffer?.duration
          });

          // 現在時刻でエフェクトを更新
          manager.updateAll(currentTime);
          manager.renderAll(currentTime);
        }
        
        rafId = requestAnimationFrame(animate);
      } catch (error) {
        console.error('アニメーションループエラー:', error);
        isLoopRunningRef.current = false;
      }
    };

    const startLoop = () => {
      if (!isLoopRunningRef.current && manager && manager.getRenderer()) {
        console.log('アニメーションループ開始:', {
          phase: phase.type,
          currentTime: audioState.currentTime,
          isPlaying: audioState.isPlaying,
          hasManager: true,
          hasRenderer: true
        });
        isLoopRunningRef.current = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (isLoopRunningRef.current) {
        console.log('アニメーションループ停止:', {
          phase: phase.type,
          currentTime: audioState.currentTime,
          isPlaying: audioState.isPlaying
        });
        isLoopRunningRef.current = false;
        cancelAnimationFrame(rafId);
      }
    };

    // 再生中またはシーク時にループを開始
    if ((audioState.isPlaying || phase.type === 'playing') && manager && manager.getRenderer()) {
      startLoop();
    } else {
      stopLoop();
    }

    return () => {
      stopLoop();
    };
  }, [manager, phase.type, audioState.isPlaying, audioState.currentTime, audioState.source, services]);

  // audioStateの変更を監視
  useEffect(() => {
    console.log('audioState更新:', {
      currentTime: audioState.currentTime,
      isPlaying: audioState.isPlaying,
      phase: phase.type
    });
  }, [audioState.currentTime, audioState.isPlaying, phase.type]);

  // エフェクトマネージャーの初期化
  useEffect(() => {
    if (!manager || !effectState.effects.length) return;

    log('App: 既存エフェクトの復元開始');
    effectState.effects.forEach((effect: EffectBase<EffectConfig>) => {
      // エフェクトを追加
      manager.addEffect(effect);
      
      // 音声ソースが必要なエフェクトの場合は設定
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

      // 初期描画を実行
      try {
        manager.updateAll(audioState.currentTime);
        manager.renderAll(audioState.currentTime);
      } catch (error) {
        console.error('エフェクト初期描画エラー:', error);
      }
    });
    log('App: 既存エフェクトの復元完了');
  }, [manager, effectState.effects, audioState.source, audioState.currentTime]);

  // エフェクト追加
  const handleAddEffect = useCallback(async (type: EffectType) => {
    try {
      log('エフェクト追加:', type);
      // エフェクトを作成
      const effect = createEffectByType(type);
      
      // エフェクトを追加
      await addEffect(effect);
      
      // 選択状態にする
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