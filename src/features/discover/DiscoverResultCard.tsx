import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import type { DiscoverResult, PublicationStatus } from '../../types';
import { HighlightText } from '../../components/HighlightText';
import { Button } from '../../components/Button';

const PUBLICATION: Record<PublicationStatus, string> = {
  ongoing: 'Đang ra',
  completed: 'Đã hoàn thành',
  hiatus: 'Tạm ngưng',
  cancelled: 'Đã dừng',
  unknown: '',
};
const MAX_GENRES = 4;

interface DiscoverResultCardProps {
  result: DiscoverResult;
  query?: string;
  onAdd: (result: DiscoverResult) => void;
}

/** One web search result: cover, title, authors, genres, latest chapter, where to read, attribution. */
export const DiscoverResultCard: React.FC<DiscoverResultCardProps> = ({ result, query, onAdd }) => {
  const altTitle = result.alt_titles.find((t) => t !== result.title);
  const publication = PUBLICATION[result.status];

  return (
    <article className="bg-surface border-1.5 border-border rounded-3xl p-3 sm:p-4 shadow-botanical-sm flex gap-3 sm:gap-4">
      <div className="w-20 sm:w-24 h-30 sm:h-36 shrink-0 rounded-t-full rounded-b-xl overflow-hidden bg-surface-sunken border border-border-strong/30">
        {result.cover_url ? (
          <img
            src={result.cover_url}
            alt={`Bìa truyện ${result.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-3xl" aria-hidden="true">🌿</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="min-w-0">
          <h3 className="font-serif text-base font-semibold text-text leading-snug line-clamp-2">
            <HighlightText text={result.title} query={query} />
          </h3>
          {altTitle && <p className="text-[11px] text-text-muted italic truncate">{altTitle}</p>}
          {result.authors.length > 0 && <p className="text-xs text-text-muted truncate">✍ {result.authors.join(', ')}</p>}
        </div>

        <p className="text-xs text-text flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-gold-ink" />
            {result.latest_chapter ? `${result.latest_chapter} chương` : 'Chưa rõ số chương'}
          </span>
          {publication && <span className="text-text-muted">· {publication}</span>}
        </p>

        {result.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.genres.slice(0, MAX_GENRES).map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full bg-primary-tint text-primary-ink text-[10px] font-semibold">
                #{g}
              </span>
            ))}
          </div>
        )}

        {result.links.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-text-muted">Đọc ở:</span>
            {result.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text hover:border-primary hover:text-primary transition-colors"
              >
                {link.site_name}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="flex flex-wrap items-center gap-1 text-[10px] text-text-muted">
            <span>Dữ liệu từ</span>
            {result.attribution.map((credit) => (
              <a
                key={credit.provider}
                href={credit.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Xem trên ${credit.name}`}
                className="px-1.5 py-0.5 rounded-md bg-gold-tint text-gold-ink font-bold hover:underline"
              >
                {credit.name}
              </a>
            ))}
          </p>

          {result.in_library && result.library_item_id ? (
            <Link
              to={`/comics/${result.library_item_id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-leaf-tint text-primary-ink text-xs font-semibold hover:underline"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã có trong tủ
            </Link>
          ) : (
            <Button type="button" variant="honey" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => onAdd(result)}>
              Thêm vào tủ
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
