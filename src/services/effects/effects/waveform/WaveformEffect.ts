import { Effect } from '../../base/Effect';
import { WaveformNode } from '../../nodes/waveform/WaveformNode';
import { WaveformDataNode } from '../../nodes/waveform/WaveformDataNode';
import { WaveformStyleNode } from '../../nodes/waveform/WaveformStyleNode';
import { BlendNode } from '../../nodes/blend/BlendNode';
import { TransformNode } from '../../nodes/transform/TransformNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseEffectConfig } from '../../../../types/effects/base';

export interface WaveformEffectOptions {
  // 波形の表示スタイル
  style?: {
    type: 'line' | 'bar' | 'circle';
    color: string;
    width?: number;
    gap?: number;
  };
  // データの処理方法
  data?: {
    smoothing?: number;
    scale?: number;
    mirror?: boolean;
  };
  // 表示位置と変形
  transform?: {
    position?: { x: number; y: number };
    scale?: { x: number; y: number };
    rotation?: number;
  };
  // ブレンド設定
  blend?: {
    mode?: GlobalCompositeOperation;
    opacity?: number;
  };
}

/**
 * 波形エフェクト
 * オーディオデータを視覚化して波形として描画します
 */
export class WaveformEffect extends Effect {
  private readonly waveformNode: WaveformNode;
  private readonly dataNode: WaveformDataNode;
  private readonly styleNode: WaveformStyleNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(options: WaveformEffectOptions = {}) {
    super('waveform', {
      type: 'waveform',
      opacity: options.blend?.opacity ?? 1.0,
      blendMode: options.blend?.mode ?? 'source-over'
    });

    // 波形の基本ノード
    this.waveformNode = new WaveformNode({
      type: 'waveform'
    });

    // データ処理ノード
    this.dataNode = new WaveformDataNode({
      type: 'waveform-data',
      amplification: options.data?.scale ?? 1.0,
      smoothing: options.data?.smoothing ?? 0.5
    });

    // スタイル適用ノード
    this.styleNode = new WaveformStyleNode({
      type: 'waveform-style',
      style: options.style?.type === 'bar' ? 'bars' : 'line',
      color: options.style?.color ?? '#ffffff',
      lineWidth: options.style?.width ?? 2,
      height: 1,
      verticalPosition: 0.5,
      barWidth: options.style?.width,
      barSpacing: options.style?.gap
    });

    // ブレンドノード
    this.blendNode = new BlendNode({
      type: 'blend',
      mode: options.blend?.mode ?? 'source-over',
      opacity: options.blend?.opacity ?? 1.0
    });

    // 変形ノード
    this.transformNode = new TransformNode({
      type: 'transform',
      position: options.transform?.position ?? { x: 0.5, y: 0.5 },
      scale: options.transform?.scale ?? { x: 1, y: 1 },
      rotation: options.transform?.rotation ?? 0
    });

    // ノードの接続
    this.waveformNode.setNext(this.dataNode);
    this.dataNode.setNext(this.styleNode);
    this.styleNode.setNext(this.blendNode);
    this.blendNode.setNext(this.transformNode);

    // ルートノードを設定
    this.rootNode = this.waveformNode;
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (this.rootNode) {
      this.rootNode.process(parameters, canvas);
    }
  }

  dispose(): void {
    super.dispose();
  }

  getConfig(): BaseEffectConfig {
    return {
      type: 'waveform',
      opacity: this.config.opacity,
      blendMode: this.config.blendMode
    };
  }
} 