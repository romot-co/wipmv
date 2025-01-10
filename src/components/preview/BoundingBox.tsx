import React, { useCallback, useEffect, useRef, useState } from 'react';
import './BoundingBox.css';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface BoundingBoxProps {
  initialPosition: Position;
  initialSize: Size;
  onPositionChange: (position: Position) => void;
  onSizeChange: (size: Size) => void;
  onSelect: () => void;
  isSelected: boolean;
  lockHorizontal?: boolean;
}

export const BoundingBox: React.FC<BoundingBoxProps> = ({
  initialPosition,
  initialSize,
  onPositionChange,
  onSizeChange,
  onSelect,
  isSelected,
  lockHorizontal = false
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // ドラッグ開始時の位置
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  // リサイズ開始時のサイズと位置
  const resizeStartRef = useRef<{ position: Position; size: Size }>({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 }
  });

  // ドラッグ処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 左クリックのみ
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    onSelect();
  }, [position, onSelect]);

  // リサイズハンドルのドラッグ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setIsResizing(true);
    setResizeHandle(handle);
    resizeStartRef.current = {
      position: { ...position },
      size: { ...size }
    };
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  }, [position, size]);

  // マウス移動処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: lockHorizontal ? position.x : e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        };
        setPosition(newPosition);
        onPositionChange(newPosition);
      } else if (isResizing && resizeHandle) {
        const dx = lockHorizontal ? 0 : e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newSize = { ...resizeStartRef.current.size };
        const newPosition = { ...resizeStartRef.current.position };

        switch (resizeHandle) {
          case 'nw':
            if (!lockHorizontal) {
              newSize.width = resizeStartRef.current.size.width - dx;
              newPosition.x = resizeStartRef.current.position.x + dx;
            }
            newSize.height = resizeStartRef.current.size.height - dy;
            newPosition.y = resizeStartRef.current.position.y + dy;
            break;
          case 'ne':
            if (!lockHorizontal) {
              newSize.width = resizeStartRef.current.size.width + dx;
            }
            newSize.height = resizeStartRef.current.size.height - dy;
            newPosition.y = resizeStartRef.current.position.y + dy;
            break;
          case 'se':
            if (!lockHorizontal) {
              newSize.width = resizeStartRef.current.size.width + dx;
            }
            newSize.height = resizeStartRef.current.size.height + dy;
            break;
          case 'sw':
            if (!lockHorizontal) {
              newSize.width = resizeStartRef.current.size.width - dx;
              newPosition.x = resizeStartRef.current.position.x + dx;
            }
            newSize.height = resizeStartRef.current.size.height + dy;
            break;
        }

        // 最小サイズの制限
        newSize.width = Math.max(50, newSize.width);
        newSize.height = Math.max(50, newSize.height);

        setSize(newSize);
        setPosition(newPosition);
        onSizeChange(newSize);
        onPositionChange(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, onPositionChange, onSizeChange, position.x, lockHorizontal]);

  return (
    <div
      ref={boxRef}
      className={`bounding-box ${isSelected ? 'selected' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: lockHorizontal ? 'ns-resize' : 'move'
      }}
      onMouseDown={handleMouseDown}
    >
      {isSelected && (
        <>
          {!lockHorizontal && (
            <>
              <div
                className="resize-handle nw"
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />
              <div
                className="resize-handle ne"
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div
                className="resize-handle sw"
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
            </>
          )}
          <div
            className="resize-handle se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}
    </div>
  );
}; 