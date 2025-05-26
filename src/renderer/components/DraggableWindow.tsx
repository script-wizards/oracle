import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DraggableWindowProps {
  children: ReactNode;
  title: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  onClose?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onBringToFront?: () => void;
  className?: string;
  zIndex?: number;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  children,
  title,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  minWidth = 250,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 600,
  resizable = true,
  onClose,
  onPositionChange,
  onSizeChange,
  onBringToFront,
  className = '',
  zIndex = 1
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);

  // Handle window dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-resize-handle')) return;
    
    // Bring window to front when starting to drag
    if (onBringToFront) {
      onBringToFront();
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  // Handle window resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    e.preventDefault();
    e.stopPropagation();
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (isDragging && onPositionChange) {
        onPositionChange(position);
      }
      if (isResizing && onSizeChange) {
        onSizeChange(size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, size, position, minWidth, minHeight, maxWidth, maxHeight, onPositionChange, onSizeChange]);

  return (
    <div
      ref={windowRef}
      className={`draggable-window ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: zIndex,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="window-header draggable-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="window-title">{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="window-close-button"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div className="window-content" style={{ height: 'calc(100% - 32px)', overflow: 'auto' }}>
        {children}
      </div>
      
      {resizable && (
        <div
          className="window-resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            cursor: 'se-resize',
            background: 'var(--border-primary)',
            borderRadius: '0 0 4px 0'
          }}
        />
      )}
    </div>
  );
}; 
