import React from 'react';
import { INITIAL_HOSPITAL_CONFIG } from './data/initialData';
import { DutyShift, HospitalConfig, RoleType, StaffMember } from './types';
import { todayISO } from './utils/scheduler';
import { Header } from './components/Header';
import { TodayDutyCard } from './components/TodayDutyCard';
import { ScheduleTableView } from './components/ScheduleTableView';
import { MobileScheduleList } from './components/MobileScheduleList';
import { AutoScheduleModal } from './components/AutoScheduleModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { ShiftSwapModal } from './components/ShiftSwapModal';
import { StatisticsModal } from './components/StatisticsModal';
import { LoginModal } from './components/LoginModal';
import { CalendarDays, FileSpreadsheet, Sparkles, Repeat, Loader2 } from 'lucide-react';
import { loadShifts, loadRosters, upsertShifts, saveState } from './lib/scheduleStore';
import { useAuth } from './lib/useAuth';

/** 把 YYYY-MM-DD 格式化为“2026年11月5日 周四” */
function formatToday(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map((n) => parseInt(n, 10));
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dow = week[new Date(`${dateISO}T12:00:00`).getDay()];
  return `${y}年${m}月${d}日 ${dow}`;
}

export default function App() {
  const [config] = React.useState<HospitalConfig>(INITIAL_HOSPITAL_CONFIG);

  const auth = useAuth();

  // 所有排班/人员数据都来自数据库，前端不再内置。加载完成前为空。
  const [dataLoaded, setDataLoaded] = React.useState(false);
  // shifts = 当前所选月份的排班（用于显示）；历史全部保存在数据库，按月查看
  const [shifts, setShifts] = React.useState<DutyShift[]>([]);
  const [line1Staff, setLine1Staff] = React.useState<StaffMember[]>([]);
  const [line2Staff, setLine2Staff] = React.useState<StaffMember[]>([]);
  const [leaders, setLeaders] = React.useState<StaffMember[]>([]);

  // 已有排班的所有月份（如 ["2026-10","2026-11"]）+ 当前查看的月份
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = React.useState<string>(todayISO().slice(0, 7));
  // 数据库中全部排班（用于自动排班的接续上月、重叠检测、历史查询）
  const [allShifts, setAllShifts] = React.useState<DutyShift[]>([]);
  const existingDates = React.useMemo(() => allShifts.map((s) => s.date), [allShifts]);

  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  // 当前日期（今天），每分钟刷新一次，保证跨午夜时自动更新
  const [today, setToday] = React.useState<string>(todayISO());
  React.useEffect(() => {
    const timer = setInterval(() => setToday(todayISO()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected date for TodayDutyCard & Table highlight —— 默认选中今天
  const [selectedDate, setSelectedDate] = React.useState<string>(todayISO());

  // 加载指定月份的排班（month = "YYYY-MM"）
  const loadMonth = React.useCallback((month: string) => {
    const from = `${month}-01`;
    const to = `${month}-31`;
    return loadShifts(from, to).then((monthShifts) => {
      setShifts(monthShifts);
      if (monthShifts.length > 0) {
        const t = todayISO();
        const hasToday = monthShifts.some((s) => s.date === t);
        setSelectedDate(hasToday ? t : monthShifts[0].date);
      }
    });
  }, []);

  // 从数据库加载：人员 + 全部排班日期(算月份) + 默认月份的排班
  const reloadFromDb = React.useCallback(() => {
    setDataLoaded(false);
    return Promise.all([loadRosters(), loadShifts()]).then(async ([rosters, allShifts]) => {
      setLine1Staff(rosters.line1 ?? []);
      setLine2Staff(rosters.line2 ?? []);
      setLeaders(rosters.leaders ?? []);

      setAllShifts(allShifts);
      const dates = allShifts.map((s) => s.date);
      const months = Array.from(new Set(dates.map((d) => d.slice(0, 7)))).sort();
      setAvailableMonths(months);

      // 默认月份：有今天所在月就用它，否则用最近一个有排班的月
      const thisMonth = todayISO().slice(0, 7);
      const month = months.includes(thisMonth)
        ? thisMonth
        : months.length > 0
          ? months[months.length - 1]
          : thisMonth;
      setCurrentMonth(month);
      await loadMonth(month);
      setDataLoaded(true);
    });
  }, [loadMonth]);

  // 首次加载
  React.useEffect(() => {
    reloadFromDb();
  }, [reloadFromDb]);

  // 切换月份
  const handleChangeMonth = (month: string) => {
    setCurrentMonth(month);
    loadMonth(month);
  };

  // View state: 'table' | 'calendar' | 'mobile_list'
  const [activeTab, setActiveTab] = React.useState<'table' | 'calendar' | 'mobile_list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile_list';
    }
    return 'table';
  });
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Modal dialog states
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isStaffOpen, setIsStaffOpen] = React.useState(false);
  const [isStatsOpen, setIsStatsOpen] = React.useState(false);
  const [isSwapOpen, setIsSwapOpen] = React.useState(false);

  // Targeted swap state for direct cell clicking
  const [swapTargetShift, setSwapTargetShift] = React.useState<DutyShift | null>(null);
  const [swapTargetRole, setSwapTargetRole] = React.useState<RoleType>('line1');

  // 人员名单变化时写回（整份存 app_state）。排班不在这里保存——
  // 排班按天 upsert，在「自动排班应用」和「调班」等具体操作里显式保存，避免覆盖历史。
  React.useEffect(() => {
    if (!dataLoaded || !auth.canEdit) return;
    saveState('line1', line1Staff);
    saveState('line2', line2Staff);
    saveState('leaders', leaders);
  }, [line1Staff, line2Staff, leaders, dataLoaded, auth.canEdit]);

  // 显式保存排班（按天 upsert，不影响其他日期）
  const persistShifts = React.useCallback(
    (toSave: DutyShift[]) => {
      if (!auth.canEdit) return;
      upsertShifts(toSave).then((ok) => {
        if (!ok) alert('排班保存到服务器失败，请检查网络或重新登录后重试。');
      });
    },
    [auth.canEdit]
  );

  // 重新从数据库加载（放弃本地未保存的改动）
  const handleReloadData = () => {
    if (confirm('确认重新从服务器加载最新排班数据吗？')) {
      reloadFromDb();
    }
  };

  // 编辑守卫：未登录（且启用了 Supabase 鉴权）时，弹登录框，不执行编辑动作
  const requireEdit = (action: () => void) => {
    if (!auth.canEdit) {
      setIsLoginOpen(true);
      return;
    }
    action();
  };

  const handleCellClick = (shift: DutyShift, role: RoleType) => {
    requireEdit(() => {
      setSwapTargetShift(shift);
      setSwapTargetRole(role);
      setIsSwapOpen(true);
    });
  };

  const handleQuickSwap = (shift: DutyShift) => {
    requireEdit(() => {
      setSwapTargetShift(shift);
      setSwapTargetRole('line1');
      setIsSwapOpen(true);
    });
  };

  // 自动排班应用：按天保存到数据库（不覆盖其他日期的历史），并切到该月显示
  const handleApplyNewSchedule = async (newShifts: DutyShift[]) => {
    if (newShifts.length === 0) return;
    const ok = await upsertShifts(newShifts);
    if (!ok) {
      alert('排班保存到服务器失败，请检查网络或重新登录后重试。');
      return;
    }
    // 刷新全部日期/月份，并切到新排班的第一个月
    const refreshed = await loadShifts();
    setAllShifts(refreshed);
    const dates = refreshed.map((s) => s.date);
    setAvailableMonths(Array.from(new Set(dates.map((d) => d.slice(0, 7)))).sort());
    const targetMonth = newShifts[0].date.slice(0, 7);
    setCurrentMonth(targetMonth);
    await loadMonth(targetMonth);
  };

  // 调班/改人后保存：按天 upsert，并更新当前显示
  const handleShiftsUpdated = (updated: DutyShift[]) => {
    setShifts(updated);
    persistShifts(updated);
  };

  const handleUpdateRosters = (
    l1: StaffMember[],
    l2: StaffMember[],
    ld: StaffMember[]
  ) => {
    setLine1Staff(l1);
    setLine2Staff(l2);
    setLeaders(ld);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased pb-20 lg:pb-12">
      {/* Top Navigation */}
      <Header
        config={config}
        onOpenAutoSchedule={() => requireEdit(() => setIsAutoScheduleOpen(true))}
        onOpenStaffModal={() => requireEdit(() => setIsStaffOpen(true))}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenStatsModal={() => setIsStatsOpen(true)}
        onOpenSwapModal={() =>
          requireEdit(() => {
            setSwapTargetShift(null);
            setIsSwapOpen(true);
          })
        }
        onResetData={handleReloadData}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canEdit={auth.canEdit}
        needsAuth={auth.needsAuth}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={auth.signOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 当前日期 + 历史月份切换 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-teal-600" />
            <span>
              今天是 <span className="font-semibold text-slate-700">{formatToday(today)}</span>
            </span>
          </div>

          {dataLoaded && availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">查看月份:</span>
              <select
                value={currentMonth}
                onChange={(e) => handleChangeMonth(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {availableMonths.map((m) => {
                  const [y, mo] = m.split('-');
                  const isCurrent = m === todayISO().slice(0, 7);
                  return (
                    <option key={m} value={m}>
                      {y}年{parseInt(mo, 10)}月{isCurrent ? '（本月）' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {!dataLoaded ? (
          /* 加载中 */
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
            <p className="mt-4 text-sm">正在从服务器加载排班数据…</p>
          </div>
        ) : shifts.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
            <CalendarDays className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">暂无排班数据</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {auth.canEdit
                ? '请使用「自动排班」生成排班，或在「人员库」中录入人员后排班。'
                : '数据库中还没有排班数据，请先登录后生成排班。'}
            </p>
            <button
              type="button"
              onClick={() => requireEdit(() => setIsAutoScheduleOpen(true))}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Sparkles className="h-4 w-4" />
              开始自动排班
            </button>
          </div>
        ) : (
          <>
            {/* Today's Duty Showcase Card */}
            <TodayDutyCard
              shifts={shifts}
              config={config}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onQuickSwap={handleQuickSwap}
            />

            {/* View Switching Logic */}
            {activeTab === 'mobile_list' ? (
          <MobileScheduleList
            shifts={shifts}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onCellClick={handleCellClick}
            onQuickSwap={handleQuickSwap}
            onOpenExportModal={() => setIsExportOpen(true)}
            line1Staff={line1Staff}
            line2Staff={line2Staff}
            leaders={leaders}
          />
        ) : (
          <ScheduleTableView
            shifts={shifts}
            config={config}
            line1Staff={line1Staff}
            line2Staff={line2Staff}
            leaders={leaders}
            viewMode={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onCellClick={handleCellClick}
            onQuickSwap={handleQuickSwap}
          />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile Quick Actions */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around lg:hidden z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('mobile_list')}
          className={`flex flex-col items-center py-1 px-2 ${
            activeTab === 'mobile_list' ? 'text-teal-700 font-bold' : 'text-slate-500'
          }`}
        >
          <CalendarDays className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">值班卡</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`flex flex-col items-center py-1 px-2 ${
            activeTab === 'table' ? 'text-teal-700 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="text-xs font-bold leading-4">7天</span>
          <span className="text-[10px]">原版大表</span>
        </button>

        <button
          type="button"
          onClick={() => requireEdit(() => setIsAutoScheduleOpen(true))}
          className="flex flex-col items-center py-1 px-2 text-teal-600 hover:text-teal-800"
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">自动排班</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-emerald-600 hover:text-emerald-800 font-bold"
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">导出Excel</span>
        </button>

        <button
          type="button"
          onClick={() =>
            requireEdit(() => {
              setSwapTargetShift(null);
              setIsSwapOpen(true);
            })
          }
          className="flex flex-col items-center py-1 px-2 text-slate-500 hover:text-slate-800"
        >
          <Repeat className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">调班</span>
        </button>
      </div>

      {/* Modals */}
      <AutoScheduleModal
        isOpen={isAutoScheduleOpen}
        onClose={() => setIsAutoScheduleOpen(false)}
        onApplySchedule={handleApplyNewSchedule}
        line1Staff={line1Staff}
        line2Staff={line2Staff}
        leaders={leaders}
        existingShifts={allShifts}
        existingDates={existingDates}
      />

      <ExcelExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        shifts={shifts}
        config={config}
        line1Staff={line1Staff}
        line2Staff={line2Staff}
        leaders={leaders}
      />

      <StaffManagementModal
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
        line1Staff={line1Staff}
        line2Staff={line2Staff}
        leaders={leaders}
        onUpdateRosters={handleUpdateRosters}
      />

      <ShiftSwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        shifts={shifts}
        initialShift={swapTargetShift}
        initialRole={swapTargetRole}
        line1Staff={line1Staff}
        line2Staff={line2Staff}
        leaders={leaders}
        onApplyUpdatedShifts={handleShiftsUpdated}
      />

      <StatisticsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        shifts={shifts}
        line1Staff={line1Staff}
        line2Staff={line2Staff}
        leaders={leaders}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSignIn={auth.signIn}
      />
    </div>
  );
}
