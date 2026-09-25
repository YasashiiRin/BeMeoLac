import React, { useState } from 'react';
import { Heart, RotateCcw } from 'lucide-react';
import type { ComicStatus, SearchFacets } from '../../types';
import type { SearchFilters } from './searchState';
import './search.css';

interface Props {
  filters: SearchFilters;
  facets: SearchFacets | null;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
  /** hide the panel's own title (the bottom sheet has one) */
  compact?: boolean;
}

const GENRES_COLLAPSED = 10;

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const Section: React.FC<{ title: string; hint?: React.ReactNode; children: React.ReactNode }> = ({ title, hint, children }) => (
  <fieldset className="bg-surface-raised/80 border border-border/60 rounded-2xl p-3 shadow-botanical-sm">
    <legend className="sr-only">{title}</legend>
    <div className="flex items-center justify-between gap-2 mb-2" aria-hidden="true">
      <span className="text-xs font-bold text-primary tracking-wide">{title}</span>
      {hint}
    </div>
    {children}
  </fieldset>
);

const CheckRow: React.FC<{ checked: boolean; onChange: () => void; label: React.ReactNode; count: number }> = ({ checked, onChange, label, count }) => (
  <label
    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
      checked ? 'bg-primary-tint' : 'hover:bg-surface'
    }`}
  >
    <span className="flex items-center gap-2 min-w-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-primary cursor-pointer shrink-0" />
      <span className={`text-sm truncate ${checked ? 'text-text font-semibold' : 'text-text'}`}>{label}</span>
    </span>
    <span className="text-[11px] tabular-nums text-text-muted shrink-0">{count}</span>
  </label>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
      active
        ? 'bg-primary text-on-primary border-primary glow-primary'
        : 'bg-surface text-text border-border hover:border-primary-soft'
    }`}
  >
    {children}
  </button>
);

const Switch: React.FC<{ checked: boolean; onChange: () => void; label: string; icon: string }> = ({ checked, onChange, label, icon }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className="w-full flex items-center justify-between gap-3 py-1.5 cursor-pointer text-left"
  >
    <span className="text-sm text-text flex items-center gap-1.5">
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
    <span
      className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${checked ? 'bg-accent' : 'bg-surface-sunken border border-border'}`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-raised shadow-botanical-sm transition-[left] ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </span>
  </button>
);

export const SearchFiltersPanel: React.FC<Props> = ({ filters, facets, onChange, onReset, compact = false }) => {
  const [allGenres, setAllGenres] = useState(false);
  const pmin = filters.progress_min ?? 0;
  const pmax = filters.progress_max ?? 100;
  const genres = facets?.genres ?? [];
  const shownGenres = allGenres ? genres : genres.slice(0, GENRES_COLLAPSED);

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex items-start justify-between gap-2 pb-1">
          <div>
            <h2 className="font-serif text-base font-semibold text-text flex items-center gap-1.5 leading-snug">
              <span aria-hidden="true">🌿</span> Bộ Lọc Hoa Thảo Mộc
            </h2>
            {facets && <p className="text-xs italic text-text-muted mt-0.5">Lọc trong {facets.total} tác phẩm của nàng</p>}
          </div>
          <button type="button" onClick={onReset} className="shrink-0 whitespace-nowrap text-xs font-semibold text-gold-ink hover:text-text flex items-center gap-1 pt-1 cursor-pointer">
            <RotateCcw size={12} /> Xóa hết
          </button>
        </div>
      )}

      <Section title="Trạng thái đọc">
        <div className="flex flex-col gap-0.5">
          {(facets?.statuses ?? []).map((s) => (
            <CheckRow
              key={s.value}
              label={s.label}
              count={s.count}
              checked={filters.statuses.includes(s.value as ComicStatus)}
              onChange={() => onChange({ statuses: toggle(filters.statuses, s.value as ComicStatus) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Thể loại hương hoa" hint={<span aria-hidden="true" className="text-accent-ink text-xs">✿</span>}>
        <div className="flex flex-wrap gap-1.5">
          {shownGenres.map((g) => (
            <Chip key={g.value} active={filters.genres.includes(g.value)} onClick={() => onChange({ genres: toggle(filters.genres, g.value) })}>
              {g.label}
              <span className="tabular-nums font-normal">{g.count}</span>
            </Chip>
          ))}
        </div>
        {genres.length > GENRES_COLLAPSED && (
          <button type="button" onClick={() => setAllGenres((v) => !v)} className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer">
            {allGenres ? 'Thu gọn' : `Xem thêm ${genres.length - GENRES_COLLAPSED} thể loại`}
          </button>
        )}
      </Section>

      <Section title="Nguồn thư viện">
        <div className="flex flex-col gap-0.5">
          {(facets?.sources ?? []).map((s) => (
            <CheckRow
              key={s.value}
              label={
                <>
                  <span aria-hidden="true" className="mr-1">{s.icon}</span>
                  {s.label}
                </>
              }
              count={s.count}
              checked={filters.sources.includes(s.value)}
              onChange={() => onChange({ sources: toggle(filters.sources, s.value) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Kệ sách cá nhân">
        <div className="flex flex-wrap gap-1.5">
          {(facets?.shelves ?? []).map((s) => (
            <Chip key={s.value} active={filters.shelves.includes(s.value)} onClick={() => onChange({ shelves: toggle(filters.shelves, s.value) })}>
              <span aria-hidden="true">{s.icon}</span>
              {s.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section
        title="Độ rung động"
        hint={<span className="text-[11px] font-semibold text-accent-ink">{filters.min_rating ? `Từ ${filters.min_rating} tim trở lên` : 'Mọi mức'}</span>}
      >
        <div className="flex items-center justify-center gap-2 py-1 bg-surface rounded-xl" role="radiogroup" aria-label="Đánh giá tối thiểu">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = (filters.min_rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={filters.min_rating === n}
                aria-label={`Từ ${n} tim`}
                onClick={() => onChange({ min_rating: filters.min_rating === n ? undefined : n })}
                className="p-1 hover:scale-110 transition-transform cursor-pointer"
              >
                <Heart size={20} className={on ? 'fill-accent text-accent' : 'text-border-strong'} />
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Tiến độ trang sách" hint={<span className="text-[11px] font-bold text-gold-ink tabular-nums">{pmin}% — {pmax}%</span>}>
        <div className="range-dual">
          <div className="range-dual-track">
            <div className="range-dual-fill" style={{ left: `${pmin}%`, right: `${100 - pmax}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pmin}
            style={{ zIndex: pmin > 50 ? 2 : 1 }}
            aria-label="Tiến độ tối thiểu"
            onChange={(e) => onChange({ progress_min: Math.min(Number(e.target.value), pmax) })}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pmax}
            aria-label="Tiến độ tối đa"
            onChange={(e) => onChange({ progress_max: Math.max(Number(e.target.value), pmin) })}
          />
        </div>
        <div className="flex justify-between text-[11px] text-text-muted mt-1">
          <span>Khởi đầu (0%)</span>
          <span>Viên mãn (100%)</span>
        </div>
      </Section>

      <Section title="Dấu ấn thần kỳ">
        <Switch icon="🌸" label="Có chương mới chưa đọc" checked={!!filters.has_new_chapter} onChange={() => onChange({ has_new_chapter: !filters.has_new_chapter })} />
        <Switch icon="🔗" label="Có liên kết hỏng cần sửa" checked={!!filters.has_broken_link} onChange={() => onChange({ has_broken_link: !filters.has_broken_link })} />
      </Section>
    </div>
  );
};
