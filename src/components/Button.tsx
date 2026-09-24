import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'honey' | 'enchanted' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium font-sans rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FAF6B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
    md: 'px-4 py-2 text-sm gap-2 h-10',
    lg: 'px-6 py-3 text-base gap-2.5 h-12',
  };

  const variantStyles = {
    // Embossed book seal: Blush rose, warm cocoa text, 1.5px walnut border
    primary:
      'bg-[#F2A7B5] text-[#5E4636] border-1.5 border-[#A67B5B] shadow-sm hover:bg-[#F4C2C2] hover:-translate-y-0.5 shadow-botanical-sm',
    // Sage green fill, white or cocoa text, 1.5px border in living leaf
    secondary:
      'bg-[#A8C49A] text-[#29170A] border-1.5 border-[#7FAF6B] hover:bg-[#B7D2A9] hover:-translate-y-0.5 shadow-botanical-sm',
    // Warm ivory transparent fill, cocoa text, bordered with dashed 1.5px light oak
    text:
      'bg-transparent text-[#5E4636] border-1.5 border-dashed border-[#D9B99B] hover:bg-[#F6EBDD] hover:border-[#A67B5B]',
    // Honey gold button (like "+ Thêm truyện ✿" and "Nhật ký đọc ✨" in designs)
    honey:
      'bg-[#F3D38A] text-[#5E4636] border-1.5 border-[#A67B5B] shadow-sm hover:bg-[#FDE8B5] hover:-translate-y-0.5 shadow-botanical-sm font-semibold',
    // Fairy magic gradient with soft glow
    enchanted:
      'bg-fairy-gradient text-[#3A2B20] border-1.5 border-[#F3D38A] hover:opacity-95 hover:shadow-fairy-glow hover:-translate-y-0.5 font-semibold',
    // Delicate outline
    outline:
      'bg-[#FFF8F5] text-[#5E4636] border-1.5 border-[#A67B5B]/60 hover:border-[#A67B5B] hover:bg-[#F6EBDD] shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#5E4636] border-t-transparent rounded-full animate-spin" />
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
