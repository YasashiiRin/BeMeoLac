import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, FileJson, FileSpreadsheet, Link2Off, SearchCheck, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserServiceError, userService } from '../../services/userService';
import { sourcesService } from '../../services/sourcesService';
import { ExportFormat, SourceCheckResult } from '../../types';
import { Panel, SectionHeader } from './parts';
import { sectionById } from './sections';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const ActionCard: React.FC<{ icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }> = ({ icon, title, hint, children }) => (
  <Panel className="flex flex-col items-center text-center gap-2">
    <span className="w-11 h-11 rounded-full bg-surface-raised border border-border flex items-center justify-center text-primary" aria-hidden="true">
      {icon}
    </span>
    <span className="text-sm font-semibold text-text">{title}</span>
    <span className="text-xs text-text-muted">{hint}</span>
    <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div>
  </Panel>
);

const smallBtn =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border-1.5 border-border bg-surface-raised text-xs font-semibold text-text hover:border-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait';

export const DataSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [importing, setImporting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<SourceCheckResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportAs = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const { blob, filename } = await userService.exportData(format);
      download(blob, filename);
      updateUser(await userService.getCurrentUser()); // new "Sao lưu lần cuối"
      showToast(`Đã tải bản sao lưu ${format.toUpperCase()} của tủ truyện 📜`, 'success');
    } catch {
      showToast('Chưa xuất được dữ liệu, nàng thử lại nhé', 'error');
    } finally {
      setExporting(null);
    }
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const { added, skipped } = await userService.importData(file);
      showToast(
        added
          ? `Đã thêm ${added} truyện vào tủ${skipped ? `, bỏ qua ${skipped} truyện đã có` : ''} 🌸`
          : `Tủ đã có sẵn cả ${skipped} truyện trong tệp này 🌿`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof UserServiceError ? err.message : 'Chưa nhập được dữ liệu, nàng thử lại nhé', 'error');
    } finally {
      setImporting(false);
    }
  };

  const checkLinks = async () => {
    setChecking(true);
    try {
      const result = await sourcesService.checkAll();
      setCheck(result);
      showToast(
        result.broken.length ? `Tìm thấy ${result.broken.length} link hỏng cần nàng xem lại 🔗` : 'Tất cả link nguồn đều khỏe mạnh 🌿',
        result.broken.length ? 'warning' : 'success'
      );
    } catch {
      showToast('Chưa kiểm tra được link, nàng thử lại nhé', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <SectionHeader section={sectionById('data')!} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm text-text-muted">
            Dấu trang, ghi chú và kệ sách của nàng đều nằm gọn trong chiếc rương ma thuật này.
          </p>
          <span className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-leaf-tint text-leaf-ink text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Sao lưu lần cuối: {user?.last_backup_at ? formatDateTime(user.last_backup_at) : 'chưa có'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard icon={<Download className="w-5 h-5" />} title="Xuất dữ liệu" hint="Tải trọn tủ truyện về máy">
            <button type="button" className={smallBtn} onClick={() => exportAs('json')} disabled={!!exporting}>
              <FileJson className="w-3.5 h-3.5" aria-hidden="true" /> {exporting === 'json' ? 'Đang gói...' : 'JSON'}
            </button>
            <button type="button" className={smallBtn} onClick={() => exportAs('csv')} disabled={!!exporting}>
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" /> {exporting === 'csv' ? 'Đang gói...' : 'CSV'}
            </button>
          </ActionCard>
          <ActionCard icon={<Upload className="w-5 h-5" />} title="Nhập dữ liệu" hint="Khôi phục từ tệp JSON đã xuất">
            <button type="button" className={smallBtn} onClick={() => fileInput.current?.click()} disabled={importing}>
              <Upload className="w-3.5 h-3.5" aria-hidden="true" /> {importing ? 'Đang mở rương...' : 'Chọn tệp'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              onChange={importFile}
              className="sr-only"
              tabIndex={-1}
              aria-label="Chọn tệp sao lưu JSON"
            />
          </ActionCard>
          <ActionCard icon={<SearchCheck className="w-5 h-5" />} title="Kiểm tra link hỏng" hint="Xem lại mọi nguồn đọc">
            <button type="button" className={smallBtn} onClick={checkLinks} disabled={checking}>
              <SearchCheck className="w-3.5 h-3.5" aria-hidden="true" /> {checking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
            </button>
          </ActionCard>
        </div>

        {check && (
          <Panel className="flex flex-col gap-2" >
            <p className="text-sm text-text" role="status">
              Đã kiểm tra <strong>{check.checked}</strong> nguồn của <strong>{check.comics}</strong> bộ truyện ·{' '}
              {check.broken.length ? (
                <strong className="text-danger-ink">{check.broken.length} link hỏng</strong>
              ) : (
                <strong className="text-leaf-ink">không có link hỏng</strong>
              )}
            </p>
            {check.broken.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {check.broken.map((b) => (
                  <li key={b.comic_id + b.site_name}>
                    <Link
                      to={`/comics/${b.comic_id}`}
                      className="flex items-center gap-2 rounded-xl bg-surface-raised border border-border px-3 py-2 text-sm text-text hover:border-primary transition-colors"
                    >
                      <Link2Off className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
                      <span className="truncate font-semibold">{b.comic_title}</span>
                      <span className="ml-auto shrink-0 text-xs text-text-muted">{b.site_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
};
