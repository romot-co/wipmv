import { EffectBase } from '../../core/types/core';
import { TextEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { AudioSource } from '../../core/types/base';

// BoundingBox型の定義
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * テキストエフェクト
 * - テキストの描画
 * - アニメーション（フェード/スケール/移動/回転/色）
 * - アラインメント制御
 */
export class TextEffect extends EffectBase<TextEffectConfig> {
  private animationController: AnimationController | null = null;

  constructor(config: TextEffectConfig, audioSource?: AudioSource) {
    super(config, true);
    // this.isDraggable = true; // テキストエフェクトはドラッグ可能（読み取り専用のため削除）
    if (audioSource) {
      this.setAudioSource(audioSource);
    }

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }
  }

  update(currentTime: number): void {
    // ★ 表示状態を更新
    this.visible = this.isActive(currentTime);
    if (!this.visible) return;

    // アニメーションなど、時間経過による更新処理があればここに追加
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = Infinity } = this.config;
      const duration = endTime === Infinity ? Infinity : endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const config = this.getConfig();
    
    if (!config.visible) return;
    
    const { text, position, size, color, font, alignment = 'center' } = config;
    
    // キャンバスの寸法を取得
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // テキスト描画の基本設定
    ctx.save();
    
    // 画像のスムージングを有効にして品質を高く設定
    if ('imageSmoothingEnabled' in ctx) {
      ctx.imageSmoothingEnabled = true;
    }
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high';
    }
    
    // テキストレンダリングの最適化（高品質設定）
    if ('fontKerning' in ctx) {
      (ctx as any).fontKerning = 'normal';
    }
    if ('textRendering' in ctx) {
      (ctx as any).textRendering = 'optimizeLegibility';
    }
    
    // フォント設定の最適化（より正確なピクセル合わせ）
    const pixelRatio = window.devicePixelRatio || 1;
    const fontSize = Math.round(font.size * pixelRatio) / pixelRatio;
    let fontStyle = `${font.weight || ''} ${fontSize}px "${font.family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    ctx.font = fontStyle.trim();
    ctx.fillStyle = color || '#000000';
    ctx.textAlign = alignment as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    
    // シャドウ設定（現在は無効化）
    // TODO: TextEffectConfigにshadowプロパティを追加する場合は有効化
    
    // テキスト位置の計算（相対座標をピクセル座標に変換）
    const x = position.x * width;
    const y = position.y * height;
    
    // デバイスピクセル比を考慮して高DPI対応
    if (pixelRatio > 1) {
      // 高DPIディスプレイの場合、テキストをよりシャープに描画
      const delta = 0.5 / pixelRatio; // サブピクセルオフセット
      
      // メインのテキストを描画
      this.drawAlignedText(ctx, text, x, y, width, alignment);
      
      // 微調整描画（シャープニング効果）
      ctx.globalAlpha = 0.25;
      this.drawAlignedText(ctx, text, x + delta, y, width, alignment);
      this.drawAlignedText(ctx, text, x - delta, y, width, alignment);
      this.drawAlignedText(ctx, text, x, y + delta, width, alignment);
      this.drawAlignedText(ctx, text, x, y - delta, width, alignment);
      
      ctx.globalAlpha = 1.0;
    } else {
      // 通常解像度のディスプレイでは単純に1回描画
      this.drawAlignedText(ctx, text, x, y, width, alignment);
    }
    
    ctx.restore();
  }

  // 配置に応じてテキストを描画するヘルパーメソッド
  private drawAlignedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, alignment: string): void {
    if (alignment === 'center') {
      ctx.fillText(text, x, y);
    } else if (alignment === 'left') {
      ctx.fillText(text, 0 + 10, y); // 左端から少し余白を持たせる
    } else if (alignment === 'right') {
      ctx.fillText(text, width - 10, y); // 右端から少し余白を持たせる
    }
  }
  
  // 色の明暗を判定するヘルパーメソッド
  private isColorDark(color: string): boolean {
    // 16進数カラーコードを解析
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
    } else if (color.startsWith('rgb')) {
      const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      } else {
        return true; // 解析できない場合は暗いと仮定
      }
    } else {
      return true; // デフォルトは暗いと仮定
    }
    
    // 色の輝度を計算（ITU-R BT.709 推奨のウェイト）
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    
    // 輝度が0.5未満なら暗い色とみなす
    return luminance < 0.5;
  }

  // バウンディングボックスの計算（統一されたインターフェース）
  getBoundingBox(canvasWidth: number, canvasHeight: number): { x: number; y: number; width: number; height: number; } | null {
    const config = this.getConfig();
    const { position, font, text } = config;
    
    if (!config.visible) return null;
    
    // テキストサイズの実際の推定（より正確な計算）
    const charWidth = font.size * 0.6; // 文字幅の推定値
    const textWidth = text.length * charWidth;
    const textHeight = font.size * 1.2; // 行の高さを考慮
    
    // 相対座標を絶対座標に変換
    const absoluteX = position.x * canvasWidth;
    const absoluteY = position.y * canvasHeight;
    
    // テキストの配置に応じてバウンディングボックスを調整
    const { alignment = 'center' } = config;
    let x = absoluteX;
    
    if (alignment === 'center') {
      x = absoluteX - textWidth / 2;
    } else if (alignment === 'left') {
      x = 10; // 左端から少し余白
    } else if (alignment === 'right') {
      x = canvasWidth - textWidth - 10; // 右端から少し余白
    }
    
    return {
      x: x,
      y: absoluteY - textHeight / 2,
      width: textWidth,
      height: textHeight
    };
  }

  dispose(): void {
    this.animationController = null;
  }
} 