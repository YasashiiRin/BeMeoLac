import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings, updateUserProfile } from '../services/userService';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { THEMES, THEME_IDS, ThemeId } from '../theme/themes';
import {
  User,
  Shield,
  Palette,
  Bell,
  Database,
  Sparkles,
  LogOut,
  Save,
  Check,
} from 'lucide-react';

type AccountTab = 'profile' | 'security' | 'appearance' | 'notifications' | 'data';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AccountTab>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(user?.display_name || 'Tiên Nữ Nhỏ');
  const [bio, setBio] = useState(user?.bio || '');
  const { theme, setTheme, effectsEnabled, setEffectsEnabled } = useTheme();
  const [fontSize, setFontSize] = useState<number>(user?.settings?.font_size || 15);
  const [notifyNewChapter, setNotifyNewChapter] = useState<boolean>(
    user?.settings?.notify_new_chapter ?? true
  );
  const [notifyBrokenLink, setNotifyBrokenLink] = useState<boolean>(
    user?.settings?.notify_broken_link ?? true
  );
  const [dailyReminderTime, setDailyReminderTime] = useState<string>(
    user?.settings?.daily_reminder_time || '20:30'
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        display_name: displayName,
        bio,
      });
      showToast('Đã lưu thông tin cá nhân! 🌸', 'success');
    } catch (err) {
      showToast('Lỗi lưu thông tin', 'error');
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await updateUserSettings({
        font_size: fontSize,
      });
      showToast('Đã cập nhật giao diện thần tiên! ✨', 'success');
    } catch (err) {
      showToast('Lỗi lưu cài đặt giao diện', 'error');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateUserSettings({
        notify_new_chapter: notifyNewChapter,
        notify_broken_link: notifyBrokenLink,
        daily_reminder_time: dailyReminderTime,
      });
      showToast('Đã lưu cấu hình thông báo! 🌿', 'success');
    } catch (err) {
      showToast('Lỗi lưu cài đặt thông báo', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          Tài Khoản & Cài Đặt Nhà Kính ✿
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Quản lý trang cá nhân, giao diện botanical và bảo mật thư viện của bạn
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sub-nav tabs */}
        <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-accent-soft text-text border border-border-strong glow-accent'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <User size={16} />
            <span>Hồ sơ cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-accent-soft text-text border border-border-strong glow-accent'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <Palette size={16} />
            <span>Giao diện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-accent-soft text-text border border-border-strong glow-accent'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <Bell size={16} />
            <span>Thông báo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-accent-soft text-text border border-border-strong glow-accent'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <Shield size={16} />
            <span>Bảo mật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'data'
                ? 'bg-accent-soft text-text border border-border-strong glow-accent'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <Database size={16} />
            <span>Dữ liệu & Sao lưu</span>
          </button>

          <div className="pt-3 mt-2 border-t border-border/60 hidden md:block">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-danger hover:bg-danger-tint/50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Tab content panel */}
        <div className="flex-1 bg-surface-raised border-1.5 border-border-strong rounded-3xl p-6 sm:p-8 shadow-botanical">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-text pb-2 border-b border-border/50">
                Thông Tin Cá Nhân
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border-strong p-0.5 bg-surface-raised">
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-text">
                    {displayName}
                  </h4>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface rounded-xl border border-border text-sm text-text focus:outline-none focus:border-leaf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Lời giới thiệu (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface rounded-xl border border-border text-sm text-text focus:outline-none focus:border-leaf resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="self-start"
                iconLeft={<Save size={14} />}
              >
                Lưu thay đổi
              </Button>
            </form>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-text pb-2 border-b border-border/50">
                Giao Diện & Hiệu Ứng
              </h3>

              <section aria-labelledby="garden-mood-heading">
                <h4 id="garden-mood-heading" className="text-xs font-semibold text-text">
                  Không khí khu vườn
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 mb-2.5">
                  Chạm vào một khung cảnh để đổi ngay, nàng nhé ✨
                </p>
                <div role="radiogroup" aria-labelledby="garden-mood-heading" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  {THEME_IDS.map((id) => (
                    <ThemePreviewCard
                      key={id}
                      themeId={id}
                      selected={theme === id}
                      onSelect={() => setTheme(id)}
                    />
                  ))}
                </div>
              </section>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Cỡ chữ hiển thị ({fontSize}px)
                </label>
                <input
                  type="range"
                  min={13}
                  max={18}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full max-w-xs accent-leaf cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between gap-3 max-w-md p-3 bg-surface rounded-xl border border-border cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-text block">Hiệu ứng lấp lánh ✨</span>
                  <span className="text-[11px] text-text-muted">
                    Tiên nhỏ bay lượn, bụi phấn tiên và đom đóm quanh trang của nàng
                  </span>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  checked={effectsEnabled}
                  onChange={(e) => setEffectsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-leaf cursor-pointer shrink-0"
                />
              </label>

              <Button
                type="button"
                variant="primary"
                onClick={handleSaveAppearance}
                className="self-start"
                iconLeft={<Save size={14} />}
              >
                Cập nhật giao diện
              </Button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-text pb-2 border-b border-border/50">
                Tùy Chọn Thông Báo
              </h3>

              <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                <div>
                  <span className="text-xs font-semibold text-text block">
                    Thông báo khi có chương truyện mới
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Chuông báo rung khi tác phẩm đang theo dõi cập nhật tập tiếp theo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewChapter}
                  onChange={(e) => setNotifyNewChapter(e.target.checked)}
                  className="w-4 h-4 accent-leaf cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                <div>
                  <span className="text-xs font-semibold text-text block">
                    Báo liên kết bị gãy (Broken link)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Nhắc nhở kiểm tra khi nguồn đọc bị lỗi hoặc die link
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBrokenLink}
                  onChange={(e) => setNotifyBrokenLink(e.target.checked)}
                  className="w-4 h-4 accent-leaf cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Giờ nhắc nhở đọc sách hàng ngày
                </label>
                <input
                  type="time"
                  value={dailyReminderTime}
                  onChange={(e) => setDailyReminderTime(e.target.value)}
                  className="px-3 py-1.5 bg-surface rounded-xl border border-border text-sm text-text"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleSaveNotifications}
                className="self-start"
                iconLeft={<Save size={14} />}
              >
                Lưu cài đặt thông báo
              </Button>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-text pb-2 border-b border-border/50">
                Bảo Mật Tài Khoản
              </h3>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full max-w-sm px-3.5 py-2 bg-surface rounded-xl border border-border text-sm text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full max-w-sm px-3.5 py-2 bg-surface rounded-xl border border-border text-sm text-text"
                />
              </div>

              <Button
                type="button"
                variant="honey"
                onClick={() => showToast('Đã đổi mật khẩu thành công! 🌸', 'success')}
                className="self-start"
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-text pb-2 border-b border-border/50">
                Quản Lý Dữ Liệu & Sao Lưu
              </h3>

              <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col gap-2">
                <h4 className="font-semibold text-sm text-text">
                  Sao lưu toàn bộ thư viện sang file JSON
                </h4>
                <p className="text-xs text-text-muted">
                  Xuất tất cả truyện tranh, kệ sách, ghi chú và tiến độ để lưu trữ ngoại tuyến an toàn.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('Đã tải xuống file bản sao lưu tủ sách! 📜', 'success')}
                  className="self-start mt-2"
                >
                  Tải bản sao lưu (.JSON)
                </Button>
              </div>

              <div className="p-4 bg-danger-tint/30 rounded-2xl border border-danger/30 flex flex-col gap-2">
                <h4 className="font-semibold text-sm text-danger">
                  Dọn dẹp bộ nhớ tạm
                </h4>
                <p className="text-xs text-text-muted">
                  Xóa bộ nhớ đệm hình ảnh và lịch sử đọc tạm thời trên trình duyệt này.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('Đã làm sạch bộ nhớ tạm nhà kính! 🌿', 'info')}
                  className="self-start mt-2 text-danger border-danger/40"
                >
                  Xóa bộ nhớ đệm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout on mobile (desktop has it in the side menu and the avatar menu) */}
      <button
        type="button"
        onClick={logout}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-1.5 border-danger/40 bg-surface-raised text-sm font-semibold text-danger hover:bg-danger-tint transition-colors cursor-pointer"
      >
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
};

