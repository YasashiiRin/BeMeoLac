import React from 'react';

interface SourceBadgeProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  name,
  className = '',
  size = 'sm',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-[#29170A]/70 text-[#FFF8F5] backdrop-blur-md border border-white/25 shadow-xs whitespace-nowrap tracking-wide select-none ${sizeClasses} ${className}`}
    >
      {name}
    </span>
  );
};
