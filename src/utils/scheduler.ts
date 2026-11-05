import {
  DutyShift,
  GenerateScheduleOptions,
  RoleType,
  StaffMember,
  StaffWorkloadStats,
} from '../types';

/**
 * 返回本地时区“今天”的 YYYY-MM-DD 字符串。
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns Chinese day of week string: 周一, 周二, ..., 周日
 */
export function getChineseDayOfWeek(dateStr: string): string {
  // Use T12:00:00 to avoid timezone edge issues
  const date = new Date(`${dateStr}T12:00:00`);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * Formats YYYY-MM-DD into M月D日 (e.g., 10月1日)
 */
export function formatMonthDay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${month}月${day}日`;
  }
  return dateStr;
}

/**
 * Check if a date string is weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Generates an array of date strings between startDate and endDate inclusive (YYYY-MM-DD)
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  if (start > end) return [];

  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * 接续排班：在已有排班中，找到开始日期之前的最后一天，
 * 返回它的下一班应该是谁（各角色在各自名单里的起始索引）。
 * 用于“11月接着10月继续排”。找不到则返回全 0（从头开始）。
 */
export function computeContinuationStart(
  existingShifts: DutyShift[],
  startDate: string,
  line1Staff: StaffMember[],
  line2Staff: StaffMember[],
  leaderStaff: StaffMember[]
): { line1StartIndex: number; line2StartIndex: number; leaderStartIndex: number } {
  const fallback = { line1StartIndex: 0, line2StartIndex: 0, leaderStartIndex: 0 };

  // 取开始日期之前的、日期最大的那一天
  const prior = existingShifts
    .filter((s) => s.date < startDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!prior) return fallback;

  const activeLine1 = line1Staff.filter((s) => s.isActive);
  const activeLine2 = line2Staff.filter((s) => s.isActive);
  const activeLeaders = leaderStaff.filter((s) => s.isActive);

  // 找到“上一天那个人”在名单里的位置，起点 = 下一个人
  const nextIndex = (list: StaffMember[], name: string): number => {
    const i = list.findIndex((s) => s.name === name);
    if (i < 0 || list.length === 0) return 0;
    return (i + 1) % list.length;
  };

  return {
    line1StartIndex: nextIndex(activeLine1, prior.line1.name),
    line2StartIndex: nextIndex(activeLine2, prior.line2.name),
    leaderStartIndex: nextIndex(activeLeaders, prior.leader.name),
  };
}

/**
 * Core auto-scheduling engine for hospital duty roster.
 * Rotates Line 1, Line 2, and Leaders deterministically according to their active ordered lists.
 * Supports start index offsets and holiday mappings.
 */
export function generateSchedule(options: GenerateScheduleOptions): DutyShift[] {
  const {
    startDate,
    endDate,
    line1Staff,
    line2Staff,
    leaderStaff,
    line1StartIndex = 0,
    line2StartIndex = 0,
    leaderStartIndex = 0,
    line1CycleDays = 1,
    line2CycleDays = 1,
    leaderCycleDays = 1,
    holidayRules = {},
    remarksTemplate,
  } = options;

  const dates = getDateRange(startDate, endDate);
  const activeLine1 = line1Staff.filter((s) => s.isActive);
  const activeLine2 = line2Staff.filter((s) => s.isActive);
  const activeLeaders = leaderStaff.filter((s) => s.isActive);

  if (activeLine1.length === 0 || activeLine2.length === 0 || activeLeaders.length === 0) {
    throw new Error('一线、二线及值班领导列表中均须至少有1位可用人员。');
  }

  // 轮换周期至少为 1 天
  const cycle1 = Math.max(1, Math.floor(line1CycleDays));
  const cycle2 = Math.max(1, Math.floor(line2CycleDays));
  const cycleL = Math.max(1, Math.floor(leaderCycleDays));

  const shifts: DutyShift[] = [];

  const start1 = line1StartIndex % activeLine1.length;
  const start2 = line2StartIndex % activeLine2.length;
  const startL = leaderStartIndex % activeLeaders.length;

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const dayOfWeek = getChineseDayOfWeek(dateStr);
    const holidayLabel = holidayRules[dateStr] || undefined;
    const isHolidayDay = Boolean(holidayLabel);
    const isWeekendDay = isWeekend(dateStr);

    // 按各自周期推进：第 i 天属于第 floor(i / cycle) 轮，再对人数取模
    const idx1 = (start1 + Math.floor(i / cycle1)) % activeLine1.length;
    const idx2 = (start2 + Math.floor(i / cycle2)) % activeLine2.length;
    const idxL = (startL + Math.floor(i / cycleL)) % activeLeaders.length;

    const staff1 = activeLine1[idx1];
    const staff2 = activeLine2[idx2];
    const leader = activeLeaders[idxL];

    shifts.push({
      id: `shift-${dateStr}`,
      date: dateStr,
      dayOfWeek,
      holidayLabel,
      isHoliday: isHolidayDay,
      isWeekend: isWeekendDay,
      line1: { ...staff1 },
      line2: { ...staff2 },
      leader: { ...leader },
      remarks: remarksTemplate,
      isCustomModified: false,
    });
  }

  return shifts;
}

/**
 * Calculate workload and fairness statistics for each staff member across shifts
 */
export function calculateStaffWorkload(
  allStaff: StaffMember[],
  shifts: DutyShift[]
): Record<string, StaffWorkloadStats> {
  const statsMap: Record<string, StaffWorkloadStats> = {};

  for (const staff of allStaff) {
    statsMap[staff.name] = {
      staffId: staff.id,
      name: staff.name,
      role: staff.role,
      totalShifts: 0,
      weekendShifts: 0,
      holidayShifts: 0,
      weekdayShifts: 0,
      dates: [],
    };
  }

  for (const shift of shifts) {
    const participants: { name: string; role: RoleType }[] = [
      { name: shift.line1.name, role: 'line1' },
      { name: shift.line2.name, role: 'line2' },
      { name: shift.leader.name, role: 'leader' },
    ];

    for (const p of participants) {
      if (!statsMap[p.name]) {
        statsMap[p.name] = {
          staffId: `staff-${p.name}`,
          name: p.name,
          role: p.role,
          totalShifts: 0,
          weekendShifts: 0,
          holidayShifts: 0,
          weekdayShifts: 0,
          dates: [],
        };
      }
      const item = statsMap[p.name];
      item.totalShifts += 1;
      item.dates.push(shift.date);
      if (shift.isHoliday) {
        item.holidayShifts += 1;
      } else if (shift.isWeekend) {
        item.weekendShifts += 1;
      } else {
        item.weekdayShifts += 1;
      }
    }
  }

  return statsMap;
}

/**
 * Swaps duty person between two dates or within same date for a given role
 */
export function swapShifts(
  shifts: DutyShift[],
  date1: string,
  date2: string,
  role: RoleType
): DutyShift[] {
  const shift1Index = shifts.findIndex((s) => s.date === date1);
  const shift2Index = shifts.findIndex((s) => s.date === date2);

  if (shift1Index === -1 || shift2Index === -1) {
    return shifts;
  }

  const newShifts = [...shifts];
  const s1 = { ...newShifts[shift1Index] };
  const s2 = { ...newShifts[shift2Index] };

  if (role === 'line1') {
    const temp = s1.line1;
    s1.line1 = s2.line1;
    s2.line1 = temp;
  } else if (role === 'line2') {
    const temp = s1.line2;
    s1.line2 = s2.line2;
    s2.line2 = temp;
  } else if (role === 'leader') {
    const temp = s1.leader;
    s1.leader = s2.leader;
    s2.leader = temp;
  }

  s1.isCustomModified = true;
  s2.isCustomModified = true;

  newShifts[shift1Index] = s1;
  newShifts[shift2Index] = s2;

  return newShifts;
}

/**
 * Directly replace a person on a specific date and role
 */
export function replaceDutyPerson(
  shifts: DutyShift[],
  date: string,
  role: RoleType,
  newPerson: StaffMember
): DutyShift[] {
  return shifts.map((shift) => {
    if (shift.date !== date) return shift;
    const updated = { ...shift, isCustomModified: true };
    if (role === 'line1') updated.line1 = { ...newPerson };
    if (role === 'line2') updated.line2 = { ...newPerson };
    if (role === 'leader') updated.leader = { ...newPerson };
    return updated;
  });
}
