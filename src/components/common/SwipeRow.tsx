import React from 'react';

interface SwipeRowProps {
  children: React.ReactNode;
  /** Tailwind gap class between cards. */
  gap?: string;
  /** Extra classes — e.g. `md:grid md:grid-cols-4 md:overflow-visible` to fall back to a grid on desktop. */
  className?: string;
  /** Forwarded so a caller can track scroll position (dot indicators). */
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  scrollRef?: React.Ref<HTMLDivElement>;
}

/** Horizontal swipe row (Figma "↔ horizontal scroll"): 20px side gutters, cards
 * snap to the left edge and the next one peeks in. Give each child `shrink-0 snap-start`
 * and a fixed width. The negative margin lets it bleed to the screen edge inside a
 * padded (px-5) container. */
export const SwipeRow: React.FC<SwipeRowProps> = ({ children, gap = 'gap-3', className = '', onScroll, scrollRef }) => (
  <div
    ref={scrollRef}
    onScroll={onScroll}
    className={`-mx-5 flex snap-x snap-mandatory overflow-x-auto px-5 pb-1 scroll-px-5 no-scrollbar ${gap} ${className}`}
  >
    {children}
  </div>
);
