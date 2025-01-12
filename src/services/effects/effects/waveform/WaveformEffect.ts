import { Effect } from '../../base/Effect';
import { WaveformDataNode } from '../../nodes/waveform/WaveformDataNode';
import { WaveformStyleNode } from '../../nodes/waveform/WaveformStyleNode';
import { BlendNode } from '../../nodes/blend/BlendNode';
import { TransformNode } from '../../nodes/transform/TransformNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseEffectConfig } from '../../../../types/effects/base';

export interface WaveformEffectConfig extends BaseEffectConfig {
  /** データ処理設定 */
  data: {
    /** 増幅率 */
    amplification?: number;
    /** スムージング係数（0-1） */
    smoothing?: number;
    /** 周波数範囲 */
    range?: {
      min: number;
      max: number;
    };
  };
  /** スタイル設定 */
  style: {
    /** 描画スタイル */
    type: 'waveform-line' | 'waveform-bar' | 'waveform-area';
    /** 線の色 */
    color: string;
    /** 線の太さ */
    lineWidth?: number;
    /** 塗りつぶし色（areaタイプのみ） */
    fillColor?: string;
    /** バーの間隔（barタイプのみ） */
    barSpacing?: number;
    /** 波形の高さ（%） */
    height?: number;
    /** 垂直位置（%） */
    verticalPosition?: number;
  };
}

/**
 * 波形エフェクト
 * オーディオデータを視覚化して波形として描画します
 */
export class WaveformEffect extends Effect {
  private readonly dataNode: WaveformDataNode;
  private readonly styleNode: WaveformStyleNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(config: WaveformEffectConfig) {
    super(config);

    // データ処理ノード
    this.dataNode = new WaveformDataNode({
      type: 'waveform-data',
      amplification: config.data.amplification ?? 1.0,
      smoothing: config.data.smoothing ?? 0.5,
      range: config.data.range ?? { min: 0, max: 22050 }
    });

    // スタイル適用ノード
    this.styleNode = new WaveformStyleNode({
      type: config.style.type,
      color: config.style.color,
      lineWidth: config.style.lineWidth,
      fillColor: config.style.fillColor,
      barSpacing: config.style.barSpacing,
      height: config.style.height,
      verticalPosition: config.style.verticalPosition
    });

    // ブレンドノード
    this.blendNode = new BlendNode({
      mode: config.blendMode ?? 'source-over',
      opacity: config.opacity ?? 1.0
    });

    // 変形ノード
    this.transformNode = new TransformNode({
      position: { x: 0.5, y: 0.5 },
      scale: { x: 1, y: 1 }
    });

    // ノードの接続
    this.dataNode
      .setNext(this.styleNode)
      .setNext(this.blendNode)
      .setNext(this.transformNode);

    this.rootNode = this.dataNode;
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) {
      return;
    }
    this.rootNode?.process(parameters, canvas);
  }
}

/**
 * WaveformEffectのファクトリー関数
 */
export const createWaveformEffect = (config: Partial<WaveformEffectConfig> = {}): WaveformEffect => {
  return new WaveformEffect({
    id: crypto.randomUUID(),
    type: 'waveform',
    data: {
      amplification: 1.0,
      smoothing: 0.5,
      range: { min: 0, max: 22050 },
      ...config.data
    },
    style: {
      type: 'waveform-line',
      color: '#ffffff',
      lineWidth: 2,
      height: 100,
      verticalPosition: 50,
      ...config.style
    },
    ...config,
  });
}; 