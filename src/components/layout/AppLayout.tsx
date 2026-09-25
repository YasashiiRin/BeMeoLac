import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { ResponsiveDrawer } from '../ResponsiveDrawer';
import { FairyEffects } from '../effects/FairyEffects';
import { Button } from '../Button';
import { useToast } from '../../context/ToastContext';
import { comicsService, ComicSummary } from '../../services/comicService';
import { Plus, Sparkles } from 'lucide-react';

const PageLoading: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24" role="status">
    <span className="text-2xl animate-bounce" aria-hidden="true">🌸</span>
    <span className="font-serif text-sm text-text-muted mt-2">Đang mở trang...</span>
  </div>
);

interface AppLayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAuthor, setQuickAuthor] = useState('');
  const [quickSource, setQuickSource] = useState('Cuutruyen');
  const [summary, setSummary] = useState<ComicSummary | null>(null);

  useEffect(() => {
    comicsService.getSummary().then(setSummary).catch(console.error);
  }, []);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    showToast(`Đã thêm "${quickTitle}" vào tủ truyện nhỏ! 🌸`, 'success');
    setQuickTitle('');
    setQuickAuthor('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans selection:bg-primary-tint selection:text-primary">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          unreadCount={summary?.new_chapters}
          onOpenAddModal={() => navigate('/add')}
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader
          title={title || 'Tủ Truyện Nhỏ'}
          subtitle={subtitle || 'Tủ Sách'}
          unreadCount={summary?.new_chapters}
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
            <a href="/search" className="hover:text-text transition-colors">Khám Phá</a>
            <span>·</span>
            <a href="/stats" className="hover:text-text transition-colors">Nhật Ký Đọc</a>
            <span>·</span>
            <a href="/account" className="hover:text-text transition-colors">Cài Đặt</a>
          </div>

          <div className="text-text-muted">
            © 2024 Tủ Truyện Nhỏ. Chúc công chúa đọc sách an yên. ✨
          </div>
        </div>
      </footer>

      {/* Ambient fairies & sparkles (click-through layer) */}
      <FairyEffects />

      {/* Mobile Bottom Nav */}
      <MobileBottomNav onOpenAddModal={() => navigate('/add')} />

      {/* Quick Add Comic Modal / Bottom Sheet */}
      <ResponsiveDrawer
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Thêm Truyện Mới ✿"
        subtitle="Gieo một mầm truyện mới vào kệ sách nhà kính"
        maxWidth="md"
      >
        <form onSubmit={handleQuickAddSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Tên truyện <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="VD: Tiệm Tạp Hóa Thời Gian..."
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Tác giả
            </label>
            <input
              type="text"
              value={quickAuthor}
              onChange={(e) => setQuickAuthor(e.target.value)}
              placeholder="VD: Hatori M."
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Nguồn theo dõi
            </label>
            <select
              value={quickSource}
              onChange={(e) => setQuickSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="Cuutruyen">Cuutruyen</option>
              <option value="Kakao">Kakao</option>
              <option value="Webtoon">Webtoon</option>
              <option value="BlogTruyen">BlogTruyen</option>
              <option value="Bilibili">Bilibili</option>
              <option value="Hako">Hako</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="text"
              onClick={() => setIsQuickAddOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="honey"
              iconLeft={<Sparkles className="w-4 h-4 text-text" />}
            >
              Thêm vào tủ sách
            </Button>
          </div>
        </form>
      </ResponsiveDrawer>
    </div>
  );
};
