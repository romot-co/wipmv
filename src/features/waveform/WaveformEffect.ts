import { EffectBase } from '../../core/types/core';
import { WaveformEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { Color, AudioSource } from '../../core/types/base';

/**
 * 波形エフェクト
 * - 音声波形の描画を担当
 * - currentTimeに応じて波形データをスライスして表示
 * - 波形表示と周波数表示の切り替えをサポート
 * - ステレオチャンネルの分割表示をサポート
 */
export class WaveformEffect extends EffectBase<WaveformEffectConfig> {
  protected currentWaveformData: Float32Array[] | null = null;
  private currentFrequencyData: Float32Array[] | null = null;
  private animationController: AnimationController | null = null;

  /**
   * 線形補間を行うヘルパーメソッド
   */
  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * 色の線形補間を行うヘルパーメソッド
   */
  private lerpColor(startColor: Color | string, endColor: Color | string, progress: number): Color {
    // 文字列の場合はColorオブジェクトに変換
    const start = typeof startColor === 'string' ? this.parseColor(startColor) : startColor;
    const end = typeof endColor === 'string' ? this.parseColor(endColor) : endColor;

    // RGB値を線形補間
    return {
      r: Math.round(this.lerp(start.r, end.r, progress)),
      g: Math.round(this.lerp(start.g, end.g, progress)),
      b: Math.round(this.lerp(start.b, end.b, progress)),
      a: this.lerp(start.a ?? 1, end.a ?? 1, progress)
    };
  }

  /**
   * カラーコードをColorオブジェクトに変換
   */
  private parseColor(color: string): Color {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1
    };
  }

  /**
   * Colorオブジェクトを文字列に変換
   */
  private colorToString(color: Color | string): string {
    if (typeof color === 'string') {
      return color;
    }
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  constructor(config: WaveformEffectConfig) {
    super({
      ...config,
      displayMode: config.displayMode ?? 'waveform',
      waveformType: config.waveformType ?? 'bar',
      barWidth: config.barWidth ?? 2,
      barGap: config.barGap ?? 1,
      sensitivity: config.sensitivity ?? 1,
      color: config.color ?? '#ffffff',
      smoothingFactor: config.smoothingFactor ?? 0.5,
      mirror: config.mirror ?? { vertical: false, horizontal: false },
      channelMode: config.channelMode ?? 'mono',
      windowSeconds: config.windowSeconds ?? 1,
      samplesPerSecond: config.samplesPerSecond ?? 60,
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }
  }

  /**
   * 音声ソースを設定
   */
  setAudioSource(source: AudioSource): void {
    if (!source.waveformData) {
      console.warn('波形エフェクト: 波形データが存在しません');
      return;
    }
    this.audioSource = source;
    console.log('波形エフェクト: 音声ソース設定完了', {
      hasWaveformData: !!source.waveformData,
      hasFrequencyData: !!source.frequencyData,
      channels: source.waveformData.length
    });
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (!this.audioSource?.waveformData) {
      console.warn('波形エフェクト: 波形データが存在しないため更新をスキップします');
      return;
    }

    // アニメーションの更新
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = this.audioSource.duration } = this.config;
      const duration = endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }

    // データの更新
    const { windowSeconds, samplesPerSecond } = this.config;
    const totalFrames = this.audioSource.waveformData[0].length;
    const duration = this.audioSource.duration;
    const ratio = Math.max(0, Math.min(currentTime / duration, 1.0));
    const currentFrameIndex = Math.floor(ratio * (totalFrames - 1));
    
    const windowSize = Math.floor(windowSeconds * samplesPerSecond * 2);
    const halfWindow = Math.floor(windowSize / 2);
    const startIndex = Math.max(0, currentFrameIndex - halfWindow);
    const endIndex = Math.min(startIndex + windowSize, totalFrames);

    // チャンネルモードに応じてデータを準備
    try {
      switch (this.config.channelMode) {
        case 'mono':
          this.currentWaveformData = [this.averageChannels(this.audioSource.waveformData, startIndex, endIndex)];
          if (this.audioSource.frequencyData) {
            this.currentFrequencyData = [this.averageChannels(this.audioSource.frequencyData, startIndex, endIndex)];
          }
          break;
        case 'leftOnly':
          this.currentWaveformData = [this.processData(this.audioSource.waveformData[0].slice(startIndex, endIndex))];
          if (this.audioSource.frequencyData) {
            this.currentFrequencyData = [this.processData(this.audioSource.frequencyData[0].slice(startIndex, endIndex))];
          }
          break;
        case 'rightOnly':
          if (this.audioSource.waveformData.length > 1) {
            this.currentWaveformData = [this.processData(this.audioSource.waveformData[1].slice(startIndex, endIndex))];
            if (this.audioSource.frequencyData) {
              this.currentFrequencyData = [this.processData(this.audioSource.frequencyData[1].slice(startIndex, endIndex))];
            }
          } else {
            console.log('右チャンネルが存在しないため、左チャンネルを使用します');
            this.currentWaveformData = [this.processData(this.audioSource.waveformData[0].slice(startIndex, endIndex))];
            if (this.audioSource.frequencyData) {
              this.currentFrequencyData = [this.processData(this.audioSource.frequencyData[0].slice(startIndex, endIndex))];
            }
          }
          break;
        case 'stereo':
          this.currentWaveformData = this.audioSource.waveformData.map(channel => 
            this.processData(channel.slice(startIndex, endIndex))
          );
          if (this.audioSource.frequencyData) {
            this.currentFrequencyData = this.audioSource.frequencyData.map(channel =>
              this.processData(channel.slice(startIndex, endIndex))
            );
          }
          break;
      }
    } catch (error) {
      console.error('波形データの更新中にエラーが発生しました:', error);
      this.currentWaveformData = null;
      this.currentFrequencyData = null;
      return;
    }

    // デバッグログ
    console.log('波形データ更新:', {
      channelMode: this.config.channelMode,
      channels: this.currentWaveformData?.length,
      samplesPerChannel: this.currentWaveformData?.[0]?.length,
      startIndex,
      endIndex,
      windowSize
    });
  }

  private averageChannels(data: Float32Array[] | Uint8Array[], start: number, end: number): Float32Array {
    const length = end - start;
    const isFloat32 = data[0] instanceof Float32Array;
    
    if (isFloat32) {
      const result = new Float32Array(length);
      const typedData = data as Float32Array[];
      for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let channel = 0; channel < data.length; channel++) {
          sum += typedData[channel][start + i];
        }
        result[i] = sum / data.length;
      }
      return result;
    } else {
      // Uint8Arrayの値を0-1の範囲に正規化
      const result = new Float32Array(length);
      const typedData = data as Uint8Array[];
      for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let channel = 0; channel < data.length; channel++) {
          sum += typedData[channel][start + i] / 255;
        }
        result[i] = sum / data.length;
      }
      return result;
    }
  }

  private processData(data: Float32Array | Uint8Array): Float32Array {
    if (data instanceof Float32Array) {
      return data;
    } else {
      // Uint8Arrayの値を0-1の範囲に正規化
      const result = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) {
        result[i] = data[i] / 255;
      }
      return result;
    }
  }

  /**
   * 波形データを取得
   */
  private getChannelData(displayMode: 'waveform' | 'frequency'): { left: Float32Array | null; right: Float32Array | null } {
    if (!this.audioSource) {
      console.warn('波形エフェクト: 音声ソースが存在しません');
      return { left: null, right: null };
    }

    const data = displayMode === 'waveform' 
      ? this.currentWaveformData 
      : this.currentFrequencyData;

    if (!data || data.length === 0) {
      console.warn('波形エフェクト: 表示データが存在しません', { displayMode });
      return { left: null, right: null };
    }

    // 周波数データの場合は正規化
    if (displayMode === 'frequency') {
      data.forEach(channel => {
        const maxValue = Math.max(...channel);
        if (maxValue > 0) {
          for (let i = 0; i < channel.length; i++) {
            channel[i] /= maxValue;
          }
        }
      });
    }

    return {
      left: data[0] || null,
      right: data.length > 1 ? data[1] : null
    };
  }

  /**
   * 波形を描画
   */
  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const {
      displayMode = 'waveform',
      waveformType = 'bar',
      barWidth = 2,
      barGap = 1,
      sensitivity = 1,
      color = '#ffffff',
      smoothingFactor = 0.5,
      mirror = { vertical: false, horizontal: false },
      channelMode = 'mono',
      opacity = 1,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション値の適用
    const effectiveOpacity = this.animationController?.getValue<number>('opacity') ?? opacity;
    const effectiveColor = this.animationController?.getValue<Color>('color') ?? color;
    const effectiveSensitivity = this.animationController?.getValue<number>('sensitivity') ?? sensitivity;

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;

    // 波形の描画
    if (displayMode === 'waveform') {
      this.renderWaveform(ctx, {
        type: waveformType,
        barWidth,
        barGap,
        sensitivity: effectiveSensitivity,
        color: effectiveColor,
        mirror,
        channelMode
      });
    } else {
      this.renderFrequency(ctx, {
        barWidth,
        barGap,
        sensitivity: effectiveSensitivity,
        color: effectiveColor,
        mirror,
        smoothingFactor
      });
    }

    ctx.restore();
  }

  /**
   * 波形の描画
   */
  private renderWaveform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, options: {
    type: 'bar' | 'line' | 'circle';
    barWidth: number;
    barGap: number;
    sensitivity: number;
    color: Color | string;
    mirror: { vertical: boolean; horizontal: boolean };
    channelMode: 'mono' | 'stereo' | 'leftOnly' | 'rightOnly';
  }): void {
    if (!this.currentWaveformData) return;

    const { width, height } = ctx.canvas;
    const { type, barWidth, barGap, sensitivity, color, mirror, channelMode } = options;

    // 描画色の設定
    ctx.fillStyle = this.colorToString(color);
    ctx.strokeStyle = this.colorToString(color);

    // チャンネルごとの描画
    const channels = this.getChannelsToRender(channelMode);
    channels.forEach((channel, index) => {
      const data = this.currentWaveformData![channel];
      const channelHeight = channels.length > 1 ? height / 2 : height;
      const yOffset = index * channelHeight;

      switch (type) {
        case 'bar':
          this.renderBars(ctx, data, {
            width,
            height: channelHeight,
            yOffset,
            barWidth,
            barGap,
            sensitivity,
            mirror
          });
          break;
        case 'line':
          this.renderLine(ctx, data, {
            width,
            height: channelHeight,
            yOffset,
            sensitivity,
            mirror
          });
          break;
        case 'circle':
          this.renderCircle(ctx, data, {
            width,
            height: channelHeight,
            yOffset,
            sensitivity,
            mirror
          });
          break;
      }
    });
  }

  /**
   * 周波数の描画
   */
  private renderFrequency(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, options: {
    barWidth: number;
    barGap: number;
    sensitivity: number;
    color: Color | string;
    mirror: { vertical: boolean; horizontal: boolean };
    smoothingFactor: number;
  }): void {
    if (!this.currentFrequencyData) return;

    const { width, height } = ctx.canvas;
    const { barWidth, barGap, sensitivity, color, mirror, smoothingFactor } = options;

    // 描画色の設定
    ctx.fillStyle = this.colorToString(color);

    // データの平滑化
    const smoothedData = this.smoothData(this.currentFrequencyData[0], smoothingFactor);

    // バーの描画
    const barCount = Math.floor(width / (barWidth + barGap));
    const step = Math.floor(smoothedData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = smoothedData[i * step] * sensitivity;
      const x = i * (barWidth + barGap);
      const barHeight = value * height;

      if (mirror.vertical) {
        const y = (height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
      } else {
        const y = height - barHeight;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (mirror.horizontal) {
        const mirrorX = width - x - barWidth;
        if (mirror.vertical) {
          const y = (height - barHeight) / 2;
          ctx.fillRect(mirrorX, y, barWidth, barHeight);
        } else {
          const y = height - barHeight;
          ctx.fillRect(mirrorX, y, barWidth, barHeight);
        }
      }
    }
  }

  /**
   * バー波形の描画
   */
  private renderBars(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, data: Float32Array, options: {
    width: number;
    height: number;
    yOffset: number;
    barWidth: number;
    barGap: number;
    sensitivity: number;
    mirror: { vertical: boolean; horizontal: boolean };
  }): void {
    const { width, height, yOffset, barWidth, barGap, sensitivity, mirror } = options;
    const barCount = Math.floor(width / (barWidth + barGap));
    const step = Math.floor(data.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = Math.abs(data[i * step]) * sensitivity;
      const x = i * (barWidth + barGap);
      const barHeight = value * height;

      if (mirror.vertical) {
        const y = yOffset + (height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
      } else {
        const y = yOffset + height - barHeight;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (mirror.horizontal) {
        const mirrorX = width - x - barWidth;
        if (mirror.vertical) {
          const y = yOffset + (height - barHeight) / 2;
          ctx.fillRect(mirrorX, y, barWidth, barHeight);
        } else {
          const y = yOffset + height - barHeight;
          ctx.fillRect(mirrorX, y, barWidth, barHeight);
        }
      }
    }
  }

  /**
   * ライン波形の描画
   */
  private renderLine(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, data: Float32Array, options: {
    width: number;
    height: number;
    yOffset: number;
    sensitivity: number;
    mirror: { vertical: boolean; horizontal: boolean };
  }): void {
    const { width, height, yOffset, sensitivity, mirror } = options;
    const step = Math.floor(data.length / width);

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const value = data[i * step] * sensitivity;
      const x = i;
      const y = mirror.vertical
        ? yOffset + height / 2 + (value * height) / 2
        : yOffset + height - (value * height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    if (mirror.horizontal) {
      ctx.beginPath();
      for (let i = 0; i < width; i++) {
        const value = data[i * step] * sensitivity;
        const x = width - i;
        const y = mirror.vertical
          ? yOffset + height / 2 + (value * height) / 2
          : yOffset + height - (value * height);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  /**
   * サークル波形の描画
   */
  private renderCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, data: Float32Array, options: {
    width: number;
    height: number;
    yOffset: number;
    sensitivity: number;
    mirror: { vertical: boolean; horizontal: boolean };
  }): void {
    const { width, height, sensitivity } = options;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const step = Math.floor(data.length / 360);

    ctx.beginPath();
    for (let i = 0; i < 360; i++) {
      const value = data[i * step] * sensitivity;
      const angle = (i * Math.PI) / 180;
      const r = radius + value * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * データの平滑化
   */
  private smoothData(data: Float32Array, factor: number): Float32Array {
    const smoothed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - factor); j < Math.min(data.length, i + factor + 1); j++) {
        sum += data[j];
        count++;
      }
      smoothed[i] = sum / count;
    }
    return smoothed;
  }

  /**
   * 描画するチャンネルの取得
   */
  private getChannelsToRender(channelMode: 'mono' | 'stereo' | 'leftOnly' | 'rightOnly'): number[] {
    switch (channelMode) {
      case 'mono':
        return [0];
      case 'stereo':
        return [0, 1];
      case 'leftOnly':
        return [0];
      case 'rightOnly':
        return [1];
      default:
        return [0];
    }
  }

  /**
   * 波形データの設定
   */
  setWaveformData(data: Float32Array[]): void {
    this.currentWaveformData = data;
  }

  /**
   * 周波数データの設定
   */
  setFrequencyData(data: Float32Array[]): void {
    this.currentFrequencyData = data;
  }

  override dispose(): void {
    this.currentWaveformData = null;
    this.currentFrequencyData = null;
    this.animationController = null;
    super.dispose();
  }
} 