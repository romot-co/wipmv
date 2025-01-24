import { EffectBase } from '../../core/EffectBase';
import { AudioSource, WaveformEffectConfig } from '../../core/types';
import { WaveformAnimation } from '../../core/types';

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
  private animationState: {
    progress: number;
    opacity: number;
    scale: number;
    sensitivity: number;
    color: string;
  } | null = null;

  /**
   * 線形補間を行うヘルパーメソッド
   */
  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * 色の線形補間を行うヘルパーメソッド
   */
  private lerpColor(startColor: string, endColor: string, progress: number): string {
    // 16進数カラーコードをRGB値に変換
    const start = {
      r: parseInt(startColor.slice(1, 3), 16),
      g: parseInt(startColor.slice(3, 5), 16),
      b: parseInt(startColor.slice(5, 7), 16)
    };
    const end = {
      r: parseInt(endColor.slice(1, 3), 16),
      g: parseInt(endColor.slice(3, 5), 16),
      b: parseInt(endColor.slice(5, 7), 16)
    };

    // RGB値を線形補間
    const r = Math.round(this.lerp(start.r, end.r, progress));
    const g = Math.round(this.lerp(start.g, end.g, progress));
    const b = Math.round(this.lerp(start.b, end.b, progress));

    // RGB値を16進数カラーコードに変換して返す
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  constructor(config: WaveformEffectConfig) {
    super({
      ...config,
      displayMode: config.displayMode || 'waveform',
      waveformType: config.waveformType || 'bar',
      barWidth: config.barWidth || 3,
      barGap: config.barGap || 1,
      sensitivity: config.sensitivity || 2.0,
      smoothingFactor: config.smoothingFactor || 0.5,
      mirror: config.mirror || { vertical: true, horizontal: false },
      channelMode: config.channelMode || 'mono',
      windowSeconds: config.windowSeconds || 0.5,
      samplesPerSecond: config.samplesPerSecond || 60,
      color: config.color || '#ffffff',
      opacity: config.opacity || 1,
      blendMode: config.blendMode || 'source-over'
    });

    if (config.animation) {
      this.animationState = {
        progress: 0,
        opacity: config.opacity || 1,
        scale: 1,
        sensitivity: config.sensitivity || 2.0,
        color: config.color || '#ffffff'
      };
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
    if (this.config.animation && this.animationState) {
      const animation = this.config.animation as WaveformAnimation;
      const startTime = this.config.startTime || 0;
      const endTime = this.config.endTime || this.audioSource.duration;
      const duration = endTime - startTime;
      
      const progress = Math.max(0, Math.min((currentTime - startTime) / duration, 1));
      this.animationState.progress = progress;

      switch (animation.type) {
        case 'fade':
          this.animationState.opacity = this.lerp(
            animation.from as number || 0,
            animation.to as number || 1,
            progress
          );
          break;
        case 'scale':
          this.animationState.scale = this.lerp(
            animation.from as number || 0.5,
            animation.to as number || 1.5,
            progress
          );
          break;
        case 'sensitivity':
          this.animationState.sensitivity = this.lerp(
            animation.from as number || 1,
            animation.to as number || 3,
            progress
          );
          break;
        case 'color':
          if (typeof animation.from === 'string' && typeof animation.to === 'string') {
            this.animationState.color = this.lerpColor(animation.from, animation.to, progress);
          }
          break;
      }
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
          // 全チャンネルの平均を取る
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
            // 右チャンネルがない場合は左チャンネルを使用
            console.log('右チャンネルが存在しないため、左チャンネルを使用します');
            this.currentWaveformData = [this.processData(this.audioSource.waveformData[0].slice(startIndex, endIndex))];
            if (this.audioSource.frequencyData) {
              this.currentFrequencyData = [this.processData(this.audioSource.frequencyData[0].slice(startIndex, endIndex))];
            }
          }
          break;
        case 'stereo':
          // ステレオモードでは両方のチャンネルを個別に処理
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
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.currentWaveformData && !this.currentFrequencyData) {
      console.warn('波形エフェクト: 描画データが存在しません');
      return;
    }

    const { width, height } = ctx.canvas;
    const {
      displayMode,
      waveformType,
      barWidth,
      barGap,
      color,
      opacity = 1,
      blendMode = 'source-over',
      mirror = { vertical: true, horizontal: false },
      sensitivity,
      channelMode
    } = this.config;

    const effectiveOpacity = this.animationState?.opacity ?? opacity;
    const effectiveScale = this.animationState?.scale ?? 1;
    const effectiveSensitivity = this.animationState?.sensitivity ?? sensitivity;
    const effectiveColor = this.animationState?.color ?? color;

    // 描画設定
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;

    // チャンネルデータを取得
    const { left, right } = this.getChannelData(displayMode);
    if (!left) return;

    // チャンネルモードに応じて描画
    switch (channelMode) {
      case 'mono':
        // モノラル: 全画面に1チャンネル
        this.renderChannel(ctx, left, width, height, {
          waveformType,
          barWidth,
          barGap,
          mirror,
          sensitivity: effectiveSensitivity,
          color: effectiveColor,
          scale: effectiveScale,
          isSecondChannel: false
        });
        break;

      case 'stereo':
        // ステレオ: 画面を上下に分割して両チャンネルを表示
        if (right) {
          // 左チャンネル (上半分)
          this.renderChannel(ctx, left, width, height, {
            waveformType,
            barWidth,
            barGap,
            mirror,
            sensitivity: effectiveSensitivity,
            color: effectiveColor,
            scale: effectiveScale,
            isSecondChannel: false
          });

          // 右チャンネル (下半分)
          this.renderChannel(ctx, right, width, height, {
            waveformType,
            barWidth,
            barGap,
            mirror,
            sensitivity: effectiveSensitivity,
            color: effectiveColor,
            scale: effectiveScale,
            isSecondChannel: true
          });
        } else {
          // 右チャンネルがない場合はモノラルとして描画
          console.log('ステレオモードですが右チャンネルがないためモノラルとして描画します');
          this.renderChannel(ctx, left, width, height, {
            waveformType,
            barWidth,
            barGap,
            mirror,
            sensitivity: effectiveSensitivity,
            color: effectiveColor,
            scale: effectiveScale,
            isSecondChannel: false
          });
        }
        break;

      case 'leftOnly':
        // 左チャンネルのみ
        this.renderChannel(ctx, left, width, height, {
          waveformType,
          barWidth,
          barGap,
          mirror,
          sensitivity: effectiveSensitivity,
          color: effectiveColor,
          scale: effectiveScale,
          isSecondChannel: false
        });
        break;

      case 'rightOnly':
        // 右チャンネルのみ (ない場合は左を使用)
        this.renderChannel(ctx, right || left, width, height, {
          waveformType,
          barWidth,
          barGap,
          mirror,
          sensitivity: effectiveSensitivity,
          color: effectiveColor,
          scale: effectiveScale,
          isSecondChannel: true
        });
        break;
    }

    // 描画設定をリセット
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 単一チャンネルを描画
   */
  private renderChannel(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number,
    options: {
      waveformType: string;
      barWidth: number;
      barGap: number;
      mirror: { vertical: boolean; horizontal: boolean };
      sensitivity: number;
      color: string;
      scale: number;
      isSecondChannel?: boolean;  // 2番目のチャンネルかどうか
    }
  ): void {
    const { waveformType, barWidth, barGap, mirror, sensitivity, color, scale, isSecondChannel } = options;

    // スケール変換のための保存
    ctx.save();
    
    // スケールの適用
    if (scale !== 1) {
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
    }

    // ステレオ表示時のチャンネル分離
    if (this.config.channelMode === 'stereo') {
      const channelHeight = height / 2;
      const yOffset = isSecondChannel ? channelHeight : 0;

      // チャンネル境界線の描画
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, channelHeight);
      ctx.lineTo(width, channelHeight);
      ctx.stroke();

      // チャンネルラベルの描画
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isSecondChannel ? 'Right' : 'Left', 10, yOffset + 20);

      // クリッピング領域の設定
      ctx.beginPath();
      ctx.rect(0, yOffset, width, channelHeight);
      ctx.clip();

      // 波形タイプに応じて描画
      switch (waveformType) {
        case 'bar':
          this.renderBars(ctx, data, width, channelHeight, barWidth, barGap, mirror, sensitivity, color);
          break;
        case 'line':
          this.renderLine(ctx, data, width, channelHeight, mirror, sensitivity, color);
          break;
        case 'circle':
          // サークル表示はステレオモードでは特別な処理
          const circleSize = Math.min(width, channelHeight) * 0.8;
          const circleX = width / 2;
          const circleY = yOffset + channelHeight / 2;
          ctx.translate(circleX, circleY);
          ctx.scale(circleSize / Math.min(width, height), circleSize / Math.min(width, height));
          ctx.translate(-circleX, -circleY);
          this.renderCircle(ctx, data, width, channelHeight, sensitivity, color);
          break;
      }
    } else {
      // モノラル表示時は通常通り描画
      switch (waveformType) {
        case 'bar':
          this.renderBars(ctx, data, width, height, barWidth, barGap, mirror, sensitivity, color);
          break;
        case 'line':
          this.renderLine(ctx, data, width, height, mirror, sensitivity, color);
          break;
        case 'circle':
          this.renderCircle(ctx, data, width, height, sensitivity, color);
          break;
      }
    }

    // 状態を復元
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
    mirror: { vertical: boolean; horizontal: boolean },
    sensitivity: number,
    color: string
  ) {
    const { displayMode, useColorBands, colorBands } = this.config;
    const totalBars = Math.floor(width / (barWidth + barGap));
    const step = Math.ceil(channel.length / totalBars);
    const halfHeight = height / 2;

    // 周波数表示モードの場合は対数スケールを適用
    const getBarHeight = (value: number) => {
      if (displayMode === 'frequency') {
        // 対数スケールで変換（20Hz-20kHzの可聴域を考慮）
        const minDb = -60;  // 最小デシベル
        const maxDb = 0;    // 最大デシベル
        const db = 20 * Math.log10(value + 1e-6);  // 1e-6は0除算防止
        const normalizedDb = (Math.max(minDb, Math.min(maxDb, db)) - minDb) / (maxDb - minDb);
        return normalizedDb * sensitivity * halfHeight;
      } else {
        // 波形表示モードは線形スケール
        return Math.min(value * sensitivity * halfHeight, halfHeight);
      }
    };

    // カラーバンドの処理
    const getBarColor = (value: number): string => {
      if (!useColorBands || !colorBands?.ranges) return color;

      for (const range of colorBands.ranges) {
        if (value >= range.min && value <= range.max) {
          return range.color;
        }
      }
      return color;
    };

    for (let i = 0; i < totalBars; i++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < channel.length) {
          sum += Math.abs(channel[idx]);
          count++;
        }
      }

      const value = sum / count;
      const barHeight = getBarHeight(value);
      ctx.fillStyle = getBarColor(value);

      if (mirror.vertical) {
        // 上下対称に描画
        ctx.fillRect(
          i * (barWidth + barGap),
          halfHeight - barHeight,
          barWidth,
          barHeight * 2
        );
      } else {
        // 下から上に描画
        ctx.fillRect(
          i * (barWidth + barGap),
          height - barHeight,
          barWidth,
          barHeight
        );
      }
    }

    if (mirror.horizontal) {
      // 左右対称に描画
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
      for (let i = 0; i < totalBars; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < step; j++) {
          const idx = i * step + j;
          if (idx < channel.length) {
            sum += Math.abs(channel[idx]);
            count++;
          }
        }

        const value = sum / count;
        const barHeight = getBarHeight(value);
        ctx.fillStyle = getBarColor(value);

        if (mirror.vertical) {
          ctx.fillRect(
            i * (barWidth + barGap),
            halfHeight - barHeight,
            barWidth,
            barHeight * 2
          );
        } else {
          ctx.fillRect(
            i * (barWidth + barGap),
            height - barHeight,
            barWidth,
            barHeight
          );
        }
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
    mirror: { vertical: boolean; horizontal: boolean },
    sensitivity: number,
    color: string
  ) {
    const { displayMode, useColorBands, colorBands } = this.config;
    const step = Math.ceil(channel.length / width);
    const halfHeight = height / 2;

    // 周波数表示モードの場合は対数スケールを適用
    const getAmplitude = (value: number) => {
      if (displayMode === 'frequency') {
        const minDb = -60;
        const maxDb = 0;
        const db = 20 * Math.log10(Math.abs(value) + 1e-6);
        const normalizedDb = (Math.max(minDb, Math.min(maxDb, db)) - minDb) / (maxDb - minDb);
        return normalizedDb * sensitivity;
      } else {
        return value * sensitivity;
      }
    };

    // カラーバンドの処理
    const getLineColor = (value: number): string => {
      if (!useColorBands || !colorBands?.ranges) return color;

      for (const range of colorBands.ranges) {
        if (value >= range.min && value <= range.max) {
          return range.color;
        }
      }
      return color;
    };

    // グラデーションラインを描画する関数
    const drawGradientLine = (points: { x: number; y: number; value: number }[]) => {
      for (let i = 1; i < points.length; i++) {
        const gradient = ctx.createLinearGradient(
          points[i - 1].x, points[i - 1].y,
          points[i].x, points[i].y
        );
        gradient.addColorStop(0, getLineColor(points[i - 1].value));
        gradient.addColorStop(1, getLineColor(points[i].value));
        
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
    };

    ctx.lineWidth = 2;

    // メインの波形を描画
    const points: { x: number; y: number; value: number }[] = [];
    for (let i = 0; i < width; i++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < channel.length) {
          sum += channel[idx];
          count++;
        }
      }

      const value = sum / count;
      const amplitude = getAmplitude(value);
      const y = mirror.vertical
        ? halfHeight + (amplitude * halfHeight)
        : height - (amplitude * height);

      points.push({ x: i, y, value: Math.abs(value) });
    }

    if (useColorBands && colorBands?.ranges) {
      drawGradientLine(points);
    } else {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // 垂直ミラーの場合、反転した波形も描画
    if (mirror.vertical) {
      const mirrorPoints: { x: number; y: number; value: number }[] = points.map(p => ({
        x: p.x,
        y: halfHeight - (p.y - halfHeight),
        value: p.value
      }));

      if (useColorBands && colorBands?.ranges) {
        drawGradientLine(mirrorPoints);
      } else {
        ctx.beginPath();
        ctx.moveTo(mirrorPoints[0].x, mirrorPoints[0].y);
        for (let i = 1; i < mirrorPoints.length; i++) {
          ctx.lineTo(mirrorPoints[i].x, mirrorPoints[i].y);
        }
        ctx.stroke();
      }
    }

    // 水平ミラーの場合、左右反転した波形を描画
    if (mirror.horizontal) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);

      if (useColorBands && colorBands?.ranges) {
        drawGradientLine(points);
        if (mirror.vertical) {
          const mirrorPoints = points.map(p => ({
            x: p.x,
            y: halfHeight - (p.y - halfHeight),
            value: p.value
          }));
          drawGradientLine(mirrorPoints);
        }
      } else {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        if (mirror.vertical) {
          const mirrorPoints = points.map(p => ({
            x: p.x,
            y: halfHeight - (p.y - halfHeight),
            value: p.value
          }));
          ctx.beginPath();
          ctx.moveTo(mirrorPoints[0].x, mirrorPoints[0].y);
          for (let i = 1; i < mirrorPoints.length; i++) {
            ctx.lineTo(mirrorPoints[i].x, mirrorPoints[i].y);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
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
    sensitivity: number,
    color: string
  ) {
    const { displayMode, useColorBands, colorBands } = this.config;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 4;
    const angleStep = (2 * Math.PI) / channel.length;

    // 周波数表示モードの場合は対数スケールを適用
    const getRadius = (value: number) => {
      if (displayMode === 'frequency') {
        const minDb = -60;
        const maxDb = 0;
        const db = 20 * Math.log10(Math.abs(value) + 1e-6);
        const normalizedDb = (Math.max(minDb, Math.min(maxDb, db)) - minDb) / (maxDb - minDb);
        return baseRadius * (1 + normalizedDb * sensitivity);
      } else {
        return baseRadius * (1 + value * sensitivity);
      }
    };

    // カラーバンドの処理
    const getSegmentColor = (value: number): string => {
      if (!useColorBands || !colorBands?.ranges) return color;

      for (const range of colorBands.ranges) {
        if (value >= range.min && value <= range.max) {
          return range.color;
        }
      }
      return color;
    };

    // グラデーションセグメントを描画する関数
    const drawGradientSegment = (
      startAngle: number,
      endAngle: number,
      startValue: number,
      endValue: number
    ) => {
      const gradient = ctx.createConicGradient(startAngle, centerX, centerY);
      gradient.addColorStop(0, getSegmentColor(startValue));
      gradient.addColorStop(1, getSegmentColor(endValue));

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.arc(centerX, centerY, getRadius(startValue), startAngle, endAngle);
      ctx.stroke();
    };

    ctx.lineWidth = 2;

    if (useColorBands && colorBands?.ranges) {
      // カラーバンドを使用する場合は、セグメントごとにグラデーションを適用
      for (let i = 0; i < channel.length - 1; i++) {
        const startAngle = i * angleStep;
        const endAngle = (i + 1) * angleStep;
        const startValue = Math.abs(channel[i]);
        const endValue = Math.abs(channel[i + 1]);
        drawGradientSegment(startAngle, endAngle, startValue, endValue);
      }
      // 最後のセグメントを閉じる
      drawGradientSegment(
        (channel.length - 1) * angleStep,
        2 * Math.PI,
        Math.abs(channel[channel.length - 1]),
        Math.abs(channel[0])
      );
    } else {
      // 通常の単色描画
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i < channel.length; i++) {
        const value = channel[i];
        const currentRadius = getRadius(value);
        const angle = i * angleStep;
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);

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
} 