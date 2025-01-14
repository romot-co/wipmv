import { EffectConfig, VideoSettings } from './types';

export interface ProjectData {
  version: string;
  videoSettings: VideoSettings;
  effects: EffectConfig[];
  audioInfo?: {
    fileName: string;
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
  };
}

const STORAGE_KEY = 'wipmv_project';
const CURRENT_VERSION = '1.0.0';

/**
 * プロジェクトデータの保存と読み込みを管理
 */
export const ProjectService = {
  /**
   * プロジェクトデータを保存
   */
  saveProject(data: Omit<ProjectData, 'version'>) {
    try {
      const projectData: ProjectData = {
        version: CURRENT_VERSION,
        ...data
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
    } catch (error) {
      console.error('プロジェクトの保存に失敗:', error);
      throw error;
    }
  },

  /**
   * プロジェクトデータを読み込み
   */
  loadProject(): ProjectData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const projectData = JSON.parse(data) as ProjectData;
      
      // バージョンチェック
      if (projectData.version !== CURRENT_VERSION) {
        console.warn(`プロジェクトのバージョンが異なります (保存: ${projectData.version}, 現在: ${CURRENT_VERSION})`);
      }

      return projectData;
    } catch (error) {
      console.error('プロジェクトの読み込みに失敗:', error);
      throw error;
    }
  },

  /**
   * プロジェクトデータを削除
   */
  clearProject() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('プロジェクトの削除に失敗:', error);
      throw error;
    }
  }
}; 