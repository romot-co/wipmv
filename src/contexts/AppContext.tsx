import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  ProjectData, 
  ProjectMetadata, 
  VideoSettings, 
  AppError, 
  ErrorType, 
  EffectConfig,
  AudioSource
} from '../core/types';
import { EffectBase } from '../core/EffectBase';

// アプリケーションの状態を定義
type AppState = 'initial' | 'loading' | 'ready' | 'error';

// グローバルエラー状態
interface AppErrors {
  audio: Error | null;
  effect: Error | null;
  project: Error | null;
  export: Error | null;
}

// プロジェクト状態
interface ProjectState {
  currentProject: ProjectData | null;
  projectList: ProjectMetadata[];
  isLoading: boolean;
  lastSaved: number | null;
}

// 音声状態
interface AudioState {
  source: AudioSource | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  isAnalyzing: boolean;
  analyzeProgress: number;
}

// エフェクト状態
interface EffectState {
  effects: EffectBase<EffectConfig>[];
  selectedEffectId: string | null;
  selectedEffect: EffectBase<EffectConfig> | null;
  isLoading: boolean;
  lastModified: number | null;
}

// UI状態
interface UIState {
  isSidebarOpen: boolean;
  activeTab: string;
  isDragging: boolean;
  isFullscreen: boolean;
  theme: 'light' | 'dark';
}

// プログレス状態
interface ProgressState {
  isExporting: boolean;
  exportProgress: number;
  isSaving: boolean;
  isLoading: boolean;
  message: string | null;
}

interface AppContextType {
  // アプリケーション状態
  appState: AppState;
  errors: AppErrors;
  handleError: (type: keyof AppErrors, error: Error) => void;
  clearError: (type: keyof AppErrors) => void;
  transition: (newState: AppState) => void;

  // プロジェクト状態
  projectState: ProjectState;
  setProjectState: (state: Partial<ProjectState>) => void;
  
  // 音声状態
  audioState: AudioState;
  setAudioState: (state: Partial<AudioState>) => void;

  // エフェクト状態
  effectState: EffectState;
  setEffectState: (state: Partial<EffectState>) => void;
  
  // UI状態
  uiState: UIState;
  setUIState: (state: Partial<UIState>) => void;

  // プログレス状態
  progressState: ProgressState;
  setProgressState: (state: Partial<ProgressState>) => void;
  
  // エフェクト操作
  addEffect: (effect: EffectBase<EffectConfig>) => void;
  removeEffect: (id: string) => void;
  updateEffect: (id: string, config: Partial<EffectConfig>) => void;
  moveEffect: (sourceId: string, targetId: string) => void;
  selectEffect: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // アプリケーション状態
  const [appState, setAppState] = useState<AppState>('initial');
  const [errors, setErrors] = useState<AppErrors>({
    audio: null,
    effect: null,
    project: null,
    export: null
  });

  // プロジェクト状態
  const [projectState, setProjectState] = useState<ProjectState>({
    currentProject: null,
    projectList: [],
    isLoading: false,
    lastSaved: null
  });

  // 音声状態
  const [audioState, setAudioState] = useState<AudioState>({
    source: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    loop: false,
    isAnalyzing: false,
    analyzeProgress: 0
  });

  // エフェクト状態
  const [effectState, setEffectState] = useState<EffectState>({
    effects: [],
    selectedEffectId: null,
    selectedEffect: null,
    isLoading: false,
    lastModified: null
  });

  // UI状態
  const [uiState, setUIState] = useState<UIState>({
    isSidebarOpen: true,
    activeTab: 'effects',
    isDragging: false,
    isFullscreen: false,
    theme: 'light'
  });

  // プログレス状態
  const [progressState, setProgressState] = useState<ProgressState>({
    isExporting: false,
    exportProgress: 0,
    isSaving: false,
    isLoading: false,
    message: null
  });

  // エラーハンドリング
  const handleError = useCallback((type: keyof AppErrors, error: Error) => {
    console.error(`${type}エラー:`, error);
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
    setAppState('error');
  }, []);

  // エラークリア
  const clearError = useCallback((type: keyof AppErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });
    if (Object.keys(errors).length === 1) {
      setAppState('ready');
    }
  }, [errors]);

  // 状態遷移
  const transition = useCallback((newState: AppState) => {
    console.log(`状態遷移: ${appState} -> ${newState}`);
    setAppState(newState);
  }, [appState]);

  // 各状態の更新関数
  const updateProjectState = useCallback((state: Partial<ProjectState>) => {
    setProjectState(prev => ({ ...prev, ...state }));
  }, []);

  const updateAudioState = useCallback((state: Partial<AudioState>) => {
    setAudioState(prev => ({ ...prev, ...state }));
  }, []);

  const updateEffectState = useCallback((state: Partial<EffectState>) => {
    setEffectState(prev => ({ ...prev, ...state }));
  }, []);

  const updateUIState = useCallback((state: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...state }));
  }, []);

  const updateProgressState = useCallback((state: Partial<ProgressState>) => {
    setProgressState(prev => ({ ...prev, ...state }));
  }, []);

  // エフェクト操作
  const addEffect = useCallback((effect: EffectBase<EffectConfig>) => {
    setEffectState(prev => ({
      ...prev,
      effects: [...prev.effects, effect],
      lastModified: Date.now()
    }));
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffectState(prev => ({
      ...prev,
      effects: prev.effects.filter(e => e.getId() !== id),
      selectedEffectId: prev.selectedEffectId === id ? null : prev.selectedEffectId,
      selectedEffect: prev.selectedEffect?.getId() === id ? null : prev.selectedEffect,
      lastModified: Date.now()
    }));
  }, []);

  const updateEffect = useCallback((id: string, config: Partial<EffectConfig>) => {
    setEffectState(prev => ({
      ...prev,
      effects: prev.effects.map(e => 
        e.getId() === id 
          ? (e.updateConfig(config), e) 
          : e
      ),
      lastModified: Date.now()
    }));
  }, []);

  const moveEffect = useCallback((sourceId: string, targetId: string) => {
    setEffectState(prev => {
      const effects = [...prev.effects];
      const sourceIndex = effects.findIndex(e => e.getId() === sourceId);
      const targetIndex = effects.findIndex(e => e.getId() === targetId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [effect] = effects.splice(sourceIndex, 1);
        effects.splice(targetIndex, 0, effect);
      }
      
      return { 
        ...prev, 
        effects,
        lastModified: Date.now()
      };
    });
  }, []);

  const selectEffect = useCallback((id: string | null) => {
    setEffectState(prev => {
      const selectedEffect = id ? prev.effects.find(e => e.getId() === id) ?? null : null;
      return {
        ...prev,
        selectedEffectId: id,
        selectedEffect
      };
    });
  }, []);

  return (
    <AppContext.Provider value={{
      appState,
      errors,
      handleError,
      clearError,
      transition,
      projectState,
      setProjectState: updateProjectState,
      audioState,
      setAudioState: updateAudioState,
      effectState,
      setEffectState: updateEffectState,
      uiState,
      setUIState: updateUIState,
      progressState,
      setProgressState: updateProgressState,
      addEffect,
      removeEffect,
      updateEffect,
      moveEffect,
      selectEffect
    }}>
      {children}
    </AppContext.Provider>
  );
}; 