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
      <div className="absolute left-3.5 text-text-muted pointer-events-none">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2 text-sm bg-surface text-text placeholder-text-muted rounded-full border-1.5 border-border focus:border-leaf focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary-soft/30 transition-all duration-200 shadow-inner"
      />

      <div className="absolute right-2.5 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-text-muted hover:text-text rounded-full hover:bg-surface-sunken transition-colors cursor-pointer"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-text-muted bg-surface-sunken border border-border rounded-md pointer-events-none">
            ⌘K
          </span>
        )}

        {showFilterButton && onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className="p-1.5 text-text-muted hover:text-text bg-surface-sunken hover:bg-border rounded-full transition-colors cursor-pointer md:hidden"
            aria-label="Bộ lọc"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
