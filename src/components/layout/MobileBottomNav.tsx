import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Plus, BarChart3, User, Sparkles } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenAddModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenAddModal }) => {
  const navigate = useNavigate();

  const handleCenterAdd = () => {
    if (onOpenAddModal) {
      onOpenAddModal();
    } else {
      navigate('/add');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t-1.5 border-border px-3 py-1.5 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around relative">
        {/* Tủ sách */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-text-muted font-medium'
            }`
          }
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Tủ sách</span>
        </NavLink>

        {/* Tìm kiếm */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-text-muted font-medium'
            }`
          }
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Tìm kiếm</span>
        </NavLink>

        {/* Center elevated "+" button */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={handleCenterAdd}
            className="w-12 h-12 rounded-full bg-fairy-gradient border-2 border-primary shadow-fairy-glow flex items-center justify-center text-primary active:scale-95 transition-transform cursor-pointer"
            aria-label="Thêm truyện mới"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Thống kê */}
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-text-muted font-medium'
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Thống kê</span>
        </NavLink>

        {/* Tài khoản */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-text-muted font-medium'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Tài khoản</span>
        </NavLink>
      </div>
    </nav>
  );
};
