import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { AppState, AppOperations, AppPhase, AppServices, withAppError } from '../core/types/app';
import { ProjectService } from '../core/ProjectService';
import { AudioPlaybackService } from '../core/AudioPlaybackService';
import { AudioAnalyzerService } from '../core/AudioAnalyzerService';
import { EffectBase, EffectConfig } from '../core/types/core';
import { VideoSettings } from '../core/types/base';
import { AppError, ErrorType } from '../core/types/error';

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

type AppContextType = AppState & AppOperations & {
  dispatch: (action: AppAction) => void;
};

type AppAction = 
  | { type: 'TRANSITION'; payload: AppPhase }
  | { type: 'SET_PROJECT'; payload: Partial<AppState['projectState']> }
  | { type: 'SET_AUDIO'; payload: Partial<AppState['audioState']> }
  | { type: 'SET_EFFECTS'; payload: Partial<AppState['effectState']> }
  | { type: 'SET_UI'; payload: Partial<AppState['ui']> }
  | { type: 'SET_ERROR'; payload: Partial<AppState['error']> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'HANDLE_ERROR'; payload: { error: AppError; errorType: ErrorType; message: string } };

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
    loop: false
  },
  effectState: {
    effects: [],
    selectedEffect: null
  },
  ui: {
    isSidebarOpen: true,
    activeTab: 'effects',
    theme: 'light'
  },
  error: {
    type: null,
    message: null,
    timestamp: null
  }
};

