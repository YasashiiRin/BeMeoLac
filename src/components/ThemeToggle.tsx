import React, { useId } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Day/night switch. The sun shrinks its rays and a shadow disc slides in
 * to carve a crescent moon (and back).
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === 'night';
  const maskId = `moon-mask-${useId().replace(/:/g, '')}`;
  const ease = 'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isNight}
      aria-label={isNight ? 'Chuyển sang rừng tiên ban ngày' : 'Chuyển sang khu vườn tiên đêm'}
      title={isNight ? 'Rừng tiên ban ngày' : 'Khu vườn tiên đêm'}
      className={`relative p-2 rounded-full border-1.5 border-border bg-background hover:bg-surface transition-all cursor-pointer shadow-botanical-sm ${
        isNight ? 'text-gold glow-gold' : 'text-gold-ink'
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 overflow-visible" aria-hidden="true">
        <mask id={maskId}>
          <rect x="-4" y="-4" width="32" height="32" fill="white" />
          {/* Shadow disc: parked off-canvas by day, slides over the sun at night */}
          <circle
            cx="17"
            cy="7"
            r="7"
            fill="black"
            className={ease}
            style={{ transform: isNight ? 'translate(0, 0)' : 'translate(10px, -10px)' }}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="currentColor"
          mask={`url(#${maskId})`}
          className={ease}
          style={{
            transformOrigin: '12px 12px',
            transform: isNight ? 'scale(1) rotate(-20deg)' : 'scale(0.52)',
          }}
        />
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={ease}
          style={{
            transformOrigin: '12px 12px',
            transform: isNight ? 'rotate(90deg) scale(0.4)' : 'rotate(0deg) scale(1)',
            opacity: isNight ? 0 : 1,
          }}
        >
          {RAYS.map((deg) => (
            <line key={deg} x1="12" y1="1.8" x2="12" y2="3.8" transform={`rotate(${deg} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  );
};
