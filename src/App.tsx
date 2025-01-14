import React, { useState, useCallback, useMemo } from 'react';
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
  BaseEffectConfig,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig
} from './core/types';

import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { EffectBase } from './core/EffectBase';
import { ProjectService } from './core/ProjectService';
import { BackgroundEffect } from './features/background/BackgroundEffect';
import { TextEffect } from './features/text/TextEffect';
import { WaveformEffect } from './features/waveform/WaveformEffect';
import { WatermarkEffect } from './features/watermark/WatermarkEffect';
import { createDefaultEffects } from './core/DefaultEffectService';
import './App.css';

export const App: React.FC = () => {
  // アプリケーション状態
  type AppState = 'initial' | 'ready' | 'error';
  const [appState, setAppState] = useState<AppState>('initial');

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

  // エラー集約
  const [errors, setErrors] = useState<{
    audio?: Error;
    effect?: Error;
    export?: Error;
  }>({});

  const [selectedEffectId, setSelectedEffectId] = useState<string>();

  // **AudioPlaybackService**をシングルトン的に保持
  const [audioService] = useState(() => new AudioPlaybackService());

  const [manager, setManager] = useState<EffectManager | null>(null);
  const [effects, setEffects] = useState<EffectBase[]>([]);

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
            id: `background-${Date.now()}`,
            type: EffectType.Background,
            backgroundType: 'color',
            color: '#000000',
            zIndex,
            visible: true,
            startTime: 0,
            endTime: currentDuration
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
            visible: true,
            startTime: 0,
            endTime: currentDuration
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
            options: {
              style: 'bar',
              analysisMode: 'realtime',
              barWidth: 2,
              barSpacing: 1,
              smoothing: 0.5,
              segmentCount: 128
            },
            zIndex,
            visible: true,
            startTime: 0,
            endTime: currentDuration
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
            visible: true,
            startTime: 0,
            endTime: currentDuration
          });
          break;
      }

      manager.addEffect(effect);
      setEffects(manager.getEffects());
    } catch (error) {
      handleError('effect', error instanceof Error ? error : new Error('エフェクトの追加に失敗しました'));
    }
  }, [manager, handleError, duration]);

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

  // デフォルトエフェクトの作成
  const handleDefaultEffects = useCallback((duration: number) => {
    if (!manager) return;

    const defaultConfigs = createDefaultEffects(duration);
    defaultConfigs.forEach((config: BaseEffectConfig & { type: EffectType }) => {
      let effect: EffectBase;
      switch (config.type) {
        case EffectType.Background:
          effect = new BackgroundEffect(config as BackgroundEffectConfig);
          break;
        case EffectType.Text:
          effect = new TextEffect(config as TextEffectConfig);
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect(config as WaveformEffectConfig);
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect(config as WatermarkEffectConfig);
          break;
        default:
          throw new Error(`Unknown effect type: ${config.type}`);
      }
      manager.addEffect(effect);
    });

    setEffects(manager.getEffects());
  }, [manager]);

  // オーディオロード時
  const handleAudioLoad = useCallback(() => {
    clearError('audio');
    transition('ready');

    // プロジェクトデータの読み込み
    const projectData = ProjectService.loadProject();
    if (projectData && manager) {
      // 設定復元
      setVideoSettings(projectData.videoSettings);

      // 既存エフェクトをクリア
      manager.getEffects().forEach(effect => {
        manager.removeEffect(effect.getConfig().id);
      });

      // プロジェクトデータから復元
      projectData.effects.forEach((effectConfig: BaseEffectConfig & { type: EffectType }) => {
        let effect: EffectBase;
        switch (effectConfig.type) {
          case EffectType.Background:
            effect = new BackgroundEffect(effectConfig as BackgroundEffectConfig);
            break;
          case EffectType.Text:
            effect = new TextEffect(effectConfig as TextEffectConfig);
            break;
          case EffectType.Waveform:
            effect = new WaveformEffect(effectConfig as WaveformEffectConfig);
            break;
          case EffectType.Watermark:
            effect = new WatermarkEffect(effectConfig as WatermarkEffectConfig);
            break;
        }
        manager.addEffect(effect);
      });
    } else if (manager) {
      // プロジェクトデータがない場合はデフォルトエフェクトを作成
      const audioBuffer = audioService.getAudioBuffer();
      if (audioBuffer) {
        handleDefaultEffects(audioBuffer.duration);
      }
    }

    // エフェクトリスト更新
    if (manager) {
      setEffects(manager.getEffects());
    }
  }, [clearError, transition, manager, audioService, handleDefaultEffects, setVideoSettings]);

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

  // AudioSourceの取得 (analyser)
  const analyser = audioService.getAnalyserNode();

  // プロジェクト保存
  const saveProject = useCallback(() => {
    if (!manager) return;
    try {
      const audioBuffer = audioService.getAudioBuffer();
      ProjectService.saveProject({
        videoSettings,
        effects: manager.getEffects().map(effect => effect.getConfig()),
        audioInfo: audioBuffer
          ? {
              fileName: 'audio.mp3', // TODO: 実際のファイル名を保持
              duration: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate,
              numberOfChannels: audioBuffer.numberOfChannels
            }
          : undefined
      });
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

  return (
    <Container className="app">
      {appState === 'initial' ? (
        <Flex className="app--empty">
          <Container size="2">
            <Flex direction="column" gap="4" align="center">
              <Section size="2">
                <AudioUploader
                  audioService={audioService}
                  onAudioLoad={handleAudioLoad}
                  onError={(error) => handleError('audio', error)}
                />
              </Section>
              {errors.audio && <ErrorMessage type="audio" error={errors.audio} />}
              {!analyser && (
                <Text size="2" color="gray">
                  オーディオ解析を準備中...
                </Text>
              )}
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
                  <ExportButton
                    audioBuffer={audioService.getAudioBuffer()!}
                    manager={manager}
                    onError={(error) => handleError('export', error)}
                    onProgress={handleExportProgress}
                    videoSettings={videoSettings}
                    onSettingsChange={setVideoSettings}
                  />
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