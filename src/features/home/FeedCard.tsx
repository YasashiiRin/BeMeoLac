import React, { useState } from 'react';
import { BookOpen, EyeOff, Plus, Sparkles } from 'lucide-react';
import type { FeedItem, PublicationStatus } from '../../types';
import { Button } from '../../components/Button';
import { genreLabel } from './genres';

const PUBLICATION: Record<PublicationStatus, string> = {
  ongoing: 'Đang ra',
  completed: 'Hoàn thành',
  hiatus: 'Tạm ngưng',
  cancelled: 'Đã dừng',
  unknown: '',
};
const MAX_GENRES = 2;

interface FeedCardProps {
  item: FeedItem;
  onAdd: (item: FeedItem) => void;
  onDismiss: (item: FeedItem) => void;
  /** fading out after "Không quan tâm" */
  leaving?: boolean;
}

/** A suggestion on the home page, in ComicCard's arched frame: why it's suggested, where the data comes from. */
export const FeedCard: React.FC<FeedCardProps> = ({ item, onAdd, onDismiss, leaving = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(!item.cover_url);
  const publication = PUBLICATION[item.status];

  return (
    <article
      aria-label={item.title}
      className={`group relative w-full flex flex-col bg-surface border-1.5 border-border arch-card shadow-botanical hover:shadow-botanical-lg transition-all duration-300 overflow-hidden p-2.5 sm:p-3 ${
        leaving ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 hover:-translate-y-1'
      }`}
    >
      <div className="relative w-full aspect-[3/4] arch-card-sm overflow-hidden bg-background border border-border/60 shadow-inner">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface to-primary-tint text-primary">
            <span className="text-2xl animate-pulse" aria-hidden="true">🌸</span>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-surface to-primary-tint text-center">
            <span className="text-3xl mb-1" aria-hidden="true">🌿</span>
            <span className="font-serif font-semibold text-xs text-text line-clamp-2">{item.title}</span>
          </div>
        ) : (
          <img
            src={item.cover_url}
            alt={`Bìa truyện ${item.title}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/40 via-transparent to-scrim/20 pointer-events-none" />

        {/* where the data comes from: badges linking back to the provider */}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 z-10">
          {item.attribution.map((credit) => (
            <a
              key={credit.provider}
              href={credit.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Xem trên ${credit.name}`}
              className="px-1.5 py-0.5 rounded-md bg-gold-tint/95 text-gold-ink text-[10px] font-bold shadow-xs hover:underline"
            >
              {credit.name}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 pt-2.5 px-1 gap-1.5">
        <div>
          <h3 title={item.title} className="font-serif font-semibold text-sm sm:text-base text-text line-clamp-2 leading-snug">
            {item.title}
          </h3>
          {item.authors.length > 0 && (
            <p className="text-xs text-text-muted italic line-clamp-1 mt-0.5">tác giả {item.authors.join(', ')}</p>
          )}
        </div>

        <p className="inline-flex items-start gap-1 self-start max-w-full px-2 py-1 rounded-xl bg-accent-tint text-accent-ink text-[11px] font-semibold leading-snug">
          <Sparkles className="w-3 h-3 shrink-0 mt-px" aria-hidden="true" />
          <span className="line-clamp-2">{item.reason}</span>
        </p>

        {item.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.genres.slice(0, MAX_GENRES).map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full bg-primary-tint text-primary-ink text-[10px] font-semibold">
                #{genreLabel(g)}
              </span>
            ))}
          </div>
        )}

        <p className="text-[11px] text-text-muted flex items-center gap-1 tabular-nums">
          <BookOpen className="w-3.5 h-3.5 text-gold-ink shrink-0" aria-hidden="true" />
          <span className="truncate">
            {item.latest_chapter ? `${item.latest_chapter} chương` : 'Chưa rõ số chương'}
            {publication && ` · ${publication}`}
          </span>
        </p>

        <div className="mt-auto pt-2 border-t border-border/50 flex flex-col gap-1">
          <Button type="button" variant="honey" size="sm" fullWidth iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => onAdd(item)}>
            Thêm vào tủ
          </Button>
          <button
            type="button"
            onClick={() => onDismiss(item)}
            className="w-full inline-flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium text-text-muted hover:text-text hover:bg-surface-sunken transition-colors cursor-pointer"
          >
            <EyeOff className="w-3 h-3" aria-hidden="true" />
            Không quan tâm
          </button>
        </div>
      </div>
    </article>
  );
};
