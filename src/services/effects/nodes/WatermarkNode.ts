import { ImageNode, ImageNodeOptions } from './ImageNode';

export interface WatermarkNodeOptions extends ImageNodeOptions {
  // ウォーターマーク固有のオプションがあれば追加
}

export class WatermarkNode extends ImageNode {
  constructor(options: WatermarkNodeOptions) {
    // デフォルト値の設定
    const defaultOptions: Partial<WatermarkNodeOptions> = {
      position: { x: 0.95, y: 0.95 }, // 右下
      size: { width: 0.2, height: 0.1 }, // キャンバスの20%x10%
      opacity: 0.8,
      scaleMode: 'contain',
      blendMode: 'source-over'
    };

    super({
      ...defaultOptions,
      ...options,
    });
  }
} 