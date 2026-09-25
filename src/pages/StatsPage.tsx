import React from 'react';
import { VineProgressBar } from '../components/VineProgressBar';
import { BookOpen, Flame, Award, Clock, Sparkles, Coffee } from 'lucide-react';

export const StatsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          Nhật Ký & Thống Kê Đọc Sách ✿
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Ghi chép từng chặng đường bạn đồng hành cùng các trang truyện cổ tích
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-surface-raised border-1.5 border-border-strong rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-leaf-ink mb-1">
            <BookOpen size={18} />
          </div>
          <span className="text-xs text-text-muted">Đang theo dõi</span>
          <span className="font-serif text-2xl font-bold text-text">128 cuốn</span>
        </div>

        <div className="bg-surface-raised border-1.5 border-border-strong rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-accent-ink mb-1">
            <Award size={18} />
          </div>
          <span className="text-xs text-text-muted">Đã hoàn thành</span>
          <span className="font-serif text-2xl font-bold text-text">82 cuốn</span>
        </div>

        <div className="bg-surface-raised border-1.5 border-border-strong rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-accent-ink mb-1">
            <Flame size={18} />
          </div>
          <span className="text-xs text-text-muted">Chuỗi ngày đọc</span>
          <span className="font-serif text-2xl font-bold text-text">14 ngày liên tiếp</span>
        </div>

        <div className="bg-surface-raised border-1.5 border-border-strong rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-gold-ink mb-1">
            <Clock size={18} />
          </div>
          <span className="text-xs text-text-muted">Tổng chương đã đọc</span>
          <span className="font-serif text-2xl font-bold text-text">1,450 ch.</span>
        </div>
      </div>

      {/* Weekly Afternoon Tea Goal */}
      <div className="bg-sunbeam-gradient border-1.5 border-border-strong rounded-3xl p-6 shadow-botanical flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-text" />
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-text">
                Mục Tiêu Giờ Trà Tuần Này
              </h3>
              <p className="text-xs text-text-muted">Mỗi tuần thưởng thức ít nhất 7 chương truyện mới</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-surface-raised text-xs font-bold text-text border border-border-strong">
            5 / 7 chương (71%)
          </span>
        </div>

        <VineProgressBar current={5} total={7} variant="fairy" height="md" />

        <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border/50">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>
            Chỉ cần đọc thêm <strong>2 chương nữa</strong> để nhận huy hiệu tuần này!
          </span>
        </div>
      </div>

      {/* Fairy Badges Collection */}
      <div className="bg-surface-raised border-1.5 border-border-strong rounded-3xl p-6 shadow-botanical">
        <h3 className="font-serif text-lg font-bold text-text mb-1 flex items-center gap-2">
          <span>Huy Hiệu & Thành Tựu Hoa Cỏ</span>
          <span className="text-xs text-accent-ink">✿</span>
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Bộ sưu tập huy hiệu được đúc từ sáp ong và những cánh hoa ép
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-leaf-tint/60 border border-leaf">
            <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center text-2xl shadow-xs">
              🌿
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-text">Tiên Cỏ</h4>
              <p className="text-[11px] text-primary-ink">Đã hoàn thành 5 chương tuần này</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gold-tint/60 border border-gold">
            <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center text-2xl shadow-xs">
              ✨
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-ink">Học Giả Thảo Mộc</h4>
              <p className="text-[11px] text-text">Đọc trên 50 cuốn truyện chữa lành</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent-soft/50 border border-accent-soft">
            <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center text-2xl shadow-xs">
              🏰
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-accent-ink">Chủ Nhân Nhà Kính</h4>
              <p className="text-[11px] text-text">Lưu trữ hơn 100 tác phẩm thần tiên</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
