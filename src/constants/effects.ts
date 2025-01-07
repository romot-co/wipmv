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