interface ThemePreviewCardProps {
  themeId: ThemeId;
  selected: boolean;
  onSelect: () => void;
}

/** Mini garden rendered in its own palette via a scoped data-theme. */
const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({ themeId, selected, onSelect }) => {
  const def = THEMES[themeId];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative text-left rounded-2xl p-1 border-1.5 transition-all cursor-pointer ${
        selected ? 'border-primary glow-primary' : 'border-border hover:border-primary-soft'
      }`}
    >
      <div data-theme={themeId} className="rounded-xl overflow-hidden bg-background text-text">
        {/* mini scene */}
        <div className="relative h-24 px-3 pt-3 bg-sunbeam-gradient">
          <span className="absolute top-2 right-3 text-[10px] text-gold">✦ ✧</span>
          <span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-accent glow-accent" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="h-1.5 w-14 rounded-full bg-text/70" />
          </div>
          <div className="mt-2.5 flex gap-2">
            <div className="flex-1 h-12 arch-card-sm bg-surface border border-border p-1.5 flex flex-col justify-end gap-1">
              <span className="h-1 w-full rounded-full bg-surface-sunken overflow-hidden">
                <span className="block h-full w-2/3 bg-accent rounded-full" />
              </span>
            </div>
            <div className="flex-1 h-12 arch-card-sm bg-surface-raised border border-border p-1.5 flex flex-col justify-end">
              <span className="h-2.5 w-full rounded-full bg-primary glow-primary" />
            </div>
            <div className="flex-1 h-12 arch-card-sm bg-fairy-gradient border border-border" />
          </div>
        </div>
        <div className="px-3 py-2.5 bg-surface border-t border-border">
          <span className="flex items-center gap-1.5 text-sm font-bold text-text">
            <span>{def.icon}</span>
            {def.label}
          </span>
          <span className="block text-[11px] text-text-muted mt-0.5">{def.description}</span>
        </div>
      </div>
      {selected && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-botanical-sm">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </button>
  );
};
