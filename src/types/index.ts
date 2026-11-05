export type RoleType = 'line1' | 'line2' | 'leader';

export interface StaffMember {
  id: string;
  name: string;
  role: RoleType;
  phone?: string;
  department?: string;
  isActive: boolean;
  order: number;
  leaveDates?: string[]; // YYYY-MM-DD
}

export interface DutyShift {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 周一 to 周日
  holidayLabel?: string; // e.g. '国庆1', '国庆2'
  isHoliday?: boolean;
  isWeekend?: boolean;
  line1: StaffMember;
  line2: StaffMember;
  leader: StaffMember;
  remarks?: string;
  isCustomModified?: boolean;
}

export interface HospitalConfig {
  hospitalName: string;
  campusName: string;
  sheetTitle: string;
  dutySystem: string;
  noticeText: string;
  emergencyPhone: string;
  emergencyPhoneDesc: string;
}

export interface GenerateScheduleOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaderStaff: StaffMember[];
  line1StartIndex?: number;
  line2StartIndex?: number;
  leaderStartIndex?: number;
  // 轮换周期：每隔多少天换一个人（1=每天换，3=三天一轮，7=一周一轮）。默认 1。
  line1CycleDays?: number;
  line2CycleDays?: number;
  leaderCycleDays?: number;
  holidayRules?: Record<string, string>; // date -> holidayLabel
  remarksTemplate?: string;
}

export interface StaffWorkloadStats {
  staffId: string;
  name: string;
  role: RoleType;
  totalShifts: number;
  weekendShifts: number;
  holidayShifts: number;
  weekdayShifts: number;
  dates: string[];
}
