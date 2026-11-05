import { DutyShift, HospitalConfig, StaffMember } from '../types';
import { getChineseDayOfWeek, isWeekend } from '../utils/scheduler';

export const INITIAL_HOSPITAL_CONFIG: HospitalConfig = {
  hospitalName: '德阳市人民医院',
  campusName: '旌南院区',
  sheetTitle: '德阳市人民医院旌南院区总值班工作人员安排表',
  dutySystem: '总值班为24小时值班制，需保持24小时电话畅通。',
  noticeText:
    '备注:总值班为24小时值班制，需保持24小时电话畅通。行政值班若遇紧急事件需立即向二线、值班领导汇报，共同协调处理。值班人员需巡视院区，注意用水、用电、设备、防火防盗等安全，次日早上交接班。带班领导电话:蒋帅15984913810，姚华18783868080，谭桃13890296682，巫奇13708102288，尹翰林13778436997；24小时急救电话:2418999(医院本部)',
  emergencyPhone: '2418999',
  emergencyPhoneDesc: '医院本部',
};

export const INITIAL_LINE1_STAFF: StaffMember[] = [
  { id: 'l1-01', name: '李怡林', role: 'line1', isActive: true, order: 1, department: '行政科' },
  { id: 'l1-02', name: '唐红权', role: 'line1', isActive: true, order: 2, department: '医务科' },
  { id: 'l1-03', name: '盛凯', role: 'line1', isActive: true, order: 3, department: '院办' },
  { id: 'l1-04', name: '吴金亭', role: 'line1', isActive: true, order: 4, department: '护理部' },
  { id: 'l1-05', name: '曾杰', role: 'line1', isActive: true, order: 5, department: '保卫科' },
  { id: 'l1-06', name: '杨薇薇', role: 'line1', isActive: true, order: 6, department: '门诊办' },
  { id: 'l1-07', name: '胡婧', role: 'line1', isActive: true, order: 7, department: '后勤保障部' },
  { id: 'l1-08', name: '赵鹏', role: 'line1', isActive: true, order: 8, department: '院感科' },
  { id: 'l1-09', name: '陈嘉慧', role: 'line1', isActive: true, order: 9, department: '质管办' },
  { id: 'l1-10', name: '向长贞', role: 'line1', isActive: true, order: 10, department: '设备科' },
  { id: 'l1-11', name: '周荧涛', role: 'line1', isActive: true, order: 11, department: '信息科' },
  { id: 'l1-12', name: '李青青', role: 'line1', isActive: true, order: 12, department: '药剂科' },
  { id: 'l1-13', name: '肖可', role: 'line1', isActive: true, order: 13, department: '医保办' },
  { id: 'l1-14', name: '吴成鹏', role: 'line1', isActive: true, order: 14, department: '财务科' },
  { id: 'l1-15', name: '冷晓冬', role: 'line1', isActive: true, order: 15, department: '人事科' },
  { id: 'l1-16', name: '崔雨露', role: 'line1', isActive: true, order: 16, department: '工会' },
  { id: 'l1-17', name: '周江', role: 'line1', isActive: true, order: 17, department: '纪检审计' },
  { id: 'l1-18', name: '王雨洋', role: 'line1', isActive: true, order: 18, department: '宣传统战部' },
  { id: 'l1-19', name: '张美琪', role: 'line1', isActive: true, order: 19, department: '团委' },
  { id: 'l1-20', name: '张帅', role: 'line1', isActive: true, order: 20, department: '科教科' },
  { id: 'l1-21', name: '俞慧', role: 'line1', isActive: true, order: 21, department: '病案科' },
  { id: 'l1-22', name: '叶小琴', role: 'line1', isActive: true, order: 22, department: '采供科' },
  { id: 'l1-23', name: '梁楚阳', role: 'line1', isActive: true, order: 23, department: '医患沟通办' },
  { id: 'l1-24', name: '梁薰月', role: 'line1', isActive: true, order: 24, department: '公共卫生科' },
];

export const INITIAL_LINE2_STAFF: StaffMember[] = [
  { id: 'l2-01', name: '刘祯帆', role: 'line2', isActive: true, order: 1, department: '医疗管理部' },
  { id: 'l2-02', name: '邵爽', role: 'line2', isActive: true, order: 2, department: '院务管理部' },
  { id: 'l2-03', name: '马丽莉', role: 'line2', isActive: true, order: 3, department: '护理管理部' },
  { id: 'l2-04', name: '张真', role: 'line2', isActive: true, order: 4, department: '后勤运行部' },
  { id: 'l2-05', name: '刘威麟', role: 'line2', isActive: true, order: 5, department: '运营保障部' },
  { id: 'l2-06', name: '王彦鑫', role: 'line2', isActive: true, order: 6, department: '安全保卫部' },
];

export const INITIAL_LEADER_STAFF: StaffMember[] = [
  { id: 'ld-01', name: '蒋帅', role: 'leader', phone: '15984913810', isActive: true, order: 1, department: '院领导班子' },
  { id: 'ld-02', name: '尹翰林', role: 'leader', phone: '13778436997', isActive: true, order: 2, department: '院领导班子' },
  { id: 'ld-03', name: '谭桃', role: 'leader', phone: '13890296682', isActive: true, order: 3, department: '院领导班子' },
  { id: 'ld-04', name: '姚华', role: 'leader', phone: '18783868080', isActive: true, order: 4, department: '院领导班子' },
  { id: 'ld-05', name: '巫奇', role: 'leader', phone: '13708102288', isActive: true, order: 5, department: '院领导班子' },
];

