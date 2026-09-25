import React from 'react';
import { Star, Heart } from 'lucide-react';

interface HeartRatingProps {
  rating: number; // 0 to 5
  mode?: 'star' | 'heart';
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md';
}

export const HeartRating: React.FC<HeartRatingProps> = ({
  rating,
  mode = 'star',
  interactive = false,
  onChange,
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 13 : 16;

  if (interactive) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className="text-gold hover:text-gold-ink p-0.5 transition-transform hover:scale-115 cursor-pointer"
            aria-label={`Đánh giá ${star} sao`}
          >
            {mode === 'heart' ? (
              <Heart
                size={iconSize}
                className={star <= rating ? 'fill-accent-soft text-accent-ink' : 'text-border-strong'}
              />
            ) : (
              <Star
                size={iconSize}
                className={star <= rating ? 'fill-gold text-gold' : 'text-border-strong'}
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Display mode (e.g. "★ 4.9")
  return (
    <div className="inline-flex items-center gap-1 text-text font-medium">
      {mode === 'heart' ? (
        <Heart size={iconSize} className="fill-accent-soft text-accent-ink shrink-0" />
      ) : (
        <Star size={iconSize} className="fill-gold text-gold shrink-0" />
      )}
      <span className="text-xs font-semibold tabular-nums text-text">
        {rating.toFixed(1)}
      </span>

    </div>
  );
};
