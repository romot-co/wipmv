import { EffectBase } from '../../core/EffectBase';
import {
  WaveformEffectConfig,
  AudioVisualParameters,
  AppError,
  ErrorType,
  EffectType,
  Position2D,
  Size2D
} from '../../core/types';

interface WaveformAnimation {
  type: 'scale' | 'rotate' | 'pulse' | 'morph';
  duration: number;
  intensity: number;
  phase: number;
}

interface DrawOptions {
  position: Position2D;
  size: Size2D;
  data: Float32Array | Uint8Array;
  color: string;
  opacity: number;
  barWidth: number;
  barSpacing: number;
  mirror: boolean;
  sensitivity: number;
  previousData?: Float32Array | Uint8Array;
  interpolationFactor?: number;
  animation?: WaveformAnimation;
}

interface ColorBand {
  frequency: number;
  color: string;
  gradient?: {
    start: string;
    end: string;
  };
}

/**
 * 波形エフェクト
 * - 波形の描画（バー/ライン/サークル）
 * - 周波数データの視覚化
 * - 反転表示オプション
 * - 周波数帯域ごとの色分け
 * - スムーズなアニメーション
 */
export class WaveformEffect extends EffectBase<WaveformEffectConfig> {
  private previousData: Float32Array | Uint8Array | null = null;
  private animationPhase: number = 0;
  private readonly colorBands: ColorBand[] = [
    { 
      frequency: 60,
      color: '#ff0000',
      gradient: {
        start: '#ff0000',
        end: '#ff6666'
      }
    },
    { 
      frequency: 250,
      color: '#ffff00',
      gradient: {
        start: '#ffff00',
        end: '#ffff66'
      }
    },
    { 
      frequency: 2000,
      color: '#00ff00',
      gradient: {
        start: '#00ff00',
        end: '#66ff66'
      }
    },
    { 
      frequency: 6000,
      color: '#00ffff',
      gradient: {
        start: '#00ffff',
        end: '#66ffff'
      }
    },
    { 
      frequency: 20000,
      color: '#0000ff',
      gradient: {
        start: '#0000ff',
        end: '#6666ff'
      }
    }
  ];

  constructor(config: WaveformEffectConfig) {
    super({
      ...config,
      type: EffectType.Waveform,
      waveformType: config.waveformType ?? 'bar',
      color: config.color ?? '#ffffff',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over',
      barWidth: config.barWidth ?? 2,
      barSpacing: config.barSpacing ?? 1,
      mirror: config.mirror ?? false,
      position: config.position ?? { x: 0, y: 0 },
      size: config.size ?? { width: 0, height: 0 },
      sensitivity: config.sensitivity ?? 1.0,
      useColorBands: config.useColorBands ?? false,
      smoothingFactor: config.smoothingFactor ?? 0.5,
      animation: config.animation ?? { type: 'pulse', duration: 2000, intensity: 0.3, phase: 0 }
    });
  }

  protected override onConfigUpdate(oldConfig: WaveformEffectConfig, newConfig: WaveformEffectConfig): void {
    if (newConfig.waveformType !== oldConfig.waveformType) {
      this.previousData = null;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) {
      console.log('波形エフェクト: 非表示状態');
      return;
    }

    const config = this.getConfig();
    console.log('波形エフェクト設定:', config);
    
    const { width, height } = ctx.canvas;
    console.log('キャンバスサイズ:', { width, height });

    // サイズが未設定の場合はキャンバスサイズを使用
    const size: Size2D = {
      width: config.size?.width ?? width,
      height: config.size?.height ?? height / 3
    };
    console.log('描画サイズ:', size);

    // 描画データの取得
    const data = this.getVisualizationData(params);
    if (!data || data.length === 0) {
      console.log('波形データなし');
      return;
    }
    console.log('波形データ長:', data.length, '最大値:', Math.max(...Array.from(data)));

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

      // 波形の描画
      const drawOptions: DrawOptions = {
        position: config.position,
        size,
        data,
        color: config.color,
        opacity: config.opacity ?? 1,
        barWidth: config.barWidth ?? 2,
        barSpacing: config.barSpacing ?? 1,
        mirror: config.mirror ?? false,
        sensitivity: config.sensitivity ?? 1.0,
        previousData: this.previousData ?? undefined,
        interpolationFactor: config.smoothingFactor
      };
      console.log('描画オプション:', drawOptions);

      switch (config.waveformType) {
        case 'line':
          console.log('ライン波形を描画');
          this.drawLineWaveform(ctx, drawOptions);
          break;
        case 'circle':
          console.log('サークル波形を描画');
          this.drawCircleWaveform(ctx, drawOptions);
          break;
        case 'bar':
        default:
          console.log('バー波形を描画');
          this.drawBarWaveform(ctx, drawOptions);
          break;
      }
    } catch (error) {
      console.error('波形描画エラー:', error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Failed to render waveform effect',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      ctx.restore();
    }
  }

