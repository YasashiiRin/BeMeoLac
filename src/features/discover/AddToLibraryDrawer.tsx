import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import type { Comic, ComicStatus, DiscoverResult, Shelf } from '../../types';
import { ResponsiveDrawer } from '../../components/ResponsiveDrawer';
import { StatusChip } from '../../components/StatusChip';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { addToLibrary } from '../../services/discoverService';
import { shelvesService } from '../../services/shelfService';
import { isMock } from '../../services/http';
import { isApiError } from '../../services/http';

const STATUSES: ComicStatus[] = ['plan_to_read', 'reading', 'completed', 'on_hold', 'dropped'];

// Shelf ids must come from the same place the save goes to: mock shelves don't exist on the server.
const CAN_PICK_SHELVES = isMock('shelves') === isMock('discover');

/** What the form needs from a work: a search result, or a home feed suggestion (FeedItem). */
export type AddableWork = Pick<
  DiscoverResult,
  'provider' | 'provider_name' | 'external_id' | 'title' | 'cover_url' | 'authors' | 'latest_chapter' | 'attribution'
>;

interface AddToLibraryDrawerProps {
  result: AddableWork | null;
  onClose: () => void;
  /** after a successful save (created, or already in the library) */
  onSaved: (comic: Comic, created: boolean) => void;
}

const errorMessage = (err: unknown): string => {
  if (isApiError(err, 'provider_unavailable')) return 'Nguồn tìm kiếm đang bận, nàng thử lại sau một chút nhé.';
  if (isApiError(err, 'work_not_found')) return 'Nguồn tìm kiếm không còn truyện này nữa, nàng tìm lại thử nhé.';
  if (isApiError(err, 'shelf_not_found')) return 'Có kệ sách không còn nữa, nàng chọn lại kệ giúp nhé.';
  if (isApiError(err, 'network_error')) return 'Không kết nối được máy chủ, nàng kiểm tra mạng rồi thử lại nhé.';
  return (err instanceof Error && err.message) || 'Chưa thêm được truyện, nàng thử lại nhé.';
};

/** "Thêm vào tủ": reading status, current chapter and shelves, then POST /api/library. */
export const AddToLibraryDrawer: React.FC<AddToLibraryDrawerProps> = ({ result, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ComicStatus>('plan_to_read');
  const [statusTouched, setStatusTouched] = useState(false);
  const [chapterText, setChapterText] = useState(''); // blank = 0, so typing never gives "03"
  const chapter = Math.max(0, Math.floor(Number(chapterText) || 0));
  const [shelves, setShelves] = useState<Shelf[] | null>(null);
  const [shelfIds, setShelfIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // a fresh form for each result
  useEffect(() => {
    if (!result) return;
    setStatus('plan_to_read');
    setStatusTouched(false);
    setChapterText('');
    setShelfIds([]);
    setError(null);
  }, [result]);

  useEffect(() => {
    if (!result || !CAN_PICK_SHELVES || shelves) return;
    shelvesService
      .list()
      .then((all) => setShelves(all.filter((s) => s.id !== 'all')))
      .catch((err) => {
        console.error('Error loading shelves:', err);
        setShelves([]);
      });
  }, [result, shelves]);

  const onChapter = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    setChapterText(digits);
    const n = Number(digits) || 0;
    // reading already: "Đang đọc" unless she picked a status herself
    if (!statusTouched) setStatus(n > 0 ? 'reading' : 'plan_to_read');
  };

  const toggleShelf = (id: string) => setShelfIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { comic, created } = await addToLibrary({
        provider: result.provider,
        external_id: result.external_id,
        status,
        current_chapter: chapter,
        ...(shelfIds.length ? { shelf_ids: shelfIds } : {}),
      });
      showToast(created ? `Đã thêm “${comic.title}” vào tủ sách! 🌸` : `“${comic.title}” đã có sẵn trong tủ của nàng 🌿`, created ? 'success' : 'info');
      onSaved(comic, created);
    } catch (err) {
      console.error('Error adding to library:', err);
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const latest = result?.latest_chapter;

  return (
    <ResponsiveDrawer isOpen={!!result} onClose={saving ? () => {} : onClose} title="Thêm vào tủ" subtitle={result?.title} maxWidth="md">
      {result && (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex gap-3 items-start">
            <div className="w-16 h-24 shrink-0 rounded-t-full rounded-b-lg overflow-hidden bg-surface-sunken border border-border">
              {result.cover_url ? (
                <img src={result.cover_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">🌿</span>
              )}
            </div>
            <div className="min-w-0 text-xs text-text-muted flex flex-col gap-1">
              {result.authors.length > 0 && <p className="truncate">✍ {result.authors.join(', ')}</p>}
              <p className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-gold-ink shrink-0" />
                {latest ? `Nguồn đang có ${latest} chương` : 'Nguồn chưa cho biết số chương'}
              </p>
              <p className="italic">Dữ liệu từ {result.attribution.map((a) => a.name).join(', ') || result.provider_name}</p>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Trạng thái đọc</legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <StatusChip
                  key={s}
                  status={s}
                  size="sm"
                  isActive={status === s}
                  onClick={() => {
                    setStatus(s);
                    setStatusTouched(true);
                  }}
                />
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Đang đọc tới chương</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={chapterText}
              onChange={(e) => onChapter(e.target.value)}
              className="w-32 bg-surface-raised text-text text-sm font-semibold rounded-xl px-3 py-2 outline-none border border-border focus:border-primary"
            />
            {latest != null && chapter > latest && (
              <span className="text-[11px] text-text-muted italic">
                Nàng đọc xa hơn số chương nguồn đang biết ({latest}) — không sao đâu, tủ sẽ ghi nhận tiến độ của nàng 🌱
              </span>
            )}
          </label>

          {CAN_PICK_SHELVES && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Xếp vào kệ</legend>
              {shelves === null ? (
                <div className="h-8 w-48 rounded-full bg-surface-sunken animate-pulse" />
              ) : shelves.length === 0 ? (
                <p className="text-xs text-text-muted italic">Nàng chưa có kệ riêng nào, truyện sẽ nằm trong “Tất cả”.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {shelves.map((shelf) => {
                    const on = shelfIds.includes(shelf.id);
                    return (
                      <button
                        key={shelf.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleShelf(shelf.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          on ? 'border-primary bg-primary-tint text-primary-ink' : 'border-border bg-surface-raised text-text-muted hover:bg-surface'
                        }`}
                      >
                        {on ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        <span>
                          {shelf.name} {shelf.icon || ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          )}

          {error && (
            <p role="alert" className="text-xs text-danger font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="text" size="md" onClick={onClose} disabled={saving}>
              Để sau
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={saving}>
              {saving ? 'Đang cất vào tủ...' : '🌸 Thêm vào tủ'}
            </Button>
          </div>
        </form>
      )}
    </ResponsiveDrawer>
  );
};
