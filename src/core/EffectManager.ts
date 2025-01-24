/**
 * エフェクトマネージャー
 * 
 * - 複数のエフェクトを管理し、z-index順にソートして描画
 * - エフェクトの追加/削除/更新を一元管理
 * - プレビュー時はrequestAnimationFrameでレンダリングループを実行
 * - エンコード時は単一フレーム単位で描画を実行
 * - AudioPlaybackServiceと連携して再生時間に応じた描画を実現
 * - キャンバスサイズ変更時に全エフェクトの座標とサイズを更新
 * - プレビュー時は低解像度、エクスポート時は元の解像度で描画
 */

import { EffectBase } from './EffectBase';
import { EffectConfig } from './types';
import { AppError, ErrorType, ErrorMessages } from './types';
import { AudioPlaybackService } from './AudioPlaybackService';
import { Renderer } from './Renderer';
import { updateRectForResize } from '../utils/coordinates';
import { VideoEncoderService } from './VideoEncoderService';
import { AudioSource } from './types';

/**
 * エフェクトマネージャー
 * - エフェクトの追加・削除・更新・描画を一元管理
 * - zIndexによる描画順序の制御
 * - プレビューとエンコードで共通のロジックを提供
 */
export class EffectManager {
  // zIndex関連の定数
  private static readonly BASE_Z_INDEX = 1000; // 基準となるzIndex
  private static readonly Z_INDEX_STEP = 10;   // zIndex間の間隔
  private static readonly MIN_Z_INDEX = 0;     // 最小zIndex
  private static readonly MAX_Z_INDEX = 9999;  // 最大zIndex

  // プレビュー用の解像度定数
  private static readonly PREVIEW_MAX_WIDTH = 1280;  // プレビュー時の最大幅
  private static readonly PREVIEW_MAX_HEIGHT = 720;  // プレビュー時の最大高さ

  private effects: EffectBase<EffectConfig>[] = [];
  private needsSort: boolean = false;
  private isRendering: boolean = false;
  private rafId: number | null = null;
  private audioService: AudioPlaybackService | null = null;
  private renderer: Renderer | null = null;
  private lastCanvasSize: { width: number; height: number } | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private originalSize: { width: number; height: number } | null = null; // 元の解像度を保持

  /**
   * プレビュー用の解像度を計算
   * アスペクト比を維持しながら最大サイズに収める
   */
  private calculatePreviewSize(width: number, height: number): { width: number; height: number } {
    const aspectRatio = width / height;
    
    if (width <= EffectManager.PREVIEW_MAX_WIDTH && height <= EffectManager.PREVIEW_MAX_HEIGHT) {
      return { width, height };
    }
    
    if (width / EffectManager.PREVIEW_MAX_WIDTH > height / EffectManager.PREVIEW_MAX_HEIGHT) {
      // 幅に合わせてスケール
      return {
        width: EffectManager.PREVIEW_MAX_WIDTH,
        height: Math.round(EffectManager.PREVIEW_MAX_WIDTH / aspectRatio)
      };
    } else {
      // 高さに合わせてスケール
      return {
        width: Math.round(EffectManager.PREVIEW_MAX_HEIGHT * aspectRatio),
        height: EffectManager.PREVIEW_MAX_HEIGHT
      };
    }
  }

