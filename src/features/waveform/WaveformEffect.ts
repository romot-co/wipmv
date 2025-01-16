import { EffectBase } from '../../core/EffectBase';
import {
  WaveformEffectConfig,
  AudioVisualParameters,
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
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // サイズを計算（相対値から実際のピクセル値に変換）
    const effectiveWidth = Math.floor(canvasWidth * (config.size?.width ?? 0.8));
    const effectiveHeight = Math.floor(canvasHeight * (config.size?.height ?? 0.3));

    // 位置を計算（中央配置）
    const effectiveX = Math.floor((canvasWidth - effectiveWidth) / 2);
    const effectiveY = Math.floor((canvasHeight - effectiveHeight) / 2);

    // 波形データの取得と前処理
    const visualData = this.processVisualData(
      params.waveformData?.[0] ?? new Float32Array(),
      params.frequencyData?.[0] ?? new Uint8Array()
    );

    if (!visualData) return;

    // アニメーション更新
    const deltaTime = (params.currentTime - this.lastRenderTime) || 0;
    this.updateAnimation(deltaTime);
    this.lastRenderTime = params.currentTime;

    // 描画オプションの設定
    const drawOptions: DrawOptions = {
      position: { x: effectiveX, y: effectiveY },
      size: { width: effectiveWidth, height: effectiveHeight },
      data: visualData.waveform,
      color: config.color ?? '#ffffff',
      opacity: config.opacity ?? 1,
      barWidth: config.barWidth ?? 2,
      barSpacing: config.barSpacing ?? 1,
      mirror: config.mirror ?? false,
      sensitivity: config.sensitivity ?? 1.0,
      previousData: this.previousData ?? undefined,
      interpolationFactor: 0.5,
      animation: config.animation
    };

    // 波形タイプに応じた描画
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

    // 前回のデータを保存
    this.previousData = visualData.waveform;
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
      const sensitivity = config.sensitivity ?? 2.0;

      // デバッグ情報: 入力データの状態
      console.log('[DEBUG] processVisualData 入力:', {
        waveformLength: waveformData.length,
        frequencyLength: frequencyData.length,
        waveformRange: [Math.min(...waveformData), Math.max(...waveformData)],
        frequencyRange: [Math.min(...frequencyData), Math.max(...frequencyData)],
        sensitivity
      });

      // 波形データの最適化処理
      const targetSamples = Math.min(waveformData.length, 256);
      const normalizedWaveform = new Float32Array(targetSamples);
      const samplesPerBin = Math.max(1, Math.floor(waveformData.length / targetSamples));

      // RMSベースの振幅計算
      for (let i = 0; i < targetSamples; i++) {
        let sumSquares = 0;
        const startIdx = i * samplesPerBin;
        const endIdx = Math.min(startIdx + samplesPerBin, waveformData.length);
        let count = 0;

        for (let j = startIdx; j < endIdx; j++) {
          const amp = waveformData[j];
          sumSquares += amp * amp;
          count++;
        }

        // RMS値を計算し、感度で調整
        normalizedWaveform[i] = Math.sqrt(sumSquares / count) * sensitivity;
      }

      // 周波数データの最適化
      const normalizedFrequency = new Float32Array(targetSamples);

      // 対数スケールでの周波数マッピング
      for (let i = 0; i < targetSamples; i++) {
        const logIndex = Math.floor(Math.exp(Math.log(1 + frequencyData.length) * i / targetSamples)) - 1;
        let sum = 0;
        let count = 0;

        // 周辺の周波数も考慮（スムージング効果）
        const binStart = Math.max(0, logIndex - 1);
        const binEnd = Math.min(frequencyData.length, logIndex + 2);

        for (let j = binStart; j < binEnd; j++) {
          const weight = 1 - Math.abs(j - logIndex) * 0.5;
          sum += (frequencyData[j] / 255) * weight;
          count += weight;
        }

        normalizedFrequency[i] = (sum / count) * sensitivity;
      }

      // スムージング処理
      if (this.previousData && this.previousData.length === normalizedWaveform.length) {
        const smoothingFactor = Math.min(config.smoothingFactor ?? 0.3, 0.3);
        const momentum = 1 - smoothingFactor;

        for (let i = 0; i < normalizedWaveform.length; i++) {
          // 現在値と前回値の指数移動平均
          const currentValue = normalizedWaveform[i];
          const previousValue = this.previousData[i];
          
          // 急激な変化を抑制
          const maxChange = 0.2;
          const targetValue = previousValue + Math.max(
            Math.min(currentValue - previousValue, maxChange),
            -maxChange
          );
          
          normalizedWaveform[i] = previousValue * momentum + targetValue * smoothingFactor;
        }
      }

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

    // フレームレートに依存しない一定の更新速度を確保
    const normalizedDeltaTime = Math.min(deltaTime, 1/30);
    this.animationPhase += config.animation.intensity * normalizedDeltaTime;
    
    // 位相をリセット
    while (this.animationPhase > Math.PI * 2) {
      this.animationPhase -= Math.PI * 2;
    }
  }

  private drawBarWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { position, size, data, color, opacity, barWidth, barSpacing, mirror, sensitivity } = options;
    const { width, height } = size;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    // データポイントの数を計算
    const numPoints = Math.min(data.length, Math.floor(width / (barWidth + barSpacing)));
    const samplesPerPoint = Math.ceil(data.length / numPoints);

    // 描画開始位置を調整（中央揃え）
    const startX = position.x;
    const centerY = position.y + height / 2;

    // 各バーのデータを計算して描画
    for (let i = 0; i < numPoints; i++) {
      // データの平均値を計算
      let sum = 0;
      let count = 0;
      const startIdx = i * samplesPerPoint;
      const endIdx = Math.min(startIdx + samplesPerPoint, data.length);

      for (let j = startIdx; j < endIdx; j++) {
        sum += Math.abs(data[j]);
        count++;
      }

      const amplitude = (count > 0 ? sum / count : 0) * sensitivity;
      const barHeight = Math.min(height * 0.9, amplitude * height); // 最大高さを90%に制限

      const x = startX + i * (barWidth + barSpacing);

      if (mirror) {
        // 上下対称に描画
        const halfBarHeight = barHeight / 2;
        ctx.fillRect(
          x,
          centerY - halfBarHeight,
          barWidth,
          halfBarHeight
        );
        ctx.fillRect(
          x,
          centerY,
          barWidth,
          halfBarHeight
        );
      } else {
        // 下から上に描画
        ctx.fillRect(
          x,
          position.y + height - barHeight,
          barWidth,
          barHeight
        );
      }
    }

    ctx.restore();
  }

  /**
   * ライン型波形の描画
   */
  private drawLineWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawOptions
  ): void {
    const { position, size, data, color, mirror, sensitivity } = options;
    
    // 描画の準備
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // データポイント間の間隔を計算
    const pointSpacing = size.width / (data.length - 1);
    
    // 中央線の位置を計算（ミラーモードの場合は上部から開始）
    const centerY = position.y + (mirror ? 0 : size.height / 2);

    // 最初のポイントを設定
    const initialValue = Math.abs(data[0]) * sensitivity;
    const scaledInitialValue = initialValue * (size.height / 2);
    ctx.moveTo(position.x, centerY + (mirror ? scaledInitialValue : -scaledInitialValue));

    // 波形を描画
    for (let i = 0; i < data.length; i++) {
      const x = position.x + (i * pointSpacing);
      const value = Math.abs(data[i]) * sensitivity;
      const scaledValue = value * (size.height / 2);
      
      if (mirror) {
        // ミラーモード: 上部から下に向かって描画
        ctx.lineTo(x, centerY + scaledValue);
      } else {
        // 通常モード: 中央線を基準に上下に描画
        ctx.lineTo(x, centerY - scaledValue);
      }
    }

    // ミラーモードの場合、反転した波形を描画
    if (mirror) {
      for (let i = data.length - 1; i >= 0; i--) {
        const x = position.x + (i * pointSpacing);
        const value = Math.abs(data[i]) * sensitivity;
        const scaledValue = value * (size.height / 2);
        ctx.lineTo(x, centerY - scaledValue);
      }
      ctx.closePath();
    }

    ctx.stroke();
    
    // ミラーモードの場合は塗りつぶしも追加
    if (mirror) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
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