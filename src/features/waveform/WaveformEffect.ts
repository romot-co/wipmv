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
    const { color = '#ffffff', barWidth = 3, barSpacing = 1, size = { width: 0.95, height: 0.2 } } = this.config;

    // 描画領域の計算
    const drawWidth = width * size.width;
    const drawHeight = height * size.height;
    const drawX = (width - drawWidth) / 2;
    const drawY = (height - drawHeight) / 2;

    // 描画スタイルの設定
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.fillStyle = color;

    // 波形データの描画
    const channel = this.currentWaveformData[0]; // モノラル or 左チャンネル
    const barCount = Math.floor(drawWidth / (barWidth + barSpacing));
    const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));

    for (let i = 0; i < barCount; i++) {
      // 各バーの波形データを平均化
      let sum = 0;
      const startSample = i * samplesPerBar;
      const endSample = Math.min(startSample + samplesPerBar, channel.length);
      
      for (let j = startSample; j < endSample; j++) {
        sum += Math.abs(channel[j]);
      }
      
      const amplitude = sum / samplesPerBar;
      const barHeight = amplitude * drawHeight;
      
      // バーを描画
      const x = i * (barWidth + barSpacing);
      const y = (drawHeight - barHeight) / 2;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    ctx.restore();
  }
} 