import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { AppState, AppOperations, AppPhase, AppServices, withAppError, AnalysisResult } from '../core/types/app';
import { ProjectService } from '../core/ProjectService';
import { AudioPlaybackService } from '../core/AudioPlaybackService';
import { AudioAnalysisService } from '../core/AudioAnalysisService';
import { EffectBase, EffectConfig } from '../core/types/core';
import { VideoSettings } from '../core/types/base';
import { AppError, ErrorType } from '../core/types/error';
import { EffectManager } from '../core/EffectManager';
import { AudioSource } from '../core/types/base';
import { DrawingManager } from '../core/DrawingManager';
import { 
  createDefaultBackgroundEffect,
  createDefaultWaveformEffect,
  createDefaultWatermarkEffect
} from '../core/DefaultEffectService';
import { BackgroundEffect } from '../features/background/BackgroundEffect';
import { WaveformEffect } from '../features/waveform/WaveformEffect';
import { WatermarkEffect } from '../features/watermark/WatermarkEffect';
import { TextEffect } from '../features/text/TextEffect';
import { ProjectData } from '../core/types/state';
import {
  BackgroundEffectConfig, 
  TextEffectConfig, 
  WaveformEffectConfig, 
  WatermarkEffectConfig
} from '../core/types/effect';
import { PlaybackState } from '../core/types/audio';
import debug from 'debug';

const log = debug('app:AppContext');

// 状態遷移の定義
const PHASE_TRANSITIONS: Record<AppPhase['type'], AppPhase['type'][]> = {
  idle: ['loadingAudio'],
  loadingAudio: ['analyzing', 'error', 'idle'],
  analyzing: ['ready', 'error', 'idle'],
  ready: ['playing', 'exporting', 'error', 'idle'],
  playing: ['ready', 'error', 'idle'],
  exporting: ['ready', 'error', 'idle'],
  error: ['idle', 'loadingAudio', 'ready']
};

// 状態遷移のバリデーション
function validatePhaseTransition(current: AppPhase['type'], next: AppPhase['type']): boolean {
  const isValid = PHASE_TRANSITIONS[current]?.includes(next) ?? false;
  console.log(`フェーズ遷移: ${current} -> ${next} (${isValid ? '有効' : '無効'})`);
  return isValid;
}

type AppAction = 
  | { type: 'TRANSITION'; payload: AppPhase }
  | { type: 'SET_PROJECT'; payload: Partial<AppState['projectState']> }
  | { type: 'SET_AUDIO'; payload: Partial<AppState['audioState']> }
  | { type: 'SET_EFFECTS'; payload: Partial<AppState['effectState']> }
  | { type: 'SET_UI'; payload: Partial<AppState['ui']> }
  | { type: 'SET_ERROR'; payload: Partial<AppState['error']> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'HANDLE_ERROR'; payload: { error: AppError; errorType: ErrorType; message: string } }
  | { type: 'SELECT_EFFECT'; payload: string | null }
  | { type: 'DESELECT_EFFECT' }
  | { type: 'OPEN_SETTINGS_PANEL' }
  | { type: 'CLOSE_SETTINGS_PANEL' };

// Use the original AppState type from app.ts which now includes the correct AnalysisResult
const initialState: AppState = {
  phase: { type: 'idle' },
  projectState: {
    currentProject: null,
    isLoading: false
  },
  audioState: {
    source: null,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    loop: false,
    analysis: undefined // Initialize analysis as undefined
  },
  effectState: {
    effects: [],
    selectedEffect: null
  },
  ui: {
    isSidebarOpen: true,
    activeTab: 'effects',
    theme: 'light',
    selectedEffectId: null,
    isSettingsPanelOpen: false
  },
  error: {
    type: null,
    message: null,
    timestamp: null
  }
};

// Use the original AppState
export interface AppContextType extends AppState, AppOperations {
  dispatch: React.Dispatch<AppAction>;
  managerInstance: EffectManager;
  drawingManager: DrawingManager;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Use original AppState in reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'TRANSITION': {
      const newPhase = action.payload;
      if (!validatePhaseTransition(state.phase.type, newPhase.type)) {
        console.error(`Invalid phase transition: ${state.phase.type} -> ${newPhase.type}`);
        return state;
      }
      return { ...state, phase: newPhase };
    }

    case 'SET_PROJECT':
      return {
        ...state,
        projectState: {
          ...state.projectState,
          ...action.payload
        }
      };

    case 'SET_AUDIO':
      // Payload type should now match AppState['audioState']
      return {
        ...state,
        audioState: {
          ...state.audioState,
          ...action.payload
        }
      };

