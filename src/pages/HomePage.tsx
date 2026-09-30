import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sprout, Telescope } from 'lucide-react';
import type { FeedItem, HomeOut, HomeSection, HomeSectionKey } from '../types';
import { homeService } from '../services/homeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ComicCardSkeleton } from '../components/ComicCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Button } from '../components/Button';
import { WorldIcon } from '../components/icons/WorldIcon';
import { AddToLibraryDrawer } from '../features/discover/AddToLibraryDrawer';
import { FeedCard } from '../features/home/FeedCard';
import { HomeRow } from '../features/home/HomeRow';
import { StarterTastesCard } from '../features/home/StarterTastesCard';

/* "/" — Thế giới: new comics from across the web for her taste (GET /api/home). Discovery only:
   her own comics live in /library. */

const SECTION_UI: Record<HomeSectionKey, { title: string; icon: string; hint: string }> = {
  for_you: { title: 'Dành cho nàng', icon: '💝', hint: 'Chọn riêng theo gu đọc của nàng' },
  new_releases: { title: 'Mới ra mắt hợp gu', icon: '🌱', hint: 'Những bộ vừa nảy mầm gần đây' },
  trending: { title: 'Đang được yêu thích', icon: '✨', hint: 'Nhiều người đang mê mẩn' },
};
// the page shows these, in this order, whatever else the API may send
const FEED_KEYS = Object.keys(SECTION_UI) as HomeSectionKey[];

const DISCOVER_HREF = '/search?tab=discover';
const UNDO_MS = 5000; // "Hoàn tác" window before the dismissal is sent
const FADE_MS = 300;
const BUILDING_RETRY_MS = 20000; // feed_status "building": ask again quietly…
const BUILDING_RETRIES = 3; // …a few times
const SKIP_STARTER_KEY = 'home-starter-skipped';

const itemKey = (item: Pick<FeedItem, 'provider' | 'external_id'>) => `${item.provider}:${item.external_id}`;

