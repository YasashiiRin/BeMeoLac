import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Comic, ComicStatus, Source, Shelf } from '../types';
import { comicsService } from '../services/comicService';
import { shelvesService } from '../services/shelfService';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  X,
  Heart,
  Bookmark,
  BookOpen,
  Clock,
  Sparkles,
  Share2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ExternalLink,
  Minus,
  Check,
  ChevronDown,
  Layers,
  Link as LinkIcon,
  Globe,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const ComicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Core Comic Data
  const [comic, setComic] = useState<Comic | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Note State & Auto-save
  const [noteText, setNoteText] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const noteDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Status Dropdown
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // "..." Options Menu
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Delete Confirm Modal
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Comic Modal
  const [isEditComicOpen, setIsEditComicOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTotalChapters, setEditTotalChapters] = useState(100);

  // Source Management Modals / State
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceSiteName, setSourceSiteName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceChapterUrl, setSourceChapterUrl] = useState('');

  // Add To Shelf Modal
  const [isAddToShelfOpen, setIsAddToShelfOpen] = useState(false);

  // Synopsis expand toggle
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // Load Comic & Shelves
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [foundComic, allShelves] = await Promise.all([
          comicsService.getComicById(id),
          shelvesService.list(),
        ]);

        if (!isMounted) return;
        if (foundComic) {
          setComic(foundComic);
          setNoteText(foundComic.note || '');
          setEditTitle(foundComic.title);
          setEditAuthor(foundComic.author);
          setEditDescription(foundComic.description);
          setEditTotalChapters(foundComic.total_chapters);
        }
        setShelves(allShelves);
      } catch (err) {
        console.error('Error fetching comic details:', err);
        showToast('Không thể tải chi tiết truyện', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, showToast]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on Escape key for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close handler: back or to root
  const handleCloseModal = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Stepper: "-" and "+" instant optimistic update
  const handleStepChapter = async (delta: number) => {
    if (!comic) return;
    const newChapter = Math.min(
      comic.total_chapters,
      Math.max(0, comic.current_chapter + delta)
    );
    if (newChapter === comic.current_chapter) return;

    // Optimistic update
    setComic((prev) => (prev ? { ...prev, current_chapter: newChapter } : null));

    try {
      const updated = await comicsService.updateProgress(comic.id, newChapter);
      setComic(updated);
    } catch (err) {
      console.error('Failed to update chapter progress:', err);
      showToast('Lỗi cập nhật chương đọc', 'error');
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus: ComicStatus) => {
    if (!comic) return;
    setIsStatusMenuOpen(false);
    setComic((prev) => (prev ? { ...prev, status: newStatus } : null));
    try {
      const updated = await comicsService.update(comic.id, { status: newStatus });
      setComic(updated);
      showToast('Đã cập nhật trạng thái đọc 🌿', 'info');
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  // Heart Rating Change
  const handleRate = async (newRating: number) => {
    if (!comic) return;
    setComic((prev) => (prev ? { ...prev, rating: newRating } : null));
    try {
      const updated = await comicsService.update(comic.id, { rating: newRating });
      setComic(updated);
      showToast(`Đã lưu đánh giá ${newRating} sao 🌸`, 'success');
    } catch (err) {
      showToast('Lỗi cập nhật đánh giá', 'error');
    }
  };

  // Favorite Toggle
  const handleToggleFavorite = async () => {
    if (!comic) return;
    const nextFav = !comic.is_favorite;
    setComic((prev) => (prev ? { ...prev, is_favorite: nextFav } : null));
    try {
      const updated = await comicsService.update(comic.id, { is_favorite: nextFav });
      setComic(updated);
      showToast(
        nextFav ? 'Đã ghim vào danh sách Yêu thích ✿' : 'Đã bỏ ghim yêu thích',
        'info'
      );
    } catch (err) {
      showToast('Lỗi cập nhật yêu thích', 'error');
    }
  };

  // Auto-saving Note Handler
  const handleNoteChange = (text: string) => {
    setNoteText(text);
    setNoteSaveStatus('saving');

    if (noteDebounceTimer.current) {
      clearTimeout(noteDebounceTimer.current);
    }

    noteDebounceTimer.current = setTimeout(async () => {
      if (!comic) return;
      try {
        const updated = await comicsService.update(comic.id, { note: text });
        setComic(updated);
        setNoteSaveStatus('saved');
        setTimeout(() => setNoteSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error auto-saving note:', err);
        setNoteSaveStatus('idle');
      }
    }, 600);
  };

  // Primary Source
  const primarySource = useMemo(() => {
    if (!comic) return null;
    return (
      comic.sources.find((s) => s.id === comic.primary_source_id) ||
      comic.sources[0] ||
      null
    );
  }, [comic]);

  // "Đọc tiếp" action -> opens primary source chapter_url in new tab
  const handleReadNext = () => {
    if (!comic) return;
    const targetUrl = primarySource?.chapter_url || primarySource?.url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('Chưa có liên kết đọc cho truyện này', 'info');
    }
  };

  // Set source as primary
  const handleSetPrimarySource = async (sourceId: string) => {
    if (!comic) return;
    try {
      const updated = await comicsService.update(comic.id, {
        primary_source_id: sourceId,
      });
      setComic(updated);
      const targetSource = updated.sources.find((s) => s.id === sourceId);
      showToast(`Đã đặt ${targetSource?.site_name || 'nguồn'} làm nguồn chính ★`, 'success');
    } catch (err) {
      showToast('Lỗi đặt nguồn chính', 'error');
    }
  };

  // Delete source
  const handleDeleteSource = async (sourceId: string) => {
    if (!comic) return;
    const updatedSources = comic.sources.filter((s) => s.id !== sourceId);
    let newPrimaryId = comic.primary_source_id;
    if (comic.primary_source_id === sourceId) {
      newPrimaryId = updatedSources[0]?.id || '';
    }

    try {
      const updated = await comicsService.update(comic.id, {
        sources: updatedSources,
        primary_source_id: newPrimaryId,
      });
      setComic(updated);
      showToast('Đã gỡ nguồn đọc', 'info');
    } catch (err) {
      showToast('Lỗi gỡ nguồn đọc', 'error');
    }
  };

  // Open Add/Edit source form
  const handleOpenAddSource = () => {
    setEditingSourceId(null);
    setSourceSiteName('');
    setSourceUrl('');
    setSourceChapterUrl('');
    setIsAddSourceOpen(true);
  };

  const handleOpenEditSource = (source: Source) => {
    setEditingSourceId(source.id);
    setSourceSiteName(source.site_name);
    setSourceUrl(source.url);
    setSourceChapterUrl(source.chapter_url || '');
    setIsAddSourceOpen(true);
  };

  // Save Source (Add / Edit)
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comic || !sourceSiteName.trim()) return;

    let updatedSources = [...comic.sources];
    if (editingSourceId) {
      // Edit existing
      updatedSources = updatedSources.map((s) =>
        s.id === editingSourceId
          ? {
              ...s,
              site_name: sourceSiteName.trim(),
              url: sourceUrl.trim() || s.url,
              chapter_url: sourceChapterUrl.trim() || s.chapter_url,
            }
          : s
      );
    } else {
      // Add new
      const newSource: Source = {
        id: `src_${Date.now()}`,
        site_name: sourceSiteName.trim(),
        url: sourceUrl.trim() || 'https://cuutruyen.net',
        favicon_url: '',
        chapter_url: sourceChapterUrl.trim() || sourceUrl.trim(),
        latest_chapter: comic.total_chapters,
        is_alive: true,
        last_checked_at: new Date().toISOString(),
      };
      updatedSources.push(newSource);
    }

    try {
      const updated = await comicsService.update(comic.id, {
        sources: updatedSources,
        primary_source_id: comic.primary_source_id || updatedSources[0]?.id,
      });
      setComic(updated);
      setIsAddSourceOpen(false);
      showToast(
        editingSourceId ? 'Đã cập nhật nguồn đọc 🌿' : 'Đã thêm nguồn đọc mới 🌸',
        'success'
      );
    } catch (err) {
      showToast('Lỗi lưu nguồn đọc', 'error');
    }
  };

  // Delete Comic
  const handleConfirmDeleteComic = async () => {
    if (!comic) return;
    setIsDeleting(true);
    try {
      await comicsService.deleteComic(comic.id);
      showToast(`Đã xóa truyện "${comic.title}" khỏi tủ sách 🌿`, 'info');
      setIsConfirmDeleteOpen(false);
      navigate('/');
    } catch (err) {
      showToast('Lỗi xóa truyện', 'error');
      setIsDeleting(false);
    }
  };

  // Save Edit Comic Info
  const handleSaveComicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comic || !editTitle.trim()) return;

    try {
      const updated = await comicsService.update(comic.id, {
        title: editTitle.trim(),
        author: editAuthor.trim(),
        description: editDescription.trim(),
        total_chapters: editTotalChapters || comic.total_chapters,
      });
      setComic(updated);
      setIsEditComicOpen(false);
      showToast('Đã lưu thông tin truyện 🌸', 'success');
    } catch (err) {
      showToast('Lỗi cập nhật thông tin truyện', 'error');
    }
  };

  // Shelf helpers
  const comicShelves = useMemo(() => {
    if (!comic) return [];
    return shelves.filter((s) => comic.shelf_ids.includes(s.id));
  }, [comic, shelves]);

  const availableShelvesToAdd = useMemo(() => {
    if (!comic) return [];
    return shelves.filter((s) => s.id !== 'all' && !comic.shelf_ids.includes(s.id));
  }, [comic, shelves]);

  const handleAddShelf = async (shelfId: string) => {
    if (!comic) return;
    try {
      const updated = await comicsService.addComicToShelf(shelfId, comic.id);
      setComic(updated);
      setIsAddToShelfOpen(false);
      const targetShelf = shelves.find((s) => s.id === shelfId);
      showToast(`Đã thêm vào kệ "${targetShelf?.name || ''}" 🌸`, 'success');
    } catch (err) {
      showToast('Lỗi thêm vào kệ', 'error');
    }
  };

  const handleRemoveFromShelf = async (shelfId: string) => {
    if (!comic) return;
    try {
      const updated = await comicsService.removeComicFromShelf(shelfId, comic.id);
      setComic(updated);
      showToast('Đã gỡ truyện khỏi kệ', 'info');
    } catch (err) {
      showToast('Lỗi gỡ khỏi kệ', 'error');
    }
  };

  // Share comic
  const handleShare = () => {
    if (!comic) return;
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Đã sao chép liên kết "${comic.title}"! ✨`, 'info');
    setIsMoreMenuOpen(false);
  };

  // Status mapping
  const statusLabels: Record<ComicStatus, { label: string; icon: string; bg: string }> = {
    reading: { label: 'Đang đọc', icon: '📖', bg: 'bg-primary-tint border border-primary-soft/60 text-primary-ink' },
    completed: { label: 'Đã đọc xong', icon: '🌿', bg: 'bg-accent-soft text-accent-ink' },
    plan_to_read: { label: 'Muốn đọc', icon: '✨', bg: 'bg-gold-tint text-gold-ink' },
    on_hold: { label: 'Tạm dừng', icon: '☕', bg: 'bg-surface text-text' },
    dropped: { label: 'Bỏ dở', icon: '🍂', bg: 'bg-danger-tint text-danger' },
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-24 text-center">
        <span className="text-4xl animate-bounce">🌸</span>
        <h3 className="font-serif text-lg font-bold text-text mt-3">
          Đang lật mở trang sách cổ tích...
        </h3>
        <p className="text-xs text-text-muted mt-1 italic">
          Bụi tiên đang đánh bóng từng dòng chữ thảo mộc
        </p>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 text-center">
        <span className="text-5xl mb-3">🌿</span>
        <h2 className="font-serif text-2xl font-bold text-text mb-2">
          Không tìm thấy cuốn truyện này
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mb-6 max-w-sm">
          Có thể cuốn truyện đã được cất sang vương quốc khác hoặc đổi tên.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-full bg-gold-tint text-gold-ink font-bold text-sm shadow-md hover:bg-gold transition-all cursor-pointer"
        >
          Trở về Tủ Sách ✿
        </button>
      </div>
    );
  }

  const progressPercent =
    comic.total_chapters > 0
      ? Math.min(100, Math.round((comic.current_chapter / comic.total_chapters) * 100))
      : 0;

  const nextChapterNum =
    comic.current_chapter < comic.total_chapters
      ? comic.current_chapter + 1
      : comic.current_chapter;

  const currentStatusConfig = statusLabels[comic.status] || statusLabels.reading;

  return (
    <>
      {/* Background Bookshelf Canvas (Simulated Greenhouse Library behind modal on desktop) */}
      <div className="hidden lg:block w-full max-w-7xl mx-auto px-4 py-8 opacity-30 blur-[3px] pointer-events-none select-none transition-all duration-300">
        <div className="flex items-center justify-between pb-6 border-b border-border-strong/30">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <span>📖</span>
              <span>TỦ SÁCH CÁ NHÂN • GÓC BAN CÔNG KÍNH</span>
            </div>
            <h1 className="font-serif text-3xl text-text mt-1 font-bold">
              Tủ Sách Thần Tiên Của Bé
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Lưu giữ những tác phẩm kỳ ảo giữa hương hoa mẫu đơn và trà bạc hà.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6 pt-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-surface rounded-t-full rounded-b-xl p-3 shadow-xs h-72 border border-border-strong/20 flex flex-col justify-end"
            >
              <div className="h-4 bg-surface-sunken rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-sunken rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* DESKTOP MODAL OVERLAY (chi-tiet-desktop.html)                         */}
      {/* =================================================================== */}
      <div
        className="hidden lg:fixed lg:inset-0 lg:z-50 lg:bg-scrim/45 lg:backdrop-blur-md lg:flex lg:items-center lg:justify-center lg:p-4 lg:overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseModal();
        }}
      >
        {/* Modal Window Container: Vintage Victorian Herbarium Arch */}
        <div
          className="relative w-full max-w-[940px] max-h-[92vh] flex flex-col my-auto rounded-t-[36px] rounded-b-[24px] bg-surface-raised text-text shadow-botanical-lg overflow-hidden transition-all duration-300 border border-border-strong/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Victorian Arch Glasshouse Crown & Header Decoration */}
          <div className="relative bg-gradient-to-b from-surface via-surface to-surface-raised pt-6 pb-4 px-6 md:px-10 flex flex-col items-center justify-center text-center border-b border-border-strong/20">
            {/* Floating Floral Sprigs & Starlight */}
            <div className="absolute left-6 top-5 hidden sm:flex items-center gap-1.5 text-primary/80 font-bold text-xs tracking-widest uppercase">
              <span>🌿</span>
              <span>Bản Thảo Kính Hoa</span>
            </div>

            {/* Arched Crown Motif */}
            <div className="flex items-center gap-2 text-accent-ink">
              <span className="text-gold-ink text-xs">✦</span>
              <span className="text-[15px]">❦</span>
              <span className="font-serif text-[11px] uppercase tracking-widest text-text-muted font-bold">
                LƯU TRỮ THƯ VIỆN HOÀNG GIA
              </span>
              <span className="text-[15px]">❦</span>
              <span className="text-gold-ink text-xs">✦</span>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl text-text font-bold tracking-tight mt-1 flex items-center justify-center gap-2">
              <span>{comic.title}</span>
              <span className="text-accent-ink text-xl">✿</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5 italic">
              Chi tiết tác phẩm &amp; Nhật ký tiến độ đọc cá nhân trong nhà kính
            </p>

            {/* Circular Blush Rose Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              title="Đóng cửa sổ (ESC)"
              className="absolute right-5 top-5 w-9 h-9 rounded-full bg-accent-soft text-accent-ink hover:bg-accent hover:text-on-accent flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105 hover:rotate-90 active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body Scrollable Area */}
          <div className="p-5 md:p-8 overflow-y-auto space-y-6 max-h-[calc(92vh-160px)] no-scrollbar">
            {/* Two Column Specimen Grid */}
            <div className="flex flex-col lg:flex-row gap-7 items-start">
              {/* LEFT COLUMN: Herbarium Specimen Display Arch (~310px) */}
              <div className="w-full lg:w-[310px] shrink-0 flex flex-col items-center">
                {/* Arched Greenhouse Cloche Frame for Cover */}
                <div className="relative w-full max-w-[270px] lg:max-w-full rounded-t-[34px] rounded-b-xl p-2 bg-gradient-to-b from-surface-sunken to-surface shadow-md group border border-border-strong/30">
                  <div className="relative rounded-t-[28px] rounded-b-lg overflow-hidden bg-surface-sunken shadow-inner h-[370px]">
                    <img
                      src={comic.cover_url}
                      alt={comic.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-scrim/60 via-transparent to-surface-raised/20 pointer-events-none" />

                    {/* Floating Corner Badges on Cover */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                      {comic.has_new_chapter && (
                        <span className="bg-accent-soft text-accent-ink font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm animate-pulse">
                          <span>MỚI ✿</span>
                        </span>
                      )}
                      {primarySource && (
                        <span className="bg-surface-raised/90 backdrop-blur-sm text-text-muted font-semibold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          {primarySource.site_name}
                        </span>
                      )}
                    </div>

                    {/* Ribbon Bookmark Accent */}
                    <div className="absolute top-0 right-4 w-5 h-8 bg-accent rounded-b-sm shadow-sm flex items-end justify-center pb-1 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-tint" />
                    </div>

                    {/* Bottom overlay label */}
                    <div className="absolute bottom-2 left-3 right-3 text-on-scrim text-center z-10">
                      <span className="text-[11px] uppercase tracking-wider text-on-scrim drop-shadow font-semibold">
                        Tập {comic.current_chapter} • {comic.tags[0] || 'Ấn bản thảo mộc'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Favorite Button Under Cover */}
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`mt-4 w-full max-w-[270px] font-bold text-sm py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border ${
                    comic.is_favorite
                      ? 'bg-accent-soft text-accent-ink border-accent'
                      : 'bg-accent-tint text-accent-ink border-accent-soft hover:bg-accent-soft'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${comic.is_favorite ? 'fill-accent' : ''}`}
                  />
                  <span>{comic.is_favorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
                  <span className="ml-1 bg-surface-raised/70 text-accent-ink text-xs font-semibold px-2 py-0.5 rounded-full">
                    {comic.is_favorite ? '★' : '1.8k'}
                  </span>
                </button>

                {/* Quick Metadata Pills */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-center text-text-muted text-xs max-w-[270px]">
                  <span className="bg-surface px-2.5 py-1 rounded-full font-medium">
                    {comic.total_chapters} Chương
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-full text-primary font-semibold">
                    {comic.status === 'completed' ? 'Đã hoàn tất' : 'Đang tiến hành'}
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-full font-medium">
                    Cập nhật gần nhất
                  </span>
                </div>

                {/* Reading Cloche Ambience Note */}
                <div className="mt-4 p-3 rounded-xl bg-surface text-text-muted text-center w-full max-w-[270px] border border-border-strong/20">
                  <div className="flex items-center justify-center gap-1 text-gold-ink">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Thời gian đọc ước tính
                    </span>
                  </div>
                  <p className="text-xs text-text mt-1 font-serif">
                    Khoảng {Math.max(1, Math.round((comic.total_chapters * 8) / 60))} giờ tĩnh tâm
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Story Overview, Progress & Source Matrix */}
              <div className="flex-1 w-full space-y-5">
                {/* Story Header & Metadata */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="bg-primary-tint border border-primary-soft/60 text-primary-ink text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span>✓</span>
                      <span>Nguồn chính: {primarySource?.site_name || 'Cuutruyen'}</span>
                    </span>
                    <span className="text-text-muted text-xs font-mono">
                      Mã lưu trữ: #{comic.id.slice(0, 10).toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl md:text-3xl text-text font-bold mt-1.5">
                    {comic.title}
                  </h3>
                  <p className="text-xs text-accent-ink italic mt-0.5">
                    Nguyên tác: <span className="font-semibold">{comic.author}</span> • Minh họa: <span className="font-semibold">{comic.author}</span>
                  </p>

                  {/* Tags / Genres Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {comic.tags.map((tag, i) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-2xs ${
                          i % 3 === 0
                            ? 'bg-primary-soft/50 text-primary-ink'
                            : i % 3 === 1
                            ? 'bg-accent-tint/70 text-accent-ink'
                            : 'bg-gold-tint/60 text-gold-ink'
                        }`}
                      >
                        <span>{i === 0 ? '🌿' : i === 1 ? '✨' : '☕'}</span>
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Selector & Heart Rating Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface rounded-xl border border-border-strong/20">
                  {/* Status Dropdown */}
                  <div className="relative flex items-center gap-2" ref={statusMenuRef}>
                    <span className="text-xs font-semibold text-text-muted">
                      Trạng thái đọc:
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${currentStatusConfig.bg}`}
                      >
                        <span>{currentStatusConfig.icon}</span>
                        <span>{currentStatusConfig.label}</span>
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                      </button>

                      {isStatusMenuOpen && (
                        <div className="absolute top-10 left-0 w-44 rounded-xl bg-surface-raised shadow-xl p-1 z-30 flex flex-col gap-0.5 border border-border-strong/30 animate-in fade-in zoom-in-95">
                          {(
                            [
                              'reading',
                              'completed',
                              'plan_to_read',
                              'on_hold',
                              'dropped',
                            ] as ComicStatus[]
                          ).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(st)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-surface transition-colors cursor-pointer ${
                                comic.status === st ? 'bg-surface text-text' : 'text-text-muted'
                              }`}
                            >
                              <span>{statusLabels[st].icon}</span>
                              <span>{statusLabels[st].label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Heart Rating Display (Interactive) */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-accent-ink gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRate(star)}
                          className="hover:scale-125 transition-transform p-0.5 cursor-pointer"
                          title={`Đánh giá ${star} sao`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              star <= Math.round(comic.rating)
                                ? 'fill-accent text-accent-ink'
                                : 'text-border-strong'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-text font-bold">
                      {comic.rating.toFixed(1)} / 5.0
                    </div>
                  </div>
                </div>

                {/* Reading Progress Card (Thẻ tiến độ đọc) */}
                <div className="p-4 rounded-xl bg-surface space-y-3 relative shadow-inner border border-border-strong/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-primary" />
                      <span className="font-serif text-sm font-bold text-text">
                        Tiến Độ: Chương <span className="text-primary">{comic.current_chapter}</span> / {comic.total_chapters}
                      </span>
                      <span className="bg-primary-tint border border-primary-soft/60 text-primary-ink text-[11px] px-2 py-0.5 rounded-full font-bold">
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Chapter Stepper Buttons ("-" and "+") */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStepChapter(-1)}
                        disabled={comic.current_chapter <= 0}
                        title="Giảm 1 chương (-)"
                        className="w-8 h-8 rounded-full bg-surface-raised text-gold-ink hover:bg-surface shadow-sm flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all cursor-pointer border border-border-strong/20"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepChapter(1)}
                        disabled={comic.current_chapter >= comic.total_chapters}
                        title="Tăng 1 chương (+)"
                        className="w-8 h-8 rounded-full bg-gold-tint text-gold-ink hover:bg-gold shadow-sm flex items-center justify-center font-bold disabled:opacity-40 active:scale-90 transition-all cursor-pointer border border-gold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Iridescent Pastel Gradient Progress Bar */}
                  <div className="relative w-full h-3 rounded-full bg-surface-sunken overflow-visible">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-soft via-primary-soft to-gold-tint transition-all duration-300 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      {/* Leaf Indicator Marker */}
                      <div className="absolute -right-2 -top-1.5 w-6 h-6 rounded-full bg-surface-raised shadow-sm flex items-center justify-center text-primary transform rotate-12 border border-border-strong/20">
                        <span className="text-xs">🌿</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>Cập nhật lần cuối: 2 ngày trước</span>
                    <span className="text-primary font-semibold">
                      Đã đọc 15 chương trong tuần này ✿
                    </span>
                  </div>
                </div>

                {/* Reading Sources Matrix (Nguồn đọc liên kết) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-bold text-text">
                        Nguồn đọc liên kết
                      </span>
                      <span className="bg-surface text-text-muted text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        {comic.sources.length} nguồn
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddSource}
                      className="text-xs font-semibold text-primary hover:text-text flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm nguồn</span>
                    </button>
                  </div>

                  {/* Source Items List */}
                  <div className="space-y-2">
                    {comic.sources.map((src) => {
                      const isPrimary = src.id === comic.primary_source_id;
                      const isAlive = src.is_alive !== false;

                      return (
                        <div
                          key={src.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface transition-colors shadow-2xs border border-border-strong/20"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-surface-sunken flex items-center justify-center text-primary shrink-0 font-bold font-serif text-sm">
                              {src.site_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-text truncate">
                                  {src.site_name}
                                </span>
                                {isPrimary && (
                                  <span className="bg-primary-tint border border-primary-soft/60 text-primary-ink text-[10px] font-bold px-1.5 py-0.2 rounded">
                                    ★ Nguồn chính
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isAlive
                                        ? 'bg-primary animate-pulse'
                                        : 'bg-text-muted'
                                    }`}
                                  />
                                  <span>{isAlive ? 'Hoạt động' : 'Link chậm / Lỗi'}</span>
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted truncate">
                                {src.chapter_url || src.url}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimarySource(src.id)}
                                className="text-[11px] font-semibold text-gold-ink hover:underline px-2 py-1"
                                title="Đặt làm nguồn chính"
                              >
                                Đặt làm chính
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditSource(src)}
                              className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-sunken"
                              title="Sửa nguồn"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {comic.sources.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSource(src.id)}
                                className="p-1 rounded-md text-danger hover:bg-danger-tint"
                                title="Xóa nguồn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <a
                              href={src.chapter_url || src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-surface-raised text-text hover:bg-accent-tint rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-border-strong/20"
                            >
                              <span>Mở</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vintage Note Area (Ghi chú của tôi) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text flex items-center gap-1.5">
                      <span>✍</span>
                      <span>Ghi chú của tôi</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {noteSaveStatus === 'saving' && (
                        <span className="text-[10px] text-gold-ink animate-pulse">
                          Đang lưu...
                        </span>
                      )}
                      {noteSaveStatus === 'saved' && (
                        <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Đã lưu 🌿
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditingNote(!isEditingNote)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{isEditingNote ? 'Thu gọn' : 'Chỉnh sửa'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Lined Parchment Style Paper */}
                  <div
                    className="p-4 rounded-xl bg-surface text-text relative shadow-2xs border border-border-strong/20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(transparent, transparent 23px, color-mix(in srgb, var(--c-border-strong) 30%, transparent) 24px)',
                    }}
                  >
                    {isEditingNote ? (
                      <textarea
                        value={noteText}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        rows={3}
                        placeholder="Lưu lại cảm nghĩ, đoạn trích yêu thích hoặc chương đang đọc..."
                        className="w-full bg-transparent font-serif italic text-sm text-text leading-6 focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="font-serif italic reading-sm text-text leading-[1.7] pl-1">
                        {comic.note
                          ? `“${comic.note}”`
                          : '“Chưa có ghi chú nào. Nhấn chỉnh sửa để ghi lại những dòng cảm xúc êm dịu nhất...”'}
                      </p>
                    )}
                    <div className="mt-2 text-right">
                      <span className="text-[10px] font-semibold text-accent-ink tracking-widest uppercase">
                        — Nhật ký trang sách • Tự động lưu ✿
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shelves Allocation (Thuộc kệ) */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-text-muted font-semibold">Thuộc kệ sách:</span>
                    {comicShelves.map((s) => (
                      <span
                        key={s.id}
                        className="bg-primary-soft/60 text-primary-ink px-2.5 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{s.icon || '🌿'}</span>
                        <span>{s.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromShelf(s.id)}
                          className="hover:text-danger transition-colors p-0.5 cursor-pointer"
                          title="Gỡ khỏi kệ này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsAddToShelfOpen(true)}
                      className="bg-surface hover:bg-surface-sunken text-text-muted px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-border-strong/20"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm vào kệ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Modal Action Bar */}
          <div className="bg-surface px-6 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-strong/20">
            {/* Left Minor Actions */}
            <div className="flex items-center gap-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="hover:text-danger transition-colors flex items-center gap-1 text-danger/80 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa khỏi tủ sách</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditComicOpen(true)}
                className="hover:text-primary text-text-muted transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Sửa thông tin</span>
              </button>
            </div>

            {/* Right Primary Reading CTA Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleReadNext}
                className="w-full sm:w-auto bg-gradient-to-r from-accent-soft via-accent-tint to-gold-tint text-accent-ink font-bold text-sm py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer border border-accent-soft"
              >
                <BookOpen className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Đọc tiếp Chương {nextChapterNum}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MOBILE FULL-PAGE VIEW (chi-tiet-mobile.html)                          */}
      {/* =================================================================== */}
      <div className="lg:hidden flex flex-col w-full min-h-screen bg-surface-raised text-text pb-24">
        {/* Fixed Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface-raised/90 backdrop-blur-md shadow-xs border-b border-border-strong/20">
          <div className="h-14 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text hover:bg-surface shadow-xs active:scale-95 transition-transform border border-border-strong/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 px-3 text-center truncate">
              <span className="font-serif text-sm font-bold text-text truncate block">
                {comic.title}
              </span>
              <span className="text-[10px] text-gold-ink flex items-center justify-center gap-1 font-semibold">
                <span>🌿</span> Tủ Truyện Nhỏ
              </span>
            </div>

            <div className="flex items-center gap-1.5 relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Yêu thích"
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors border border-border-strong/20 ${
                  comic.is_favorite
                    ? 'bg-accent-soft text-accent-ink'
                    : 'bg-surface text-accent-ink'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${comic.is_favorite ? 'fill-accent' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                aria-label="Tùy chọn khác"
                className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:bg-surface shadow-xs transition-colors border border-border-strong/20"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Mobile "..." Popup Menu */}
              {isMoreMenuOpen && (
                <div className="absolute right-0 top-12 w-44 rounded-xl bg-surface-raised shadow-xl z-50 p-1.5 space-y-1 border border-border-strong/30 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsEditComicOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text hover:bg-surface text-left"
                  >
                    <Edit className="w-4 h-4 text-gold-ink" />
                    <span>Sửa thông tin</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text hover:bg-surface text-left"
                  >
                    <Share2 className="w-4 h-4 text-primary" />
                    <span>Chia sẻ liên kết</span>
                  </button>
                  <div className="my-1 border-t border-border-strong/20" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsConfirmDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-danger hover:bg-danger-tint text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa khỏi tủ sách</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Main Body */}
        <main className="flex flex-col pt-16 px-4 space-y-4">
          {/* 1. Arched Cover & Header */}
          <div className="relative mt-2 flex flex-col items-center">
            <div className="absolute -inset-3 bg-gradient-to-b from-accent-tint/40 via-gold-tint/30 to-primary-soft/20 rounded-t-[52px] rounded-b-3xl blur-md -z-10" />

            <div className="relative w-[216px] h-[308px] rounded-t-[44px] rounded-b-2xl overflow-hidden shadow-lg bg-surface-sunken flex flex-col items-center justify-end border border-border-strong/30">
              <img
                src={comic.cover_url}
                alt={comic.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-scrim/70 via-scrim/15 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 z-10">
                {comic.has_new_chapter && (
                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent-ink text-[10px] font-bold shadow-sm">
                    <span>MỚI</span>
                    <span>🌸</span>
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3 z-10">
                {primarySource && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-raised/90 backdrop-blur-xs text-text-muted text-[10px] font-semibold shadow-xs">
                    {primarySource.site_name}
                  </span>
                )}
              </div>

              {/* Ribbon tag */}
              <div className="relative z-10 mb-2.5 px-3 py-1 rounded-full bg-surface-raised/90 backdrop-blur-md flex items-center gap-1.5 shadow-sm text-gold-ink">
                <span>🌿</span>
                <span className="text-[10px] font-bold tracking-wide">
                  Ấn bản thảo mộc cổ điển
                </span>
              </div>
            </div>
          </div>

          {/* Title & Author Block */}
          <div className="text-center w-full max-w-sm mx-auto">
            <h1 className="font-serif text-2xl text-text font-bold flex items-center justify-center gap-1.5 flex-wrap">
              <span>{comic.title}</span>
              <span className="text-accent-ink">✿</span>
            </h1>
            <p className="text-xs text-text-muted mt-1 italic font-serif">
              Tác giả: <span className="font-semibold text-text">{comic.author}</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-md bg-surface font-mono">
                #TR-{comic.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] text-primary-ink px-2 py-0.5 rounded-full bg-primary-tint border border-primary-soft/60 font-bold flex items-center gap-1">
                <span>✓</span>
                <span>Nguồn chính: {primarySource?.site_name || 'Cuutruyen'}</span>
              </span>
            </div>
          </div>

          {/* Genre Chips Pill Row */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 w-full">
            {comic.tags.map((tag, i) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${
                  i % 3 === 0
                    ? 'bg-primary-soft/60 text-primary-ink'
                    : i % 3 === 1
                    ? 'bg-accent-tint text-accent-ink'
                    : 'bg-gold-tint text-gold-ink'
                }`}
              >
                <span>{i === 0 ? '🌿' : i === 1 ? '✨' : '☕'}</span>
                <span>{tag}</span>
              </span>
            ))}
          </div>

          {/* 2. Status & Rating Row */}
          <div className="w-full flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface shadow-xs border border-border-strong/20">
            {/* Custom Dropdown Selector */}
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className="h-10 px-3.5 rounded-xl bg-surface-raised text-text text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform"
              >
                <span>{currentStatusConfig.icon}</span>
                <span>{currentStatusConfig.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </button>

              {isStatusMenuOpen && (
                <div className="absolute top-12 left-0 w-44 rounded-xl bg-surface-raised shadow-xl p-1 z-30 flex flex-col gap-0.5 border border-border-strong/30">
                  {(
                    [
                      'reading',
                      'completed',
                      'plan_to_read',
                      'on_hold',
                      'dropped',
                    ] as ComicStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                        comic.status === st ? 'bg-surface text-text' : 'text-text-muted'
                      }`}
                    >
                      <span>{statusLabels[st].icon}</span>
                      <span>{statusLabels[st].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Heart Rating */}
            <div className="flex items-center gap-1.5 pr-2">
              <div className="flex items-center text-accent-ink">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    className="p-0.5"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        star <= Math.round(comic.rating)
                          ? 'fill-accent text-accent-ink'
                          : 'text-border-strong'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-text leading-tight font-bold">
                  {comic.rating.toFixed(1)}
                  <span className="text-text-muted font-normal">/5.0</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Interactive Reading Progress Card */}
          <div className="w-full p-4 rounded-2xl bg-surface shadow-xs border border-border-strong/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-accent-ink" />
                <span className="font-serif text-sm font-bold text-text">
                  Tiến Độ: Chương {comic.current_chapter} / {comic.total_chapters}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-tint border border-primary-soft/60 text-primary-ink text-xs font-bold">
                {progressPercent}%
              </span>
            </div>

            {/* Stepper Controls & Progress */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStepChapter(-1)}
                disabled={comic.current_chapter <= 0}
                aria-label="Giảm 1 chương"
                className="w-11 h-11 rounded-full bg-surface-raised text-gold-ink hover:bg-gold-tint shadow-sm flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-30 border border-border-strong/20"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 flex flex-col gap-1.5">
                <div className="relative w-full h-3 rounded-full bg-surface-sunken overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-soft via-gold-tint to-primary-soft transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center px-0.5 text-[10px] text-text-muted">
                  <span>Ch. 1</span>
                  <span>Ch. {comic.total_chapters} (Hết)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStepChapter(1)}
                disabled={comic.current_chapter >= comic.total_chapters}
                aria-label="Tăng 1 chương"
                className="w-11 h-11 rounded-full bg-gold-tint text-gold-ink hover:bg-gold shadow-sm flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-30 border border-gold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gold-ink" />
                <span>Cập nhật 2 ngày trước</span>
              </span>
              <span className="text-accent-ink font-medium">Đã đọc 15 ch. tuần này ✿</span>
            </div>
          </div>

          {/* 4. Linked Sources Matrix */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="font-serif text-sm font-bold text-text">
                  Nguồn đọc liên kết
                </h2>
                <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-full">
                  {comic.sources.length} nguồn
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSource}
                className="text-xs font-bold text-primary hover:text-text flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {comic.sources.map((src) => {
                const isPrimary = src.id === comic.primary_source_id;
                const isAlive = src.is_alive !== false;

                return (
                  <div
                    key={src.id}
                    className="w-full p-3 rounded-xl bg-surface-raised shadow-2xs flex items-center justify-between border border-border-strong/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary shrink-0 font-bold font-serif text-xs">
                        {src.site_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-text font-bold truncate">
                            {src.site_name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAlive ? 'bg-primary animate-pulse' : 'bg-text-muted'
                            }`}
                          />
                          {isPrimary && (
                            <span className="text-[10px] font-bold text-primary-ink bg-primary-tint border border-primary-soft/60 px-1.5 py-0.2 rounded">
                              Chính
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted truncate">
                          {src.chapter_url || src.url}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimarySource(src.id)}
                          className="w-7 h-7 rounded-full bg-surface text-gold-ink flex items-center justify-center shadow-2xs"
                          title="Đặt làm nguồn chính"
                        >
                          ★
                        </button>
                      )}
                      <a
                        href={src.chapter_url || src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 px-3 rounded-full bg-surface text-text text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <span>Mở</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Vintage Ruled Note Area */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">✍</span>
                <h2 className="font-serif text-sm font-bold text-text">
                  Ghi chú của tôi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNote(!isEditingNote)}
                className="text-xs font-bold text-accent-ink flex items-center gap-0.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{isEditingNote ? 'Thu gọn' : 'Viết thêm'}</span>
              </button>
            </div>

            <div className="w-full rounded-2xl p-4 bg-surface-raised shadow-2xs relative overflow-hidden border border-border-strong/20">
              <div className="space-y-3 relative z-10">
                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      rows={3}
                      placeholder="Lưu lại cảm nghĩ, đoạn trích hoặc chương yêu thích..."
                      className="w-full p-2 rounded-xl bg-surface text-xs text-text focus:outline-none resize-none font-serif italic"
                    />
                    <div className="flex items-center justify-between text-[10px]">
                      {noteSaveStatus === 'saving' ? (
                        <span className="text-gold-ink animate-pulse">Đang lưu...</span>
                      ) : noteSaveStatus === 'saved' ? (
                        <span className="text-primary font-semibold">Đã lưu 🌿</span>
                      ) : (
                        <span className="text-text-muted">Tự động lưu khi dừng gõ</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="reading-xs text-text leading-relaxed italic py-1 font-serif">
                    {comic.note
                      ? `“${comic.note}”`
                      : '“Truyện đọc rất êm dịu. Nhấn \'Viết thêm\' để ghi lại cảm xúc của nàng...”'}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-text-muted">
                  <span>14:20 - Gần nhất</span>
                  <span className="text-gold-ink font-semibold">
                    Ghi chú tại Chương {comic.current_chapter} ☕
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Personal Shelves */}
          <div className="w-full">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-serif text-sm font-bold text-text">
                Thuộc kệ sách cá nhân
              </h2>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {comicShelves.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised text-text text-xs font-semibold shadow-2xs border border-border-strong/20"
                >
                  <span>{s.icon || '🌿'}</span>
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromShelf(s.id)}
                    className="text-text-muted hover:text-danger ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsAddToShelfOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface text-gold-ink hover:bg-surface text-xs font-semibold transition-colors border border-border-strong/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào kệ</span>
              </button>
            </div>
          </div>

          {/* 7. Synopsis */}
          <div className="w-full">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <BookOpen className="w-4 h-4 text-gold-ink" />
              <h2 className="font-serif text-sm font-bold text-text">
                Tóm tắt tác phẩm
              </h2>
            </div>
            <div className="w-full p-4 rounded-2xl bg-surface text-text shadow-xs border border-border-strong/20">
              <p
                className={`reading-xs leading-relaxed text-text-muted ${
                  !isSynopsisExpanded ? 'line-clamp-3' : ''
                }`}
              >
                {comic.description}
              </p>
              <div className="mt-3 pt-2.5 flex items-center justify-between text-gold-ink text-xs border-t border-border-strong/20">
                <span className="text-text-muted text-[11px]">
                  {comic.total_chapters} chương hoàn tất
                </span>
                <button
                  type="button"
                  onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                  className="text-primary font-bold hover:underline"
                >
                  {isSynopsisExpanded ? 'Thu gọn' : 'Chi tiết thêm ▾'}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Fixed Bottom Action Bar */}
        <footer className="fixed bottom-0 left-0 right-0 w-full z-40 bg-surface-raised/95 backdrop-blur-md shadow-lg border-t border-border-strong/20 p-3">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
              aria-label="Mục lục chương"
              className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-muted hover:bg-surface shadow-xs shrink-0 border border-border-strong/20"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleReadNext}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-accent-soft via-gold-tint to-accent-soft text-accent-ink font-bold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all border border-accent-soft"
            >
              <span>🌸</span>
              <span>Đọc tiếp Chương {nextChapterNum}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT SOURCE FORM                                       */}
      {/* =================================================================== */}
      {isAddSourceOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-raised border-2 border-border-strong rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text">
                {editingSourceId ? 'Chỉnh sửa nguồn đọc 🌿' : 'Thêm nguồn đọc mới 🌸'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSourceOpen(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Tên trang nguồn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cuutruyen, BlogTruyen, MangaDex..."
                  value={sourceSiteName}
                  onChange={(e) => setSourceSiteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Trang chủ nguồn (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://cuutruyen.net"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Đường dẫn chương đọc (Chapter URL)
                </label>
                <input
                  type="url"
                  placeholder="https://cuutruyen.net/manga/123/chap-45"
                  value={sourceChapterUrl}
                  onChange={(e) => setSourceChapterUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSourceOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface text-xs font-bold text-text-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-tint text-gold-ink text-xs font-bold shadow-sm hover:bg-gold"
                >
                  {editingSourceId ? 'Lưu cập nhật' : 'Thêm nguồn ✿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: EDIT COMIC INFO                                              */}
      {/* =================================================================== */}
      {isEditComicOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-raised border-2 border-border-strong rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text">
                Chỉnh sửa thông tin truyện ✿
              </h3>
              <button
                type="button"
                onClick={() => setIsEditComicOpen(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComicInfo} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Tên truyện *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Tổng số chương
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editTotalChapters}
                    onChange={(e) => setEditTotalChapters(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Mô tả tác phẩm
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-strong/40 text-xs text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditComicOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface text-xs font-bold text-text-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-tint text-gold-ink text-xs font-bold shadow-sm hover:bg-gold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD TO SHELF PICKER                                          */}
      {/* =================================================================== */}
      {isAddToShelfOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-raised border-2 border-border-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text">
                Xếp vào kệ sách 🌿
              </h3>
              <button
                type="button"
                onClick={() => setIsAddToShelfOpen(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Chọn ngăn kệ muốn đặt truyện <strong>"{comic.title}"</strong>:
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {availableShelvesToAdd.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  Truyện đã có mặt trên tất cả các kệ của nàng rồi! ✨
                </div>
              ) : (
                availableShelvesToAdd.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddShelf(s.id)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{s.icon || '🌸'}</span>
                      <span className="text-xs font-bold text-text">{s.name}</span>
                    </div>
                    <span className="text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      + Thêm
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAddToShelfOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-surface text-xs font-bold text-text-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CONFIRM DELETE COMIC MODAL                                          */}
      {/* =================================================================== */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-raised border-2 border-border-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Xóa khỏi tủ sách?</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Tác phẩm <strong>"{comic.title}"</strong> sẽ được gỡ bỏ hoàn toàn khỏi bộ sưu tập và tất cả các kệ sách cá nhân.
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-surface text-xs font-bold text-text-muted"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteComic}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-danger text-on-danger text-xs font-bold hover:bg-danger-ink transition-colors"
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