    case 'SET_EFFECTS':
      return {
        ...state,
        effectState: {
          ...state.effectState,
          ...action.payload
        }
      };

    case 'SET_UI':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          ...action.payload,
          timestamp: Date.now()
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: initialState.error
      };

    case 'HANDLE_ERROR':
      return {
        ...state,
        error: {
          type: action.payload.errorType,
          message: action.payload.message,
          timestamp: Date.now()
        }
      };

    case 'SELECT_EFFECT':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedEffectId: action.payload
        }
      };

    case 'DESELECT_EFFECT':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedEffectId: null,
          isSettingsPanelOpen: false
        }
      };

    case 'OPEN_SETTINGS_PANEL':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSettingsPanelOpen: true
        }
      };

    case 'CLOSE_SETTINGS_PANEL':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSettingsPanelOpen: false
        }
      };

    default:
      return state;
  }
};

// --- Helper function moved here --- 
interface WithAudioSource {
  setAudioSource: (source: AudioSource & Partial<AnalysisResult>) => void;
}
function hasSetAudioSource(effect: unknown): effect is WithAudioSource {
  return typeof (effect as WithAudioSource).setAudioSource === 'function';
}
// --- End Helper function ---

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const audioService = useMemo(() => AudioPlaybackService.getInstance(), []);
  const managerInstance = useMemo(() => new EffectManager(), []);
  const drawingManager = useMemo(() => new DrawingManager(managerInstance), [managerInstance]);
  const analyzerService = useMemo(() => AudioAnalysisService.getInstance(), []);

  const handleErrorCallback = useCallback((error: AppError) => {
    log('Handling error:', error);
    dispatch({ 
      type: 'HANDLE_ERROR', 
      payload: { error, errorType: error.type, message: error.message }
    });
  }, [dispatch]);

  // アプリ起動時の自動復元
  useEffect(() => {
    const autoRestoreProject = async () => {
      try {
        const projectService = ProjectService.getInstance();
        const lastProjectId = await projectService.getLastOpenedProject();
        
        if (lastProjectId) {
          log('Attempting to restore last project:', lastProjectId);
          // loadProject関数は後で定義されるため、直接プロジェクト読み込み処理を実装
          const loadedProjectData = await projectService.loadProject(lastProjectId);
          
          dispatch({
            type: 'SET_PROJECT',
            payload: {
              currentProject: { ...loadedProjectData, audioBuffer: null },
              lastSaved: loadedProjectData.updatedAt
            }
          });

          // エフェクトの復元
          loadedProjectData.effects.forEach((config: any) => {
            try {
              let effectInstance: EffectBase<any>;
              if (config.type === 'background') {
                  effectInstance = new BackgroundEffect(config as BackgroundEffectConfig);
              } else if (config.type === 'text') {
                  effectInstance = new TextEffect(config as TextEffectConfig);
              } else if (config.type === 'waveform') {
                  effectInstance = new WaveformEffect(config as WaveformEffectConfig);
              } else if (config.type === 'watermark') {
                  effectInstance = new WatermarkEffect(config as WatermarkEffectConfig);
              } else {
                  throw new Error(`Unsupported effect type: ${config.type}`);
              }
              managerInstance.addEffect(effectInstance);
            } catch (effectError) {
               console.error(`Failed to restore effect ${config.id}:`, effectError);
            }
          });

          const restoredEffects = managerInstance.getEffects();
          dispatch({ type: 'SET_EFFECTS', payload: { effects: restoredEffects } });

          log('Last project restored successfully:', lastProjectId);
        } else {
          log('No last project found, starting with empty state');
        }
      } catch (error) {
        console.warn('Failed to restore last project:', error);
        // エラーが発生しても正常にアプリを起動する
      }
    };

    autoRestoreProject();
  }, [managerInstance, dispatch]);

  const addEffect = useCallback(async (effect: EffectBase<any>) => {
    try {
      await managerInstance.addEffect(effect);
      // Get the updated list from the manager to ensure consistency
      const updatedEffects = managerInstance.getEffects();
      dispatch({ type: 'SET_EFFECTS', payload: { effects: updatedEffects } });
      log('Effect added:', effect.getId(), 'Updated effects count:', updatedEffects.length);
      // await saveProject(); // Consider if saving is needed immediately after adding an effect
    } catch (error) {
      console.error("Failed to add effect:", error);
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.GENERIC_ERROR, "Failed to add effect", error as Error));
    }
  }, [managerInstance, dispatch, handleErrorCallback]);

  // 音声再生状態の監視（インターバルポーリングからイベントリスナー方式に変更）
  useEffect(() => {
    // 状態変更リスナーのコールバック
    const handlePlaybackStateChange = (state: PlaybackState) => {
      // AudioPlaybackService からの状態変更をそのまま反映
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { 
          currentTime: state.currentTime,
          isPlaying: state.isPlaying,
          volume: state.volume,
          loop: state.loop,
        }
      });
    };

    // リスナーを登録
    audioService.addStateChangeListener(handlePlaybackStateChange);

    // クリーンアップ時にリスナーを解除
    return () => {
      audioService.removeStateChangeListener(handlePlaybackStateChange);
    };
  }, [audioService, dispatch]);

  // アプリケーション状態からAudioPlaybackServiceに設定を反映
  useEffect(() => {
    audioService.setVolume(state.audioState.volume);
    audioService.setLoop(state.audioState.loop);
  }, [audioService, state.audioState.volume, state.audioState.loop]);

  // アプリケーション終了時のクリーンアップ
  useEffect(() => {
    return () => {
      // エフェクトマネージャのリソース解放
      managerInstance.dispose();
      // 描画マネージャのリソース解放
      drawingManager.dispose();
      // オーディオサービスのリソース解放
      audioService.dispose();
      // アナライザーサービスはシングルトンなので、開発時のStrictModeでの再実行を避けるためdisposeしない
      // analyzerService.dispose();
    };
  }, []); // シングルトンサービスは依存配列から除外

  const transitionTo = useCallback((phase: AppPhase) => {
    dispatch({ type: 'TRANSITION', payload: phase });
  }, []);

  const loadAudio = useCallback(async (file: File) => {
    transitionTo({ type: 'loadingAudio' });
    let source: AudioSource | null = null;
    try {
      const buffer = await file.arrayBuffer();
      const audioBuffer = await audioService.decodeAudioData(buffer);
      source = { file, buffer: audioBuffer, duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels };
      await audioService.setAudioSource(source);
      dispatch({ type: 'SET_AUDIO', payload: { source, duration: source.duration } }); 
      
      transitionTo({ type: 'analyzing' });

      if (!source) {
          throw new AppError(ErrorType.INVALID_STATE, "AudioSource is not available for analysis.");
      }

      try {
        console.log("Starting audio analysis with AudioSource...");
        const analysisResult = await analyzerService.analyze(source);
        console.log("Audio analysis complete:"); 
        // Combine source and analysis result
        // Updated AudioSource definition now accepts both Float32Array[][] and Uint8Array[]
        const sourceWithAnalysis = {
           ...source, 
           waveformData: analysisResult.waveformData,
           frequencyData: analysisResult.frequencyData // Now compatible with updated AudioSource
        };
        // Dispatch the original analysis result to state
        dispatch({ type: 'SET_AUDIO', payload: { analysis: analysisResult } });

        console.log("Adding default effects...");
        const backgroundEffect = new BackgroundEffect(createDefaultBackgroundEffect());
        const waveformEffect = new WaveformEffect(createDefaultWaveformEffect());
        const watermarkEffect = new WatermarkEffect(createDefaultWatermarkEffect());

        if (hasSetAudioSource(waveformEffect)) {
          // Pass the combined object (with casted frequencyData)
          waveformEffect.setAudioSource(sourceWithAnalysis);
        }

        // デフォルトエフェクトを追加（背景、波形、ウォーターマーク）
        await addEffect(backgroundEffect);
        await addEffect(waveformEffect);
        await addEffect(watermarkEffect);
        console.log("Default effects added.");

        transitionTo({ type: 'ready' });
      } catch (analysisError) {
        console.error("Audio analysis or default effect addition failed:", analysisError);
        handleErrorCallback(analysisError instanceof AppError ? analysisError : new AppError(ErrorType.AUDIO_ANALYSIS_FAILED, "Failed to analyze audio or add default effects", analysisError as Error));
      }

    } catch (loadError) {
      console.error("Audio loading/decoding failed:", loadError);
      handleErrorCallback(loadError instanceof AppError ? loadError : new AppError(ErrorType.DECODE_AUDIO_DATA_ERROR, "Failed to load or decode audio", loadError as Error));
    }
  }, [audioService, analyzerService, transitionTo, handleErrorCallback, dispatch, addEffect]);

  const playAudio = useCallback(() => {
    try {
      audioService.play();
    } catch (error) {
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.PLAYBACK_ERROR, "Failed to play audio", error));
    }
  }, [audioService, handleErrorCallback]);

  const pauseAudio = useCallback(() => {
    try {
      audioService.pause();
    } catch (error) {
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.PLAYBACK_ERROR, "Failed to pause audio", error));
    }
  }, [audioService, handleErrorCallback]);

  const seekAudio = useCallback((time: number) => {
    try {
      audioService.seek(time);
    } catch (error) {
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.SEEK_ERROR, "Failed to seek audio", error));
    }
  }, [audioService, handleErrorCallback]);

  const selectEffect = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_EFFECT', payload: id });
    if (id) {
      dispatch({ type: 'OPEN_SETTINGS_PANEL' });
    } else {
      dispatch({ type: 'CLOSE_SETTINGS_PANEL' });
    }
  }, []);

  const deselectEffect = useCallback(() => {
    dispatch({ type: 'DESELECT_EFFECT' });
    dispatch({ type: 'CLOSE_SETTINGS_PANEL' });
  }, []);

  const openSettingsPanel = useCallback(() => {
    dispatch({ type: 'OPEN_SETTINGS_PANEL' });
  }, []);

  const closeSettingsPanel = useCallback(() => {
    dispatch({ type: 'CLOSE_SETTINGS_PANEL' });
  }, []);
  
  const updateEffect = useCallback((id: string, config: Partial<EffectConfig>) => {
    try {
      console.log('Updating effect:', id, config);
      // EffectManagerを使用してエフェクトを更新
      const effect = managerInstance.getEffect(id);
      if (!effect) {
        throw new AppError(ErrorType.EFFECT_NOT_FOUND, `エフェクトが見つかりません: ${id}`);
      }
      
      // 型安全性のチェック：エフェクトタイプが一致するかを確認
      const currentConfig = effect.getConfig();
      if (config.type && config.type !== currentConfig.type) {
        throw new AppError(
          ErrorType.EFFECT_CONFIG_INVALID, 
          `エフェクトタイプが一致しません。期待値: ${currentConfig.type}, 実際: ${config.type}`
        );
      }
      
      // エフェクトの設定を更新
      effect.updateConfig(config);
      
      // 更新されたエフェクトリストを取得して状態を更新
      const updatedEffects = managerInstance.getEffects();
      dispatch({ 
        type: 'SET_EFFECTS', 
        payload: { effects: updatedEffects }
      });
      
      // 自動保存（オプション）
      // saveProject(); 
    } catch (error) {
      console.error('エフェクト更新エラー:', error);
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.EFFECT_CONFIG_INVALID, `エフェクト設定の更新に失敗しました: ${id}`, error as Error));
    }
  }, [managerInstance, dispatch, handleErrorCallback]);

  const removeEffect = useCallback(async (id: string) => {
    log('Removing effect:', id);
    try {
      managerInstance.removeEffect(id);
      const updatedEffects = managerInstance.getEffects();
      dispatch({ type: 'SET_EFFECTS', payload: { effects: updatedEffects } });

      if (state.ui.selectedEffectId === id) {
        dispatch({ type: 'SELECT_EFFECT', payload: null });
        dispatch({ type: 'CLOSE_SETTINGS_PANEL' });
      }

      log('Effect removed:', id);
    } catch (error) {
      console.error('Failed to remove effect:', error);
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.GENERIC_ERROR, `エフェクトの削除に失敗しました: ${id}`, error as Error));
    }
  }, [managerInstance, state.ui.selectedEffectId, dispatch, handleErrorCallback]);

  const moveEffect = useCallback(async (sourceId: string, targetId: string) => {
    log('Moving effect:', { sourceId, targetId });
    try {
      managerInstance.moveEffect(sourceId, targetId);
      // moveEffect後はzIndexが変わるのでソート済みのリストを取得
      const updatedEffects = managerInstance.getSortedEffects();
      dispatch({ type: 'SET_EFFECTS', payload: { effects: updatedEffects } });
      log('Effect moved');
    } catch (error) {
      console.error('Failed to move effect:', error);
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.GENERIC_ERROR, `エフェクトの移動に失敗しました`, error as Error));
    }
  }, [managerInstance, dispatch, handleErrorCallback]);

  const createProject = useCallback(async (name: string, settings: VideoSettings) => {
    console.log('[TODO] createProject called', name, settings);
    // Implement project creation logic
  }, []);

  const saveProject = useCallback(async () => {
    log('Attempting to save project...');
    if (!state.projectState.currentProject) {
      log('No current project to save.');
      return;
    }

    try {
      const projectDataToSave: ProjectData = {
        ...state.projectState.currentProject,
        // EffectManagerから最新のエフェクトリストを取得して設定を保存
        effects: managerInstance.getEffects().map((effect: EffectBase<EffectConfig>) => effect.getConfig()),
        // AudioBufferは保存しない（またはファイル参照/ArrayBuffer保存を検討）
        audioBuffer: null,
        updatedAt: Date.now(),
      };

      const projectService = ProjectService.getInstance();
      await projectService.saveProject(projectDataToSave);
      
      // 最後に開いたプロジェクトとして記録
      await projectService.setLastOpenedProject(projectDataToSave.id);

      dispatch({ type: 'SET_PROJECT', payload: { lastSaved: projectDataToSave.updatedAt } });
      log('Project saved successfully:', projectDataToSave.id);

    } catch (error) {
      console.error('Failed to save project:', error);
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.ProjectSaveFailed, 'プロジェクトの保存に失敗しました', error as Error));
    }
  }, [state.projectState.currentProject, managerInstance, dispatch, handleErrorCallback]);

  const loadProject = useCallback(async (id: string) => {
    log('Loading project:', id);
    dispatch({ type: 'SET_PROJECT', payload: { isLoading: true } });
    try {
      const projectService = ProjectService.getInstance();
      const loadedProjectData = await projectService.loadProject(id);

      // プロジェクト基本情報の設定
      dispatch({
        type: 'SET_PROJECT',
        payload: {
          currentProject: { ...loadedProjectData, audioBuffer: null },
          isLoading: false,
          lastSaved: loadedProjectData.updatedAt
        }
      });

      // エフェクトの復元
      managerInstance.dispose();
      loadedProjectData.effects.forEach((config: any) => {
        try {
          let effectInstance: EffectBase<any>;
          if (config.type === 'background') {
              effectInstance = new BackgroundEffect(config as BackgroundEffectConfig);
          } else if (config.type === 'text') {
              effectInstance = new TextEffect(config as TextEffectConfig);
          } else if (config.type === 'waveform') {
              effectInstance = new WaveformEffect(config as WaveformEffectConfig);
          } else if (config.type === 'watermark') {
              effectInstance = new WatermarkEffect(config as WatermarkEffectConfig);
          } else {
              throw new Error(`Unsupported effect type: ${config.type}`);
          }
          managerInstance.addEffect(effectInstance);
        } catch (effectError) {
           console.error(`Failed to restore effect ${config.id}:`, effectError);
        }
      });

      const restoredEffects = managerInstance.getEffects();
      dispatch({ type: 'SET_EFFECTS', payload: { effects: restoredEffects, selectedEffect: null } });

      // UI状態リセット
      dispatch({ type: 'SET_UI', payload: { selectedEffectId: null, isSettingsPanelOpen: false } });

      // 最後に開いたプロジェクトとして記録
      await projectService.setLastOpenedProject(id);

      // アプリケーションの状態を'ready'に遷移
      dispatch({ type: 'TRANSITION', payload: { type: 'ready' } });

      log('Project loaded successfully:', id);

    } catch (error) {
      console.error('Failed to load project:', error);
      dispatch({ type: 'SET_PROJECT', payload: { isLoading: false } });
      handleErrorCallback(error instanceof AppError ? error : new AppError(ErrorType.ProjectLoadFailed, `プロジェクトの読み込みに失敗しました: ${id}`, error as Error));
      // エラー発生時は idle 状態に戻す
      dispatch({ type: 'TRANSITION', payload: { type: 'idle' } });
    }
  }, [dispatch, managerInstance, handleErrorCallback]);

  const startExport = useCallback(async (settings: VideoSettings) => {
    console.log('[TODO] startExport called', settings);
    // Implement export logic
  }, []);

  const cancelExport = useCallback(() => {
    console.log('[TODO] cancelExport called');
    // Implement export cancellation logic
  }, []);

  const contextValue = useMemo<AppContextType>(() => ({
    ...state,
    dispatch,
    managerInstance,
    drawingManager,
    transitionTo,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    selectEffect,
    deselectEffect,
    openSettingsPanel,
    closeSettingsPanel,
    updateEffect,
    removeEffect,
    moveEffect,
    createProject,
    saveProject,
    loadProject,
    startExport,
    cancelExport,
    addEffect,
  }), [
    state,
    dispatch,
    managerInstance,
    drawingManager,
    transitionTo,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    selectEffect,
    deselectEffect,
    openSettingsPanel,
    closeSettingsPanel,
    updateEffect,
    removeEffect,
    moveEffect,
    createProject,
    saveProject,
    loadProject,
    startExport,
    cancelExport,
    addEffect,
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  // Remove the cast to ModifiedAppState
  return context;
}; 