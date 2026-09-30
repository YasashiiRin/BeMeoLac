import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import type { StarterOption } from '../../types';
import { Button } from '../../components/Button';
import { MoodChips } from './MoodChips';

interface StarterTastesCardProps {
  options: StarterOption[];
  initial: string[];
  /** saves the moods (PUT /api/users/me/starter-tastes) and reloads the feed */
  onSave: (tastes: string[]) => Promise<void>;
  onSkip: () => void;
}

/** "Nàng thích đọc kiểu truyện nào?": shown while the library is small and she hasn't picked moods yet. */
export const StarterTastesCard: React.FC<StarterTastesCardProps> = ({ options, initial, onSave, onSkip }) => {
  const [selected, setSelected] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="starter-tastes-heading"
      className="relative overflow-hidden rounded-3xl bg-surface-raised border-1.5 border-primary-soft p-4 sm:p-6 shadow-botanical"
    >
      <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-accent-tint/70 blur-2xl pointer-events-none" aria-hidden="true" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-full bg-leaf-tint text-leaf-ink flex items-center justify-center" aria-hidden="true">
            <Sprout className="w-5 h-5" />
          </span>
          <div>
            <h2 id="starter-tastes-heading" className="font-serif text-lg sm:text-xl font-bold text-text">
              Nàng thích đọc kiểu truyện nào?
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Chọn vài gu nàng thương, Thế giới sẽ gieo gợi ý hợp ý nàng mỗi ngày 🌸
            </p>
          </div>
        </div>

        <MoodChips options={options} selected={selected} onChange={setSelected} disabled={saving} label="Gu đọc của nàng" />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="text" size="md" onClick={onSkip} disabled={saving}>
            Để sau
          </Button>
          <Button type="button" variant="primary" size="md" onClick={save} isLoading={saving} disabled={!selected.length}>
            🌱 Gieo hạt gu đọc
          </Button>
        </div>
      </div>
    </section>
  );
};
