import React from 'react';
import {
  Phone,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  UserCheck,
  Building,
  Info,
} from 'lucide-react';
import { DutyShift, HospitalConfig } from '../types';
import { formatMonthDay } from '../utils/scheduler';

interface TodayDutyCardProps {
  shifts: DutyShift[];
  config: HospitalConfig;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onQuickSwap: (shift: DutyShift) => void;
}

export const TodayDutyCard: React.FC<TodayDutyCardProps> = ({
  shifts,
  config,
  selectedDate,
  onSelectDate,
  onQuickSwap,
}) => {
  const [showNotice, setShowNotice] = React.useState(false);

  // Find shift for selectedDate, or fallback to first shift
  const currentShiftIndex = shifts.findIndex((s) => s.date === selectedDate);
  const currentShift =
    currentShiftIndex !== -1 ? shifts[currentShiftIndex] : shifts[0];

  if (!currentShift) return null;

  const handlePrevDay = () => {
    if (currentShiftIndex > 0) {
      onSelectDate(shifts[currentShiftIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    if (currentShiftIndex < shifts.length - 1) {
      onSelectDate(shifts[currentShiftIndex + 1].date);
    }
  };

  // Find today's real ISO date string YYYY-MM-DD
  const todayIso = new Date().toISOString().split('T')[0];
  const isToday = currentShift.date === todayIso;

  return (
    <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 relative overflow-hidden border border-teal-700/50">
      {/* Subtle background hospital motif watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
        <svg className="w-64 h-64 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>

      {/* Top Banner / Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-700/50">
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-sm font-semibold tracking-wide text-teal-200 uppercase flex items-center">
            {isToday ? '今日行政总值班' : '值班人员详情'}
            <span className="ml-2 text-xs bg-teal-700/60 text-teal-100 px-2 py-0.5 rounded-full border border-teal-500/30">
              24小时值班制
            </span>
          </h2>
        </div>

        {/* Date switcher */}
        <div className="flex items-center space-x-2 bg-teal-950/60 p-1.5 rounded-xl border border-teal-700/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={currentShiftIndex <= 0}
            className="p-1 rounded-lg hover:bg-teal-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="前一天"
            aria-label="前一天"
          >
            <ChevronLeft className="w-4 h-4 text-teal-200" />
          </button>

          <div className="flex items-center space-x-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-teal-300" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {currentShift.date} ({formatMonthDay(currentShift.date)}) {currentShift.dayOfWeek}
            </span>
            {currentShift.holidayLabel && (
              <span className="bg-rose-500/80 text-rose-50 text-[10px] font-bold px-1.5 py-0.2 rounded">
                {currentShift.holidayLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={currentShiftIndex >= shifts.length - 1}
            className="p-1 rounded-lg hover:bg-teal-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="后一天"
            aria-label="后一天"
          >
            <ChevronRight className="w-4 h-4 text-teal-200" />
          </button>
        </div>
      </div>

      {/* 3 Main Duty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* 一线值班 */}
        <div className="bg-teal-950/50 backdrop-blur-sm border border-teal-600/40 rounded-xl p-4 flex flex-col justify-between hover:border-teal-400/60 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                一线值班
              </span>
              <span className="text-[11px] text-teal-300">现场驻守与巡视</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight my-1">
              {currentShift.line1.name}
            </div>
            <div className="flex items-center text-xs text-teal-200 mt-1">
              <Building className="w-3.5 h-3.5 mr-1 text-teal-400" />
              <span>科室: {currentShift.line1.department || '院区行政科室'}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-teal-800/40 flex items-center justify-between text-[11px] text-teal-300">
            <span>巡视院区 · 防火防盗</span>
            <button
              type="button"
              onClick={() => onQuickSwap(currentShift)}
              className="text-cyan-300 hover:text-cyan-100 font-medium underline"
            >
              临时调换
            </button>
          </div>
        </div>

        {/* 二线值班 */}
        <div className="bg-teal-950/50 backdrop-blur-sm border border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-400/60 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                二线值班
              </span>
              <span className="text-[11px] text-indigo-300">协同调度与处理</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight my-1">
              {currentShift.line2.name}
            </div>
            <div className="flex items-center text-xs text-indigo-200 mt-1">
              <Building className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              <span>部门: {currentShift.line2.department || '职能管理部门'}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-[11px] text-indigo-300">
            <span>突发应急汇报指导</span>
            <button
              type="button"
              onClick={() => onQuickSwap(currentShift)}
              className="text-indigo-300 hover:text-indigo-100 font-medium underline"
            >
              临时调换
            </button>
          </div>
        </div>

        {/* 带班领导 */}
        <div className="bg-gradient-to-b from-amber-950/40 to-teal-950/60 backdrop-blur-sm border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between hover:border-amber-400/60 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-400/30">
                值班院领导
              </span>
              <span className="text-[11px] text-amber-300">全院总指挥协调</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight my-1 flex items-center justify-between">
              <span>{currentShift.leader.name}</span>
              {currentShift.leader.phone && (
                <a
                  href={`tel:${currentShift.leader.phone}`}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-transform active:scale-95"
                  title="一键拨打领导电话"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1" />
                  拨打
                </a>
              )}
            </div>
            <div className="flex items-center text-xs text-amber-200/90 mt-1">
              <Phone className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>电话: {currentShift.leader.phone || '院内直拨'}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-800/40 flex items-center justify-between text-[11px] text-amber-300">
            <span>重大事件直接汇报</span>
            <button
              type="button"
              onClick={() => onQuickSwap(currentShift)}
              className="text-amber-300 hover:text-amber-100 font-medium underline"
            >
              调整
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Hotline & Notice Toggle */}
      <div className="mt-4 pt-3 border-t border-teal-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-rose-300 font-bold bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-700/50">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400 animate-pulse" />
            <span>24小时急救电话:</span>
            <a
              href={`tel:${config.emergencyPhone}`}
              className="ml-1 text-white underline hover:text-rose-200 font-mono text-sm"
            >
              {config.emergencyPhone}
            </a>
            <span className="ml-1 text-rose-300 text-[11px]">({config.emergencyPhoneDesc})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowNotice(!showNotice)}
            className="text-teal-200 hover:text-white flex items-center text-xs underline cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            {showNotice ? '收起值班管理规范' : '查看值班管理规范'}
          </button>
        </div>

        <div className="text-teal-300/80 text-[11px] flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>次日早上8:00交接班 · 保持24小时通讯畅通</span>
        </div>
      </div>

      {/* Expandable Notice Box */}
      {showNotice && (
        <div className="mt-3 p-3 bg-teal-950/80 border border-teal-600/50 rounded-xl text-teal-100 text-xs leading-relaxed animate-in fade-in duration-200">
          <p className="font-semibold text-teal-200 mb-1 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" />
            医院行政总值班工作守则:
          </p>
          <p className="text-teal-200/90">{config.noticeText}</p>
        </div>
      )}
    </div>
  );
};
