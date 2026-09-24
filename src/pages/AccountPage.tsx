import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings, updateUserProfile } from '../services/userService';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.settings?.theme || 'light');
  const [fontSize, setFontSize] = useState<number>(user?.settings?.font_size || 15);
  const [sparkleEnabled, setSparkleEnabled] = useState<boolean>(
    user?.settings?.sparkle_enabled ?? true
  );
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
        theme,
        font_size: fontSize,
        sparkle_enabled: sparkleEnabled,
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
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5E4636]">
          Tài Khoản & Cài Đặt Nhà Kính ✿
        </h1>
        <p className="text-xs sm:text-sm text-[#806350] mt-1">
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
                ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                : 'text-[#806350] hover:bg-[#F6EBDD] hover:text-[#5E4636]'
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
                ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                : 'text-[#806350] hover:bg-[#F6EBDD] hover:text-[#5E4636]'
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
                ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                : 'text-[#806350] hover:bg-[#F6EBDD] hover:text-[#5E4636]'
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
                ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                : 'text-[#806350] hover:bg-[#F6EBDD] hover:text-[#5E4636]'
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
                ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                : 'text-[#806350] hover:bg-[#F6EBDD] hover:text-[#5E4636]'
            }`}
          >
            <Database size={16} />
            <span>Dữ liệu & Sao lưu</span>
          </button>

          <div className="pt-3 mt-2 border-t border-[#D9B99B]/60 hidden md:block">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#BA1A1A] hover:bg-[#FFDAD6]/50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Tab content panel */}
        <div className="flex-1 bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-6 sm:p-8 shadow-botanical">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-[#5E4636] pb-2 border-b border-[#D9B99B]/50">
                Thông Tin Cá Nhân
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#A67B5B] p-0.5 bg-[#FFF8F5]">
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#5E4636]">
                    {displayName}
                  </h4>
                  <p className="text-xs text-[#806350]">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:outline-none focus:border-[#7FAF6B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Lời giới thiệu (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:outline-none focus:border-[#7FAF6B] resize-none"
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
              <h3 className="font-serif text-lg font-bold text-[#5E4636] pb-2 border-b border-[#D9B99B]/50">
                Giao Diện & Hiệu Ứng
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-2">
                  Chủ đề màu sắc
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border-1.5 text-left cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'bg-[#CFE8D5] border-[#7FAF6B] font-bold text-[#3A5230]'
                        : 'bg-[#F6EBDD] border-[#D9B99B] text-[#5E4636]'
                    }`}
                  >
                    <span className="block text-sm">🌸 Ban Ngày (Nhà Kính)</span>
                    <span className="text-[11px] opacity-75 font-normal">Tone kem ấm, nắng ban mai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border-1.5 text-left cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-[#CFE8D5] border-[#7FAF6B] font-bold text-[#3A5230]'
                        : 'bg-[#F6EBDD] border-[#D9B99B] text-[#5E4636]'
                    }`}
                  >
                    <span className="block text-sm">🌙 Ban Đêm (Đom Đóm)</span>
                    <span className="text-[11px] opacity-75 font-normal">Tone ấm dịu bảo vệ mắt</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Cỡ chữ hiển thị ({fontSize}px)
                </label>
                <input
                  type="range"
                  min={13}
                  max={18}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full max-w-xs accent-[#7FAF6B] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between max-w-md p-3 bg-[#F6EBDD] rounded-xl border border-[#D9B99B]">
                <div>
                  <span className="text-xs font-semibold text-[#5E4636] block">
                    Bụi phấn tiên & Hiệu ứng lấp lánh
                  </span>
                  <span className="text-[11px] text-[#806350]">
                    Tạo chuyển động thần tiên nhẹ nhàng khi rê chuột
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sparkleEnabled}
                  onChange={(e) => setSparkleEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#7FAF6B] cursor-pointer"
                />
              </div>

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
              <h3 className="font-serif text-lg font-bold text-[#5E4636] pb-2 border-b border-[#D9B99B]/50">
                Tùy Chọn Thông Báo
              </h3>

              <div className="flex items-center justify-between p-3 bg-[#F6EBDD] rounded-xl border border-[#D9B99B]">
                <div>
                  <span className="text-xs font-semibold text-[#5E4636] block">
                    Thông báo khi có chương truyện mới
                  </span>
                  <span className="text-[11px] text-[#806350]">
                    Chuông báo rung khi tác phẩm đang theo dõi cập nhật tập tiếp theo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewChapter}
                  onChange={(e) => setNotifyNewChapter(e.target.checked)}
                  className="w-4 h-4 accent-[#7FAF6B] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F6EBDD] rounded-xl border border-[#D9B99B]">
                <div>
                  <span className="text-xs font-semibold text-[#5E4636] block">
                    Báo liên kết bị gãy (Broken link)
                  </span>
                  <span className="text-[11px] text-[#806350]">
                    Nhắc nhở kiểm tra khi nguồn đọc bị lỗi hoặc die link
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBrokenLink}
                  onChange={(e) => setNotifyBrokenLink(e.target.checked)}
                  className="w-4 h-4 accent-[#7FAF6B] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Giờ nhắc nhở đọc sách hàng ngày
                </label>
                <input
                  type="time"
                  value={dailyReminderTime}
                  onChange={(e) => setDailyReminderTime(e.target.value)}
                  className="px-3 py-1.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636]"
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
              <h3 className="font-serif text-lg font-bold text-[#5E4636] pb-2 border-b border-[#D9B99B]/50">
                Bảo Mật Tài Khoản
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full max-w-sm px-3.5 py-2 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full max-w-sm px-3.5 py-2 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636]"
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
              <h3 className="font-serif text-lg font-bold text-[#5E4636] pb-2 border-b border-[#D9B99B]/50">
                Quản Lý Dữ Liệu & Sao Lưu
              </h3>

              <div className="p-4 bg-[#F6EBDD] rounded-2xl border border-[#D9B99B] flex flex-col gap-2">
                <h4 className="font-semibold text-sm text-[#5E4636]">
                  Sao lưu toàn bộ thư viện sang file JSON
                </h4>
                <p className="text-xs text-[#806350]">
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

              <div className="p-4 bg-[#FFDAD6]/30 rounded-2xl border border-[#BA1A1A]/30 flex flex-col gap-2">
                <h4 className="font-semibold text-sm text-[#BA1A1A]">
                  Dọn dẹp bộ nhớ tạm
                </h4>
                <p className="text-xs text-[#806350]">
                  Xóa bộ nhớ đệm hình ảnh và lịch sử đọc tạm thời trên trình duyệt này.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('Đã làm sạch bộ nhớ tạm nhà kính! 🌿', 'info')}
                  className="self-start mt-2 text-[#BA1A1A] border-[#BA1A1A]/40"
                >
                  Xóa bộ nhớ đệm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
