import React from 'react';
import {
  BarChart3,
  X,
  Award,
  Calendar,
  Shield,
  Filter,
} from 'lucide-react';
import { DutyShift, RoleType, StaffMember } from '../types';
import { calculateStaffWorkload } from '../utils/scheduler';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: DutyShift[];
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  shifts,
  line1Staff,
  line2Staff,
  leaders,
}) => {
  if (!isOpen) return null;

  const [activeRole, setActiveRole] = React.useState<RoleType | 'all'>('all');

  const allStaff = React.useMemo(() => {
    return [...line1Staff, ...line2Staff, ...leaders];
  }, [line1Staff, line2Staff, leaders]);

  const statsMap = React.useMemo(() => {
    return calculateStaffWorkload(allStaff, shifts);
  }, [allStaff, shifts]);

  const statsList = React.useMemo(() => {
    let list = Object.values(statsMap);
    if (activeRole !== 'all') {
      list = list.filter((item) => item.role === activeRole);
    }
    // Sort by total shifts descending, then holiday shifts descending
    return list.sort((a, b) => b.totalShifts - a.totalShifts || b.holidayShifts - a.holidayShifts);
  }, [statsMap, activeRole]);

  // Overall metrics
  const totalDays = shifts.length;
  const totalHolidayDays = shifts.filter((s) => s.isHoliday).length;
  const totalWeekendDays = shifts.filter((s) => s.isWeekend && !s.isHoliday).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="text-base font-bold">总值班工作量与均衡统计</h3>
              <p className="text-xs text-teal-200/80">保障医院行政总值班与节假日轮转公平合理</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview cards */}
        <div className="p-6 pb-2 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">统计排班天数</span>
            <span className="text-xl font-black text-slate-900">{totalDays} 天</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
            <span className="text-[11px] text-rose-600 block">法定节假日天数</span>
            <span className="text-xl font-black text-rose-700">{totalHolidayDays} 天</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
            <span className="text-[11px] text-amber-700 block">常规周末天数</span>
            <span className="text-xl font-black text-amber-800">{totalWeekendDays} 天</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveRole('all')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeRole === 'all'
                ? 'border-teal-600 text-teal-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            全员名单
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('line1')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeRole === 'line1'
                ? 'border-cyan-600 text-cyan-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            一线人员
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('line2')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeRole === 'line2'
                ? 'border-indigo-600 text-indigo-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            二线人员
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('leader')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeRole === 'leader'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            带班领导
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto grow">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">姓名</th>
                  <th className="py-2.5 px-3">职责分类</th>
                  <th className="py-2.5 px-3 text-center">总值班次数</th>
                  <th className="py-2.5 px-3 text-center">工作日</th>
                  <th className="py-2.5 px-3 text-center">常规周末</th>
                  <th className="py-2.5 px-3 text-center">节假日 (加权)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {statsList.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-black text-slate-900">{item.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.role === 'line1'
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : item.role === 'line2'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.role === 'line1'
                          ? '一线'
                          : item.role === 'line2'
                          ? '二线'
                          : '院领导'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {item.totalShifts} 次
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {item.weekdayShifts}
                    </td>
                    <td className="py-2.5 px-3 text-center text-amber-700 font-semibold">
                      {item.weekendShifts}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.holidayShifts > 0 ? (
                        <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                          {item.holidayShifts} 次
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
