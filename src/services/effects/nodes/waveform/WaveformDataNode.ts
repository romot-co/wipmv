import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

export interface WaveformDataOptions {
  amplification?: number;
  smoothing?: number;
}

interface WaveformDataNodeConfig extends BaseNodeConfig {
  type: 'waveform-data';
  amplification: number;
  smoothing: number;
}

/**
 * 波形データを処理するノード
 * データの正規化とスムージングを担当
 */
export class WaveformDataNode extends BaseEffectNode {
  private readonly amplification: number;
  private readonly smoothing: number;
  private lastValues: number[] = [];

  constructor(options: WaveformDataOptions) {
    super();
    this.amplification = options.amplification ?? 1.0;
    this.smoothing = options.smoothing ?? 0.5;
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  /**
   * 波形データを処理します
   */
  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!parameters.timeData[0]) return;

    const audioData = parameters.timeData[0];
    const processedData = new Float32Array(audioData.length);

    // データの処理
    for (let i = 0; i < audioData.length; i++) {
      const value = audioData[i] * this.amplification;
      
      // スムージングの適用
      if (this.lastValues[i] === undefined) {
        this.lastValues[i] = value;
      }
      const smoothedValue = this.lastValues[i] * this.smoothing + value * (1 - this.smoothing);
      this.lastValues[i] = smoothedValue;
      
      processedData[i] = smoothedValue;
    }

    // 処理したデータを次のノードに渡す
    parameters.timeData[0] = processedData;
    this.passToNext(parameters, canvas);
  }

  dispose(): void {
    this.lastValues = [];
  }

  getConfig(): WaveformDataNodeConfig {
    return {
      type: 'waveform-data',
      amplification: this.amplification,
      smoothing: this.smoothing
    };
  }
} 