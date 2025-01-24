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
import { useProject, UseProjectResult } from './hooks/useProject';
import { EffectManager } from './core/EffectManager';
import { EffectBase } from './core/EffectBase';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { AudioAnalyzerService } from './core/AudioAnalyzerService';
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
  const { 
    handleError, 
    effectState, 
    addEffect: addContextEffect,
    removeEffect: removeContextEffect,
    updateEffect: updateContextEffect,
    moveEffect: moveContextEffect,
    selectEffect: selectContextEffect
  } = useApp();

  // オーディオ再生サービス
  const audioService = useMemo(() => {
    console.log('App: AudioPlaybackService初期化');
    return AudioPlaybackService.getInstance();
  }, []);
  
  // オーディオ解析サービス
  const analyzerService = useMemo(() => {
    console.log('App: AudioAnalyzerService初期化');
    const service = AudioAnalyzerService.getInstance();
    service.setAudioService(audioService);
    return service;
  }, [audioService]);
  
  // エフェクトマネージャー
  const manager = useMemo(() => {
    console.log('App: EffectManager初期化');
    const manager = new EffectManager();
    manager.setAudioService(audioService);
    return manager;
  }, [audioService]);

  // オーディオ制御
  const audioControl = useAudioControl(audioService);

  // プロジェクト管理
  const {
    state,
    createProject,
    saveProject,
    updateVideoSettings
  } = useProject() as UseProjectResult;

  // 動画設定
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    width: 1280,
    height: 720,
    frameRate: 30,
    videoBitrate: 5000000,
    audioBitrate: 128000
  });

  // エフェクト操作
  const effectOperations = useMemo(() => ({
    // エフェクトの追加
    async addEffectAndSave(effect: EffectBase<EffectConfig>) {
      console.log('エフェクト追加開始');
      
      // エフェクトマネージャーに追加
      manager.addEffect(effect);
      
      // AppContextに追加
      addContextEffect(effect);
      
      // プロジェクトを保存
      await saveProject();
      
      console.log('エフェクト追加完了');
    },

    // エフェクトの削除
    async removeEffectAndSave(id: string) {
      console.log('エフェクト削除開始:', { id });
      
      // エフェクトマネージャーから削除
      manager.removeEffect(id);
      
      // AppContextから削除
      removeContextEffect(id);
      
      // プロジェクトを保存
      await saveProject();
      
      console.log('エフェクト削除完了');
    },

    // エフェクトの移動
    async moveEffectAndSave(sourceId: string, targetId: string) {
      console.log('エフェクト移動開始:', { sourceId, targetId });
      
      // エフェクトマネージャーで移動
      manager.moveEffect(sourceId, targetId);
      
      // AppContextで移動
      moveContextEffect(sourceId, targetId);
      
      // プロジェクトを保存
      await saveProject();
      
      console.log('エフェクト移動完了');
    },

    // エフェクトの更新
    async updateEffectAndSave(id: string, newConfig: Partial<EffectConfig>) {
      console.log('エフェクト更新開始:', { id });
      
      // エフェクトマネージャーで更新
      manager.updateEffectConfig(id, newConfig);
      
      // AppContextで更新
      updateContextEffect(id, newConfig);
      
      // プロジェクトを保存
      await saveProject();
      
      console.log('エフェクト更新完了');
    }
  }), [
    manager,
    effectState.effects,
    addContextEffect,
    removeContextEffect,
    moveContextEffect,
    updateContextEffect,
    saveProject
  ]);

  // エフェクトマネージャーの初期化
  useEffect(() => {
    if (!manager || !effectState.effects.length) return;

    console.log('App: 既存エフェクトの復元開始');
    effectState.effects.forEach(effect => {
      manager.addEffect(effect);
    });
    console.log('App: 既存エフェクトの復元完了');
  }, [manager, effectState.effects]);

  // 動画設定の更新
  const handleVideoSettingsUpdate = useCallback((newSettings: VideoSettings) => {
    setVideoSettings(newSettings);
    if (state.currentProject) {
      // 設定の更新と保存
      updateVideoSettings(newSettings)
        .then(() => saveProject())
        .catch((error: unknown) => {
          handleError('project', error instanceof Error ? error : new Error('動画設定の更新に失敗しました'));
        });
    }
  }, [state.currentProject, updateVideoSettings, saveProject, handleError]);

  // エフェクト追加
  const handleAddEffect = useCallback(async (type: EffectType) => {
    try {
      // エフェクトを作成
      const effect = createEffectByType(type, {});
      
      // エフェクトを追加
      await effectOperations.addEffectAndSave(effect);
      
      // 選択状態にする
      selectContextEffect(effect.getId());
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [effectOperations, selectContextEffect, handleError]);

  // エフェクト削除時の処理
  const handleEffectDelete = useCallback(async (id: string) => {
    if (!manager) return;
    try {
      await effectOperations.removeEffectAndSave(id);
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの削除に失敗しました'));
    }
  }, [manager, effectOperations, handleError]);

  // エフェクト移動時の処理
  const handleEffectMove = useCallback(async (sourceId: string, targetId: string) => {
    if (!manager) return;
    try {
      await effectOperations.moveEffectAndSave(sourceId, targetId);
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの移動に失敗しました'));
    }
  }, [manager, effectOperations, handleError]);

  // エフェクト設定の更新
  const handleEffectUpdate = useCallback(<T extends EffectConfig>(id: string, newConfig: Partial<T>) => {
    if (!manager) return;
    try {
      effectOperations.updateEffectAndSave(id, newConfig).catch(error => {
        handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
      });
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの更新に失敗しました'));
    }
  }, [manager, effectOperations, handleError]);

  // 選択中のエフェクトを取得
  const selectedEffect = useMemo(() => {
    return effectState.selectedEffect;
  }, [effectState.selectedEffect]);

  // オーディオアップローダーのコールバック
  const handleAudioFileSelect = useCallback(async (file: File) => {
    console.log('オーディオファイル選択:', { fileName: file.name, fileSize: file.size });
    try {
      const buffer = await file.arrayBuffer();
      console.log('オーディオバッファー取得完了:', { bufferSize: buffer.byteLength });

      // AudioPlaybackServiceを使用してデコード
      const audioBuffer = await audioService.decodeAudioData(buffer);
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
      if (selectedEffect && hasSetAudioSource(selectedEffect)) {
        selectedEffect.setAudioSource(source);
      }
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
          const restoredEffects = state.currentProject.effects.map((config: EffectConfig) => {
            const effect = createEffectFromConfig(config);
            if (hasSetAudioSource(effect)) {
              effect.setAudioSource(source);
            }
            return effect;
          });
          if (restoredEffects.length > 0) {
            selectContextEffect(restoredEffects[0].getId());
          }
          console.log('エフェクト復元完了');
        }
        console.log('既存プロジェクト更新完了');
      }
    } catch (error) {
      console.error('オーディオファイル処理エラー:', error);
      handleError('audio', error instanceof Error ? error : new Error('音声ファイルの読み込みに失敗しました'));
    }
  }, [audioService, state.currentProject, state.isLoading, createProject, videoSettings, handleError, selectedEffect, effectOperations, selectContextEffect]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    // ブラウザ終了時のクリーンアップ
    const handleBeforeUnload = () => {
      console.log('アプリケーション終了: リソースの解放開始');
      analyzerService.dispose();
      audioService.dispose();
      console.log('アプリケーション終了: リソースの解放完了');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // コンポーネントのアンマウント時のクリーンアップ
    return () => {
      console.log('App.tsxアンマウント: リソースの解放開始');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      analyzerService.dispose();
      audioService.dispose();
      console.log('App.tsxアンマウント: リソースの解放完了');
    };
  }, [analyzerService, audioService]);

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

              {selectedEffect && (
                <Box className="main-content">
                  <Card className="preview-section">
                    <PreviewCanvas
                      manager={manager}
                      width={videoSettings.width}
                      height={videoSettings.height}
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
                        effects={effectState.effects}
                        selectedEffectId={selectedEffect.getId()}
                        onEffectSelect={(id) => {
                          const effect = effectState.effects.find(e => e.getId() === id);
                          selectContextEffect(effect ? effect.getId() : null);
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
                      audioSource={selectedEffect ? selectedEffect.getAudioSource() : null}
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