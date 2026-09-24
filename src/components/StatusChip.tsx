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
          activeBg: 'bg-[#F2A7B5] text-[#5E4636] border-[#A67B5B]',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
        };
      case 'reading':
        return {
          defaultLabel: 'Đang đọc',
          icon: '📖',
          activeBg: 'bg-[#CFE8D5] text-[#3A5230] border-[#7FAF6B]',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
        };
      case 'completed':
        return {
          defaultLabel: 'Đã đọc xong',
          icon: '🌿',
          activeBg: 'bg-[#A8C49A] text-[#1E3314] border-[#7FAF6B]',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
        };
      case 'plan_to_read':
        return {
          defaultLabel: 'Muốn đọc',
          icon: '🔖',
          activeBg: 'bg-[#FDE8B5] text-[#5E490C] border-[#D7B973]',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
        };
      case 'on_hold':
        return {
          defaultLabel: 'Tạm dừng',
          icon: '⏸',
          activeBg: 'bg-[#ECDBCB] text-[#5E4636] border-[#A67B5B]',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
        };
      case 'dropped':
        return {
          defaultLabel: 'Bỏ dở',
          icon: '⛔',
          activeBg: 'bg-[#FFDAD6] text-[#93000A] border-[#BA1A1A]/50',
          inactiveBg: 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]',
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
              ? 'bg-white/70 text-[#5E4636]'
              : 'bg-[#F6EBDD] text-[#806350]'
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