const AppContext = createContext<AppContextType | null>(null);

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

    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // サービスの初期化
  const services: AppServices = {
    projectService: ProjectService.getInstance(),
    audioService: {
      playback: AudioPlaybackService.getInstance(),
      analyzer: AudioAnalyzerService.getInstance()
    }
  };

  // エラーハンドラー
  const handleError = useCallback((error: AppError) => {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        type: error.type,
        message: error.message
      }
    });
    dispatch({
      type: 'TRANSITION',
      payload: { type: 'error', error }
    });
  }, []);

  // フェーズ遷移
  const transitionTo = useCallback((phase: AppPhase) => {
    console.log('フェーズ遷移要求:', {
      from: state.phase.type,
      to: phase.type,
      project: state.projectState.currentProject,
      audio: state.audioState,
      effects: state.effectState.effects
    });
    dispatch({ type: 'TRANSITION', payload: phase });
  }, [state]);

  // プロジェクト操作
  const createProject = useCallback(async (name: string, settings: VideoSettings) => {
    await withAppError(
      async () => {
        transitionTo({ type: 'idle' });
        const project = await services.projectService.createProject(name, settings);
        dispatch({ type: 'SET_PROJECT', payload: { currentProject: project } });
        transitionTo({ type: 'ready' });
      },
      { type: 'error', error: new Error('プロジェクトの作成に失敗しました') },
      handleError
    );
  }, [transitionTo, handleError]);

  const saveProject = useCallback(async () => {
    if (!state.projectState.currentProject) return;
    await withAppError(
      async () => {
        await services.projectService.saveProject(state.projectState.currentProject!);
        dispatch({ type: 'SET_PROJECT', payload: { lastSaved: Date.now() } });
      },
      { type: 'error', error: new Error('プロジェクトの保存に失敗しました') },
      handleError
    );
  }, [state.projectState.currentProject, handleError]);

  const loadProject = useCallback(async (id: string) => {
    await withAppError(
      async () => {
        transitionTo({ type: 'idle' });
        const project = await services.projectService.loadProject(id);
        dispatch({ type: 'SET_PROJECT', payload: { currentProject: project } });
        transitionTo({ type: 'ready' });
      },
      { type: 'error', error: new Error('プロジェクトの読み込みに失敗しました') },
      handleError
    );
  }, [transitionTo, handleError]);

  // オーディオ操作
  const loadAudio = useCallback(async (file: File) => {
    await withAppError(
      async () => {
        transitionTo({ type: 'loadingAudio', file });
        
        const audioBuffer = await services.audioService.playback.decodeAudioData(
          await file.arrayBuffer()
        );
        
        const source = {
          file,
          buffer: audioBuffer,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        };
        
        await services.audioService.playback.setAudioSource(source);
        dispatch({ type: 'SET_AUDIO', payload: { source } });
        
        transitionTo({ type: 'analyzing' });
        const analysis = await services.audioService.analyzer.analyze(source);
        dispatch({ type: 'SET_AUDIO', payload: { analysis } });
        
        transitionTo({ type: 'ready' });
      },
      { type: 'error', error: new Error('音声の読み込みに失敗しました') },
      handleError
    );
  }, [transitionTo, handleError]);

  const playAudio = useCallback(() => {
    if (state.phase.type !== 'ready') return;
    try {
      services.audioService.playback.play();
      const playbackState = services.audioService.playback.getPlaybackState();
      dispatch({
        type: 'SET_AUDIO',
        payload: {
          currentTime: playbackState.currentTime,
          duration: playbackState.duration,
          isPlaying: playbackState.isPlaying,
          volume: playbackState.volume,
          loop: playbackState.loop
        }
      });
      transitionTo({ type: 'playing' });
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.PlaybackError,
        '再生に失敗しました'
      ));
    }
  }, [state.phase.type, transitionTo, handleError]);

  const pauseAudio = useCallback(() => {
    if (state.phase.type !== 'playing') return;
    try {
      services.audioService.playback.pause();
      const playbackState = services.audioService.playback.getPlaybackState();
      dispatch({
        type: 'SET_AUDIO',
        payload: {
          currentTime: playbackState.currentTime,
          duration: playbackState.duration,
          isPlaying: playbackState.isPlaying,
          volume: playbackState.volume,
          loop: playbackState.loop
        }
      });
      transitionTo({ type: 'ready' });
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.PlaybackError,
        '一時停止に失敗しました'
      ));
    }
  }, [state.phase.type, transitionTo, handleError]);

  const seekAudio = useCallback((time: number) => {
    try {
      services.audioService.playback.seek(time);
      const playbackState = services.audioService.playback.getPlaybackState();
      dispatch({
        type: 'SET_AUDIO',
        payload: {
          currentTime: playbackState.currentTime,
          duration: playbackState.duration,
          isPlaying: playbackState.isPlaying,
          volume: playbackState.volume,
          loop: playbackState.loop
        }
      });
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.PlaybackError,
        'シークに失敗しました'
      ));
    }
  }, [handleError]);

  // エフェクト操作
  const addEffect = useCallback(async (effect: EffectBase<EffectConfig>) => {
    try {
      const list = [...state.effectState.effects, effect];
      dispatch({ type: 'SET_EFFECTS', payload: { effects: list } });
      await saveProject();
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.EffectError,
        'エフェクトの追加に失敗しました'
      ));
    }
  }, [state.effectState.effects, saveProject, handleError]);

  const removeEffect = useCallback(async (id: string) => {
    try {
      const list = state.effectState.effects.filter((effect: EffectBase<EffectConfig>) => 
        effect.getId() !== id
      );
      dispatch({ type: 'SET_EFFECTS', payload: { effects: list } });
      await saveProject();
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.EffectError,
        'エフェクトの削除に失敗しました'
      ));
    }
  }, [state.effectState.effects, saveProject, handleError]);

  const updateEffect = useCallback((id: string, config: Partial<EffectConfig>) => {
    try {
      const list = state.effectState.effects.map((effect: EffectBase<EffectConfig>) => {
        if (effect.getId() === id) {
          effect.updateConfig(config);
          return effect;
        }
        return effect;
      });
      dispatch({ type: 'SET_EFFECTS', payload: { effects: list } });
      saveProject().catch(handleError);
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.EffectError,
        'エフェクトの更新に失敗しました'
      ));
    }
  }, [state.effectState.effects, saveProject, handleError]);

  const moveEffect = useCallback(async (sourceId: string, targetId: string) => {
    try {
      const list = [...state.effectState.effects];
      const sourceIndex = list.findIndex(effect => effect.getId() === sourceId);
      const targetIndex = list.findIndex(effect => effect.getId() === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const [movedEffect] = list.splice(sourceIndex, 1);
      list.splice(targetIndex, 0, movedEffect);

      dispatch({ type: 'SET_EFFECTS', payload: { effects: list } });
      await saveProject();
    } catch (error) {
      handleError(error instanceof AppError ? error : new AppError(
        ErrorType.EffectError,
        'エフェクトの移動に失敗しました'
      ));
    }
  }, [state.effectState.effects, saveProject, handleError]);

  const selectEffect = useCallback((id: string | null) => {
    const selectedEffect = id ? state.effectState.effects.find(effect => effect.getId() === id) : null;
    dispatch({ type: 'SET_EFFECTS', payload: { selectedEffect } });
  }, [state.effectState.effects]);

  // エクスポート操作
  const startExport = useCallback(async (settings: VideoSettings) => {
    await withAppError(
      async () => {
        transitionTo({ type: 'exporting', settings });
        // VideoEncoderServiceを使用してエクスポート
        transitionTo({ type: 'ready' });
      },
      { type: 'error', error: new Error('エクスポートに失敗しました') },
      handleError
    );
  }, [transitionTo, handleError]);

  const cancelExport = useCallback(() => {
    if (state.phase.type === 'exporting') {
      // VideoEncoderServiceのエクスポートをキャンセル
      transitionTo({ type: 'ready' });
    }
  }, [state.phase.type, transitionTo]);

  // プロジェクト操作
  const operations: AppOperations = {
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
    cancelExport
  };

  const value: AppContextType = {
    ...state,
    ...operations,
    dispatch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 