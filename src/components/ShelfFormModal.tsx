import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shelf } from '../types';
import { shelvesService } from '../services/shelfService';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';
import { BottomSheet } from './BottomSheet';
import {
  Trash2,
  AlertCircle,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SHELF_ICONS = [
  { symbol: '🌸', name: 'Hoa ép' },
  { symbol: '🌿', name: 'Mầm lá' },
  { symbol: '🍄', name: 'Nấm nhỏ' },
  { symbol: '🦋', name: 'Bướm tiên' },
  { symbol: '🍵', name: 'Tách trà' },
  { symbol: '🌙', name: 'Ánh trăng' },
  { symbol: '⭐', name: 'Lấp lánh' },
  { symbol: '💖', name: 'Yêu thích' },
  { symbol: '🕊️', name: 'Sơn ca' },
  { symbol: '🪴', name: 'Chậu sen' },
  { symbol: '🕯️', name: 'Nến thơm' },
  { symbol: '👑', name: 'Vương miện' },
];

// `colorHex` is the value persisted on Shelf.color (API contract) — it is only an
// identifier. Rendering always uses the themed shelf-* tokens from index.css.
export const SHELF_COLORS = [
  {
    id: 'blush-pink',
    name: 'Hồng Phấn Cánh Hoa',
    shortName: 'Hồng phấn',
    colorHex: '#FEB2C0',
    swatchBg: 'bg-shelf-rose',
    previewPillBg: 'bg-shelf-rose-tint',
    previewPillText: 'text-shelf-rose-ink',
    previewContainerBg: 'bg-shelf-rose-tint',
    previewContainerText: 'text-shelf-rose-ink',
    dotColor: 'bg-shelf-rose',
  },
  {
    id: 'sage-green',
    name: 'Xanh Lá Xô Thơm (Sage Green)',
    shortName: 'Lá xô thơm',
    colorHex: '#A8C49A',
    swatchBg: 'bg-shelf-sage',
    previewPillBg: 'bg-shelf-sage-tint',
    previewPillText: 'text-shelf-sage-ink',
    previewContainerBg: 'bg-shelf-sage-tint',
    previewContainerText: 'text-shelf-sage-ink',
    dotColor: 'bg-shelf-sage',
  },
  {
    id: 'lavender',
    name: 'Oải Hương Cổ Điển',
    shortName: 'Oải hương',
    colorHex: '#D9C8F0',
    swatchBg: 'bg-shelf-lavender',
    previewPillBg: 'bg-shelf-lavender-tint',
    previewPillText: 'text-shelf-lavender-ink',
    previewContainerBg: 'bg-shelf-lavender-tint',
    previewContainerText: 'text-shelf-lavender-ink',
    dotColor: 'bg-shelf-lavender',
  },
  {
    id: 'warm-apricot',
    name: 'Mơ Vàng Mật Ong',
    shortName: 'Mơ chín',
    colorHex: '#FFDF97',
    swatchBg: 'bg-shelf-honey',
    previewPillBg: 'bg-shelf-honey-tint',
    previewPillText: 'text-shelf-honey-ink',
    previewContainerBg: 'bg-shelf-honey-tint',
    previewContainerText: 'text-shelf-honey-ink',
    dotColor: 'bg-shelf-honey',
  },
  {
    id: 'mint-dew',
    name: 'Sương Bạc Hà',
    shortName: 'Sương bạc hà',
    colorHex: '#CFE8D5',
    swatchBg: 'bg-shelf-mint',
    previewPillBg: 'bg-shelf-mint-tint',
    previewPillText: 'text-shelf-mint-ink',
    previewContainerBg: 'bg-shelf-mint-tint',
    previewContainerText: 'text-shelf-mint-ink',
    dotColor: 'bg-shelf-mint',
  },
  {
    id: 'cream-linen',
    name: 'Gỗ Mộc & Đay',
    shortName: 'Gỗ mộc',
    colorHex: '#FFE3D2',
    swatchBg: 'bg-shelf-linen',
    previewPillBg: 'bg-shelf-linen-tint',
    previewPillText: 'text-shelf-linen-ink',
    previewContainerBg: 'bg-shelf-linen-tint',
    previewContainerText: 'text-shelf-linen-ink',
    dotColor: 'bg-shelf-linen',
  },
];

export interface ShelfFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  shelf?: Shelf | null;
  onSuccess?: (shelf: Shelf) => void;
  onDelete?: (shelfId: string) => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export const ShelfFormModal: React.FC<ShelfFormModalProps> = ({
  isOpen,
  onClose,
  mode = 'create',
  shelf,
  onSuccess,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(SHELF_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(SHELF_COLORS[0]);

  // Validation & UI states
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pre-fill fields when opened or when shelf changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && shelf) {
        setName(shelf.name || '');
        setDescription(shelf.description || '');

        const foundIcon = SHELF_ICONS.find((ic) => ic.symbol === shelf.icon);
        setSelectedIcon(foundIcon || { symbol: shelf.icon || '🌸', name: 'Biểu tượng' });

        const foundColor = SHELF_COLORS.find(
          (c) =>
            c.colorHex.toLowerCase() === shelf.color?.toLowerCase() ||
            c.id === shelf.color
        );
        setSelectedColor(foundColor || SHELF_COLORS[0]);
      } else {
        setName('');
        setDescription('');
        setSelectedIcon(SHELF_ICONS[0]);
        setSelectedColor(SHELF_COLORS[0]);
      }
      setNameError(null);
      setDescError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, shelf]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (nameError) setNameError(null);
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    if (descError) setDescError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Vui lòng nhập tên kệ sách (không để trống)');
      return;
    }

    if (trimmedName.length > 40) {
      setNameError('Tên kệ sách không được vượt quá 40 ký tự');
      return;
    }

    if (description.length > 150) {
      setDescError('Lời tựa không được vượt quá 150 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && shelf) {
        const updated = await shelvesService.update(shelf.id, {
          name: trimmedName,
          description: description.trim(),
          icon: selectedIcon.symbol,
          color: selectedColor.colorHex,
        });

        showToast(`Đã lưu thay đổi cho kệ "${updated.name}"! 🌸`, 'success');
        onSuccess?.(updated);
        onClose();
      } else {
        const created = await shelvesService.create({
          name: trimmedName,
          description: description.trim(),
          icon: selectedIcon.symbol,
          color: selectedColor.colorHex,
        });

        showToast(`Đã tạo kệ "${created.name}" thành công! 🌸`, 'success');
        onSuccess?.(created);
        onClose();
        navigate(`/shelves/${created.id}`);
      }
    } catch (err) {
      console.error('Error saving shelf:', err);
      showToast(
        mode === 'edit' ? 'Lỗi khi cập nhật kệ sách' : 'Lỗi khi tạo kệ sách mới',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!shelf) return;
    setIsDeleting(true);
    try {
      await shelvesService.delete(shelf.id);
      showToast(`Đã xóa kệ sách "${shelf.name}" 🌿`, 'info');
      onDelete?.(shelf.id);
      setShowDeleteConfirm(false);
      onClose();
      navigate('/');
    } catch (err) {
      console.error('Error deleting shelf:', err);
      showToast('Lỗi khi xóa kệ sách', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const modalTitle = mode === 'edit' ? 'Sửa kệ' : 'Tạo kệ mới';
  const modalSubtitle =
    mode === 'edit'
      ? 'Thay đổi diện mạo, lời đề tựa và sắc hoa của kệ sách mà nàng đã cất công chăm chút.'
      : 'Gieo một mầm kệ mới để ươm những câu chuyện nàng yêu thích nhất trong gian nhà kính.';

  // Form body content
  const renderFormContent = () => (
    <div className="flex flex-col gap-5 text-text">
      {/* Decorative Garden Ribbon Tag */}
      <div className="flex flex-col items-center text-center -mt-1 mb-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-accent-ink text-xs font-semibold shadow-xs">
          <span>{mode === 'edit' ? '🌿' : '✦'}</span>
          <span className="tracking-wide uppercase text-[11px]">
            {mode === 'edit'
              ? 'Chỉnh sửa ngăn kệ bảo lưu'
              : 'Vườn sách cổ tích'}
          </span>
          <span>{mode === 'edit' ? '🌿' : '✦'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* FIELD 1: Tên kệ sách */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="shelf-form-name"
              className="text-xs sm:text-sm font-bold text-text flex items-center gap-1.5"
            >
              <span className="text-primary">🌿</span>
              <span>Tên kệ sách</span>
            </label>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                mode === 'edit' && shelf && shelf.comic_count > 0
                  ? 'bg-surface-sunken text-gold-ink'
                  : 'bg-accent-tint text-accent-ink'
              }`}
            >
              {mode === 'edit' && shelf && shelf.comic_count > 0
                ? `${shelf.comic_count} truyện đang lưu`
                : 'Bắt buộc'}
            </span>
          </div>

          <div className="relative">
            <input
              id="shelf-form-name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Trà Chiều & Mộng Mơ..."
              className={`w-full h-12 pl-4 pr-10 rounded-xl bg-surface text-text text-sm shadow-inner outline-none transition-all placeholder:text-text-muted/50 border ${
                nameError
                  ? 'border-danger focus:ring-2 focus:ring-danger/30'
                  : 'border-border/60 focus:bg-surface-raised focus:border-leaf focus:ring-2 focus:ring-leaf/20'
              }`}
            />
            <span className="absolute right-3 top-3 text-gold-ink text-base pointer-events-none select-none">
              ✿
            </span>
          </div>

          {/* Inline Validation Error */}
          {nameError && (
            <p className="text-xs text-danger flex items-center gap-1 mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </p>
          )}

          {/* Live Calligraphy Preview Box */}
          <div className="relative overflow-hidden rounded-xl bg-surface p-3 shadow-xs border border-border/50">
            <div className="flex items-center justify-between text-text-muted mb-1 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <span>✒️</span>
                <span>Thư pháp hiển thị:</span>
              </span>
              <span className="text-gold-ink italic">Bản thảo hoàng gia</span>
            </div>
            <div className="flex items-center gap-2 py-1 px-1">
              <span className="text-lg select-none shrink-0">
                {selectedIcon.symbol}
              </span>
              <span className="font-serif italic text-base sm:text-lg font-bold text-gold-ink tracking-wide truncate select-none">
                {name.trim() || 'Trà Chiều & Mộng Mơ'}
              </span>
              <Sparkles className="w-4 h-4 text-gold shrink-0 animate-pulse ml-auto" />
            </div>
          </div>
        </div>

        {/* FIELD 2: Lời tựa kệ sách (Mô tả) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="shelf-form-desc"
              className="text-xs sm:text-sm font-bold text-text flex items-center gap-1.5"
            >
              <span className="text-gold-ink">📖</span>
              <span>Lời tựa kệ sách</span>
            </label>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-muted">
              Tùy chọn
            </span>
          </div>

          <div className="relative rounded-xl bg-surface p-3 shadow-inner border border-border/60">
            <textarea
              id="shelf-form-desc"
              rows={3}
              maxLength={150}
              value={description}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder="Ghi lại đôi dòng cảm xúc, giai điệu hoặc thời khắc nàng muốn mở quyển sách này..."
              className="w-full bg-transparent text-text text-xs sm:text-sm outline-none resize-none placeholder:text-text-muted/50 leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <span>❧</span>
                <span>Trang sổ tay</span>
              </span>
              <span className="text-[11px] text-text-muted tabular-nums">
                {description.length}/150 ký tự
              </span>
            </div>
          </div>
          {descError && (
            <p className="text-xs text-danger flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{descError}</span>
            </p>
          )}
        </div>

        {/* FIELD 3: Biểu tượng linh hồn cho kệ (12 Emojis) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-text flex items-center gap-1.5">
              <span className="text-accent-ink">🎨</span>
              <span>Chọn biểu tượng linh hồn cho kệ</span>
            </label>
            <span className="text-[11px] font-bold text-accent-ink">
              {selectedIcon.symbol} {selectedIcon.name}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-surface p-2.5 rounded-2xl border border-border/50">
            {SHELF_ICONS.map((icon) => {
              const isSelected = selectedIcon.symbol === icon.symbol;
              return (
                <button
                  key={icon.symbol}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-surface-raised shadow-md scale-105 border-1.5 border-accent-soft'
                      : 'bg-surface-raised hover:bg-surface border border-transparent'
                  }`}
                >
                  <span className="text-2xl mb-0.5 filter drop-shadow-xs group-hover:scale-110 transition-transform">
                    {icon.symbol}
                  </span>
                  <span
                    className={`text-[10px] truncate w-full text-center ${
                      isSelected
                        ? 'font-bold text-text'
                        : 'text-text-muted'
                    }`}
                  >
                    {icon.name}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-soft shadow-xs" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 4: Sắc màu thảo mộc (6 Discs) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-text flex items-center gap-1.5">
              <span className="text-primary">🌸</span>
              <span>Sắc màu thảo mộc</span>
            </label>
            <span className="text-[11px] font-bold text-gold-ink">
              {selectedColor.name}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-surface p-2.5 rounded-2xl border border-border/50">
            {SHELF_COLORS.map((color) => {
              const isSelected = selectedColor.id === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${color.swatchBg} shadow-xs flex items-center justify-center transition-all ${
                      isSelected
                        ? 'scale-110 ring-2 ring-primary-soft shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-text stroke-[3]" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] truncate max-w-full text-center ${
                      isSelected
                        ? 'font-bold text-text'
                        : 'text-text-muted'
                    }`}
                  >
                    {color.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 5: Live Sidebar Item Mockup */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-semibold">
            <span>
              {mode === 'edit'
                ? 'Vị trí thực tế trên thanh điều hướng:'
                : 'Xem trước hiển thị ở thanh bên:'}
            </span>
            <span className="text-gold-ink">
              {mode === 'edit' ? 'Đang ghim hàng đầu' : 'Nằm trong "Kệ Của Nàng"'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface border border-border/50 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs max-w-full ${selectedColor.previewContainerBg} ${selectedColor.previewContainerText}`}
              >
                <span className="text-sm shrink-0">{selectedIcon.symbol}</span>
                <span className="text-xs sm:text-sm font-bold truncate">
                  {name.trim() || 'Trà Chiều & Mộng Mơ'}
                  {mode === 'edit' && shelf ? ` (${shelf.comic_count})` : ''}
                </span>
                {mode === 'create' ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-raised/80 font-bold uppercase shadow-2xs">
                    Mới
                  </span>
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${selectedColor.dotColor} shrink-0`}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-text-muted text-xs font-semibold shrink-0 pl-2">
              <span>{mode === 'edit' ? `${shelf?.comic_count ?? 0} cuốn` : '0 cuốn'}</span>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-danger hover:bg-danger-tint px-3 py-2 rounded-full transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa kệ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm font-semibold text-text-muted hover:text-text px-3 py-2 rounded-full transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs sm:text-sm font-semibold text-text-muted hover:text-text px-3.5 py-2 rounded-full transition-colors cursor-pointer"
              >
                Hủy
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
                mode === 'edit'
                  ? 'bg-primary hover:bg-primary-deep text-on-primary'
                  : 'bg-accent hover:bg-accent-ink text-on-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed active:scale-98`}
            >
              <span>{selectedIcon.symbol}</span>
              <span>{isSubmitting ? 'Đang lưu...' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo kệ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* CONFIRM DELETE DIALOG (Nested botanical prompt) */}
      {showDeleteConfirm && (
        <div className="p-4 rounded-2xl bg-danger-tint border border-danger/40 text-danger-ink flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
            <div>
              <h4 className="font-serif font-bold text-sm text-danger-ink">
                Xác nhận xóa kệ sách "{shelf?.name}"?
              </h4>
              <p className="text-xs text-danger-ink/80 mt-1 leading-relaxed">
                Nàng có chắc chắn muốn xóa kệ sách này không? Các bộ truyện bên trong kệ
                vẫn sẽ được bảo lưu an toàn trong Tủ Sách chung của nàng.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-raised/70 hover:bg-surface-raised text-text transition-colors cursor-pointer"
            >
              Giữ lại
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-danger hover:bg-danger-ink text-on-danger shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa kệ này'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        subtitle={modalSubtitle}
      >
        {renderFormContent()}
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      maxWidth="lg"
    >
      {renderFormContent()}
    </Modal>
  );
};
