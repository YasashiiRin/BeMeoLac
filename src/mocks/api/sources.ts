import { ComicPreview, SourceCheckResult } from '../../types';
import { ApiError, simulateNetworkDelay } from '../../services/http';
import { all } from './comics';

/* Mock implementation of /api/sources (see src/services/sourcesService.ts). */

/** Reports the sources marked is_alive: false in src/mocks/comics.ts. */
export async function checkAll(): Promise<SourceCheckResult> {
  await simulateNetworkDelay(900);
  const items = all();
  const broken = items.flatMap((c) =>
    c.sources.filter((s) => !s.is_alive).map((s) => ({ comic_id: c.id, comic_title: c.title, site_name: s.site_name }))
  );
  return {
    checked: items.reduce((n, c) => n + c.sources.length, 0),
    comics: items.length,
    broken,
    checked_at: new Date().toISOString(),
  };
}

/** Guesses a preview from the URL (the real API scrapes the page). */
export async function preview(url: string): Promise<ComicPreview> {
  await simulateNetworkDelay(350);
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    throw new ApiError(400, 'Đường dẫn không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://', 'invalid_url');
  }

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
      siteName = new URL(trimmed).hostname.replace(/^www\./, '');
    } catch {
      siteName = 'Nguồn mới';
    }
  }

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

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || 'Truyen-Moi';
    const words = slug.replace(/[-_]+/g, ' ').replace(/\.[a-z0-9]+$/i, '').trim();
    const title = words
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return {
      title: title || 'Tác Phẩm Thảo Mộc Mới',
      author: 'Đang cập nhật',
      cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      total_chapters: 85,
      tags: ['Chữa lành', 'Phép thuật', 'Nhà kính'],
      site_name: siteName,
      favicon_url: '',
    };
  } catch {
    throw new ApiError(422, 'Không thể phân tích dữ liệu từ liên kết này. Vui lòng kiểm tra lại đường dẫn!', 'preview_failed');
  }
}
