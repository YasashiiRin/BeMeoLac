import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { STARTER_OPTIONS, homeService } from '../../services/homeService';
import { Button } from '../../components/Button';
import { MoodChips } from '../home/MoodChips';
import { Panel, SectionHeader, SettingSwitch } from './parts';
import { sectionById } from './sections';

/** Gu đọc: whether the home page follows her taste, and the moods she likes. */
export const TasteSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [personal, setPersonal] = useState(user?.settings.personalization_enabled ?? true);
  const [busy, setBusy] = useState(false);
  const saved = user?.settings.starter_tastes ?? [];
  const [moods, setMoods] = useState<string[]>(saved);
  const [savingMoods, setSavingMoods] = useState(false);
  const changed = moods.length !== saved.length || moods.some((m) => !saved.includes(m));

  const togglePersonal = async (on: boolean) => {
    setPersonal(on);
    setBusy(true);
    try {
      updateUser(await userService.updateSettings({ personalization_enabled: on }));
      showToast(on ? 'Thế giới sẽ gợi ý theo gu của nàng 🌸' : 'Thế giới sẽ gợi ý những truyện ai cũng thích 🌿', 'success');
    } catch {
      setPersonal(!on);
      showToast('Chưa lưu được cài đặt, nàng thử lại nhé', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveMoods = async () => {
    setSavingMoods(true);
    try {
      updateUser(await homeService.setStarterTastes(moods));
      showToast(moods.length ? 'Đã lưu gu đọc, Thế giới sẽ gieo gợi ý mới cho nàng 🌱' : 'Đã bỏ chọn các gu đọc', 'success');
    } catch {
      showToast('Chưa lưu được gu đọc, nàng thử lại nhé', 'error');
    } finally {
      setSavingMoods(false);
    }
  };

  return (
    <div>
      <SectionHeader section={sectionById('taste')!} />
      <div className="flex flex-col gap-5">
        <Panel className="py-0">
          <SettingSwitch
            icon={<Sprout className="w-4 h-4 text-leaf-ink" aria-hidden="true" />}
            label="Gợi ý theo gu của nàng"
            description="Thế giới chọn truyện theo những gì nàng đọc, chấm tim và yêu thích. Tắt đi thì chỉ còn truyện mới và truyện ai cũng thích."
            checked={personal}
            disabled={busy}
            onChange={togglePersonal}
          />
        </Panel>

        <section aria-labelledby="starter-moods-heading" className={personal ? '' : 'opacity-60'}>
          <h3 id="starter-moods-heading" className="text-sm font-semibold text-text">
            Những gu nàng thích
          </h3>
          <p className="text-xs text-text-muted mt-0.5 mb-3">
            Khi tủ còn ít truyện (dưới 5 bộ), Thế giới dựa vào các gu này để gợi ý. Chọn bao nhiêu cũng được, nàng nhé ✨
          </p>
          <MoodChips options={STARTER_OPTIONS} selected={moods} onChange={setMoods} disabled={savingMoods} label="Những gu nàng thích" />
          <div className="flex justify-end mt-4">
            <Button type="button" variant="primary" size="md" onClick={saveMoods} isLoading={savingMoods} disabled={!changed}>
              🌱 Lưu gu đọc
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
