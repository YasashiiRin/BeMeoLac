import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

/** Avatar button in the desktop header with a small account menu. */
export const AvatarMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const name = user?.display_name || 'Nàng';

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const itemClass =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer focus:outline-none';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Tài khoản của ${name}`}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-surface border-1.5 border-border hover:border-primary transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="w-7 h-7 rounded-full overflow-hidden border border-border p-0.5 bg-background">
          <img src={user?.avatar_url || FALLBACK_AVATAR} alt="" className="w-full h-full object-cover rounded-full" />
        </span>
        <span className="text-xs font-serif italic font-semibold text-text hidden xl:inline">{name}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Tài khoản"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-52 p-1.5 rounded-2xl bg-surface-raised border border-border-strong/60 shadow-botanical-lg z-50"
        >
          <div className="px-3 pt-1.5 pb-2 mb-1 border-b border-border/60">
            <span className="block text-sm font-serif font-bold text-text truncate">{name}</span>
            {user?.email && <span className="block text-[11px] text-text-muted truncate">{user.email}</span>}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/account');
            }}
            className={`${itemClass} text-text hover:bg-surface focus:bg-surface`}
          >
            <Settings size={15} className="text-text-muted" />
            Tài khoản &amp; cài đặt
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`${itemClass} text-danger hover:bg-danger-tint focus:bg-danger-tint`}
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};
