import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Link2Off, Trash2, Wrench } from 'lucide-react';
import { Notification } from '../../types';
import { timeAgo } from '../../utils/timeAgo';

const REVEAL = 88; // px the row slides to show "Xóa"

interface NotificationRowProps {
  notification: Notification;
  onOpen: (n: Notification) => void;
  /** where "Sửa nguồn" was used (marks it read) */
  onFixSource?: (n: Notification) => void;
  /** enables swipe-left-to-delete (touch) and the trash button (desktop page) */
  onDelete?: (n: Notification) => void;
  /** swipe state, so only one row is open at a time */
  swiped?: boolean;
  onSwipedChange?: (open: boolean) => void;
  compact?: boolean;
}

const Thumb: React.FC<{ n: Notification; compact: boolean }> = ({ n, compact }) => {
  const [failed, setFailed] = useState(false);
  const size = compact ? 'w-11 h-14' : 'w-12 h-16 sm:w-14 sm:h-[4.5rem]';
  if (n.type === 'achievement') {
    return (
      <span className={`${compact ? 'w-11 h-11' : 'w-12 h-12 sm:w-14 sm:h-14'} shrink-0 rounded-full bg-gold-tint text-gold-ink border border-gold flex items-center justify-center glow-gold`} aria-hidden="true">
        <Award className="w-6 h-6" />
      </span>
    );
  }
  return (
    <span className={`${size} shrink-0 rounded-t-full rounded-b-lg overflow-hidden bg-surface border border-border flex items-center justify-center`} aria-hidden="true">
      {n.comic_cover_url && !failed ? (
        <img src={n.comic_cover_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg">🌿</span>
      )}
    </span>
  );
};

const TYPE_META = {
  new_chapter: { label: 'Chương mới', icon: BookOpen, cls: 'text-primary-ink' },
  broken_link: { label: 'Link hỏng', icon: Link2Off, cls: 'text-danger-ink' },
  achievement: { label: 'Thành tựu', icon: Award, cls: 'text-gold-ink' },
} as const;

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification: n,
  onOpen,
  onFixSource,
  onDelete,
  swiped = false,
  onSwipedChange,
  compact = false,
}) => {
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; id: number; horizontal: boolean | null } | null>(null);
  const suppressClickUntil = useRef(0); // the click that ends a drag is ignored
  const meta = TYPE_META[n.type];
  const TypeIcon = meta.icon;
  const title = n.comic_title || 'Huy Hiệu Nhà Kính';
  const offset = drag ?? (swiped ? -REVEAL : 0);

  // Swipe left (touch/pen only) to reveal "Xóa"
  const onPointerDown = (e: React.PointerEvent) => {
    if (!onDelete || e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.horizontal = Math.abs(dx) > Math.abs(dy);
      if (s.horizontal) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!s.horizontal) return;
    const base = swiped ? -REVEAL : 0;
    setDrag(Math.max(-REVEAL - 24, Math.min(0, base + dx)));
  };
  const endDrag = () => {
    const s = start.current;
    start.current = null;
    if (!s?.horizontal || drag === null) {
      setDrag(null);
      return;
    }
    suppressClickUntil.current = performance.now() + 350;
    onSwipedChange?.(drag < -REVEAL / 2);
    setDrag(null);
  };

  const open = () => {
    if (performance.now() < suppressClickUntil.current) return;
    if (swiped) {
      onSwipedChange?.(false);
      return;
    }
    onOpen(n);
  };

  return (
    <li className="relative rounded-2xl overflow-hidden">
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(n)}
          tabIndex={swiped ? 0 : -1}
          aria-hidden={!swiped}
          className="md:hidden absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-danger text-on-danger text-xs font-bold cursor-pointer"
          style={{ width: REVEAL }}
        >
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          Xóa
        </button>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined, touchAction: onDelete ? 'pan-y' : undefined }}
        className={`relative flex items-start gap-2 rounded-2xl border ${drag === null ? 'transition-transform duration-300' : ''} ${
          n.is_read ? 'bg-surface-raised border-border/60' : 'bg-primary-tint border-primary-soft/40'
        } ${compact ? 'p-2.5' : 'p-3 sm:p-3.5'}`}
      >
        {!n.is_read && (
          <span
            className={`absolute top-3 left-1.5 w-2 h-2 rounded-full ${n.type === 'broken_link' ? 'bg-danger' : 'bg-accent glow-accent'}`}
            aria-hidden="true"
          />
        )}
        <div className="flex-1 min-w-0">
          <button type="button" onClick={open} className="w-full flex items-start gap-3 pl-2 text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Thumb n={n} compact={compact} />
            <span className="flex-1 min-w-0">
              <span className="flex items-baseline justify-between gap-2">
                <span className={`font-serif font-semibold text-text truncate ${compact ? 'text-sm' : 'text-[15px] sm:text-base'}`}>{title}</span>
                <span className="shrink-0 text-[11px] text-text-muted tabular-nums">{timeAgo(n.created_at)}</span>
              </span>
              <span className={`mt-0.5 block text-text-muted line-clamp-2 leading-snug ${compact ? 'text-xs' : 'text-[13px]'}`}>{n.message}</span>
              <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${meta.cls}`}>
                <TypeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {meta.label}
                {!n.is_read && <span className="sr-only">, chưa đọc</span>}
              </span>
            </span>
          </button>
          {n.type === 'broken_link' && n.comic_id && (
            <div className="flex justify-end mt-1">
              <Link
                to={`/comics/${n.comic_id}#sources`}
                onClick={() => onFixSource?.(n)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger-tint text-danger-ink text-[11px] font-bold hover:underline"
              >
                <Wrench className="w-3 h-3" aria-hidden="true" />
                Sửa nguồn
              </Link>
            </div>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(n)}
            aria-label={`Xóa thông báo ${title}`}
            className="hidden md:flex shrink-0 w-8 h-8 rounded-full items-center justify-center text-text-muted hover:text-danger-ink hover:bg-danger-tint transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
};
