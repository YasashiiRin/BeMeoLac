import React, { useEffect, useState } from 'react';
import { Shelf } from '../../types';
import { ComicSummary, comicsService } from '../../services/comicService';
import { Plus, MoreHorizontal, Sparkles, Coffee } from 'lucide-react';
import { VineProgressBar } from '../VineProgressBar';

interface SidebarProps {
  shelves: Shelf[];
  activeShelfId: string;
  onSelectShelf: (shelfId: string) => void;
  onOpenCreateShelfModal: () => void;
  summary?: ComicSummary | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  shelves,
  activeShelfId,
  onSelectShelf,
  onOpenCreateShelfModal,
  summary,
}) => {
  const [dataSummary, setDataSummary] = useState<ComicSummary | null>(summary || null);

  useEffect(() => {
    if (summary !== undefined) {
      setDataSummary(summary);
    } else {
      comicsService.getSummary().then(setDataSummary).catch(console.error);
    }
  }, [summary]);

  const totalComics = dataSummary?.total || 1;
  const completedComics = dataSummary?.by_status.completed || 0;
  const completionPercentage = Math.round((completedComics / totalComics) * 100);

  return (
    <aside className="w-64 xl:w-72 shrink-0 flex flex-col gap-4">
      {/* Shelves Panel Card */}
      <div className="bg-surface border-1.5 border-border rounded-3xl p-4 shadow-botanical flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
          <div>
            <h2 className="font-serif text-lg font-bold text-text flex items-center gap-1.5">
              <span>Kệ Sách Của Tôi</span>
              <span className="text-xs text-accent">✿</span>
            </h2>
            <p className="text-[11px] text-text-muted italic">
              Tập hợp cổ tích thảo mộc
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-text-muted hover:text-text rounded-md hover:bg-background transition-colors cursor-pointer"
            aria-label="Tùy chọn kệ sách"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Shelves List */}
        <div className="flex flex-col gap-1.5">
          {shelves.map((shelf) => {
            const isActive = activeShelfId === shelf.id;
            return (
              <button
                key={shelf.id}
                type="button"
                onClick={() => onSelectShelf(shelf.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-fairy-gradient text-text border-1.5 border-accent-soft font-semibold shadow-botanical-sm'
                    : 'text-text hover:bg-background hover:text-text border-1.5 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-sm shrink-0">{shelf.icon}</span>
                  <span className="truncate">{shelf.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-white/80 text-text shadow-xs'
                      : 'bg-background text-text-muted'
                  }`}
                >
                  {shelf.comic_count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Create Shelf Button */}
        <div className="pt-3 mt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onOpenCreateShelfModal}
            className="w-full py-2 px-3 rounded-xl border-1.5 border-dashed border-border text-xs font-semibold text-text hover:bg-background flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Tạo kệ mới</span>
            <span className="text-xs">✿</span>
          </button>
        </div>
      </div>

      {/* Reading Goal / Afternoon Tea Challenge Widget */}
      <div className="bg-surface border-1.5 border-border rounded-3xl p-4 shadow-botanical flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary" />
            <h4 className="font-serif text-sm font-bold text-text">
              Trà chiều & Mục tiêu
            </h4>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">
            {completionPercentage}%
          </span>
        </div>

        <p className="text-xs text-text-muted">
          Đã đọc xong <strong className="text-text font-semibold">{completedComics}/{totalComics}</strong> bộ truyện
        </p>

        {/* Progress bar */}
        <VineProgressBar current={completedComics} total={totalComics} variant="fairy" height="md" />

        <div className="pt-2 border-t border-border/50 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted italic leading-tight">
            Có <span className="font-semibold text-primary">{dataSummary?.new_chapters ?? 0} chương mới</span> đơm hoa chờ bạn khám phá!
          </p>
        </div>
      </div>
    </aside>
  );
};

