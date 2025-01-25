import { EffectBase, EffectConfig } from './core';
import { AudioSource, VideoSettings } from './base';
import { ProjectData } from './state';
import { AppError, ErrorType } from './error';

export type AppPhase = 
  | { type: 'idle' }
  | { type: 'loadingAudio', file?: File }
  | { type: 'analyzing' }
  | { type: 'ready' }
  | { type: 'playing' }
  | { type: 'exporting', settings?: VideoSettings }
  | { type: 'error', error: Error };

export interface AppState {
  phase: AppPhase;
  projectState: {
    currentProject: ProjectData | null;
    isLoading: boolean;
    lastSaved?: number;
  };
  audioState: {
    source: AudioSource | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    loop: boolean;
    analysis?: {
      waveformData: Float32Array[];
      frequencyData: (Float32Array | Uint8Array)[];
    };
  };
  effectState: {
    effects: EffectBase<EffectConfig>[];
    selectedEffect: EffectBase<EffectConfig> | null;
  };
  ui: {
    isSidebarOpen: boolean;
    activeTab: 'effects' | 'export';
    theme: 'light' | 'dark';
  };
  error: {
    type: ErrorType | null;
    message: string | null;
    timestamp: number | null;
  };
}

export interface AppOperations {
  transitionTo(phase: AppPhase): void;
  createProject(name: string, settings: VideoSettings): Promise<void>;
  saveProject(): Promise<void>;
  loadProject(id: string): Promise<void>;
  loadAudio(file: File): Promise<void>;
  playAudio(): void;
  pauseAudio(): void;
  seekAudio(time: number): void;
  addEffect(effect: EffectBase<EffectConfig>): Promise<void>;
  removeEffect(id: string): Promise<void>;
  updateEffect(id: string, config: Partial<EffectConfig>): void;
  moveEffect(sourceId: string, targetId: string): Promise<void>;
  selectEffect(id: string | null): void;
  startExport(settings: VideoSettings): Promise<void>;
  cancelExport(): void;
}

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
}

export interface AudioSourceControl {
  getAudioSource(): AudioSource | null;
  setAudioSource(source: AudioSource): Promise<void>;
}

export interface AudioPlayback {
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackState(): PlaybackState;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
  dispose(): void;
}

export interface AppServices {
  projectService: {
    createProject(name: string, settings: VideoSettings): Promise<ProjectData>;
    saveProject(data: ProjectData): Promise<void>;
    loadProject(id: string): Promise<ProjectData>;
  };
  audioService: {
    playback: AudioSourceControl & AudioPlayback & {
      decodeAudioData(buffer: ArrayBuffer): Promise<AudioBuffer>;
    };
    analyzer: {
      analyze(source: AudioSource): Promise<{
        waveformData: Float32Array[];
        frequencyData: (Float32Array | Uint8Array)[];
      }>;
    };
  };
}

export function withAppError<T>(
  fn: () => Promise<T>,
  fallbackPhase?: AppPhase,
  onError?: (error: AppError) => void
): Promise<T> {
  return fn().catch(error => {
    const appError = error instanceof AppError ? error : new AppError(ErrorType.UnknownError, error.message);
    if (onError) {
      onError(appError);
    }
    throw appError;
  });
}

export type AppAction = 
  | { type: 'TRANSITION'; payload: AppPhase }
  | { type: 'SET_PROJECT'; payload: Partial<AppState['projectState']> }
  | { type: 'SET_AUDIO'; payload: Partial<AppState['audioState']> }
  | { type: 'SET_EFFECTS'; payload: Partial<AppState['effectState']> }
  | { type: 'SET_UI'; payload: Partial<AppState['ui']> }
  | { type: 'SET_ERROR'; payload: Partial<AppState['error']> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'HANDLE_ERROR'; payload: { error: AppError; errorType: ErrorType; message: string } };

export type AppContextType = AppState & AppOperations & {
  dispatch: (action: AppAction) => void;
  services: AppServices;
}; 
