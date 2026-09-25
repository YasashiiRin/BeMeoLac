import React, { useEffect, useRef } from 'react';
import { Check, Sparkles, Type } from 'lucide-react';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { THEMES, THEME_IDS, ThemeId } from '../../theme/themes';
import { Panel, SectionHeader, SettingSwitch } from './parts';
import { sectionById } from './sections';

const sizeName = (px: number) => (px < 15 ? 'Nhỏ nhắn' : px <= 18 ? 'Vừa vặn' : 'To rõ');

export const AppearanceSection: React.FC = () => {
  const { theme, setTheme, effectsEnabled, setEffectsEnabled, fontSize, setFontSize } = useTheme();
  const { showToast } = useToast();
  const fontToast = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(fontToast.current), []);

  const chooseTheme = (id: ThemeId) => {
    if (id === theme) return;
    setTheme(id);
    showToast(`Đã chuyển sang ${THEMES[id].label} ${THEMES[id].icon}`, 'success');
  };

  const changeFont = (px: number) => {
    setFontSize(px);
    window.clearTimeout(fontToast.current);
    fontToast.current = window.setTimeout(() => showToast(`Đã lưu cỡ chữ ${px}px (${sizeName(px)}) ✿`, 'success'), 700);
  };

  return (
    <div>
      <SectionHeader section={sectionById('appearance')!} />
      <div className="flex flex-col gap-5">
        <section aria-labelledby="garden-mood-heading">
          <h3 id="garden-mood-heading" className="text-sm font-semibold text-text">
            Không khí khu vườn
          </h3>
          <p className="text-xs text-text-muted mt-0.5 mb-3">Chạm vào một khung cảnh để đổi ngay, nàng nhé ✨</p>
          <div role="radiogroup" aria-labelledby="garden-mood-heading" className="grid grid-cols-2 gap-3">
            {THEME_IDS.map((id) => (
              <ThemePreviewCard key={id} themeId={id} selected={theme === id} onSelect={() => chooseTheme(id)} />
            ))}
          </div>
        </section>

        <Panel className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="font-size" className="text-sm font-semibold text-text flex items-center gap-1.5">
              <Type className="w-4 h-4 text-primary" aria-hidden="true" />
              Cỡ chữ hiển thị truyện
            </label>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-raised border border-border text-xs font-bold text-text tabular-nums">
              {fontSize}px · {sizeName(fontSize)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-serif text-text-muted" aria-hidden="true">A</span>
            <input
              id="font-size"
              type="range"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              step={1}
              value={fontSize}
              onChange={(e) => changeFont(Number(e.target.value))}
              aria-valuetext={`${fontSize} pixel, ${sizeName(fontSize)}`}
              className="w-full accent-primary cursor-pointer"
            />
            <span className="text-xl font-serif text-text" aria-hidden="true">A</span>
          </div>
          <div className="rounded-xl bg-surface-raised border border-border/60 p-3.5">
            <span className="block text-[11px] font-semibold text-text-muted mb-1">Mẫu trang đọc</span>
            <p className="reading-base font-serif italic text-text leading-relaxed">
              “Từng trang truyện ngát hương trà thảo mộc, tiếng gió xào xạc nơi giàn hoa tử đằng vỗ về giấc mơ nàng tiên...”
            </p>
          </div>
          <p className="text-[11px] text-text-muted">Áp dụng cho phần tóm tắt và ghi chú trong trang truyện.</p>
        </Panel>

        <Panel className="py-0">
          <SettingSwitch
            icon={<Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />}
            label="Hiệu ứng lấp lánh"
            description="Tiên nhỏ bay lượn, bụi phấn tiên và đom đóm quanh trang của nàng"
            checked={effectsEnabled}
            onChange={(on) => {
              setEffectsEnabled(on);
              showToast(on ? 'Bụi tiên đã trở lại khu vườn ✨' : 'Đã tắt hiệu ứng lấp lánh, vườn yên tĩnh hơn 🌙', 'success');
            }}
          />
        </Panel>
      </div>
    </div>
  );
};

/** Mini garden rendered in its own palette via a scoped data-theme. */
const ThemePreviewCard: React.FC<{ themeId: ThemeId; selected: boolean; onSelect: () => void }> = ({ themeId, selected, onSelect }) => {
  const def = THEMES[themeId];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative text-left rounded-2xl p-1 border-1.5 transition-all cursor-pointer ${
        selected ? 'border-primary glow-primary' : 'border-border hover:border-primary-soft'
      }`}
    >
      <div data-theme={themeId} className="rounded-xl overflow-hidden bg-background text-text">
        <div className="relative h-20 sm:h-24 px-3 pt-3 bg-sunbeam-gradient">
          <span className="absolute top-2 right-3 text-[10px] text-gold">✦ ✧</span>
          <span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-accent glow-accent" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="h-1.5 w-14 rounded-full bg-text/70" />
          </div>
          <div className="mt-2.5 flex gap-2">
            <div className="flex-1 h-9 sm:h-12 arch-card-sm bg-surface border border-border p-1.5 flex flex-col justify-end gap-1">
              <span className="h-1 w-full rounded-full bg-surface-sunken overflow-hidden">
                <span className="block h-full w-2/3 bg-accent rounded-full" />
              </span>
            </div>
            <div className="flex-1 h-9 sm:h-12 arch-card-sm bg-surface-raised border border-border p-1.5 flex flex-col justify-end">
              <span className="h-2.5 w-full rounded-full bg-primary glow-primary" />
            </div>
            <div className="hidden sm:block flex-1 h-12 arch-card-sm bg-fairy-gradient border border-border" />
          </div>
        </div>
        <div className="px-3 py-2.5 bg-surface border-t border-border">
          <span className="flex items-center gap-1.5 text-sm font-bold text-text">
            <span aria-hidden="true">{def.icon}</span>
            {def.label}
          </span>
          <span className="block text-[11px] text-text-muted mt-0.5">{def.description}</span>
        </div>
      </div>
      {selected && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-botanical-sm">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </button>
  );
};
