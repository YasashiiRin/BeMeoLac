import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Bell, Plus, Flower2, Sparkles, BookHeart, Compass, Tag, BookOpen } from 'lucide-react';
import { SearchBar } from '../SearchBar';
import { lastSearchHref, rememberLastSearch } from '../../features/search/searchState';
import { ThemeToggle } from '../ThemeToggle';
import { AvatarMenu } from './AvatarMenu';
import { comicsService } from '../../services/comicService';

const NAV_ITEMS = [
  { to: '/', label: 'Tủ Sách', icon: '✿' },
  { to: '/search', label: 'Tìm kiếm', icon: '🔍' },
  { to: '/stats', label: 'Thống kê', icon: '🌿' },
];

/** Header search: on /search it edits the page's query; elsewhere Enter opens /search. */
const HeaderSearch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onSearchPage = location.pathname === '/search';
  const urlQ = onSearchPage ? params.get('q') ?? '' : '';
  const [text, setText] = useState(urlQ);
  const written = useRef(urlQ);

  // follow the URL when the page (or a chip) changes the query
  useEffect(() => {
    if (onSearchPage && urlQ !== written.current) {
      written.current = urlQ;
      setText(urlQ);
    }
  }, [onSearchPage, urlQ]);

  // on /search, typing updates the page's query after a 300ms pause
  useEffect(() => {
    if (!onSearchPage || text === urlQ) return;
    const t = window.setTimeout(() => {
      written.current = text;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (text.trim()) next.set('q', text);
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleSubmit = () => {
    const q = text.trim();
    rememberLastSearch(q);
    if (!onSearchPage) {
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
      setText('');
    }
  };

  return <SearchBar value={text} onChange={setText} onSubmit={handleSubmit} placeholder="Tìm truyện, tác giả, thẻ hoa..." ariaLabel="Tìm kiếm trong tủ truyện" />;
};

interface HeaderProps {
  unreadCount?: number;
  onOpenAddModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount,
  onOpenAddModal,
}) => {
  const navigate = useNavigate();
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

  const handleAddClick = () => {
    if (onOpenAddModal) {
      onOpenAddModal();
    } else {
      navigate('/add');
    }
  };


  return (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md border-b-1.5 border-border px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-primary-soft p-0.5 shadow-botanical-sm group-hover:rotate-6 transition-transform">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center text-primary">
              <Flower2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold text-text tracking-tight group-hover:text-primary transition-colors">
                Tủ Truyện Nhỏ
              </span>
              <span className="text-xs text-accent">✿</span>
              <span className="text-[11px] font-serif italic text-text-muted hidden sm:inline">
                elf library
              </span>
            </div>
            <p className="text-[11px] text-text-muted font-medium leading-none">
              Thư viện nhà kính công chúa
            </p>
          </div>
        </div>

        {/* Center Nav Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface p-1 rounded-full border border-border shadow-inner" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to === '/search' ? lastSearchHref() : item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive ? 'bg-primary text-on-primary glow-primary' : 'text-text-muted hover:text-text hover:bg-background'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Search Bar (Desktop): mirrors /search, elsewhere Enter opens it */}
        <div className="hidden md:block flex-1 max-w-xs xl:max-w-sm">
          <HeaderSearch />
        </div>

        {/* Right Actions: Add Comic, Theme, Bell, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Add Comic Button (Gold) */}
          <button
            type="button"
            onClick={handleAddClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold bg-gold text-on-gold border-1.5 border-border shadow-botanical-sm glow-gold hover:bg-gold/90 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-on-gold" />
            <span>Thêm truyện</span>
            <span className="text-xs">✿</span>
          </button>

          <ThemeToggle />

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-text-muted hover:text-text bg-background hover:bg-surface border-1.5 border-border rounded-full transition-all cursor-pointer shadow-botanical-sm"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {effectiveUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-accent text-on-accent border border-accent rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                {effectiveUnreadCount}
              </span>
            )}
          </button>

          {/* Avatar + account menu (Tài khoản, Đăng xuất) */}
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
};
