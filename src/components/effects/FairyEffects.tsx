import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FairyEngine } from './fairyEngine';

/*
 * Each route renders its own <AppLayout>, so this component can remount on
 * navigation. The engine is shared and torn down only after a short grace
 * period, so fairies keep flying across page changes.
 */
let engine: FairyEngine | null = null;
let engineReduced = false;
let users = 0;
let teardownTimer: number | undefined;

function acquire(reduced: boolean): FairyEngine {
  window.clearTimeout(teardownTimer);
  if (engine && engineReduced !== reduced) {
    engine.destroy();
    engine = null;
  }
  if (!engine) {
    engine = new FairyEngine(reduced);
    engineReduced = reduced;
  }
  users++;
  return engine;
}

function release() {
  users = Math.max(0, users - 1);
  if (users > 0) return;
  window.clearTimeout(teardownTimer);
  teardownTimer = window.setTimeout(() => {
    if (users === 0 && engine) {
      engine.destroy();
      engine = null;
    }
  }, 300);
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Ambient fairies, sparkle trails, petals (day) and fireflies/stars (night).
 * Renders nothing into the React tree; the engine owns a fixed, click-through
 * layer on <body>. Turned off by Account > Giao diện (sparkle_enabled).
 */
export const FairyEffects: React.FC = () => {
  const { theme, effectsEnabled } = useTheme();
  const reduced = usePrefersReducedMotion();
  const [instance, setInstance] = useState<FairyEngine | null>(null);

  useEffect(() => {
    if (!effectsEnabled) return;
    const e = acquire(reduced);
    setInstance(e);
    return () => {
      setInstance(null);
      release();
    };
  }, [effectsEnabled, reduced]);

  useEffect(() => {
    instance?.setTheme();
  }, [theme, instance]);

  return null;
};
