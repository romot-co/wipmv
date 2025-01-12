import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters } from '../../core/types';

/**
 * 波形エフェクト
 * オーディオの波形を様々なスタイルで描画する
 */
export class WaveformEffect extends EffectBase {
  constructor(config: WaveformEffectConfig) {
    super(config);
  }

  render(params: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.isVisible(params.currentTime)) return;

    const config = this.getConfig() as WaveformEffectConfig;
    const { position, colors, style, options } = config;
    const { waveformData } = params;

    if (!waveformData) return;

    // 背景の描画
    if (colors.background) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(position.x, position.y, position.width, position.height);
    }

    // 波形の描画
    const barWidth = options?.barWidth || 2;
    const barSpacing = options?.barSpacing || 1;
    const smoothing = options?.smoothing || 0.5;
    const mirror = options?.mirror || false;

    const totalBars = Math.floor(position.width / (barWidth + barSpacing));
    const samplesPerBar = Math.floor(waveformData.length / totalBars);

    ctx.fillStyle = colors.primary;
    if (colors.secondary) {
      ctx.strokeStyle = colors.secondary;
    }

    for (let i = 0; i < totalBars; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        const index = i * samplesPerBar + j;
        if (index < waveformData.length) {
          sum += Math.abs(waveformData[index]);
        }
      }

      const average = sum / samplesPerBar;
      const smoothedHeight = average * smoothing * position.height;

      const x = position.x + i * (barWidth + barSpacing);
      const height = Math.min(smoothedHeight, position.height);

      if (style === 'bar') {
        if (mirror) {
          const y = position.y + (position.height - height) / 2;
          ctx.fillRect(x, y, barWidth, height);
        } else {
          const y = position.y + position.height - height;
          ctx.fillRect(x, y, barWidth, height);
        }
      } else {
        // line style
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, position.y + position.height / 2);
        }
        
        const y = position.y + position.height / 2 - (height / 2);
        ctx.lineTo(x, y);
        
        if (i === totalBars - 1) {
          ctx.stroke();
        }
      }
    }
  }
} 