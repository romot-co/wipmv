import { EffectBase } from '../../core/EffectBase';
import { AudioSource, WaveformEffectConfig } from '../../core/types';

/**
 * 波形エフェクト
 * - 音声波形の描画を担当
 * - currentTimeに応じて波形データをスライスして表示
 */
export class WaveformEffect extends EffectBase<WaveformEffectConfig> {
  private audioSource: AudioSource | null = null;
  private currentWaveformData: Float32Array[] | null = null;
  private currentFrequencyData: Uint8Array[] | null = null;

  constructor(config: WaveformEffectConfig) {
    super({
      ...config,
      color: config.color ?? '#ffffff',
      barWidth: config.barWidth ?? 3,
      barSpacing: config.barSpacing ?? 1,
      size: {
        width: config.size?.width ?? 0.95,
        height: config.size?.height ?? 0.2
      }
    });
  }

  /**
   * 音声ソースを設定
   */
  setAudioSource(source: AudioSource): void {
    this.audioSource = source;
    console.log('波形エフェクト: 音声ソース設定完了', {
      hasWaveformData: !!source.waveformData,
      hasFrequencyData: !!source.frequencyData
    });
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (!this.audioSource?.waveformData) return;

    // 波形データの取り出し
    const totalFrames = this.audioSource.waveformData[0].length;
    const duration = this.audioSource.duration;
    
    // 再生位置の正規化（0.0 ~ 1.0）
    const ratio = Math.max(0, Math.min(currentTime / duration, 1.0));
    
    // 現在のフレームインデックスを計算
    const currentFrameIndex = Math.floor(ratio * (totalFrames - 1));
    
    // ウィンドウサイズを動的に計算（1秒あたり60フレームで、前後0.5秒分を表示）
    const SECONDS_TO_SHOW = 0.5;
    const samplesPerSecond = 60;
    const windowSize = Math.floor(SECONDS_TO_SHOW * samplesPerSecond * 2);
    
    // スライス範囲を計算（現在位置を中心に）
    const halfWindow = Math.floor(windowSize / 2);
    const startIndex = Math.max(0, currentFrameIndex - halfWindow);
    const endIndex = Math.min(startIndex + windowSize, totalFrames);

    // 波形データを取得
    this.currentWaveformData = this.audioSource.waveformData.map(channel => {
      return channel.slice(startIndex, endIndex);
    });

    // 周波数データも同様に処理
    if (this.audioSource.frequencyData) {
      this.currentFrequencyData = this.audioSource.frequencyData.map(channel => {
        return channel.slice(startIndex, endIndex);
      });
    }
  }

  /**
   * 波形を描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.currentWaveformData || this.currentWaveformData.length === 0) return;

    const { width, height } = ctx.canvas;
    const {
      color = '#ffffff',
      barWidth = 3,
      barSpacing = 1,
      size = { width: 0.95, height: 0.2 },
      waveformType = 'bar',
      mirror = false,
      sensitivity = 2.0,
      position = { x: 0, y: 0 },
      opacity = 1.0,
      blendMode = 'source-over'
    } = this.config;

    // 描画領域の計算
    const drawWidth = width * size.width;
    const drawHeight = height * size.height;
    const drawX = (width - drawWidth) / 2 + (position.x * width);
    const drawY = (height - drawHeight) / 2 + (position.y * height);

    // 描画スタイルの設定
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = color;

    const channel = this.currentWaveformData[0]; // モノラル or 左チャンネル

    switch (waveformType) {
      case 'bar':
        this.renderBars(ctx, channel, drawWidth, drawHeight, barWidth, barSpacing, mirror, sensitivity);
        break;
      case 'line':
        this.renderLine(ctx, channel, drawWidth, drawHeight, mirror, sensitivity);
        break;
      case 'circle':
        this.renderCircle(ctx, channel, drawWidth, drawHeight, sensitivity);
        break;
    }

    ctx.restore();
  }

  /**
   * バー型の波形を描画
   */
  private renderBars(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    barWidth: number,
    barSpacing: number,
    mirror: boolean,
    sensitivity: number
  ): void {
    // バーの数を計算（全体幅から逆算）
    const totalWidth = width;
    const barCount = Math.floor(totalWidth / (barWidth + barSpacing));
    const samplesPerBar = Math.max(1, Math.floor(data.length / barCount));

    // バー幅とスペースを調整して全体幅を埋める
    const adjustedBarWidth = barWidth;
    const adjustedSpacing = (totalWidth - (barCount * barWidth)) / (barCount - 1);

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const startSample = i * samplesPerBar;
      const endSample = Math.min(startSample + samplesPerBar, data.length);
      
      for (let j = startSample; j < endSample; j++) {
        sum += Math.abs(data[j]);
      }
      
      const amplitude = (sum / samplesPerBar) * sensitivity;
      const barHeight = amplitude * height;
      
      const x = i * (adjustedBarWidth + adjustedSpacing);
      if (mirror) {
        const y = (height - barHeight) / 2;
        ctx.fillRect(x, y, adjustedBarWidth, barHeight);
      } else {
        const y = height - barHeight;
        ctx.fillRect(x, y, adjustedBarWidth, barHeight);
      }
    }
  }

  /**
   * ライン型の波形を描画
   */
  private renderLine(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    mirror: boolean,
    sensitivity: number
  ): void {
    const step = width / (data.length - 1); // 端点を含めるために -1
    const centerY = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = this.config.color ?? '#ffffff';
    ctx.lineWidth = this.config.barWidth ?? 2;

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const amplitude = data[i] * sensitivity;
      const y = mirror
        ? centerY + (amplitude * height / 2)
        : height - (amplitude * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * サークル型の波形を描画
   */
  private renderCircle(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    sensitivity: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5; // 余白を確保するために2.5で割る
    const step = (Math.PI * 2) / data.length;

    ctx.beginPath();
    ctx.strokeStyle = this.config.color ?? '#ffffff';
    ctx.lineWidth = this.config.barWidth ?? 2;

    for (let i = 0; i < data.length; i++) {
      const amplitude = 1 + (data[i] * sensitivity);
      const r = radius * amplitude;
      const angle = i * step;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
} 