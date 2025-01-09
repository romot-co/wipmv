import { AudioSource, AudioVisualParameters } from '../../types/audio';
import { VisualEffect } from './VisualEffect';

export class VisualEffectManager {
  private effects: VisualEffect[] = [];
  private initialized: boolean = false;
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  registerEffect(effect: VisualEffect): void {
    console.log('VisualEffectManager: Registering effect', {
      name: effect.getName(),
      nodes: effect.getNodes().length
    });
    this.effects.push(effect);
    this.initialized = false;
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (this.initialized && this.context === context) {
      console.log('VisualEffectManager: Already initialized with same context');
      return;
    }

    this.context = context;
    console.log('VisualEffectManager: Initializing effects', {
      count: this.effects.length,
      effects: this.effects.map(e => e.getName())
    });

    // 各エフェクトの初期化
    this.effects.forEach((effect, index) => {
      console.log(`VisualEffectManager: Initializing effect ${index}`, effect.getName());
      effect.initialize(canvas, context);
    });

    // エフェクトチェーンの設定
    for (let i = 0; i < this.effects.length - 1; i++) {
      console.log(`VisualEffectManager: Linking effect ${i} (${this.effects[i].getName()}) to ${i + 1} (${this.effects[i + 1].getName()})`);
      this.effects[i].setNext(this.effects[i + 1]);
    }

    this.initialized = true;
    console.log('VisualEffectManager: Initialization complete');
  }

  process(audioSource: AudioSource, time: number, canvas: OffscreenCanvas): void {
    if (!this.initialized || this.effects.length === 0) {
      console.warn('VisualEffectManager: Not initialized or no effects');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return;
    }

    console.log('VisualEffectManager: Starting process', {
      time,
      effectsCount: this.effects.length,
      effects: this.effects.map(e => e.getName())
    });

    // コンテキストの状態を保存
    context.save();

    try {
      // エフェクトチェーンの開始
      console.log('VisualEffectManager: Starting effects chain');
      const parameters: AudioVisualParameters = {
        timeData: audioSource.timeData,
        volume: audioSource.volumeData[0],
        amplitude: audioSource.amplitudeData,
        frequency: audioSource.frequencyData[0],
        phase: audioSource.phaseData,
        stereo: audioSource.stereoData[0],
        dynamicRange: audioSource.dynamicRangeData[0],
        currentTime: time,
        audioSource
      };

      // 各エフェクトを順番に処理
      for (let i = 0; i < this.effects.length; i++) {
        console.log(`VisualEffectManager: Processing effect ${i}:`, this.effects[i].getName());
        context.save();  // 各エフェクトの前に状態を保存
        this.effects[i].process(parameters, canvas);
        context.restore();  // 各エフェクトの後に状態を復元
      }
    } finally {
      // 最終的なコンテキストの状態を復元
      context.restore();
    }
  }

  reset(): void {
    console.log('VisualEffectManager: Resetting initialization state');
    this.initialized = false;
    this.context = null;
  }

  clearEffects(): void {
    console.log('VisualEffectManager: Clearing effects');
    this.effects = [];
    this.initialized = false;
    this.context = null;
  }

  getEffectCount(): number {
    return this.effects.length;
  }
} 