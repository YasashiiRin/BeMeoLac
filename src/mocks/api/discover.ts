import { Comic, DiscoverPage, DiscoverResult, LibraryAddRequest, LibraryAddResult, Source } from '../../types';
import { ApiError, simulateNetworkDelay } from '../../services/http';
import { fold } from '../../utils/text';
import { db } from './store';
import { findFeedWork } from './home';

/*
 * Mock web search (GET /api/discover/search) and save (POST /api/library) for mock mode.
 * A small made-up catalog: two of its works are also in the mock library, so "Đã có trong tủ" shows.
 * A query containing "chậm" pretends AniList was too slow, to show the providers_failed note.
 */

const PROVIDER_NAMES: Record<string, string> = { mangadex: 'MangaDex', anilist: 'AniList' };
const PAGE_SIZE = 20;

type CatalogEntry = Omit<DiscoverResult, 'in_library' | 'library_item_id' | 'provider_name' | 'attribution'>;

const cover = (photo: string) => `https://images.unsplash.com/${photo}?w=400&auto=format&fit=crop&q=80`;

const CATALOG: CatalogEntry[] = [
  {
    provider: 'mangadex',
    external_id: 'md-tiem-tap-hoa',
    external_ids: { mangadex: 'md-tiem-tap-hoa', anilist: '101' },
    providers: ['mangadex', 'anilist'],
    title: 'Tiệm Tạp Hóa Thời Gian',
    alt_titles: ['Time Grocery', 'Jikan no Zakkaya'],
    description: 'Một tiệm tạp hóa nhỏ bán những khoảnh khắc đã qua.',
    cover_url: cover('photo-1481627834876-b7833e8f5570'),
    authors: ['Hatori M.'],
    genres: ['Chữa lành', 'Phép thuật', 'Đời thường'],
    status: 'ongoing',
    latest_chapter: 124,
    links: [
      { site_name: 'MangaDex', url: 'https://mangadex.org/title/md-tiem-tap-hoa' },
      { site_name: 'Webtoon', url: 'https://www.webtoons.com/en/time-grocery/list' },
    ],
  },
  {
    provider: 'mangadex',
    external_id: 'md-tiem-tap-hoa-ngoai-truyen',
    external_ids: { mangadex: 'md-tiem-tap-hoa-ngoai-truyen' },
    providers: ['mangadex'],
    title: 'Tiệm Tạp Hóa Thời Gian: Ngoại Truyện',
    alt_titles: ['Time Grocery: After Hours'],
    description: 'Những câu chuyện nhỏ sau giờ đóng cửa của tiệm.',
    cover_url: cover('photo-1512820790803-83ca734da794'),
    authors: ['Hatori M.'],
    genres: ['Chữa lành'],
    status: 'completed',
    latest_chapter: 12,
    links: [{ site_name: 'MangaDex', url: 'https://mangadex.org/title/md-tiem-tap-hoa-ngoai-truyen' }],
  },
  {
    provider: 'mangadex',
    external_id: 'md-vuon-phu-thuy',
    external_ids: { mangadex: 'md-vuon-phu-thuy' },
    providers: ['mangadex'],
    title: 'Khu Vườn Phù Thủy Bí Mật',
    alt_titles: ['Secret Witch Garden'],
    description: 'Cô phù thủy nhỏ chăm một khu vườn biết hát.',
    cover_url: cover('photo-1416879595882-3373a0480b5b'),
    authors: ['Solaria'],
    genres: ['Kỳ ảo'],
    status: 'completed',
    latest_chapter: 88,
    links: [{ site_name: 'MangaDex', url: 'https://mangadex.org/title/md-vuon-phu-thuy' }],
  },
  {
    provider: 'anilist',
    external_id: '303',
    external_ids: { anilist: '303' },
    providers: ['anilist'],
    title: 'Ngọn Hải Đăng Cuối Mùa Gió',
    alt_titles: ['The Last Lighthouse of the Windy Season'],
    description: 'Người giữ hải đăng và những lá thư trôi dạt vào bờ.',
    cover_url: cover('photo-1500534314209-a25ddb2bd429'),
    authors: ['Aoi Kaze'],
    genres: ['Phiêu lưu', 'Chính kịch'],
    status: 'hiatus',
    latest_chapter: 64,
    links: [{ site_name: 'Official site', url: 'https://example.com/lighthouse' }],
  },
  {
    provider: 'mangadex',
    external_id: 'md-tram-tau-sao',
    external_ids: { mangadex: 'md-tram-tau-sao', anilist: '404' },
    providers: ['mangadex', 'anilist'],
    title: 'Trạm Tàu Chở Sao',
    alt_titles: ['Star Train Station'],
    description: 'Chuyến tàu đêm đưa những vì sao lạc về nhà.',
    cover_url: cover('photo-1519681393784-d120267933ba'),
    authors: ['Renji S.'],
    genres: ['Kỳ ảo', 'Chữa lành'],
    status: 'ongoing',
    latest_chapter: null,
    links: [{ site_name: 'MangaDex', url: 'https://mangadex.org/title/md-tram-tau-sao' }],
  },
];

