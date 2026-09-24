import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌸',
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-[#F6EBDD]/60 border-1.5 border-dashed border-[#D9B99B] rounded-3xl ${className}`}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-[#FFF8F5] border-1.5 border-[#A67B5B]/40 flex items-center justify-center text-3xl shadow-botanical-sm animate-bounce">
        {icon}
      </div>
      <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#5E4636] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#806350] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
