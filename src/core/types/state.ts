import { VideoSettings, AudioSource } from './base';
import { EffectConfig } from './effect';
import type { EffectBase } from '.';

/**
 * アプリケーションの状態管理に関連する型定義
 */

/**
 * アプリケーションの状態
 */
export type AppState = 
  | 'idle'
  | 'creating'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'deleting'
  | 'exporting'
  | 'error';

/**
 * アプリケーションのフェーズ
 */
export type AppPhase = 
  | 'idle'
  | 'loadingAudio'
  | 'analyzing'
  | 'ready'
  | 'playing'
  | 'exporting'
  | 'error';

/**
 * プロジェクトの状態
 */
export interface ProjectState {
  currentProject: ProjectData | null;
  lastSaved: number | null;
  isLoading: boolean;
  projectList: ProjectMetadata[];
}

/**
 * オーディオの状態
 */
export interface AudioState {
  source: AudioSource | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  isAnalyzing: boolean;
  analyzeProgress: number;
}

/**
 * エフェクトの状態
 */
export interface EffectState {
  effects: EffectBase<EffectConfig>[];
  selectedEffectId: string | null;
  selectedEffect: EffectBase<EffectConfig> | null;
  isLoading: boolean;
  lastModified: number | null;
}

/**
 * UIの状態
 */
export interface UIState {
  isSidebarOpen: boolean;
  activeTab: string;
  isDragging: boolean;
  isFullscreen: boolean;
  theme: 'light' | 'dark';
}

/**
 * エラーの状態
 */
export interface AppErrors {
  project: Error | null;
  audio: Error | null;
  effect: Error | null;
  export: Error | null;
}

/**
 * 進行状況の状態
 */
export interface ProgressState {
  isExporting: boolean;
  exportProgress: number;
  isSaving: boolean;
  isLoading: boolean;
  message: string | null;
}

/**
 * プロジェクトデータ
 */
export interface ProjectData {
  id: string;
  name: string;
  videoSettings: VideoSettings;
  effects: EffectConfig[];
  audioBuffer: AudioBuffer | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * プロジェクトのメタデータ
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * オーディオの再生状態
 */
export interface AudioPlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
}

/**
 * オーディオの視覚化パラメータ
 */
export interface AudioVisualParameters {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  waveformData?: Float32Array[] | null;
  frequencyData?: Uint8Array[] | null;
}

export interface HasAudioSource {
  getAudioSource(): AudioSource;
  setAudioSource(source: AudioSource): void;
}

export interface UseProjectResult {
  state: {
    currentProject: ProjectData | null;
    isLoading: boolean;
  };
  createProject: (name: string, videoSettings: VideoSettings) => Promise<ProjectData>;
  saveProject: () => Promise<void>;
  updateVideoSettings: (settings: VideoSettings) => Promise<void>;
} 