import { EffectBase } from '../../core/types/core';
import { TextEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { Color } from '../../core/types/base';
import { convertPosition } from '../../utils/coordinates';
import { AudioSource } from '../../core/audio/AudioSource';
import { RenderContext } from '../../core/types/render';
import { BoundingBox } from '../../core/types/base';

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
    this.isDraggable = true; // テキストエフェクトはドラッグ可能
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

  render(ctx: RenderContext): void {
    const config = this.getConfig();
    
    if (!config.visible) return;
    
    const { text, position, size, color, font, shadow, alignment = 'center' } = config;
    
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
    
    // シャドウ設定（設定されている場合）
    if (shadow && shadow.enabled) {
      // テキストが黒/濃い色の場合、明るいシャドウを使用してコントラストを高める
      const isColorDark = color && this.isColorDark(color);
      const defaultBlur = Math.max(2, fontSize / 15); // フォントサイズに基づいてぼかしを調整
      
      ctx.shadowColor = shadow.color || (isColorDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)');
      ctx.shadowBlur = shadow.blur !== undefined ? shadow.blur : defaultBlur;
      ctx.shadowOffsetX = shadow.offsetX || 0;
      ctx.shadowOffsetY = shadow.offsetY || 0;
    }
    
    // テキスト位置の計算（相対座標をピクセル座標に変換）
    const x = position.x * width;
    const y = position.y * height;
    
    // デバイスピクセル比を考慮して高DPI対応
    if (pixelRatio > 1) {
      // 高DPIディスプレイの場合、テキストをよりシャープに描画
      const delta = 0.5 / pixelRatio; // サブピクセルオフセット
      
      // メインのテキストを描画
      this.drawAlignedText(ctx, text, x, y, width, alignment);
      
      if (shadow && shadow.enabled) {
        // シャドウをリセットして微調整描画
        const originalShadowColor = ctx.shadowColor;
        const originalShadowBlur = ctx.shadowBlur;
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 輪郭を微調整（薄いシャープニング効果）
        ctx.globalAlpha = 0.25;
        this.drawAlignedText(ctx, text, x + delta, y, width, alignment);
        this.drawAlignedText(ctx, text, x - delta, y, width, alignment);
        this.drawAlignedText(ctx, text, x, y + delta, width, alignment);
        this.drawAlignedText(ctx, text, x, y - delta, width, alignment);
        
        // 元のシャドウ設定を復元しない（すでに本体テキストは描画済み）
      } else {
        // シャドウがない場合は微調整のみ
        ctx.globalAlpha = 0.25;
        this.drawAlignedText(ctx, text, x + delta, y, width, alignment);
        this.drawAlignedText(ctx, text, x - delta, y, width, alignment);
        this.drawAlignedText(ctx, text, x, y + delta, width, alignment);
        this.drawAlignedText(ctx, text, x, y - delta, width, alignment);
      }
      
      ctx.globalAlpha = 1.0;
    } else {
      // 通常解像度のディスプレイでは単純に1回描画
      this.drawAlignedText(ctx, text, x, y, width, alignment);
    }
    
    ctx.restore();
  }

  // 配置に応じてテキストを描画するヘルパーメソッド
  private drawAlignedText(ctx: RenderContext, text: string, x: number, y: number, width: number, alignment: string): void {
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

  // ヒットテスト（クリック判定）
  hitTest(relativePos: { x: number; y: number }): boolean {
    const config = this.getConfig();
    if (!config.visible) return false;
    
    const bbox = this.getBoundingBox();
    
    return (
      relativePos.x >= bbox.x &&
      relativePos.x <= bbox.x + bbox.width &&
      relativePos.y >= bbox.y &&
      relativePos.y <= bbox.y + bbox.height
    );
  }

  // バウンディングボックスの計算
  getBoundingBox(): BoundingBox {
    const config = this.getConfig();
    const { position, font, text } = config;
    
    // テキストの長さに基づいた幅の計算（推定）
    // 実際のテキスト測定には Canvas の measureText API を使用するのが正確
    const estimatedWidth = text.length * (font.size / 2) / 500; // 500は canvas width の仮定値
    const estimatedHeight = font.size / 250; // 250は canvas height の仮定値
    
    return {
      x: position.x - estimatedWidth / 2,
      y: position.y - estimatedHeight / 2,
      width: estimatedWidth,
      height: estimatedHeight
    };
  }

  dispose(): void {
    this.animationController = null;
  }
}
