import React from 'react';
import { X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  type?: ToastType;
  action?: ToastAction;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', action, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-leaf-ink shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-accent-ink shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger shrink-0" />;
      case 'info':
      default:
        return <Sparkles className="w-4 h-4 text-accent-ink shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-leaf/50';
      case 'warning':
        return 'border-accent-soft/60';
      case 'error':
        return 'border-danger/40';
      default:
        return 'border-border';
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 bg-surface-raised ${getBorderColor()} border-1.5 rounded-xl shadow-botanical animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-center gap-2.5">
        {getIcon()}
        <p className="text-sm font-medium text-text leading-snug">{message}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-primary-ink bg-primary-tint hover:bg-primary-soft/40 transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="text-text-muted hover:text-text p-1 rounded-md transition-colors"
        aria-label="Đóng"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
