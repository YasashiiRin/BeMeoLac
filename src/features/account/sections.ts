import { Bell, Database, Leaf, LucideIcon, Palette, PenLine, ShieldCheck } from 'lucide-react';

export type SectionId = 'profile' | 'security' | 'appearance' | 'notifications' | 'data' | 'about';

export interface SectionDef {
  id: SectionId;
  /** menu label */
  label: string;
  /** heading on the section page */
  title: string;
  /** one line under the label in the mobile list */
  hint: string;
  /** small decorative chip beside the heading */
  chip: string;
  icon: LucideIcon;
  /** icon bubble colors (theme tokens) */
  tint: string;
}

export const SECTIONS: SectionDef[] = [
  { id: 'profile', label: 'Hồ sơ', title: 'Hồ Sơ Cá Nhân', hint: 'Ảnh đại diện, bút danh & lời giới thiệu', chip: 'Trang bìa sổ tay', icon: PenLine, tint: 'bg-leaf-tint text-leaf-ink' },
  { id: 'security', label: 'Bảo mật', title: 'Bảo Mật & Mật Khẩu', hint: 'Mật khẩu, thiết bị đang đăng nhập', chip: 'Ổ khóa dây leo', icon: ShieldCheck, tint: 'bg-shelf-rose-tint text-shelf-rose-ink' },
  { id: 'appearance', label: 'Giao diện', title: 'Chủ Đề & Không Gian Đọc', hint: 'Không khí khu vườn, cỡ chữ, lấp lánh', chip: 'Ánh sáng nhà kính', icon: Palette, tint: 'bg-gold-tint text-gold-ink' },
  { id: 'notifications', label: 'Thông báo', title: 'Thông Báo Thần Tiên', hint: 'Chương mới, link hỏng, lời nhắc đọc', chip: 'Chuông hoa chuông', icon: Bell, tint: 'bg-accent-tint text-accent-ink' },
  { id: 'data', label: 'Dữ liệu', title: 'Dữ Liệu Thư Viện', hint: 'Xuất, nhập & kiểm tra link hỏng', chip: 'Rương ma thuật', icon: Database, tint: 'bg-shelf-linen-tint text-shelf-linen-ink' },
  { id: 'about', label: 'Về ứng dụng', title: 'Về Uyên Thư Các', hint: 'Phiên bản & lời cảm ơn', chip: 'Nhật ký vườn', icon: Leaf, tint: 'bg-shelf-mint-tint text-shelf-mint-ink' },
];

export const sectionById = (id: string | undefined) => SECTIONS.find((s) => s.id === id);
