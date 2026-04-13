import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Props {
  anchor: HTMLElement;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerPortal({ anchor, onSelect, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useEffect(() => {
    const rect = anchor.getBoundingClientRect();
    const pickerW = 352;
    const pickerH = 440;
    const gap = 8;

    let top = rect.bottom + gap;
    let left = rect.left;

    // Flip horizontally if overflows right edge
    if (left + pickerW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - pickerW - 8);
    }

    // Flip vertically if overflows bottom
    if (top + pickerH > window.innerHeight - 8) {
      top = Math.max(8, rect.top - pickerH - gap);
    }

    setStyle({ position: 'fixed', top, left, zIndex: 10000, visibility: 'visible' });
  }, [anchor]);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !anchor.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [anchor, onClose]);

  return ReactDOM.createPortal(
    <div ref={containerRef} style={style}>
      <Picker
        data={data}
        onEmojiSelect={(e: { native: string }) => { onSelect(e.native); onClose(); }}
        theme="auto"
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>,
    document.body,
  );
}
