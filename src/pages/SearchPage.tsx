import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, SlidersHorizontal, Sparkles, X, ChevronLeft, ChevronRight, Library, Telescope } from 'lucide-react';
import type { Comic, Paginated, SearchFacets, SearchSort } from '../types';
import { searchComics, getSearchFacets } from '../services/comicService';
import { ComicCard } from '../components/ComicCard';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { BottomSheet } from '../components/BottomSheet';
import { SearchFiltersPanel } from '../features/search/SearchFilters';
import {
  EMPTY_FILTERS,
  SearchFilters,
  countActiveFilters,
  parseSearch,
  rememberLastSearch,
  serializeSearch,
  toSearchParams,
} from '../features/search/searchState';
import { useRecentSearches } from '../features/search/useRecentSearches';
import type { SearchTab } from '../features/search/searchState';
import { DiscoverResults } from '../features/discover/DiscoverResults';

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 300;
const RECENT_AFTER_MS = 1500; // a query that stays this long counts as a real search
const QUICK_TAGS = 6;

/** "Chữa lành" → "ChữaLành" (hashtag style, like the design). */
const toHashtag = (label: string) =>
  label
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1))
    .join('');

const SORT_OPTIONS: { value: SearchSort; label: string; needsQuery?: boolean }[] = [
  { value: 'relevance', label: 'Khớp nhất', needsQuery: true },
  { value: 'updated_at', label: 'Mới cập nhật' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'progress', label: 'Tiến độ đọc' },
  { value: 'title', label: 'Tên A → Z' },
];

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseSearch(params), [params]);
  const paramsKey = params.toString();
  const { recents, add: addRecent, remove: removeRecent } = useRecentSearches();

  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [result, setResult] = useState<Paginated<Comic> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ── URL updates (always from the latest URL, so nothing is lost) ── */
  const update = useCallback(
    (patch: Partial<SearchFilters>) => {
      setParams(
        (prev) => {
          const cur = parseSearch(prev);
          return serializeSearch({ ...cur, ...patch, page: patch.page ?? 1 });
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const resetAll = useCallback(() => {
    setParams((prev) => serializeSearch({ ...EMPTY_FILTERS, q: '', tab: parseSearch(prev).tab }), { replace: true });
  }, [setParams]);

  const tab: SearchTab = filters.tab;
  const discovering = tab === 'discover';
  // the search text goes along to the other tab; filters stay with "Trong tủ"
  const switchTab = (next: SearchTab) => next !== tab && update({ tab: next });

  const resetFilters = useCallback(() => update({ ...EMPTY_FILTERS }), [update]);

  /* ── search text: debounced into the URL; follows the URL when the header changes it ── */
  const [text, setText] = useState(filters.q);
  const written = useRef(filters.q);

  useEffect(() => {
    if (text === filters.q) return;
    const t = window.setTimeout(() => {
      written.current = text;
      update({ q: text });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (filters.q !== written.current) {
      written.current = filters.q;
      setText(filters.q);
    }
    rememberLastSearch(filters.q);
    if (filters.q.trim().length < 2) return;
    const t = window.setTimeout(() => addRecent(filters.q), RECENT_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [filters.q, addRecent]);

  const commitNow = (q = text) => {
    written.current = q;
    setText(q);
    update({ q });
    addRecent(q);
  };

  /* ── data ── */
  const [loadError, setLoadError] = useState<unknown>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getSearchFacets().then(setFacets).catch(console.error);
  }, [retryKey]);

  const requestId = useRef(0);
  useEffect(() => {
    if (discovering) return; // "Khám phá" loads its own results
    const id = ++requestId.current;
    setIsLoading(true);
    setLoadError(null);
    searchComics(toSearchParams(filters, PAGE_SIZE))
      .then((res) => {
        if (id === requestId.current) setResult(res);
      })
      .catch((err) => {
        console.error(err);
        if (id === requestId.current) setLoadError(err);
      })
      .finally(() => {
        if (id === requestId.current) setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, retryKey]);

  /* ── derived ── */
  const activeCount = countActiveFilters(filters);
  const labelOf = (list: SearchFacets['statuses'] | undefined, v: string) => list?.find((o) => o.value === v)?.label ?? v;
  const q = filters.q.trim();
  const sort: SearchSort = filters.sort ?? (q ? 'relevance' : 'updated_at');

  const chips: ActiveChip[] = [];
  if (q) chips.push({ key: 'q', label: `Từ khóa: “${q}”`, onRemove: () => commitNow('') });
  filters.statuses.forEach((v) =>
    chips.push({ key: `s-${v}`, label: labelOf(facets?.statuses, v), onRemove: () => update({ statuses: filters.statuses.filter((x) => x !== v) }) })
  );
  filters.genres.forEach((v) => chips.push({ key: `g-${v}`, label: `#${v}`, onRemove: () => update({ genres: filters.genres.filter((x) => x !== v) }) }));
  filters.sources.forEach((v) => chips.push({ key: `src-${v}`, label: v, onRemove: () => update({ sources: filters.sources.filter((x) => x !== v) }) }));
  filters.shelves.forEach((v) =>
    chips.push({ key: `sh-${v}`, label: `Kệ: ${labelOf(facets?.shelves, v)}`, onRemove: () => update({ shelves: filters.shelves.filter((x) => x !== v) }) })
  );
  if (filters.min_rating) chips.push({ key: 'rating', label: `Từ ${filters.min_rating} tim`, onRemove: () => update({ min_rating: undefined }) });
  if ((filters.progress_min ?? 0) > 0 || (filters.progress_max ?? 100) < 100)
    chips.push({
      key: 'progress',
      label: `Tiến độ ${filters.progress_min}–${filters.progress_max}%`,
      onRemove: () => update({ progress_min: 0, progress_max: 100 }),
    });
  if (filters.has_new_chapter) chips.push({ key: 'new', label: 'Có chương mới 🌸', onRemove: () => update({ has_new_chapter: false }) });
  if (filters.has_broken_link) chips.push({ key: 'broken', label: 'Có link hỏng', onRemove: () => update({ has_broken_link: false }) });

  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showInitialSkeleton = isLoading && !result;

  const filterPanel = <SearchFiltersPanel filters={filters} facets={facets} onChange={update} onReset={resetFilters} />;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* ── Search bay ── */}
      <section className="relative overflow-hidden bg-surface border-1.5 border-border rounded-3xl p-4 md:p-8 shadow-botanical-sm">
        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-6 text-[120px] leading-none opacity-10 select-none">
          ✿
        </span>
        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="hidden md:block text-center">
            <h1 className="font-serif text-xl font-semibold text-text flex items-center justify-center gap-2">
              <span aria-hidden="true" className="text-accent-ink">❦</span> Kính Lúp Hoa Cỏ Của Nàng <span aria-hidden="true" className="text-accent-ink">❦</span>
            </h1>
            {discovering ? (
              <p className="text-xs italic text-text-muted mt-1">Tìm truyện mới trên MangaDex và AniList rồi thêm thẳng vào tủ</p>
            ) : (
              facets && (
                <p className="text-xs italic text-text-muted mt-1">
                  Tra cứu trong {facets.total} tập truyện theo tên, tác giả, thẻ hoa và ghi chú
                </p>
              )
            )}
          </div>
          <h1 className="sr-only md:hidden">Tìm kiếm truyện</h1>

          {/* Tabs: her own comics / across the web */}
          <div role="tablist" aria-label="Tìm ở đâu" className="w-full max-w-sm p-1 bg-surface-sunken/60 rounded-full flex items-center gap-1 border border-border/40">
            {(
              [
                { value: 'library', label: 'Trong tủ', icon: <Library size={15} /> },
                { value: 'discover', label: 'Khám phá', icon: <Telescope size={15} /> },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => switchTab(t.value)}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  tab === t.value ? 'bg-surface-raised text-primary-ink shadow-botanical-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="w-full flex items-center gap-2">
            <SearchBar
              value={text}
              onChange={setText}
              onSubmit={() => commitNow()}
              shortcut={false}
              ariaLabel={discovering ? 'Tìm truyện theo tên trên MangaDex và AniList' : 'Tìm theo tên truyện, tác giả, thẻ hoa, ghi chú'}
              placeholder={discovering ? 'Tìm truyện mới theo tên (tên gốc, tiếng Anh, romaji)...' : 'Tìm theo tên truyện, tác giả, thẻ hoa, ghi chú...'}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => commitNow()}
              className="hidden md:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold glow-primary hover:bg-primary-deep transition-colors cursor-pointer shrink-0"
            >
              <Sparkles size={15} /> Tra cứu
            </button>
            {!discovering && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label={activeCount ? `Bộ lọc, ${activeCount} đang bật` : 'Bộ lọc'}
                className="md:hidden relative shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center glow-primary cursor-pointer"
              >
                <SlidersHorizontal size={17} />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-on-gold text-[10px] font-bold flex items-center justify-center shadow-botanical-sm">
                    {activeCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Recent searches */}
          {recents.length > 0 && (
            <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap">
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-text-muted">
                <History size={13} /> Gần đây:
              </span>
              {recents.map((r) => (
                <span key={r} className="shrink-0 inline-flex items-center rounded-full bg-surface-raised border border-border text-xs text-text">
                  <button type="button" onClick={() => commitNow(r)} className="pl-2.5 pr-1 py-1 cursor-pointer hover:text-primary">
                    {r}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(r)}
                    aria-label={`Xóa “${r}” khỏi tìm kiếm gần đây`}
                    className="pr-2 pl-0.5 py-1 text-text-muted hover:text-danger cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick genre tags */}
          {!discovering && facets && facets.genres.length > 0 && (
            <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap">
              <span className="shrink-0 text-[11px] font-semibold text-text-muted">🌿 Gợi ý:</span>
              {facets.genres.slice(0, QUICK_TAGS).map((g) => {
                const on = filters.genres.includes(g.value);
                return (
                  <button
                    key={g.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ genres: on ? filters.genres.filter((x) => x !== g.value) : [...filters.genres, g.value] })}
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      on ? 'bg-primary text-on-primary' : 'bg-primary-tint text-primary-ink hover:bg-leaf-tint'
                    }`}
                  >
                    #{toHashtag(g.label)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {discovering ? (
        <section aria-label="Kết quả khám phá">
          <DiscoverResults
            query={filters.q}
            page={filters.page}
            onPageChange={(page) => update({ page })}
            emptyAction={{ text: 'Tự nhập truyện vào tủ', onClick: () => navigate('/add') }}
          />
        </section>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* ── Filters (md+) ── */}
        <aside className="hidden md:block md:col-span-5 lg:col-span-4 xl:col-span-3 bg-surface border-1.5 border-border rounded-3xl p-3.5 shadow-botanical-sm">
          {filterPanel}
        </aside>

        {/* ── Results ── */}
        <section className="md:col-span-7 lg:col-span-8 xl:col-span-9 flex flex-col gap-4" aria-live="polite" aria-busy={isLoading}>
          <div className="bg-surface border-1.5 border-border rounded-2xl p-3.5 shadow-botanical-sm flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-serif text-base sm:text-lg text-text">
                Tìm thấy <strong className="text-primary">{total}</strong> truyện
                {q && (
                  <span className="text-sm italic text-text-muted font-sans"> khớp “{q}”</span>
                )}
              </p>
              <label className="flex items-center gap-1.5 text-xs text-text-muted">
                <span>Sắp xếp:</span>
                <select
                  value={sort}
                  onChange={(e) => update({ sort: e.target.value as SearchSort })}
                  className="bg-surface-raised border border-border rounded-full px-2.5 py-1 text-xs font-semibold text-text cursor-pointer focus:outline-none focus:border-primary"
                >
                  {SORT_OPTIONS.filter((o) => !o.needsQuery || q).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {chips.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap">
                {chips.map((c) => (
                  <span key={c.key} className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-gold-tint text-gold-ink text-[11px] font-semibold">
                    {c.label}
                    <button
                      type="button"
                      onClick={c.onRemove}
                      aria-label={`Bỏ lọc ${c.label}`}
                      className="p-0.5 rounded-full hover:bg-gold/30 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {chips.length > 1 && (
                  <button type="button" onClick={resetAll} className="shrink-0 text-[11px] font-semibold text-text-muted hover:text-text underline cursor-pointer px-1">
                    Xóa tất cả
                  </button>
                )}
              </div>
            )}
          </div>

          {loadError && !isLoading ? (
            <ErrorState error={loadError} onRetry={() => setRetryKey((k) => k + 1)} />
          ) : showInitialSkeleton ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="arch-card bg-surface/60 border border-border animate-pulse h-72" />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon="🔍"
              title="Không tìm thấy truyện nào..."
              description="Nàng thử bớt các bộ lọc hoặc tìm bằng từ khóa ngắn hơn xem sao nhé! Khu vườn truyện vẫn còn nhiều điều kỳ diệu đang chờ nàng."
              actionText="Đặt lại tất cả bộ lọc"
              onAction={resetAll}
              secondaryText="Trở về tủ sách"
              onSecondary={() => navigate('/library')}
            />
          ) : (
            <>
              <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
                {result!.items.map((comic) => (
                  <ComicCard key={comic.id} comic={comic} highlight={q} />
                ))}
              </div>

              {pages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 py-2" aria-label="Phân trang kết quả">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => update({ page: filters.page - 1 })}
                    aria-label="Trang trước"
                    className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-current={n === filters.page ? 'page' : undefined}
                      onClick={() => update({ page: n })}
                      className={`w-8 h-8 rounded-full text-xs font-semibold cursor-pointer ${
                        n === filters.page ? 'bg-primary text-on-primary glow-primary' : 'text-text hover:bg-surface'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={filters.page >= pages}
                    onClick={() => update({ page: filters.page + 1 })}
                    aria-label="Trang sau"
                    className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
      )}

      {/* ── Filters (mobile) ── */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Bộ Lọc Hoa Thảo Mộc"
        subtitle={facets ? `Lọc trong ${facets.total} tác phẩm của nàng` : undefined}
        footer={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 py-2.5 rounded-full bg-surface border border-border text-sm font-semibold text-text cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex-[2] py-2.5 rounded-full bg-gold text-on-gold text-sm font-bold glow-gold cursor-pointer"
            >
              Xem {total} truyện
            </button>
          </div>
        }
      >
        <SearchFiltersPanel filters={filters} facets={facets} onChange={update} onReset={resetFilters} compact />
      </BottomSheet>
    </div>
  );
};
