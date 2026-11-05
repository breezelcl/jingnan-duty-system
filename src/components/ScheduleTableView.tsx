import React from 'react';
import {
  Calendar,
  Grid,
  List,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { DutyShift, HospitalConfig, RoleType, StaffMember } from '../types';
import { formatMonthDay } from '../utils/scheduler';

interface ScheduleTableViewProps {
  shifts: DutyShift[];
  config: HospitalConfig;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
  viewMode: 'table' | 'calendar' | 'mobile_list';
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onCellClick: (shift: DutyShift, role: RoleType) => void;
  onQuickSwap: (shift: DutyShift) => void;
}

export const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({
  shifts,
  config,
  line1Staff,
  line2Staff,
  leaders,
  viewMode,
  searchQuery,
  onSearchChange,
  selectedDate,
  onSelectDate,
  onCellClick,
  onQuickSwap,
}) => {
  // Filter shifts if search query is entered
  const filteredShifts = React.useMemo(() => {
    if (!searchQuery.trim()) return shifts;
    const q = searchQuery.trim().toLowerCase();
    return shifts.filter(
      (s) =>
        s.line1.name.toLowerCase().includes(q) ||
        s.line2.name.toLowerCase().includes(q) ||
        s.leader.name.toLowerCase().includes(q) ||
        s.date.includes(q) ||
        (s.holidayLabel && s.holidayLabel.toLowerCase().includes(q))
    );
  }, [shifts, searchQuery]);

  // Group shifts into 7-day chunks for the hospital classic weekly layout
  const weeklyChunks = React.useMemo(() => {
    const chunks: DutyShift[][] = [];
    for (let i = 0; i < shifts.length; i += 7) {
      chunks.push(shifts.slice(i, i + 7));
    }
    return chunks;
  }, [shifts]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索值班人员姓名、日期或节日 (如: 盛凯, 10-01)"
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              清空
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-cyan-100 border border-cyan-400 mr-1.5"></span>
            一线
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-400 mr-1.5"></span>
            二线
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400 mr-1.5"></span>
            值班领导
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-400 mr-1.5"></span>
            法定节假日
          </span>
        </div>
      </div>

      {/* Mode 1: 医院原版7天块报表网格 (Default Table View) */}
      {viewMode === 'table' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main 7-day multi-row blocks */}
          <div className="xl:col-span-3 space-y-6">
            {weeklyChunks.map((chunk, chunkIdx) => (
              <div
                key={`chunk-${chunkIdx}`}
                className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
              >
                {/* Block header */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center text-teal-800 font-bold">
                    <Clock className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    第 {chunkIdx + 1} 阶段值班安排 ({chunk[0]?.date} 至 {chunk[chunk.length - 1]?.date})
                  </span>
                  <span className="text-slate-400 font-normal">点击任意单元格可快速调换人员</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse min-w-[700px]">
                    <tbody>
                      {/* Row 1: 节假日 */}
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <td className="w-24 px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100/70 border-r border-slate-200">
                          节假日
                        </td>
                        {chunk.map((shift) => (
                          <td
                            key={`hol-${shift.id}`}
                            className={`px-3 py-1.5 text-xs font-semibold ${
                              shift.holidayLabel
                                ? 'text-rose-600 bg-rose-50/70'
                                : 'text-slate-400'
                            }`}
                          >
                            {shift.holidayLabel ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200">
                                {shift.holidayLabel}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        ))}
                        {/* Pad if fewer than 7 days */}
                        {Array.from({ length: 7 - chunk.length }).map((_, i) => (
                          <td key={`pad-hol-${i}`} className="text-slate-300">
                            —
                          </td>
                        ))}
                      </tr>

                      {/* Row 2: 日期 */}
                      <tr className="border-b border-slate-200 bg-slate-50 font-medium">
                        <td className="px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 border-r border-slate-200">
                          日期
                        </td>
                        {chunk.map((shift) => {
                          const isSelected = shift.date === selectedDate;
                          return (
                            <td
                              key={`date-${shift.id}`}
                              onClick={() => onSelectDate(shift.date)}
                              className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-teal-600 text-white font-bold'
                                  : shift.isWeekend
                                  ? 'bg-amber-50/40 text-amber-900 font-semibold hover:bg-teal-50'
                                  : 'text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <div>{formatMonthDay(shift.date)}</div>
                              <div
                                className={`text-[10px] ${
                                  isSelected ? 'text-teal-100' : 'text-slate-400'
                                }`}
                              >
                                {shift.dayOfWeek}
                              </div>
                            </td>
                          );
                        })}
                        {Array.from({ length: 7 - chunk.length }).map((_, i) => (
                          <td key={`pad-date-${i}`} className="text-slate-300">
                            —
                          </td>
                        ))}
                      </tr>

                      {/* Row 3: 一线 */}
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-3 text-xs font-bold text-cyan-800 bg-cyan-50/50 border-r border-slate-200">
                          一线
                        </td>
                        {chunk.map((shift) => (
                          <td
                            key={`l1-${shift.id}`}
                            onClick={() => onCellClick(shift, 'line1')}
                            className="px-2 py-2.5 text-xs font-bold text-slate-800 hover:bg-cyan-50 cursor-pointer transition-colors group"
                            title="点击调换一线人员"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="px-2 py-1 rounded-md bg-cyan-50 text-cyan-900 border border-cyan-200 group-hover:bg-cyan-100 group-hover:border-cyan-300 transition-colors">
                                {shift.line1.name}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[80px]">
                                {shift.line1.department}
                              </span>
                            </div>
                          </td>
                        ))}
                        {Array.from({ length: 7 - chunk.length }).map((_, i) => (
                          <td key={`pad-l1-${i}`} className="text-slate-300">
                            —
                          </td>
                        ))}
                      </tr>

                      {/* Row 4: 二线 */}
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-3 text-xs font-bold text-indigo-800 bg-indigo-50/50 border-r border-slate-200">
                          二线
                        </td>
                        {chunk.map((shift) => (
                          <td
                            key={`l2-${shift.id}`}
                            onClick={() => onCellClick(shift, 'line2')}
                            className="px-2 py-2.5 text-xs font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer transition-colors group"
                            title="点击调换二线人员"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 group-hover:bg-indigo-100 group-hover:border-indigo-300 transition-colors">
                                {shift.line2.name}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[80px]">
                                {shift.line2.department}
                              </span>
                            </div>
                          </td>
                        ))}
                        {Array.from({ length: 7 - chunk.length }).map((_, i) => (
                          <td key={`pad-l2-${i}`} className="text-slate-300">
                            —
                          </td>
                        ))}
                      </tr>

                      {/* Row 5: 值班领导 */}
                      <tr>
                        <td className="px-3 py-3 text-xs font-bold text-amber-800 bg-amber-50/50 border-r border-slate-200">
                          值班领导
                        </td>
                        {chunk.map((shift) => (
                          <td
                            key={`ld-${shift.id}`}
                            onClick={() => onCellClick(shift, 'leader')}
                            className="px-2 py-2.5 text-xs font-bold text-slate-800 hover:bg-amber-50 cursor-pointer transition-colors group"
                            title="点击调换值班领导"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 group-hover:bg-amber-100 group-hover:border-amber-300 transition-colors">
                                {shift.leader.name}
                              </span>
                              {shift.leader.phone && (
                                <a
                                  href={`tel:${shift.leader.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-amber-700 hover:underline flex items-center mt-0.5"
                                >
                                  <Phone className="w-2.5 h-2.5 mr-0.5" />
                                  {shift.leader.phone.slice(-4)}
                                </a>
                              )}
                            </div>
                          </td>
                        ))}
                        {Array.from({ length: 7 - chunk.length }).map((_, i) => (
                          <td key={`pad-ld-${i}`} className="text-slate-300">
                            —
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Hospital Roster Directory & Notice */}
          <div className="space-y-6">
            {/* Leaders Phone Directory */}
            <div className="bg-white rounded-xl shadow-xs border border-amber-200 p-4">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center mb-3">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                带班院领导通讯录
              </h3>
              <div className="space-y-2">
                {leaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 hover:bg-amber-100/60 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{leader.name}</span>
                      <span className="text-[11px] text-amber-800 ml-1.5">院领导</span>
                    </div>
                    {leader.phone && (
                      <a
                        href={`tel:${leader.phone}`}
                        className="font-mono text-amber-900 hover:text-amber-700 font-medium underline flex items-center"
                      >
                        {leader.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Line 1 & Line 2 Rotation Queue preview */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center mb-3">
                <Grid className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                轮转名册队列
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Line 1 */}
                <div className="bg-cyan-50/40 rounded-lg p-2.5 border border-cyan-100">
                  <div className="font-bold text-cyan-900 mb-2 flex items-center justify-between">
                    <span>一线名册</span>
                    <span className="text-[10px] bg-cyan-200 text-cyan-800 px-1.5 py-0.2 rounded-full">
                      {line1Staff.length}人
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {line1Staff.map((staff, idx) => (
                      <div
                        key={staff.id}
                        className="text-[11px] text-slate-700 flex items-center justify-between py-0.5 border-b border-cyan-100/50"
                      >
                        <span>
                          {idx + 1}. {staff.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                          {staff.department}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line 2 */}
                <div className="bg-indigo-50/40 rounded-lg p-2.5 border border-indigo-100">
                  <div className="font-bold text-indigo-900 mb-2 flex items-center justify-between">
                    <span>二线名册</span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded-full">
                      {line2Staff.length}人
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {line2Staff.map((staff, idx) => (
                      <div
                        key={staff.id}
                        className="text-[11px] text-slate-700 flex items-center justify-between py-0.5 border-b border-indigo-100/50"
                      >
                        <span>
                          {idx + 1}. {staff.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                          {staff.department}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Remarks Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <div className="font-bold text-slate-800 mb-1.5 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-teal-600" />
                值班要求与交接规范:
              </div>
              <p className="text-[11px] text-slate-500">
                {config.noticeText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: 月历大卡片视图 (Calendar View) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500">
            <span>周日</span>
            <span>周一</span>
            <span>周二</span>
            <span>周三</span>
            <span>周四</span>
            <span>周五</span>
            <span>周六</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {filteredShifts.map((shift) => {
              const isSelected = shift.date === selectedDate;
              return (
                <div
                  key={`cal-${shift.id}`}
                  onClick={() => onSelectDate(shift.date)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800">
                      {formatMonthDay(shift.date)}
                    </span>
                    {shift.holidayLabel ? (
                      <span className="bg-rose-500 text-white text-[9px] font-bold px-1 rounded">
                        {shift.holidayLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">{shift.dayOfWeek}</span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-cyan-900 bg-cyan-50/80 px-1.5 py-0.5 rounded border border-cyan-100">
                      <span className="text-[9px] text-cyan-600 font-semibold">一线</span>
                      <span className="font-bold">{shift.line1.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-indigo-900 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">
                      <span className="text-[9px] text-indigo-600 font-semibold">二线</span>
                      <span className="font-bold">{shift.line2.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-900 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100">
                      <span className="text-[9px] text-amber-600 font-semibold">领导</span>
                      <span className="font-bold">{shift.leader.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