// Exact October schedule data from hospital prompt
const rawOctoberSchedule = [
  // Block 1 (Oct 1 - Oct 7)
  { date: '2026-10-01', holiday: '国庆1', l1: '李怡林', l2: '刘祯帆', ld: '蒋帅' },
  { date: '2026-10-02', holiday: '国庆2', l1: '唐红权', l2: '邵爽', ld: '尹翰林' },
  { date: '2026-10-03', holiday: '国庆3', l1: '盛凯', l2: '马丽莉', ld: '谭桃' },
  { date: '2026-10-04', holiday: '国庆4', l1: '吴金亭', l2: '张真', ld: '姚华' },
  { date: '2026-10-05', holiday: '国庆5', l1: '曾杰', l2: '刘威麟', ld: '巫奇' },
  { date: '2026-10-06', holiday: '国庆6', l1: '杨薇薇', l2: '王彦鑫', ld: '蒋帅' },
  { date: '2026-10-07', holiday: '国庆7', l1: '胡婧', l2: '刘祯帆', ld: '尹翰林' },

  // Block 2 (Oct 8 - Oct 14)
  { date: '2026-10-08', holiday: '', l1: '赵鹏', l2: '邵爽', ld: '谭桃' },
  { date: '2026-10-09', holiday: '', l1: '陈嘉慧', l2: '马丽莉', ld: '姚华' },
  { date: '2026-10-10', holiday: '', l1: '向长贞', l2: '张真', ld: '巫奇' },
  { date: '2026-10-11', holiday: '', l1: '周荧涛', l2: '刘威麟', ld: '蒋帅' },
  { date: '2026-10-12', holiday: '', l1: '李青青', l2: '王彦鑫', ld: '尹翰林' },
  { date: '2026-10-13', holiday: '', l1: '肖可', l2: '刘祯帆', ld: '谭桃' },
  { date: '2026-10-14', holiday: '', l1: '吴成鹏', l2: '邵爽', ld: '姚华' },

  // Block 3 (Oct 15 - Oct 21)
  { date: '2026-10-15', holiday: '', l1: '冷晓冬', l2: '马丽莉', ld: '巫奇' },
  { date: '2026-10-16', holiday: '', l1: '崔雨露', l2: '张真', ld: '蒋帅' },
  { date: '2026-10-17', holiday: '', l1: '周江', l2: '刘威麟', ld: '尹翰林' },
  { date: '2026-10-18', holiday: '', l1: '王雨洋', l2: '王彦鑫', ld: '谭桃' },
  { date: '2026-10-19', holiday: '', l1: '张美琪', l2: '刘祯帆', ld: '姚华' },
  { date: '2026-10-20', holiday: '', l1: '张帅', l2: '邵爽', ld: '巫奇' },
  { date: '2026-10-21', holiday: '', l1: '俞慧', l2: '马丽莉', ld: '蒋帅' },

  // Block 4 (Oct 22 - Oct 28)
  { date: '2026-10-22', holiday: '', l1: '叶小琴', l2: '张真', ld: '尹翰林' },
  { date: '2026-10-23', holiday: '', l1: '李怡林', l2: '刘威麟', ld: '谭桃' },
  { date: '2026-10-24', holiday: '', l1: '唐红权', l2: '王彦鑫', ld: '姚华' },
  { date: '2026-10-25', holiday: '', l1: '盛凯', l2: '刘祯帆', ld: '巫奇' },
  { date: '2026-10-26', holiday: '', l1: '吴金亭', l2: '邵爽', ld: '蒋帅' },
  { date: '2026-10-27', holiday: '', l1: '曾杰', l2: '马丽莉', ld: '尹翰林' },
  { date: '2026-10-28', holiday: '', l1: '杨薇薇', l2: '张真', ld: '谭桃' },

  // Block 5 (Oct 29 - Oct 31)
  { date: '2026-10-29', holiday: '', l1: '胡婧', l2: '刘威麟', ld: '姚华' },
  { date: '2026-10-30', holiday: '', l1: '赵鹏', l2: '王彦鑫', ld: '巫奇' },
  { date: '2026-10-31', holiday: '', l1: '陈嘉慧', l2: '刘祯帆', ld: '蒋帅' },
];

export const INITIAL_SHIFTS: DutyShift[] = rawOctoberSchedule.map((item) => {
  const l1 = INITIAL_LINE1_STAFF.find((s) => s.name === item.l1) || {
    id: `l1-${item.l1}`,
    name: item.l1,
    role: 'line1',
    isActive: true,
    order: 99,
  };
  const l2 = INITIAL_LINE2_STAFF.find((s) => s.name === item.l2) || {
    id: `l2-${item.l2}`,
    name: item.l2,
    role: 'line2',
    isActive: true,
    order: 99,
  };
  const ld = INITIAL_LEADER_STAFF.find((s) => s.name === item.ld) || {
    id: `ld-${item.ld}`,
    name: item.ld,
    role: 'leader',
    isActive: true,
    order: 99,
  };

  return {
    id: `shift-${item.date}`,
    date: item.date,
    dayOfWeek: getChineseDayOfWeek(item.date),
    holidayLabel: item.holiday || undefined,
    isHoliday: Boolean(item.holiday),
    isWeekend: isWeekend(item.date),
    line1: l1,
    line2: l2,
    leader: ld,
    isCustomModified: false,
  };
});
