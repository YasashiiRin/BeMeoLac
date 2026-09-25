import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { comicsService } from '../../services/comicService';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'Tủ Truyện Nhỏ',
  subtitle = 'Tủ Sách',
  unreadCount,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [autoUnreadCount, setAutoUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (unreadCount === undefined) {
      comicsService
        .getSummary()
        .then((s) => setAutoUnreadCount(s.new_chapters))
        .catch(console.error);
    }
  }, [unreadCount]);

  const effectiveUnreadCount = unreadCount !== undefined ? unreadCount : autoUnreadCount;

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

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-text-muted hover:text-text bg-surface rounded-full border border-border transition-colors cursor-pointer"
          aria-label="Thông báo"
        >
          <Bell className="w-4 h-4" />
          {effectiveUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-white border border-accent rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
              {effectiveUnreadCount}
            </span>
          )}
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

