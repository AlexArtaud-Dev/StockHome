import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
} from '@floating-ui/react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const arrowRef = React.useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 6 }),
      arrow({ element: arrowRef }),
    ],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <span ref={refs.setReference} className={styles.wrapper} {...getReferenceProps()}>
        {children}
      </span>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className={styles.tooltip}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {content}
            <FloatingArrow
              ref={arrowRef}
              context={context}
              className={styles.arrow}
              tipRadius={2}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
