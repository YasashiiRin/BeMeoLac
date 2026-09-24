import { Comic, Paginated, ComicStatus, SortOption, Source } from '../types';
import { mockComics } from '../mocks/comics';
import { simulateNetworkDelay } from './apiClient';

// In-memory working copy of comics for mutations in mock mode
let comicsDatabase: Comic[] = [...mockComics];

export interface GetComicsParams {
  status?: ComicStatus | 'all';
  shelf_id?: string;
  genre?: string;
  source?: string;
  search?: string;
  sort?: SortOption;
  has_new_chapter?: boolean;
  is_favorite?: boolean;
  page?: number;
  page_size?: number;
}

export const getComics = async (params: GetComicsParams = {}): Promise<Paginated<Comic>> => {
  await simulateNetworkDelay(180);

  let filtered = [...comicsDatabase];

  // Filter by shelf
  if (params.shelf_id && params.shelf_id !== 'all') {
    filtered = filtered.filter((c) => c.shelf_ids.includes(params.shelf_id!));
  }

  // Filter by status
  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((c) => c.status === params.status);
  }

  // Filter by source
  if (params.source && params.source !== 'all') {
    filtered = filtered.filter((c) =>
      c.sources.some((s) => s.site_name.toLowerCase() === params.source?.toLowerCase())
    );
  }

  // Filter by tag / genre
  if (params.genre && params.genre !== 'all') {
    filtered = filtered.filter((c) =>
      c.tags.some((t) => t.toLowerCase().includes(params.genre!.toLowerCase()))
    );
  }

  // Filter by new chapter flag
  if (params.has_new_chapter) {
    filtered = filtered.filter((c) => c.has_new_chapter);
  }

  // Filter by favorite
  if (params.is_favorite) {
    filtered = filtered.filter((c) => c.is_favorite);
  }

  // Filter by search term
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  const sort = params.sort || 'updated_at';
  filtered.sort((a, b) => {
    if (sort === 'updated_at') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sort === 'title') {
      return a.title.localeCompare(b.title, 'vi');
    }
    if (sort === 'rating') {
      return b.rating - a.rating;
    }
    if (sort === 'progress') {
      const progA = a.total_chapters > 0 ? a.current_chapter / a.total_chapters : 0;
      const progB = b.total_chapters > 0 ? b.current_chapter / b.total_chapters : 0;
      return progB - progA;
    }
    return 0;
  });

  const page = params.page || 1;
  const pageSize = params.page_size || 10;
  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    page_size: pageSize,
  };
};

export const getComicById = async (id: string): Promise<Comic | null> => {
  await simulateNetworkDelay(120);
  const found = comicsDatabase.find((c) => c.id === id);
  return found || null;
};

export const toggleFavorite = async (id: string): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Comic not found');

  const updated: Comic = {
    ...comicsDatabase[index],
    is_favorite: !comicsDatabase[index].is_favorite,
    updated_at: new Date().toISOString(),
  };
  comicsDatabase[index] = updated;
  return updated;
};

export const updateComic = async (id: string, data: Partial<Comic>): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Comic not found');

  const existing = comicsDatabase[index];
  const updated: Comic = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  comicsDatabase[index] = updated;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comic-updated', { detail: updated }));
  }
  return updated;
};

export const updateComicProgress = async (id: string, chapter: number): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Comic not found');

  const comic = comicsDatabase[index];
  const newChapter = Math.min(Math.max(0, chapter), comic.total_chapters);
  const newStatus = newChapter >= comic.total_chapters ? 'completed' : 'reading';

  const updated: Comic = {
    ...comic,
    current_chapter: newChapter,
    status: newStatus,
    last_read_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  comicsDatabase[index] = updated;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comic-updated', { detail: updated }));
  }
  return updated;
};

