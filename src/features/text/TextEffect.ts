import { EffectBase } from '../../core/EffectBase';
import { TextEffectConfig } from '../../core/types';

/**
 * テキストエフェクト
 * - テキストの描画
 * - アニメーション（フェード/スケール/移動/回転/色）
 * - アラインメント制御
 */
export class TextEffect extends EffectBase<TextEffectConfig> {
  private animationState: {
    progress: number;
    opacity: number;
    scale: number;
    position: { x: number; y: number };
    rotation: number;
    color: string;
  } | null = null;

  constructor(config: TextEffectConfig) {
    super({
      ...config,
      text: config.text ?? 'テキストを入力',
      fontFamily: config.fontFamily ?? 'Arial',
      fontSize: config.fontSize ?? 48,
      fontWeight: config.fontWeight ?? 'bold',
      color: config.color ?? '#ffffff',
      align: config.align ?? 'center',
      position: config.position ?? { x: 400, y: 300 },
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (!this.isActive(currentTime)) return;

    const config = this.getConfig();
    const animation = config.animation;
    if (!animation) {
      this.animationState = null;
      return;
    }

    // アニメーションの進行度を計算
    const startTime = config.startTime ?? 0;
    const duration = animation.duration;
    const delay = animation.delay ?? 0;
    let progress = (currentTime - startTime - delay) / duration;

    // 進行度が範囲外の場合は更新しない
    if (progress < 0 || progress > 1) {
      this.animationState = null;
      return;
    }

    // イージングの適用
    progress = this.applyEasing(progress, animation.easing);

    // アニメーション状態の更新
    this.animationState = {
      progress,
      opacity: config.opacity ?? 1,
      scale: 1,
      position: { ...config.position },
      rotation: 0,
      color: config.color ?? '#ffffff'
    };

    // アニメーション種別ごとの処理
    let from: number;
    let to: number;
    let fromColor: { r: number; g: number; b: number; a: number };
    let toColor: { r: number; g: number; b: number; a: number };
    let r: number;
    let g: number;
    let b: number;
    let a: number;

    switch (animation.type) {
      case 'fade':
        from = animation.from ?? 0;
        to = animation.to ?? 1;
        this.animationState.opacity = from + (to - from) * progress;
        break;

      case 'scale':
        this.animationState.scale = animation.from + (animation.to - animation.from) * progress;
        break;

      case 'move':
        this.animationState.position = {
          x: animation.from.x + (animation.to.x - animation.from.x) * progress,
          y: animation.from.y + (animation.to.y - animation.from.y) * progress
        };
        break;

      case 'rotate':
        this.animationState.rotation = (animation.from + (animation.to - animation.from) * progress) * Math.PI / 180;
        break;

      case 'color':
        ({ from: fromColor, to: toColor } = animation);
        r = Math.round(fromColor.r + (toColor.r - fromColor.r) * progress);
        g = Math.round(fromColor.g + (toColor.g - fromColor.g) * progress);
        b = Math.round(fromColor.b + (toColor.b - fromColor.b) * progress);
        a = fromColor.a + (toColor.a - fromColor.a) * progress;
        this.animationState.color = `rgba(${r},${g},${b},${a})`;
        break;
    }
  }

  /**
   * テキストを描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    const config = this.getConfig();
    if (!config.text) return;

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = this.animationState?.opacity ?? config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';
      ctx.textAlign = config.align ?? 'center';
      ctx.textBaseline = 'middle';

      // フォント設定
      ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
      ctx.fillStyle = this.animationState?.color ?? config.color ?? '#ffffff';

      // 描画位置の計算
      const position = this.animationState?.position ?? config.position;
      const scale = this.animationState?.scale ?? 1;
      const rotation = this.animationState?.rotation ?? 0;

      // 変形の適用
      ctx.translate(position.x, position.y);
      if (rotation !== 0) ctx.rotate(rotation);
      if (scale !== 1) ctx.scale(scale, scale);

      // テキストの描画
      ctx.fillText(config.text, 0, 0);
    } finally {
      ctx.restore();
    }
  }

  /**
   * イージング関数の適用
   */
  private applyEasing(progress: number, easing?: string): number {
    switch (easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress; // linear
    }
  }

  /**
   * リソースの解放
   */
  override dispose(): void {
    this.animationState = null;
    super.dispose();
  }
} 