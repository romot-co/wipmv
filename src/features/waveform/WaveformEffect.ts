import { EffectBase } from '../../core/types/core';
import { WaveformEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { Color, AudioSource } from '../../core/types/base';
import { convertRect } from '../../utils/coordinates';
import debug from 'debug';

const log = debug('app:WaveformEffect');

/**
 * 波形エフェクト
 * - 音声波形の描画を担当
 * - 波形表示と周波数表示の切り替えをサポート
 * - ステレオチャンネルの分割表示をサポート
 */
export class WaveformEffect extends EffectBase<WaveformEffectConfig> {
  protected currentWaveformData: Float32Array[] | null = null;
  private currentFrequencyData: Float32Array[] | null = null;
  private animationController: AnimationController | null = null;
  private lastCurrentTime: number = 0;

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
    this.audioSource = source;
    
    // データの詳細な検証
    const waveformDataValid = source.waveformData && 
      Array.isArray(source.waveformData) && 
      source.waveformData.length > 0 &&
      source.waveformData[0] instanceof Float32Array;
      
    const frequencyDataValid = source.frequencyData && 
      Array.isArray(source.frequencyData) && 
      source.frequencyData.length > 0 &&
      source.frequencyData[0] instanceof Float32Array;

    if (!waveformDataValid || !source.waveformData) {
      console.warn('波形エフェクト: 波形データが無効です', {
        hasData: !!source.waveformData,
        isArray: Array.isArray(source.waveformData),
        length: source.waveformData?.length,
        type: source.waveformData?.[0]?.constructor.name
      });
      return;
    }

    log('波形エフェクト: 音声ソース設定完了', {
      hasWaveformData: true,
      hasFrequencyData: frequencyDataValid,
      channels: source.waveformData.length,
      samplesPerChannel: source.waveformData[0].length
    });
  }

  private ensureFloat32Array(data: Uint8Array | Float32Array): Float32Array {
    if (data instanceof Float32Array) {
      return data;
    }
    // Uint8Arrayの場合は0-255の値を0-1に正規化
    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      float32Data[i] = data[i] / 255;
    }
    return float32Data;
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    // ★ 表示状態を更新
    this.visible = this.isActive(currentTime);
    if (!this.visible) return; // 非表示なら以降の処理は不要

    // オーディオソースがなければ何もしない
    const audioSource = this.getAudioSource();
    if (!audioSource || !audioSource.buffer || !audioSource.waveformData) {
      console.warn('WaveformEffect: AudioSource not available or no waveform data');
      return;
    }

    this.lastCurrentTime = currentTime;
    const duration = audioSource.duration;
    const ratio = currentTime / duration;

    if (this.config.displayMode === 'frequency' && audioSource.frequencyData) {
      // 周波数表示モード
      try {
        const frequencyData = audioSource.frequencyData;
        
        // データ構造の判別: Float32Array[][] か Uint8Array[] か
        if (Array.isArray(frequencyData) && frequencyData.length > 0) {
          if (Array.isArray(frequencyData[0])) {
            // Float32Array[][] 形式 (チャンネル×フレーム)
            const typedData = frequencyData as Float32Array[][];
            const totalFramesInChannel = typedData[0].length;
            const frameIndex = Math.floor(ratio * (totalFramesInChannel - 1));
            
            if (frameIndex >= 0 && frameIndex < totalFramesInChannel) {
              // 各チャンネルの現在フレームを抽出
              this.currentFrequencyData = typedData.map(channelData => channelData[frameIndex]);
            } else {
              this.currentFrequencyData = null;
            }
          } else {
            // Uint8Array[] 形式（単一フレーム、旧形式）
            // Float32Arrayに変換・正規化して使用
            this.currentFrequencyData = (frequencyData as Uint8Array[]).map(
              channel => this.ensureFloat32Array(channel)
            );
          }
        } else {
          console.warn('WaveformEffect: Invalid frequency data structure');
          this.currentFrequencyData = null;
        }
      } catch (error) {
        console.error('WaveformEffect: Error processing frequency data', error);
        this.currentFrequencyData = null;
      }
    } else if (this.config.displayMode === 'waveform' && audioSource.waveformData) {
      // 波形表示モード
      const waveformData = audioSource.waveformData;
      const totalSamples = waveformData[0].length;
      const sampleRate = totalSamples / duration;
      
      // windowSecondsをサンプル数に変換（デフォルト2秒）
      const windowSize = Math.floor((this.config.windowSeconds || 2) * sampleRate);
      const currentSample = Math.floor(ratio * totalSamples);
      
      // 表示範囲の計算（現在位置を中心に）
      const half = Math.floor(windowSize / 2);
      let start = currentSample - half;
      let end = start + windowSize;
      
      // 範囲の調整
      if (start < 0) {
        start = 0;
        end = Math.min(windowSize, totalSamples);
      }
      if (end > totalSamples) {
        end = totalSamples;
        start = Math.max(0, end - windowSize);
      }
      
      // データの切り出し
      this.currentWaveformData = waveformData.map(channel => channel.slice(start, end));
    }

    // アニメーション更新
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = duration } = this.config;
      this.animationController.update(currentTime, startTime, endTime - startTime);
    }
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
    const { barWidth, barGap, sensitivity, color, smoothingFactor } = options;
    const centerY = height / 2;

    ctx.fillStyle = this.colorToString(color);

    const barCount = Math.floor(width / (barWidth + barGap));
    const data = this.currentFrequencyData[0];
    const step = data.length / barCount;

    for (let i = 0; i < barCount; i++) {
      const index = Math.floor(i * step);
      const value = data[index] * sensitivity;
      const barHeight = value * (height / 2);
      const x = i * (barWidth + barGap);
      
      // 中心線から上下対称に描画
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
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
    const { width, height, yOffset, barWidth, barGap, sensitivity } = options;
    const centerY = yOffset + height / 2;
    const barCount = Math.floor(width / (barWidth + barGap));
    const step = data.length / barCount;

    for (let i = 0; i < barCount; i++) {
      const index = Math.floor(i * step);
      const value = data[index] * sensitivity;
      const barHeight = Math.abs(value) * (height / 2);
      const x = i * (barWidth + barGap);
      
      // 中心線から上下対称に描画
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
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
    const { width, height, yOffset, sensitivity } = options;
    const centerY = yOffset + height / 2;
    const step = data.length / width;

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const index = Math.floor(i * step);
      const value = data[index] * sensitivity;
      const y = centerY - (value * height / 2);
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // 再生位置インジケーター（ヘッドライン）を描画
    const ratio = this.getCurrentPlaybackRatio();
    if (ratio !== null) {
      const xHead = ratio * width;
      
      ctx.save();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xHead, yOffset);
      ctx.lineTo(xHead, yOffset + height);
      ctx.stroke();
      ctx.restore();
    }
  }

  private getCurrentPlaybackRatio(): number | null {
    if (!this.audioSource?.duration) return null;
    return this.lastCurrentTime / this.audioSource.duration;
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
    const angleStep = (2 * Math.PI) / data.length;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const value = data[i] * sensitivity;
      const r = radius + value * radius;
      const angle = i * angleStep;
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

  getBoundingBox(canvasWidth: number, canvasHeight: number): { x: number; y: number; width: number; height: number; } | null {
    // config から position と size を取得 (相対座標)
    const { position = { x: 0.5, y: 0.5 }, size = { width: 0.8, height: 0.3 }, coordinateSystem = 'relative' } = this.config;

    // 相対座標から絶対座標の矩形に変換
    const absoluteRectData = convertRect(
      position,
      size,
      coordinateSystem, // fromSystem
      'absolute',      // toSystem
      { width: canvasWidth, height: canvasHeight }
    );

    return {
      x: absoluteRectData.position.x,
      y: absoluteRectData.position.y,
      width: absoluteRectData.size.width,
      height: absoluteRectData.size.height
    };
  }
}
