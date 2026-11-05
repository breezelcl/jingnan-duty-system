import React from 'react';
import {
  FileSpreadsheet,
  X,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DutyShift, HospitalConfig, StaffMember } from '../types';
import { exportDutyScheduleToExcel, filterShiftsByDateRange } from '../utils/excelExport';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: DutyShift[];
  config: HospitalConfig;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  shifts,
  config,
  line1Staff,
  line2Staff,
  leaders,
}) => {
  if (!isOpen) return null;

  const minDate = shifts[0]?.date || '2026-10-01';
  const maxDate = shifts[shifts.length - 1]?.date || '2026-10-31';

  const [startDate, setStartDate] = React.useState<string>(minDate);
  const [endDate, setEndDate] = React.useState<string>(maxDate);
  const [formatType, setFormatType] = React.useState<'hospital_grid' | 'detailed_list'>('hospital_grid');
  const [isExporting, setIsExporting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Quick preset handlers
  const handleSelectAll = () => {
    setStartDate(minDate);
    setEndDate(maxDate);
  };

  const handleSelectNationalDay = () => {
    setStartDate('2026-10-01');
    setEndDate('2026-10-07');
  };

  const handleSelectMidMonth = () => {
    setStartDate('2026-10-08');
    setEndDate('2026-10-21');
  };

  const previewShifts = React.useMemo(() => {
    return filterShiftsByDateRange(shifts, startDate, endDate);
  }, [shifts, startDate, endDate]);

  const handleExport = () => {
    try {
      setIsExporting(true);
      exportDutyScheduleToExcel({
        shifts,
        config,
        startDate,
        endDate,
        formatType,
        line1Staff,
        line2Staff,
        leaders,
      });

      setSuccessMessage(`导出成功！共导出 ${previewShifts.length} 天值班安排。`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      alert(err.message || '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            <h3 className="text-base font-bold">按时间段导出 Excel 排班表</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              快速选择预设时间段:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-lg border border-slate-200 transition-colors"
              >
                全部排班时间
              </button>
              <button
                type="button"
                onClick={handleSelectNationalDay}
                className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                国庆假期 (1-7日)
              </button>
              <button
                type="button"
                onClick={handleSelectMidMonth}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-lg border border-slate-200 transition-colors"
              >
                月中阶段 (8-21日)
              </button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-teal-600" />
              自定义时间段 (起止日期):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">开始日期</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 mb-1 block">结束日期</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              导出表格格式:
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                  formatType === 'hospital_grid'
                    ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="formatType"
                  value="hospital_grid"
                  checked={formatType === 'hospital_grid'}
                  onChange={() => setFormatType('hospital_grid')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div className="ml-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    医院原版多周块网格格式 (推荐)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    完全还原医院传统排班表版式（7天一行网格，包含一线/二线名册及带班领导电话与备注）。
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                  formatType === 'detailed_list'
                    ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="formatType"
                  value="detailed_list"
                  checked={formatType === 'detailed_list'}
                  onChange={() => setFormatType('detailed_list')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div className="ml-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    逐日流水明细列表格式
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    标准二维数据表，适合科室归档、统计核算与Excel筛选汇总。
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Preview summary alert */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center text-slate-600">
              <Clock className="w-4 h-4 text-teal-600 mr-2 shrink-0" />
              <span>
                匹配到 <strong className="text-teal-700 font-bold">{previewShifts.length}</strong> 天排班记录
                ({startDate} ~ {endDate})
              </span>
            </div>
            {previewShifts.length > 0 && (
              <span className="text-emerald-700 bg-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                就绪
              </span>
            )}
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
              {successMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || previewShifts.length === 0}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isExporting ? '正在生成Excel...' : '确认并导出 .xlsx'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
