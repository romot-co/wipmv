import { AudioSource, AudioVisualParameters } from '../../types/audio';
import { VisualEffect } from './VisualEffect';

export class VisualEffectManager {
  private effects: VisualEffect[] = [];
  private initialized: boolean = false;

  registerEffect(effect: VisualEffect): void {
    console.log('VisualEffectManager: Registering effect', effect.getName());
    this.effects.push(effect);
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (this.initialized) {
      console.log('VisualEffectManager: Already initialized');
      return;
    }

    console.log('VisualEffectManager: Initializing effects', this.effects.length);
    // 各エフェクトの初期化
    this.effects.forEach((effect, index) => {
      console.log(`VisualEffectManager: Initializing effect ${index}`);
      effect.initialize(canvas, context);
    });

    // エフェクトチェーンの設定
    for (let i = 0; i < this.effects.length - 1; i++) {
      console.log(`VisualEffectManager: Linking effect ${i} to ${i + 1}`);
      this.effects[i].setNext(this.effects[i + 1]);
    }

    this.initialized = true;
    console.log('VisualEffectManager: Initialization complete');
  }

  process(audioSource: AudioSource, time: number, canvas: OffscreenCanvas): void {
    console.log('VisualEffectManager: Starting process');
    // オーディオパラメータの計算
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

    console.log('VisualEffectManager: Calculated audio parameters', {
      currentTime: time,
      volume: parameters.volume,
      frequency: parameters.frequency
    });

    // エフェクトチェーンの処理
    if (this.effects.length > 0) {
      console.log(`VisualEffectManager: Processing effects chain (${this.effects.length} effects)`);
      // 最初のエフェクトから処理を開始
      this.effects[0].process(parameters, canvas);
    } else {
      console.warn('VisualEffectManager: No effects registered');
    }
    console.log('VisualEffectManager: Process complete');
  }
} 