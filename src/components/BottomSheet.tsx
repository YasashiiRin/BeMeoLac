import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#29170A]/50 backdrop-blur-xs animate-in fade-in duration-200 md:hidden">
      <div
        className="w-full bg-[#FFF8F5] border-t-2 border-[#A67B5B] rounded-t-3xl shadow-botanical-lg max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle bar */}
        <div className="w-full pt-3 pb-1 flex justify-center cursor-grab">
          <div className="w-12 h-1.5 bg-[#D9B99B] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-[#D9B99B]/60 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#5E4636]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#806350]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#A67B5B] hover:text-[#5E4636] hover:bg-[#F6EBDD] rounded-full transition-colors cursor-pointer"
            aria-label="Đóng bảng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto botanical-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
