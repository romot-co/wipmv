import { VisualEffect } from './VisualEffect';
import { AudioVisualParameters } from '../../types/audio';

export class VisualEffectManager {
  private effects: VisualEffect[] = [];
  private initialized: boolean = false;

  constructor() {
    console.log('VisualEffectManager: Created');
  }

  registerEffect(effect: VisualEffect): void {
    this.effects.push(effect);
    console.log(`VisualEffectManager: Registered effect ${effect.getName()}`);
  }

  clearEffects(): void {
    this.effects = [];
    this.initialized = false;
    console.log('VisualEffectManager: Cleared all effects');
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    console.log('VisualEffectManager: Initializing effects', {
      count: this.effects.length,
      effects: this.effects
    });

    try {
      this.effects.forEach((effect, i) => {
        console.log(`VisualEffectManager: Initializing effect ${i} ${effect.getName()}`);
        effect.initialize(canvas, context);
      });

      this.initialized = true;
      console.log('VisualEffectManager: Initialization complete');
    } catch (error) {
      console.error('VisualEffectManager: Initialization failed', error);
      throw error;
    }
  }

  processEffects(params: AudioVisualParameters, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (!this.initialized) {
      console.warn('VisualEffectManager: Not initialized');
      return;
    }

    const backgroundEffect = this.getBackgroundEffect();
    if (backgroundEffect) {
      backgroundEffect.process(params, canvas);
    }

    this.processNonBackgroundEffects(params, canvas);
  }

  getBackgroundEffect(): VisualEffect | null {
    return this.effects.find(effect => effect.getName() === 'background') || null;
  }

  processNonBackgroundEffects(params: AudioVisualParameters, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (!this.initialized) {
      console.warn('VisualEffectManager: Not initialized');
      return;
    }

    this.effects
      .filter(effect => effect.getName() !== 'background')
      .forEach(effect => {
        effect.process(params, canvas);
      });
  }

  getEffectCount(): number {
    return this.effects.length;
  }

  reset(): void {
    this.initialized = false;
    console.log('VisualEffectManager: Reset');
  }
} 