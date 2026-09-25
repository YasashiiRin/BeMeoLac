import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import { Notification } from '../types';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { NotificationFilter } from '../types';
import { FilterChips } from '../features/notifications/FilterChips';
import { NotificationRow } from '../features/notifications/NotificationRow';
import { notificationTarget } from '../features/notifications/openTarget';
import { useNotifications } from '../features/notifications/useNotifications';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const { items, unread, error, reload, markRead, markAllRead, remove } = useNotifications(filter);

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  const openRow = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    navigate(notificationTarget(n));
  };

  const readAll = async () => {
    await markAllRead();
    showToast('Đã đánh dấu đọc hết thông báo 🌸', 'success');
  };

  const deleteRow = async (n: Notification) => {
    setSwipedId(null);
    await remove(n.id);
    showToast('Đã xóa thông báo 🍃', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={goBack}
            aria-label="Quay lại"
            className="w-10 h-10 shrink-0 rounded-full bg-surface border border-border text-text flex items-center justify-center hover:border-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif italic text-2xl sm:text-3xl font-semibold text-text truncate">
            Thông báo <span className="not-italic text-lg text-accent" aria-hidden="true">✿</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={readAll}
          disabled={unread.all === 0}
          className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-semibold text-primary-ink hover:bg-primary-tint transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <CheckCheck className="w-4 h-4" aria-hidden="true" />
          Đọc hết
        </button>
      </div>

      <FilterChips value={filter} onChange={setFilter} unread={unread} />

      {error && items === null ? (
        <EmptyState icon="🍂" title="Chưa tải được thông báo" description="Nàng thử lại sau một chút nhé." actionText="Thử lại" onAction={reload} />
      ) : items === null ? (
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="🕊️" title="Yên bình giữa rừng hoa" description="Chưa có thông báo nào, khu vườn đang yên bình." />
      ) : (
        <>
          <ul className="flex flex-col gap-2.5" aria-label="Danh sách thông báo">
            {items.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onOpen={openRow}
                onFixSource={(x) => !x.is_read && markRead(x.id)}
                onDelete={deleteRow}
                swiped={swipedId === n.id}
                onSwipedChange={(o) => setSwipedId(o ? n.id : null)}
              />
            ))}
          </ul>
          <p className="md:hidden text-center text-[11px] text-text-muted">Vuốt sang trái trên một thông báo để xóa 🍃</p>
        </>
      )}
    </div>
  );
};
