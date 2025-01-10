import { Effect, EffectConfig } from '../../base';
import { TextNode, TextNodeOptions, TextAnimationNode, TextAnimationOptions } from '../../nodes';
import { AudioVisualParameters } from '../../../../types/audio';

export interface TextEffectConfig extends EffectConfig {
  type: 'text';
  text: string;
  font: string;
  fontSize: number;
  color: string;
  animation: 'none' | 'fade' | 'slide';
}

/**
 * アニメーション付きテキストを描画するエフェクト
 */
export class TextEffect extends Effect {
  private readonly textNode: TextNode;
  private animationNode?: TextAnimationNode;

  constructor(config: TextEffectConfig) {
    super('text', config);

    // テキストノードの設定
    const textOptions: TextNodeOptions = {
      text: config.text,
      font: config.font,
      fontSize: config.fontSize,
      color: config.color,
      textAlign: 'center',
      textBaseline: 'middle'
    };
    this.textNode = new TextNode(textOptions);
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    currentTime: number,
    audioData?: Float32Array
  ): void {
    if (!this.isVisible(currentTime)) return;

    const config = this.config as TextEffectConfig;
    const canvas = new OffscreenCanvas(width, height);
    const parameters: AudioVisualParameters = {
      currentTime,
      duration: config.endTime! - config.startTime!,
      timeData: audioData ? [audioData] : [new Float32Array()],
      frequencyData: [new Float32Array()],
      sampleRate: 44100,
      numberOfChannels: 2,
      fftSize: 2048,
      canvas: {
        width,
        height,
        context: canvas.getContext('2d')!
      }
    };

    // アニメーションノードの設定
    if (config.animation !== 'none') {
      const animationOptions: TextAnimationOptions = {
        animation: this.mapAnimation(config.animation, currentTime >= config.endTime! - 500),
        startTime: config.startTime!,
        endTime: config.endTime!,
        fadeInDuration: 500,
        fadeOutDuration: 500,
        slideDistance: 100
      };
      
      if (!this.animationNode) {
        this.animationNode = new TextAnimationNode(animationOptions);
        this.animationNode.setNext(this.textNode);
        this.rootNode = this.animationNode;
      } else {
        Object.assign(this.animationNode, animationOptions);
      }
    } else {
      this.rootNode = this.textNode;
    }

    // 位置の設定
    const posX = config.position.x * width;
    const posY = config.position.y * height;

    ctx.save();
    ctx.translate(posX, posY);

    if (this.rootNode) {
      this.rootNode.process(parameters, canvas);
    }

    ctx.restore();
  }

  private mapAnimation(animation: 'none' | 'fade' | 'slide', isEnding: boolean): 'none' | 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' {
    switch (animation) {
      case 'fade':
        return isEnding ? 'fadeOut' : 'fadeIn';
      case 'slide':
        return isEnding ? 'slideOut' : 'slideIn';
      default:
        return 'none';
    }
  }

  dispose(): void {
    this.textNode.dispose();
    this.animationNode?.dispose();
  }
}

/**
 * TextEffectのファクトリー関数
 */
export const createTextEffect = (config: TextEffectConfig): TextEffect => {
  return new TextEffect(config);
}; 