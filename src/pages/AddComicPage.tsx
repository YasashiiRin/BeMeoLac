import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Comic, ComicStatus, Shelf, Source } from '../types';
import { comicsService } from '../services/comicService';
import { shelvesService } from '../services/shelfService';
import { useToast } from '../context/ToastContext';
import {
  X,
  Link as LinkIcon,
  Edit3,
  Sparkles,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Check,
  ChevronDown,
  Cloud,
  Flower2,
  Layers,
  ArrowLeft,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

const DEFAULT_COVER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD69NfgFvW2znXgoxCJratVdrZQOvY21Pg0ZbYhIerK-jyRA3Vl9vl2gw0mkfxifvDcZDCS_EHcNj7olGmjgBuq87nPiiTgW_1jqfmP3m4jnNxJ2J_AVgar3RikSZixBYldMyj425cuYLe153rtjXyae2SoGrbxCfR7CxDKMvqDpthpMHDY8WOoOoBneojzxq-Qk0qoVtozx-uNnjAFOgYNR9HUzK2FH8s_pCtCcbupehhIKWpQ5w';

export const AddComicPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Tab: 'link' | 'manual'
  const [activeTab, setActiveTab] = useState<'link' | 'manual'>('link');

  // Link Tab State
  const [sourceUrlInput, setSourceUrlInput] = useState(
    'https://cuutruyen.net/manga/tiem-tap-hoa-phep-thuat-thao-moc'
  );
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('Tiệm Tạp Hóa Phép Thuật Thảo Mộc');
  const [author, setAuthor] = useState('Hatori M. (Minh họa: Lirien)');
  const [coverUrl, setCoverUrl] = useState(DEFAULT_COVER);
  const [totalChapters, setTotalChapters] = useState(120);
  const [currentChapter, setCurrentChapter] = useState(45);
  const [selectedStatus, setSelectedStatus] = useState<ComicStatus>('plan_to_read');
  const [tags, setTags] = useState<string[]>([
    'Chữa lành',
    'Phép thuật',
    'Đời thường',
    'Nhà kính cổ',
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [siteName, setSiteName] = useState('Cuutruyen');
  const [description, setDescription] = useState(
    'Kể về tiệm tạp hóa nhỏ nằm sâu trong nhà kính cổ xưa của thị trấn thần tiên...'
  );

  // Shelves multi-select
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);

  // Duplicate Check State
  const [existingComic, setExistingComic] = useState<Comic | null>(null);

  // Validation
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Shelves
  useEffect(() => {
    let isMounted = true;
    const loadShelves = async () => {
      try {
        const allShelves = await shelvesService.list();
        if (!isMounted) return;
        setShelves(allShelves.filter((s) => s.id !== 'all'));
        // Default select first two shelves if available
        if (allShelves.length > 1) {
          const defaultSelected = allShelves
            .filter((s) => s.id !== 'all')
            .slice(0, 2)
            .map((s) => s.id);
          setSelectedShelfIds(defaultSelected);
        }
      } catch (err) {
        console.error('Error loading shelves:', err);
      }
    };
    loadShelves();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check duplicate comic by title
  useEffect(() => {
    let isMounted = true;
    const checkDuplicate = async () => {
      if (!title.trim()) {
        setExistingComic(null);
        return;
      }
      try {
        const found = await comicsService.findExistingByTitle(title);
        if (isMounted) {
          setExistingComic(found);
        }
      } catch {
        // Ignore
      }
    };
    const timer = setTimeout(checkDuplicate, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [title]);

  // Handle ESC key to close modal on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Fetch metadata from URL
  const handleFetchUrl = async () => {
    if (!sourceUrlInput.trim()) {
      setFetchError('Vui lòng dán liên kết truyện trước khi lấy thông tin.');
      return;
    }

    setIsFetchingUrl(true);
    setFetchError(null);

    try {
      const preview = await comicsService.fetchFromUrl(sourceUrlInput);
      setTitle(preview.title);
      setAuthor(preview.author);
      setCoverUrl(preview.cover_url || DEFAULT_COVER);
      setTotalChapters(preview.total_chapters || 100);
      setTags(preview.tags.length ? preview.tags : ['Chữa lành']);
      setSiteName(preview.site_name || 'Nguồn mới');
      setTitleError(null);
      showToast('Đã thu thập dữ liệu thảo mộc từ liên kết! ✨', 'success');
    } catch (err: any) {
      setFetchError(
        err?.message ||
          'Không thể phân tích dữ liệu từ liên kết này. Vui lòng kiểm tra lại đường dẫn!'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Cover image file upload handler
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result);
        showToast('Đã tải ảnh bìa mới thành công! 🌸', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle shelf selection
  const handleToggleShelf = (shelfId: string) => {
    setSelectedShelfIds((prev) =>
      prev.includes(shelfId) ? prev.filter((id) => id !== shelfId) : [...prev, shelfId]
    );
  };

  // Add custom tag
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim();
    if (!tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Handle adding current URL as secondary source to existing comic
  const handleAddAsSecondarySource = async () => {
    if (!existingComic) return;
    try {
      const newSource: Source = {
        id: `src_${Date.now()}`,
        site_name: siteName || 'Nguồn phụ',
        url: sourceUrlInput || 'https://cuutruyen.net',
        favicon_url: '',
        chapter_url: sourceUrlInput || '',
        latest_chapter: totalChapters,
        is_alive: true,
        last_checked_at: new Date().toISOString(),
      };

      await comicsService.addSourceToComic(existingComic.id, newSource);
      showToast(
        `Đã thêm ${siteName} thành nguồn phụ cho "${existingComic.title}"! 🌿`,
        'success'
      );
      navigate(`/comics/${existingComic.id}`);
    } catch (err) {
      showToast('Lỗi khi thêm nguồn phụ', 'error');
    }
  };

  // Save new Comic
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setTitleError('Vui lòng nhập tên tác phẩm');
      showToast('Tên tác phẩm không được để trống', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSourceId = `src_${Date.now()}`;
      const newSource: Source = {
        id: newSourceId,
        site_name: siteName || 'Cuutruyen',
        url: sourceUrlInput || 'https://cuutruyen.net',
        favicon_url: '',
        chapter_url: sourceUrlInput || '',
        latest_chapter: Math.max(1, totalChapters),
        is_alive: true,
        last_checked_at: new Date().toISOString(),
      };

      const createdComic = await comicsService.create({
        title: title.trim(),
        author: author.trim() || 'Khuyết danh',
        description:
          description.trim() ||
          'Một cuốn truyện tranh thần tiên vừa được xếp vào góc nhà kính.',
        cover_url: coverUrl.trim() || DEFAULT_COVER,
        status: selectedStatus,
        current_chapter: Math.min(totalChapters, Math.max(0, currentChapter)),
        total_chapters: Math.max(1, totalChapters),
        rating: 5.0,
        is_favorite: false,
        note: '',
        tags: tags.length ? tags : ['Chữa lành'],
        sources: [newSource],
        primary_source_id: newSourceId,
        shelf_ids: Array.from(new Set(['all', ...selectedShelfIds])),
        has_new_chapter: false,
        last_read_at: new Date().toISOString(),
      });

      showToast(`Đã lưu "${createdComic.title}" vào tủ sách! 🌸`, 'success');
      navigate(`/comics/${createdComic.id}`);
    } catch (err) {
      console.error('Error creating comic:', err);
      showToast('Lỗi khi tạo truyện mới', 'error');
      setIsSubmitting(false);
    }
  };

  const progressPercent =
    totalChapters > 0
      ? Math.min(100, Math.round((currentChapter / totalChapters) * 100))
      : 0;

  return (
    <>
      {/* Hidden file input for cover uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCoverFileUpload}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

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
      {/* DESKTOP MODAL OVERLAY (them-truyen-desktop.html)                      */}
      {/* =================================================================== */}
      <div
        className="hidden lg:fixed lg:inset-0 lg:z-50 lg:bg-scrim/45 lg:backdrop-blur-md lg:flex lg:items-center lg:justify-center lg:p-4 lg:overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {/* Soft simulated background orbs */}
        <div className="absolute top-1/4 left-1/5 w-80 h-80 rounded-full bg-accent-soft/20 filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-gold-tint/25 filter blur-3xl pointer-events-none" />

        {/* MAIN MODAL CARD */}
        <div
          className="relative z-10 w-full max-w-3xl bg-background text-text rounded-t-[36px] rounded-b-[28px] shadow-botanical-lg border-[1.5px] border-border/60 overflow-hidden flex flex-col my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button (Blush Rose Floating Circle) */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-accent text-on-accent hover:bg-accent-ink transition-all transform hover:rotate-90 flex items-center justify-center shadow-md group cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="pt-8 pb-4 px-6 sm:px-10 text-center relative flex flex-col items-center bg-gradient-to-b from-surface/80 to-transparent">
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <Flower2 className="w-4 h-4" />
              <span className="font-serif text-[11px] uppercase tracking-[0.2em] text-gold-ink font-bold">
                ✦ THƯ VIỆN NHÀ KÍNH CỔ TÍCH ✦
              </span>
              <span className="text-xs">❦</span>
            </div>
            <h2 className="font-serif text-3xl text-primary tracking-tight font-bold">
              Thêm truyện mới
            </h2>
            <p className="text-xs text-text-muted max-w-md mt-1 italic">
              Lưu giữ những trang truyện kỳ ảo vào kệ gỗ thảo mộc của bạn.
            </p>

            {/* Navigation Tabs (Pill Cloche Style) */}
            <div className="mt-6 p-1.5 bg-surface-sunken/60 rounded-full flex items-center gap-1 shadow-inner max-w-md w-full border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'link'
                    ? 'bg-gradient-to-r from-accent-tint via-surface to-primary-tint shadow-sm text-text'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-primary" />
                <span>Dán liên kết</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-gradient-to-r from-accent-tint via-surface to-primary-tint shadow-sm text-text'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Nhập thủ công</span>
              </button>
            </div>
          </div>

          {/* Modal Body (Scrollable Parchment Content) */}
          <div className="px-6 sm:px-10 py-5 space-y-6 max-h-[66vh] overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* TAB 1: DÁN LINK */}
            {activeTab === 'link' ? (
              <div className="space-y-6">
                {/* URL Input Module */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                    Liên kết truyện
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-2.5 text-base">🌿</span>
                      <input
                        type="url"
                        value={sourceUrlInput}
                        onChange={(e) => setSourceUrlInput(e.target.value)}
                        placeholder="Dán link truyện vào đây (Cuutruyen, Blogtruyen, Kakao, Webtoon...)..."
                        className="w-full bg-background text-text text-xs font-medium rounded-full pl-11 pr-4 py-2.5 outline-none border-[1.5px] border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchUrl}
                      disabled={isFetchingUrl}
                      className="px-5 py-2.5 rounded-full text-xs font-bold bg-gold-tint text-gold-ink hover:bg-gold hover:shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 border border-gold cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles className="w-4 h-4 text-gold-ink" />
                      <span>{isFetchingUrl ? 'Đang đọc link...' : 'Lấy thông tin ✦'}</span>
                    </button>
                  </div>

                  {fetchError ? (
                    <p className="text-xs text-danger flex items-center gap-1 pl-3 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fetchError}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted italic flex items-center gap-1.5 pl-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        Tự động phân tích tên truyện, hình bìa, tác giả, tag và số chương từ hơn 20 nguồn truyện.
                      </span>
                    </p>
                  )}
                </div>

                {/* Preview Card (Arched Botanical Folio) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-surface border-[1.5px] border-border shadow-xs relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary-soft/20 pointer-events-none" />
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Cover Column */}
                    <div className="w-full sm:w-36 shrink-0 flex flex-col items-center">
                      <div className="relative w-32 sm:w-36 h-48 rounded-t-full rounded-b-2xl overflow-hidden shadow-md border-2 border-border-strong bg-surface-sunken group">
                        <img
                          src={coverUrl}
                          alt={title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/85 backdrop-blur-xs text-on-primary text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          <span>{siteName}</span>
                        </span>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-overlay/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <span className="text-[11px] text-on-scrim bg-surface-raised/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-on-scrim/50 font-bold">
                            Đổi ảnh ✎
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-text-muted hover:text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Chỉnh ảnh bìa</span>
                      </button>
                    </div>

                    {/* Metadata Editable Column */}
                    <div className="flex-1 w-full space-y-3">
                      {/* Title Field */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Tên tác phẩm *
                          </label>
                          <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Khớp tự động</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            if (e.target.value.trim()) setTitleError(null);
                          }}
                          className={`w-full mt-1 bg-surface-raised text-text font-serif text-lg font-bold rounded-xl px-3 py-1.5 outline-none border transition-all ${
                            titleError
                              ? 'border-danger focus:ring-1 focus:ring-danger'
                              : 'border-border focus:border-primary'
                          }`}
                        />
                        {titleError && (
                          <span className="text-[11px] text-danger mt-0.5 block">
                            {titleError}
                          </span>
                        )}
                      </div>

                      {/* Author & Total Chapters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Tác giả / Hoạ sĩ
                          </label>
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full mt-1 bg-surface-raised text-text text-xs rounded-lg px-2.5 py-1.5 outline-none border border-border focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Quy mô xuất bản
                          </label>
                          <div className="mt-1 flex items-center gap-2 px-3 py-1.5 bg-surface-raised/70 rounded-lg border border-border/60">
                            <BookOpen className="w-3.5 h-3.5 text-gold-ink" />
                            <input
                              type="number"
                              min={1}
                              value={totalChapters}
                              onChange={(e) => setTotalChapters(Number(e.target.value))}
                              className="w-16 bg-transparent text-xs font-bold text-text outline-none"
                            />
                            <span className="text-xs text-text-muted">chương</span>
                          </div>
                        </div>
                      </div>

                      {/* Genre Tags */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Thể loại ghi nhận
                          </label>
                          {isAddingTag ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                placeholder="Thẻ mới..."
                                className="px-2 py-0.5 text-xs bg-surface-raised rounded-md border border-border outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              />
                              <button
                                type="button"
                                onClick={handleAddTag}
                                className="text-xs text-primary font-bold"
                              >
                                Lưu
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsAddingTag(true)}
                              className="text-xs text-accent-ink hover:underline"
                            >
                              + Thêm thẻ
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {tags.map((tag, i) => (
                            <span
                              key={tag}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-2xs ${
                                i % 3 === 0
                                  ? 'bg-primary-soft/40 text-primary-ink'
                                  : i % 3 === 1
                                  ? 'bg-accent-tint/60 text-accent-ink'
                                  : 'bg-gold-tint/60 text-gold-ink'
                              }`}
                            >
                              <span>{i === 0 ? '🌿' : i === 1 ? '✨' : '☕'}</span>
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-text-muted hover:text-danger ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soft Warning Notification (Duplicate Detected) */}
                {existingComic && (
                  <div className="p-3.5 rounded-2xl bg-surface border border-border flex items-start gap-3 shadow-sm animate-in fade-in">
                    <Lightbulb className="w-5 h-5 text-gold-ink shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-text font-medium leading-relaxed">
                        Tựa truyện này đã có trong Tủ Sách của bạn với 1 nguồn khác. Bạn có muốn lưu liên kết này thành nguồn phụ bổ sung không?
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddAsSecondarySource}
                          className="px-3 py-1 rounded-full bg-gold-tint text-gold-ink text-xs font-bold hover:bg-gold transition-colors cursor-pointer shadow-xs"
                        >
                          + Thêm làm nguồn đọc phụ 🔗
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/comics/${existingComic.id}`)}
                          className="px-3 py-1 rounded-full bg-transparent hover:bg-surface text-text-muted text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Xem truyện hiện có
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: NHẬP THỦ CÔNG */
              <div className="space-y-5">
                {/* Drag & Drop Upload Cloche Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-3xl p-6 text-center bg-background hover:bg-surface/40 transition-colors cursor-pointer group"
                >
                  {coverUrl && coverUrl !== DEFAULT_COVER ? (
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={coverUrl}
                        alt="Preview"
                        className="w-20 h-28 object-cover rounded-xl shadow-md border"
                      />
                      <div className="text-left">
                        <p className="font-serif font-bold text-sm text-text">
                          Đã chọn ảnh bìa
                        </p>
                        <p className="text-xs text-text-muted">Nhấn để chọn ảnh khác</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 mx-auto rounded-full bg-primary-tint flex items-center justify-center text-primary-ink shadow-inner group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="mt-3 font-serif text-sm font-bold text-text">
                        Kéo thả ảnh bìa hoặc tải lên
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Định dạng JPG, PNG hoặc WEBP (khuyên dùng tỉ lệ 3:4 chuẩn bìa sách)
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                      Tên truyện cổ / Manga *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (e.target.value.trim()) setTitleError(null);
                      }}
                      placeholder="Ví dụ: Bí Mật Dưới Rễ Cây Sồi Cổ Thụ..."
                      className={`w-full mt-1 bg-surface-raised text-text text-sm rounded-xl px-3.5 py-2 outline-none border transition-all ${
                        titleError ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                    />
                    {titleError && (
                      <span className="text-[11px] text-danger mt-0.5 block">
                        {titleError}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                        Tác giả
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Tên người sáng tác..."
                        className="w-full mt-1 bg-surface-raised text-text text-xs rounded-xl px-3.5 py-2 outline-none border border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                        Tổng số chương dự kiến
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={totalChapters}
                        onChange={(e) => setTotalChapters(Number(e.target.value))}
                        placeholder="Ví dụ: 85"
                        className="w-full mt-1 bg-surface-raised text-text text-xs rounded-xl px-3.5 py-2 outline-none border border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                      Đường dẫn nguồn đọc (Source URL)
                    </label>
                    <input
                      type="url"
                      value={sourceUrlInput}
                      onChange={(e) => setSourceUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1 bg-surface-raised text-text text-xs rounded-xl px-3.5 py-2 outline-none border border-border focus:border-primary"
                    />
                  </div>

                  {/* Duplicate warning in manual tab too */}
                  {existingComic && (
                    <div className="p-3.5 rounded-2xl bg-surface border border-border flex items-start gap-3 shadow-sm animate-in fade-in">
                      <Lightbulb className="w-5 h-5 text-gold-ink shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-text font-medium leading-relaxed">
                          Tựa truyện này đã có trong Tủ Sách của bạn với 1 nguồn khác. Bạn có muốn lưu liên kết này thành nguồn phụ bổ sung không?
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddAsSecondarySource}
                            className="px-3 py-1 rounded-full bg-gold-tint text-gold-ink text-xs font-bold hover:bg-gold transition-colors cursor-pointer shadow-xs"
                          >
                            + Thêm làm nguồn đọc phụ 🔗
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/comics/${existingComic.id}`)}
                            className="px-3 py-1 rounded-full bg-transparent hover:bg-surface text-text-muted text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Xem truyện hiện có
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reading Setup Grid (Progress, Status & Shelves) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chapter Stepper */}
              <div className="p-4 rounded-2xl bg-surface-raised/80 border border-border/70 flex flex-col justify-between shadow-2xs">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>Đang đọc tới chương</span>
                </label>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-full bg-gold-tint text-gold-ink flex items-center justify-center hover:bg-gold transition-all active:scale-95 shadow-xs font-bold text-lg cursor-pointer"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center bg-background py-1.5 px-3 rounded-xl border border-border">
                    <span className="font-serif text-sm text-primary font-bold">
                      Chương {currentChapter}
                    </span>
                    <span className="text-xs text-text-muted"> / {totalChapters}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentChapter((prev) => Math.min(totalChapters, prev + 1))
                    }
                    className="w-9 h-9 rounded-full bg-gold-tint text-gold-ink flex items-center justify-center hover:bg-gold transition-all active:scale-95 shadow-xs font-bold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reading Status Dropdown */}
              <div className="p-4 rounded-2xl bg-surface-raised/80 border border-border/70 flex flex-col justify-between shadow-2xs">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Trạng thái lưu trữ</span>
                </label>
                <div className="relative mt-2.5">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ComicStatus)}
                    className="w-full bg-background text-text text-xs font-semibold rounded-xl px-3 py-2 outline-none border border-border appearance-none cursor-pointer pr-10 focus:border-primary"
                  >
                    <option value="plan_to_read">🔖 Muốn đọc sớm (Dự định)</option>
                    <option value="reading">📖 Đang thưởng thức (Đang đọc)</option>
                    <option value="completed">🌸 Đã đọc xong trọn vẹn</option>
                    <option value="on_hold">⏳ Tạm dừng một thời gian</option>
                    <option value="dropped">🍂 Đã gác lại</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 pointer-events-none text-text-muted" />
                </div>
              </div>
            </div>

            {/* Bookshelf Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Phân loại vào kệ sách nhỏ</span>
                </label>
                <span className="text-xs text-gold-ink font-semibold">
                  Đã chọn {selectedShelfIds.length} kệ
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {shelves.map((shelf) => {
                  const isSelected = selectedShelfIds.includes(shelf.id);
                  return (
                    <button
                      key={shelf.id}
                      type="button"
                      onClick={() => handleToggleShelf(shelf.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                        isSelected
                          ? 'bg-primary-tint border border-primary-soft/60 text-primary-ink border-primary'
                          : 'border-border bg-surface-raised text-text-muted hover:bg-surface'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-ink" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-text-muted" />
                      )}
                      <span>
                        {shelf.name} {shelf.icon || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer (Embossed Floral Wax CTAs) */}
          <div className="px-6 sm:px-10 py-4 bg-surface/90 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Cloud className="w-4 h-4 text-gold-ink" />
              <span>Tự động đồng bộ lên Đám Mây Hoa Cỏ</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-accent text-on-accent text-xs font-bold shadow-md hover:bg-accent-ink transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-border-strong/40 cursor-pointer disabled:opacity-50"
              >
                <span>🌸 Lưu vào tủ sách</span>
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MOBILE FULL-PAGE VIEW (them-truyen-mobile.html)                       */}
      {/* =================================================================== */}
      <div className="lg:hidden flex flex-col w-full min-h-screen bg-surface-raised text-text pb-28">
        {/* Fixed Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface-raised/90 backdrop-blur-md shadow-xs border-b border-border-strong/20">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng"
                className="w-10 h-10 flex items-center justify-center rounded-full text-text hover:bg-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-xl">🌸</span>
            </div>

            <div className="flex-1 text-center px-2">
              <h1 className="font-serif text-sm font-bold text-text truncate">
                Thêm Truyện Mới
              </h1>
            </div>

            <div className="w-10" />
          </div>
        </header>

        {/* Mobile Main Body */}
        <main className="flex flex-col pt-16 px-4 space-y-4">
          {/* Subtle Botanical Header Ribbon Indicator */}
          <div className="flex items-center justify-center gap-2 py-2 text-gold-ink">
            <span className="text-xs">🌿</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-ink">
              Thảo Mộc &amp; Tủ Sách Cổ Điển
            </span>
            <span className="text-xs">🌿</span>
          </div>

          {/* Tab Switcher (Dán link / Nhập thủ công) */}
          <div className="w-full bg-surface-sunken p-1.5 rounded-full flex items-center justify-between shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'link'
                  ? 'bg-surface-raised text-accent-ink'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-primary" />
              <span>Dán liên kết</span>
              <span className="text-xs">🍃</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual'
                  ? 'bg-surface-raised text-accent-ink shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Nhập thủ công</span>
            </button>
          </div>

          {/* TAB 1: Dán Link */}
          {activeTab === 'link' ? (
            <div className="flex flex-col gap-4">
              {/* Section: Nhập Liên Kết */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="font-serif text-sm font-bold text-text flex items-center gap-1.5">
                    <span>🌿</span>
                    <span>Liên kết tác phẩm</span>
                  </label>
                  <span className="text-[10px] text-gold-ink bg-gold-tint/60 px-2 py-0.5 rounded-full font-bold">
                    Tự động phát hiện
                  </span>
                </div>

                <div className="relative w-full rounded-2xl bg-surface p-2.5 shadow-xs flex flex-col gap-2 border border-border-strong/20">
                  <div className="flex items-center gap-2 bg-surface-raised rounded-xl px-3 py-2">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="url"
                      value={sourceUrlInput}
                      onChange={(e) => setSourceUrlInput(e.target.value)}
                      placeholder="Dán URL truyện từ Cuutruyen, Blogtruyen..."
                      className="w-full bg-transparent text-xs text-text placeholder:text-text-muted/50 focus:outline-none truncate"
                    />
                    {sourceUrlInput && (
                      <button
                        type="button"
                        onClick={() => setSourceUrlInput('')}
                        className="text-text-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={isFetchingUrl}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-tint via-gold to-gold-tint text-gold-ink text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isFetchingUrl
                        ? 'Đang phân tích...'
                        : '✦ Thu thập thông tin từ trang ✦'}
                    </span>
                  </button>

                  {fetchError ? (
                    <p className="text-[11px] text-danger px-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fetchError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-text-muted px-1 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Tự động phân tích tên truyện, bìa minh họa, danh sách chương, tác giả và thể loại từ hơn 20 nguồn truyện phổ biến.
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Preview Card (Specimen Arch Cloche) */}
              <div className="flex flex-col bg-surface rounded-3xl p-4 shadow-xs relative overflow-hidden border border-border-strong/20">
                <div className="flex items-center justify-between pb-2 mb-2 bg-surface/60 -mx-4 -mt-4 px-4 pt-2.5 border-b border-border-strong/20">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-accent-ink" />
                    <span className="font-serif text-xs font-bold text-accent-ink">
                      Bản xem trước thảo mộc
                    </span>
                  </div>
                  <span className="text-[10px] bg-primary-tint border border-primary-soft/60 text-primary-ink px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Khớp tự động
                  </span>
                </div>

                {/* Arched Cloche Book Cover */}
                <div className="flex flex-col items-center mt-1">
                  <div className="relative w-36 h-52 rounded-t-[4rem] rounded-b-2xl overflow-hidden shadow-md bg-surface-sunken flex items-center justify-center border-2 border-border-strong/30">
                    <img
                      src={coverUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-xs text-on-accent px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                      {siteName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-1.5 rounded-full bg-surface text-text-muted text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-gold-ink" />
                    <span>✎ Đổi ảnh bìa thủ công</span>
                  </button>
                </div>

                {/* Editable Metadata Fields */}
                <div className="mt-3 flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                      Tên tác phẩm *
                    </label>
                    <div className="bg-surface-raised rounded-xl px-3 py-2 flex items-center justify-between shadow-xs border border-border-strong/20">
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (e.target.value.trim()) setTitleError(null);
                        }}
                        className="w-full font-serif text-sm font-bold text-text bg-transparent focus:outline-none"
                      />
                      <Edit3 className="w-4 h-4 text-primary" />
                    </div>
                    {titleError && (
                      <span className="text-[11px] text-danger block">
                        {titleError}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                      Tác giả / Họa sĩ
                    </label>
                    <div className="bg-surface-raised rounded-xl px-3 py-2 flex items-center justify-between shadow-xs border border-border-strong/20">
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full text-xs text-text bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                      Quy mô xuất bản
                    </label>
                    <div className="bg-surface-raised rounded-xl px-3 py-2 flex items-center justify-between shadow-xs border border-border-strong/20">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <input
                          type="number"
                          min={1}
                          value={totalChapters}
                          onChange={(e) => setTotalChapters(Number(e.target.value))}
                          className="w-16 text-xs font-bold text-text outline-none"
                        />
                        <span className="text-xs text-text-muted">chương</span>
                      </div>
                      <span className="text-[10px] bg-primary-tint border border-primary-soft/60 text-primary-ink px-2 py-0.5 rounded-full font-bold">
                        Hoàn tất
                      </span>
                    </div>
                  </div>

                  {/* Botanical Genre Tags */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                        Thể loại ghi nhận
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-[11px] text-accent-ink font-bold"
                      >
                        + Thêm nhãn
                      </button>
                    </div>

                    {isAddingTag && (
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="Tên thể loại..."
                          className="flex-1 px-3 py-1 text-xs bg-surface-raised rounded-lg border border-border-strong/30"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-3 py-1 bg-gold-tint text-gold-ink text-xs font-bold rounded-lg"
                        >
                          Lưu
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-primary-soft/50 text-primary-ink text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-text-muted hover:text-danger"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicate Notice */}
              {existingComic && (
                <div className="rounded-2xl bg-surface p-3.5 flex items-start gap-3 shadow-xs border border-border">
                  <Lightbulb className="w-5 h-5 text-gold-ink shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-serif text-xs font-bold text-text">
                      Đã tồn tại trong thư quán
                    </h3>
                    <p className="text-xs text-text-muted">
                      Tựa truyện này đã có trong tủ sách với một nguồn khác. Bạn có muốn gom đường dẫn này thành <strong className="text-text">Nguồn phụ dự phòng</strong>?
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={handleAddAsSecondarySource}
                        className="px-3 py-1 rounded-full bg-surface-raised text-accent-ink text-xs font-bold shadow-xs hover:bg-accent hover:text-on-accent transition-colors"
                      >
                        Gom thành nguồn phụ
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/comics/${existingComic.id}`)}
                        className="px-2 py-1 text-text-muted text-xs hover:underline"
                      >
                        Xem truyện
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Nhập Thủ Công (Mobile) */
            <div className="flex flex-col gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-4 text-center bg-surface-raised"
              >
                {coverUrl && coverUrl !== DEFAULT_COVER ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={coverUrl}
                      alt="Preview"
                      className="w-16 h-20 object-cover rounded-lg"
                    />
                    <span className="text-xs font-bold text-primary">Đã chọn ảnh</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-gold-ink" />
                    <p className="text-xs font-bold mt-1 text-text">
                      Tải ảnh bìa thủ công
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                  Tên tác phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(null);
                  }}
                  placeholder="Ví dụ: Bí Mật Dưới Rễ Cây Sồi..."
                  className={`w-full bg-surface-raised text-xs text-text rounded-xl px-3 py-2.5 outline-none border ${
                    titleError ? 'border-danger' : 'border-border'
                  }`}
                />
                {titleError && (
                  <span className="text-[11px] text-danger">{titleError}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Tên tác giả..."
                    className="w-full bg-surface-raised text-xs text-text rounded-xl px-3 py-2 border border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                    Tổng số chương
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalChapters}
                    onChange={(e) => setTotalChapters(Number(e.target.value))}
                    className="w-full bg-surface-raised text-xs text-text rounded-xl px-3 py-2 border border-border"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gold-ink uppercase tracking-wider">
                  Đường dẫn nguồn đọc (Source URL)
                </label>
                <input
                  type="url"
                  value={sourceUrlInput}
                  onChange={(e) => setSourceUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-raised text-xs text-text rounded-xl px-3 py-2 border border-border"
                />
              </div>
            </div>
          )}

          {/* Section: Thiết Lập Lộ Trình Đọc */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className="text-base">🌿</span>
              <h2 className="font-serif text-sm font-bold text-text">
                Thiết lập lộ trình đọc
              </h2>
            </div>

            {/* Stepper Card */}
            <div className="bg-surface rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5 border border-border-strong/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text">
                  Đang đọc tới chương
                </span>
                <span className="text-xs text-primary font-bold">
                  Tiến độ {progressPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <button
                  type="button"
                  onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-full bg-gold-tint text-gold-ink font-bold text-lg shadow-xs flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-lg font-bold text-accent-ink">
                      Chương {currentChapter}
                    </span>
                    <span className="text-xs text-text-muted">/ {totalChapters}</span>
                  </div>
                  <span className="text-[10px] text-gold-ink italic">
                    "Cánh hoa dạ nguyệt đầu mùa"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentChapter((prev) => Math.min(totalChapters, prev + 1))
                  }
                  className="w-10 h-10 rounded-full bg-gold-tint text-gold-ink font-bold text-lg shadow-xs flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-sunken rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-accent-soft via-primary-soft to-gold-tint h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="bg-surface rounded-2xl p-3 shadow-xs flex items-center justify-between border border-border-strong/20">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-ink" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gold-ink uppercase font-bold">
                    Trạng thái đọc
                  </span>
                  <span className="text-xs font-bold text-text">
                    {selectedStatus === 'plan_to_read'
                      ? 'Muốn đọc sớm'
                      : selectedStatus === 'reading'
                      ? 'Đang thưởng thức'
                      : selectedStatus === 'completed'
                      ? 'Đã đọc xong'
                      : selectedStatus === 'on_hold'
                      ? 'Tạm dừng'
                      : 'Đã gác lại'}
                  </span>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ComicStatus)}
                  className="px-3 py-1.5 bg-surface-raised rounded-full text-xs font-bold text-text shadow-xs outline-none border border-border"
                >
                  <option value="plan_to_read">🔖 Muốn đọc</option>
                  <option value="reading">📖 Đang đọc</option>
                  <option value="completed">🌸 Đã đọc xong</option>
                  <option value="on_hold">⏳ Tạm dừng</option>
                  <option value="dropped">🍂 Đã gác lại</option>
                </select>
              </div>
            </div>

            {/* Shelves Multi-Selection */}
            <div className="bg-surface rounded-2xl p-3.5 shadow-xs flex flex-col gap-2 border border-border-strong/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Phân loại vào kệ sách</span>
                </label>
                <span className="text-xs text-gold-ink">
                  Đã chọn {selectedShelfIds.length} kệ
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shelves.map((shelf) => {
                  const isSelected = selectedShelfIds.includes(shelf.id);
                  return (
                    <button
                      key={shelf.id}
                      type="button"
                      onClick={() => handleToggleShelf(shelf.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-2xs border ${
                        isSelected
                          ? 'bg-accent text-on-accent border-accent'
                          : 'bg-surface-raised text-text-muted border-border'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-on-accent" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-text-muted" />
                      )}
                      <span>
                        {shelf.name} {shelf.icon || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cloud Sync Toggle */}
            <div className="bg-surface rounded-2xl p-3 shadow-xs flex items-center justify-between border border-border-strong/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-soft/40 flex items-center justify-center text-primary">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text">
                    Đám Mây Hoa Cỏ
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Tự động đồng bộ vị trí đọc qua tài khoản
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-primary"
              />
            </div>
          </div>
        </main>

        {/* Mobile Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 w-full z-40 bg-surface-raised/95 backdrop-blur-md shadow-lg border-t border-border-strong/20 p-3">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="h-12 px-5 rounded-full text-xs font-bold text-accent-ink hover:bg-surface transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-full bg-accent text-on-accent text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lưu vào tủ sách</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
