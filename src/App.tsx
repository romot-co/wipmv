import React, { useCallback, useMemo, useEffect } from 'react';
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
    dispatch
  } = useApp();

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
    });
    log('App: 既存エフェクトの復元完了');
  }, [manager, effectState.effects, audioState.source]);

  // アニメーションループの設定
  useEffect(() => {
    if (!manager || phase.type === 'idle' || phase.type === 'loadingAudio') return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      try {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // エフェクトの状態を更新
        manager.updateAll(audioState.currentTime);

        // 次のフレームをリクエスト（エフェクトの更新後に設定）
        animationFrameId = requestAnimationFrame(() => {
          // エフェクトを描画（次のフレームで実行）
          manager.renderAll(audioState.currentTime);
          // 次のアニメーションフレームを予約
          animationFrameId = requestAnimationFrame(animate);
        });
      } catch (error) {
        console.error('アニメーションループエラー:', error);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };

    // アニメーションを開始
    console.log('アニメーションループ開始');
    animationFrameId = requestAnimationFrame(animate);

    // クリーンアップ
    return () => {
      console.log('アニメーションループ停止');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [manager, phase.type, audioState.currentTime]);

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