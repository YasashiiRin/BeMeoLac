import React from 'react';
import { X, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-[#7FAF6B] shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-[#F6B98B] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />;
      case 'info':
      default:
        return <Sparkles className="w-4 h-4 text-[#F2A7B5] shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-[#7FAF6B]/50';
      case 'warning':
        return 'border-[#F6B98B]/60';
      case 'error':
        return 'border-[#BA1A1A]/40';
      default:
        return 'border-[#D9B99B]';
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 bg-[#FFF8F5] ${getBorderColor()} border-1.5 rounded-xl shadow-botanical animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-center gap-2.5">
        {getIcon()}
        <p className="text-sm font-medium text-[#5E4636] leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-[#A67B5B] hover:text-[#5E4636] p-1 rounded-md transition-colors"
        aria-label="Đóng"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
