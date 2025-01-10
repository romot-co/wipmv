import { AudioVisualParameters } from '../../../types/audio';

export interface VisualNode {
  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;
  process(params: AudioVisualParameters, canvas: HTMLCanvasElement | OffscreenCanvas): void;
  getConfig(): unknown;
  setConfig(config: unknown): void;
} 