  /**
   * プレビュー用キャンバスを設定
   */
  setPreviewCanvas(canvas: HTMLCanvasElement, originalWidth?: number, originalHeight?: number): void {
    try {
      const oldSize = this.lastCanvasSize;
      
      // 元のサイズを保存
      if (originalWidth && originalHeight) {
        this.originalSize = { width: originalWidth, height: originalHeight };
      }
      
      // プレビューサイズを計算
      const previewSize = this.calculatePreviewSize(
        originalWidth ?? canvas.width,
        originalHeight ?? canvas.height
      );
      
      // キャンバスのサイズを設定
      canvas.width = previewSize.width;
      canvas.height = previewSize.height;
      
      this.renderer = new Renderer(canvas);
      const newSize = this.renderer.getOriginalSize();
      
      // サイズが変更されていれば更新処理を実行
      if (oldSize && (
        oldSize.width !== newSize.width ||
        oldSize.height !== newSize.height
      )) {
        console.log('EffectManager: キャンバスサイズ変更を検知', { oldSize, newSize });
        this.handleCanvasResize(oldSize, newSize);
      }
      
      this.lastCanvasSize = newSize;
      this.previewCanvas = canvas;
    } catch (error) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to initialize renderer',
        error
      );
    }
  }

  /**
   * AudioPlaybackServiceを設定
   */
  setAudioService(service: AudioPlaybackService): void {
    this.audioService = service;
  }

  /**
   * プレビューのレンダリングループを開始
   */
  startPreviewLoop(): void {
    if (this.isRendering || !this.renderer) return;
    this.isRendering = true;

    const renderFrame = () => {
      if (!this.isRendering || !this.renderer) {
        this.stopPreviewLoop();
        return;
      }

      // 現在時刻を取得
      const currentTime = this.audioService?.getCurrentTime() ?? 0;

      // オフスクリーンコンテキストを取得
      const ctx = this.renderer.getOffscreenContext();

      // キャンバスをクリア
      this.renderer.clear();

      // エフェクトの更新と描画
      this.updateAll(currentTime);
      this.renderAll(ctx);

      // オフスクリーンの内容をメインキャンバスに転送
      this.renderer.drawToMain();

      // 次のフレームをリクエスト
      this.rafId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  /**
   * プレビューのレンダリングループを停止
   */
  stopPreviewLoop(): void {
    this.isRendering = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 1フレームだけ描画（エンコード時などに使用）
   */
  renderFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, currentTime: number): void {
    this.updateAll(currentTime);
    this.renderAll(ctx);
  }

  /**
   * 新規エフェクト用のzIndex値を計算
   * 常に最前面（最大のzIndex + step）の値を返す
   */
  private calculateNewZIndex(): number {
    if (this.effects.length === 0) {
      return EffectManager.BASE_Z_INDEX;
    }
    
    // 現在の最大zIndexを取得
    const maxZIndex = Math.max(
      ...this.effects.map(effect => effect.getConfig().zIndex ?? 0)
    );
    
    // 最大値を超えないように制限
    return Math.min(
      maxZIndex + EffectManager.Z_INDEX_STEP,
      EffectManager.MAX_Z_INDEX
    );
  }

  /**
   * エフェクトの追加
   * @param effect 追加するエフェクト
   * @param zIndex 明示的に指定するzIndex（省略時は自動計算）
   */
  addEffect(effect: EffectBase<EffectConfig>, zIndex?: number): void {
    if (this.effects.some(e => e.getId() === effect.getId())) {
      throw new AppError(
        ErrorType.EffectAlreadyExists,
        `Effect with id ${effect.getId()} already exists`
      );
    }

    // zIndexを設定
    const newZIndex = zIndex ?? this.calculateNewZIndex();
    effect.updateConfig({ zIndex: newZIndex });

    // 重複するエフェクトをチェック
    const overlapping = this.findOverlappingEffects(effect);
    if (overlapping.length > 0) {
      console.warn(
        `Warning: Added effect overlaps with ${overlapping.length} existing effects`,
        { 
          newEffect: effect.getConfig(),
          overlapping: overlapping.map(e => e.getConfig())
        }
      );
    }

    this.effects.push(effect);
    this.needsSort = true;

    // zIndexの正規化が必要か確認
    if (this.effects.length > 1) {
      const zIndices = this.effects.map(e => e.getConfig().zIndex ?? 0);
      const isDisordered = zIndices.some((z, i) => 
        i > 0 && (z - zIndices[i - 1]) <= 0
      );
      if (isDisordered) {
        this.normalizeZIndices();
      }
    }
  }

  /**
   * エフェクトの削除
   */
  removeEffect(id: string): void {
    const index = this.effects.findIndex(e => e.getId() === id);
    if (index === -1) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect with id ${id} not found`
      );
    }
    this.effects.splice(index, 1);
  }

  /**
   * エフェクトの取得
   */
  getEffect(id: string): EffectBase<EffectConfig> | undefined {
    return this.effects.find(e => e.getId() === id);
  }

  /**
   * 全エフェクトの取得
   */
  getEffects(): EffectBase<EffectConfig>[] {
    return [...this.effects];
  }

  /**
   * エフェクトの設定更新
   */
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void {
    const effect = this.getEffect(id);
    if (!effect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect with id ${id} not found`
      );
    }
    effect.updateConfig(config);
    this.needsSort = true;
  }

  /**
   * キャンバスサイズ変更時の処理
   * - 全エフェクトの座標とサイズを更新
   */
  private handleCanvasResize(
    oldSize: { width: number; height: number },
    newSize: { width: number; height: number }
  ): void {
    try {
      console.log('EffectManager: エフェクトのリサイズ処理開始', { oldSize, newSize });
      
      for (const effect of this.effects) {
        const config = effect.getConfig();
        const { position, size } = updateRectForResize(
          config.position,
          config.size,
          config.coordinateSystem ?? 'absolute',
          oldSize,
          newSize
        );
        effect.updateConfig({ position, size });
      }
      
      console.log('EffectManager: エフェクトのリサイズ処理完了');
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to update effects on resize: ${details}`,
        error
      );
    }
  }

  /**
   * zIndexでエフェクトをソート
   */
  private sortEffectsByZIndex(): void {
    if (!this.needsSort) return;

    this.effects.sort((a, b) => {
      const aZIndex = a.getConfig().zIndex ?? 0;
      const bZIndex = b.getConfig().zIndex ?? 0;
      return bZIndex - aZIndex;
    });
    this.needsSort = false;
  }

  /**
   * エフェクトの時間範囲の重複をチェック
   * @param effect チェック対象のエフェクト
   * @returns 重複するエフェクトの配列
   */
  private findOverlappingEffects(effect: EffectBase<EffectConfig>): EffectBase<EffectConfig>[] {
    return this.effects.filter(e => {
      if (e.getId() === effect.getId()) return false;
      
      const eConfig = e.getConfig();
      const targetConfig = effect.getConfig();
      
      // 時間範囲が重複しているかチェック
      const isOverlapping = (
        (eConfig.startTime ?? 0) < (targetConfig.endTime ?? Infinity) &&
        (eConfig.endTime ?? Infinity) > (targetConfig.startTime ?? 0)
      );
      
      // 同じタイプのエフェクトのみを対象とする（オプション）
      const isSameType = eConfig.type === targetConfig.type;
      
      return isOverlapping && isSameType;
    });
  }

  /**
   * エフェクトの可視性を更新
   * @param currentTime 現在の再生時間
   */
  private updateEffectVisibility(currentTime: number): void {
    // アクティブなエフェクトを取得
    const activeEffects = this.effects.filter(effect => {
      const config = effect.getConfig();
      return currentTime >= (config.startTime ?? 0) && 
             (config.endTime === undefined || currentTime <= config.endTime);
    });

    // タイプごとにグループ化
    const effectsByType = activeEffects.reduce((acc, effect) => {
      const type = effect.getConfig().type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(effect);
      return acc;
    }, {} as Record<string, EffectBase<EffectConfig>[]>);

    // タイプごとに可視性を制御
    for (const [type, effects] of Object.entries(effectsByType)) {
      // zIndexで降順ソート
      effects.sort((a, b) => 
        (b.getConfig().zIndex ?? 0) - (a.getConfig().zIndex ?? 0)
      );

      // 各エフェクトの可視性を設定
      effects.forEach((effect, index) => {
        const config = effect.getConfig();
        const isTopmost = index === 0;
        const wasVisible = config.visible !== false;
        
        // 可視性の更新が必要か判定
        if (isTopmost !== wasVisible) {
          effect.updateConfig({ visible: isTopmost });
        }
      });
    }
  }

  /**
   * 全エフェクトの更新
   */
  updateAll(currentTime: number): void {
    try {
      // 可視性の更新
      this.updateEffectVisibility(currentTime);
      
      // アクティブなエフェクトのみをフィルタリング
      const activeEffects = this.effects.filter(effect => effect.isActive(currentTime));
      
      // アクティブなエフェクトのみ更新
      for (const effect of activeEffects) {
        effect.update(currentTime);
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to update effects: ${details}`,
        error
      );
    }
  }

  /**
   * 全エフェクトの描画
   */
  renderAll(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    try {
      // zIndexでソート
      this.sortEffectsByZIndex();

      // アクティブで可視のエフェクトのみをフィルタリング
      const visibleEffects = this.effects.filter(effect => 
        effect.isActive(this.audioService?.getCurrentTime() ?? 0) && 
        effect.getConfig().visible !== false
      );

      // 描画が必要なエフェクトのみ描画
      for (const effect of visibleEffects) {
        ctx.save();
        effect.render(ctx);
        ctx.restore();
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to render effects: ${details}`,
        error
      );
    }
  }

  /**
   * 全エフェクトの破棄
   */
  dispose(): void {
    this.stopPreviewLoop();
    for (const effect of this.effects) {
      effect.dispose();
    }
    this.effects = [];
    this.audioService = null;
    this.renderer = null;
    this.lastCanvasSize = null;
  }

  /**
   * エクスポート用の一時キャンバスを作成
   */
  createExportCanvas({ width, height }: { width: number; height: number }): HTMLCanvasElement {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    } catch (e) {
      throw new AppError(
        ErrorType.EXPORT_RENDER_FAILED,
        ErrorMessages[ErrorType.EXPORT_RENDER_FAILED],
        e
      );
    }
  }

  /**
   * エクスポート用のフレームをレンダリング
   */
  renderExportFrame(canvas: HTMLCanvasElement, time: number): void {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new AppError(
          ErrorType.EXPORT_RENDER_FAILED,
          ErrorMessages[ErrorType.EXPORT_RENDER_FAILED]
        );
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const activeEffects = this.effects.filter(effect => {
        const config = effect.getConfig();
        return time >= (config.startTime ?? 0) && time < (config.endTime ?? Infinity);
      });

      activeEffects.sort((a, b) => (a.getConfig().zIndex ?? 0) - (b.getConfig().zIndex ?? 0));
      activeEffects.forEach(effect => {
        effect.update(time);
        effect.render(ctx);
      });
    } catch (e) {
      throw new AppError(
        ErrorType.EXPORT_RENDER_FAILED,
        ErrorMessages[ErrorType.EXPORT_RENDER_FAILED],
        e
      );
    }
  }

  /**
   * プレビューキャンバスをクリア
   */
  clearPreviewCanvas(): void {
    console.log('EffectManager: プレビューキャンバスのクリア');
    if (this.previewCanvas) {
      const ctx = this.previewCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      }
    }
    this.previewCanvas = null;
    this.stopPreviewLoop();
  }

  /**
   * エフェクトの順序を変更
   * @param sourceId 移動元のエフェクトID
   * @param targetId 移動先のエフェクトID
   */
  moveEffect(sourceId: string, targetId: string): void {
    const sourceEffect = this.getEffect(sourceId);
    const targetEffect = this.getEffect(targetId);
    
    if (!sourceEffect || !targetEffect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect not found: source=${sourceId}, target=${targetId}`
      );
    }

    // 現在のzIndex値を取得
    const sourceZIndex = sourceEffect.getConfig().zIndex ?? 0;
    const targetZIndex = targetEffect.getConfig().zIndex ?? 0;

    // 移動先のzIndexを計算
    let newZIndex: number;
    if (sourceZIndex < targetZIndex) {
      // 上に移動する場合
      newZIndex = Math.min(
        targetZIndex + EffectManager.Z_INDEX_STEP,
        EffectManager.MAX_Z_INDEX
      );
    } else {
      // 下に移動する場合
      newZIndex = Math.max(
        targetZIndex - EffectManager.Z_INDEX_STEP,
        EffectManager.MIN_Z_INDEX
      );
    }

    // zIndexを更新
    sourceEffect.updateConfig({ zIndex: newZIndex });
    this.needsSort = true;

    // zIndexの値が極端に偏った場合は正規化
    const zIndices = this.effects.map(e => e.getConfig().zIndex ?? 0);
    const maxGap = Math.max(...zIndices) - Math.min(...zIndices);
    if (maxGap > EffectManager.Z_INDEX_STEP * this.effects.length * 2) {
      this.normalizeZIndices();
    }
  }

  /**
   * エフェクトのzIndexを最適化
   * zIndexの間隔を均等にする
   */
  normalizeZIndices(): void {
    this.sortEffectsByZIndex();
    
    this.effects.forEach((effect, index) => {
      const newZIndex = EffectManager.BASE_Z_INDEX + 
        (this.effects.length - index - 1) * EffectManager.Z_INDEX_STEP;
      effect.updateConfig({ 
        zIndex: Math.max(
          Math.min(newZIndex, EffectManager.MAX_Z_INDEX),
          EffectManager.MIN_Z_INDEX
        ) 
      });
    });
    
    this.needsSort = true;
  }

  /**
   * 動画をエクスポート
   * @param audioSource エクスポートに使用するオーディオソース
   */
  async exportVideo(audioSource: AudioSource): Promise<void> {
    if (!this.originalSize) {
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        'Original size is not set'
      );
    }

    // エンコードサービス初期化
    const encoder = new VideoEncoderService({
      width: this.originalSize.width,
      height: this.originalSize.height,
      frameRate: 60, // TODO: 設定から取得
      videoBitrate: 5000000, // TODO: 設定から取得
      audioBitrate: 128000, // TODO: 設定から取得
      sampleRate: audioSource.sampleRate,
      channels: audioSource.numberOfChannels
    });

    // エクスポート用のキャンバスを作成
    const canvas = this.createExportCanvas({ width: this.originalSize.width, height: this.originalSize.height });

    try {
      await encoder.initialize();

      // 音声の総フレーム数を計算
      const totalFrames = Math.ceil(audioSource.duration * 60); // TODO: FPSを設定から取得

      // フレームごとに描画＋エンコード
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // 現在時刻を計算
        const currentTime = frameIndex / 60; // TODO: FPSを設定から取得

        // フレームをレンダリング
        this.renderExportFrame(canvas, currentTime);

        // 1フレーム分の映像エンコード
        await encoder.encodeVideoFrame(canvas, frameIndex);

        // 1フレーム分の音声エンコード
        if (audioSource.buffer) {
          await encoder.encodeAudioBuffer(audioSource.buffer, frameIndex);
        }
      }

      // エンコード完了処理
      const result = await encoder.finalize();
      
      // ダウンロード処理
      const blob = new Blob([result], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      throw new AppError(
        ErrorType.ExportFailed,
        'Failed to export video',
        error
      );
    } finally {
      // クリーンアップ
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      encoder.dispose();
    }
  }
}