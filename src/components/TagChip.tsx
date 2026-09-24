import React from 'react';

interface TagChipProps {
  label: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
}

export const TagChip: React.FC<TagChipProps> = ({
  label,
  icon = '🌱',
  isActive = false,
  onClick,
  count,
}) => {
  const isClickable = !!onClick;
  const baseClasses =
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border-1.5 whitespace-nowrap shadow-botanical-sm';

  const activeClasses = 'bg-[#CFE8D5] text-[#3A5230] border-[#7FAF6B] font-semibold';
  const inactiveClasses =
    'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD] hover:border-[#A67B5B]';

  const content = (
    <>
      {icon && <span className="text-xs">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-[11px] px-1.5 py-0.2 bg-[#F6EBDD] text-[#806350] rounded-full tabular-nums">
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
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return <span className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>{content}</span>;
};
