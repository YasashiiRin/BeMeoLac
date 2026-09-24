import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Comic, Shelf, ComicStatus, SortOption } from '../types';
import { getComics, toggleFavorite, updateComicProgress, comicsService, ComicSummary } from '../services/comicService';
import { getShelves, createShelf, shelvesService } from '../services/shelfService';
import { ComicCard } from '../components/ComicCard';
import { StatusChip } from '../components/StatusChip';
import { TagChip } from '../components/TagChip';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { ResponsiveDrawer } from '../components/ResponsiveDrawer';
import { Sidebar } from '../components/layout/Sidebar';
import { VineProgressBar } from '../components/VineProgressBar';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  Download,
  BookOpen,
  LayoutGrid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Coffee,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const BookshelfPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Data states
  const [comics, setComics] = useState<Comic[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [summary, setSummary] = useState<ComicSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedShelfId, setSelectedShelfId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ComicStatus | 'all'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('updated_at');
  const [onlyHasNew, setOnlyHasNew] = useState(false);
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [isCreateShelfOpen, setIsCreateShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfIcon, setNewShelfIcon] = useState('🌸');
  const [newShelfDesc, setNewShelfDesc] = useState('');

  // Fetch shelves and summary
  const fetchShelves = async () => {
    try {
      const data = await shelvesService.list();
      setShelves(data);
    } catch (err) {
      console.error('Error fetching shelves:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await comicsService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    fetchShelves();
    fetchSummary();
  }, []);

  // Fetch comics
  const loadComics = async () => {
    setIsLoading(true);
    try {
      const response = await getComics({
        shelf_id: selectedShelfId,
        status: selectedStatus,
        genre: selectedGenre,
        source: selectedSource,
        sort: selectedSort,
        has_new_chapter: onlyHasNew ? true : undefined,
        is_favorite: onlyFavorite ? true : undefined,
        search: searchQuery,
        page: currentPage,
        page_size: 10,
      });
      setComics(response.items);
      setTotalCount(response.total);
    } catch (err) {
      console.error('Error fetching comics:', err);
      showToast('Không thể tải danh sách truyện', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComics();
  }, [
    selectedShelfId,
    selectedStatus,
    selectedGenre,
    selectedSource,
    selectedSort,
    onlyHasNew,
    onlyFavorite,
    searchQuery,
    currentPage,
  ]);

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

  // Handlers
  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await toggleFavorite(id);
      setComics((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_favorite: updated.is_favorite } : c))
      );
      showToast(
        updated.is_favorite
          ? `Đã cài nơ lưu "${updated.title}" vào mục yêu thích! 🌸`
          : `Đã bỏ yêu thích "${updated.title}"`,
        'info'
      );
    } catch (err) {
      showToast('Lỗi cập nhật yêu thích', 'error');
    }
  };

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
      showToast(`Đã ghi nhận đọc chương ${nextChapter} của "${comic.title}"! 🌿`, 'success');
    } catch (err) {
      showToast('Lỗi cập nhật tiến độ đọc', 'error');
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    try {
      const created = await createShelf({
        name: newShelfName.trim(),
        icon: newShelfIcon,
        description: newShelfDesc.trim(),
      });
      setShelves((prev) => [...prev, created]);
      setSelectedShelfId(created.id);
      setIsCreateShelfOpen(false);
      setNewShelfName('');
      setNewShelfDesc('');
      showToast(`Kệ sách mới "${created.name}" đã được dựng lên! 🌿`, 'success');
      fetchShelves();
      fetchSummary();
    } catch (err) {
      showToast('Không thể tạo kệ mới', 'error');
    }
  };

  const handleExportList = () => {
    const jsonStr = JSON.stringify(comics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TuTruyenNho_DanhSach_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất toàn bộ danh sách truyện thành công! 📜', 'success');
  };

  // Status Counts
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Shelf Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          shelves={shelves}
          activeShelfId="all"
          summary={summary}
          onSelectShelf={(id) => {
            if (id === 'all') {
              setSelectedShelfId('all');
              setCurrentPage(1);
            } else {
              navigate(`/shelves/${id}`);
            }
          }}
          onOpenCreateShelfModal={() => setIsCreateShelfOpen(true)}
        />
      </div>

      {/* Main Bookshelf Column */}
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-w-0">
        {/* Mobile Search Bar (as in Image 3.jpeg) */}
        <div className="block md:hidden">
          <SearchBar
            value={searchQuery}
            onChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            showFilterButton={true}
            onFilterClick={() => {
              // toggle filter bar visibility or scroll
            }}
          />
        </div>

        {/* Hero Bookshelf Header Banner */}
        <div className="relative bg-sunbeam-gradient border-1.5 border-[#A67B5B] rounded-3xl p-4 sm:p-6 shadow-botanical overflow-hidden">
          {/* Subtle background ornament */}
          <div className="absolute top-2 right-4 text-6xl opacity-10 pointer-events-none select-none">
            🌿
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            {/* Title & Reading Metrics */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5E4636]">
                  Tủ Sách Của Tôi
                </h1>
                <span className="text-[#F2A7B5] text-lg">✿</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3D38A] text-[#5E4636] border border-[#A67B5B] shadow-xs">
                  <Sparkles size={12} className="text-[#A67B5B]" />
                  <span>Đã lưu {summary?.total ?? 0} truyện</span>
                  <span className="text-xs">✨</span>
                </span>
                <span className="inline-flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B]">
                  +{summary?.new_chapters ?? 0} mới
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#806350] mt-1.5 flex items-center gap-2 flex-wrap">
                <span>
                  <strong className="text-[#5E4636]">{summary?.by_status.reading ?? 0}</strong> đang đọc
                </span>
                <span>·</span>
                <span>
                  <strong className="text-[#5E4636]">{summary?.by_status.completed ?? 0}</strong> đã hoàn thành 🌿
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="text-[#7FAF6B] font-medium hidden sm:inline">
                  🌸 {summary?.new_chapters ?? 0} chương mới đơm hoa hôm nay
                </span>
                <span className="sm:hidden">
                  · <strong className="text-[#5E4636]">{summary?.by_status.plan_to_read ?? 0}</strong> dự định
                </span>
              </p>
            </div>

            {/* Quick Actions (Desktop & Mobile) */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportList}
                iconLeft={<Download className="w-3.5 h-3.5 text-[#A67B5B]" />}
              >
                Xuất danh sách
              </Button>

              <Button
                variant="honey"
                size="sm"
                onClick={() => navigate('/stats')}
                iconLeft={<BookOpen className="w-3.5 h-3.5 text-[#5E4636]" />}
              >
                Nhật ký đọc ✨
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Shelves Horizontal Scroll (Image 3.jpeg) */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif text-sm font-bold text-[#5E4636] flex items-center gap-1">
              <span>Kệ Sách Của Tôi</span>
              <span className="text-xs text-[#7FAF6B]">🌿</span>
            </span>
            <button
              type="button"
              onClick={() => setIsCreateShelfOpen(true)}
              className="text-xs font-semibold text-[#7FAF6B] hover:text-[#4C6542] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Tạo kệ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {shelves.map((shelf) => {
              const isActive = shelf.id === 'all';
              return (
                <button
                  key={shelf.id}
                  type="button"
                  onClick={() => {
                    if (shelf.id === 'all') {
                      setSelectedShelfId('all');
                      setCurrentPage(1);
                    } else {
                      navigate(`/shelves/${shelf.id}`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-1.5 transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                    isActive
                      ? 'bg-[#F2A7B5] text-[#5E4636] border-[#A67B5B] font-bold shadow-botanical-sm'
                      : 'bg-[#FFF8F5] text-[#5E4636] border-[#D9B99B] hover:bg-[#F6EBDD]'
                  }`}
                >
                  <span>{shelf.icon}</span>
                  <span>{shelf.name}</span>
                  <span className="text-[11px] px-1.5 py-0.2 bg-[#F6EBDD] text-[#806350] rounded-full tabular-nums">
                    {shelf.comic_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter Tabs (Desktop & Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <StatusChip
            status="all"
            label="Tất cả"
            count={summary?.total ?? 0}
            isActive={selectedStatus === 'all'}
            onClick={() => {
              setSelectedStatus('all');
              setCurrentPage(1);
            }}
          />
          <StatusChip
            status="reading"
            label="Đang đọc"
            count={summary?.by_status.reading ?? 0}
            isActive={selectedStatus === 'reading'}
            onClick={() => {
              setSelectedStatus('reading');
              setCurrentPage(1);
            }}
          />
          <StatusChip
            status="completed"
            label="Đã đọc xong"
            count={summary?.by_status.completed ?? 0}
            isActive={selectedStatus === 'completed'}
            onClick={() => {
              setSelectedStatus('completed');
              setCurrentPage(1);
            }}
          />
          <StatusChip
            status="plan_to_read"
            label="Muốn đọc"
            count={summary?.by_status.plan_to_read ?? 0}
            isActive={selectedStatus === 'plan_to_read'}
            onClick={() => {
              setSelectedStatus('plan_to_read');
              setCurrentPage(1);
            }}
          />
          <StatusChip
            status="on_hold"
            label="Tạm dừng"
            count={summary?.by_status.on_hold ?? 0}
            isActive={selectedStatus === 'on_hold'}
            onClick={() => {
              setSelectedStatus('on_hold');
              setCurrentPage(1);
            }}
          />
          <StatusChip
            status="dropped"
            label="Bỏ dở"
            count={summary?.by_status.dropped ?? 0}
            isActive={selectedStatus === 'dropped'}
            onClick={() => {
              setSelectedStatus('dropped');
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filters and View Switcher Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFF8F5] border border-[#D9B99B] rounded-2xl p-2.5 sm:p-3 shadow-botanical-sm">
          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Genre Filter */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[#F6EBDD] text-[#5E4636] text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl border border-[#D9B99B] focus:border-[#7FAF6B] focus:outline-none cursor-pointer"
              >
                <option value="all">Thể loại: Tất cả</option>
                <option value="chữa lành">Thể loại: Chữa lành</option>
                <option value="kỳ ảo">Thể loại: Kỳ ảo</option>
                <option value="lãng mạn">Thể loại: Lãng mạn</option>
                <option value="phiêu lưu">Thể loại: Phiêu lưu</option>
                <option value="đời thường">Thể loại: Đời thường</option>
                <option value="nhà kính">Thể loại: Nhà kính</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#806350]">
                ▾
              </span>
            </div>

            {/* Source Filter */}
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[#F6EBDD] text-[#5E4636] text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl border border-[#D9B99B] focus:border-[#7FAF6B] focus:outline-none cursor-pointer"
              >
                <option value="all">Nguồn: Mọi nguồn</option>
                <option value="Cuutruyen">Nguồn: Cuutruyen</option>
                <option value="Kakao">Nguồn: Kakao</option>
                <option value="BlogTruyen">Nguồn: BlogTruyen</option>
                <option value="Bilibili">Nguồn: Bilibili</option>
                <option value="Webtoon">Nguồn: Webtoon</option>
                <option value="Hako">Nguồn: Hako</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#806350]">
                ▾
              </span>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[#F6EBDD] text-[#5E4636] text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl border border-[#D9B99B] focus:border-[#7FAF6B] focus:outline-none cursor-pointer"
              >
                <option value="updated_at">Sắp xếp: Mới cập nhật</option>
                <option value="title">Sắp xếp: Tên truyện A-Z</option>
                <option value="rating">Sắp xếp: Đánh giá cao nhất</option>
                <option value="progress">Sắp xếp: Tiến độ đọc</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#806350]">
                ▾
              </span>
            </div>
          </div>

          {/* Quick filter badges & View Switcher */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Has new chapter toggle */}
            <button
              type="button"
              onClick={() => {
                setOnlyHasNew(!onlyHasNew);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${
                onlyHasNew
                  ? 'bg-[#F2A7B5] text-[#5E4636] border-[#A67B5B] font-semibold'
                  : 'bg-[#F6EBDD] text-[#5E4636] border-[#D9B99B] hover:bg-[#EFE1CF]'
              }`}
            >
              <span>🌸</span>
              <span>Có chương mới</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
            </button>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => {
                setOnlyFavorite(!onlyFavorite);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border-1.5 transition-all hidden sm:flex items-center gap-1.5 cursor-pointer ${
                onlyFavorite
                  ? 'bg-[#FDE8B5] text-[#5E490C] border-[#D7B973] font-semibold'
                  : 'bg-[#F6EBDD] text-[#5E4636] border-[#D9B99B] hover:bg-[#EFE1CF]'
              }`}
            >
              <span className="text-[#D7B973]">★</span>
              <span>Đã đánh dấu sao</span>
            </button>

            {/* Grid / List View Toggle */}
            <div className="hidden sm:flex items-center bg-[#F6EBDD] p-0.5 rounded-xl border border-[#D9B99B]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#FFF8F5] text-[#5E4636] shadow-xs'
                    : 'text-[#806350] hover:text-[#5E4636]'
                }`}
                aria-label="Dạng lưới"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#FFF8F5] text-[#5E4636] shadow-xs'
                    : 'text-[#806350] hover:text-[#5E4636]'
                }`}
                aria-label="Dạng danh sách"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Comics Display Area */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div
                key={n}
                className="bg-[#F6EBDD]/60 arch-card p-3 border border-[#D9B99B] animate-pulse flex flex-col gap-3"
              >
                <div className="w-full aspect-[3/4] arch-card-sm bg-[#EFE1CF]" />
                <div className="h-4 bg-[#EFE1CF] rounded-md w-3/4" />
                <div className="h-3 bg-[#EFE1CF] rounded-md w-1/2" />
                <div className="h-2 bg-[#EFE1CF] rounded-full w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : comics.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Kệ hoa chưa có cuốn truyện này"
            description="Bạn có thể thử tìm kiếm từ khóa khác, điều chỉnh bộ lọc hoặc gieo thêm mầm truyện mới vào thư viện."
            actionText="Xem tất cả truyện"
            onAction={() => {
              setSelectedShelfId('all');
              setSelectedStatus('all');
              setSelectedGenre('all');
              setSelectedSource('all');
              setOnlyHasNew(false);
              setOnlyFavorite(false);
              setSearchQuery('');
            }}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View: 2 cols on mobile, 3 on sm, 4 on lg, 5 on xl */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
            {comics.map((comic) => (
              <ComicCard
                key={comic.id}
                comic={comic}
                onToggleFavorite={handleToggleFavorite}
                onQuickRead={handleQuickRead}
              />
            ))}
          </div>
        ) : (
          /* List View Alternative */
          <div className="flex flex-col gap-3">
            {comics.map((comic) => {
              const primarySource =
                comic.sources.find((s) => s.id === comic.primary_source_id) ||
                comic.sources[0] || { site_name: 'Cuutruyen' };
              const isCompleted =
                comic.status === 'completed' ||
                comic.current_chapter >= comic.total_chapters;

              return (
                <div
                  key={comic.id}
                  onClick={() => navigate(`/comics/${comic.id}`)}
                  className="flex items-center gap-4 p-3.5 bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-2xl shadow-botanical hover:shadow-botanical-lg transition-all cursor-pointer group"
                >
                  <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-[#F6EBDD] shrink-0 border border-[#D9B99B]">
                    <img
                      src={comic.cover_url}
                      alt={comic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#29170A]/70 text-white">
                        {primarySource.site_name}
                      </span>
                      {comic.has_new_chapter && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2A7B5] text-[#5E4636] font-bold">
                          MỚI ✿
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A8C49A] text-[#1E3314] font-bold">
                          HOÀN THÀNH 🌿
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-semibold text-base text-[#5E4636] group-hover:text-[#7A563C] truncate">
                      {comic.title}
                    </h3>
                    <p className="text-xs text-[#806350] italic">
                      tác giả {comic.author}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span>★ {comic.rating.toFixed(1)}</span>
                      <span>
                        Chương {comic.current_chapter}/{comic.total_chapters}
                      </span>
                      <div className="w-28 hidden sm:block">
                        <VineProgressBar
                          current={comic.current_chapter}
                          total={comic.total_chapters}
                          height="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile "Xem thêm truyện khác" Button (Image 3.jpeg) */}
        {comics.length > 0 && (
          <div className="block sm:hidden mt-2">
            <button
              type="button"
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage((p) => p + 1);
                } else {
                  showToast('Đã xem đến cuốn truyện cuối cùng trên kệ hoa!', 'info');
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#F3D38A] to-[#D7B973] border-1.5 border-[#A67B5B] text-sm font-bold text-[#5E4636] shadow-botanical flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
            >
              <span>✨</span>
              <span>Xem thêm truyện khác</span>
              <span>✿</span>
            </button>
            <p className="text-center text-xs text-[#806350] mt-2 italic">
              Đang hiển thị {comics.length} / {totalCount} cuốn truyện trên kệ hoa
            </p>
          </div>
        )}

        {/* Desktop Pagination Bar (Image 1.jpeg) */}
        {comics.length > 0 && (
          <div className="hidden sm:flex items-center justify-between p-3.5 bg-[#FFF8F5] border border-[#D9B99B] rounded-2xl text-xs text-[#806350] shadow-botanical-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#7FAF6B]">🌿</span>
              <span>
                Hiển thị 1 - {comics.length} trong số{' '}
                <strong className="text-[#5E4636]">{totalCount}</strong> cuốn truyện trên kệ hoa
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#D9B99B] hover:bg-[#F6EBDD] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#F2A7B5] text-[#5E4636] border border-[#A67B5B] shadow-xs'
                      : 'border border-[#D9B99B] hover:bg-[#F6EBDD] text-[#806350]'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#D9B99B] hover:bg-[#F6EBDD] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Trang sau"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Reading Challenge Card (Image 3.jpeg) */}
        <div className="block lg:hidden mt-2 bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-4 shadow-botanical">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#5E4636]">
                  Giờ Trà & Thử Thách
                </h4>
                <p className="text-[11px] text-[#806350]">Mục tiêu đọc truyện</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-serif font-bold text-sm text-[#5E4636]">
                {summary?.by_status.completed ?? 0}/{summary?.total ?? 0}
              </span>{' '}
              <span className="text-xs text-[#806350]">bộ truyện</span>
            </div>
          </div>

          <VineProgressBar
            current={summary?.by_status.completed ?? 0}
            total={summary?.total || 1}
            variant="fairy"
            height="md"
          />

          <div className="mt-3 pt-2.5 border-t border-[#D9B99B]/50 flex items-center justify-between text-xs">
            <span className="text-[#806350] flex items-center gap-1">
              <span>✨</span>
              <span>Có <strong>{summary?.new_chapters ?? 0} chương mới</strong> đang chờ</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#CFE8D5] text-[#3A5230] font-bold border border-[#7FAF6B]">
              Tiên Cỏ 🌿
            </span>
          </div>
        </div>
      </div>

      {/* Modal / Bottom Sheet: Create New Shelf */}
      <ResponsiveDrawer
        isOpen={isCreateShelfOpen}
        onClose={() => setIsCreateShelfOpen(false)}
        title="Tạo Kệ Sách Mới ✿"
        subtitle="Sắp xếp những cuốn truyện theo từng góc nhỏ thần tiên"
        maxWidth="md"
      >
        <form onSubmit={handleCreateShelf} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Biểu tượng kệ
            </label>
            <div className="flex items-center gap-2">
              {['🌸', '🌿', '📖', '✨', '🎨', '📜', '🦋', '🍄', '☕'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewShelfIcon(ic)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-1.5 transition-all cursor-pointer ${
                    newShelfIcon === ic
                      ? 'bg-[#F2A7B5] border-[#A67B5B] shadow-sm scale-105'
                      : 'bg-[#F6EBDD] border-[#D9B99B] hover:bg-[#FFF8F5]'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Tên kệ sách <span className="text-[#BA1A1A]">*</span>
            </label>
            <input
              type="text"
              required
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="VD: Truyện tranh mùa đông..."
              className="w-full px-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Mô tả kệ
            </label>
            <textarea
              rows={3}
              value={newShelfDesc}
              onChange={(e) => setNewShelfDesc(e.target.value)}
              placeholder="Vài dòng tâm tình về kệ sách này..."
              className="w-full px-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#D9B99B]/60 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="text"
              onClick={() => setIsCreateShelfOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Tạo kệ sách
            </Button>
          </div>
        </form>
      </ResponsiveDrawer>
    </div>
  );
};
