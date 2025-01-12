import { EffectBase, BaseEffectState } from '../../core/EffectBase';
import { WatermarkEffectConfig, AudioVisualParameters } from '../../core/types';
import { ImageLoader } from '../../core/ImageLoader';

interface WatermarkEffectState extends BaseEffectState {
  imageLoaded: boolean;
  imageSize: {
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
  } | null;
  transformMatrix: DOMMatrix | null;
}

/**
 * ウォーターマークエフェクト
 * 画像をウォーターマークとして描画する
 */
export class WatermarkEffect extends EffectBase<WatermarkEffectState> {
  protected override config: WatermarkEffectConfig;
  private image: HTMLImageElement | null = null;
  private imageLoader: ImageLoader;

  constructor(config: WatermarkEffectConfig) {
    const initialState: WatermarkEffectState = {
      isReady: false,
      isLoading: !!config.imageUrl,
      error: null,
      imageLoaded: false,
      imageSize: null,
      transformMatrix: null
    };
    super(config, initialState);
    this.config = config;
    this.imageLoader = ImageLoader.getInstance();
    
    if (config.imageUrl) {
      this.loadImage(config.imageUrl);
    }
  }

  override updateConfig(newConfig: Partial<WatermarkEffectConfig>, batch = false): void {
    super.updateConfig(newConfig, batch);
    
    if (!batch) {
      // 画像URLが変更された場合は再ロード
      if ('imageUrl' in newConfig) {
        this.updateState({
          isLoading: true,
          isReady: false,
          imageLoaded: false,
          imageSize: null,
          transformMatrix: null
        });
        this.loadImage(this.config.imageUrl);
      }

      // 位置やスタイルが変更された場合は変換行列を更新
      if ('position' in newConfig || 'style' in newConfig) {
        this.updateTransformMatrix();
      }
    }
  }

  private async loadImage(url: string): Promise<void> {
    if (!url) {
      this.image = null;
      this.updateState({
        isReady: true,
        isLoading: false,
        imageLoaded: false,
        imageSize: null,
        transformMatrix: null,
        error: null
      });
      return;
    }

    try {
      const result = await this.imageLoader.loadImage(url);
      this.image = result.image;
      
      const imageSize = {
        width: this.config.position.width ?? result.width,
        height: this.config.position.height ?? result.height,
        naturalWidth: result.width,
        naturalHeight: result.height
      };

      this.updateState({
        isReady: true,
        isLoading: false,
        error: null,
        imageLoaded: true,
        imageSize
      });

      this.updateTransformMatrix();
    } catch (error) {
      this.image = null;
      this.updateState({
        isReady: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load image'),
        imageLoaded: false,
        imageSize: null,
        transformMatrix: null
      });
    }
  }

  private updateTransformMatrix(): void {
    if (!this.image || !this.state.imageSize) return;

    const { position } = this.config;
    const { width, height } = this.state.imageSize;

    const matrix = new DOMMatrix();
    matrix.translateSelf(position.x + width / 2, position.y + height / 2);
    
    if (position.rotation) {
      matrix.rotateSelf(position.rotation);
    }
    if (position.scale) {
      matrix.scaleSelf(position.scale, position.scale);
    }
    
    matrix.translateSelf(-width / 2, -height / 2);

    this.updateState({
      transformMatrix: matrix
    });
  }

  override render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;
    if (!this.state.isReady || !this.image || !this.state.imageSize) return;

    const { style } = this.config;
    const { width, height } = this.state.imageSize;

    ctx.save();
    try {
      // 基本的な描画設定
      ctx.globalAlpha = style.opacity;
      if (style.blendMode) {
        ctx.globalCompositeOperation = style.blendMode;
      }

      // 変換行列の適用
      if (this.state.transformMatrix) {
        ctx.setTransform(this.state.transformMatrix);
      }

      // 画像の描画
      ctx.drawImage(this.image, 0, 0, width, height);

      // リピート描画
      if (this.config.repeat) {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const margin = this.config.margin || { x: 0, y: 0 };
        
        for (let x = -width; x <= canvasWidth + width; x += width + margin.x) {
          for (let y = -height; y <= canvasHeight + height; y += height + margin.y) {
            if (x === 0 && y === 0) continue; // 中央は既に描画済み
            ctx.drawImage(this.image, x, y, width, height);
          }
        }
      }
    } finally {
      ctx.restore();
    }
  }

  /**
   * リソースを解放
   */
  protected override disposeResources(): void {
    // 画像リソースの解放
    if (this.image) {
      this.image.src = '';
      this.image = null;
    }

    // ImageLoaderのキャッシュから削除
    if (this.config.imageUrl) {
      this.imageLoader.removeFromCache(this.config.imageUrl);
    }

    // 変換行列の解放
    this.updateState({
      ...this.state,
      transformMatrix: null
    });
  }

  protected override handleConfigChange(
    changes: ReturnType<typeof this.analyzeConfigChanges>
  ): void {
    // 表示状態が変更された場合
    if (changes.visibilityChanged) {
      this.updateState({
        ...this.state,
        isReady: this.config.visible ? this.state.imageLoaded : false
      });
    }

    // タイミングが変更された場合
    if (changes.timingChanged) {
      // 必要に応じて追加の処理
    }
  }
} 