export const addComic = async (newComicData: Omit<Comic, 'id' | 'created_at' | 'updated_at'>): Promise<Comic> => {
  await simulateNetworkDelay(200);
  const newComic: Comic = {
    ...newComicData,
    id: `comic_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  comicsDatabase.unshift(newComic);
  return newComic;
};

export interface ComicPreview {
  title: string;
  author: string;
  cover_url: string;
  total_chapters: number;
  tags: string[];
  site_name: string;
  favicon_url: string;
}

export const fetchFromUrl = async (url: string): Promise<ComicPreview> => {
  await simulateNetworkDelay(350);
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    throw new Error('Đường dẫn không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://');
  }

  // Derive site name
  let siteName = 'Khác';
  if (trimmed.includes('cuutruyen')) siteName = 'Cuutruyen';
  else if (trimmed.includes('blogtruyen')) siteName = 'BlogTruyen';
  else if (trimmed.includes('kakao')) siteName = 'Kakao Webtoon';
  else if (trimmed.includes('webtoons') || trimmed.includes('webtoon')) siteName = 'Webtoon';
  else if (trimmed.includes('bilibili')) siteName = 'Bilibili';
  else if (trimmed.includes('mangadex')) siteName = 'MangaDex';
  else if (trimmed.includes('hako')) siteName = 'Hako';
  else {
    try {
      const parsed = new URL(trimmed);
      siteName = parsed.hostname.replace(/^www\./, '');
    } catch {
      siteName = 'Nguồn mới';
    }
  }

  // Check known match for exact Stitch design showcase
  if (trimmed.toLowerCase().includes('tiem-tap-hoa') || trimmed.toLowerCase().includes('thao-moc')) {
    return {
      title: 'Tiệm Tạp Hóa Phép Thuật Thảo Mộc',
      author: 'Hatori M. (Minh họa: Lirien)',
      cover_url:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD69NfgFvW2znXgoxCJratVdrZQOvY21Pg0ZbYhIerK-jyRA3Vl9vl2gw0mkfxifvDcZDCS_EHcNj7olGmjgBuq87nPiiTgW_1jqfmP3m4jnNxJ2J_AVgar3RikSZixBYldMyj425cuYLe153rtjXyae2SoGrbxCfR7CxDKMvqDpthpMHDY8WOoOoBneojzxq-Qk0qoVtozx-uNnjAFOgYNR9HUzK2FH8s_pCtCcbupehhIKWpQ5w',
      total_chapters: 120,
      tags: ['Chữa lành', 'Phép thuật', 'Đời thường', 'Nhà kính cổ'],
      site_name: siteName,
      favicon_url: '',
    };
  }

  // Parse a title from slug if possible
  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || 'Truyen-Moi';
    const words = slug.replace(/[-_]+/g, ' ').replace(/\.[a-z0-9]+$/i, '').trim();
    const formattedTitle = words
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    return {
      title: formattedTitle || 'Tác Phẩm Thảo Mộc Mới',
      author: 'Đang cập nhật',
      cover_url:
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      total_chapters: 85,
      tags: ['Chữa lành', 'Phép thuật', 'Nhà kính'],
      site_name: siteName,
      favicon_url: '',
    };
  } catch {
    throw new Error('Không thể phân tích dữ liệu từ liên kết này. Vui lòng kiểm tra lại đường dẫn!');
  }
};

export const findExistingByTitle = async (title: string): Promise<Comic | null> => {
  await simulateNetworkDelay(50);
  const t = title.trim().toLowerCase();
  if (!t) return null;
  return comicsDatabase.find((c) => c.title.trim().toLowerCase() === t) || null;
};

export const addSourceToComic = async (
  comicId: string,
  source: Source
): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === comicId);
  if (index === -1) throw new Error('Comic not found');
  const existing = comicsDatabase[index];
  const updatedSources = [...existing.sources, source];
  const updated: Comic = {
    ...existing,
    sources: updatedSources,
    updated_at: new Date().toISOString(),
  };
  comicsDatabase[index] = updated;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comic-updated', { detail: updated }));
  }
  return updated;
};

export const create = async (
  newComicData: Omit<Comic, 'id' | 'created_at' | 'updated_at'>
): Promise<Comic> => {
  const result = await addComic(newComicData);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comic-updated', { detail: result }));
  }
  return result;
};

export const deleteComic = async (id: string): Promise<void> => {
  await simulateNetworkDelay(150);
  comicsDatabase = comicsDatabase.filter((c) => c.id !== id);
};

export const addComicToShelf = async (shelfId: string, comicId: string): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === comicId);
  if (index === -1) throw new Error('Comic not found');
  const comic = comicsDatabase[index];
  if (!comic.shelf_ids.includes(shelfId)) {
    comicsDatabase[index] = {
      ...comic,
      shelf_ids: [...comic.shelf_ids, shelfId],
      updated_at: new Date().toISOString(),
    };
  }
  return comicsDatabase[index];
};

export const removeComicFromShelf = async (shelfId: string, comicId: string): Promise<Comic> => {
  await simulateNetworkDelay(100);
  const index = comicsDatabase.findIndex((c) => c.id === comicId);
  if (index === -1) throw new Error('Comic not found');
  const comic = comicsDatabase[index];
  comicsDatabase[index] = {
    ...comic,
    shelf_ids: comic.shelf_ids.filter((sid) => sid !== shelfId),
    updated_at: new Date().toISOString(),
  };
  return comicsDatabase[index];
};

export interface ComicSummary {
  total: number;
  by_status: {
    reading: number;
    completed: number;
    plan_to_read: number;
    on_hold: number;
    dropped: number;
  };
  new_chapters: number;
}

export const getSummary = async (): Promise<ComicSummary> => {
  await simulateNetworkDelay(80);
  const reading = comicsDatabase.filter((c) => c.status === 'reading').length;
  const completed = comicsDatabase.filter((c) => c.status === 'completed').length;
  const plan_to_read = comicsDatabase.filter((c) => c.status === 'plan_to_read').length;
  const on_hold = comicsDatabase.filter((c) => c.status === 'on_hold').length;
  const dropped = comicsDatabase.filter((c) => c.status === 'dropped').length;
  const new_chapters = comicsDatabase.filter((c) => c.has_new_chapter).length;

  return {
    total: comicsDatabase.length,
    by_status: {
      reading,
      completed,
      plan_to_read,
      on_hold,
      dropped,
    },
    new_chapters,
  };
};

export const comicsService = {
  getComics,
  getComicById,
  getSummary,
  toggleFavorite,
  update: updateComic,
  updateProgress: updateComicProgress,
  updateComicProgress,
  updateComic,
  addComic,
  create,
  fetchFromUrl,
  findExistingByTitle,
  addSourceToComic,
  deleteComic,
  addComicToShelf,
  removeComicFromShelf,
};