  /**
   * 描画用のデータを取得し、補間処理を適用
   */
  private getVisualizationData(params: AudioVisualParameters): Float32Array | Uint8Array | null {
    const config = this.getConfig();
    console.log('オーディオパラメータ:', {
      hasFrequencyData: !!params.frequencyData,
      hasWaveformData: !!params.waveformData,
      currentTime: params.currentTime,
      frequencyDataLength: params.frequencyData?.length,
      waveformDataLength: params.waveformData?.length
    });
    
    // 波形データまたは周波数データを取得（配列の場合は最初のチャンネルを使用）
    const currentData = params.frequencyData || params.waveformData;
    if (!currentData) {
      console.warn('オーディオデータなし - パラメータ:', params);
      return null;
    }

    // データを正規化（0-1の範囲に）
    const normalizedData = new Float32Array(currentData.length);
    const maxValue = Math.max(...Array.from(currentData).map(Math.abs));
    console.log('データ正規化:', {
      dataLength: currentData.length,
      maxValue,
      firstValue: currentData[0],
      lastValue: currentData[currentData.length - 1]
    });
    
    for (let i = 0; i < currentData.length; i++) {
      normalizedData[i] = maxValue > 0 ? Math.abs(currentData[i]) / maxValue : 0;
    }

    // 前回のデータがない場合は現在のデータを使用
    if (!this.previousData || this.previousData.length !== normalizedData.length) {
      console.log('前回データなし - 新規データを使用:', {
        length: normalizedData.length,
        firstValue: normalizedData[0],
        lastValue: normalizedData[normalizedData.length - 1]
      });
      this.previousData = new Float32Array(normalizedData);
      return normalizedData;
    }

    // データの補間処理
    const interpolatedData = new Float32Array(normalizedData.length);
    const smoothingFactor = config.smoothingFactor ?? 0.5;

    // 補間アルゴリズムの改善
    for (let i = 0; i < normalizedData.length; i++) {
      // 現在のデータと前回のデータの差分を計算
      const diff = normalizedData[i] - this.previousData[i];
      
      // 急激な変化を検出し、補間を調整
      const absDiff = Math.abs(diff);
      const adjustedSmoothingFactor = absDiff > 0.5 
        ? Math.min(smoothingFactor * 1.5, 1.0) 
        : smoothingFactor;

      // イージング関数を適用した補間
      const t = this.easeInOutQuad(adjustedSmoothingFactor);
      interpolatedData[i] = this.previousData[i] + diff * t;
    }

    // 前回のデータを更新
    this.previousData = new Float32Array(normalizedData);

    return interpolatedData;
  }

  /**
   * イージング関数（2次ベジェ曲線）
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * 周波数に応じた色とグラデーションを取得
   */
  private getColorForFrequency(frequency: number, defaultColor: string): string | CanvasGradient {
    const config = this.getConfig();
    if (!config.useColorBands) return defaultColor;

    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return defaultColor;

    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    const frequencyHz = (frequency / this.colorBands.length) * nyquist;

    for (const band of this.colorBands) {
      if (frequencyHz <= band.frequency && band.gradient) {
        // グラデーションの作成
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, band.gradient.start);
        gradient.addColorStop(1, band.gradient.end);
        return gradient;
      }
    }

