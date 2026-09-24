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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF8F5]/95 backdrop-blur-md border-t-1.5 border-[#D9B99B] px-3 py-1.5 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around relative">
        {/* Tủ sách */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[#3A5230] font-bold' : 'text-[#806350] font-medium'
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
              isActive ? 'text-[#3A5230] font-bold' : 'text-[#806350] font-medium'
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
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F3D38A] to-[#F2A7B5] border-2 border-[#A67B5B] shadow-fairy-glow flex items-center justify-center text-[#5E4636] active:scale-95 transition-transform cursor-pointer"
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
              isActive ? 'text-[#3A5230] font-bold' : 'text-[#806350] font-medium'
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
              isActive ? 'text-[#3A5230] font-bold' : 'text-[#806350] font-medium'
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
