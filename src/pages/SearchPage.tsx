import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Comic } from '../types';
import { getComics } from '../services/comicService';
import { ComicCard } from '../components/ComicCard';
import { SearchBar } from '../components/SearchBar';
import { TagChip } from '../components/TagChip';
import { EmptyState } from '../components/EmptyState';
import { Sparkles, Search as SearchIcon } from 'lucide-react';

const popularTags = [
  'Chữa lành',
  'Cổ tích',
  'Nhà kính',
  'Kỳ ảo',
  'Lãng mạn',
  'Phiêu lưu',
  'Đời thường',
  'Thảo mộc',
  'Ẩm thực',
  'Thần thoại',
];

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [results, setResults] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      setIsLoading(true);
      try {
        const res = await getComics({
          search: query,
          genre: activeTag === 'all' ? undefined : activeTag,
          page_size: 30,
        });
        setResults(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(doSearch, 150);
    return () => clearTimeout(timer);
  }, [query, activeTag]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          Tìm Kiếm & Khám Phá Truyện ✿
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Dạo quanh thư viện hoa cỏ, tìm kiếm cuốn truyện đồng điệu với tâm hồn bạn hôm nay
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-surface-raised p-3 rounded-2xl border border-border shadow-botanical-sm">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo tên truyện, tác giả, thảo mộc, từ khóa..."
        />
      </div>

      {/* Popular Tags */}
      <div>
        <span className="text-xs font-semibold text-text block mb-2">
          🌸 Thẻ hoa được yêu thích:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <TagChip
            label="Tất cả thẻ"
            icon="✿"
            isActive={activeTag === 'all'}
            onClick={() => setActiveTag('all')}
          />
          {popularTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              isActive={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? 'all' : tag)}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-text-muted">
          <span>
            Tìm thấy <strong className="text-text">{results.length}</strong> cuốn truyện phù hợp
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="bg-surface/60 arch-card p-3 border border-border animate-pulse h-64"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Không tìm thấy cuốn truyện nào"
            description="Hãy thử từ khóa ngắn hơn hoặc chọn lại thẻ hoa khác."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
