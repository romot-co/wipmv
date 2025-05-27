import React, { useRef, useState, useCallback, useEffect } from 'react';
import { EffectConfig } from '../core/types';
import './Timeline.css';

interface TimelineProps {
  duration: number;
  currentTime: number;
  effects: EffectConfig[];
  selectedEffectId: string | null;
  onSelectEffect: (id: string | null) => void;
  onSeek: (time: number) => void;
  onEffectTimeChange: (id: string, startTime: number, endTime: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  duration, 
  currentTime, 
  effects, 
  selectedEffectId,
  onSelectEffect,
  onSeek,
  onEffectTimeChange
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<{ effectId: string; type: 'start' | 'end'; startX: number; originalStart: number; originalEnd: number } | null>(null);

  if (duration <= 0) {
    return (
      <div className="timeline-placeholder">
        オーディオファイルを読み込むとタイムラインが表示されます
      </div>
    );
  }

  const handleEffectClick = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    onSelectEffect(id);
  };

  const handleTimelineInteraction = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContentRef.current) return;

    const rect = timelineContentRef.current.getBoundingClientRect();
    // 左端のラベル部分（60px）を考慮して計算
    const clickX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    
    // clickXが負の値や、timelineWidthを超える値にならないように制限
    const clampedClickX = Math.max(0, Math.min(clickX, timelineWidth));

    let seekRatio = clampedClickX / timelineWidth;
    seekRatio = Math.max(0, Math.min(1, seekRatio));

    const seekTime = seekRatio * duration;
    onSeek(seekTime);
  };

  const handleTimelineMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    handleTimelineInteraction(event);
  };

  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-effect-id]')) {
      return;
    }
    onSelectEffect(null);
    handleTimelineInteraction(event);
  };

  const handleDragStart = (
    event: React.MouseEvent<HTMLDivElement>,
    effectId: string,
    type: 'start' | 'end'
  ) => {
    event.stopPropagation();
    const effect = effects.find(e => e.id === effectId);
    if (!effect) return;

    setDraggingHandle({
      effectId,
      type,
      startX: event.clientX,
      originalStart: effect.startTime ?? 0,
      originalEnd: (effect.endTime === undefined || effect.endTime === 0 || effect.endTime > duration) ? duration : effect.endTime,
    });

    // ドラッグ中のカーソルスタイルを設定
    document.body.style.cursor = 'ew-resize';
    
    // テキスト選択を防止
    document.body.style.userSelect = 'none';
  };

  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingHandle || !timelineContentRef.current) return;

    const rect = timelineContentRef.current.getBoundingClientRect();
    const timelineWidth = rect.width;
    const pixelsPerSecond = timelineWidth / duration;

    // マウス位置がタイムラインの範囲内にあるかどうかに関わらず、deltaXを計算
    const deltaX = event.clientX - draggingHandle.startX;
    const deltaTime = deltaX / pixelsPerSecond;

    let newStart = draggingHandle.originalStart;
    let newEnd = draggingHandle.originalEnd;

    if (draggingHandle.type === 'start') {
      newStart = draggingHandle.originalStart + deltaTime;
      // 開始時間が0以上、終了時間より少し前までの範囲で制限
      newStart = Math.max(0, Math.min(newStart, newEnd - 0.05));
    } else {
      newEnd = draggingHandle.originalEnd + deltaTime;
      // 終了時間が開始時間より少し後、durationまでの範囲で制限
      newEnd = Math.min(duration, Math.max(newEnd, newStart + 0.05));
    }

    // エフェクトの時間を更新
    onEffectTimeChange(draggingHandle.effectId, newStart, newEnd);

  }, [draggingHandle, duration, onEffectTimeChange]);

  const handleGlobalMouseUp = useCallback(() => {
    if (draggingHandle) {
      setDraggingHandle(null);
      
      // カーソルと選択スタイルを元に戻す
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [draggingHandle]);

  useEffect(() => {
    if (draggingHandle) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingHandle, handleGlobalMouseMove, handleGlobalMouseUp]);

  const getEffectPosition = (type: string) => {
    switch (type) {
      case 'background': return '10px';
      case 'waveform': return '35px';
      case 'watermark': return '60px';
      case 'text': return '85px';
      default: return '10px';
    }
  };

  const getEffectLabel = (type: string) => {
    switch (type) {
      case 'background': return '背景';
      case 'waveform': return '波形';
      case 'watermark': return '透かし';
      case 'text': return 'テキスト';
      default: return type;
    }
  };

  return (
    <div 
      ref={timelineRef}
      className="timeline-container"
    >
      {/* トラックラベル部分 */}
      <div className="timeline-labels">
        <div className="timeline-labels-header">
          トラック
        </div>
        <div className="timeline-track-label background">背景</div>
        <div className="timeline-track-label waveform">波形</div>
        <div className="timeline-track-label watermark">透かし</div>
        <div className="timeline-track-label text">テキスト</div>
      </div>

      {/* タイムラインコンテンツエリア - 左側のラベルの分だけ右にオフセットする */}
      <div 
        ref={timelineContentRef}
        className="timeline-content"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100, 116, 139, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: `calc(100% / ${Math.min(Math.ceil(duration), 10)}) 25px`,
        }}
        onClick={handleBackgroundClick}
        onMouseDown={handleTimelineInteraction}
        onMouseMove={handleTimelineMouseMove}
      >
        {/* 時間目盛りヘッダー */}
        <div className="timeline-header">
          {/* 時間の目盛り */}
          {Array.from({ length: Math.min(Math.ceil(duration) + 1, 11) }).map((_, i) => {
            const percentage = (i / Math.min(Math.ceil(duration), 10)) * 100;
            return (
              <div 
                key={`timeline-mark-${i}`}
                className="timeline-mark"
                style={{ 
                  left: `${percentage}%`,
                  borderRight: i < Math.min(Math.ceil(duration), 10) ? '1px solid var(--border-color)' : 'none',
                }}
              >
                {i}s
              </div>
            );
          })}
        </div>

        {/* エフェクトバー */}
        {effects.map((effect, index) => {
          const start = effect.startTime ?? 0;
          const end = (effect.endTime === undefined || effect.endTime === 0 || effect.endTime > duration) ? duration : effect.endTime;
          const isSelected = effect.id === selectedEffectId;

          if (start >= end || start > duration || end < 0) {
            console.warn('Invalid time range for effect:', effect.id, start, end);
            return null;
          }

          const effectStyle = {
            left: `${(start / duration) * 100}%`,
            width: `${((end - start) / duration) * 100}%`,
            top: getEffectPosition(effect.type),
            backgroundColor: isSelected 
              ? `var(--color-${effect.type}-bg, var(--color-default-bg))` 
              : `var(--color-${effect.type}-bg, var(--color-default-bg))99`,
            borderColor: `var(--color-${effect.type}-border, var(--color-default-border))`,
          };

          return (
            <div 
              key={`${effect.id}-${index}`}
              data-effect-id={effect.id}
              className={`effect-bar ${effect.type} ${isSelected ? 'selected' : ''}`}
              style={effectStyle}
              onClick={(e) => handleEffectClick(e, effect.id)}
              title={`${effect.type} (${start.toFixed(1)}s - ${end.toFixed(1)}s)`}
            >
              {isSelected && (
                <div 
                  className="handle left"
                  onMouseDown={(e) => handleDragStart(e, effect.id, 'start')}
                />
              )}
              {getEffectLabel(effect.type)}
              {isSelected && (
                <div 
                  className="handle right"
                  onMouseDown={(e) => handleDragStart(e, effect.id, 'end')}
                />
              )}
            </div>
          );
        })}

        {/* 現在時間インジケーター */}
        <div 
          className="time-indicator"
          style={{
            left: `${(currentTime / duration) * 100}%`,
          }}
        />
        <div
          className="time-indicator-handle"
          style={{
            left: `calc(${(currentTime / duration) * 100}% - 10px)`,
          }}
        />
      </div>
    </div>
  );
};
