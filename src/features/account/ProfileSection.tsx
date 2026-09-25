import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Camera, RotateCcw, Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { SectionHeader, inputClass } from './parts';
import { sectionById } from './sections';
import { FALLBACK_AVATAR } from './avatar';

const NAME_MAX = 40;
const BIO_MAX = 160;
const AVATAR_MAX_MB = 2;

export const ProfileSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(null); // new picture, not saved yet
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user?.display_name ?? '');
    setBio(user?.bio ?? '');
  }, [user?.display_name, user?.bio]);

  // "Sửa hồ sơ" links here with #edit (also when the form is already open)
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#edit') nameInput.current?.focus();
  }, [location.key, location.hash]);

  const nameError = !name.trim()
    ? 'Nàng nhập bút danh nhé'
    : name.trim().length > NAME_MAX
      ? `Bút danh tối đa ${NAME_MAX} ký tự`
      : null;
  const bioError = bio.length > BIO_MAX ? `Lời giới thiệu tối đa ${BIO_MAX} ký tự` : null;
  const dirty = !!avatar || name.trim() !== (user?.display_name ?? '') || bio.trim() !== (user?.bio ?? '');

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Nàng chọn một tệp ảnh (JPG, PNG, WebP) nhé');
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      setAvatarError(`Ảnh lớn quá rồi, nàng chọn ảnh dưới ${AVATAR_MAX_MB} MB nhé`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarError(null);
    };
    reader.onerror = () => setAvatarError('Chưa đọc được ảnh này, nàng thử ảnh khác nhé');
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || bioError || !dirty) return;
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        display_name: name.trim(),
        bio: bio.trim(),
        ...(avatar ? { avatar_url: avatar } : {}),
      });
      updateUser(updated);
      setAvatar(null);
      setTouched(false);
      showToast('Đã lưu hồ sơ của nàng 🌸', 'success');
    } catch {
      showToast('Chưa lưu được hồ sơ, nàng thử lại nhé', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      <SectionHeader section={sectionById('profile')!} />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <div className="w-28 h-28 rounded-full p-1 bg-fairy-gradient shadow-botanical">
              <img
                src={avatar ?? user?.avatar_url ?? FALLBACK_AVATAR}
                alt={avatar ? 'Ảnh đại diện mới (chưa lưu)' : 'Ảnh đại diện'}
                className="w-full h-full rounded-full object-cover bg-surface"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              aria-label="Chọn ảnh đại diện mới"
              className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-gold text-on-gold border-2 border-surface-raised shadow-botanical-sm flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickAvatar} className="sr-only" tabIndex={-1} aria-hidden="true" />
          </div>
          {avatar ? (
            <button type="button" onClick={() => setAvatar(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Giữ ảnh cũ
            </button>
          ) : (
            <span className="text-[11px] text-text-muted">JPG, PNG, WebP · tối đa {AVATAR_MAX_MB} MB</span>
          )}
          {avatarError && (
            <p role="alert" className="max-w-[14rem] text-center text-xs text-danger-ink">
              {avatarError}
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-semibold text-text mb-1.5">
              Bút danh hiển thị
            </label>
            <input
              ref={nameInput}
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={NAME_MAX + 10}
              aria-invalid={touched && !!nameError}
              aria-describedby="profile-name-err"
              className={`${inputClass} ${touched && nameError ? 'border-danger' : ''}`}
            />
            {touched && nameError && (
              <p id="profile-name-err" role="alert" className="text-xs text-danger-ink mt-1">
                {nameError}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label htmlFor="profile-bio" className="text-sm font-semibold text-text">
                Châm ngôn nhỏ
              </label>
              <span className={`text-[11px] tabular-nums ${bioError ? 'text-danger-ink' : 'text-text-muted'}`}>
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Một dòng về khu vườn đọc của nàng..."
              aria-invalid={!!bioError}
              className={`${inputClass} h-auto py-2.5 resize-none leading-relaxed ${bioError ? 'border-danger' : ''}`}
            />
            {bioError && (
              <p role="alert" className="text-xs text-danger-ink mt-1">
                {bioError}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={!dirty || saving} isLoading={saving} iconLeft={<Save className="w-4 h-4" />}>
              Lưu hồ sơ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
