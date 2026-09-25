import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Clock, Link2Off, Sunrise } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { UserSettings } from '../../types';
import { Panel, SectionHeader, SettingSwitch } from './parts';
import { sectionById } from './sections';

type NotifyKey = 'notify_new_chapter' | 'notify_broken_link' | 'daily_reminder_enabled';

const DEFAULTS: Pick<UserSettings, NotifyKey | 'daily_reminder_time'> = {
  notify_new_chapter: true,
  notify_broken_link: true,
  daily_reminder_enabled: false,
  daily_reminder_time: '20:30',
};

export const NotificationsSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => ({ ...DEFAULTS, ...user?.settings }));
  const [busy, setBusy] = useState<NotifyKey | null>(null);
  const timeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timeTimer.current), []);

  const save = async (patch: Partial<UserSettings>, message: string, revert: () => void) => {
    try {
      const updated = await userService.updateSettings(patch);
      updateUser(updated);
      showToast(message, 'success');
    } catch {
      revert();
      showToast('Chưa lưu được cài đặt thông báo, nàng thử lại nhé', 'error');
    }
  };

  const toggle = async (key: NotifyKey, on: boolean, message: string) => {
    const before = values[key];
    setValues((v) => ({ ...v, [key]: on }));
    setBusy(key);
    await save({ [key]: on }, message, () => setValues((v) => ({ ...v, [key]: before })));
    setBusy(null);
  };

  const changeTime = (time: string) => {
    if (!time) return;
    const before = values.daily_reminder_time;
    setValues((v) => ({ ...v, daily_reminder_time: time }));
    window.clearTimeout(timeTimer.current);
    timeTimer.current = window.setTimeout(() => {
      save({ daily_reminder_time: time }, `Tiên nhỏ sẽ nhắc nàng đọc truyện lúc ${time} mỗi ngày 🌙`, () =>
        setValues((v) => ({ ...v, daily_reminder_time: before }))
      );
    }, 600);
  };

  return (
    <div>
      <SectionHeader section={sectionById('notifications')!} />
      <Panel className="py-1 divide-y divide-border/60">
        <SettingSwitch
          icon={<BellRing className="w-4 h-4 text-primary" aria-hidden="true" />}
          label="Báo khi có chương mới"
          description="Chuông hoa khẽ rung khi truyện nàng theo dõi có chương tiếp theo."
          checked={values.notify_new_chapter}
          disabled={busy === 'notify_new_chapter'}
          onChange={(on) => toggle('notify_new_chapter', on, on ? 'Sẽ báo nàng khi có chương mới 🌸' : 'Đã tắt báo chương mới')}
        />
        <SettingSwitch
          icon={<Link2Off className="w-4 h-4 text-danger" aria-hidden="true" />}
          label="Báo khi link nguồn bị hỏng"
          description="Nhắc nàng khi một nguồn đọc không mở được, để kịp đổi nguồn dự phòng."
          checked={values.notify_broken_link}
          disabled={busy === 'notify_broken_link'}
          onChange={(on) => toggle('notify_broken_link', on, on ? 'Sẽ báo nàng khi link nguồn bị hỏng 🔗' : 'Đã tắt báo link hỏng')}
        />
        <SettingSwitch
          icon={<Sunrise className="w-4 h-4 text-gold-ink" aria-hidden="true" />}
          label="Nhắc mình đọc truyện mỗi ngày"
          description="Một lời thì thầm ngọt ngào để nàng dừng tay và ghé khu vườn cổ tích."
          checked={values.daily_reminder_enabled}
          disabled={busy === 'daily_reminder_enabled'}
          onChange={(on) =>
            toggle(
              'daily_reminder_enabled',
              on,
              on ? `Tiên nhỏ sẽ nhắc nàng lúc ${values.daily_reminder_time} mỗi ngày 🌙` : 'Đã tắt lời nhắc đọc truyện'
            )
          }
        >
          <label
            className={`flex items-center gap-1.5 h-9 pl-2.5 pr-1.5 rounded-full border border-border bg-surface-raised text-sm text-text transition-opacity ${
              values.daily_reminder_enabled ? '' : 'opacity-50'
            }`}
          >
            <Clock className="w-4 h-4 text-text-muted" aria-hidden="true" />
            <span className="sr-only">Giờ nhắc đọc truyện</span>
            <input
              type="time"
              value={values.daily_reminder_time}
              disabled={!values.daily_reminder_enabled}
              onChange={(e) => changeTime(e.target.value)}
              className="bg-transparent outline-none tabular-nums text-text disabled:cursor-not-allowed [color-scheme:inherit]"
            />
          </label>
        </SettingSwitch>
      </Panel>
    </div>
  );
};
