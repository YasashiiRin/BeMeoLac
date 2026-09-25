import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { NotificationFilter } from '../../types';
import { Notification } from '../../types';
import { FilterChips } from './FilterChips';
import { NotificationRow } from './NotificationRow';
import { notificationTarget } from './openTarget';
import { useNotifications, useUnreadCount } from './useNotifications';

export const BellBadge: React.FC<{ count: number }> = ({ count }) =>
  count > 0 ? (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-on-accent border border-accent rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs tabular-nums"
    >
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

export const bellLabel = (count: number) => (count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo');

/** Desktop bell + dropdown panel. Closes on outside click, Esc, or when a row is opened. */
export const NotificationsDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const count = useUnreadCount();
  const { items, unread, markRead, markAllRead } = useNotifications(filter, open);
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        bell.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openRow = (n: Notification) => {
    setOpen(false);
    if (!n.is_read) markRead(n.id);
    navigate(notificationTarget(n));
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={bell}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={bellLabel(count)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        className={`relative p-2 text-text-muted hover:text-text border-1.5 rounded-full transition-all cursor-pointer shadow-botanical-sm ${
          open ? 'bg-surface border-primary text-text' : 'bg-background hover:bg-surface border-border'
        }`}
      >
        <Bell className="w-4 h-4" />
        <BellBadge count={count} />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Thông báo"
          className="absolute right-0 top-full mt-3 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-t-[2rem] rounded-b-3xl bg-surface-raised border-1.5 border-border shadow-botanical-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          <div className="h-1.5 bg-fairy-gradient" aria-hidden="true" />
          <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold text-text flex items-center gap-2">
                Thông báo
                {count > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-on-accent text-[11px] font-bold flex items-center justify-center tabular-nums">
                    {count}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={markAllRead}
                disabled={count === 0}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-ink hover:underline underline-offset-4 decoration-dotted cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-default"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Đánh dấu đã đọc tất cả
              </button>
            </div>
            <FilterChips value={filter} onChange={setFilter} unread={unread} />
          </div>

          <div className="max-h-[390px] overflow-y-auto botanical-scrollbar px-3 pb-3">
            {items === null ? (
              <div className="flex flex-col gap-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState icon="🕊️" title="Vườn lặng gió" description="Chưa có thông báo nào, khu vườn đang yên bình." className="p-6 md:p-6" />
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Danh sách thông báo">
                {items.map((n) => (
                  <NotificationRow key={n.id} notification={n} onOpen={openRow} onFixSource={(x) => { setOpen(false); if (!x.is_read) markRead(x.id); }} compact />
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-surface border-t border-border text-sm font-semibold text-text hover:text-primary-ink transition-colors"
          >
            Xem tất cả thông báo
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};
