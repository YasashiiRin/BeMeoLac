import React from 'react';
import { version } from '../../../package.json';
import { Panel, SectionHeader } from './parts';
import { sectionById } from './sections';

export const APP_NAME = 'Uyên Thư Các';

export const AboutSection: React.FC = () => (
  <div>
    <SectionHeader section={sectionById('about')!} />
    <Panel className="flex items-center gap-4">
      <span className="w-14 h-14 shrink-0 rounded-2xl bg-fairy-gradient text-on-gradient flex items-center justify-center text-2xl shadow-botanical-sm" aria-hidden="true">
        🌿
      </span>
      <div className="min-w-0">
        <p className="font-serif text-lg font-semibold text-text">{APP_NAME}</p>
        <p className="text-xs text-text-muted">Tủ truyện nhỏ của nàng · Phiên bản {version}</p>
      </div>
    </Panel>
    <p className="mt-4 text-sm text-text-muted leading-relaxed">
      Cảm ơn nàng đã ghé thăm và chăm chút khu vườn truyện này. Mong mỗi trang nàng đọc đều êm dịu như một tách trà thảo mộc
      buổi chiều 🌸
    </p>
  </div>
);
