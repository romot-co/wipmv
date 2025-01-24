import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useProject } from './hooks/useProject';
import { EffectManager } from './core/EffectManager';
import { EffectBase } from './core/EffectBase';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { 
  EffectType,
  AudioSource,
  EffectConfig,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
  VideoSettings,
  ProjectData
} from './core/types';

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

export const App: React.FC = () => {
  const { handleError } = useApp();
  const [effects, setEffects] = useState<EffectBase<EffectConfig>[]>([]);
  const [selectedEffectIndex, setSelectedEffectIndex] = useState<number | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);

  // エフェクトマネージャー
  const manager = useMemo(() => new EffectManager(), []);
  
  // オーディオ再生サービス
  const audioService = useMemo(() => AudioPlaybackService.getInstance(), []);

  // プロジェクト管理
  const {
    state,
    createProject,
    saveProject,
    deleteProject: deleteProjectEffect,
    moveEffect: moveProjectEffect,
    addEffect: addProjectEffect,
    updateEffect: updateProjectEffect,
    updateVideoSettings
  } = useProject() as {
    state: { currentProject: ProjectData | null; isLoading: boolean };
    createProject: (name: string, videoSettings: VideoSettings) => Promise<ProjectData>;
    saveProject: () => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    moveEffect: (fromId: string, toId: string) => Promise<void>;
    addEffect: (effect: EffectConfig) => Promise<void>;
    updateEffect: (id: string, config: Partial<EffectConfig>) => Promise<void>;
    updateVideoSettings: (settings: VideoSettings) => Promise<void>;
  };

  // オーディオ制御
  const audioControl = useAudioControl(audioService);

  // 動画設定
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    width: 1280,
    height: 720,
    frameRate: 30,
    videoBitrate: 5000000,
    audioBitrate: 128000
  });

  // エフェクトの変更を自動保存
  useEffect(() => {
    if (state.currentProject && effects.length > 0) {
      saveProject().catch(error => {
        handleError('project', error instanceof Error ? error : new Error('プロジェクトの保存に失敗しました'));
      });
    }
  }, [effects, state.currentProject, saveProject, handleError]);

  // 動画設定の変更を同期
  useEffect(() => {
    if (state.currentProject) {
      updateVideoSettings(videoSettings).catch(error => {
        handleError('project', error instanceof Error ? error : new Error('動画設定の更新に失敗しました'));
      });
    }
  }, [videoSettings, state.currentProject]);

  // エフェクトの変更を同期
  useEffect(() => {
    if (state.currentProject && effects.length > 0) {
      effects.forEach((effect) => {
        updateProjectEffect(effect.getId(), effect.getConfig()).catch(error => {
          handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
        });
      });
    }
  }, [effects, state.currentProject]);

  // エフェクト設定の更新
  const handleEffectUpdate = useCallback(<T extends EffectConfig>(id: string, newConfig: Partial<T>) => {
    if (!manager || !state.currentProject) return;
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

        // プロジェクトの更新
        updateProjectEffect(id, effect.getConfig()).catch(error => {
          handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
        });
      }
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
    }
  }, [manager, state.currentProject, updateProjectEffect, handleError]);

  // 動画設定の更新
  const handleVideoSettingsUpdate = useCallback((newSettings: VideoSettings) => {
    setVideoSettings(newSettings);
    if (state.currentProject) {
      updateVideoSettings(newSettings).catch(error => {
        handleError('project', error instanceof Error ? error : new Error('動画設定の更新に失敗しました'));
      });
    }
  }, [state.currentProject, updateVideoSettings, handleError]);

  // エフェクト追加
  const handleAddEffect = useCallback(async (type: EffectType) => {
    try {
      if (!state.currentProject || state.isLoading) {
        throw new Error('プロジェクトの初期化が完了していません');
      }

      // エフェクトを作成
      const effect = createEffectByType(type, {});
      
      // 音声ソースを設定
      if (audioSource && hasSetAudioSource(effect)) {
        effect.setAudioSource(audioSource);
      }

      // マネージャーに追加
      manager.addEffect(effect);
      
      // プロジェクトにも追加
      await addProjectEffect(effect.getConfig());
      
      // 状態を更新
      setEffects(prev => [...prev, effect]);
      
      // 選択状態にする
      setSelectedEffectIndex(effects.length);

      // プロジェクトの保存
      await saveProject();
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [manager, audioSource, addProjectEffect, state.currentProject, effects, state.isLoading, saveProject]);

  // エフェクト削除時の処理を修正
  const handleEffectDelete = useCallback(async (id: string) => {
    if (!manager) return;

    const index = effects.findIndex(e => e.getId() === id);
    if (index === -1) return;

    try {
      manager.removeEffect(id);
      setEffects(prev => prev.filter(e => e.getId() !== id));

      // プロジェクトからも削除
      await deleteProjectEffect(id);
      await saveProject();
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの削除に失敗しました'));
    }
  }, [manager, effects, deleteProjectEffect, saveProject, handleError]);

  // エフェクト移動時の処理を修正
  const handleEffectMove = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (!manager) return;

    try {
      const currentEffects = [...effects];
      const currentIndex = currentEffects.findIndex(e => e.getId() === id);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(currentEffects.length - 1, currentIndex + 1);

      if (currentIndex === newIndex) return;

      // 配列内で要素を移動
      const [movedEffect] = currentEffects.splice(currentIndex, 1);
      currentEffects.splice(newIndex, 0, movedEffect);

      // zIndexを更新
      currentEffects.forEach((effect, index) => {
        effect.updateConfig({ zIndex: index });
      });

      setEffects(currentEffects);
      
      // プロジェクトの順序も更新
      const targetId = currentEffects[newIndex].getId();
      await moveProjectEffect(id, targetId);
      await saveProject();
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの移動に失敗しました'));
    }
  }, [manager, effects, moveProjectEffect, saveProject, handleError]);

  // 選択中のエフェクトを取得
  const selectedEffect = useMemo(() => {
    if (selectedEffectIndex === null || selectedEffectIndex >= effects.length) return null;
    return effects[selectedEffectIndex];
  }, [selectedEffectIndex, effects]);

  // プレビューキャンバスのマネージャー初期化
  const handleManagerInit = useCallback((manager: EffectManager) => {
    console.log('App: マネージャー初期化開始');
    manager.setAudioService(audioService);
    
    // 既存のエフェクトを復元
    if (effects.length > 0) {
      console.log('App: 既存エフェクトの復元開始');
      effects.forEach(effect => {
        manager.addEffect(effect);
      });
      console.log('App: 既存エフェクトの復元完了');
    }
    
    console.log('App: マネージャー初期化完了');
  }, [audioService, effects]);

  // オーディオアップローダーのコールバック
  const handleAudioFileSelect = useCallback(async (file: File) => {
    console.log('オーディオファイル選択:', { fileName: file.name, fileSize: file.size });
    try {
      const buffer = await file.arrayBuffer();
      console.log('オーディオバッファー取得完了:', { bufferSize: buffer.byteLength });

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(buffer);
      console.log('オーディオデコード完了:', { 
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels 
      });

      const source: AudioSource = {
        file,
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      };

      // AudioSourceの設定
      console.log('AudioSource設定開始');
      setAudioSource(source);
      await audioService.setAudioSource(source);
      console.log('AudioSource設定完了');

      // プロジェクトの初期化
      if (!state.currentProject && !state.isLoading) {
        try {
          console.log('プロジェクト新規作成開始');
          const project = await createProject('新規プロジェクト', videoSettings);
          console.log('プロジェクト新規作成完了:', project);

          // プロジェクトの作成が完了するまで待機
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 設定を更新
          setVideoSettings(project.videoSettings);
          console.log('ビデオ設定更新完了');

          // プロジェクトの状態が更新されるまで待機
          const checkProjectCreation = async (createdProject: ProjectData) => {
            for (let i = 0; i < 10; i++) {
              const currentState = state.currentProject;
              if (currentState?.id === createdProject.id) {
                console.log('プロジェクト初期化完了:', { currentProject: currentState });
                return true;
              }
              console.log('プロジェクト初期化待機中...', { retryCount: i + 1, projectId: createdProject.id });
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            return false;
          };

          const isProjectCreated = await checkProjectCreation(project);
          if (!isProjectCreated) {
            throw new Error('プロジェクトの初期化がタイムアウトしました');
          }

          // プロジェクトの初期化が完了したことを確認
          if (!state.currentProject) {
            throw new Error('プロジェクトの初期化に失敗しました');
          }

          console.log('プロジェクト初期化完了確認済み:', { currentProject: state.currentProject });
        } catch (error) {
          console.error('プロジェクト作成エラー:', error);
          throw error;
        }
      } else if (state.currentProject) {
        console.log('既存プロジェクト更新開始');
        setVideoSettings({
          width: state.currentProject.videoSettings.width || 1280,
          height: state.currentProject.videoSettings.height || 720,
          frameRate: state.currentProject.videoSettings.frameRate || 30,
          videoBitrate: state.currentProject.videoSettings.videoBitrate || 5000000,
          audioBitrate: state.currentProject.videoSettings.audioBitrate || 128000
        });

        if (state.currentProject.effects.length > 0) {
          console.log('エフェクト復元開始:', { effectsCount: state.currentProject.effects.length });
          const restoredEffects = state.currentProject.effects.map(config => {
            const effect = createEffectFromConfig(config);
            if (hasSetAudioSource(effect)) {
              effect.setAudioSource(source);
            }
            return effect;
          });
          setEffects(restoredEffects);
          console.log('エフェクト復元完了');
        }
        console.log('既存プロジェクト更新完了');
      }
    } catch (error) {
      console.error('オーディオファイル処理エラー:', error);
      handleError('audio', error instanceof Error ? error : new Error('音声ファイルの読み込みに失敗しました'));
    }
  }, [audioService, state.currentProject, state.isLoading, createProject, videoSettings, handleError]);

  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <div className="app">
        <Container>
          <Section>
            <Flex direction="column" gap="4">
              <Card className="upload-section">
                <AudioUploader
                  onFileSelect={handleAudioFileSelect}
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
                        currentTime={audioControl.state.currentTime}
                        duration={audioControl.state.duration}
                        isPlaying={audioControl.state.isPlaying}
                        onPlay={audioControl.play}
                        onPause={audioControl.pause}
                        onSeek={audioControl.seek}
                        volume={audioControl.state.volume}
                        onVolumeChange={audioControl.setVolume}
                        loop={audioControl.state.loop}
                        onLoopChange={audioControl.setLoop}
                      />
                    </Box>
                  </Card>

                  <Card className="effects-panel">
                    <Flex direction="column" gap="4">
                      <EffectList
                        effects={effects}
                        selectedEffectId={selectedEffect?.getId()}
                        onEffectSelect={(id) => {
                          const index = effects.findIndex(e => e.getId() === id);
                          setSelectedEffectIndex(index);
                        }}
                        onEffectAdd={handleAddEffect}
                        onEffectRemove={handleEffectDelete}
                        onEffectMove={handleEffectMove}
                        isLoading={state.isLoading}
                        disabled={!state.currentProject}
                      />
                      {selectedEffect && (
                        <Box className="effect-settings-container">
                          <EffectSettings
                            effect={selectedEffect}
                            onUpdate={(config) => handleEffectUpdate(selectedEffect.getId(), config)}
                            duration={audioControl.state.duration}
                          />
                        </Box>
                      )}
                    </Flex>
                  </Card>

                  <Card className="export-section">
                    <ExportButton
                      manager={manager}
                      onError={(error) => handleError('export', error)}
                      videoSettings={videoSettings}
                      onSettingsChange={handleVideoSettingsUpdate}
                      audioSource={audioSource}
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

// ヘルパー関数: 設定からエフェクトを作成
function createEffectFromConfig(config: EffectConfig): EffectBase<EffectConfig> {
  const defaultPosition = { x: 0, y: 0 };
  const defaultSize = { width: 100, height: 100 };

  switch (config.type) {
    case EffectType.Background:
      return new BackgroundEffect({
        ...config,
        position: config.position || defaultPosition,
        size: config.size || defaultSize,
        coordinateSystem: config.coordinateSystem || 'relative'
      } as BackgroundEffectConfig);
    case EffectType.Text:
      return new TextEffect({
        ...config,
        position: config.position || defaultPosition,
        size: config.size || defaultSize,
        coordinateSystem: config.coordinateSystem || 'relative'
      } as TextEffectConfig);
    case EffectType.Waveform:
      return new WaveformEffect({
        ...config,
        position: config.position || defaultPosition,
        size: config.size || defaultSize,
        coordinateSystem: config.coordinateSystem || 'relative'
      } as WaveformEffectConfig);
    case EffectType.Watermark:
      return new WatermarkEffect({
        ...config,
        position: config.position || defaultPosition,
        size: config.size || defaultSize,
        coordinateSystem: config.coordinateSystem || 'relative'
      } as WatermarkEffectConfig);
    default:
      throw new Error(`不正なエフェクトタイプ: ${(config as any).type}`);
  }
}

// ヘルパー関数: タイプと設定からエフェクトを作成
function createEffectByType<T extends EffectConfig>(type: EffectType, defaultConfig: Partial<T>): EffectBase<T> {
  const defaultPosition = { x: 0, y: 0 };
  const defaultSize = { width: 100, height: 100 };

  switch (type) {
    case EffectType.Background:
      return new BackgroundEffect({
        ...createDefaultBackgroundEffect(),
        ...defaultConfig,
        type,
        position: defaultConfig.position || defaultPosition,
        size: defaultConfig.size || defaultSize,
        coordinateSystem: defaultConfig.coordinateSystem || 'relative'
      }) as unknown as EffectBase<T>;
    case EffectType.Text:
      return new TextEffect({
        ...createDefaultTextEffect(),
        ...defaultConfig,
        type,
        position: defaultConfig.position || defaultPosition,
        size: defaultConfig.size || defaultSize,
        coordinateSystem: defaultConfig.coordinateSystem || 'relative'
      }) as unknown as EffectBase<T>;
    case EffectType.Waveform:
      return new WaveformEffect({
        ...createDefaultWaveformEffect(),
        ...defaultConfig,
        type,
        position: defaultConfig.position || defaultPosition,
        size: defaultConfig.size || defaultSize,
        coordinateSystem: defaultConfig.coordinateSystem || 'relative'
      }) as unknown as EffectBase<T>;
    case EffectType.Watermark:
      return new WatermarkEffect({
        ...createDefaultWatermarkEffect(),
        ...defaultConfig,
        type,
        position: defaultConfig.position || defaultPosition,
        size: defaultConfig.size || defaultSize,
        coordinateSystem: defaultConfig.coordinateSystem || 'relative'
      }) as unknown as EffectBase<T>;
    default:
      throw new Error(`不正なエフェクトタイプ: ${type}`);
  }
}