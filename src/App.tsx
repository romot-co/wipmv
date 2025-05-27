import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { Container, Flex, Box, Card, Section, IconButton, Heading, Text, Tooltip, DropdownMenu } from '@radix-ui/themes';
import { PlusIcon, DownloadIcon } from '@radix-ui/react-icons';
import { PlaybackControls } from './ui/PlaybackControls';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { ExportButton } from './ui/ExportButton';
import { AudioUploader } from './ui/AudioUploader';
import { SettingsPanel } from './ui/SettingsPanel';
import { EffectToolbar } from './ui/EffectToolbar';
import { EffectList } from './ui/EffectList';
import { WelcomeMessage } from './ui/WelcomeMessage';
import { useApp } from './contexts/AppContext';
import { ErrorBoundary, CustomErrorFallback } from './ErrorBoundary';
import { EffectManager } from './core/EffectManager';
import { EffectBase, EffectConfig } from './core/types';
import { 
  EffectType,
} from './core/types/effect';
import { AudioSource, VideoSettings } from './core/types/base';
import debug from 'debug';
import { Renderer } from './core/Renderer';
import { AppError, ErrorType } from './core/types/error';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { Timeline } from './ui/Timeline';
import styled, { createGlobalStyle } from 'styled-components';
import { AppProvider, AppContextType } from './contexts/AppContext';

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

// --- Styled Components --- 
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  background-color: var(--bg-primary);
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const Main = styled.main`
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0; /* Flexboxの高さ問題を解決 */

  @media (max-width: 1024px) {
    min-height: 400px;
  }
`;

const Sidebar = styled.aside`
  width: 280px; /* サイドバーの幅を少し小さく */
  flex-shrink: 0;
  height: 100%;
  border-left: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    width: 100%;
    min-height: 400px;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StyledEffectList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const EffectItem = styled.li`
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-hover);
  }

  &.selected {
    background-color: var(--primary-color);
    font-weight: 500;
  }
`;

const EffectItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
`;

const EffectName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
`;

const EffectActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 16px 12px 8px 12px;
`;

const Logo = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;



const Footer = styled.footer`
  border-top: 1px solid var(--border-color);
  padding: 8px 12px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: var(--bg-secondary);
  min-height: 150px;
  z-index: 10;
`;

const PlaybackControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  width: 100%;
`;

const TimelineContainer = styled.div`
  height: 100px;
  width: 100%;
  position: relative;
  margin-bottom: 12px;
  overflow: visible;
  
  & > div {
    &::-webkit-scrollbar {
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--text-muted);
    }
  }
