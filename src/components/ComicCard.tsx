import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Comic } from '../types';
import { SourceBadge } from './SourceBadge';
import { HeartRating } from './HeartRating';
import { VineProgressBar } from './VineProgressBar';
import { Bookmark, BookOpen, RotateCcw } from 'lucide-react';

interface ComicCardProps {
  comic: Comic;
  onToggleFavorite?: (id: string) => void;
  onQuickRead?: (comic: Comic) => void;
  className?: string;
}

export const ComicCard: React.FC<ComicCardProps> = ({
  comic,
  onToggleFavorite,
  onQuickRead,
  className = '',
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Primary source or first source
  const primarySource =
    comic.sources.find((s) => s.id === comic.primary_source_id) ||
    comic.sources[0] || { site_name: 'Cuutruyen' };

  const isCompleted = comic.status === 'completed' || comic.current_chapter >= comic.total_chapters;
  const progressPercent =
    comic.total_chapters > 0
      ? Math.round((comic.current_chapter / comic.total_chapters) * 100)
      : 0;

  const handleCardClick = () => {
    navigate(`/comics/${comic.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(comic.id);
    }
  };

  const handleQuickReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickRead) {
      onQuickRead(comic);
    } else {
      navigate(`/comics/${comic.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-[#FFF8F5] border-1.5 border-[#A67B5B] arch-card shadow-botanical hover:shadow-botanical-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden p-2.5 sm:p-3 ${className}`}
    >
      {/* Arched Cloche Image Frame */}
      <div className="relative w-full aspect-[3/4] arch-card-sm overflow-hidden bg-[#F6EBDD] border border-[#D9B99B]/60 shadow-inner">
        {/* Fallback pattern / loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#F6EBDD] to-[#EFE1CF] text-[#A67B5B]">
            <span className="text-2xl animate-pulse">🌸</span>
            <span className="text-[11px] font-medium mt-1 text-[#806350]">Đang mở sách...</span>
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-[#F6EBDD] to-[#EFE1CF] text-[#806350] text-center">
            <span className="text-3xl mb-1">🌿</span>
            <span className="font-serif font-semibold text-xs text-[#5E4636] line-clamp-2">
              {comic.title}
            </span>
          </div>
        ) : (
          <img
            src={comic.cover_url}
            alt={comic.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Delicate Glass Inner Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges Row */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {/* Source Badge */}
          <SourceBadge name={primarySource.site_name} size="sm" />

          {/* Status Badge: NEW or COMPLETED */}
          {comic.has_new_chapter ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs animate-pulse">
              MỚI ✿
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-[#A8C49A] text-[#1E3314] border border-[#7FAF6B] shadow-xs">
              <span className="hidden sm:inline">HOÀN THÀNH</span>
              <span className="sm:hidden">XONG</span> 🌿
            </span>
          ) : null}
        </div>

        {/* Ribbon Bookmark / Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={comic.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 z-10 cursor-pointer ${
            comic.is_favorite
              ? 'bg-[#F2A7B5] text-[#5E4636] shadow-md scale-105'
              : 'bg-white/70 text-[#A67B5B] hover:bg-white hover:text-[#5E4636]'
          }`}
        >
          <Bookmark
            size={14}
            className={comic.is_favorite ? 'fill-[#5E4636]' : ''}
          />
        </button>
      </div>

      {/* Comic Details */}
      <div className="flex flex-col flex-1 pt-2.5 px-1 justify-between">
        <div>
          {/* Title */}
          <h3
            title={comic.title}
            className="font-serif font-semibold text-sm sm:text-base text-[#5E4636] group-hover:text-[#7A563C] transition-colors line-clamp-1 leading-snug"
          >
            {comic.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-[#806350] italic line-clamp-1 mt-0.5">
            tác giả {comic.author}
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-2 pt-2 border-t border-[#D9B99B]/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            {/* Rating */}
            <HeartRating rating={comic.rating} votes="890" size="sm" />

            {/* Chapter progress text */}
            <div className="text-[11px] sm:text-xs font-medium tabular-nums text-right">
              {isCompleted ? (
                <span className="text-[#3A5230] font-semibold">
                  {comic.total_chapters}/{comic.total_chapters} (100%)
                </span>
              ) : (
                <span className="text-[#806350]">
                  Ch. {comic.current_chapter}/{comic.total_chapters}
                </span>
              )}
            </div>
          </div>

          {/* Mini Vine Progress Bar */}
          <VineProgressBar
            current={comic.current_chapter}
            total={comic.total_chapters}
            variant={isCompleted ? 'leaf' : 'leaf'}
            height="sm"
          />

          {/* Mobile Quick Action Button (as seen in Mobile design Image 3.jpeg) */}
          <div className="mt-2 block sm:hidden">
            <button
              type="button"
              onClick={handleQuickReadClick}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-medium bg-[#F6EBDD] text-[#5E4636] border border-[#D9B99B] hover:bg-[#EFE1CF] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCompleted ? (
                <>
                  <RotateCcw size={12} className="text-[#7FAF6B]" />
                  <span>Đọc lại</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} className="text-[#A67B5B]" />
                  <span>Đọc tiếp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
