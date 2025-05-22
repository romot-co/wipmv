import React, { useEffect, useRef, memo, useMemo, useCallback, useState } from 'react';
import debug from 'debug';
import { EffectManager, EffectBase, EffectConfig } from '../core/types/core';
import { AppError, ErrorType } from '../core/types/error';
import { withAppError } from '../core/types/app';
import { Renderer } from '../core/Renderer';
import { useApp } from '../contexts/AppContext';
import { TextEffectConfig } from '../core/types/effect';
import { Position } from '../core/types/base';

// ドラッグ状態を定義（元々 '../core/types/ui' から import していたもの）
interface DragState {
  effectId: string;
  startPosition: Position;
  currentPosition: Position;
  initialEffectPosition: Position;
}

// デバッグインスタンスの作成
const log = debug('app:PreviewCanvas');

// プレビュー用の最大解像度を定義
const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_MAX_HEIGHT = 720;

// デバッグログの有効化フラグ（必要な時だけtrueに）
const DEBUG_ENABLED = false;

// ログレベルを定義
const LOG_LEVEL = {
  NONE: 0,   // ログ出力なし
  ERROR: 1,  // エラーのみ
  WARN: 2,   // 警告以上
  INFO: 3,   // 情報以上
  DEBUG: 4,  // デバッグ以上
  VERBOSE: 5 // 詳細なログ
};

// 現在のログレベル（プロダクション環境では低く、開発環境では高く設定可能）
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVEL.ERROR  // 本番環境ではエラーのみ
  : LOG_LEVEL.INFO;  // 開発環境では情報レベル以上

// ログのタイムスタンプを記録するオブジェクト（頻度制限用）
const lastLogTimes = {
  debug: 0,
  info: 0,
  warn: 0,
  error: 0,
  verbose: 0
};

