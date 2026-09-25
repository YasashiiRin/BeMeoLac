import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  ThemeDecorations,
  ThemeDefinition,
  ThemeId,
  getDecoration,
  normalizeTheme,
} from '../theme/themes';

interface ThemeContextType {
  theme: ThemeId;
  definition: ThemeDefinition;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
  decoration: (key: keyof ThemeDecorations) => string;
  /** Ambient fairy/sparkle effects (UserSettings.sparkle_enabled) */
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
  /** Reading text size in px (UserSettings.font_size), applied as --reading-font-size */
  fontSize: number;
  setFontSize: (px: number) => void;
}

export const FONT_SIZE_MIN = 13;
export const FONT_SIZE_MAX = 22;
const FONT_SIZE_DEFAULT = 16;
const FONT_STORAGE_KEY = 'tutruyen-font-size';
const clampFont = (n: number) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(n)));

const readLocalFont = (): number | null => {
  try {
    const v = Number(localStorage.getItem(FONT_STORAGE_KEY));
    return v ? clampFont(v) : null;
  } catch {
    return null;
  }
};

const saveLocalFont = (px: number) => {
  try {
    localStorage.setItem(FONT_STORAGE_KEY, String(px));
  } catch {
    // storage blocked — the in-memory value still applies
  }
};

const applyFont = (px: number) => {
  const root = document.documentElement.style;
  root.setProperty('--reading-font-size', `${px}px`);
  root.setProperty('--reading-scale', String(px / FONT_SIZE_DEFAULT));
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FADE_MS = 400;

// index.html sets data-theme before the first render; read it back here.
const readInitialTheme = (): ThemeId =>
  normalizeTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME;

const readLocal = (): ThemeId | null => {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
};

const EFFECTS_STORAGE_KEY = 'tutruyen-sparkle';

const readLocalEffects = (): boolean | null => {
  try {
    const v = localStorage.getItem(EFFECTS_STORAGE_KEY);
    return v === null ? null : v === 'on';
  } catch {
    return null;
  }
};

const saveLocalEffects = (enabled: boolean) => {
  try {
    localStorage.setItem(EFFECTS_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // storage blocked — the in-memory value still applies
  }
};

const saveLocal = (theme: ThemeId) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage blocked (private mode) — the in-memory theme still applies
  }
};

const syncThemeColorMeta = () => {
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-background').trim();
  if (meta && bg) meta.setAttribute('content', bg);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme);
  const [effectsEnabled, setEffectsState] = useState<boolean>(() => readLocalEffects() ?? true);
  const [fontSize, setFontState] = useState<number>(() => {
    const px = readLocalFont() ?? FONT_SIZE_DEFAULT;
    applyFont(px);
    return px;
  });
  const fadeTimer = useRef<number | undefined>(undefined);
  const fontTimer = useRef<number | undefined>(undefined);

  const applyTheme = useCallback((next: ThemeId) => {
    const root = document.documentElement;
    if (root.dataset.theme === next) {
      setThemeState(next);
      return;
    }

    const commit = () => {
      root.dataset.theme = next;
      flushSync(() => setThemeState(next));
      syncThemeColorMeta();
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      commit();
      return;
    }

    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(commit);
      return;
    }

    root.classList.add('theme-fading');
    commit();
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => root.classList.remove('theme-fading'), FADE_MS + 50);
  }, []);

  const setTheme = useCallback(
    (next: ThemeId) => {
      applyTheme(next);
      saveLocal(next);
      if (user) {
        userService.updateSettings({ theme: next }).catch((err) => {
          console.error('Failed to save theme', err);
        });
      }
    },
    [applyTheme, user]
  );

  const setEffectsEnabled = useCallback(
    (enabled: boolean) => {
      setEffectsState(enabled);
      saveLocalEffects(enabled);
      if (user) {
        userService.updateSettings({ sparkle_enabled: enabled }).catch((err) => {
          console.error('Failed to save sparkle setting', err);
        });
      }
    },
    [user]
  );

  // applies at once; the account save waits until the slider settles
  const setFontSize = useCallback(
    (px: number) => {
      const next = clampFont(px);
      setFontState(next);
      applyFont(next);
      saveLocalFont(next);
      window.clearTimeout(fontTimer.current);
      if (user) {
        fontTimer.current = window.setTimeout(() => {
          userService.updateSettings({ font_size: next }).catch((err) => {
            console.error('Failed to save font size', err);
          });
        }, 400);
      }
    },
    [user]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'day' ? 'night' : 'day');
  }, [theme, setTheme]);

  // Once the account loads: a device with no saved choice adopts the account's
  // theme; otherwise the device choice (already painted) wins and is pushed up,
  // so a reload never switches themes under the reader.
  const userTheme = normalizeTheme(user?.settings?.theme);
  useEffect(() => {
    if (!user || !userTheme) return;
    const local = readLocal();
    if (!local) {
      applyTheme(userTheme);
      saveLocal(userTheme);
    } else if (local !== userTheme) {
      userService.updateSettings({ theme: local }).catch((err) => {
        console.error('Failed to save theme', err);
      });
    }
    // only when a different account / saved value arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userTheme]);

  // Same rule for the sparkle setting.
  const userEffects = user?.settings?.sparkle_enabled;
  useEffect(() => {
    if (!user || typeof userEffects !== 'boolean') return;
    const local = readLocalEffects();
    if (local === null) {
      setEffectsState(userEffects);
      saveLocalEffects(userEffects);
    } else if (local !== userEffects) {
      userService.updateSettings({ sparkle_enabled: local }).catch((err) => {
        console.error('Failed to save sparkle setting', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userEffects]);

  // Same rule for the reading font size.
  const userFont = user?.settings?.font_size;
  useEffect(() => {
    if (!user || typeof userFont !== 'number') return;
    const local = readLocalFont();
    if (local === null) {
      setFontState(clampFont(userFont));
      applyFont(clampFont(userFont));
      saveLocalFont(clampFont(userFont));
    } else if (local !== userFont) {
      userService.updateSettings({ font_size: local }).catch((err) => {
        console.error('Failed to save font size', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userFont]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next = normalizeTheme(e.newValue);
      if (next) applyTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyTheme]);

  useEffect(() => {
    syncThemeColorMeta();
    return () => {
      window.clearTimeout(fadeTimer.current);
      window.clearTimeout(fontTimer.current);
    };
  }, []);

  const decoration = useCallback((key: keyof ThemeDecorations) => getDecoration(theme, key), [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        definition: THEMES[theme],
        setTheme,
        toggleTheme,
        decoration,
        effectsEnabled,
        setEffectsEnabled,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
