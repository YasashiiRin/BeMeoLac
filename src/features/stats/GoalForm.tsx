import React, { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { ReadingGoal } from '../../types';

interface GoalFormProps {
  goal: ReadingGoal;
  saving: boolean;
  onSave: (target: number) => void;
  onCancel: () => void;
}

const MIN = 1;
const MAX = 500;
const PRESETS = [12, 24, 50, 100];

export const GoalForm: React.FC<GoalFormProps> = ({ goal, saving, onSave, onCancel }) => {
  const [value, setValue] = useState(String(goal.target));
  useEffect(() => setValue(String(goal.target)), [goal.target]);

  const n = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= MIN && n <= MAX;
  const error = !valid ? `Nàng nhập một số từ ${MIN} đến ${MAX} nhé` : null;
  const step = (d: number) => setValue(String(Math.min(MAX, Math.max(MIN, (valid ? n : goal.target) + d))));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(n);
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="goal-target" className="text-sm font-semibold text-text">
          Năm {goal.year}, nàng muốn đọc xong bao nhiêu bộ truyện?
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Bớt một bộ"
            className="w-11 h-11 shrink-0 rounded-xl border-1.5 border-border bg-surface text-text hover:border-primary flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            id="goal-target"
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!valid}
            aria-describedby="goal-help"
            className={`w-full h-11 rounded-xl border-1.5 bg-surface px-3 text-center font-serif text-xl font-bold text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint ${
              valid ? 'border-border' : 'border-danger'
            }`}
          />
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Thêm một bộ"
            className="w-11 h-11 shrink-0 rounded-xl border-1.5 border-border bg-surface text-text hover:border-primary flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p id="goal-help" className={`text-xs ${error ? 'text-danger-ink' : 'text-text-muted'}`} role={error ? 'alert' : undefined}>
          {error ?? `Nàng đã đọc xong ${goal.completed} bộ trong năm nay 🌿`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Gợi ý mục tiêu">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setValue(String(p))}
            aria-pressed={n === p}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
              n === p ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-text border-border hover:border-primary'
            }`}
          >
            {p} bộ
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2.5 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Để sau
        </Button>
        <Button type="submit" variant="primary" disabled={!valid || saving} isLoading={saving}>
          Lưu mục tiêu 🌸
        </Button>
      </div>
    </form>
  );
};
