import { EffectType, EffectConfig } from './types';

/**
 * デフォルトのエフェクト設定一式を生成
 */
export const createDefaultEffects = (duration: number): EffectConfig[] => {
  return [
    // 背景エフェクト（黒背景）
    {
      id: `background-${Date.now()}`,
      type: EffectType.Background,
      backgroundType: 'color',
      color: '#000000',
      zIndex: 0,
      visible: true,
      startTime: 0,
      endTime: duration
    },

    // 波形エフェクト（中央配置）
    {
      id: `waveform-${Date.now()}`,
      type: EffectType.Waveform,
      position: {
        x: 0,
        y: 260,  // 中央よりやや下
        width: 1280,
        height: 200
      },
      colors: {
        primary: '#4a9eff',
        secondary: '#0066cc'
      },
      options: {
        style: 'bar',
        analysisMode: 'realtime',
        barWidth: 4,
        barSpacing: 2,
        smoothing: 0.5,
        segmentCount: 128
      },
      zIndex: 1,
      visible: true,
      startTime: 0,
      endTime: duration
    },

    // タイトルテキスト（上部中央）
    {
      id: `text-title-${Date.now()}`,
      type: EffectType.Text,
      text: 'タイトル',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center',
        baseline: 'middle'
      },
      position: {
        x: 640,  // 画面中央
        y: 100   // 上部
      },
      zIndex: 2,
      visible: true,
      startTime: 0,
      endTime: duration
    },

    // ウォーターマーク（右下）
    {
      id: `watermark-${Date.now()}`,
      type: EffectType.Watermark,
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5XSVBNVjwvdGV4dD48L3N2Zz4=',
      position: {
        x: 1160,  // 右端から120px
        y: 600,   // 下端から120px
        width: 100,
        height: 100,
        scale: 1,
        rotation: 0
      },
      style: {
        opacity: 0.5,
        blendMode: 'source-over'
      },
      zIndex: 3,
      visible: true,
      startTime: 0,
      endTime: duration
    }
  ];
}; 