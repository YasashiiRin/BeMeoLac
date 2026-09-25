import React, { useEffect, useRef, useState } from 'react';
import { fourPointStar } from './FrameOrnaments';
import { usePrefersReducedMotion } from './useMotionPrefs';

/**
 * Typing in a login field: tiny gold sparkles rise from the field's gold line,
 * roughly where the caret is. Listens to input events on .celestial-input.
 */
export const TypingSparkles: React.FC = () => {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: number; s: number }[]>([]);
  const reduced = usePrefersReducedMotion();
  const nextId = useRef(0);
  const measureCtx = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (reduced) return;
    const onInput = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (!input.classList?.contains('celestial-input')) return;
      const line = input.closest('.celestial-field') ?? input;
      const lineRect = line.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();

      // estimate caret x from the rendered text width
      if (!measureCtx.current) measureCtx.current = document.createElement('canvas').getContext('2d');
      const ctx = measureCtx.current!;
      const cs = getComputedStyle(input);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const text = input.type === 'password' ? '•'.repeat(input.value.length) : input.value;
      const caretX = Math.min(inputRect.left + ctx.measureText(text).width - input.scrollLeft, inputRect.right - 4);

      const burst = Array.from({ length: 2 + Math.round(Math.random()) }, () => ({
        id: nextId.current++,
        x: caretX + (Math.random() - 0.5) * 10,
        y: lineRect.bottom,
        dx: (Math.random() - 0.5) * 18,
        s: 5 + Math.random() * 4,
      }));
      setSparks((all) => [...all.slice(-24), ...burst]);
    };
    document.addEventListener('input', onInput, true);
    return () => document.removeEventListener('input', onInput, true);
  }, [reduced]);

  return (
    <div className="orn-typing-layer" aria-hidden="true" data-part="typing-sparkles">
      {sparks.map((s) => (
        <svg
          key={s.id}
          className="orn-typing-spark"
          style={{ left: s.x, top: s.y, ['--dx' as string]: `${s.dx}px`, ['--s' as string]: `${s.s}px` }}
          viewBox="-10 -10 20 20"
          onAnimationEnd={() => setSparks((all) => all.filter((x) => x.id !== s.id))}
        >
          <path d={fourPointStar(0, 0, 10, 0.24)} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
};
