import React from 'react';
import {
  Calendar,
  Phone,
  PhoneCall,
  Repeat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { DutyShift, RoleType, StaffMember } from '../types';
import { formatMonthDay } from '../utils/scheduler';

interface MobileScheduleListProps {
  shifts: DutyShift[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onCellClick: (shift: DutyShift, role: RoleType) => void;
  onQuickSwap: (shift: DutyShift) => void;
  onOpenExportModal: () => void;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
}

export const MobileScheduleList: React.FC<MobileScheduleListProps> = ({
  shifts,
  selectedDate,
  onSelectDate,
  onCellClick,
  onQuickSwap,
  onOpenExportModal,
  line1Staff,
  line2Staff,
  leaders,
}) => {
  const [filterPerson, setFilterPerson] = React.useState<string>('');
  const [filterHolidayOnly, setFilterHolidayOnly] = React.useState<boolean>(false);

  // Filter shifts based on mobile user filters
  const visibleShifts = React.useMemo(() => {
    return shifts.filter((s) => {
      if (filterHolidayOnly && !s.holidayLabel && !s.isWeekend) return false;
      if (filterPerson) {
        const matches =
          s.line1.name === filterPerson ||
          s.line2.name === filterPerson ||
          s.leader.name === filterPerson;
        if (!matches) return false;
      }
      return true;
    });
  }, [shifts, filterPerson, filterHolidayOnly]);

  const allNames = React.useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => {
      set.add(s.line1.name);
      set.add(s.line2.name);
      set.add(s.leader.name);
    });
    return Array.from(set).sort();
  }, [shifts]);

  return (
    <div className="space-y-4">
      {/* Mobile Top Controls: Filter & Person Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-teal-600" />
            快速筛选
          </span>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 active:bg-emerald-100"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            手机导出Excel
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">按人员查看</label>
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">全部人员 ({shifts.length}天)</option>
              {allNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">特殊日期</label>
            <button
              type="button"
              onClick={() => setFilterHolidayOnly(!filterHolidayOnly)}
              className={`w-full py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                filterHolidayOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {filterHolidayOnly ? '已筛选: 节假日/周末' : '仅看节假日与周末'}
            </button>
          </div>
        </div>
      </div>

      {/* Shifts Card Feed */}
      <div className="space-y-3">
        {visibleShifts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
            没有符合筛选条件的值班记录
          </div>
        ) : (
          visibleShifts.map((shift) => {
            const isSelected = shift.date === selectedDate;
            return (
              <div
                key={shift.id}
                onClick={() => onSelectDate(shift.date)}
                className={`bg-white rounded-xl border transition-all p-3.5 shadow-xs relative overflow-hidden ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Date banner */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-slate-800">
                      {formatMonthDay(shift.date)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        shift.isWeekend
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {shift.dayOfWeek}
                    </span>
                    {shift.holidayLabel && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {shift.holidayLabel}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickSwap(shift);
                    }}
                    className="inline-flex items-center text-[11px] text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-md border border-teal-200"
                  >
                    <Repeat className="w-3 h-3 mr-1" />
                    调班
                  </button>
                </div>

                {/* 3 Duty Roles Stack */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Line 1 */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellClick(shift, 'line1');
                    }}
                    className="bg-cyan-50/70 border border-cyan-200/80 rounded-lg p-2 flex flex-col justify-between active:scale-95 transition-transform"
                  >
                    <span className="text-[10px] text-cyan-700 font-bold">一线</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5">
                      {shift.line1.name}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate mt-0.5">
                      {shift.line1.department || '行政科'}
                    </span>
                  </div>

                  {/* Line 2 */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellClick(shift, 'line2');
                    }}
                    className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-2 flex flex-col justify-between active:scale-95 transition-transform"
                  >
                    <span className="text-[10px] text-indigo-700 font-bold">二线</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5">
                      {shift.line2.name}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate mt-0.5">
                      {shift.line2.department || '职能部'}
                    </span>
                  </div>

                  {/* Leader */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onCellClick(shift, 'leader');
                    }}
                    className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 flex flex-col justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 font-bold">领导</span>
                      {shift.leader.phone && (
                        <a
                          href={`tel:${shift.leader.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-amber-600 hover:text-amber-800"
                          title="拨打电话"
                        >
                          <PhoneCall className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 mt-0.5">
                      {shift.leader.name}
                    </span>
                    {shift.leader.phone ? (
                      <span className="text-[9px] text-amber-800 font-mono">
                        {shift.leader.phone.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">院领导</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
