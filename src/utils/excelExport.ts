import * as XLSX from 'xlsx';
import { DutyShift, HospitalConfig, StaffMember } from '../types';
import { formatMonthDay } from './scheduler';

export interface ExportExcelOptions {
  shifts: DutyShift[];
  config: HospitalConfig;
  startDate?: string;
  endDate?: string;
  formatType?: 'hospital_grid' | 'detailed_list';
  line1Staff?: StaffMember[];
  line2Staff?: StaffMember[];
  leaders?: StaffMember[];
}

/**
 * Filter shifts by custom date range
 */
export function filterShiftsByDateRange(
  shifts: DutyShift[],
  startDate?: string,
  endDate?: string
): DutyShift[] {
  return shifts.filter((s) => {
    if (startDate && s.date < startDate) return false;
    if (endDate && s.date > endDate) return false;
    return true;
  });
}

/**
 * Exports duty shifts to a formatted Excel workbook and triggers browser download
 */
export function exportDutyScheduleToExcel(options: ExportExcelOptions): void {
  const {
    shifts: rawShifts,
    config,
    startDate,
    endDate,
    formatType = 'hospital_grid',
    line1Staff = [],
    line2Staff = [],
    leaders = [],
  } = options;

  const targetShifts = filterShiftsByDateRange(rawShifts, startDate, endDate);

  if (targetShifts.length === 0) {
    throw new Error('所选时间段内没有排班记录，无法导出。');
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  if (formatType === 'hospital_grid') {
    // Generate the multi-week 7-day grid format matching the hospital document
    const ws = generateHospitalGridSheet(targetShifts, config, line1Staff, line2Staff, leaders);
    XLSX.utils.book_append_sheet(wb, ws, '旌南院区总值班表');
  } else {
    // Generate detailed row-by-row table
    const ws = generateDetailedListSheet(targetShifts, config);
    XLSX.utils.book_append_sheet(wb, ws, '总值班流水清单');
  }

  // Construct filename with date range
  const startStr = targetShifts[0].date;
  const endStr = targetShifts[targetShifts.length - 1].date;
  const filename = `${config.hospitalName}${config.campusName}_总值班安排表_${startStr}_至_${endStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Generates the classic 7-days per row hospital grid layout
 */
function generateHospitalGridSheet(
  shifts: DutyShift[],
  config: HospitalConfig,
  line1Staff: StaffMember[],
  line2Staff: StaffMember[],
  leaders: StaffMember[]
): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Title rows
  rows.push([`${config.hospitalName}${config.campusName}`]);
  rows.push([config.sheetTitle]);
  rows.push([]); // blank separator

  // Group shifts into 7-day chunks
  const chunkSize = 7;
  const chunks: DutyShift[][] = [];
  for (let i = 0; i < shifts.length; i += chunkSize) {
    chunks.push(shifts.slice(i, i + chunkSize));
  }

  // Prepare side roster data for 一线 and 二线
  const sideRosterRows: { l1: string; l2: string }[] = [];
  const maxStaffLen = Math.max(line1Staff.length, line2Staff.length);
  for (let s = 0; s < maxStaffLen; s++) {
    sideRosterRows.push({
      l1: line1Staff[s]?.name || '',
      l2: line2Staff[s]?.name || '',
    });
  }

  let sideIndex = 0;

  chunks.forEach((chunk, chunkIdx) => {
    // Row 1: 节假日
    const holidayRow: (string | number)[] = ['节假日'];
    chunk.forEach((shift) => holidayRow.push(shift.holidayLabel || ''));
    // Pad to 7 days if last chunk is shorter
    while (holidayRow.length <= 7) holidayRow.push('');
    // Side columns: spacer, 一线, 二线
    holidayRow.push('');
    if (chunkIdx === 0) {
      holidayRow.push('一线', '二线');
    } else if (sideIndex < sideRosterRows.length) {
      holidayRow.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
      sideIndex++;
    }
    rows.push(holidayRow);

    // Row 2: 日期
    const dateRow: (string | number)[] = ['日期'];
    chunk.forEach((shift) => dateRow.push(formatMonthDay(shift.date)));
    while (dateRow.length <= 7) dateRow.push('');
    dateRow.push('');
    if (sideIndex < sideRosterRows.length) {
      dateRow.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
      sideIndex++;
    }
    rows.push(dateRow);

    // Row 3: 一线
    const l1Row: (string | number)[] = ['一线'];
    chunk.forEach((shift) => l1Row.push(shift.line1.name));
    while (l1Row.length <= 7) l1Row.push('');
    l1Row.push('');
    if (sideIndex < sideRosterRows.length) {
      l1Row.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
      sideIndex++;
    }
    rows.push(l1Row);

    // Row 4: 二线
    const l2Row: (string | number)[] = ['二线'];
    chunk.forEach((shift) => l2Row.push(shift.line2.name));
    while (l2Row.length <= 7) l2Row.push('');
    l2Row.push('');
    if (sideIndex < sideRosterRows.length) {
      l2Row.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
      sideIndex++;
    }
    rows.push(l2Row);

    // Row 5: 值班领导
    const ldRow: (string | number)[] = ['值班领导'];
    chunk.forEach((shift) => ldRow.push(shift.leader.name));
    while (ldRow.length <= 7) ldRow.push('');
    ldRow.push('');
    if (sideIndex < sideRosterRows.length) {
      ldRow.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
      sideIndex++;
    }
    rows.push(ldRow);

    // Blank separator row
    rows.push([]);
  });

  // Append any remaining roster rows
  while (sideIndex < sideRosterRows.length) {
    const extraRow: (string | number)[] = ['', '', '', '', '', '', '', '', ''];
    extraRow.push(sideRosterRows[sideIndex].l1, sideRosterRows[sideIndex].l2);
    rows.push(extraRow);
    sideIndex++;
  }

  // Notice & leader contact footnotes
  rows.push([]);
  rows.push([config.noticeText]);

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Row header: 节假日, 日期, 一线, 二线, 值班领导
    { wch: 12 }, // Day 1
    { wch: 12 }, // Day 2
    { wch: 12 }, // Day 3
    { wch: 12 }, // Day 4
    { wch: 12 }, // Day 5
    { wch: 12 }, // Day 6
    { wch: 12 }, // Day 7
    { wch: 4 },  // spacer
    { wch: 12 }, // 一线名册
    { wch: 12 }, // 二线名册
  ];

  return ws;
}

/**
 * Generates the clean list format
 */
function generateDetailedListSheet(
  shifts: DutyShift[],
  config: HospitalConfig
): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    [`${config.hospitalName} ${config.campusName} - ${config.sheetTitle}`],
    [
      '序号',
      '日期',
      '星期',
      '节假日说明',
      '一线值班人员',
      '一线科室',
      '二线值班人员',
      '二线科室',
      '值班院领导',
      '领导联系电话',
      '急救电话',
      '状态',
    ],
  ];

  shifts.forEach((shift, idx) => {
    rows.push([
      idx + 1,
      shift.date,
      shift.dayOfWeek,
      shift.holidayLabel || (shift.isWeekend ? '周末' : '常规工作日'),
      shift.line1.name,
      shift.line1.department || '行政科室',
      shift.line2.name,
      shift.line2.department || '管理职能部',
      shift.leader.name,
      shift.leader.phone || '—',
      config.emergencyPhone,
      shift.isCustomModified ? '已调整' : '正常排班',
    ]);
  });

  rows.push([]);
  rows.push([config.noticeText]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },  // 序号
    { wch: 14 }, // 日期
    { wch: 8 },  // 星期
    { wch: 14 }, // 节假日
    { wch: 14 }, // 一线
    { wch: 16 }, // 一线科室
    { wch: 14 }, // 二线
    { wch: 16 }, // 二线科室
    { wch: 14 }, // 领导
    { wch: 16 }, // 电话
    { wch: 16 }, // 急救
    { wch: 10 }, // 状态
  ];

  return ws;
}
