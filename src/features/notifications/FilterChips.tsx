import React from 'react';
import { NotificationFilter } from '../../types';
import { UnreadByFilter } from './useNotifications';

const CHIPS: { value: NotificationFilter; label: string; dot?: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new_chapter', label: 'Chương mới', dot: 'bg-primary' },
  { value: 'broken_link', label: 'Link hỏng', dot: 'bg-danger' },
];

export const FilterChips: React.FC<{
  value: NotificationFilter;
  onChange: (f: NotificationFilter) => void;
  unread: UnreadByFilter;
}> = ({ value, onChange, unread }) => (
  <div role="group" aria-label="Lọc thông báo" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
    {CHIPS.map((c) => {
      const on = c.value === value;
      return (
        <button
          key={c.value}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(c.value)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            on ? 'bg-primary text-on-primary border-primary glow-primary' : 'bg-surface text-text border-border hover:border-primary'
          }`}
        >
          {on ? <span aria-hidden="true">✿</span> : c.dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />}
          {c.label}
          {unread[c.value] > 0 && (
            <span className="tabular-nums">
              ({unread[c.value]}
              <span className="sr-only"> chưa đọc</span>)
            </span>
          )}
        </button>
      );
    })}
  </div>
);
