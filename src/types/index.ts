/**
 * Data types for Tủ Truyện Nhỏ
 * Strict adherence to requested schema
 */

export interface UserSettings {
  theme: 'day' | 'night';
  font_size: number;
  sparkle_enabled: boolean;
  notify_new_chapter: boolean;
  notify_broken_link: boolean;
  daily_reminder_time: string; // e.g. "20:00"
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at: string;
  settings: UserSettings;
}

export type ComicStatus = 'reading' | 'completed' | 'plan_to_read' | 'on_hold' | 'dropped';

export interface Source {
  id: string;
  site_name: string;
  url: string;
  favicon_url: string;
  chapter_url: string;
  latest_chapter: number;
  is_alive: boolean;
  last_checked_at: string;
}

export interface Comic {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  status: ComicStatus;
  current_chapter: number;
  total_chapters: number;
  rating: number; // 0 - 5
  is_favorite: boolean;
  note: string;
  tags: string[];
  sources: Source[];
  primary_source_id: string;
  shelf_ids: string[];
  has_new_chapter: boolean;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface Shelf {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  position: number;
  comic_count: number;
  cover_urls: string[];
}

export type NotificationType = 'new_chapter' | 'broken_link' | 'achievement';

export interface Notification {
  id: string;
  comic_id: string;
  comic_title: string;
  comic_cover_url: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export type SortOption = 'updated_at' | 'title' | 'rating' | 'progress';
export type FilterGenre = 'all' | 'healing' | 'fantasy' | 'romance' | 'adventure' | 'comedy' | 'drama' | 'mystery';
export type FilterSource = 'all' | 'Cuutruyen' | 'BlogTruyen' | 'Bilibili' | 'Kakao' | 'Webtoon' | 'Hako';

/** Advanced search (/search). Every field is optional; arrays mean "any of". */
export type SearchSort = 'relevance' | 'updated_at' | 'title' | 'rating' | 'progress';

export interface ComicSearchParams {
  q?: string;
  statuses?: ComicStatus[];
  genres?: string[];
  sources?: string[];
  shelves?: string[];
  min_rating?: number;
  progress_min?: number; // 0–100
  progress_max?: number; // 0–100
  has_new_chapter?: boolean;
  has_broken_link?: boolean;
  sort?: SearchSort;
  page?: number;
  page_size?: number;
}

export interface FacetOption {
  value: string;
  label: string;
  icon?: string;
  count: number;
}

/** Filter options with counts over the whole library. */
export interface SearchFacets {
  total: number;
  statuses: FacetOption[];
  genres: FacetOption[];
  sources: FacetOption[];
  shelves: FacetOption[];
}
