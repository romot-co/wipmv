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
  position: Position;
  size: Size;
  onPositionChange: (position: Position) => void;
  onSizeChange?: (size: Size) => void;
  children?: React.ReactNode;
}

export const BoundingBox: React.FC<BoundingBoxProps> = ({
  position: initialPosition,
  size: initialSize,
  onPositionChange,
  onSizeChange,
  children
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
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
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  // リサイズハンドルのドラッグ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: 'se' | 'sw' | 'ne' | 'nw') => {
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

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        };
        setPosition(newPosition);
        onPositionChange(newPosition);
      } else if (isResizing && resizeHandle && onSizeChange) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newSize = { ...resizeStartRef.current.size };
        const newPosition = { ...resizeStartRef.current.position };

        switch (resizeHandle) {
          case 'nw':
            newSize.width = Math.max(50, resizeStartRef.current.size.width - dx);
            newSize.height = Math.max(50, resizeStartRef.current.size.height - dy);
            newPosition.x = resizeStartRef.current.position.x + dx;
            newPosition.y = resizeStartRef.current.position.y + dy;
            break;
          case 'ne':
            newSize.width = Math.max(50, resizeStartRef.current.size.width + dx);
            newSize.height = Math.max(50, resizeStartRef.current.size.height - dy);
            newPosition.y = resizeStartRef.current.position.y + dy;
            break;
          case 'se':
            newSize.width = Math.max(50, resizeStartRef.current.size.width + dx);
            newSize.height = Math.max(50, resizeStartRef.current.size.height + dy);
            break;
          case 'sw':
            newSize.width = Math.max(50, resizeStartRef.current.size.width - dx);
            newSize.height = Math.max(50, resizeStartRef.current.size.height + dy);
            newPosition.x = resizeStartRef.current.position.x + dx;
            break;
        }

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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, onPositionChange, onSizeChange]);

  // 位置とサイズの更新
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  return (
    <div
      ref={boxRef}
      className={`bounding-box ${isResizing ? 'resizing' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      <div className="resize-handle nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
      <div className="resize-handle ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
      <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
      <div className="resize-handle sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
    </div>
  );
}; 