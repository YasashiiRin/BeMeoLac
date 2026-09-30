import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { StarterOption } from '../../types';
import { orderMoods } from './genres';

interface MoodChipsProps {
  options: StarterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  label: string;
}

/** Selectable mood chips ("Chữa lành", "Bách hợp (GL)", …): the starter tastes. */
export const MoodChips: React.FC<MoodChipsProps> = ({ options, selected, onChange, disabled, label }) => {
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {orderMoods(options).map((mood) => {
        const on = selected.includes(mood.value);
        return (
          <button
            key={mood.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggle(mood.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
              on
                ? 'bg-primary-tint text-primary-ink border-primary shadow-botanical-sm'
                : 'bg-surface-raised text-text border-border hover:border-primary-soft hover:bg-surface'
            }`}
          >
            <span aria-hidden="true">{mood.icon}</span>
            <span>{mood.label}</span>
            {on && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
};
