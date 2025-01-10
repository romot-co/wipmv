import { 
  BackgroundEffectConfig, 
  WaveformEffectConfig, 
  TextEffectData, 
  WatermarkConfig, 
  StoredBackgroundEffectConfig,
  StoredImageBackgroundConfig,
  ColorBackgroundConfig,
  ImageBackgroundConfig,
  BaseBackgroundConfig
} from '../../types/effects';

interface AppSettings {
  background: StoredBackgroundEffectConfig;
  waveform: WaveformEffectConfig;
  watermark: WatermarkConfig;
  textEffects: TextEffectData[];
}

interface StoredSettings extends Partial<AppSettings> {
  id: string;
  [key: string]: string | number | boolean | null | undefined | StoredBackgroundEffectConfig | WaveformEffectConfig | WatermarkConfig | TextEffectData[] | { id: string };
}

class StorageService {
  private readonly DB_NAME = 'wipmv-maker';
  private readonly STORE_NAME = 'settings';
  private readonly VERSION = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => {
        console.error('Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  private async getSettingsObject(): Promise<StoredSettings> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get('settings');

      request.onsuccess = () => {
        resolve(request.result || { id: 'settings' });
      };
      request.onerror = () => reject(request.error);
    });
  }

  private convertImageToBase64(image: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL();
  }

  private async convertBackgroundConfig(config: BackgroundEffectConfig): Promise<StoredBackgroundEffectConfig> {
    if (config.type === 'image') {
      const imageConfig = config as ImageBackgroundConfig;
      const storedConfig: StoredImageBackgroundConfig = {
        type: 'image',
        imageData: this.convertImageToBase64(imageConfig.image),
        opacity: imageConfig.opacity,
        blendMode: imageConfig.blendMode
      };
      return storedConfig;
    }
    return {
      type: 'color',
      color: (config as ColorBackgroundConfig).color,
      opacity: config.opacity,
      blendMode: config.blendMode
    };
  }

  async saveSettings(settings: Partial<AppSettings> & { background?: BackgroundEffectConfig | StoredBackgroundEffectConfig }): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    const currentSettings = await this.getSettingsObject();
    let updatedSettings = { ...currentSettings };

    // 背景設定の変換
    if (settings.background) {
      if ('imageData' in settings.background || settings.background.type === 'color') {
        updatedSettings.background = settings.background as StoredBackgroundEffectConfig;
      } else {
        updatedSettings.background = await this.convertBackgroundConfig(settings.background as BackgroundEffectConfig);
      }
      delete settings.background;
    }

    // その他の設定をマージ
    updatedSettings = {
      ...updatedSettings,
      ...settings,
      id: 'settings'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.put(updatedSettings);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async loadSettings<T>(key: keyof AppSettings): Promise<T | null> {
    if (!this.db) {
      await this.initialize();
    }

    const settings = await this.getSettingsObject();
    if (key === 'background') {
      const backgroundConfig = settings.background;
      if (backgroundConfig?.type === 'image') {
        const storedConfig = backgroundConfig as StoredImageBackgroundConfig;
        if (storedConfig.imageData) {
          const image = await this.loadImageFromBase64(storedConfig.imageData);
          const config: ImageBackgroundConfig = {
            type: 'image',
            image,
            opacity: storedConfig.opacity,
            blendMode: storedConfig.blendMode
          };
          return config as unknown as T;
        }
      }
      return backgroundConfig as unknown as T;
    }
    return (settings[key] as T) || null;
  }

  private loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = base64;
    });
  }

  async saveImage(key: string, image: HTMLImageElement): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    const imageData = this.convertImageToBase64(image);
    const currentSettings = await this.getSettingsObject();
    
    const updatedSettings = {
      ...currentSettings,
      [key]: imageData,
      id: 'settings'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(updatedSettings);
      
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async loadImage(key: string): Promise<HTMLImageElement | null> {
    if (!this.db) {
      await this.initialize();
    }

    const settings = await this.getSettingsObject();
    const imageData = settings[key];
    
    if (imageData && typeof imageData === 'string') {
      return this.loadImageFromBase64(imageData);
    }
    
    return null;
  }
}

export const storageService = new StorageService(); 