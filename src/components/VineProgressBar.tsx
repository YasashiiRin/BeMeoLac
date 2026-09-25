import React from 'react';

interface VineProgressBarProps {
  current: number;
  total: number;
  variant?: 'leaf' | 'fairy' | 'honey';
  height?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const VineProgressBar: React.FC<VineProgressBarProps> = ({
  current,
  total,
  variant = 'leaf',
  height = 'sm',
  showText = false,
  className = '',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const fillGradients = {
    leaf: 'bg-gradient-to-r from-primary-soft to-primary',
    fairy: 'bg-fairy-gradient',
    honey: 'bg-gradient-to-r from-gold to-primary-soft',
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs text-text-muted mb-1">
          <span className="font-medium">
            Chương {current}/{total}
          </span>
          <span className="font-semibold text-text tabular-nums">{percentage}%</span>
        </div>
      )}
      <div
        className={`w-full bg-primary-tint rounded-full overflow-hidden p-0.5 border border-border ${heightClasses[height]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out relative ${fillGradients[variant]}`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && percentage < 98 && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-xs opacity-75" />
          )}
        </div>
      </div>
    </div>
  );
};
