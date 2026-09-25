import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../features/notifications/useNotifications';
import { BellBadge, bellLabel } from '../../features/notifications/NotificationsDropdown';
import { ThemeToggle } from '../ThemeToggle';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'Tủ Truyện Nhỏ',
  subtitle = 'Tủ Sách',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unreadCount = useUnreadCount();

  return (
    <div className="md:hidden sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between">
      {/* Left Brand */}
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-primary-soft p-0.5 shadow-botanical-sm">
          <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center text-primary">
            <Flower2 className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-serif text-base font-bold text-text leading-tight">
              {title}
            </span>
            <span className="text-xs text-accent">✿</span>
          </div>
          <p className="text-[10px] text-text-muted font-medium leading-none">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Theme, Notifications & Profile */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle className="border shadow-none" />

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-text-muted hover:text-text bg-surface rounded-full border border-border transition-colors cursor-pointer"
          aria-label={bellLabel(unreadCount)}
        >
          <Bell className="w-4 h-4" />
          <BellBadge count={unreadCount} />
        </button>

        <div
          onClick={() => navigate('/account')}
          className="w-8 h-8 rounded-full overflow-hidden border border-border p-0.5 bg-background cursor-pointer"
        >
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="Tài khoản"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