// ログ出力のユーティリティオブジェクト
const logger = {
  error: (message: string, data?: unknown) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) {
      console.error(`[PreviewCanvas:ERROR] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: unknown) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) {
      console.warn(`[PreviewCanvas:WARN] ${message}`, data);
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) {
      console.info(`[PreviewCanvas:INFO] ${message}`, data);
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG && DEBUG_ENABLED) {
      const now = Date.now();
      // 500ms以内に同じカテゴリのログは出力しない（頻発するログの間引き）
      if (now - lastLogTimes.debug > 500) {
        lastLogTimes.debug = now;
        console.debug(`[PreviewCanvas:DEBUG] ${message}`, data);
      }
    }
  },
  
  verbose: (message: string, data?: unknown, throttleInterval = 500) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.VERBOSE && DEBUG_ENABLED) {
      const now = Date.now();
      // throttleIntervalミリ秒以内に同じカテゴリのログは出力しない
      if (now - lastLogTimes.verbose > throttleInterval) {
        lastLogTimes.verbose = now;
        console.debug(`[PreviewCanvas:VERBOSE] ${message}`, data);
      }
    }
  }
};

// 従来のdebugLog関数（後方互換性用）
function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG_ENABLED) {
    logger.debug(message, args);
  }
}

/**
 * プレビューキャンバスのプロパティ
 */
interface PreviewCanvasProps {
  width: number;
  height: number;
  currentTime: number;
}

// テキストエフェクト型ガード
function isTextEffect(config: EffectConfig): config is TextEffectConfig {
  return config && config.type === 'text';
}

// マウス位置を取得するユーティリティ関数（useCanvasHelpersの代わり）
function getMousePosition(canvas: HTMLCanvasElement, event: React.MouseEvent): Position {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

// テキスト編集用のシンプルな実装
interface InlineTextEditProps {
  initialText: string;
  position: Position;
  onComplete: (text: string) => void;
  onCancel: () => void;
}

// シンプルなインラインテキスト編集コンポーネント
const InlineTextEdit: React.FC<InlineTextEditProps> = ({
  initialText,
  position,
  onComplete,
  onCancel
}) => {
  const [text, setText] = useState(initialText);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onComplete(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };
  
  return (
    <div 
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onComplete(text)}
        style={{
          minWidth: '200px',
          minHeight: '100px'
        }}
      />
    </div>
  );
};

/**
 * プレビューキャンバス
 * - Canvas要素のレンダリングとDOMイベント処理を担当
 * - EffectManager や Renderer とは直接やり取りしない (AppContext経由)
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = memo(({
  width,
  height,
  currentTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const didDragRef = useRef<boolean>(false);
  const { 
    managerInstance: currentManager,
    drawingManager,
    selectEffect, 
    deselectEffect, 
    openSettingsPanel, 
    closeSettingsPanel, 
    updateEffect,
    effectState: { effects },
    ui: { selectedEffectId },
    saveProject,
    audioState: { isPlaying }
  } = useApp();

  // --- ドラッグ操作用の状態 ---
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingEffectId, setDraggingEffectId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  // カーソルスタイル用の state を追加
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  
  // --- インラインテキスト編集用の状態 ---
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingPosition, setEditingPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // ドラッグ状態の管理
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // インラインテキスト編集状態の管理
  const [inlineTextEdit, setInlineTextEdit] = useState<{
    effectId: string;
    config: TextEffectConfig;
    position: Position;
  } | null>(null);
  
  // プレビュー用の解像度を計算
  const { previewWidth, previewHeight } = useMemo(() => {
    const aspectRatio = width / height;
    let previewWidth = width;
    let previewHeight = height;

    if (previewWidth > PREVIEW_MAX_WIDTH) {
      previewWidth = PREVIEW_MAX_WIDTH;
      previewHeight = Math.round(PREVIEW_MAX_WIDTH / aspectRatio);
    }

    if (previewHeight > PREVIEW_MAX_HEIGHT) {
      previewHeight = PREVIEW_MAX_HEIGHT;
      previewWidth = Math.round(PREVIEW_MAX_HEIGHT * aspectRatio);
    }

    // devicePixelRatioを考慮した高解像度対応
    const pixelRatio = window.devicePixelRatio || 1;
    
    debugLog('プレビュー解像度を計算:', {
      originalWidth: width,
      originalHeight: height,
      previewWidth,
      previewHeight,
      pixelRatio
    });

    return { 
      previewWidth: Math.floor(previewWidth * pixelRatio), 
      previewHeight: Math.floor(previewHeight * pixelRatio) 
    };
  }, [width, height]);

  // キャンバスとレンダラーの初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスの描画サイズを設定 (内部解像度)
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // devicePixelRatioを考慮したCSS表示サイズ
    const pixelRatio = window.devicePixelRatio || 1;
    const displayWidth = previewWidth / pixelRatio;
    const displayHeight = previewHeight / pixelRatio;

    // CSSで表示サイズを調整
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.imageRendering = 'auto'; // 高解像度対応のため補間を有効に

    // レンダラーを初期化
    try {
      const renderer = new Renderer(canvas, true);
      rendererRef.current = renderer;
      drawingManager.setRenderer(renderer);
      debugLog('Renderer initialized');
    } catch (error) {
      logger.error('Failed to initialize renderer:', error);
    }

    return () => {
      // クリーンアップ
      if (rendererRef.current) {
        drawingManager.setRenderer(null);
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [previewWidth, previewHeight, drawingManager]);

  // アニメーションフレームの更新
  useEffect(() => {
    // アニメーションループは App.tsx で一元管理されるため削除
    // PreviewCanvasはキャンバス要素の提供とDOMイベント処理に専念
    
    return () => {
      // クリーンアップ
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // エフェクトのヒットテスト（マウス位置とエフェクトの衝突判定）
  const hitTestEffects = useCallback((position: Position, effectsList: EffectBase<EffectConfig>[]): EffectBase<EffectConfig> | null => {
    // 後ろから前の順に検査（表示順の逆順）
    for (let i = effectsList.length - 1; i >= 0; i--) {
      const effect = effectsList[i];
      if (effect.isVisible() && effect.hitTest && effect.hitTest(position)) {
        return effect;
      }
    }
    return null;
  }, []);

  // マウスクリックイベントハンドラ
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mousePosition = getMousePosition(canvas, e);
    logger.debug('Canvas clicked', { mousePosition });
    
    // getActiveEffectsの代わりにエフェクトをフィルタリング
    const activeEffects = effects.filter(effect => effect.isActive(currentTime)) || [];
    const hitEffect = hitTestEffects(mousePosition, activeEffects);
    
    if (hitEffect) {
      logger.debug('Selected effect', { effectId: hitEffect.getId() });
      selectEffect(hitEffect.getId());
      openSettingsPanel();
    } else {
      deselectEffect();
      closeSettingsPanel();
    }
  }, [currentTime, hitTestEffects, selectEffect, deselectEffect, openSettingsPanel, closeSettingsPanel, effects]);

  // ダブルクリックハンドラ（テキストエフェクトの編集用）
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mousePosition = getMousePosition(canvas, e);
    // getActiveEffectsの代わりにエフェクトをフィルタリング
    const activeEffects = effects.filter(effect => effect.isActive(currentTime)) || [];
    const hitEffect = hitTestEffects(mousePosition, activeEffects);
    
    if (hitEffect && hitEffect.getConfig().type === 'text') {
      logger.info('Text effect double-clicked for inline editing', { 
        effectId: hitEffect.getId(), 
        config: hitEffect.getConfig() 
      });
      
      // インラインテキスト編集状態を設定
      setInlineTextEdit({
        effectId: hitEffect.getId(),
        config: hitEffect.getConfig() as TextEffectConfig,
        position: {
          x: mousePosition.x,
          y: mousePosition.y
        }
      });
    }
  }, [currentTime, hitTestEffects, effects]);

  // マウスダウンイベントハンドラ（ドラッグ開始）
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (inlineTextEdit) return; // テキスト編集中はドラッグを無効化
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mousePosition = getMousePosition(canvas, e);
    // getActiveEffectsの代わりにエフェクトをフィルタリング
    const activeEffects = effects.filter(effect => effect.isActive(currentTime)) || [];
    const hitEffect = hitTestEffects(mousePosition, activeEffects);
    
    if (hitEffect) {
      logger.debug('Mouse down on effect', { effectId: hitEffect.getId() });
      selectEffect(hitEffect.getId());
      
      // ドラッグ状態を設定
      setDragState({
        effectId: hitEffect.getId(),
        startPosition: mousePosition,
        currentPosition: mousePosition,
        initialEffectPosition: { ...hitEffect.getConfig().position }
      });
    }
  }, [currentTime, hitTestEffects, selectEffect, effects, inlineTextEdit]);

  // マウス移動イベントハンドラ（ドラッグ中）
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState || inlineTextEdit) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mousePosition = getMousePosition(canvas, e);
    
    // ドラッグ状態を更新
    setDragState(prevState => {
      if (!prevState) return null;
      
      return {
        ...prevState,
        currentPosition: mousePosition
      };
    });
    
    // エフェクト位置の更新
    const effect = effects.find(e => e.getId() === dragState.effectId);
    if (effect) {
      const canvasSize = { width: canvas.width, height: canvas.height };
      
      // 移動量を計算（相対値）
      const deltaX = mousePosition.x - dragState.startPosition.x;
      const deltaY = mousePosition.y - dragState.startPosition.y;
      
      // 新しい位置を相対座標で計算
      const newPosition = {
        x: dragState.initialEffectPosition.x + deltaX / canvasSize.width,
        y: dragState.initialEffectPosition.y + deltaY / canvasSize.height
      };
      
      // エフェクト設定を更新（頻度を抑えるためにthrottleを考慮）
      const config = effect.getConfig();
      if (JSON.stringify(config.position) !== JSON.stringify(newPosition)) {
        // デバッグログは低頻度で出力（頻繁なログ出力を避ける）
        logger.verbose('Updating effect position', { 
          effectId: effect.getId(), 
          newPosition 
        }, 500); // 500ms間隔でログ出力を間引く
        
        updateEffect(dragState.effectId, { position: newPosition });
      }
    }
  }, [dragState, effects, updateEffect, getMousePosition, inlineTextEdit]);

  // マウスアップイベントハンドラ（ドラッグ終了）
  const handleMouseUp = useCallback(() => {
    if (dragState) {
      logger.debug('Mouse up, drag ended', { effectId: dragState.effectId });
      setDragState(null);
      
      // 変更を保存
      saveProject().catch(err => logger.error('Error saving project after drag:', err));
    }
  }, [dragState, saveProject]);

  // マウスリーブイベントハンドラ
  const handleMouseLeave = useCallback(() => {
    if (dragState) {
      logger.debug('Mouse left canvas, drag canceled', { effectId: dragState.effectId });
      setDragState(null);
    }
  }, [dragState]);

  // テキスト編集完了時のハンドラ
  const handleTextEditComplete = useCallback((newText: string) => {
    if (!inlineTextEdit) return;
    
    logger.info('Inline text edit completed', { effectId: inlineTextEdit.effectId, newText });
    
    // エフェクト設定を更新
    updateEffect(inlineTextEdit.effectId, {
      ...inlineTextEdit.config,
      text: newText
    });
    
    // 編集状態をクリア
    setInlineTextEdit(null);
    
    // 変更を保存
    saveProject().catch(err => logger.error('Error saving project after text edit:', err));
  }, [inlineTextEdit, updateEffect, saveProject]);

  // テキスト編集キャンセル時のハンドラ
  const handleTextEditCancel = useCallback(() => {
    logger.info('Inline text edit canceled');
    setInlineTextEdit(null);
  }, []);

  return (
    <div className="preview-canvas-container">
      <canvas 
        ref={canvasRef} 
        style={{ 
          cursor: dragState ? 'grabbing' : (inlineTextEdit ? 'text' : 'default'),
          imageRendering: 'auto' // 高品質表示モードを指定
        }} 
        onClick={handleClick} 
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* インラインテキスト編集用のテキストエリア */}
      {inlineTextEdit && (
        <InlineTextEdit
          initialText={inlineTextEdit.config.text}
          position={inlineTextEdit.position}
          onComplete={handleTextEditComplete}
          onCancel={handleTextEditCancel}
        />
      )}
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';
