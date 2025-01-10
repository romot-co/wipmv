import { AudioAnalysis } from '../core/audio';

export interface RenderContext {
  currentTime: number;
  audioAnalysis: AudioAnalysis | null;
  canvasWidth: number;
  canvasHeight: number;
}

export interface VisualEffect {
  type: 'background' | 'waveform' | 'text' | 'watermark';
  opacity: number;
  blendMode: GlobalCompositeOperation;
  render(ctx: CanvasRenderingContext2D, renderContext: RenderContext): void;
} 