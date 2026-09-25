import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarHeart, Pencil, Sparkles, TrendingUp } from 'lucide-react';
import { Stats, StatsPeriod } from '../types';
import { statsService } from '../services/statsService';
import { comicsService } from '../services/comicService';
import { useToast } from '../context/ToastContext';
import { ComicCard } from '../components/ComicCard';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { BottomSheet } from '../components/BottomSheet';
import { VineProgressBar } from '../components/VineProgressBar';
import { Plant, PlantStage, PLANT_STAGE_LABELS, plantStage } from '../features/stats/Plant';
import { Bloom } from '../features/stats/Bloom';
import { MonthlyChart } from '../features/stats/MonthlyChart';
import { GenreDonut } from '../features/stats/GenreDonut';
import { BloomLegend, ReadingCalendar } from '../features/stats/ReadingCalendar';
import { GoalForm } from '../features/stats/GoalForm';
import { PERIODS, dayLabel, formatNumber, isPeriod, monthLong, percent, periodPhrase } from '../features/stats/format';
import '../features/stats/stats.css';

const DESKTOP = '(min-width: 768px)';
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

const Card: React.FC<{ className?: string; children: React.ReactNode; labelledBy?: string }> = ({
  className = '',
  children,
  labelledBy,
}) => (
  <section
    aria-labelledby={labelledBy}
    className={`bg-surface-raised border-1.5 border-border rounded-3xl p-4 sm:p-6 shadow-botanical min-w-0 ${className}`}
  >
    {children}
  </section>
);

const CardHeader: React.FC<{ id: string; title: string; icon: string; sub?: string; aside?: React.ReactNode }> = ({
  id,
  title,
  icon,
  sub,
  aside,
}) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h2 id={id} className="font-serif text-lg sm:text-xl font-semibold text-text flex items-center gap-2">
        <span>{title}</span>
        <span aria-hidden="true" className="text-base">{icon}</span>
      </h2>
      {sub && <p className="text-xs sm:text-sm text-text-muted mt-0.5">{sub}</p>}
    </div>
    {aside}
  </div>
);

interface SummaryProps {
  chip: string;
  title: string;
  value: number;
  unit: string;
  note: React.ReactNode;
  stage: PlantStage;
  petal: string;
  tint: string;
}

