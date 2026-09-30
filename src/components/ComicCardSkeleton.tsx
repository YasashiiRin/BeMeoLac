import React from 'react';

/** A loading placeholder with ComicCard's shape. */
export const ComicCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`bg-surface/60 arch-card p-3 border border-border animate-pulse flex flex-col gap-3 ${className}`}>
    <div className="w-full aspect-[3/4] arch-card-sm bg-surface-sunken" />
    <div className="h-4 bg-surface-sunken rounded-md w-3/4" />
    <div className="h-3 bg-surface-sunken rounded-md w-1/2" />
    <div className="h-2 bg-surface-sunken rounded-full w-full mt-auto" />
  </div>
);
