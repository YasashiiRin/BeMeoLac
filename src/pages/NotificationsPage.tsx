import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc! 🌸', 'info');
  };

  const handleClickItem = async (notif: Notification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.comic_id) {
      navigate(`/comics/${notif.comic_id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#5E4636]">
            Thông Báo Nhà Kính ✿
          </h1>
          <p className="text-xs text-[#806350]">
            Tin tức về chương truyện mới và các mốc thành tựu đọc sách
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            iconLeft={<CheckCheck size={14} className="text-[#7FAF6B]" />}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 bg-[#F6EBDD]/60 rounded-2xl border border-[#D9B99B] animate-pulse h-20"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Không có thông báo mới"
          description="Khi có chương truyện mới ra mắt hoặc thành tựu đơm hoa, tin nhắn sẽ hiển thị ở đây."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              className={`p-4 rounded-2xl border-1.5 transition-all cursor-pointer flex items-start gap-3.5 ${
                n.is_read
                  ? 'bg-[#FFF8F5] border-[#D9B99B]/60 opacity-85'
                  : 'bg-sunbeam-gradient border-[#A67B5B] shadow-botanical-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF8F5] border border-[#A67B5B] flex items-center justify-center text-lg shrink-0">
                {n.type === 'new_chapter' ? '🌸' : n.type === 'achievement' ? '✨' : '⚠️'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm text-[#5E4636] truncate">
                    {n.comic_title || 'Tin vui từ nhà kính'}
                  </h4>
                  <span className="text-[11px] text-[#9E8574] tabular-nums shrink-0">
                    {new Date(n.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#806350] mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2A7B5] mt-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
