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
  private previousData: Float32Array | null = null;
  private animationPhase: number = 0;
  private lastRenderTime: number = 0;
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
    if (!this.isVisible(params.currentTime)) return;

    const config = this.getConfig();
    const { width, height } = ctx.canvas;

    // サイズが未設定の場合はキャンバスサイズを使用
    const size: Size2D = {
      width: config.size?.width ?? width,
      height: config.size?.height ?? height / 3
    };

    // 描画データの取得
    const { waveformData, frequencyData } = params;
    console.log('波形データ受信:', {
      hasWaveformData: !!waveformData,
      hasFrequencyData: !!frequencyData,
      waveformType: waveformData?.[0]?.constructor.name,
      frequencyType: frequencyData?.[0]?.constructor.name,
      waveformLength: waveformData?.[0]?.length,
      frequencyLength: frequencyData?.[0]?.length
    });

    if (!waveformData?.[0] || !(waveformData[0] instanceof Float32Array)) {
      console.warn('波形データが存在しないか、不正な型です');
      return;
    }

    // 型チェックと安全な変換
    const waveformArray = waveformData[0];
    const frequencyArray = frequencyData?.[0] instanceof Uint8Array 
      ? frequencyData[0] 
      : new Uint8Array(1024).fill(0);

    const visualData = this.processVisualData(waveformArray, frequencyArray);
    if (!visualData) {
      console.warn('波形データの処理に失敗しました');
      return;
    }

    console.log('描画準備:', {
      canvasSize: { width, height },
      effectSize: size,
      waveformRange: [Math.min(...visualData.waveform), Math.max(...visualData.waveform)],
      config: {
        position: config.position,
        opacity: config.opacity,
        waveformType: config.waveformType
      }
    });

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

      // アニメーションの更新
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastRenderTime) / 1000;
      this.lastRenderTime = currentTime;
      this.updateAnimation(deltaTime);

      // 波形の描画
      const drawOptions: DrawOptions = {
        position: config.position ?? { x: 0, y: 0 },
        size,
        data: visualData.waveform,
        color: config.color ?? '#ffffff',
        opacity: config.opacity ?? 1,
        barWidth: config.barWidth ?? 2,
        barSpacing: config.barSpacing ?? 1,
        mirror: config.mirror ?? false,
        sensitivity: config.sensitivity ?? 1.0,
        previousData: this.previousData ?? undefined,
        interpolationFactor: config.smoothingFactor ?? 0.5,
        animation: config.animation
      };

      switch (config.waveformType) {
        case 'line':
          this.drawLineWaveform(ctx, drawOptions);
          break;
        case 'circle':
          this.drawCircleWaveform(ctx, drawOptions);
          break;
        case 'bar':
        default:
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

  private getColorForFrequency(frequency: number): string {
    const config = this.getConfig();
    if (!config.useColorBands) return config.color ?? '#ffffff';

    for (const band of this.colorBands) {
      if (frequency <= band.frequency) {
        return band.color;
      }
    }
    return this.colorBands[this.colorBands.length - 1].color;
  }

  /**
   * 波形データの処理
   */
  private processVisualData(
    waveformData: Float32Array,
    frequencyData: Uint8Array
  ): { waveform: Float32Array; frequency: Float32Array } | null {
    try {
      const config = this.getConfig();
      const sensitivity = config.sensitivity ?? 1.0;

      // 波形データの正規化とリサンプリング
      const targetSamples = Math.min(waveformData.length, 256); // 表示用のサンプル数（最大256）
      const normalizedWaveform = new Float32Array(targetSamples);
      const samplesPerBin = Math.max(1, Math.floor(waveformData.length / targetSamples));

      // RMSベースの振幅計算
      for (let i = 0; i < targetSamples; i++) {
        let sumSquares = 0;
        let count = 0;
        const startIdx = i * samplesPerBin;
        const endIdx = Math.min(startIdx + samplesPerBin, waveformData.length);

        for (let j = startIdx; j < endIdx; j++) {
          sumSquares += waveformData[j] * waveformData[j];
          count++;
        }

        // RMS（二乗平均平方根）を計算
        normalizedWaveform[i] = Math.sqrt(sumSquares / (count || 1)) * sensitivity;
      }

      // 周波数データの正規化とリサンプリング
      const normalizedFrequency = new Float32Array(targetSamples);
      const freqSamplesPerBin = Math.max(1, Math.floor(frequencyData.length / targetSamples));

      for (let i = 0; i < targetSamples; i++) {
        let sum = 0;
        let count = 0;
        const startIdx = i * freqSamplesPerBin;
        const endIdx = Math.min(startIdx + freqSamplesPerBin, frequencyData.length);

        for (let j = startIdx; j < endIdx; j++) {
          sum += frequencyData[j];
          count++;
        }

        normalizedFrequency[i] = (count > 0 ? (sum / count) / 255 : 0) * sensitivity;
      }

      // スムージングの適用
      if (this.previousData && config.smoothingFactor && config.smoothingFactor > 0) {
        const smoothingFactor = config.smoothingFactor;
        for (let i = 0; i < normalizedWaveform.length; i++) {
          normalizedWaveform[i] = 
            this.previousData[i] * (1 - smoothingFactor) +
            normalizedWaveform[i] * smoothingFactor;
        }
      }

      // 前回のデータを保存
      this.previousData = normalizedWaveform.slice();

      return {
        waveform: normalizedWaveform,
        frequency: normalizedFrequency
      };

    } catch (error) {
      console.error('波形データの処理エラー:', error);
      return null;
    }
  }

  private updateAnimation(deltaTime: number): void {
    const config = this.getConfig();
    if (!config.animation) return;

    this.animationPhase += config.animation.intensity * deltaTime;
    if (this.animationPhase > Math.PI * 2) {
      this.animationPhase -= Math.PI * 2;
    }
  }

  private drawBarWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { position, size, data, barWidth, barSpacing, mirror } = options;
    const config = this.getConfig();

    // バーの数を計算（データ点の数に基づく）
    const numBars = Math.min(data.length, Math.floor(size.width / (barWidth + barSpacing)));
    const samplesPerBar = Math.ceil(data.length / numBars);

    // パスを使用してバッチ描画
    ctx.beginPath();
    ctx.fillStyle = options.color;

    for (let i = 0; i < numBars; i++) {
      // データの平均値を計算
      let sum = 0;
      let count = 0;
      const startIdx = i * samplesPerBar;
      const endIdx = Math.min(startIdx + samplesPerBar, data.length);

      for (let j = startIdx; j < endIdx; j++) {
        sum += data[j];
        count++;
      }

      const value = count > 0 ? sum / count : 0;

      // バーの高さを計算（対数スケールを適用）
      const normalizedValue = Math.min(Math.max(value, 0), 1);
      let barHeight = normalizedValue * size.height;

      // アニメーション効果の適用
      if (config.animation) {
        const animationFactor = 1 + Math.sin(this.animationPhase + i * 0.1) * 0.3;
        barHeight *= animationFactor;
      }

      // バーの位置を計算
      const x = position.x + i * (barWidth + barSpacing);
      const y = position.y + (mirror ? size.height / 2 : size.height) - barHeight;

      // バーを描画
      ctx.rect(x, y, barWidth, barHeight);

      // ミラーモードの場合は下側にも描画
      if (mirror) {
        const mirrorY = position.y + size.height / 2;
        ctx.rect(x, mirrorY, barWidth, barHeight);
      }
    }

    ctx.fill();
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
    ctx.strokeStyle = this.getColorForFrequency(0);
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