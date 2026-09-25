import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarHeart, ChevronRight, Flower2, HeartCrack, LogOut, PenLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { comicsService, ComicSummary } from '../services/comicService';
import { userService } from '../services/userService';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { THEMES } from '../theme/themes';
import { SECTIONS, SectionId, sectionById } from '../features/account/sections';
import { FALLBACK_AVATAR } from '../features/account/avatar';
import { ProfileSection } from '../features/account/ProfileSection';
import { SecuritySection } from '../features/account/SecuritySection';
import { AppearanceSection } from '../features/account/AppearanceSection';
import { NotificationsSection } from '../features/account/NotificationsSection';
import { DataSection } from '../features/account/DataSection';
import { AboutSection } from '../features/account/AboutSection';

const CONTENT: Record<SectionId, React.FC> = {
  profile: ProfileSection,
  security: SecuritySection,
  appearance: AppearanceSection,
  notifications: NotificationsSection,
  data: DataSection,
  about: AboutSection,
};

const memberSince = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/*
 * /account            phones: profile + grouped list · desktop: menu + Hồ sơ
 * /account/<section>  phones: that sub-page with a back arrow · desktop: menu + section
 */
export const AccountPage: React.FC = () => {
  const { '*': splat } = useParams();
  const slug = (splat ?? '').split('/')[0];
  const section = sectionById(slug);
  const { user, logout } = useAuth();
  const { theme, fontSize } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ComicSummary | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    comicsService.getSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  if (slug && !section) return <Navigate to="/account" replace />;

  const active: SectionId = section?.id ?? 'profile';
  const Content = CONTENT[active];
  const onSubPage = !!section; // phones show only the sub-page

  const hints: Partial<Record<SectionId, string>> = {
    appearance: `${THEMES[theme].label} · chữ ${fontSize}px`,
    notifications: user?.settings.daily_reminder_enabled ? `Nhắc đọc lúc ${user.settings.daily_reminder_time}` : undefined,
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await userService.deleteAccount();
      showToast('Tài khoản đã được xóa. Hẹn gặp lại nàng một ngày nắng đẹp 🌸', 'success');
      setDeleteOpen(false);
      logout();
    } catch {
      showToast('Chưa xóa được tài khoản, nàng thử lại nhé', 'error');
      setDeleting(false);
    }
  };

  const bottomActions = (
    <div className={`${onSubPage ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-surface/70 border border-border/60 p-3 sm:px-5`}>
      <button
        type="button"
        onClick={logout}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-surface-raised border-1.5 border-border text-sm font-semibold text-text hover:border-primary transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Đăng xuất
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="self-center inline-flex items-center gap-1 text-xs text-text-muted underline underline-offset-4 decoration-border-strong hover:text-danger-ink cursor-pointer"
      >
        <HeartCrack className="w-3.5 h-3.5" aria-hidden="true" />
        Xóa tài khoản
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
      {/* Title + profile header (phones: only on the list page) */}
      <div className={`${onSubPage ? 'hidden md:flex' : 'flex'} flex-col gap-5 sm:gap-6`}>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Góc Nhỏ Của Nàng <span className="text-accent" aria-hidden="true">✿</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Chăm chút khu vườn cá nhân và thiết lập thế giới đọc sách của nàng ✨</p>
        </div>

        <section aria-label="Hồ sơ" className="relative overflow-hidden rounded-3xl bg-sunbeam-gradient border-1.5 border-border p-5 sm:p-6 shadow-botanical">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-tint/70 blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full p-1 bg-fairy-gradient shadow-botanical">
              <img src={user?.avatar_url || FALLBACK_AVATAR} alt="" className="w-full h-full rounded-full object-cover bg-surface" />
            </div>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <p className="font-serif text-xl sm:text-2xl font-semibold text-text">{user?.display_name}</p>
              <p className="text-sm text-text-muted">@{user?.username}</p>
              {user?.bio && <p className="mt-1.5 font-serif italic text-sm sm:text-base text-accent-ink line-clamp-2">“{user.bio}”</p>}
              <ul className="mt-3 grid grid-cols-3 md:flex md:flex-wrap gap-2" aria-label="Thống kê nhỏ">
                {[
                  { icon: BookOpen, value: summary ? String(summary.total) : '…', label: 'truyện trong tủ' },
                  { icon: Flower2, value: summary ? String(summary.by_status.completed) : '…', label: 'đã đọc xong' },
                  { icon: CalendarHeart, value: memberSince(user?.created_at), label: 'thành viên từ' },
                ].map(({ icon: Icon, value, label }) => (
                  <li
                    key={label}
                    className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 rounded-2xl md:rounded-full bg-surface-raised/80 border border-border/60 px-2 py-2 md:px-3 md:py-1"
                  >
                    <span className="flex items-center gap-1 text-sm font-bold text-text tabular-nums">
                      <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      {value}
                    </span>
                    <span className="text-[11px] text-text-muted">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="honey"
              className="w-full md:w-auto"
              onClick={() => navigate('/account/profile#edit')}
              iconLeft={<PenLine className="w-4 h-4" />}
            >
              Sửa hồ sơ
            </Button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)] gap-5 sm:gap-6 items-start">
        {/* Desktop: left menu */}
        <nav aria-label="Mục cài đặt" className="hidden md:flex flex-col gap-1 rounded-3xl bg-surface-raised border-1.5 border-border p-3 shadow-botanical md:sticky md:top-24">
          <span className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Mục lục sổ tay</span>
          {SECTIONS.map((s) => {
            const on = s.id === active;
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={`/account/${s.id}`}
                aria-current={on ? 'page' : undefined}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                  on ? 'bg-primary text-on-primary glow-primary' : 'text-text hover:bg-surface'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                  {s.label}
                </span>
                {on ? <span aria-hidden="true">✿</span> : <ChevronRight className="w-4 h-4 text-text-muted" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        {/* Phones: grouped list of rows */}
        {!onSubPage && (
          <nav aria-label="Mục cài đặt" className="md:hidden rounded-3xl bg-surface-raised border-1.5 border-border p-2 shadow-botanical">
            <span className="block px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Khu vực cài đặt</span>
            <ul>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.id}>
                    <Link to={`/account/${s.id}`} className="flex items-center gap-3 px-3 py-3 rounded-2xl active:bg-surface hover:bg-surface transition-colors">
                      <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${s.tint}`} aria-hidden="true">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-text">{s.label}</span>
                        <span className="block text-xs text-text-muted truncate">{hints[s.id] ?? s.hint}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-text-muted shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Section content */}
        <section
          aria-label={sectionById(active)!.title}
          className={`${onSubPage ? '' : 'hidden md:block'} min-w-0 rounded-3xl bg-surface-raised border-1.5 border-border p-4 sm:p-6 shadow-botanical`}
        >
          <Content key={active} />
        </section>
      </div>

      {bottomActions}

      <Modal isOpen={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Xóa tài khoản vĩnh viễn?" maxWidth="sm">
        <div className="flex flex-col gap-3 text-sm text-text leading-relaxed">
          <p>
            Toàn bộ tủ truyện, kệ sách, ghi chú và tiến độ đọc của nàng sẽ bị xóa và <strong>không thể khôi phục</strong>.
          </p>
          <p className="text-text-muted">
            Nàng có thể{' '}
            <Link to="/account/data" onClick={() => setDeleteOpen(false)} className="font-semibold text-primary-ink underline underline-offset-2">
              xuất dữ liệu
            </Link>{' '}
            để giữ lại một bản sao trước nhé.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2.5 mt-6">
          <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Giữ lại khu vườn
          </Button>
          <Button variant="primary" onClick={deleteAccount} isLoading={deleting} className="bg-danger! text-on-danger! border-danger! hover:bg-danger-ink!">
            Xóa vĩnh viễn
          </Button>
        </div>
      </Modal>
    </div>
  );
};
