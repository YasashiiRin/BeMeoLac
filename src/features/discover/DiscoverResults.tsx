import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CloudOff } from 'lucide-react';
import type { Comic, DiscoverPage, DiscoverResult } from '../../types';
import { DISCOVER_MIN_QUERY, searchDiscover } from '../../services/discoverService';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { DiscoverResultCard } from './DiscoverResultCard';
import { AddToLibraryDrawer } from './AddToLibraryDrawer';

const MAX_PAGE = 10; // the API serves pages 1–10
// each provider sends up to 20 per page; a page this full probably has a next one
const FULL_PAGE = 10;

interface DiscoverResultsProps {
  query: string;
  page: number;
  onPageChange: (page: number) => void;
  /** after "Thêm vào tủ" (created, or already there) */
  onSaved?: (comic: Comic, created: boolean) => void;
  /** shown when the search finds nothing (e.g. "enter it by hand") */
  emptyAction?: { text: string; onClick: () => void };
}

const names = (page: DiscoverPage, providers: string[]) => providers.map((p) => page.provider_names[p] ?? p).join(', ');

/** Results of GET /api/discover/search for `query`, with "Thêm vào tủ" on each. */
export const DiscoverResults: React.FC<DiscoverResultsProps> = ({ query, page, onPageChange, onSaved, emptyAction }) => {
  const q = query.trim();
  const [data, setData] = useState<DiscoverPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [adding, setAdding] = useState<DiscoverResult | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    if (q.length < DISCOVER_MIN_QUERY) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    searchDiscover(q, page)
      .then((res) => id === requestId.current && setData(res))
      .catch((err) => {
        console.error('Discover search failed:', err);
        if (id === requestId.current) setError(err);
      })
      .finally(() => id === requestId.current && setLoading(false));
  }, [q, page, retryKey]);

  const saved = (comic: Comic, created: boolean) => {
    const target = adding;
    setAdding(null);
    // the result now links to her comic
    setData((d) =>
      d && target
        ? {
            ...d,
            results: d.results.map((r) =>
              r.provider === target.provider && r.external_id === target.external_id ? { ...r, in_library: true, library_item_id: comic.id } : r
            ),
          }
        : d
    );
    onSaved?.(comic, created);
  };

  if (q.length < DISCOVER_MIN_QUERY) {
    return (
      <EmptyState
        icon="🔭"
        title="Tìm truyện khắp nơi"
        description="Nàng gõ tên truyện (từ 2 chữ cái) để tìm trên MangaDex và AniList, rồi thêm thẳng vào tủ nhé."
      />
    );
  }

  if (error && !loading) return <ErrorState error={error} onRetry={() => setRetryKey((k) => k + 1)} title="Chưa tìm được lúc này" />;

  if (!data || (loading && data.query !== q)) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 rounded-3xl bg-surface/60 border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  const failed = data.providers_failed;
  const allFailed = failed.length > 0 && failed.length === data.providers.length;
  const hasNext = page < MAX_PAGE && data.results.length >= FULL_PAGE;

  return (
    <div className="flex flex-col gap-3" aria-live="polite" aria-busy={loading}>
      {failed.length > 0 && !allFailed && (
        <p className="flex items-start gap-2 text-xs text-text-muted bg-surface border border-border rounded-2xl px-3 py-2">
          <CloudOff className="w-4 h-4 shrink-0 text-gold-ink" />
          <span>
            {names(data, failed)} đang bận nên chưa góp kết quả lần này. Nàng xem tạm các kết quả dưới đây, hoặc{' '}
            <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="underline font-semibold hover:text-text cursor-pointer">
              thử lại
            </button>{' '}
            sau một chút nhé 🌙
          </span>
        </p>
      )}

      {allFailed ? (
        <EmptyState
          icon="🌙"
          title="Các nguồn tìm kiếm đang nghỉ ngơi"
          description={`${names(data, failed)} chưa trả lời kịp. Nàng thử lại sau một chút nhé.`}
          actionText="Thử lại"
          onAction={() => setRetryKey((k) => k + 1)}
        />
      ) : data.results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={page > 1 ? 'Hết kết quả rồi' : 'Chưa tìm thấy truyện nào'}
          description="Nàng thử tên khác (tên gốc, tên tiếng Anh hoặc romaji) xem sao nhé."
          actionText={page > 1 ? 'Về trang đầu' : emptyAction?.text}
          onAction={page > 1 ? () => onPageChange(1) : emptyAction?.onClick}
        />
      ) : (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data.results.map((r) => (
            <DiscoverResultCard key={`${r.provider}:${r.external_id}`} result={r} query={q} onAdd={setAdding} />
          ))}
        </div>
      )}

      {(page > 1 || hasNext) && !allFailed && (
        <nav className="flex items-center justify-center gap-2 py-2" aria-label="Phân trang kết quả khám phá">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Trang trước"
            className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-text-muted">Trang {page}</span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            aria-label="Trang sau"
            className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      <AddToLibraryDrawer result={adding} onClose={() => setAdding(null)} onSaved={saved} />
    </div>
  );
};