    return defaultColor;
  }

  /**
   * アニメーション効果の適用
   */
  private applyAnimation(value: number, x: number, y: number, config: WaveformEffectConfig): number {
    if (!config.animation) return value;

    const { type, intensity, phase } = config.animation;
    const time = performance.now() / 1000;
    this.animationPhase = (this.animationPhase + 0.016) % (Math.PI * 2); // 60FPSを想定

    switch (type) {
      case 'scale':
        return value * (1 + Math.sin(this.animationPhase) * intensity);
      case 'pulse':
        return value * (1 + Math.sin(time * Math.PI / phase) * intensity);
      case 'rotate': {
        const angle = this.animationPhase;
        return value * (1 + Math.sin(angle + x / 50) * intensity);
      }
      case 'morph':
        return value * (1 + Math.sin(x / 50 + time) * Math.cos(y / 50 + time) * intensity);
      default:
        return value;
    }
  }

  /**
   * バー型波形の描画（アニメーション対応）
   */
  private drawBarWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { data, position, size, barWidth, barSpacing, mirror, sensitivity } = options;
    // const config = this.getConfig(); // TODO: アニメーション実装時に使用

    // バーの数を計算
    const numBars = Math.floor(size.width / (barWidth + barSpacing));
    const step = Math.ceil(data.length / numBars);

    // 各バーの描画
    for (let i = 0; i < numBars; i++) {
      // データの平均値を計算
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step && i * step + j < data.length; j++) {
        sum += Math.abs(data[i * step + j]);
        count++;
      }
      const value = (sum / count) * sensitivity;

      // バーの高さを計算（0-1の範囲に正規化）
      const normalizedValue = Math.min(Math.max(value, 0), 1);
      const barHeight = normalizedValue * size.height;

      // バーの位置を計算
      const x = position.x + i * (barWidth + barSpacing);
      const y = position.y + (mirror ? size.height / 2 : size.height) - barHeight;

      // バーの色を取得
      const color = this.getColorForFrequency(i / numBars, options.color);
      if (typeof color === 'string') {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = color;
      }

      // バーを描画
      ctx.fillRect(x, y, barWidth, barHeight);

      // ミラーモードの場合は下側にも描画
      if (mirror) {
        const mirrorY = position.y + size.height / 2;
        ctx.fillRect(x, mirrorY, barWidth, barHeight);
      }
    }
  }

  /**
   * ライン型波形の描画
   */
  private drawLineWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { position, size, data, color, mirror, sensitivity } = options;
    const step = Math.ceil(data.length / size.width);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < size.width; i++) {
      // データのサンプリング
      let value = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < data.length) {
          value = Math.max(value, Math.abs(data[index]));
        }
      }

      // 感度調整
      value = Math.min(value * sensitivity, 1);

      const x = position.x + i;
      if (i === 0) {
        ctx.moveTo(x, position.y + (mirror ? 0 : size.height * (1 - value)));
      } else {
        ctx.lineTo(x, position.y + (mirror ? size.height * value / 2 : size.height * (1 - value)));
      }
    }

    if (mirror) {
      // 反転した波形を描画
      for (let i = size.width - 1; i >= 0; i--) {
        let value = 0;
        for (let j = 0; j < step; j++) {
          const index = i * step + j;
          if (index < data.length) {
            value = Math.max(value, Math.abs(data[index]));
          }
        }
        value = Math.min(value * sensitivity, 1);
        const x = position.x + i;
        ctx.lineTo(x, position.y + size.height * (1 - value / 2));
      }
    }

    ctx.stroke();
  }

  /**
   * サークル型波形の描画
   */
  private drawCircleWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { position, size, data, color, sensitivity } = options;
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    const radius = Math.min(size.width, size.height) / 2;
    const step = Math.ceil(data.length / 360);

    // パスの描画を最適化
    const path = new Path2D();

    for (let i = 0; i < 360; i++) {
      // データのサンプリング
      let value = 0;
      for (let j = 0; j < step; j++) {
        const index = (i * step + j) % data.length;
        value = Math.max(value, Math.abs(data[index]));
      }

      // 感度調整
      value = Math.min(value * sensitivity, 1);

      // 角度と半径から座標を計算
      const angle = (i * Math.PI) / 180;
      const r = radius * (1 + value * 0.5);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    // パスを閉じる
    path.closePath();

    // 描画スタイルの設定
    ctx.strokeStyle = this.getColorForFrequency(0, color);
    ctx.lineWidth = 2;
    ctx.stroke(path);

    // 内側の円を描画（基準線）
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.stroke();
  }

  public dispose(): void {
    super.dispose();
    this.previousData = null;
  }
} 