const SummaryCard: React.FC<SummaryProps> = ({ chip, title, value, unit, note, stage, petal, tint }) => (
  <div className="relative overflow-hidden bg-surface-raised border-1.5 border-border rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-botanical flex flex-col min-w-0">
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none ${tint}`} aria-hidden="true" />
    <div className="relative flex items-start justify-between gap-1">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface text-[10px] sm:text-[11px] font-bold text-text border border-border/70 whitespace-nowrap">
        {chip}
      </span>
      <Plant stage={stage} petal={petal} className="-mt-2 -mr-2 w-14 h-14 sm:w-16 sm:h-16" />
    </div>
    <h3 className="relative text-xs sm:text-sm font-semibold text-text-muted mt-1">{title}</h3>
    <p className="relative flex items-baseline gap-1.5 flex-wrap">
      <span className="font-serif text-2xl sm:text-3xl font-bold text-text tabular-nums">{formatNumber(value)}</span>
      <span className="text-xs sm:text-sm text-text-muted">{unit}</span>
    </p>
    <p className="relative text-[11px] sm:text-xs text-primary-ink mt-1.5 leading-snug">{note}</p>
    <span className="sr-only">Cây đang ở giai đoạn {PLANT_STAGE_LABELS[stage]}</span>
  </div>
);

const Skeleton: React.FC = () => (
  <div className="flex flex-col gap-5 animate-pulse" aria-hidden="true">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-36 sm:h-44 rounded-3xl bg-surface border border-border" />
      ))}
    </div>
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 h-80 rounded-3xl bg-surface border border-border" />
      <div className="lg:col-span-5 h-80 rounded-3xl bg-surface border border-border" />
    </div>
    <div className="h-56 rounded-3xl bg-surface border border-border" />
  </div>
);

const Favicon: React.FC<{ src: string; name: string }> = ({ src, name }) =>
  /^(https?:|\/|data:)/.test(src) ? (
    <img src={src} alt="" className="w-5 h-5 rounded" referrerPolicy="no-referrer" />
  ) : (
    <span className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-sm" aria-hidden="true">
      {src || name.slice(0, 1)}
    </span>
  );

export const StatsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const rawPeriod = params.get('period');
  const period: StatsPeriod = isPeriod(rawPeriod) ? rawPeriod : 'year';

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const request = useRef(0);
  const isDesktop = useIsDesktop();
  const { showToast } = useToast();

  const load = useCallback(async (p: StatsPeriod) => {
    const id = ++request.current;
    setLoading(true);
    setError(false);
    try {
      const data = await statsService.get(p);
      if (id === request.current) setStats(data);
    } catch {
      if (id === request.current) setError(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const choosePeriod = (p: StatsPeriod) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (p === 'year') next.delete('period');
        else next.set('period', p);
        return next;
      },
      { replace: true }
    );

  const saveGoal = async (target: number) => {
    if (!stats) return;
    setSavingGoal(true);
    try {
      const goal = await statsService.updateGoal(stats.goal.year, target);
      setStats((s) => (s ? { ...s, goal } : s));
      setGoalOpen(false);
      showToast(`Đã đặt mục tiêu ${goal.target} bộ truyện cho năm ${goal.year} 🌸`, 'success');
    } catch {
      showToast('Chưa lưu được mục tiêu, nàng thử lại nhé', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const updated = await comicsService.toggleFavorite(id);
      setStats((s) => (s ? { ...s, recently_completed: s.recently_completed.map((c) => (c.id === id ? updated : c)) } : s));
    } catch {
      showToast('Chưa đánh dấu được truyện, nàng thử lại nhé', 'error');
    }
  };

  const derived = useMemo(() => {
    if (!stats) return null;
    const peakMonth = stats.chapters_by_month.reduce(
      (best, m) => (m.count > (best?.count ?? 0) ? m : best),
      undefined as Stats['chapters_by_month'][number] | undefined
    );
    const activeMonths = stats.chapters_by_month.filter((m) => m.count > 0);
    const avgPerMonth = activeMonths.length
      ? Math.round(activeMonths.reduce((n, m) => n + m.count, 0) / activeMonths.length)
      : 0;
    const peakDay = stats.reading_calendar.reduce(
      (best, d) => (d.count > (best?.count ?? 0) ? d : best),
      undefined as Stats['reading_calendar'][number] | undefined
    );
    const bloomDays = stats.reading_calendar.filter((d) => d.count > 0).length;
    const topSourceTotal = stats.comics_read;
    return { peakMonth, avgPerMonth, peakDay, bloomDays, topSourceTotal };
  }, [stats]);

  const phrase = periodPhrase(period);
  const goal = stats?.goal;
  const goalPct = goal ? percent(goal.completed, goal.target) : 0;
  const goalLeft = goal ? Math.max(0, goal.target - goal.completed) : 0;

  const goalForm = goal && (
    <GoalForm goal={goal} saving={savingGoal} onSave={saveGoal} onCancel={() => setGoalOpen(false)} />
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:gap-6">
      {/* Greeting + period chips */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-accent-tint text-accent-ink text-[11px] font-bold border border-accent-soft/60">
            <span aria-hidden="true">🌸</span>
            Sổ Tay Thống Kê Thảo Mộc
            {goal && (
              <>
                <span aria-hidden="true">·</span> Năm {goal.year}
              </>
            )}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text tracking-tight">
            Khu Vườn Đọc Của Nàng
          </h1>
          <p className="text-sm text-text-muted">
            Mỗi trang truyện nàng đọc là một đóa hoa hé nở trong khu vườn tâm hồn ✨
          </p>
        </div>

        <div
          role="group"
          aria-label="Khoảng thời gian"
          className="flex items-center gap-1 p-1 rounded-full bg-surface border border-border self-start lg:self-end overflow-x-auto no-scrollbar max-w-full"
        >
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={active}
                onClick={() => choosePeriod(p.value)}
                className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-primary text-on-primary glow-primary'
                    : 'text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                {active && <span aria-hidden="true">🌿 </span>}
                {p.label}
              </button>
            );
          })}
        </div>
      </header>

      {error && !stats ? (
        <EmptyState
          icon="🍂"
          title="Khu vườn đang ngủ say"
          description="Chưa tải được thống kê đọc của nàng. Nàng thử lại sau một chút nhé."
          actionText="Thử lại"
          onAction={() => load(period)}
        />
      ) : !stats || !derived ? (
        <Skeleton />
      ) : (
        <div
          aria-busy={loading}
          className={`flex flex-col gap-5 sm:gap-6 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`}
        >
          {/* Summary cards: 2x2 on phones, a row of 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryCard
              chip="🌱 Gieo hạt"
              title="Tổng truyện"
              value={stats.total_comics}
              unit="bộ trong tủ"
              note={
                stats.period === 'all'
                  ? `Nàng đã mở đọc ${stats.comics_read} bộ`
                  : stats.new_comics > 0
                    ? `+${stats.new_comics} truyện mới gieo ${phrase}`
                    : `Chưa gieo truyện mới ${phrase}`
              }
              stage={plantStage(stats.total_comics, [5, 15, 40])}
              petal="fill-chart-2"
              tint="bg-leaf-tint/70"
            />
            <SummaryCard
              chip="✨ Hoa nở"
              title="Đã đọc xong"
              value={stats.completed_count}
              unit="bộ hoàn tất"
              note={
                stats.completed_count > 0
                  ? `Chiếm ${percent(stats.completed_count, stats.total_comics)}% tủ truyện`
                  : `Chưa có bộ nào khép trang ${phrase}`
              }
              stage={plantStage(stats.completed_count, [1, 5, 15])}
              petal="fill-chart-4"
              tint="bg-accent-tint"
            />
            <SummaryCard
              chip="🌿 Sum suê"
              title="Chương đã đọc"
              value={stats.chapters_read}
              unit="chương"
              note={`Trên ${stats.comics_read} bộ truyện ${phrase}`}
              stage={plantStage(stats.chapters_read, [10, 100, 500])}
              petal="fill-chart-5"
              tint="bg-gold-tint"
            />
            <SummaryCard
              chip="🌹 Rực rỡ"
              title="Chuỗi ngày đọc"
              value={stats.streak_days}
              unit="ngày liên tiếp"
              note={
                stats.streak_days >= 7
                  ? 'Đom đóm thắp sáng vườn đêm ✨'
                  : stats.streak_days > 0
                    ? 'Mai nàng ghé vườn tiếp nhé'
                    : 'Hôm nay đọc một chương nhé'
              }
              stage={plantStage(stats.streak_days, [1, 3, 7])}
              petal="fill-chart-2"
              tint="bg-shelf-rose-tint"
            />
          </div>

          {/* Monthly chapters + favourite genres */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            <Card labelledBy="stats-monthly" className="lg:col-span-7 flex flex-col">
              <CardHeader
                id="stats-monthly"
                title="Chương Đã Đọc Theo Tháng"
                icon="🌿"
                sub={
                  period === 'week' || period === 'month'
                    ? 'Sáu tháng gần nhất, mỗi cành mầm là một tháng'
                    : 'Những cành mầm vươn lên đón nắng qua từng tháng'
                }
                aside={
                  <span className="hidden sm:inline-flex shrink-0 px-3 py-1 rounded-full bg-surface text-[11px] text-text-muted border border-border">
                    Đơn vị: <strong className="ml-1 text-text">chương</strong>
                  </span>
                }
              />
              {derived.peakMonth ? (
                <>
                  <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-shelf-rose-tint text-shelf-rose-ink text-[11px] font-bold">
                    <span aria-hidden="true">🌸</span>
                    {monthLong(derived.peakMonth.month)} bội thu: {formatNumber(derived.peakMonth.count)} chương
                  </span>
                  <MonthlyChart months={stats.chapters_by_month} peakMonth={derived.peakMonth.month} />
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>
                      Trung bình mỗi tháng nàng đọc <strong>{formatNumber(derived.avgPerMonth)} chương</strong>
                    </span>
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-text-muted">Những cành mầm đang chờ nàng gieo chương đầu tiên 🌱</p>
              )}
            </Card>

            <Card labelledBy="stats-genres" className="lg:col-span-5">
              <CardHeader
                id="stats-genres"
                title="Thể Loại Yêu Thích"
                icon="💐"
                sub={`Vườn hoa muôn sắc của những truyện nàng đọc ${phrase}`}
              />
              {stats.genres.length ? (
                <>
                  <GenreDonut genres={stats.genres} comicsRead={stats.comics_read} />
                  <p className="mt-3 text-[11px] text-text-muted">Một bộ truyện có thể thuộc nhiều thể loại.</p>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-text-muted">{`Nàng chưa đọc truyện nào ${phrase}`} 🌙</p>
              )}
            </Card>
          </div>

          {/* Reading calendar */}
          <Card labelledBy="stats-calendar">
            <CardHeader
              id="stats-calendar"
              title="Lịch Đọc Hoa Cỏ"
              icon="🗓️"
              sub={
                period === 'all'
                  ? 'Mỗi ô đất là một ngày trong 12 tháng gần nhất'
                  : `Mỗi ô đất được tưới bằng những trang truyện nàng đọc ${phrase}`
              }
              aside={
                <div className="hidden md:flex flex-wrap justify-end gap-2 shrink-0">
                  {derived.peakDay && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-[11px] text-text">
                      <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                      Ngày rực rỡ nhất: <strong>{dayLabel(derived.peakDay.date)} ({derived.peakDay.count} chương)</strong>
                    </span>
                  )}
                </div>
              }
            />
            {derived.peakDay && (
              <p className="md:hidden -mt-2 mb-3 text-xs text-text">
                <Sparkles className="inline w-3.5 h-3.5 mr-1 text-accent" aria-hidden="true" />
                Ngày rực rỡ nhất: <strong>{dayLabel(derived.peakDay.date)} ({derived.peakDay.count} chương)</strong>
              </p>
            )}
            <ReadingCalendar days={stats.reading_calendar} period={period} />
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
              <BloomLegend />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary-ink">
                <CalendarHeart className="w-4 h-4" aria-hidden="true" />
                {derived.bloomDays} ngày hoa nở
              </span>
            </div>
          </Card>

          {/* Top sources + yearly goal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <Card labelledBy="stats-sources">
              <CardHeader
                id="stats-sources"
                title="Nguồn Đọc Nhiều Nhất"
                icon="🎋"
                sub="Những chi nhánh thư viện nàng hay ghé"
                aside={
                  stats.top_sources.length ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] text-text">
                      Top {stats.top_sources.length}
                    </span>
                  ) : undefined
                }
              />
              {stats.top_sources.length ? (
                <ol className="flex flex-col gap-3.5">
                  {stats.top_sources.map((s, i) => (
                    <li key={s.site_name}>
                      <div className="flex items-center justify-between gap-3 mb-1.5 text-sm">
                        <span className="flex items-center gap-2 min-w-0 font-semibold text-text">
                          <span className="w-5 text-center text-xs font-bold text-text-muted tabular-nums">{i + 1}</span>
                          <Favicon src={s.favicon_url} name={s.site_name} />
                          <span className="truncate">{s.site_name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-text-muted tabular-nums">
                          <strong className="text-text">{s.count} bộ</strong> ({percent(s.count, derived.topSourceTotal)}%)
                        </span>
                      </div>
                      <VineProgressBar current={s.count} total={derived.topSourceTotal} variant="leaf" height="md" />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{`Chưa có nguồn nào được ghé ${phrase}`} 🌙</p>
              )}
            </Card>

            {goal && (
              <Card labelledBy="stats-goal" className="bg-sunbeam-gradient">
                <CardHeader
                  id="stats-goal"
                  title={`Mục Tiêu Năm ${goal.year}`}
                  icon="🎯"
                  sub={`Gieo hạt và chăm bón để hoàn thành ${goal.target} đóa hoa truyện`}
                  aside={
                    <button
                      type="button"
                      onClick={() => setGoalOpen(true)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-xs font-semibold text-text hover:border-primary transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Sửa mục tiêu
                    </button>
                  }
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-surface-raised/80 border border-border/60 p-4">
                  <div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0 rounded-full border-4 border-dashed border-accent-soft flex flex-col items-center justify-center text-center">
                    <span className="font-serif text-2xl font-bold text-text leading-none">{goalPct}%</span>
                    <span className="text-[10px] font-semibold text-text-muted mt-1">hoàn thành</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-serif text-lg font-semibold text-text">
                        {goal.completed} / {goal.target} bộ truyện
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-accent-tint text-accent-ink text-[11px] font-bold">
                        {goalLeft > 0 ? `Còn ${goalLeft} bộ nữa!` : 'Đã hoàn thành! 🎉'}
                      </span>
                    </div>
                    <VineProgressBar current={goal.completed} total={goal.target} variant="fairy" height="md" />
                    <p className="text-xs text-text-muted">
                      {goalLeft > 0
                        ? `Chỉ còn ${goalLeft} bộ nữa là khu vườn năm ${goal.year} của nàng rực rỡ trọn vẹn ✨`
                        : 'Khu vườn năm nay đã nở rộ trọn vẹn, nàng giỏi quá!'}
                    </p>
                  </div>
                </div>
                {goal.target <= 60 && (
                  <div className="mt-4">
                    <p className="text-[11px] text-text-muted mb-2">Mỗi đóa hoa là một bộ truyện đã khép trang:</p>
                    <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-raised/70 p-2.5" aria-hidden="true">
                      {Array.from({ length: goal.target }, (_, i) =>
                        i < goal.completed ? <Bloom key={i} level={3} size={18} /> : <Bloom key={i} level={1} size={18} />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Recently completed */}
          <section aria-labelledby="stats-recent" className="min-w-0">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 id="stats-recent" className="font-serif text-lg sm:text-xl font-semibold text-text flex items-center gap-2">
                  Vừa Đọc Xong <span aria-hidden="true" className="text-base">🌸</span>
                </h2>
                <p className="text-xs sm:text-sm text-text-muted">Những bộ truyện vừa khép trang cuối {phrase}</p>
              </div>
              <Link
                to="/search?status=completed"
                className="shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary-ink hover:text-primary"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            {stats.recently_completed.length ? (
              <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 scroll-px-3 pb-3 pt-1 sm:mx-0 sm:px-0 sm:scroll-px-0">
                {stats.recently_completed.map((c) => (
                  <div key={c.id} className="snap-start shrink-0 w-40 sm:w-48 flex">
                    <ComicCard comic={c} onToggleFavorite={toggleFavorite} className="w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-1.5 border-dashed border-border bg-surface/60 px-5 py-8 text-center text-sm text-text-muted">
                {`Chưa có bộ nào khép trang ${phrase}.`} Nàng cứ thong thả nhé 🌿
              </div>
            )}
          </section>
        </div>
      )}

      {goal &&
        (isDesktop ? (
          <Modal isOpen={goalOpen} onClose={() => setGoalOpen(false)} title="Sửa mục tiêu năm" subtitle="Bao nhiêu đóa hoa truyện sẽ nở?" maxWidth="sm">
            {goalForm}
          </Modal>
        ) : (
          <BottomSheet isOpen={goalOpen} onClose={() => setGoalOpen(false)} title="Sửa mục tiêu năm" subtitle="Bao nhiêu đóa hoa truyện sẽ nở?">
            {goalForm}
          </BottomSheet>
        ))}
    </div>
  );
};
