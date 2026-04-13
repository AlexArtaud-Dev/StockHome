import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface Pos {
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [pos, setPos] = useState<Pos | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  function show() {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    const GAP = 8;

    let x = 0;
    let y = 0;
    let actualPlacement = placement;

    // Auto-flip if not enough space
    if (placement === 'top' && r.top < 40) actualPlacement = 'bottom';
    if (placement === 'bottom' && r.bottom > window.innerHeight - 40) actualPlacement = 'top';
    if (placement === 'left' && r.left < 100) actualPlacement = 'right';
    if (placement === 'right' && r.right > window.innerWidth - 100) actualPlacement = 'left';

    switch (actualPlacement) {
      case 'top':
        x = r.left + r.width / 2;
        y = r.top - GAP;
        break;
      case 'bottom':
        x = r.left + r.width / 2;
        y = r.bottom + GAP;
        break;
      case 'left':
        x = r.left - GAP;
        y = r.top + r.height / 2;
        break;
      case 'right':
        x = r.right + GAP;
        y = r.top + r.height / 2;
        break;
    }

    setPos({ x, y, placement: actualPlacement });
  }

  function hide() {
    setPos(null);
  }

  // Close on scroll so tooltip doesn't float
  useEffect(() => {
    if (!pos) return;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', hide, { capture: true });
  }, [pos]);

  return (
    <>
      <span
        ref={wrapperRef}
        className={styles.wrapper}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>

      {pos && ReactDOM.createPortal(
        <div
          className={`${styles.tooltip} ${styles[pos.placement]}`}
          style={{ left: pos.x, top: pos.y }}
          role="tooltip"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
