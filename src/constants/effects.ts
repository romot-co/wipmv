import { BackgroundEffectOptions } from '../services/effects/effects/background/BackgroundEffect';
import { WaveformEffectConfig } from '../types/effects/waveform';

export const EFFECT_TYPES = {
  WAVEFORM: 'waveform',
  BAR_DRAWER: 'barDrawer',
  RADIAL_BAR_DRAWER: 'radialBarDrawer',
  COLOR_CYCLER: 'colorCycler',
  OPACITY: 'opacity',
  CANVAS_SIZE: 'canvasSize',
  BLEND: 'blend',
} as const;

export const DEFAULT_WAVEFORM_OPTIONS = {
  color: '#ffffff',
  lineWidth: 2,
  opacity: 1,
} as const;

export const DEFAULT_BAR_DRAWER_OPTIONS = {
  barColor: '#ffffff',
  barWidth: 10,
  barSpacing: 2,
} as const;

export const DEFAULT_RADIAL_BAR_DRAWER_OPTIONS = {
  ...DEFAULT_BAR_DRAWER_OPTIONS,
  centerX: 0.5,
  centerY: 0.5,
  radius: 0.4,
  drawDirection: 'outer',
} as const;

export const DEFAULT_COLOR_CYCLER_OPTIONS = {
  cycleSpeed: 1,
} as const;

export const DEFAULT_OPACITY_OPTIONS = {
  opacity: 1,
} as const;

export const DEFAULT_CANVAS_SIZE_OPTIONS = {
  width: 1920,
  height: 1080,
} as const;

export const DEFAULT_BLEND_OPTIONS = {
  blendMode: 'source-over' as GlobalCompositeOperation,
} as const;

/**
 * エフェクトのデフォルト設定
 */
export const DEFAULT_BACKGROUND_EFFECT: BackgroundEffectOptions = {
  color: '#555555',
  gradient: {
    type: 'linear',
    colors: ['#000000', '#ffffff'],
    stops: [0, 1]
  },
  opacity: 1.0,
  blendMode: 'source-over'
};

/**
 * 波形エフェクトのデフォルト設定
 */
export const DEFAULT_WAVEFORM_EFFECT: WaveformEffectConfig = {
  type: 'waveform',
  data: {
    amplification: 1.0,
    smoothing: 0.5
  },
  style: {
    type: 'bars',
    color: '#ffffff',
    lineWidth: 2,
    height: 0.8,
    verticalPosition: 50,
    barWidth: 10,
    barSpacing: 2
  },
  opacity: 1.0,
  blendMode: 'source-over'
}; 