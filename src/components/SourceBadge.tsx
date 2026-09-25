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
      className={`inline-flex items-center font-medium rounded-full bg-scrim/70 text-on-scrim backdrop-blur-md border border-on-scrim/25 shadow-xs whitespace-nowrap tracking-wide select-none ${sizeClasses} ${className}`}
    >
      {name}
    </span>
  );
};
