/**
 * Theme config: metadata + decoration images per theme.
 * Colors live in src/index.css as --c-* variables under [data-theme="<id>"].
 * A theme that omits a decoration falls back to the day image.
 */
import cottageGreenhouse from '../assets/images/cottage_greenhouse_store_1790241469393.jpg';
import secretFairyGarden from '../assets/images/secret_fairy_garden_1790241482673.jpg';
import sunlitTraveler from '../assets/images/traveler_in_sunlit_meadow_1790241493617.jpg';

export type ThemeId = 'day' | 'night';

export interface ThemeDecorations {
  /** Fallback covers for the shelf collage when a shelf has fewer than 3 comics */
  shelfCollageLeft: string;
  shelfCollageCenter: string;
  shelfCollageRight: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  /** Palette name */
  name: string;
  /** Label on the Account > Giao diện preview card */
  label: string;
  description: string;
  icon: string;
  decorations: Partial<ThemeDecorations>;
}

export const DEFAULT_THEME: ThemeId = 'day';
export const THEME_STORAGE_KEY = 'tutruyen-theme';

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  day: {
    id: 'day',
    name: 'Rừng tiên oải hương',
    label: 'Rừng tiên ban ngày',
    description: 'Lá non, oải hương và nắng sớm dịu dàng',
    icon: '🌸',
    decorations: {
      shelfCollageLeft: secretFairyGarden,
      shelfCollageCenter: cottageGreenhouse,
      shelfCollageRight: sunlitTraveler,
    },
  },
  night: {
    id: 'night',
    name: 'Khu vườn tiên đêm',
    label: 'Khu vườn tiên đêm',
    description: 'Ánh trăng, đom đóm và sương bạc hà lấp lánh',
    icon: '🌙',
    // Add night-specific images here; missing keys use the day images.
    decorations: {},
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

/** Accepts legacy 'light' / 'dark' values saved before the theme system. */
export function normalizeTheme(value: unknown): ThemeId | null {
  if (isThemeId(value)) return value;
  if (value === 'light') return 'day';
  if (value === 'dark') return 'night';
  return null;
}

export function getDecoration(theme: ThemeId, key: keyof ThemeDecorations): string {
  return THEMES[theme].decorations[key] ?? THEMES.day.decorations[key] ?? '';
}
