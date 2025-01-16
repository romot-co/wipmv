import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Container, Flex, Box, Card, Button, Text, Section } from '@radix-ui/themes';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { ExportButton } from './ui/ExportButton';
import { AudioUploader } from './ui/AudioUploader';
import { useAudioControl } from './hooks/useAudioControl';

import { 
  EffectConfig, 
  EffectType,
  AudioSource,
  ProjectData
} from './core/types';

import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { AudioAnalyzerService } from './core/AudioAnalyzerService';
import { EffectBase } from './core/EffectBase';
import { ProjectService } from './core/ProjectService';
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
  // アプリケーション状態
  type AppState = 'initial' | 'ready' | 'error';
  const [appState, setAppState] = useState<AppState>('initial');

  // エラー集約
  const [errors, setErrors] = useState<{
    audio?: Error;
    effect?: Error;
    export?: Error;
  }>({});

  // エラーハンドリング
  const handleError = useCallback((type: keyof typeof errors, error: Error) => {
    console.error(`${type}エラー:`, error);
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
    setAppState('error');
  }, []);

  // 状態遷移
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
  const [audioService] = useState(() => AudioPlaybackService.getInstance());

  // 事前解析データを保持
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);

  const [manager, setManager] = useState<EffectManager | null>(null);
  const [effects, setEffects] = useState<EffectBase[]>([]);

  // ProjectServiceの初期化
  useEffect(() => {
    const initializeProjectService = async () => {
      try {
        await ProjectService.getInstance().initialize();
      } catch (error) {
        handleError('effect', error instanceof Error ? error : new Error('プロジェクトサービスの初期化に失敗しました'));
      }
    };
    initializeProjectService();
  }, [handleError]);

  // EffectManager初期化時に呼ばれる
  const handleManagerInit = useCallback((newManager: EffectManager) => {
    console.log('EffectManager初期化:', newManager);
    setManager(newManager);

    // AudioServiceを接続して描画ループ開始
    newManager.connectAudioService(audioService);
    newManager.startRenderLoop();
  }, [audioService]);

  // オーディオ制御フック (UI操作用)
  const {
    state: { currentTime, duration, isPlaying },
    play,
    pause,
    seek,
  } = useAudioControl(audioService);

  // エフェクト追加
  const handleEffectAdd = useCallback((type: EffectType) => {
    if (!manager) return;
    try {
      const zIndex = manager.getEffects().length;
      let effect: EffectBase;
      const currentDuration = duration || 0;

      switch (type) {
        case EffectType.Background:
          effect = new BackgroundEffect({
            ...createDefaultBackgroundEffect(),
            zIndex,
            startTime: 0,
            endTime: currentDuration
          });
          break;
        case EffectType.Text:
          effect = new TextEffect({
            ...createDefaultTextEffect(),
            zIndex,
            startTime: 0,
            endTime: currentDuration
          });
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect({
            ...createDefaultWaveformEffect(),
            zIndex,
            startTime: 0,
            endTime: currentDuration
          });
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect({
            ...createDefaultWatermarkEffect(),
            zIndex,
            startTime: 0,
            endTime: currentDuration
          });
          break;
      }

      // エフェクト追加時に事前解析データを設定
      if (audioSource && hasSetAudioSource(effect)) {
        effect.setAudioSource(audioSource);
      }

      manager.addEffect(effect);
      setEffects(manager.getEffects());
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [manager, handleError, duration, audioSource]);

  // オーディオファイルのロード処理
  const handleAudioLoad = useCallback(async (file: File) => {
    try {
      console.log('オーディオロード＆解析を開始...');

      // AudioPlaybackService でファイルを読み込み＆decode
      await audioService.loadAudio(file);

      // decode済みのAudioSourceを取得(まだAnalyzerは走っていない状態)
      const loadedSource = audioService.getAudioSource();
      if (!loadedSource?.buffer) {
        throw new Error('AudioBufferが正しくロードされませんでした。');
      }

      // オフライン解析する場合は、AudioAnalyzerServiceにAudioBufferを渡す
      const analyzer = AudioAnalyzerService.getInstance();
      const analysisResult = await analyzer.analyzeAudio(loadedSource);

      // WaveformEffectなどに使う解析データをstateに保持
      setAudioSource(analysisResult);

      // AudioPlaybackServiceにも解析済みsourceを再設定する場合はここで呼ぶ
      // （必要なければスキップしてもよい）
      await audioService.setAudioSource(analysisResult);

      // エラークリア＆状態遷移
      clearError('audio');
      transition('ready');

      // 新規プロジェクト生成など既存処理
      const projectService = ProjectService.getInstance();
      const projectData = await projectService.createProject('New Project');
      if (manager) {
        // videoSettingsやエフェクトの初期化
        const newSettings = {
          width: projectData.videoSettings.width,
          height: projectData.videoSettings.height,
          frameRate: projectData.videoSettings.fps,
          videoBitrate: projectData.videoSettings.bitrate,
          audioBitrate: 128000
        };
        setVideoSettings(newSettings);

        // 画面にあったDefaultEffectの追加
        manager.getEffects().forEach(effect => {
          manager.removeEffect(effect.getConfig().id);
        });
        handleEffectAdd(EffectType.Background);
        handleEffectAdd(EffectType.Waveform);
        setEffects(manager.getEffects());
      }
    } catch (error) {
      handleError(
        'audio',
        error instanceof Error ? error : new Error('オーディオ読み込みに失敗しました')
      );
    }
  }, [audioService, manager, handleEffectAdd, handleError, clearError, transition, setVideoSettings]);

  // エフェクト削除
  const handleEffectRemove = useCallback((id: string) => {
    if (!manager) return;
    manager.removeEffect(id);
    setEffects(manager.getEffects());
    if (selectedEffectId === id) {
      setSelectedEffectId(undefined);
    }
  }, [manager, selectedEffectId]);

  // エフェクトの上下移動
  const handleEffectMove = useCallback((id: string, direction: 'up' | 'down') => {
    if (!manager) return;
    if (direction === 'up') {
      manager.moveEffectUp(id);
    } else {
      manager.moveEffectDown(id);
    }
    setEffects(manager.getEffects());
  }, [manager]);

  // エフェクト設定の更新
  const handleEffectUpdate = useCallback((config: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;
    manager.updateEffect(selectedEffectId, config);
    setEffects(manager.getEffects());
  }, [manager, selectedEffectId]);

  // 選択中エフェクト
  const selectedEffect = useMemo(() => {
    if (!selectedEffectId || !manager) return undefined;
    return manager.getEffects().find(e => e.getConfig().id === selectedEffectId);
  }, [selectedEffectId, manager]);

  // プロジェクト保存
  const saveProject = useCallback(() => {
    if (!manager) return;
    try {
      const audioSource = audioService.getAudioSource();
      const projectData: ProjectData = {
        version: '1.0.0',
        id: crypto.randomUUID(),
        name: 'Untitled Project',
        createdAt: new Date(),
        updatedAt: new Date(),
        videoSettings: {
          width: videoSettings.width,
          height: videoSettings.height,
          fps: videoSettings.frameRate,
          bitrate: videoSettings.videoBitrate
        },
        effects: manager.getEffects().map(effect => effect.getConfig()),
        audioInfo: audioSource
          ? {
              fileName: 'audio.mp3',
              duration: audioSource.duration,
              sampleRate: audioSource.sampleRate,
              numberOfChannels: audioSource.numberOfChannels
            }
          : undefined
      };
      ProjectService.getInstance().saveProject(projectData);
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('プロジェクトの保存に失敗しました'));
    }
  }, [manager, videoSettings, audioService, handleError]);

  // PlaybackControls 用
  const playbackProps = useMemo(() => ({
    isPlaying,
    currentTime,
    duration,
    onPlay: async () => await play(),
    onPause: async () => pause(),
    onSeek: seek
  }), [isPlaying, currentTime, duration, play, pause, seek]);

  // PreviewCanvas 用
  const previewProps = useMemo(() => ({
    isPlaying,
    onManagerInit: handleManagerInit,  // PreviewCanvas内でEffectManager作成時に呼ぶ
    onError: (error: Error) => handleError('effect', error),
    videoSettings
  }), [isPlaying, handleManagerInit, handleError, videoSettings]);

  // エラー表示コンポーネント
  const ErrorMessage: React.FC<{
    type: keyof typeof errors;
    error: Error;
  }> = ({ type, error }) => (
    <Card className="error-section">
      <Flex direction="column" gap="3" p="3">
        <Text color="red" size="2" weight="medium">{error.message}</Text>
        <Button onClick={() => clearError(type)} variant="soft" color="gray">
          再試行
        </Button>
      </Flex>
    </Card>
  );

  return (
    <Container className="app">
      {appState === 'initial' ? (
        <Flex className="app--empty">
          <Container size="2">
            <Flex direction="column" gap="4" align="center">
              <Section size="2">
                <AudioUploader
                  onFileSelect={handleAudioLoad}
                  onError={(error) => handleError('audio', error)}
                />
              </Section>
              {errors.audio && <ErrorMessage type="audio" error={errors.audio} />}
            </Flex>
          </Container>
        </Flex>
      ) : appState === 'error' ? (
        <Flex className="app--error">
          <Container size="2">
            <Flex direction="column" gap="4">
              {Object.entries(errors).map(([type, error]) => (
                <ErrorMessage
                  key={type}
                  type={type as keyof typeof errors}
                  error={error}
                />
              ))}
            </Flex>
          </Container>
        </Flex>
      ) : (
        <>
          <Flex className="main-content">
            <Section className="preview-section" size="3">
              {/* PreviewCanvasコンポーネントがEffectManagerを初期化し、handleManagerInitを呼ぶ */}
              <PreviewCanvas {...previewProps} />
              <Card className="controls-section">
                <PlaybackControls {...playbackProps} />
                <Flex gap="2">
                  {/* Export処理 */}
                  {audioService.getAudioSource() && (
                    <ExportButton
                      manager={manager}
                      onError={(error) => handleError('export', error)}
                      onProgress={handleExportProgress}
                      videoSettings={videoSettings}
                      onSettingsChange={setVideoSettings}
                      audioSource={audioService.getAudioSource()!}
                    />
                  )}
                  {/* プロジェクト保存 */}
                  <Button
                    variant="surface"
                    color="gray"
                    onClick={saveProject}
                  >
                    プロジェクトを保存
                  </Button>
                </Flex>
                {exportProgress > 0 && (
                  <Text size="2" color="gray">
                    エクスポート進捗: {Math.round(exportProgress)}%
                  </Text>
                )}
              </Card>
            </Section>

            {/* エフェクト管理 UI */}
            <Box className="effects-panel">
              <Card className="effects-section">
                <Box className="effect-list">
                  <EffectList
                    effects={effects}
                    selectedEffectId={selectedEffectId}
                    onEffectSelect={setSelectedEffectId}
                    onEffectRemove={handleEffectRemove}
                    onEffectMove={handleEffectMove}
                    onEffectAdd={handleEffectAdd}
                  />
                </Box>
                {selectedEffect && (
                  <Box className="effect-settings">
                    <EffectSettings
                      effect={selectedEffect}
                      onUpdate={handleEffectUpdate}
                      duration={duration || 0}
                    />
                  </Box>
                )}
              </Card>
            </Box>
          </Flex>
        </>
      )}
    </Container>
  );
};

export default App;