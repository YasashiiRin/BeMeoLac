import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

/** Unknown URL inside the app. */
export const NotFoundPage: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <div className="max-w-xl mx-auto py-10 sm:py-16">
      <div className="relative overflow-hidden arch-card bg-surface-raised border-1.5 border-border shadow-botanical px-6 pt-14 pb-8 sm:px-10 text-center">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-fairy-gradient" aria-hidden="true" />
        <p className="font-serif text-6xl sm:text-7xl font-bold text-primary tracking-tight" aria-hidden="true">
          4<span className="text-accent">✿</span>4
        </p>
        <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-text">Lối nhỏ này chưa trồng hoa</h1>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          Không tìm thấy trang <code className="px-1.5 py-0.5 rounded-md bg-surface text-text break-all">{pathname}</code>. Có thể đường
          dẫn đã đổi, hoặc trang ấy đã được cất sang một góc vườn khác.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold border-1.5 border-primary glow-primary hover:bg-primary-deep transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Về tủ sách
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-surface text-text text-sm font-semibold border-1.5 border-border hover:border-primary transition-colors"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            Tìm truyện
          </Link>
        </div>
      </div>
    </div>
  );
};
