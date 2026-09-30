import { FeedItem, HomeOut, HomeSection, HomeSectionKey, StarterOption } from '../../types';
import { ApiError, simulateNetworkDelay } from '../../services/http';
import { fold } from '../../utils/text';
import { db } from './store';
import { currentSettings, setStarterTastes as saveStarterTastes } from './users';

/*
 * Mock "Thế giới" (GET /api/home, POST /api/home/dismiss, PUT /api/users/me/starter-tastes):
 * suggestions from a small made-up catalog, minus what is already in the mock library. Saving a
 * suggestion goes through the discover mock (POST /api/library), which asks findFeedWork.
 */

const TITLES: Record<HomeSectionKey, string> = {
  for_you: 'Dành cho nàng',
  new_releases: 'Mới ra mắt hợp gu',
  trending: 'Đang được yêu thích',
};

/** The moods in the order the API lists them (app/services/taste.py MOODS). */
export const STARTER_OPTIONS: StarterOption[] = [
  { value: 'Chữa lành', label: 'Chữa lành', icon: '🌿' },
  { value: 'Cổ tích', label: 'Cổ tích', icon: '🧚' },
  { value: 'Lãng mạn', label: 'Lãng mạn', icon: '💗' },
  { value: 'Phiêu lưu', label: 'Phiêu lưu', icon: '🧭' },
  { value: 'Hài hước', label: 'Hài hước', icon: '😄' },
  { value: 'Học đường', label: 'Học đường', icon: '🎒' },
  { value: 'Kỳ ảo', label: 'Kỳ ảo', icon: '✨' },
  { value: 'Đời thường', label: 'Đời thường', icon: '☕' },
  { value: 'Bách hợp (GL)', label: 'Bách hợp (GL)', icon: '🌷' },
  { value: 'Đam mỹ (BL)', label: 'Đam mỹ (BL)', icon: '🌹' },
];

const cover = (photo: string) => `https://images.unsplash.com/${photo}?w=400&auto=format&fit=crop&q=80`;
const PAGE_URL: Record<string, (id: string) => string> = {
  mangadex: (id) => `https://mangadex.org/title/${id}`,
  anilist: (id) => `https://anilist.co/manga/${id}`,
};
const PROVIDER_NAMES: Record<string, string> = { mangadex: 'MangaDex', anilist: 'AniList' };

type Section = HomeSectionKey;

const work = (
  section: Section,
  provider: 'mangadex' | 'anilist',
  external_id: string,
  title: string,
  authors: string[],
  genres: string[],
  photo: string,
  latest_chapter: number | null,
  reason: string,
  status: FeedItem['status'] = 'ongoing'
): FeedItem & { section: Section } => ({
  section,
  provider,
  provider_name: PROVIDER_NAMES[provider],
  external_id,
  external_ids: { [provider]: external_id },
  title,
  cover_url: cover(photo),
  authors,
  genres,
  latest_chapter,
  status,
  attribution: [{ provider, name: PROVIDER_NAMES[provider], url: PAGE_URL[provider](external_id) }],
  reason,
  score: 1,
});

