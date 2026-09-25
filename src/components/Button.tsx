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
    'inline-flex items-center justify-center font-medium font-sans rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
    md: 'px-4 py-2 text-sm gap-2 h-10',
    lg: 'px-6 py-3 text-base gap-2.5 h-12',
  };

  const variantStyles = {
    // Primary forest green button
    primary:
      'bg-primary text-on-primary border-1.5 border-primary glow-primary hover:bg-primary-deep hover:-translate-y-0.5 shadow-botanical-sm',
    // Soft primary tint button
    secondary:
      'bg-primary-tint text-primary border-1.5 border-primary-soft hover:bg-surface hover:-translate-y-0.5 shadow-botanical-sm',
    // Transparent bordered button
    text:
      'bg-transparent text-text border-1.5 border-dashed border-border hover:bg-surface hover:border-primary',
    // Gold button (e.g. "+ Thêm truyện ✿")
    honey:
      'bg-gold text-on-gold border-1.5 border-border shadow-sm hover:bg-gold/90 hover:-translate-y-0.5 shadow-botanical-sm font-semibold',
    // Fairy magic gradient with soft glow
    enchanted:
      'bg-fairy-gradient text-on-gradient border-1.5 border-accent-soft hover:opacity-95 hover:shadow-fairy-glow hover:-translate-y-0.5 font-semibold',
    // Delicate outline
    outline:
      'bg-surface text-text border-1.5 border-border hover:border-primary hover:bg-background shadow-sm',
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
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
