import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Laptop, LogOut, Smartphone, Tablet } from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { UserServiceError, userService } from '../../services/userService';
import { DeviceSession } from '../../types';
import { Panel, SectionHeader, inputClass } from './parts';
import { sectionById } from './sections';
import { passwordStrength } from './passwordStrength';
import { VineStrength } from './VineStrength';

type Field = 'current' | 'next' | 'confirm';

const PasswordInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string | null;
  autoComplete: string;
  describedBy?: string;
}> = ({ id, label, value, onChange, onBlur, error, autoComplete, describedBy }) => {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={[error ? `${id}-err` : '', describedBy ?? ''].join(' ').trim() || undefined}
          className={`${inputClass} pr-11 ${error ? 'border-danger' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={shown}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-text-muted hover:text-text flex items-center justify-center cursor-pointer"
        >
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
};

const DEVICE_ICON = { desktop: Laptop, phone: Smartphone, tablet: Tablet };

const lastActive = (iso: string, current: boolean) => {
  if (current) return 'Đang dùng';
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 2) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};

export const SecuritySection: React.FC = () => {
  const { showToast } = useToast();
  const [values, setValues] = useState<Record<Field, string>>({ current: '', next: '', confirm: '' });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ current: false, next: false, confirm: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    userService.getSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const strength = useMemo(() => passwordStrength(values.next), [values.next]);
  const errors: Record<Field, string | null> = {
    current: serverError ?? (!values.current ? 'Nàng nhập mật khẩu hiện tại nhé' : null),
    next: !values.next
      ? 'Nàng nhập mật khẩu mới nhé'
      : values.next.length < 8
        ? 'Mật khẩu mới cần ít nhất 8 ký tự'
        : values.next === values.current
          ? 'Mật khẩu mới cần khác mật khẩu hiện tại'
          : strength.score < 2
            ? 'Mật khẩu còn yếu, nàng thêm chữ hoa, chữ số hoặc ký hiệu nhé'
            : null,
    confirm: !values.confirm ? 'Nàng nhập lại mật khẩu mới nhé' : values.confirm !== values.next ? 'Hai mật khẩu mới chưa khớp nhau' : null,
  };
  const set = (f: Field) => (v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    if (f === 'current') setServerError(null);
  };
  const touch = (f: Field) => () => values[f] && setTouched((t) => ({ ...t, [f]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ current: true, next: true, confirm: true });
    if (errors.current || errors.next || errors.confirm) return;
    setSaving(true);
    try {
      await userService.changePassword(values.current, values.next);
      setValues({ current: '', next: '', confirm: '' });
      setTouched({ current: false, next: false, confirm: false });
      showToast('Đã đổi mật khẩu, ổ khóa dây leo đã được thay mới 🔐', 'success');
    } catch (err) {
      if (err instanceof UserServiceError && err.code === 'wrong_password') setServerError('Mật khẩu hiện tại chưa đúng');
      else showToast('Chưa đổi được mật khẩu, nàng thử lại nhé', 'error');
    } finally {
      setSaving(false);
    }
  };

  const signOutOthers = async () => {
    setSigningOut(true);
    try {
      const n = await userService.logoutAll();
      setSessions((s) => s?.filter((x) => x.is_current) ?? s);
      setConfirmOpen(false);
      showToast(n ? `Đã đăng xuất khỏi ${n} thiết bị khác 🌿` : 'Không còn thiết bị nào khác đang đăng nhập', 'success');
    } catch {
      showToast('Chưa đăng xuất được các thiết bị, nàng thử lại nhé', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const others = sessions?.filter((s) => !s.is_current).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionHeader section={sectionById('security')!} />
        <form onSubmit={submit} noValidate>
          <Panel className="flex flex-col gap-4">
            <PasswordInput
              id="pw-current"
              label="Mật khẩu hiện tại"
              value={values.current}
              onChange={set('current')}
              onBlur={touch('current')}
              error={touched.current || serverError ? errors.current : null}
              autoComplete="current-password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                id="pw-next"
                label="Mật khẩu mới"
                value={values.next}
                onChange={set('next')}
                onBlur={touch('next')}
                error={touched.next ? errors.next : null}
                autoComplete="new-password"
                describedBy="pw-strength"
              />
              <PasswordInput
                id="pw-confirm"
                label="Nhập lại mật khẩu mới"
                value={values.confirm}
                onChange={set('confirm')}
                onBlur={touch('confirm')}
                error={touched.confirm ? errors.confirm : null}
                autoComplete="new-password"
              />
            </div>
            <VineStrength id="pw-strength" strength={strength} />
            <p className="text-xs text-text-muted">Ít nhất 8 ký tự, nên có chữ hoa, chữ số và một ký hiệu nhỏ ✿</p>
            <div className="flex justify-end">
              <Button type="submit" variant="honey" isLoading={saving} iconLeft={<KeyRound className="w-4 h-4" />}>
                Cập nhật mật khẩu
              </Button>
            </div>
          </Panel>
        </form>
      </div>

      <section aria-labelledby="sessions-h">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h3 id="sessions-h" className="font-serif text-base font-semibold text-text">
              Thiết bị đang đăng nhập
            </h3>
            <p className="text-xs text-text-muted">Những nơi khu vườn của nàng đang mở cửa</p>
          </div>
        </div>
        <Panel className="p-2 sm:p-2">
          {sessions === null ? (
            <p className="p-3 text-sm text-text-muted animate-pulse">Đang tìm các thiết bị...</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {sessions.map((s) => {
                const Icon = DEVICE_ICON[s.device_type];
                return (
                  <li key={s.id} className="flex items-center gap-3 p-3">
                    <span className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-muted shrink-0">
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text truncate">{s.device_name}</p>
                      <p className="text-xs text-text-muted truncate">
                        {s.browser} · {s.location}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.is_current ? 'bg-leaf-tint text-leaf-ink' : 'bg-surface-raised text-text-muted border border-border'
                      }`}
                    >
                      {lastActive(s.last_active_at, s.is_current)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 pt-2 border-t border-border/60">
            <p className="text-xs text-text-muted">
              {others ? `${others} thiết bị khác đang đăng nhập` : 'Chỉ có thiết bị này đang đăng nhập'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!others}
              onClick={() => setConfirmOpen(true)}
              iconLeft={<LogOut className="w-3.5 h-3.5" />}
            >
              Đăng xuất khỏi mọi thiết bị
            </Button>
          </div>
        </Panel>
      </section>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Đăng xuất khỏi mọi thiết bị?" maxWidth="sm">
        <p className="text-sm text-text leading-relaxed">
          {others} thiết bị khác sẽ phải đăng nhập lại. Thiết bị nàng đang dùng vẫn giữ đăng nhập.
        </p>
        <div className="flex justify-end gap-2.5 mt-6">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Để sau
          </Button>
          <Button variant="primary" onClick={signOutOthers} isLoading={signingOut}>
            Đăng xuất các thiết bị
          </Button>
        </div>
      </Modal>
    </div>
  );
};