/** "YYYY-MM-DD" → "Thứ Tư, 30 tháng 9, 2026" */
const formatDay = (day?: string) => {
  const d = day ? new Date(`${day}T00:00:00`) : new Date();
  const text = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const readSkipped = () => {
  try {
    return sessionStorage.getItem(SKIP_STARTER_KEY) === '1';
  } catch {
    return false;
  }
};

export const HomePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [home, setHome] = useState<HomeOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [adding, setAdding] = useState<FeedItem | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set()); // dismissed or saved: off the page
  const [leaving, setLeaving] = useState<Set<string>>(() => new Set()); // fading out
  const [starterSkipped, setStarterSkipped] = useState(readSkipped);

  const requestId = useRef(0);
  const retries = useRef(0);
  const pendingDismissals = useRef(new Map<string, { item: FeedItem; timer: number }>());

  const load = useCallback(async (quiet = false) => {
    const id = ++requestId.current;
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await homeService.get();
      if (id === requestId.current) setHome(data);
    } catch (err) {
      console.error('Error loading Thế giới:', err);
      if (id === requestId.current && !quiet) setError(err);
    } finally {
      if (id === requestId.current && !quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // still preparing: the next request adds what the providers were slow to answer
  useEffect(() => {
    if (home?.feed_status !== 'building' || retries.current >= BUILDING_RETRIES) return;
    const t = window.setTimeout(() => {
      retries.current += 1;
      load(true);
    }, BUILDING_RETRY_MS);
    return () => window.clearTimeout(t);
  }, [home, load]);

  // leaving the page: send the dismissals still waiting out their "Hoàn tác" window
  useEffect(() => {
    const pending = pendingDismissals.current;
    return () => {
      pending.forEach(({ item, timer }) => {
        window.clearTimeout(timer);
        homeService.dismiss(item.provider, item.external_id).catch((err) => console.error('Error dismissing:', err));
      });
      pending.clear();
    };
  }, []);

  /* ── actions ── */

  const unhide = (key: string) =>
    setHidden((h) => {
      const next = new Set(h);
      next.delete(key);
      return next;
    });

  const sendDismissal = (key: string) => {
    const entry = pendingDismissals.current.get(key);
    if (!entry) return;
    pendingDismissals.current.delete(key);
    homeService.dismiss(entry.item.provider, entry.item.external_id).catch((err) => {
      console.error('Error dismissing:', err);
      unhide(key);
      showToast('Chưa ẩn được truyện này, nàng thử lại nhé', 'error');
    });
  };

  const undoDismissal = (key: string) => {
    const entry = pendingDismissals.current.get(key);
    if (entry) window.clearTimeout(entry.timer);
    pendingDismissals.current.delete(key);
    unhide(key);
  };

  const dismiss = (item: FeedItem) => {
    const key = itemKey(item);
    setLeaving((s) => new Set(s).add(key));
    window.setTimeout(() => {
      setHidden((h) => new Set(h).add(key));
      setLeaving((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }, FADE_MS);
    pendingDismissals.current.set(key, { item, timer: window.setTimeout(() => sendDismissal(key), UNDO_MS) });
    showToast('Đã ẩn truyện này', 'info', { action: { label: 'Hoàn tác', onClick: () => undoDismissal(key) }, duration: UNDO_MS });
  };

  // saved (or already there): it is in her library now, so it leaves Thế giới
  const saved = () => {
    if (adding) setHidden((h) => new Set(h).add(itemKey(adding)));
    setAdding(null);
  };

  const saveStarterTastes = async (tastes: string[]) => {
    try {
      updateUser(await homeService.setStarterTastes(tastes));
      showToast('Đã gieo hạt gu đọc, thế giới đang chọn truyện cho nàng 🌱', 'success');
      await load();
    } catch (err) {
      console.error('Error saving starter tastes:', err);
      showToast('Chưa lưu được gu đọc, nàng thử lại nhé', 'error');
    }
  };

  const skipStarter = () => {
    setStarterSkipped(true);
    try {
      sessionStorage.setItem(SKIP_STARTER_KEY, '1');
    } catch {
      // storage blocked: hidden until reload
    }
  };

  /* ── render ── */

  const header = (
    <div className="relative bg-sunbeam-gradient border-1.5 border-border-strong rounded-3xl p-4 sm:p-6 shadow-botanical overflow-hidden">
      <WorldIcon className="absolute -top-3 right-2 w-28 h-28 text-primary opacity-10 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text flex items-center gap-2">
              <WorldIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
              Thế giới
            </h1>
            <span className="text-accent-ink text-lg" aria-hidden="true">✿</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-raised/80 border border-border text-text-muted">
              {formatDay(home?.date)}
            </span>
          </div>
          <p className="text-sm sm:text-base text-text-muted mt-1.5">
            Hôm nay thế giới có gì mới cho nàng, <strong className="text-text font-semibold">{user?.display_name || 'nàng'}</strong>?
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate('/library')} iconLeft={<BookOpen className="w-3.5 h-3.5 text-text-muted" />}>
            Tủ sách
          </Button>
          <Button variant="honey" size="sm" onClick={() => navigate(DISCOVER_HREF)} iconLeft={<Telescope className="w-3.5 h-3.5" />}>
            Tìm truyện
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8" role="status" aria-label="Đang tải Thế giới">
        {header}
        {FEED_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-3">
            <div className="h-6 w-48 rounded-md bg-surface-sunken animate-pulse" />
            <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-5 lg:gap-4.5">
              {[0, 1, 2, 3, 4].map((n) => (
                <ComicCardSkeleton key={n} className="shrink-0 w-[44%] sm:w-[30%] md:w-[23%] lg:w-auto" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState error={error} onRetry={() => load()} title="Thế giới chưa mở được" />
      </div>
    );
  }

  const sections = FEED_KEYS.map((key) => home.sections.find((s) => s.key === key))
    .filter((s): s is HomeSection => !!s)
    .map((s) => ({ ...s, items: s.items.filter((i) => !hidden.has(itemKey(i))) }))
    .filter((s) => s.items.length > 0);
  const showStarter = home.needs_starter_tastes && !starterSkipped;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {header}

      {showStarter && (
        <StarterTastesCard options={home.starter_options} initial={home.starter_tastes} onSave={saveStarterTastes} onSkip={skipStarter} />
      )}

      {home.feed_status === 'building' && (
        <p role="status" className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-leaf-tint/70 border border-leaf/40 text-xs sm:text-sm text-text">
          <Sprout className="w-4 h-4 text-leaf-ink shrink-0 animate-pulse" aria-hidden="true" />
          Thế giới đang chuẩn bị gợi ý, nàng quay lại sau ít phút nhé 🌱
        </p>
      )}

      {sections.length === 0 ? (
        <EmptyState
          icon="🌍"
          title="Thế giới hôm nay còn yên ắng"
          description="Chưa có gợi ý mới cho nàng lúc này. Nàng thử tìm vài bộ truyện trên MangaDex và AniList rồi thêm vào tủ nhé!"
          actionText="Tìm truyện mới"
          onAction={() => navigate(DISCOVER_HREF)}
        />
      ) : (
        sections.map((s) => {
          const ui = SECTION_UI[s.key];
          return (
            <HomeRow
              key={s.key}
              title={ui.title}
              icon={ui.icon}
              hint={ui.hint}
              items={s.items}
              getKey={itemKey}
              renderItem={(item) => <FeedCard item={item} onAdd={setAdding} onDismiss={dismiss} leaving={leaving.has(itemKey(item))} />}
            />
          );
        })
      )}

      {home.feed_status === 'off' && (
        <p className="text-center text-xs text-text-muted italic">
          Gợi ý đang không theo gu riêng của nàng ·{' '}
          <Link to="/account/taste" className="font-semibold text-primary-ink underline underline-offset-2">
            Bật lại trong Gu đọc
          </Link>
        </p>
      )}

      <AddToLibraryDrawer result={adding} onClose={() => setAdding(null)} onSaved={saved} />
    </div>
  );
};
