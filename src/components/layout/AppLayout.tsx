import React, { Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { FairyEffects } from '../effects/FairyEffects';

const PageLoading: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24" role="status">
    <span className="text-2xl animate-bounce" aria-hidden="true">🌸</span>
    <span className="font-serif text-sm text-text-muted mt-2">Đang mở trang...</span>
  </div>
);

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans selection:bg-primary-tint selection:text-primary">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header onOpenAddModal={() => navigate('/add')} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader
          title={title || 'Tủ Truyện Nhỏ'}
          subtitle={subtitle || 'Tủ Sách'}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </main>

      {/* Desktop Footer (as seen in Image 1.jpeg) */}
      <footer className="hidden md:block w-full border-t border-border/60 bg-surface/60 py-6 px-6 lg:px-8 text-xs text-text-muted mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-text">Tủ Truyện Nhỏ ✿</span>
            <span>—</span>
            <span className="italic">Nơi cất giữ ký ức hoa cỏ và từng trang sách thần tiên</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/search" className="hover:text-text transition-colors">Tìm kiếm</Link>
            <span>·</span>
            <Link to="/stats" className="hover:text-text transition-colors">Thống kê</Link>
            <span>·</span>
            <Link to="/account" className="hover:text-text transition-colors">Cài Đặt</Link>
          </div>

          <div className="text-text-muted">
            © {new Date().getFullYear()} Tủ Truyện Nhỏ. Chúc công chúa đọc sách an yên. ✨
          </div>
        </div>
      </footer>

      {/* Ambient fairies & sparkles (click-through layer) */}
      <FairyEffects />

      {/* Mobile Bottom Nav */}
      <MobileBottomNav onOpenAddModal={() => navigate('/add')} />
    </div>
  );
};
