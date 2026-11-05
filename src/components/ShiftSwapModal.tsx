import React from 'react';
import {
  Repeat,
  UserCheck,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { DutyShift, RoleType, StaffMember } from '../types';
import { formatMonthDay, replaceDutyPerson, swapShifts } from '../utils/scheduler';

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: DutyShift[];
  initialShift?: DutyShift | null;
  initialRole?: RoleType;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
  onApplyUpdatedShifts: (updated: DutyShift[]) => void;
}

export const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({
  isOpen,
  onClose,
  shifts,
  initialShift,
  initialRole = 'line1',
  line1Staff,
  line2Staff,
  leaders,
  onApplyUpdatedShifts,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = React.useState<'swap' | 'replace'>('swap');
  const [role, setRole] = React.useState<RoleType>(initialRole);

  const defaultDate1 = initialShift?.date || shifts[0]?.date || '2026-10-01';
  const defaultDate2 =
    shifts.find((s) => s.date !== defaultDate1)?.date || '2026-10-02';

  const [date1, setDate1] = React.useState<string>(defaultDate1);
  const [date2, setDate2] = React.useState<string>(defaultDate2);

  // For replace mode:
  const [replacementStaffId, setReplacementStaffId] = React.useState<string>('');

  const shift1 = shifts.find((s) => s.date === date1);
  const shift2 = shifts.find((s) => s.date === date2);

  const availableStaffForRole =
    role === 'line1' ? line1Staff : role === 'line2' ? line2Staff : leaders;

  const getPersonName = (shift: DutyShift | undefined, r: RoleType) => {
    if (!shift) return '—';
    if (r === 'line1') return shift.line1.name;
    if (r === 'line2') return shift.line2.name;
    return shift.leader.name;
  };

  const handleConfirmSwap = () => {
    if (mode === 'swap') {
      if (date1 === date2) {
        alert('请选择不同的两天进行调换');
        return;
      }
      const updated = swapShifts(shifts, date1, date2, role);
      onApplyUpdatedShifts(updated);
      onClose();
    } else {
      if (!replacementStaffId) {
        alert('请选择替换值班人员');
        return;
      }
      const targetStaff = availableStaffForRole.find(
        (s) => s.id === replacementStaffId
      );
      if (!targetStaff) return;

      const updated = replaceDutyPerson(shifts, date1, role, targetStaff);
      onApplyUpdatedShifts(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-indigo-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-teal-200" />
            <h3 className="text-base font-bold">值班调配与人员调换</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode switch */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('swap')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'swap'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              两日互相对调
            </button>
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'replace'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              临时顶班/单人替换
            </button>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              调换值班职级角色:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('line1')}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  role === 'line1'
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                一线人员
              </button>
              <button
                type="button"
                onClick={() => setRole('line2')}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  role === 'line2'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                二线人员
              </button>
              <button
                type="button"
                onClick={() => setRole('leader')}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  role === 'leader'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                值班院领导
              </button>
            </div>
          </div>

          {mode === 'swap' ? (
            /* Swap Mode UI */
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">日期 1</label>
                  <select
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    {shifts.map((s) => (
                      <option key={`opt1-${s.id}`} value={s.date}>
                        {formatMonthDay(s.date)} ({s.dayOfWeek}) - {getPersonName(s, role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">日期 2</label>
                  <select
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    {shifts.map((s) => (
                      <option key={`opt2-${s.id}`} value={s.date}>
                        {formatMonthDay(s.date)} ({s.dayOfWeek}) - {getPersonName(s, role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visual preview of swap */}
              <div className="pt-2 flex items-center justify-around text-center text-xs bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">{formatMonthDay(date1)}</span>
                  <span className="font-bold text-slate-900 line-through text-slate-400">
                    {getPersonName(shift1, role)}
                  </span>
                  <span className="font-black text-teal-700 block text-sm">
                    {getPersonName(shift2, role)}
                  </span>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-teal-600 animate-pulse" />
                <div>
                  <span className="text-[10px] text-slate-400 block">{formatMonthDay(date2)}</span>
                  <span className="font-bold text-slate-900 line-through text-slate-400">
                    {getPersonName(shift2, role)}
                  </span>
                  <span className="font-black text-teal-700 block text-sm">
                    {getPersonName(shift1, role)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Replace Mode UI */
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">选择值班日期</label>
                <select
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {shifts.map((s) => (
                    <option key={`rep-opt-${s.id}`} value={s.date}>
                      {formatMonthDay(s.date)} ({s.dayOfWeek}) - 原值班人: {getPersonName(s, role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">选择替班/接班人员</label>
                <select
                  value={replacementStaffId}
                  onChange={(e) => setReplacementStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                >
                  <option value="">-- 请选择人员 --</option>
                  {availableStaffForRole.map((staff) => (
                    <option key={`rep-staff-${staff.id}`} value={staff.id}>
                      {staff.name} ({staff.department || '院区科室'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
            <span>完成调换后系统将自动保存并记录修改标识。</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmSwap}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              确认调换并更新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
