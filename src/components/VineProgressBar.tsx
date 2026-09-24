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
    leaf: 'bg-gradient-to-r from-[#A8C49A] to-[#7FAF6B]',
    fairy: 'bg-gradient-to-r from-[#F2A7B5] via-[#D9C8F0] to-[#7FAF6B]',
    honey: 'bg-gradient-to-r from-[#F3D38A] to-[#F6B98B]',
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs text-[#806350] mb-1">
          <span className="font-medium">
            Chương {current}/{total}
          </span>
          <span className="font-semibold text-[#5E4636] tabular-nums">{percentage}%</span>
        </div>
      )}
      <div
        className={`w-full bg-[#EFE1CF] rounded-full overflow-hidden p-0.5 border border-[#D9B99B]/50 ${heightClasses[height]}`}
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
