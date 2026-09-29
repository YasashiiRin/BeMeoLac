import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../../components/SearchBar';
import { DISCOVER_MAX_QUERY } from '../../services/discoverService';
import { DiscoverResults } from './DiscoverResults';

const DEBOUNCE_MS = 400;

interface DiscoverSearchPanelProps {
  /** "Nhập thủ công": when the search finds nothing */
  onManual: () => void;
}

/** /add › "Tìm theo tên": search the web by title, then save a result (opens the new comic). */
export const DiscoverSearchPanel: React.FC<DiscoverSearchPanelProps> = ({ onManual }) => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(text);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [text]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SearchBar
          value={text}
          onChange={(v) => setText(v.slice(0, DISCOVER_MAX_QUERY))}
          onSubmit={() => {
            setQuery(text);
            setPage(1);
          }}
          shortcut={false}
          ariaLabel="Tên truyện cần tìm"
          placeholder="Gõ tên truyện (tên gốc, tiếng Anh hoặc romaji)..."
        />
        <p className="text-xs text-text-muted italic pl-3">
          Tìm trên MangaDex và AniList: bìa, tác giả, thể loại và nơi đọc được điền sẵn khi nàng thêm vào tủ.
        </p>
      </div>
      <DiscoverResults
        query={query}
        page={page}
        onPageChange={setPage}
        onSaved={(comic) => navigate(`/comics/${comic.id}`)}
        emptyAction={{ text: 'Nhập thủ công', onClick: onManual }}
      />
    </div>
  );
};
