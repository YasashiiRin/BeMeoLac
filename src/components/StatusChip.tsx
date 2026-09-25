import React from 'react';
import { ComicStatus } from '../types';

interface StatusChipProps {
  status: ComicStatus | 'all';
  label?: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  count,
  isActive = false,
  onClick,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'all':
        return {
          defaultLabel: 'Tất cả',
          icon: '✿',
          activeBg: 'bg-accent-soft text-text border-border-strong',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
      case 'reading':
        return {
          defaultLabel: 'Đang đọc',
          icon: '📖',
          activeBg: 'bg-leaf-tint text-primary-ink border-leaf',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
      case 'completed':
        return {
          defaultLabel: 'Đã đọc xong',
          icon: '🌿',
          activeBg: 'bg-primary-tint text-primary-ink border-leaf',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
      case 'plan_to_read':
        return {
          defaultLabel: 'Muốn đọc',
          icon: '🔖',
          activeBg: 'bg-gold-tint text-gold-ink border-gold',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
      case 'on_hold':
        return {
          defaultLabel: 'Tạm dừng',
          icon: '⏸',
          activeBg: 'bg-surface-sunken text-text border-border-strong',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
      case 'dropped':
        return {
          defaultLabel: 'Bỏ dở',
          icon: '⛔',
          activeBg: 'bg-danger-tint text-danger-ink border-danger/50',
          inactiveBg: 'bg-surface-raised text-text border-border hover:bg-surface',
        };
    }
  };

  const config = getStatusConfig();
  const displayLabel = label || config.defaultLabel;
  const isClickable = !!onClick;

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-3.5 py-1.5 text-xs md:text-sm gap-2';

  const content = (
    <>
      <span className="shrink-0 text-xs">{config.icon}</span>
      <span className="font-medium whitespace-nowrap">{displayLabel}</span>
      {count !== undefined && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums ml-0.5 ${
            isActive
              ? 'bg-surface-raised/70 text-text'
              : 'bg-surface text-text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center rounded-full border-1.5 transition-all duration-200 cursor-pointer shadow-botanical-sm ${sizeClasses} ${
          isActive ? config.activeBg : config.inactiveBg
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border-1.5 shadow-botanical-sm ${sizeClasses} ${
        isActive ? config.activeBg : config.inactiveBg
      }`}
    >
      {content}
    </span>
  );
};
