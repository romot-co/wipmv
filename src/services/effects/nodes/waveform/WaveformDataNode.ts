import { Node } from '../../base/Node';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

/**
 * 波形データノードの設定
 */
export interface WaveformDataConfig extends BaseNodeConfig {
  /** 増幅率 */
  amplification?: number;
  /** スムージング係数（0-1） */
  smoothing?: number;
  /** 周波数範囲 */
  range?: {
    min: number;
    max: number;
  };
}

/**
 * 波形データを処理するノード
 * データの正規化とスムージングを担当
 */
export class WaveformDataNode extends Node {
  private amplification: number;
  private smoothing: number;
  private range: { min: number; max: number };
  private lastValues: number[] = [];

  constructor(config: WaveformDataConfig) {
    super('waveform-data');
    this.amplification = config.amplification ?? 1.0;
    this.smoothing = config.smoothing ?? 0.5;
    this.range = config.range ?? { min: 0, max: 22050 };
  }

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
} 