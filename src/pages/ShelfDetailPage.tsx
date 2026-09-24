import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shelf, Comic } from '../types';
import { shelvesService } from '../services/shelfService';
import { getComics, addComicToShelf, toggleFavorite, updateComicProgress } from '../services/comicService';
import { ComicCard } from '../components/ComicCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { ResponsiveDrawer } from '../components/ResponsiveDrawer';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Plus,
  Edit,
  Share2,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  Clock,
  Sparkles,
  Search,
  Check,
  GripVertical,
  BookOpen,
  CheckCircle2,
  Sun,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type ShelfSortOption = 'custom' | 'newest' | 'alphabetical' | 'rating';

export const ShelfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Shelf data
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [allShelves, setAllShelves] = useState<Shelf[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting & View
  const [sortOption, setSortOption] = useState<ShelfSortOption>('custom');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drag and Drop reorder state
  const [draggedComicId, setDraggedComicId] = useState<string | null>(null);
  const [dragOverComicId, setDragOverComicId] = useState<string | null>(null);

  // "..." Menu Dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Confirm Delete Shelf Modal
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Comic to Shelf Picker Drawer
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [availableComics, setAvailableComics] = useState<Comic[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isLoadingPicker, setIsLoadingPicker] = useState(false);

  // Create new shelf modal (triggered from sidebar)
  const [isCreateShelfOpen, setIsCreateShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfDesc, setNewShelfDesc] = useState('');
  const [newShelfIcon, setNewShelfIcon] = useState('🌸');

  // Fetch shelf & comics data
  useEffect(() => {
    let isMounted = true;
    const loadShelfData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [shelfData, allShelvesData] = await Promise.all([
          shelvesService.getShelfById(id),
          shelvesService.list(),
        ]);

        if (!isMounted) return;
        setShelf(shelfData);
        setAllShelves(allShelvesData);

        // Fetch comics in this shelf
        const res = await getComics({
          shelf_id: id === 'all' ? undefined : id,
          page_size: 100,
        });

        let loadedComics = res.items;

        // Check if custom order was previously saved
        const savedOrder = shelvesService.getShelfComicOrder(id);
        if (savedOrder && savedOrder.length > 0) {
          loadedComics.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
          });
        }

        if (isMounted) {
          setComics(loadedComics);
        }
      } catch (err) {
        console.error('Error fetching shelf detail:', err);
        showToast('Không thể tải thông tin kệ sách', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadShelfData();
    return () => {
      isMounted = false;
    };
  }, [id, showToast]);

  // Sync updates to comic cards when updated from modal or detail
  useEffect(() => {
    const handleComicUpdated = (e: Event) => {
      const updated = (e as CustomEvent<Comic>).detail;
      if (updated) {
        setComics((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      }
    };
    window.addEventListener('comic-updated', handleComicUpdated);
    return () => window.removeEventListener('comic-updated', handleComicUpdated);
  }, []);

  // Click outside listener for "..." menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Sorted comics computation
  const sortedComics = useMemo(() => {
    const list = [...comics];
    if (sortOption === 'newest') {
      return list.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
    if (sortOption === 'alphabetical') {
      return list.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
    if (sortOption === 'rating') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    // 'custom' order
    return list;
  }, [comics, sortOption]);

  // Completed count
  const completedCount = useMemo(() => {
    return comics.filter(
      (c) => c.status === 'completed' || c.current_chapter >= c.total_chapters
    ).length;
  }, [comics]);

  // Healing progress calculation for the left sidebar widget
  const healPercent = useMemo(() => {
    if (comics.length === 0) return 0;
    return Math.round((completedCount / comics.length) * 100);
  }, [completedCount, comics.length]);

  const remainingCount = useMemo(() => {
    return Math.max(0, comics.length - completedCount);
  }, [comics.length, completedCount]);

  // Drag and Drop Reorder
  const handleDropOnComic = async (targetComicId: string) => {
    if (!draggedComicId || draggedComicId === targetComicId || !shelf) {
      setDraggedComicId(null);
      setDragOverComicId(null);
      return;
    }

    const currentList = [...comics];
    const sourceIndex = currentList.findIndex((c) => c.id === draggedComicId);
    const targetIndex = currentList.findIndex((c) => c.id === targetComicId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedComicId(null);
      setDragOverComicId(null);
      return;
    }

    const [movedItem] = currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, movedItem);

    setComics(currentList);
    setSortOption('custom');
    setDraggedComicId(null);
    setDragOverComicId(null);

    // Save custom order via shelvesService
    const newIds = currentList.map((c) => c.id);
    try {
      await shelvesService.reorder(shelf.id, newIds);
    } catch (err) {
      console.error('Error saving reorder:', err);
    }
  };

  // Move comic index manually (touch & keyboard friendly)
  const handleManualMove = async (comicId: string, direction: 'left' | 'right') => {
    if (!shelf) return;
    const currentList = [...comics];
    const currentIndex = currentList.findIndex((c) => c.id === comicId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const [movedItem] = currentList.splice(currentIndex, 1);
    currentList.splice(targetIndex, 0, movedItem);

    setComics(currentList);
    setSortOption('custom');

    const newIds = currentList.map((c) => c.id);
    await shelvesService.reorder(shelf.id, newIds);
  };

  // Open Add Comic Picker
  const handleOpenAddPicker = async () => {
    setIsAddPickerOpen(true);
    setIsLoadingPicker(true);
    try {
      const res = await getComics({ page_size: 100 });
      // Available comics are those not yet in this shelf
      const unassigned = res.items.filter((c) => !comics.some((existing) => existing.id === c.id));
      setAvailableComics(unassigned);
    } catch (err) {
      showToast('Không thể tải danh sách truyện có sẵn', 'error');
    } finally {
      setIsLoadingPicker(false);
    }
  };

  // Add a comic from picker to this shelf
  const handleAddComicToShelf = async (candidateComic: Comic) => {
    if (!shelf) return;
    try {
      await addComicToShelf(shelf.id, candidateComic.id);
      setComics((prev) => [...prev, candidateComic]);
      setAvailableComics((prev) => prev.filter((c) => c.id !== candidateComic.id));
      showToast(`Đã thêm "${candidateComic.title}" vào kệ sách 🌸`, 'success');
    } catch (err) {
      showToast('Lỗi khi thêm truyện vào kệ', 'error');
    }
  };

  // Share shelf link
  const handleShareShelf = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Đã sao chép liên kết kệ "${shelf?.name || ''}"! ✨`, 'info');
    setIsMenuOpen(false);
  };

  // Edit shelf (placeholder toast as requested)
  const handleEditShelf = () => {
    showToast('Tính năng sửa kệ sắp ra mắt trong bản cập nhật tới! ✿', 'info');
    setIsMenuOpen(false);
  };

  // Confirm delete shelf
  const handleConfirmDeleteShelf = async () => {
    if (!shelf) return;
    setIsDeleting(true);
    try {
      await shelvesService.deleteShelf(shelf.id);
      showToast(`Đã xóa kệ sách "${shelf.name}" 🌿`, 'info');
      setIsConfirmDeleteOpen(false);
      navigate('/');
    } catch (err) {
      showToast('Lỗi khi xóa kệ sách', 'error');
      setIsDeleting(false);
    }
  };

  // Create new shelf submission (from sidebar)
  const handleCreateShelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    try {
      const newShelf = await shelvesService.createShelf({
        name: newShelfName.trim(),
        description: newShelfDesc.trim(),
        icon: newShelfIcon || '🌸',
      });
      setAllShelves((prev) => [...prev, newShelf]);
      setIsCreateShelfOpen(false);
      setNewShelfName('');
      setNewShelfDesc('');
      showToast(`Đã tạo kệ "${newShelf.name}" thành công! 🌸`, 'success');
      navigate(`/shelves/${newShelf.id}`);
    } catch (err) {
      showToast('Lỗi tạo kệ sách mới', 'error');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await toggleFavorite(id);
      setComics((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_favorite: updated.is_favorite } : c))
      );
    } catch (err) {
      showToast('Lỗi cập nhật yêu thích', 'error');
    }
  };

  // Quick read progress update
  const handleQuickRead = async (comic: Comic) => {
    try {
      const nextChapter =
        comic.current_chapter < comic.total_chapters
          ? comic.current_chapter + 1
          : comic.total_chapters;
      await updateComicProgress(comic.id, nextChapter);
      setComics((prev) =>
        prev.map((c) =>
          c.id === comic.id
            ? { ...c, current_chapter: nextChapter, last_read_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      showToast('Lỗi cập nhật tiến trình', 'error');
    }
  };

  // Filtered available comics in picker
  const filteredAvailableComics = useMemo(() => {
    if (!pickerSearch.trim()) return availableComics;
    const q = pickerSearch.toLowerCase().trim();
    return availableComics.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [availableComics, pickerSearch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-4xl animate-bounce">🌸</span>
        <h3 className="font-serif text-lg font-bold text-[#5E4636] mt-3">
          Đang dọn ngăn kệ thảo mộc...
        </h3>
        <p className="text-xs text-[#806350] mt-1 italic">
          Bụi tiên đang đánh bóng từng gáy sách cổ
        </p>
      </div>
    );
  }

  // Not found
  if (!shelf) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-3">🌿</span>
        <h2 className="font-serif text-2xl font-bold text-[#5E4636] mb-2">
          Kệ sách không tồn tại
        </h2>
        <p className="text-xs sm:text-sm text-[#806350] mb-6 max-w-sm">
          Có thể kệ sách đã được cất sang vương quốc khác hoặc đổi tên.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Trở về Tủ Sách ✿
        </Button>
      </div>
    );
  }

  // Collage covers computation
  const collageCovers =
    shelf.cover_urls && shelf.cover_urls.length > 0
      ? shelf.cover_urls
      : comics.map((c) => c.cover_url).filter(Boolean).slice(0, 3);

  const primaryCover = collageCovers[1] || collageCovers[0] || '/src/assets/images/cottage_greenhouse_store_1790241469393.jpg';
  const leftCover = collageCovers[0] || '/src/assets/images/secret_fairy_garden_1790241482673.jpg';
  const rightCover = collageCovers[2] || collageCovers[0] || '/src/assets/images/traveler_in_sunlit_meadow_1790241493617.jpg';

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 max-w-[1440px] mx-auto w-full">
      {/* ------------------------------------------------------------------- */}
      {/* DESKTOP LEFT SIDEBAR: KỆ SÁCH CỦA NÀNG + TIẾN TRÌNH CHỮA LÀNH       */}
      {/* ------------------------------------------------------------------- */}
      <aside className="hidden lg:flex lg:col-span-3 w-64 xl:w-72 shrink-0 flex-col gap-5">
        {/* Botanical Frame Card */}
        <div className="bg-[#fff1ea] rounded-3xl p-5 shadow-sm border border-[#A67B5B]/30 relative overflow-hidden">
          {/* Background decorative leaf tint */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#4c6542]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#a8c49a]/40">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <h2 className="font-serif text-base font-bold text-[#29170a]">Kệ Của Nàng</h2>
            </div>
            <button
              onClick={() => setIsCreateShelfOpen(true)}
              className="p-1 rounded-full hover:bg-[#ffd9df] text-[#894d59] transition-colors cursor-pointer"
              title="Thêm ngăn kệ mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Shelf List */}
          <nav aria-label="Danh sách kệ truyện" className="flex flex-col gap-1.5">
            {allShelves.map((s) => {
              const isActive = s.id === shelf.id;
              if (isActive) {
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#ffd9df] via-[#ffe3d2] to-[#feb2c0] text-[#7b414e] shadow-md relative overflow-hidden transition-all transform scale-[1.02] cursor-pointer"
                  >
                    <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#ffdf97] animate-ping" />
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                        <span className="text-sm">{s.icon}</span>
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-serif text-sm font-bold text-[#7b414e] leading-tight truncate">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-[#6d3642] italic truncate">
                          {s.description || 'Khu vườn an tĩnh'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#894d59] font-bold text-xs shadow-xs shrink-0">
                      {comics.length}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id === 'all') navigate('/');
                    else navigate(`/shelves/${s.id}`);
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[#434840] hover:bg-[#ffeade] hover:text-[#29170a] transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base shrink-0">{s.icon}</span>
                    <span className="text-sm font-medium truncate">{s.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdcc6] text-[#434840] text-xs font-semibold tabular-nums shrink-0">
                    {s.comic_count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botanical Cloche Quick Info Widget: "Tiến trình chữa lành" */}
        <div className="bg-[#fff1ea] rounded-3xl p-5 shadow-sm border border-[#A67B5B]/30 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-[#735b1f]" />
            <span className="font-serif text-base font-bold text-[#29170a]">
              Tiến trình chữa lành
            </span>
          </div>
          <p className="text-xs text-[#434840] leading-relaxed">
            Nàng đã hoàn tất <strong className="text-[#29170a] font-bold">{completedCount}/{comics.length}</strong> chương mục bình yên trong tháng này.
          </p>
          {/* Sunlit Progress Bar */}
          <div className="w-full bg-[#ffdcc6] h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#a8c49a] via-[#d7b973] to-[#feb2c0] h-full rounded-full transition-all duration-500"
              style={{ width: `${healPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-[#434840]">
            <span>{healPercent}% Hoàn thiện</span>
            <span className="text-[#4c6542] font-bold">{remainingCount} truyện còn lại 🌿</span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------- */}
      {/* RIGHT MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
        {/* Top Mobile Action & Navigation Row (ke-sach-mobile.html) */}
        <div className="flex items-center justify-between lg:hidden pt-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Quay về tủ sách"
            className="w-10 h-10 rounded-full bg-[#ffeade] flex items-center justify-center text-[#29170a] shadow-sm active:scale-95 transition-transform cursor-pointer border border-[#A67B5B]/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fff1ea] border border-[#A67B5B]/30 shadow-sm">
            <span className="text-sm">🌿</span>
            <span className="font-serif text-[15px] font-bold text-[#4c6542] truncate max-w-[180px]">
              {shelf.name}
            </span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Tùy chọn kệ sách"
              className="w-10 h-10 rounded-full bg-[#ffeade] flex items-center justify-center text-[#29170a] shadow-sm active:scale-95 transition-transform cursor-pointer border border-[#A67B5B]/20"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl z-30 p-1.5 space-y-1 border border-[#A67B5B]/30">
                <button
                  type="button"
                  onClick={handleEditShelf}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#29170a] hover:bg-[#ffeade] transition-colors text-left"
                >
                  <Edit className="w-4 h-4 text-[#735b1f]" /> Sửa kệ
                </button>
                <button
                  type="button"
                  onClick={handleShareShelf}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#29170a] hover:bg-[#ffeade] transition-colors text-left"
                >
                  <Share2 className="w-4 h-4 text-[#4c6542]" /> Chia sẻ kệ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConfirmDeleteOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" /> Xóa kệ sách
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Breadcrumbs (ke-sach-desktop.html) */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#434840]">
          <span
            onClick={() => navigate('/')}
            className="hover:text-[#4c6542] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🏠</span>
            <span>Tủ Sách Tiên Nữ</span>
          </span>
          <span className="opacity-60">/</span>
          <span className="text-[#7b414e] font-bold">Kệ Thảo Mộc</span>
          <span className="opacity-60">/</span>
          <span className="font-serif font-bold text-sm text-[#29170a] italic">
            {shelf.name} 🌿
          </span>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SHELF HEADER CARD: ONE LARGE CARD (ke-sach-desktop & mobile)       */}
        {/* ----------------------------------------------------------------- */}
        {/* Desktop View Header Card */}
        <div className="hidden lg:block relative bg-[#fff1ea] rounded-3xl p-6 sm:p-8 shadow-md overflow-hidden border border-[#A67B5B]/30">
          {/* Glass cloche shimmer & floral watermark background */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#feb2c0]/30 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#894d59] via-[#735b1f] to-[#4c6542] opacity-60" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Header: 4-Story Collage Arched Frames (md:col-span-5) */}
            <div className="md:col-span-5 flex justify-center md:justify-start">
              <div className="relative w-64 h-60 sm:w-72 sm:h-64 flex items-center justify-center">
                {/* Layer 1: Left Angled */}
                <div className="absolute left-2 bottom-3 w-28 h-40 sm:w-32 sm:h-44 rounded-t-full rounded-b-xl shadow-md transform -rotate-12 hover:-rotate-6 transition-transform duration-300 overflow-hidden bg-[#ffdcc6] border border-[#A67B5B]/30">
                  <img
                    src={leftCover}
                    alt="Bìa truyện 1"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#412c1d]/60 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white shadow-xs">
                    Tập 01
                  </span>
                </div>

                {/* Layer 2: Right Angled */}
                <div className="absolute right-2 bottom-4 w-28 h-40 sm:w-32 sm:h-44 rounded-t-full rounded-b-xl shadow-md transform rotate-12 hover:rotate-6 transition-transform duration-300 overflow-hidden bg-[#ffdcc6] border border-[#A67B5B]/30">
                  <img
                    src={rightCover}
                    alt="Bìa truyện 2"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#412c1d]/60 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 right-2 text-[10px] font-bold text-white shadow-xs">
                    Mùa Hạ
                  </span>
                </div>

                {/* Layer 3: Central Highlight Cover */}
                <div className="absolute z-10 bottom-0 w-32 h-48 sm:w-36 sm:h-52 rounded-t-full rounded-b-xl shadow-xl overflow-hidden bg-white ring-2 ring-white/80 transform hover:scale-105 transition-all duration-300 border border-[#A67B5B]/40">
                  <img
                    src={primaryCover}
                    alt={shelf.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#29170a]/70 via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#feb2c0] text-[#7b414e] flex items-center justify-center text-xs shadow-sm">
                    ✿
                  </span>
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <span className="font-serif text-sm sm:text-base font-bold text-white drop-shadow-sm block leading-tight truncate">
                      {shelf.name}
                    </span>
                    <span className="text-[10px] text-[#ffdf97] font-semibold">
                      {shelf.icon || 'Bộ Tuyển Tập'} #1
                    </span>
                  </div>
                </div>

                {/* Wax Seal Stamp & Dried Ivy Leaf Accent */}
                <div className="absolute -top-1 left-8 z-20 w-8 h-8 rounded-full bg-[#894d59] text-white shadow-md flex items-center justify-center text-xs select-none">
                  🌿
                </div>
                <div className="absolute -bottom-2 right-6 z-20 w-7 h-7 rounded-full bg-[#735b1f] text-white shadow-sm flex items-center justify-center text-[10px] select-none">
                  ✨
                </div>
              </div>
            </div>

            {/* Right Header: Shelf Metadata & CTAs (md:col-span-7) */}
            <div className="md:col-span-7 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#a8c49a] text-[#3a5230] font-bold text-xs tracking-wide">
                  ✿ KỆ RIÊNG TƯ
                </span>
                <span className="text-xs text-[#434840] font-medium">
                  Ghi chép từ vương quốc mộng mơ
                </span>
              </div>

              {/* Title & Botanical Icon */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-serif text-3xl sm:text-4xl text-[#29170a] font-bold tracking-tight">
                  {shelf.name}
                </h1>
                <span className="font-serif text-2xl text-[#894d59] italic">
                  {shelf.icon || '✿'}
                </span>
              </div>

              {/* Description */}
              <p className="font-serif italic text-base sm:text-lg text-[#434840] leading-relaxed">
                “{shelf.description || 'Những bộ truyện nhẹ nhàng, êm dịu như tách trà hoa cúc nóng giữa chiều mưa, đọc trước khi ngủ để ru hồn vào giấc mộng thần tiên.'}”
              </p>

              {/* Statistics Meta Pill */}
              <div className="flex items-center gap-3 text-[#434840] text-xs sm:text-sm flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-[#4c6542]" />
                  <strong className="text-[#29170a] font-bold">{comics.length}</strong> truyện
                </span>
                <span className="text-[#c4c8bd]">•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#894d59]" />
                  <strong className="text-[#29170a] font-bold">{completedCount}</strong> đã đọc xong
                </span>
                <span className="text-[#c4c8bd]">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#735b1f]" />
                  Cập nhật 3 ngày trước
                </span>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 flex-wrap">
                {/* Primary Honey-Gold CTA */}
                <button
                  type="button"
                  onClick={handleOpenAddPicker}
                  className="inline-flex items-center gap-2 bg-[#ffdf97] hover:bg-[#e2c37c] text-[#251a00] font-bold text-sm px-5 py-2.5 rounded-full shadow-md active:translate-y-0.5 transition-all group cursor-pointer border border-[#d7b973]"
                >
                  <Plus className="w-4 h-4 text-[#251a00] group-hover:rotate-90 transition-transform" />
                  <span>+ Thêm truyện vào kệ</span>
                </button>

                {/* Secondary Edit Shelf Button */}
                <button
                  type="button"
                  onClick={handleEditShelf}
                  className="inline-flex items-center gap-1.5 bg-[#ffeade] hover:bg-[#ffe3d2] text-[#29170a] font-bold text-sm px-4 py-2.5 rounded-full transition-all cursor-pointer border border-[#A67B5B]/20"
                >
                  <Edit className="w-4 h-4 text-[#5E4636]" />
                  <span>Sửa kệ</span>
                </button>

                {/* Dropdown Menu (...) with Botanical Options */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-10 h-10 rounded-full bg-[#ffeade] hover:bg-[#ffe3d2] text-[#29170a] flex items-center justify-center transition-all shadow-xs cursor-pointer border border-[#A67B5B]/20"
                    title="Tùy chọn khác"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-2 shadow-xl z-30 border border-[#A67B5B]/30 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={handleShareShelf}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#29170a] text-xs font-semibold hover:bg-[#ffeade] transition-colors cursor-pointer text-left w-full"
                      >
                        <Share2 className="w-4 h-4 text-[#4c6542]" />
                        <span>Chia sẻ kệ hoa</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleEditShelf}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#29170a] text-xs font-semibold hover:bg-[#ffeade] transition-colors cursor-pointer text-left w-full"
                      >
                        <Edit className="w-4 h-4 text-[#735b1f]" />
                        <span>Đổi tên kệ</span>
                      </button>
                      <div className="my-1 border-t border-[#c4c8bd]/40" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsConfirmDeleteOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#ba1a1a] text-xs font-semibold hover:bg-[#ffdad6] transition-colors cursor-pointer text-left w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Xóa kệ này</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View Header Section (ke-sach-mobile.html) */}
        <div className="flex flex-col items-center text-center space-y-3 lg:hidden pt-2">
          {/* Arched Botanical Collage Frame */}
          <div className="relative w-48 h-56 flex items-center justify-center">
            {/* Background Cloche/Arch Glow */}
            <div className="absolute inset-0 rounded-t-full rounded-b-2xl bg-gradient-to-b from-[#a8c49a]/40 via-[#ffdf97]/30 to-[#ffe3d2] shadow-inner" />
            {/* Layered Book Covers Collage */}
            <div className="relative w-40 h-48 flex items-center justify-center">
              {/* Background Layer Book Left */}
              <div className="absolute left-1 bottom-3 w-24 h-36 rounded-t-full rounded-b-lg overflow-hidden shadow-md -rotate-12 transform opacity-80 scale-90 bg-[#ffdcc6]">
                <img
                  src={leftCover}
                  alt="Bìa 1"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Background Layer Book Right */}
              <div className="absolute right-1 bottom-3 w-24 h-36 rounded-t-full rounded-b-lg overflow-hidden shadow-md rotate-12 transform opacity-80 scale-90 bg-[#ffdcc6]">
                <img
                  src={rightCover}
                  alt="Bìa 2"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Hero Center Arched Book Cover */}
              <div className="relative z-10 w-28 h-42 rounded-t-full rounded-b-xl overflow-hidden shadow-xl ring-2 ring-white">
                <img
                  alt={shelf.name}
                  className="w-full h-full object-cover"
                  src={primaryCover}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#412c1d]/40 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-[#29170a] shadow-xs whitespace-nowrap">
                  Tập đặc biệt 🌸
                </span>
              </div>
            </div>
            {/* Whimsical Botanical Leaf Ornament */}
            <div className="absolute -top-2 right-1 text-[#a8c49a] animate-pulse select-none">
              <span className="text-2xl">🌿</span>
            </div>
            <div className="absolute -bottom-2 -left-1 text-[#d7b973] select-none">
              <span className="text-xl">✨</span>
            </div>
          </div>

          {/* Shelf Meta & Titles */}
          <div className="space-y-1.5 max-w-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#feb2c0]/40 text-[#7b414e] text-[10px] font-bold">
              <span>✿</span>
              <span>KỆ RIÊNG TƯ · Ghi chép từ vương quốc mộng mơ</span>
            </div>
            <h1 className="font-serif text-2xl text-[#29170a] font-bold tracking-tight pt-1">
              {shelf.name} <span className="text-[#4c6542]">{shelf.icon || '🌿'}</span>
            </h1>
            <p className="text-xs text-[#434840] leading-relaxed px-2 italic">
              “{shelf.description || 'Những bộ truyện nhẹ nhàng, êm dịu như tách trà hoa cúc nóng giữa chiều mưa, đọc trước khi ngủ để ru hồn vào giấc mộng thần tiên.'}”
            </p>
            {/* Stats Bar */}
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-medium text-[#434840]/80">
              <span>📖 {comics.length} truyện</span>
              <span className="text-[#735b1f]">·</span>
              <span>🌿 {completedCount} đã đọc xong</span>
              <span className="text-[#735b1f]">·</span>
              <span>🕒 Cập nhật 3 ngày trước</span>
            </div>
          </div>

          {/* Shelf Action Buttons Mobile */}
          <div className="w-full space-y-2 pt-1">
            {/* Full-Width Primary Button (Warm Honey / Golden Botanical CTA) */}
            <button
              type="button"
              onClick={handleOpenAddPicker}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d7b973] via-[#ffdf97] to-[#d7b973] text-[#251a00] font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#d7b973]"
            >
              <Sparkles className="w-4 h-4 text-[#251a00]" />
              <span>+ Thêm truyện vào kệ</span>
            </button>

            {/* Dual Sub Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleEditShelf}
                className="py-2 px-3 rounded-lg bg-[#ffeade] hover:bg-[#ffe3d2] text-[#29170a] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#A67B5B]/20"
              >
                <Edit className="w-3.5 h-3.5 text-[#735b1f]" />
                <span>Sửa kệ</span>
              </button>
              <button
                type="button"
                onClick={handleShareShelf}
                className="py-2 px-3 rounded-lg bg-[#ffeade] hover:bg-[#ffe3d2] text-[#29170a] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#A67B5B]/20"
              >
                <Share2 className="w-3.5 h-3.5 text-[#4c6542]" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SORT BAR: SAME LAYOUT & STYLE AS DESIGN                           */}
        {/* ----------------------------------------------------------------- */}
        {/* Desktop Sort Bar (ke-sach-desktop.html) */}
        <div className="hidden lg:flex bg-[#fff1ea] rounded-2xl p-4 shadow-sm border border-[#A67B5B]/30 flex-row items-center justify-between gap-4">
          {/* Reorder & Sort Options */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[#434840] text-xs font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4 text-[#434840]" />
              Sắp xếp theo:
            </span>

            {/* Active Drag-and-Drop Sort Selector */}
            <button
              type="button"
              onClick={() => setSortOption('custom')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                sortOption === 'custom'
                  ? 'bg-[#ffd9df] text-[#370b18] shadow-xs border border-[#feb2c0]'
                  : 'bg-[#ffeade] hover:bg-[#ffe3d2] text-[#434840]'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Tự sắp xếp ⇄</span>
              {sortOption === 'custom' && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setSortOption('newest')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                sortOption === 'newest'
                  ? 'bg-[#4c6542] text-white shadow-xs'
                  : 'bg-[#ffeade] hover:bg-[#ffe3d2] text-[#434840]'
              }`}
            >
              Mới thêm
            </button>

            <button
              type="button"
              onClick={() => setSortOption('alphabetical')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                sortOption === 'alphabetical'
                  ? 'bg-[#4c6542] text-white shadow-xs'
                  : 'bg-[#ffeade] hover:bg-[#ffe3d2] text-[#434840]'
              }`}
            >
              Tên A-Z
            </button>

            <button
              type="button"
              onClick={() => setSortOption('rating')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                sortOption === 'rating'
                  ? 'bg-[#4c6542] text-white shadow-xs'
                  : 'bg-[#ffeade] hover:bg-[#ffe3d2] text-[#434840]'
              }`}
            >
              <span>Đánh giá cao</span>
              <span>⭐️</span>
            </button>
          </div>

          {/* View Mode & Interaction Guide Indicator */}
          <div className="flex items-center gap-3">
            {sortOption === 'custom' && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#a8c49a]/40 text-[#3a5230] text-xs font-semibold">
                <GripVertical className="w-3.5 h-3.5" />
                <span>Giữ <span className="font-mono font-bold">⠿</span> để kéo thả</span>
              </div>
            )}

            {/* Grid / List Switcher */}
            <div className="flex items-center bg-[#ffeade] rounded-full p-1 shadow-inner border border-[#A67B5B]/20">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#4c6542] shadow-xs'
                    : 'text-[#434840] hover:text-[#29170a]'
                }`}
                title="Xem dạng lưới vòm hoa"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#4c6542] shadow-xs'
                    : 'text-[#434840] hover:text-[#29170a]'
                }`}
                title="Xem dạng danh sách thư tịch"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sort Chips & View Modes (ke-sach-mobile.html) */}
        <div className="flex flex-col space-y-2 lg:hidden pt-2">
          <div className="flex items-center justify-between">
            {/* Arched Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSortOption('custom')}
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  sortOption === 'custom'
                    ? 'bg-[#4c6542] text-white'
                    : 'bg-[#ffeade] text-[#434840]'
                }`}
              >
                <span>Tự sắp xếp</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setSortOption('newest')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  sortOption === 'newest'
                    ? 'bg-[#4c6542] text-white'
                    : 'bg-[#ffeade] text-[#434840]'
                }`}
              >
                Mới thêm
              </button>
              <button
                type="button"
                onClick={() => setSortOption('rating')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-0.5 cursor-pointer whitespace-nowrap ${
                  sortOption === 'rating'
                    ? 'bg-[#4c6542] text-white'
                    : 'bg-[#ffeade] text-[#434840]'
                }`}
              >
                <span>Đánh giá</span>
                <span className="text-[#735b1f]">★</span>
              </button>
              <button
                type="button"
                onClick={() => setSortOption('alphabetical')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  sortOption === 'alphabetical'
                    ? 'bg-[#4c6542] text-white'
                    : 'bg-[#ffeade] text-[#434840]'
                }`}
              >
                Tên A-Z
              </button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-[#ffeade] rounded-lg p-0.5 ml-2 shrink-0 border border-[#A67B5B]/20">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#4c6542] shadow-xs'
                    : 'text-[#434840]/70'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#4c6542] shadow-xs'
                    : 'text-[#434840]/70'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reorder Helper Caption */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-[#434840]/70 flex items-center gap-1">
              <GripVertical className="w-3 h-3" /> Giữ ⠿ để kéo thả thứ tự truyện
            </span>
            <span className="text-[11px] font-bold text-[#4c6542]">
              {comics.length} tác phẩm
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* COMIC CARD GRID: USING EXISTING ComicCard COMPONENT               */}
        {/* ----------------------------------------------------------------- */}
        {sortedComics.length === 0 ? (
          /* Empty state only when shelf has no comics */
          <div className="mt-2">
            <EmptyState
              icon="🌿"
              title="Kệ này còn ngát hương gỗ mới ✨"
              description="Kệ này còn trống, hãy thêm vài bộ truyện nàng yêu thích nhé! Nhà kính còn nhiều khoảng trống tắm nắng sớm."
              actionText="+ Thêm truyện vào kệ"
              onAction={handleOpenAddPicker}
            />
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
                : 'flex flex-col gap-3'
            }
          >
            {sortedComics.map((comic, index) => {
              const isDraggingThis = draggedComicId === comic.id;
              const isOverThis = dragOverComicId === comic.id;

              return (
                <div
                  key={comic.id}
                  draggable={sortOption === 'custom'}
                  onDragStart={(e) => {
                    if (sortOption !== 'custom') return;
                    setDraggedComicId(comic.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (sortOption !== 'custom') return;
                    e.preventDefault();
                    if (dragOverComicId !== comic.id) {
                      setDragOverComicId(comic.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverComicId === comic.id) {
                      setDragOverComicId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (sortOption !== 'custom') return;
                    e.preventDefault();
                    handleDropOnComic(comic.id);
                  }}
                  className={`relative transition-all duration-200 group ${
                    isDraggingThis ? 'opacity-40 scale-95' : ''
                  } ${
                    isOverThis && !isDraggingThis
                      ? 'ring-2 ring-[#4c6542] ring-offset-2 scale-[1.02] rounded-3xl'
                      : ''
                  }`}
                >
                  {/* Drag Handle Indicator in Custom Sort mode */}
                  {sortOption === 'custom' && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-[#29170a] shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#ffd9df] transition-colors border border-[#A67B5B]/20"
                        title="Kéo thả để sắp xếp vị trí"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Manual Move Nudge Buttons (Touch/Mobile Friendly) */}
                      <div className="hidden group-hover:flex items-center gap-0.5 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-[#A67B5B]/20 p-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualMove(comic.id, 'left');
                          }}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-full hover:bg-[#ffeade] flex items-center justify-center text-[#29170a] disabled:opacity-30 cursor-pointer"
                          title="Chuyển sang trước"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualMove(comic.id, 'right');
                          }}
                          disabled={index === sortedComics.length - 1}
                          className="w-6 h-6 rounded-full hover:bg-[#ffeade] flex items-center justify-center text-[#29170a] disabled:opacity-30 cursor-pointer"
                          title="Chuyển sang sau"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing ComicCard Component */}
                  <ComicCard
                    comic={comic}
                    onToggleFavorite={handleToggleFavorite}
                    onQuickRead={handleQuickRead}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL / BOTTOM DRAWER: ADD COMIC TO SHELF PICKER                    */}
      {/* ------------------------------------------------------------------- */}
      <ResponsiveDrawer
        isOpen={isAddPickerOpen}
        onClose={() => setIsAddPickerOpen(false)}
        title="Thêm truyện vào kệ sách 🌸"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[#806350]">
            Chọn truyện từ tủ sách để xếp vào kệ <strong>{shelf.name}</strong>:
          </p>

          {/* Search bar inside picker */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#806350]" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Tìm theo tên truyện, tác giả, thể loại..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[#FFF8F5] border border-[#D9B99B] focus:outline-none focus:border-[#7FAF6B] focus:ring-1 focus:ring-[#7FAF6B] text-[#5E4636]"
            />
          </div>

          {/* Comics list */}
          <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
            {isLoadingPicker ? (
              <div className="py-8 text-center text-xs text-[#806350]">
                Đang tìm những cuốn truyện...
              </div>
            ) : filteredAvailableComics.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#806350]">
                {pickerSearch
                  ? 'Không tìm thấy truyện phù hợp.'
                  : 'Tất cả truyện đã có mặt trong kệ này rồi! 🌿'}
              </div>
            ) : (
              filteredAvailableComics.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF8F5] border border-[#D9B99B] hover:border-[#A67B5B] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.cover_url}
                      alt={c.title}
                      className="w-10 h-14 object-cover rounded-lg border border-[#D9B99B]"
                    />
                    <div>
                      <h4 className="text-xs md:text-sm font-serif font-bold text-[#5E4636] line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-[#806350] line-clamp-1">
                        {c.author} · {c.total_chapters} chương
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="honey"
                    onClick={() => handleAddComicToShelf(c)}
                    iconLeft={<Plus size={13} />}
                  >
                    Thêm
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddPickerOpen(false)}
            >
              Đóng lại
            </Button>
          </div>
        </div>
      </ResponsiveDrawer>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL / BOTTOM DRAWER: CREATE NEW SHELF                             */}
      {/* ------------------------------------------------------------------- */}
      <ResponsiveDrawer
        isOpen={isCreateShelfOpen}
        onClose={() => setIsCreateShelfOpen(false)}
        title="Dựng kệ sách mới 🌿"
      >
        <form onSubmit={handleCreateShelfSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Biểu tượng kệ
            </label>
            <div className="flex gap-2">
              {['🌸', '🌿', '☕', '✨', '📖', '🍯', '🌙', '🌷'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewShelfIcon(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border-1.5 transition-all cursor-pointer ${
                    newShelfIcon === emoji
                      ? 'bg-[#F2A7B5] border-[#A67B5B] shadow-xs'
                      : 'bg-[#FFF8F5] border-[#D9B99B] hover:bg-[#F6EBDD]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Tên kệ sách *
            </label>
            <input
              type="text"
              required
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="VD: Truyện Chữa Lành, Cổ Tích Mùa Hạ..."
              className="w-full px-3.5 py-2 text-xs md:text-sm rounded-xl bg-[#FFF8F5] border border-[#D9B99B] focus:outline-none focus:border-[#7FAF6B] text-[#5E4636]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={newShelfDesc}
              onChange={(e) => setNewShelfDesc(e.target.value)}
              placeholder="Cảm xúc hoặc lời tựa nhẹ nhàng cho góc nhỏ này..."
              className="w-full px-3.5 py-2 text-xs md:text-sm rounded-xl bg-[#FFF8F5] border border-[#D9B99B] focus:outline-none focus:border-[#7FAF6B] text-[#5E4636]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateShelfOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Tạo kệ mới ✿
            </Button>
          </div>
        </form>
      </ResponsiveDrawer>

      {/* ------------------------------------------------------------------- */}
      {/* CONFIRM DELETE SHELF MODAL                                          */}
      {/* ------------------------------------------------------------------- */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFF8F5] border-2 border-[#A67B5B] rounded-3xl p-6 max-w-sm w-full shadow-botanical-lg flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#BA1A1A]">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Xóa kệ sách này?</h3>
            </div>
            <p className="text-xs text-[#806350] leading-relaxed">
              Kệ <strong>"{shelf.name}"</strong> sẽ được gỡ bỏ khỏi tủ sách. Các
              truyện bên trong vẫn được lưu trữ nguyên vẹn trong mục Tất Cả
              Truyện.
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDeleteShelf}
                disabled={isDeleting}
                className="bg-[#BA1A1A] hover:bg-[#93000A] text-white border-transparent"
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