`;

// ★ GlobalStyle を定義
const GlobalStyle = createGlobalStyle`
  :root {
    /* Light theme colors (for future use) */
    --light-primary-color: #0366d6;
    --light-primary-hover: #0250a4;
    --light-success-color: #20c997;
    --light-warning-color: #fab005;
    --light-danger-color: #e03131;
    --light-text-primary: #2c3e50;
    --light-text-secondary: #64748b;
    --light-text-muted: #94a3b8;
    --light-bg-primary: #ffffff;
    --light-bg-secondary: #fafafa;
    --light-bg-tertiary: #f1f5f9;
    --light-bg-hover: #f9fafb;
    --light-border-color: #f1f5f9;
    --light-border-focus: #90cdf4;
    
    /* Dark theme colors (default) */
    --dark-primary-color: #3b82f6;
    --dark-primary-hover: #60a5fa;
    --dark-success-color: #10b981;
    --dark-warning-color: #f59e0b;
    --dark-danger-color: #ef4444;
    --dark-text-primary: #e5e7eb;
    --dark-text-secondary: #9ca3af;
    --dark-text-muted: #6b7280;
    --dark-bg-primary: #111827;
    --dark-bg-secondary: #1f2937;
    --dark-bg-tertiary: #374151;
    --dark-bg-hover: #2d3748;
    --dark-border-color: #374151;
    --dark-border-focus: #60a5fa;
    
    /* Set default theme to dark */
    --primary-color: var(--dark-primary-color);
    --primary-hover: var(--dark-primary-hover);
    --success-color: var(--dark-success-color);
    --warning-color: var(--dark-warning-color);
    --danger-color: var(--dark-danger-color);
    --text-primary: var(--dark-text-primary);
    --text-secondary: var(--dark-text-secondary);
    --text-muted: var(--dark-text-muted);
    --bg-primary: var(--dark-bg-primary);
    --bg-secondary: var(--dark-bg-secondary);
    --bg-tertiary: var(--dark-bg-tertiary);
    --bg-hover: var(--dark-bg-hover);
    --border-color: var(--dark-border-color);
    --border-focus: var(--dark-border-focus);
  }

  /* Radix UI Theme 変数の上書き */
  :root, .dark-theme, .dark {
    --color-panel-solid: var(--bg-secondary);
    --color-panel-background: var(--bg-secondary);
    --color-background: var(--bg-primary);
    --color-surface: var(--bg-secondary);
    --color-tooltip: var(--bg-tertiary);
    --color-card: var(--bg-secondary);
    --accent-9: var(--primary-color);
    --accent-8: var(--primary-hover);
    --gray-1: var(--text-primary);
    --gray-2: var(--text-secondary);
    --gray-3: var(--text-muted);
    --gray-4: var(--border-color);
    --gray-5: var(--border-focus);
    --gray-6: var(--bg-hover);
    --color-border: var(--border-color);
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  #root {
    width: 100%;
    height: 100%;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  
  button, input, select, textarea {
    font-family: inherit;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 500;
    color: var(--text-primary);
  }

  /* ダイアログやポップオーバーの背景色を修正 */
  [data-radix-popper-content-wrapper], [data-radix-dialog-overlay], [data-radix-dialog-content] {
    background-color: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
  }
`;

function App() {
  const appContext = useApp();
  const {
    phase,
    projectState,
    audioState,
    effectState,
    ui,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    selectEffect,
    deselectEffect, // Will be used in PreviewCanvas onClick
    updateEffect,
    addEffect,
    removeEffect,
    moveEffect,
    saveProject,
    openSettingsPanel, // Used in handleAddEffectClick
    transitionTo, // Used for error handling
    dispatch, // For direct state updates if needed
    managerInstance, // Needed for interactions
    drawingManager // Needed for interactions
  } = appContext;

  const isIdle = phase.type === 'idle';
  const isInteractive = !isIdle && phase.type !== 'loadingAudio' && phase.type !== 'analyzing' && phase.type !== 'error';
  


  const currentTimeRef = useRef(0);
  const isLoopRunningRef = useRef(false);
  const lastStateRef = useRef({ currentTime: 0, isPlaying: false, lastChangeTime: 0 });
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

  // レンダラー初期化コールバック
  const handleRendererInit = useCallback((renderer: Renderer) => {
    if (shouldLog('renderer-init')) {
      log('App: レンダラー初期化コールバック受信');
    }
    drawingManager?.setRenderer(renderer);
  }, [drawingManager]);

  // アニメーションループのために直接AudioPlaybackServiceを取得
  const audioService = useMemo(() => AudioPlaybackService.getInstance(), []);

  // アニメーションループの制御（条件付き再描画）
  useEffect(() => {
    let rafId: number;
    let lastLogTime = 0;
    let lastRenderTime = 0;
    const LOG_INTERVAL = 5000; // ログ出力の間隔を5秒に延長
    const RENDER_INTERVAL_PLAYING = 16; // 再生中: 約60FPS（16ms間隔）
    const RENDER_INTERVAL_PAUSED = 1000; // 停止中: 約1FPS（1000ms間隔）
    
    const animate = () => {
      if (!isLoopRunningRef.current) return;
      
      try {
        // AudioServiceから直接最新の時間と再生状態を取得
        const currentPlaybackTime = audioService.getCurrentTime();
        const playbackState = audioService.getPlaybackState();
        const isCurrentlyPlaying = playbackState.isPlaying;
        const now = performance.now();
        
        // 再生状態に応じてレンダリング間隔を調整
        const currentRenderInterval = isCurrentlyPlaying 
          ? RENDER_INTERVAL_PLAYING 
          : RENDER_INTERVAL_PAUSED;
        
        // 再描画が必要かどうかを判定
        const hasTimeChanged = Math.abs(lastStateRef.current.currentTime - currentPlaybackTime) > 0.001;
        const hasPlayStateChanged = lastStateRef.current.isPlaying !== isCurrentlyPlaying;
        const hasTimeElapsed = (now - lastRenderTime) > currentRenderInterval;
        const isFirstRender = lastRenderTime === 0;
        
        // シンプルな条件：再生中は常にレンダリング、停止中は変化があった時のみ
        const needsRedraw = isCurrentlyPlaying ||          // 再生中は必ずレンダリング
                           isFirstRender ||               // 初回は必ずレンダリング
                           hasPlayStateChanged ||         // 再生状態が変化した場合
                           (hasTimeChanged && hasTimeElapsed); // 停止中で時間変化かつ間隔経過時
        
        // 常にデバッグログを出力（間引きあり）
        if ((now - lastLogTime) > 1000) { // 1秒間隔でログ出力
          console.log('アニメーションループ状況:', {
            isLoopRunning: isLoopRunningRef.current,
            needsRedraw,
            currentTime: currentPlaybackTime,
            audioStateTime: audioState.currentTime,
            isPlaying: isCurrentlyPlaying,
            audioStateIsPlaying: audioState.isPlaying,
            hasRenderer: !!drawingManager?.getRenderer(),
            hasManager: !!managerInstance,
            hasTimeChanged,
            hasPlayStateChanged,
            hasTimeElapsed,
            timeSinceLastRender: now - lastRenderTime
          });
          lastLogTime = now;
        }
<<<<<<< HEAD
=======
        
        if (drawingManager && drawingManager.getRenderer()) {
          const now = performance.now();
          
          // 状態が大きく変化した時のみログを出力
          if ((Math.abs(lastStateRef.current.currentTime - currentPlaybackTime) > 1.0 || 
               lastStateRef.current.isPlaying !== audioState.isPlaying) &&
              now - lastLogTime > LOG_INTERVAL) {
            if (shouldLog('animation-frame')) {
              log('アニメーションフレーム詳細:', {
                currentTime: currentPlaybackTime,
                phase: phase.type,
                isPlaying: audioState.isPlaying,
                hasRenderer: true,
                effectCount: managerInstance.getEffects().length,
                isLoopRunning: isLoopRunningRef.current
              });
            }
            
            lastStateRef.current = {
              currentTime: currentPlaybackTime,
              isPlaying: audioState.isPlaying
            };
            lastLogTime = now;
          }
>>>>>>> 4b34a4e5aa778551329353847f0a002c35789a9f

        
        if (drawingManager && drawingManager.getRenderer() && needsRedraw) {
          // エフェクトの更新と描画を実行
          managerInstance.updateAll(currentPlaybackTime);
          drawingManager.renderAll(currentPlaybackTime, undefined, ui.selectedEffectId);
          lastRenderTime = now;
          
          // レンダリング実行後は常に状態を更新
          lastStateRef.current = {
            currentTime: currentPlaybackTime,
            isPlaying: isCurrentlyPlaying,
            lastChangeTime: now
          };
        }
        
        rafId = requestAnimationFrame(animate);
      } catch (error) {
        console.error('アニメーションループエラー:', error);
        isLoopRunningRef.current = false;
      }
    };

    if (isInteractive && drawingManager && drawingManager.getRenderer() && !isLoopRunningRef.current) {
<<<<<<< HEAD
      console.log('アニメーションループ開始:', {
        phase: phase.type,
        currentTime: audioState.currentTime,
        hasManager: !!managerInstance,
        hasRenderer: true,
        isInteractive,
        hasDrawingManager: !!drawingManager,
        rendererExists: !!drawingManager?.getRenderer()
      });
=======
      if (shouldLog('animation-loop')) {
        log('アニメーションループ開始:', {
          phase: phase.type,
          currentTime: audioState.currentTime,
          hasManager: !!managerInstance,
          hasRenderer: true
        });
      }
>>>>>>> 4b34a4e5aa778551329353847f0a002c35789a9f
      isLoopRunningRef.current = true;
      rafId = requestAnimationFrame(animate);
    } else {
      console.log('アニメーションループ開始条件不足:', {
        isInteractive,
        hasDrawingManager: !!drawingManager,
        hasRenderer: !!drawingManager?.getRenderer(),
        isLoopRunning: isLoopRunningRef.current,
        phase: phase.type
      });
    }

    return () => {
      if (isLoopRunningRef.current) {
        if (shouldLog('animation-loop')) {
          log('アニメーションループ停止');
        }
        isLoopRunningRef.current = false;
        cancelAnimationFrame(rafId);
      }
    };
  }, [managerInstance, drawingManager, isInteractive, ui.selectedEffectId, audioService, effectState.effects]);

  // audioStateの変更を監視（ログ出力を間引く）
  const lastAudioStateLogRef = useRef(0);
  useEffect(() => {
    const now = performance.now();
    if (now - lastAudioStateLogRef.current > 1000) {
      log('audioState更新:', {
        currentTime: audioState.currentTime,
        isPlaying: audioState.isPlaying,
        phase: phase.type
      });
      lastAudioStateLogRef.current = now;
    }
  }, [audioState.currentTime, audioState.isPlaying, phase.type]);

  // エフェクトマネージャーの初期化
  useEffect(() => {
    if (!managerInstance) return;

    if (shouldLog('effect-restore')) {
      log('App: 既存エフェクトの復元開始');
    }

    try {
      // 既存のエフェクトを復元
      effectState.effects.forEach((effect: EffectBase<EffectConfig>) => {
        const effectId = effect.getId();
        
        // マネージャーに存在しない場合のみ追加
        if (!managerInstance.getEffect(effectId)) {
          try {
            managerInstance.addEffect(effect); // zIndexの再計算はEffectManagerに任せる
            
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
          } catch (error) {
            console.error(`エフェクト復元エラー (新規追加試行): ${effectId}`, error);
          }
        } else if (hasSetAudioSource(effect) && audioState.source) {
          // 既に存在する場合でも、audioSourceの更新は必要かもしれない
          const existingEffect = managerInstance.getEffect(effectId);
          if (existingEffect && hasSetAudioSource(existingEffect)) {
            const audioSource = {
                ...audioState.source,
                waveformData: audioState.analysis?.waveformData || [],
                frequencyData: audioState.analysis?.frequencyData?.map(data =>
                  data instanceof Uint8Array ? data : new Uint8Array(data.length)
                ) || []
              };
            existingEffect.setAudioSource(audioSource);
          }
        }
      });

      if (shouldLog('effect-restore')) {
        log(`App: ${effectState.effects.length}個のエフェクトの復元処理を試行`);
      }
    } catch (error) {
      console.error('エフェクト復元中に予期せぬエラー:', error);
    }
  }, [managerInstance, audioState.source, effectState.effects]);



  // エフェクト追加
  const handleAddEffectClick = useCallback(async (type: EffectType) => {
    try {
      log('Adding effect:', type);
      const newEffect = createEffectByType(type);
      if (hasSetAudioSource(newEffect) && audioState.source) {
        newEffect.setAudioSource(audioState.source); // Set audio source immediately
      }
      // Use the addEffect from context which should handle managerInstance internally
      await addEffect(newEffect); 
      selectEffect(newEffect.getId()); // Select the newly added effect
      // openSettingsPanel(); // selectEffect should handle opening the panel
      await saveProject(); // Trigger auto-save
    } catch (error) {
      console.error('エフェクト追加エラー:', error);
      transitionTo({ type: 'error', error: error instanceof Error ? error : new Error('Unknown error adding effect') });
    }
  }, [addEffect, selectEffect, audioState.source, saveProject, transitionTo]);

  // エフェクト削除時の処理
  const handleEffectDelete = useCallback(async (id: string) => {
    try {
      await removeEffect(id);
      // 削除後に保存を実行
      await saveProject();
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [removeEffect, saveProject, transitionTo]);

  // エフェクト移動時の処理
  const handleEffectMove = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await moveEffect(sourceId, targetId);
      // 移動後に保存を実行
      await saveProject();
    } catch (error) {
      if (error instanceof Error) {
        transitionTo({ type: 'error', error });
      } else {
        transitionTo({ type: 'error', error: new Error('Unknown error') });
      }
    }
  }, [moveEffect, saveProject, transitionTo]);

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
    console.warn('[App.tsx] handleAudioFileSelect called with file:', file.name, new Date().toISOString());
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
  }, [projectState.currentProject, dispatch, saveProject]);

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

  // Define onError handler for AudioUploader
  const handleUploaderError = useCallback((error: Error) => {
      transitionTo({ type: 'error', error: error instanceof AppError ? error : new AppError(ErrorType.FILE_LOAD_ERROR, "Failed to process file", error) });
  }, [transitionTo]);

  // Default video settings (use context or defaults)
  const currentVideoSettings: VideoSettings = projectState.currentProject?.videoSettings ?? { 
      width: 1280, 
      height: 720, 
      frameRate: 30, 
      videoBitrate: 5000000, 
      audioBitrate: 128000,
      codec: { video: 'avc', audio: 'aac' },
      container: 'mp4',
      latencyMode: 'quality',
      sampleRate: 48000,
      channels: 2,
      hardwareAcceleration: 'no-preference'
  };

  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <HeaderLeft>
            <Logo>WIP Motion Video</Logo>
          </HeaderLeft>
          <HeaderCenter>
<<<<<<< HEAD
            {/* Header Center - Empty for cleaner look */}
=======
            {/* Header Center Actions - Show only when interactive */} 
            {isInteractive && (
              <Flex gap="3" align="center">
                {/* 独自のドロップダウンメニューに置き換え */}
                <DropdownContainer>
                  <Tooltip content="エフェクトを追加">
                    <IconButton 
                      variant="ghost" 
                      onClick={() => {
                        log('Toggle dropdown');
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                    >
                      <PlusIcon width="18" height="18" />
                    </IconButton>
                  </Tooltip>
                  <DropdownContent isOpen={isDropdownOpen}>
                    <DropdownItem 
                      onClick={() => {
                        log('Background effect clicked');
                        handleAddEffectClick('background');
                        setIsDropdownOpen(false);
                      }}
                    >
                      背景
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => {
                        log('Text effect clicked');
                        handleAddEffectClick('text'); 
                        setIsDropdownOpen(false);
                      }}
                    >
                      テキスト
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => {
                        log('Waveform effect clicked');
                        handleAddEffectClick('waveform');
                        setIsDropdownOpen(false);
                      }}
                    >
                      波形
                    </DropdownItem>
                    <DropdownItem 
                      onClick={() => {
                        log('Watermark effect clicked');
                        handleAddEffectClick('watermark');
                        setIsDropdownOpen(false);
                      }}
                    >
                      透かし
                    </DropdownItem>
                  </DropdownContent>
                </DropdownContainer>
              </Flex>
            )}
>>>>>>> 4b34a4e5aa778551329353847f0a002c35789a9f
          </HeaderCenter>
          <HeaderRight>
            {/* Export Button */} 
            <ExportButton 
              onError={(error) => transitionTo({ type: 'error', error })} 
              onProgress={(progress) => log('Export progress:', progress)}
              videoSettings={currentVideoSettings}
              onSettingsChange={handleVideoSettingsUpdate}
              audioSource={audioState.source}
              disabled={phase.type === 'exporting'}
            />
          </HeaderRight>
        </Header>

        <Content>
          <Main>
            {/* Show Uploader only in Idle state */} 
            {isIdle && (
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: '20px'
              }}>
                <Card size="4" style={{ width: '100%', maxWidth: '600px' }}>
                    <AudioUploader 
                      onFileSelect={handleAudioFileSelect} 
                      onError={handleUploaderError} 
                    />
                </Card>
              </div>
            )}
            
            {/* Show PreviewCanvas when interactive or has audio source */} 
            {(isInteractive || audioState.source) && (
              <PreviewCanvas
                width={currentVideoSettings.width}
                height={currentVideoSettings.height}
                currentTime={audioState.currentTime}
              />
            )}
          </Main>
          <Sidebar>
            <SidebarContent>
              {/* Idle state: Show welcome message */}
              {isIdle && <WelcomeMessage />}
              
              {/* Interactive state: Always show toolbar and effect list */}
              {isInteractive && (
                <>
                  <EffectToolbar onAddEffect={handleAddEffectClick} />
                  <EffectList
                    effects={effectState.effects.map(e => e.getConfig())}
                    selectedEffectId={ui.selectedEffectId}
                    onSelectEffect={selectEffect}
                    onDeleteEffect={handleEffectDelete}
                    onToggleVisibility={(id, visible) => updateEffect(id, { visible })}
                    onMoveEffect={handleEffectMove}
                  />
                  {/* Show settings panel only when an effect is selected */}
                  {ui.selectedEffectId && <SettingsPanel />}
                </>
              )}
            </SidebarContent>
          </Sidebar>
        </Content>

        <Footer>
            {/* Show PlaybackControls and Timeline when interactive */} 
            {isInteractive && (
              <>
                <PlaybackControlsContainer>
                  <PlaybackControls
                    currentTime={audioState.currentTime}
                    duration={audioState.duration}
                    isPlaying={audioState.isPlaying}
                    volume={audioState.volume}
                    loop={audioState.loop}
                    onPlay={playAudio}
                    onPause={pauseAudio}
                    onSeek={seekAudio}
                    onVolumeChange={onVolumeChange}
                    onLoopChange={onLoopChange}
                  />
                </PlaybackControlsContainer>
                {isInteractive && effectState.effects.length > 0 && (
                  <TimelineContainer>
                    <Timeline 
                      duration={audioState.duration}
                      currentTime={audioState.currentTime}
                      effects={effectState.effects.map((e: EffectBase<EffectConfig>) => e.getConfig())}
                      selectedEffectId={ui.selectedEffectId}
                      onSelectEffect={selectEffect}
                      onSeek={seekAudio}
                      onEffectTimeChange={(id, startTime, endTime) => 
                        updateEffect(id, { startTime, endTime })
                      }
                    />
                  </TimelineContainer>
                )}
              </>
            )}
        </Footer>
      </AppContainer>
    </ErrorBoundary>
  );
}

export default App;
