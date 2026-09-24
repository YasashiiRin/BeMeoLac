import React, { useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  className?: string;
  showFilterButton?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onFilterClick,
  placeholder = 'Tìm truyện, tác giả, thẻ hoa...',
  className = '',
  showFilterButton = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K keyboard shortcut focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 text-[#A67B5B] pointer-events-none">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2 text-sm bg-[#F6EBDD] text-[#5E4636] placeholder-[#9E8574] rounded-full border-1.5 border-[#D9B99B] focus:border-[#7FAF6B] focus:bg-[#FFF8F5] focus:outline-none focus:ring-2 focus:ring-[#A8C49A]/30 transition-all duration-200 shadow-inner"
      />

      <div className="absolute right-2.5 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-[#A67B5B] hover:text-[#5E4636] rounded-full hover:bg-[#EFE1CF] transition-colors cursor-pointer"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-[#806350] bg-[#EFE1CF] border border-[#D9B99B] rounded-md pointer-events-none">
            ⌘K
          </span>
        )}

        {showFilterButton && onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className="p-1.5 text-[#806350] hover:text-[#5E4636] bg-[#EFE1CF] hover:bg-[#D9B99B] rounded-full transition-colors cursor-pointer md:hidden"
            aria-label="Bộ lọc"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
