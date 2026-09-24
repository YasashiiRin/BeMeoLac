import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29170A]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl shadow-botanical-lg overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Greenhouse Arch Top Bar */}
        <div className="px-6 py-4 bg-[#F6EBDD] border-b-1.5 border-[#D9B99B] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg md:text-xl font-semibold text-[#5E4636]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#806350] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#A67B5B] hover:text-[#5E4636] hover:bg-[#EFE1CF] rounded-full transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto botanical-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