const CATALOG = [
  work('for_you', 'anilist', '505', 'Tiệm Tạp Hóa Thời Gian 2', ['Hatori M.'], ['Slice of Life', 'Supernatural'], 'photo-1481627834876-b7833e8f5570', 42, 'Giống Tiệm Tạp Hóa Thời Gian mà nàng chấm 5 tim'),
  work('for_you', 'mangadex', 'feed-md-quan-tra', 'Quán Trà Dưới Gốc Sồi', ['Hatori M.'], ['Slice of Life'], 'photo-1495474472287-4d71bcdd2085', 18, 'Cùng tác giả Hatori M. với Tiệm Tạp Hóa Thời Gian'),
  work('for_you', 'mangadex', 'feed-md-hai-co-gai', 'Hai Cô Gái Và Khu Vườn', ['Hana Mori'], ["Girls' Love", 'Slice of Life'], 'photo-1490750967868-88aa4486c946', 36, 'Vì nàng mê Bách hợp'),
  work('for_you', 'anilist', '501', 'Khu Rừng Thì Thầm', ['Lirien'], ['Slice of Life', 'Fantasy'], 'photo-1448375240586-882707db888b', 120, 'Vì nàng thích Chữa lành', 'completed'),
  work('for_you', 'mangadex', 'feed-md-gac-vuon', 'Người Gác Vườn Mây', ['Hatori M.'], ['Slice of Life', 'Fantasy'], 'photo-1464822759023-fed622ff2c3b', 64, 'Vì nàng thích Kỳ ảo'),
  work('for_you', 'mangadex', 'feed-md-thu-vien', 'Thư Viện Phép Màu', ['Solaria'], ['Fantasy', 'Magic'], 'photo-1507525428034-b723cf961d3e', 9, 'Vì nàng thích Phép thuật'),
  work('for_you', 'anilist', '602', 'Lá Thư Gửi Senpai', ['Mei Kato'], ['Romance', 'Drama', "Boys' Love"], 'photo-1509440159596-0249088772ff', 55, 'Vì nàng mê Đam mỹ'),
  work('new_releases', 'anilist', '601', 'Nụ Hôn Dưới Mưa', ['Sakura Ito'], ['Romance', "Girls' Love"], 'photo-1416879595882-3373a0480b5b', 6, 'Bách hợp mới ra mắt'),
  work('new_releases', 'mangadex', 'feed-md-tho-gom', 'Chàng Thợ Gốm', ['Kei Tanaka'], ["Boys' Love", 'Drama'], 'photo-1517824806704-9040b037703b', 4, 'Đam mỹ mới ra mắt'),
  work('new_releases', 'mangadex', 'feed-md-lop-meo', 'Lớp Học Của Mèo', ['Mira Sol'], ['Comedy', 'School Life'], 'photo-1518709268805-4e9042af9f23', 11, 'Mới ra mắt, đúng gu Hài hước của nàng'),
  work('new_releases', 'anilist', '502', 'Hạt Giống Sao Băng', ['Lirien'], ['Fantasy'], 'photo-1519681393784-d120267933ba', null, 'Mới ra mắt, đúng gu Kỳ ảo của nàng'),
  work('new_releases', 'mangadex', 'feed-md-banh', 'Tiệm Bánh Ở Góc Phố', ['Hatori M.'], ['Slice of Life'], 'photo-1544620347-c4fd4a3d5957', 3, 'Mới ra mắt, đúng gu Chữa lành của nàng'),
  work('trending', 'mangadex', 'feed-md-sapporo', 'Mùa Đông Ở Sapporo', ['Kei Tanaka'], ["Boys' Love", 'Romance'], 'photo-1470240731273-7821a6eeb6bd', 72, 'Đam mỹ đang được yêu thích'),
  work('trending', 'anilist', '503', 'Bản Tình Ca Mùa Hạ', ['Min-seo Park'], ['Romance', 'Drama'], 'photo-1506744038136-46273834b3fb', 98, 'Đang được yêu thích trong Lãng mạn'),
  work('trending', 'mangadex', 'feed-md-goc-nho', 'Góc Nhỏ Bình Yên', ['Rin Aoba'], ['Slice of Life', 'Magic'], 'photo-1473448912268-2022ce9509d8', 150, 'Đang được yêu thích trong Đời thường', 'completed'),
  work('trending', 'mangadex', 'feed-md-tau-hoang-hon', 'Chuyến Tàu Hoàng Hôn', ['Aoi Kaze'], ['Adventure', 'Drama'], 'photo-1500534314209-a25ddb2bd429', 81, 'Đang được yêu thích trong Phiêu lưu'),
  work('trending', 'mangadex', 'feed-md-nhat-ky', 'Nhật Ký Trà Chiều', ['Rin Aoba'], ['Slice of Life'], 'photo-1576092768241-dec231879fc3', 47, 'Đang được yêu thích trong Đời thường'),
];

// "Không quan tâm", by "provider:external_id"
const dismissed = new Set<string>();
const key = (provider: string, externalId: string) => `${provider}:${externalId}`;

const inLibrary = (item: FeedItem) => db.comics.some((c) => fold(c.title) === fold(item.title));

/** The catalog work POST /api/library saves (discover mock), if it is one of the feed's. */
export const findFeedWork = (provider: string, externalId: string): FeedItem | undefined =>
  CATALOG.find((w) => w.provider === provider && w.external_id === externalId);

const today = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const STARTER_BELOW_ITEMS = 5;

export async function getHome(): Promise<HomeOut> {
  await simulateNetworkDelay(500);
  const settings = currentSettings();
  const personal = settings.personalization_enabled !== false;
  const starter = settings.starter_tastes ?? [];
  const priority = settings.priority_tastes ?? [];

  const feed = (section: Section): FeedItem[] =>
    CATALOG.filter((w) => w.section === section && !dismissed.has(key(w.provider, w.external_id)) && !inLibrary(w)).map(
      ({ section: _section, ...item }) => ({
        ...item,
        // everyone's lists when personalization is off (as the API words them)
        reason: personal ? item.reason : section === 'new_releases' ? 'Mới ra mắt gần đây' : 'Đang được nhiều người yêu thích',
      })
    );

  const keys: HomeSectionKey[] = personal ? ['for_you', 'new_releases', 'trending'] : ['new_releases', 'trending'];
  const sections: HomeSection[] = keys.map((k) => ({ key: k, title: TITLES[k], items: feed(k) }));

  return {
    date: today(),
    personalization_enabled: personal,
    needs_starter_tastes: personal && db.comics.length < STARTER_BELOW_ITEMS && !starter.length && !priority.length,
    starter_tastes: starter,
    priority_tastes: priority,
    starter_options: STARTER_OPTIONS,
    feed_status: personal ? 'ready' : 'off',
    sections,
  };
}

export async function dismiss(provider: string, externalId: string): Promise<void> {
  await simulateNetworkDelay(150);
  dismissed.add(key(provider, externalId));
}

export async function setStarterTastes(tastes: string[]) {
  await simulateNetworkDelay(250);
  const unknown = tastes.find((t) => !STARTER_OPTIONS.some((o) => o.value === t));
  if (unknown) throw new ApiError(422, `Chưa có gu “${unknown}”.`, 'validation_error');
  return saveStarterTastes([...new Set(tastes)]);
}
