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
import { loadAll, saveState } from './lib/scheduleStore';
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
  const [shifts, setShifts] = React.useState<DutyShift[]>([]);
  const [line1Staff, setLine1Staff] = React.useState<StaffMember[]>([]);
  const [line2Staff, setLine2Staff] = React.useState<StaffMember[]>([]);
  const [leaders, setLeaders] = React.useState<StaffMember[]>([]);

  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  // 当前日期（今天），每分钟刷新一次，保证跨午夜时自动更新
  const [today, setToday] = React.useState<string>(todayISO());
  React.useEffect(() => {
    const timer = setInterval(() => setToday(todayISO()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected date for TodayDutyCard & Table highlight —— 默认选中今天
  const [selectedDate, setSelectedDate] = React.useState<string>(todayISO());

  // 从数据库加载全部数据
  const reloadFromDb = React.useCallback(() => {
    setDataLoaded(false);
    return loadAll().then((d) => {
      const loadedShifts = d.shifts ?? [];
      setShifts(loadedShifts);
      setLine1Staff(d.line1 ?? []);
      setLine2Staff(d.line2 ?? []);
      setLeaders(d.leaders ?? []);
      // 若今天在排班范围内就选今天，否则退回到第一条排班
      if (loadedShifts.length > 0) {
        const t = todayISO();
        const hasToday = loadedShifts.some((s) => s.date === t);
        setSelectedDate(hasToday ? t : loadedShifts[0].date);
      }
      setDataLoaded(true);
    });
  }, []);

  // 首次加载
  React.useEffect(() => {
    reloadFromDb();
  }, [reloadFromDb]);

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

  // 数据变化时写回（Supabase 或 localStorage）。
  // 仅在初次加载完成、且有编辑权限时写，避免：1) 用默认值覆盖数据库；2) 匿名用户徒劳请求被 RLS 拒绝。
  React.useEffect(() => {
    if (!dataLoaded || !auth.canEdit) return;
    saveState('shifts', shifts);
  }, [shifts, dataLoaded, auth.canEdit]);

  React.useEffect(() => {
    if (!dataLoaded || !auth.canEdit) return;
    saveState('line1', line1Staff);
    saveState('line2', line2Staff);
    saveState('leaders', leaders);
  }, [line1Staff, line2Staff, leaders, dataLoaded, auth.canEdit]);

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

  const handleApplyNewSchedule = (newShifts: DutyShift[]) => {
    setShifts(newShifts);
    if (newShifts.length > 0) {
      setSelectedDate(newShifts[0].date);
    }
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
        {/* 当前日期显示 */}
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays className="h-4 w-4 text-teal-600" />
          <span>
            今天是 <span className="font-semibold text-slate-700">{formatToday(today)}</span>
          </span>
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
        existingShifts={shifts}
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
        onApplyUpdatedShifts={setShifts}
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
