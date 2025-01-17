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
  private animationState: {
    progress: number;
    opacity: number;
    scale: number;
    sensitivity: number;
  } | null = null;

  constructor(config: WaveformEffectConfig) {
    super({
      ...config,
      color: config.color ?? '#ffffff',
      barWidth: config.barWidth ?? 3,
      barGap: config.barGap ?? 1,
      sensitivity: config.sensitivity ?? 2.0,
      smoothingFactor: config.smoothingFactor ?? 0.5,
      mirror: config.mirror ?? true,
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーション状態の初期化
    if (config.animation) {
      this.animationState = {
        progress: 0,
        opacity: config.opacity ?? 1,
        scale: 1,
        sensitivity: config.sensitivity ?? 2.0
      };
    }
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

    // アニメーションの更新
    if (this.config.animation && this.animationState) {
      const { animation } = this.config;
      const { startTime = 0, endTime = this.audioSource.duration } = this.config;
      const duration = endTime - startTime;
      
      // 進行度を計算（0-1）
      const progress = Math.max(0, Math.min((currentTime - startTime) / duration, 1));
      this.animationState.progress = progress;

      // アニメーションタイプに応じて値を更新
      switch (animation.type) {
        case 'fade':
          this.animationState.opacity = this.lerp(
            animation.from ?? 0,
            animation.to ?? 1,
            progress
          );
          break;
        case 'scale':
          this.animationState.scale = this.lerp(
            animation.from ?? 0.5,
            animation.to ?? 1.5,
            progress
          );
          break;
        case 'sensitivity':
          this.animationState.sensitivity = this.lerp(
            animation.from ?? 1,
            animation.to ?? 3,
            progress
          );
          break;
      }
    }

    // 波形データの更新（既存のコード）
    const totalFrames = this.audioSource.waveformData[0].length;
    const duration = this.audioSource.duration;
    const ratio = Math.max(0, Math.min(currentTime / duration, 1.0));
    const currentFrameIndex = Math.floor(ratio * (totalFrames - 1));
    
    const SECONDS_TO_SHOW = 0.5;
    const samplesPerSecond = 60;
    const windowSize = Math.floor(SECONDS_TO_SHOW * samplesPerSecond * 2);
    
    const halfWindow = Math.floor(windowSize / 2);
    const startIndex = Math.max(0, currentFrameIndex - halfWindow);
    const endIndex = Math.min(startIndex + windowSize, totalFrames);

    this.currentWaveformData = this.audioSource.waveformData.map(channel => {
      return channel.slice(startIndex, endIndex);
    });

    if (this.audioSource.frequencyData) {
      this.currentFrequencyData = this.audioSource.frequencyData.map(channel => {
        return channel.slice(startIndex, endIndex);
      });
    }
  }

  /**
   * 値を線形補間
   */
  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
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
      barGap = 1,
      waveformType = 'bar',
      mirror = false,
      sensitivity = 2.0,
      opacity = 1.0,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション状態の適用
    const effectiveOpacity = this.animationState?.opacity ?? opacity;
    const effectiveSensitivity = this.animationState?.sensitivity ?? sensitivity;
    const scale = this.animationState?.scale ?? 1;

    // 描画スタイルの設定
    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = color;

    // スケール変換の適用
    if (scale !== 1) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
    }

    const channel = this.currentWaveformData[0]; // モノラル or 左チャンネル

    switch (waveformType) {
      case 'bar':
        this.renderBars(ctx, channel, width, height, barWidth, barGap, mirror, effectiveSensitivity);
        break;
      case 'line':
        this.renderLine(ctx, channel, width, height, mirror, effectiveSensitivity);
        break;
      case 'circle':
        this.renderCircle(ctx, channel, width, height, effectiveSensitivity);
        break;
    }

    ctx.restore();
  }

  /**
   * バー型の波形を描画
   */
  private renderBars(
    ctx: CanvasRenderingContext2D,
    channel: Float32Array,
    width: number,
    height: number,
    barWidth: number,
    barGap: number,
    mirror: boolean,
    sensitivity: number
  ) {
    const totalBars = Math.floor(width / (barWidth + barGap));
    const step = Math.ceil(channel.length / totalBars);
    const centerY = height / 2;

    for (let i = 0; i < totalBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < channel.length) {
          sum += Math.abs(channel[index]);
        }
      }
      const average = (sum / step) * sensitivity;
      const barHeight = height * average;

      const x = i * (barWidth + barGap);
      if (mirror) {
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      } else {
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }
    }
  }

  /**
   * ライン型の波形を描画
   */
  private renderLine(
    ctx: CanvasRenderingContext2D,
    channel: Float32Array,
    width: number,
    height: number,
    mirror: boolean,
    sensitivity: number
  ) {
    const step = Math.ceil(channel.length / width);
    const centerY = height / 2;

    ctx.beginPath();
    ctx.moveTo(0, mirror ? centerY : height);

    for (let i = 0; i < width; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < channel.length) {
          sum += Math.abs(channel[index]);
        }
      }
      const average = (sum / step) * sensitivity;
      const y = mirror
        ? centerY - (height * average) / 2
        : height - height * average;

      ctx.lineTo(i, y);
    }

    if (mirror) {
      const mirrorPath = new Path2D();
      mirrorPath.moveTo(0, centerY);
      for (let i = 0; i < width; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          const index = i * step + j;
          if (index < channel.length) {
            sum += Math.abs(channel[index]);
          }
        }
        const average = (sum / step) * sensitivity;
        const y = centerY + (height * average) / 2;
        mirrorPath.lineTo(i, y);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.stroke(mirrorPath);
    } else {
      ctx.stroke();
    }
  }

  /**
   * サークル型の波形を描画
   */
  private renderCircle(
    ctx: CanvasRenderingContext2D,
    channel: Float32Array,
    width: number,
    height: number,
    sensitivity: number
  ) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const totalPoints = 360;
    const step = Math.ceil(channel.length / totalPoints);

    ctx.beginPath();
    for (let i = 0; i < totalPoints; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < channel.length) {
          sum += Math.abs(channel[index]);
        }
      }
      const average = (sum / step) * sensitivity;
      const angle = (i * Math.PI * 2) / totalPoints;
      const r = radius + radius * average;
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
    ctx.fill();
  }
} 