const PAGE_URL: Record<string, (id: string) => string> = {
  mangadex: (id) => `https://mangadex.org/title/${id}`,
  anilist: (id) => `https://anilist.co/manga/${id}`,
};

const titlesOf = (e: CatalogEntry) => [e.title, ...e.alt_titles].map(fold);

/** The mock library's comic for a catalog work: same title or one of its links. */
const inLibrary = (e: CatalogEntry): Comic | undefined => {
  const titles = titlesOf(e);
  const links = new Set(e.links.map((l) => l.url));
  return db.comics.find((c) => titles.includes(fold(c.title)) || c.sources.some((s) => links.has(s.url)));
};

const toResult = (e: CatalogEntry): DiscoverResult => {
  const saved = inLibrary(e);
  return {
    ...e,
    provider_name: PROVIDER_NAMES[e.provider],
    attribution: [e.provider, ...e.providers.filter((p) => p !== e.provider)]
      .filter((p) => e.external_ids[p])
      .map((p) => ({ provider: p, name: PROVIDER_NAMES[p], url: PAGE_URL[p](e.external_ids[p]) })),
    in_library: !!saved,
    library_item_id: saved?.id ?? null,
  };
};

export async function search(q: string, page = 1): Promise<DiscoverPage> {
  await simulateNetworkDelay(450);
  const query = fold(q);
  const slow = query.includes('cham');
  const hits = CATALOG.filter((e) => titlesOf(e).some((t) => t.includes(query.replace('cham', '').trim())))
    .filter((e) => !slow || e.providers.includes('mangadex'))
    // exact titles first, like the server's ranking
    .sort((a, b) => Number(titlesOf(b).includes(query)) - Number(titlesOf(a).includes(query)));
  return {
    query: q,
    page,
    results: hits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toResult),
    providers: Object.keys(PROVIDER_NAMES),
    provider_names: PROVIDER_NAMES,
    providers_failed: slow ? ['anilist'] : [],
  };
}

/** A home feed suggestion (mocks/api/home.ts) as a catalog work, so "Thêm vào tủ" works from the home page too. */
const fromFeed = (provider: string, externalId: string): CatalogEntry | undefined => {
  const item = findFeedWork(provider, externalId);
  if (!item) return undefined;
  return {
    provider: item.provider,
    external_id: item.external_id,
    external_ids: item.external_ids,
    providers: [item.provider],
    title: item.title,
    alt_titles: [],
    description: '',
    cover_url: item.cover_url,
    authors: item.authors,
    genres: item.genres,
    status: item.status,
    latest_chapter: item.latest_chapter,
    links: item.attribution.map((a) => ({ site_name: a.name, url: a.url })),
  };
};

export async function add(data: LibraryAddRequest): Promise<LibraryAddResult> {
  await simulateNetworkDelay(600);
  if (!('provider' in data)) throw new ApiError(422, 'Bản thử chỉ lưu được truyện từ kết quả tìm kiếm', 'link_not_supported');
  const entry = CATALOG.find((e) => e.provider === data.provider && e.external_id === data.external_id) ?? fromFeed(data.provider, data.external_id);
  if (!entry) throw new ApiError(404, 'Không tìm thấy truyện này ở nguồn tìm kiếm', 'work_not_found');

  const existing = inLibrary(entry);
  if (existing) return { comic: existing, created: false };

  const now = new Date().toISOString();
  const sources: Source[] = entry.links.map((l, i) => ({
    id: `src_${Date.now()}_${i}`,
    site_name: l.site_name,
    url: l.url,
    favicon_url: '',
    chapter_url: l.url,
    latest_chapter: entry.latest_chapter ?? 0,
    is_alive: true,
    last_checked_at: null,
  }));
  const current = data.current_chapter ?? 0;
  const comic: Comic = {
    id: `comic_${Date.now()}`,
    title: entry.title,
    author: entry.authors.join(', '),
    description: entry.description,
    cover_url: entry.cover_url,
    status: data.status ?? (current > 0 ? 'reading' : 'plan_to_read'),
    current_chapter: current,
    total_chapters: entry.latest_chapter ?? 0,
    rating: 0,
    is_favorite: false,
    note: '',
    tags: entry.genres,
    sources,
    primary_source_id: sources[0]?.id ?? '',
    shelf_ids: ['all', ...(data.shelf_ids ?? [])],
    has_new_chapter: false,
    last_read_at: null,
    created_at: now,
    updated_at: now,
  };
  db.comics.unshift(comic);
  return { comic, created: true };
}
