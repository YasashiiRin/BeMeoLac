import { useCallback, useEffect, useState } from 'react';
import { usePageVisible, usePrefersReducedMotion } from './ornaments/useMotionPrefs';

const INTRO_KEY = 'tutruyen-login-intro';
const INTRO_MS = 1600;
const DENIED_MS = 1000;

function introSeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === 'seen';
  } catch {
    return false;
  }
}

/**
 * State classes for the night-sky login stage:
 * - is-intro: first visit in this browser session (~1.5 s, click to skip)
 * - is-denied: wrong credentials (bump `deniedKey` to replay)
 * - is-paused: tab hidden
 */
export function useLoginStage(deniedKey: number) {
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();
  const [intro, setIntro] = useState(() => !reduced && !introSeen());
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!intro) return;
    try {
      sessionStorage.setItem(INTRO_KEY, 'seen');
    } catch {
      // storage blocked: the intro may replay next visit, that's fine
    }
    const t = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(t);
  }, [intro]);

  useEffect(() => {
    if (!deniedKey) return;
    setDenied(false);
    // restart the animation even if it is still running
    const raf = requestAnimationFrame(() => setDenied(true));
    const t = window.setTimeout(() => setDenied(false), DENIED_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [deniedKey]);

  const skipIntro = useCallback(() => setIntro(false), []);

  const stageClassName = ['login-stage', intro && 'is-intro', denied && 'is-denied', !visible && 'is-paused']
    .filter(Boolean)
    .join(' ');

  return { stageClassName, onStagePointerDown: intro ? skipIntro : undefined };
}
