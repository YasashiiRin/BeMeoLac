import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionDef } from './sections';

/** Heading of a settings section. On phones it gets a back arrow to the list. */
export const SectionHeader: React.FC<{ section: SectionDef; aside?: React.ReactNode }> = ({ section, aside }) => {
  const Icon = section.icon;
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          to="/account"
          aria-label="Quay lại danh mục cài đặt"
          className="md:hidden w-9 h-9 shrink-0 rounded-full bg-surface border border-border text-text flex items-center justify-center shadow-botanical-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className={`hidden md:flex w-9 h-9 shrink-0 rounded-full items-center justify-center ${section.tint}`} aria-hidden="true">
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <h2 className="font-serif text-lg sm:text-xl font-semibold text-text leading-tight">{section.title}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {aside}
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-gold-tint text-gold-ink text-[11px] font-semibold whitespace-nowrap">
          {section.chip}
        </span>
      </div>
    </div>
  );
};

/** A soft inner panel inside a section card. */
export const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-2xl bg-surface border border-border/60 p-4 ${className}`}>{children}</div>
);

interface SettingSwitchProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

/** A labelled on/off row; extra controls (e.g. a time picker) go in children. */
export const SettingSwitch: React.FC<SettingSwitchProps> = ({ label, description, icon, checked, onChange, disabled, children }) => {
  const id = React.useId();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <span id={`${id}-l`} className="text-sm font-semibold text-text flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className="block text-xs text-text-muted mt-0.5">
            {description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
        {children}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-l`}
          aria-describedby={description ? `${id}-d` : undefined}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            checked ? 'bg-primary' : 'bg-surface-sunken border border-border-strong'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-raised shadow-botanical-sm transition-[left] ${checked ? 'left-[22px]' : 'left-0.5'}`}
          />
        </button>
      </div>
    </div>
  );
};

export const inputClass =
  'w-full h-11 px-3.5 rounded-xl bg-surface-raised border-1.5 border-border text-sm text-text placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint transition-colors';
