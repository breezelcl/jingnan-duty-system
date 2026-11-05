import React from 'react';
import {
  Sparkles,
  X,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { DutyShift, RoleType, StaffMember } from '../types';
import { formatMonthDay, generateSchedule, computeContinuationStart } from '../utils/scheduler';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchedule: (newShifts: DutyShift[]) => void;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
  existingShifts: DutyShift[];
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
  onApplySchedule,
  line1Staff,
  line2Staff,
  leaders,
  existingShifts,
}) => {
  if (!isOpen) return null;

  const [startDate, setStartDate] = React.useState('2026-11-01');
  const [endDate, setEndDate] = React.useState('2026-11-30');

  const [line1StartId, setLine1StartId] = React.useState(line1Staff[0]?.id || '');
  const [line2StartId, setLine2StartId] = React.useState(line2Staff[0]?.id || '');
  const [leaderStartId, setLeaderStartId] = React.useState(leaders[0]?.id || '');

  // 轮换周期：每隔多少天换一个人（1=每天，3=三天一轮，7=一周一轮）
  const [line1Cycle, setLine1Cycle] = React.useState(1);
  const [line2Cycle, setLine2Cycle] = React.useState(1);
  const [leaderCycle, setLeaderCycle] = React.useState(1);

  // Custom holidays map
  const [holidayRules, setHolidayRules] = React.useState<Record<string, string>>({
    '2026-11-11': '院庆周',
  });
  const [newHolidayDate, setNewHolidayDate] = React.useState('');
  const [newHolidayLabel, setNewHolidayLabel] = React.useState('');

  const [previewShifts, setPreviewShifts] = React.useState<DutyShift[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Quick preset dates
  const handlePresetNextMonth = () => {
    setStartDate('2026-11-01');
    setEndDate('2026-11-30');
  };

  const handlePresetOctober = () => {
    setStartDate('2026-10-01');
    setEndDate('2026-10-31');
    setHolidayRules({
      '2026-10-01': '国庆1',
      '2026-10-02': '国庆2',
      '2026-10-03': '国庆3',
      '2026-10-04': '国庆4',
      '2026-10-05': '国庆5',
      '2026-10-06': '国庆6',
      '2026-10-07': '国庆7',
    });
  };

  // Re-calculate preview when inputs change
  React.useEffect(() => {
    try {
      setErrorMsg(null);
      const l1Idx = Math.max(
        0,
        line1Staff.findIndex((s) => s.id === line1StartId)
      );
      const l2Idx = Math.max(
        0,
        line2Staff.findIndex((s) => s.id === line2StartId)
      );
      const ldIdx = Math.max(
        0,
        leaders.findIndex((s) => s.id === leaderStartId)
      );

      const generated = generateSchedule({
        startDate,
        endDate,
        line1Staff,
        line2Staff,
        leaderStaff: leaders,
        line1StartIndex: l1Idx,
        line2StartIndex: l2Idx,
        leaderStartIndex: ldIdx,
        line1CycleDays: line1Cycle,
        line2CycleDays: line2Cycle,
        leaderCycleDays: leaderCycle,
        holidayRules,
      });

      setPreviewShifts(generated);
    } catch (err: any) {
      setErrorMsg(err.message || '生成排班失败');
      setPreviewShifts([]);
    }
  }, [startDate, endDate, line1StartId, line2StartId, leaderStartId, line1Cycle, line2Cycle, leaderCycle, holidayRules, line1Staff, line2Staff, leaders]);

  // 接续上月排班：根据已有排班，把起始人员设成“上一天值班人的下一位”
  const handleContinuePrevious = () => {
    const { line1StartIndex, line2StartIndex, leaderStartIndex } = computeContinuationStart(
      existingShifts,
      startDate,
      line1Staff,
      line2Staff,
      leaders
    );
    const activeLine1 = line1Staff.filter((s) => s.isActive);
    const activeLine2 = line2Staff.filter((s) => s.isActive);
    const activeLeaders = leaders.filter((s) => s.isActive);
    if (activeLine1[line1StartIndex]) setLine1StartId(activeLine1[line1StartIndex].id);
    if (activeLine2[line2StartIndex]) setLine2StartId(activeLine2[line2StartIndex].id);
    if (activeLeaders[leaderStartIndex]) setLeaderStartId(activeLeaders[leaderStartIndex].id);
  };

  // 开始日期之前是否有排班（有才能“接续”）
  const hasPrior = existingShifts.some((s) => s.date < startDate);

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayLabel) return;
    setHolidayRules((prev) => ({
      ...prev,
      [newHolidayDate]: newHolidayLabel,
    }));
    setNewHolidayDate('');
    setNewHolidayLabel('');
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidayRules((prev) => {
      const copy = { ...prev };
      delete copy[date];
      return copy;
    });
  };

  const handleConfirm = () => {
    if (previewShifts.length === 0) return;
    onApplySchedule(previewShifts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="text-base font-bold">智能自动排班引擎</h3>
              <p className="text-xs text-teal-200/80">根据一线、二线、领导队列自动轮转生成排班</p>
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

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {/* Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">排班周期快速设置:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePresetNextMonth}
                className="px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
              >
                排下个月 (11月共30天)
              </button>
              <button
                type="button"
                onClick={handlePresetOctober}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                重新生成10月国庆标准表
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 轮换周期设置 */}
          <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              值班轮换周期 (每隔几天换一个人):
            </h4>
            <p className="text-[11px] text-slate-500 -mt-1">
              例如一线填 3 = 同一个人连值 3 天再换下一位；填 7 = 一周一轮。默认 1 为每天一换。
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-cyan-800 font-bold mb-1">一线周期(天)</label>
                <input
                  type="number"
                  min={1}
                  value={line1Cycle}
                  onChange={(e) => setLine1Cycle(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-indigo-800 font-bold mb-1">二线周期(天)</label>
                <input
                  type="number"
                  min={1}
                  value={line2Cycle}
                  onChange={(e) => setLine2Cycle(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-amber-800 font-bold mb-1">领导周期(天)</label>
                <input
                  type="number"
                  min={1}
                  value={leaderCycle}
                  onChange={(e) => setLeaderCycle(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[1, 3, 5, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setLine1Cycle(n);
                    setLine2Cycle(n);
                    setLeaderCycle(n);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white text-teal-700 hover:bg-teal-100 rounded-md border border-teal-200"
                >
                  全部{n === 1 ? '每天换' : `${n}天一换`}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Person Offset Pickers */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                指定第1天值班接班人员 (轮转起点):
              </h4>
              <button
                type="button"
                onClick={handleContinuePrevious}
                disabled={!hasPrior}
                title={hasPrior ? '根据已有排班，自动接着上一班排' : '开始日期之前没有排班可接续'}
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCw className="w-3 h-3 mr-1" />
                接续上月排班
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-cyan-800 font-bold mb-1">一线接班人</label>
                <select
                  value={line1StartId}
                  onChange={(e) => setLine1StartId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {line1Staff.map((staff, idx) => (
                    <option key={staff.id} value={staff.id}>
                      {idx + 1}. {staff.name} ({staff.department || '一线'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-indigo-800 font-bold mb-1">二线接班人</label>
                <select
                  value={line2StartId}
                  onChange={(e) => setLine2StartId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {line2Staff.map((staff, idx) => (
                    <option key={staff.id} value={staff.id}>
                      {idx + 1}. {staff.name} ({staff.department || '二线'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-800 font-bold mb-1">带班领导接班人</label>
                <select
                  value={leaderStartId}
                  onChange={(e) => setLeaderStartId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500"
                >
                  {leaders.map((staff, idx) => (
                    <option key={staff.id} value={staff.id}>
                      {idx + 1}. {staff.name} (院领导)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Holiday Tagging */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              法定节假日 / 特殊值班标签设定:
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <input
                type="text"
                placeholder="标签如: 元旦、春节1"
                value={newHolidayLabel}
                onChange={(e) => setNewHolidayLabel(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 grow"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                添加
              </button>
            </div>

            {Object.keys(holidayRules).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(holidayRules).map(([date, label]) => (
                  <span
                    key={date}
                    className="inline-flex items-center text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md"
                  >
                    <span>
                      {date}: {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHoliday(date)}
                      className="ml-1 text-rose-400 hover:text-rose-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                生成预览 (前 5 天示意):
              </span>
              <span className="text-xs text-teal-700 font-semibold">
                共计划生成 {previewShifts.length} 天排班
              </span>
            </div>

            {errorMsg ? (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {errorMsg}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">日期</th>
                      <th className="py-1.5 px-3">节假日</th>
                      <th className="py-1.5 px-3">一线值班</th>
                      <th className="py-1.5 px-3">二线值班</th>
                      <th className="py-1.5 px-3">值班领导</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewShifts.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-100/50">
                        <td className="py-1.5 px-3 font-medium text-slate-800">
                          {formatMonthDay(s.date)} ({s.dayOfWeek})
                        </td>
                        <td className="py-1.5 px-3">
                          {s.holidayLabel ? (
                            <span className="text-rose-600 font-bold bg-rose-100 px-1.5 py-0.2 rounded text-[10px]">
                              {s.holidayLabel}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-cyan-900">{s.line1.name}</td>
                        <td className="py-1.5 px-3 font-bold text-indigo-900">{s.line2.name}</td>
                        <td className="py-1.5 px-3 font-bold text-amber-900">{s.leader.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            应用新排班将覆盖当前排班表并自动更新统计
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={previewShifts.length === 0}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              立即应用排班
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
