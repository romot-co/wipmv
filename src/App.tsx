import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
} from './core/types/effect';
import { AudioSource, VideoSettings } from './core/types/base';
import { ProjectData } from './core/types/state';

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
    dispatch
  } = useApp();

  // エフェクトマネージャー
  const manager = useMemo(() => {
    console.log('App: EffectManager初期化');
    return new EffectManager();
  }, []);

  // エフェクトマネージャーの初期化
  useEffect(() => {
    if (!manager || !effectState.effects.length) return;

    console.log('App: 既存エフェクトの復元開始');
    effectState.effects.forEach((effect: EffectBase<EffectConfig>) => {
      manager.addEffect(effect);
    });
    console.log('App: 既存エフェクトの復元完了');
  }, [manager, effectState.effects]);

  // エフェクト追加
  const handleAddEffect = useCallback(async (type: EffectType) => {
    try {
      // エフェクトを作成
      const effect = createEffectByType(type);
      
      // エフェクトを追加
      await addEffect(effect);
      
      // 選択状態にする
      selectEffect(effect.getId());
    } catch (error) {
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
              <Card className="upload-section">
                <AudioUploader
                  onFileSelect={handleAudioFileSelect}
                  onError={(error: Error) => transitionTo({ type: 'error', error })}
                />
              </Card>

              {phase.type !== 'idle' && (
                <Box className="main-content">
                  <Card className="preview-section">
                    <PreviewCanvas
                      manager={manager}
                      width={projectState.currentProject?.videoSettings.width ?? 1280}
                      height={projectState.currentProject?.videoSettings.height ?? 720}
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

                  <Card className="export-section">
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