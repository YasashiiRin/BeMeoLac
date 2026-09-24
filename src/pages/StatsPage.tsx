import React from 'react';
import { VineProgressBar } from '../components/VineProgressBar';
import { BookOpen, Flame, Award, Clock, Sparkles, Coffee } from 'lucide-react';

export const StatsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5E4636]">
          Nhật Ký & Thống Kê Đọc Sách ✿
        </h1>
        <p className="text-xs sm:text-sm text-[#806350] mt-1">
          Ghi chép từng chặng đường bạn đồng hành cùng các trang truyện cổ tích
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-[#F6EBDD] flex items-center justify-center text-[#7FAF6B] mb-1">
            <BookOpen size={18} />
          </div>
          <span className="text-xs text-[#806350]">Đang theo dõi</span>
          <span className="font-serif text-2xl font-bold text-[#5E4636]">128 cuốn</span>
        </div>

        <div className="bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-[#F6EBDD] flex items-center justify-center text-[#F2A7B5] mb-1">
            <Award size={18} />
          </div>
          <span className="text-xs text-[#806350]">Đã hoàn thành</span>
          <span className="font-serif text-2xl font-bold text-[#5E4636]">82 cuốn</span>
        </div>

        <div className="bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-[#F6EBDD] flex items-center justify-center text-[#F6B98B] mb-1">
            <Flame size={18} />
          </div>
          <span className="text-xs text-[#806350]">Chuỗi ngày đọc</span>
          <span className="font-serif text-2xl font-bold text-[#5E4636]">14 ngày liên tiếp</span>
        </div>

        <div className="bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-2xl p-4 shadow-botanical flex flex-col gap-1">
          <div className="w-8 h-8 rounded-xl bg-[#F6EBDD] flex items-center justify-center text-[#735B1F] mb-1">
            <Clock size={18} />
          </div>
          <span className="text-xs text-[#806350]">Tổng chương đã đọc</span>
          <span className="font-serif text-2xl font-bold text-[#5E4636]">1,450 ch.</span>
        </div>
      </div>

      {/* Weekly Afternoon Tea Goal */}
      <div className="bg-sunbeam-gradient border-1.5 border-[#A67B5B] rounded-3xl p-6 shadow-botanical flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-[#5E4636]" />
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#5E4636]">
                Mục Tiêu Giờ Trà Tuần Này
              </h3>
              <p className="text-xs text-[#806350]">Mỗi tuần thưởng thức ít nhất 7 chương truyện mới</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FFF8F5] text-xs font-bold text-[#5E4636] border border-[#A67B5B]">
            5 / 7 chương (71%)
          </span>
        </div>

        <VineProgressBar current={5} total={7} variant="fairy" height="md" />

        <div className="flex items-center gap-2 text-xs text-[#806350] pt-2 border-t border-[#D9B99B]/50">
          <Sparkles className="w-4 h-4 text-[#D7B973]" />
          <span>
            Chỉ cần đọc thêm <strong>2 chương nữa</strong> để nhận huy hiệu tuần này!
          </span>
        </div>
      </div>

      {/* Fairy Badges Collection */}
      <div className="bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-6 shadow-botanical">
        <h3 className="font-serif text-lg font-bold text-[#5E4636] mb-1 flex items-center gap-2">
          <span>Huy Hiệu & Thành Tựu Hoa Cỏ</span>
          <span className="text-xs text-[#F2A7B5]">✿</span>
        </h3>
        <p className="text-xs text-[#806350] mb-4">
          Bộ sưu tập huy hiệu được đúc từ sáp ong và những cánh hoa ép
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#CFE8D5]/60 border border-[#7FAF6B]">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
              🌿
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#29170A]">Tiên Cỏ</h4>
              <p className="text-[11px] text-[#3A5230]">Đã hoàn thành 5 chương tuần này</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FDE8B5]/60 border border-[#D7B973]">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
              ✨
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#5E490C]">Học Giả Thảo Mộc</h4>
              <p className="text-[11px] text-[#806350]">Đọc trên 50 cuốn truyện chữa lành</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FEB2C0]/50 border border-[#F2A7B5]">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
              🏰
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#7B414E]">Chủ Nhân Nhà Kính</h4>
              <p className="text-[11px] text-[#806350]">Lưu trữ hơn 100 tác phẩm thần tiên</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
