import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDateRange,
  getChineseDayOfWeek,
  formatMonthDay,
  generateSchedule,
  calculateStaffWorkload,
  swapShifts,
  replaceDutyPerson,
  computeContinuationStart,
} from './scheduler';
import { StaffMember } from '../types';

const mockLine1: StaffMember[] = [
  { id: '1', name: '李怡林', role: 'line1', isActive: true, order: 1 },
  { id: '2', name: '唐红权', role: 'line1', isActive: true, order: 2 },
  { id: '3', name: '盛凯', role: 'line1', isActive: true, order: 3 },
  { id: '4', name: '吴金亭', role: 'line1', isActive: true, order: 4 },
  { id: '5', name: '曾杰', role: 'line1', isActive: true, order: 5 },
  { id: '6', name: '杨薇薇', role: 'line1', isActive: true, order: 6 },
  { id: '7', name: '胡婧', role: 'line1', isActive: true, order: 7 },
  { id: '8', name: '赵鹏', role: 'line1', isActive: true, order: 8 },
];

const mockLine2: StaffMember[] = [
  { id: 'l2-1', name: '刘祯帆', role: 'line2', isActive: true, order: 1 },
  { id: 'l2-2', name: '邵爽', role: 'line2', isActive: true, order: 2 },
  { id: 'l2-3', name: '马丽莉', role: 'line2', isActive: true, order: 3 },
  { id: 'l2-4', name: '张真', role: 'line2', isActive: true, order: 4 },
  { id: 'l2-5', name: '刘威麟', role: 'line2', isActive: true, order: 5 },
  { id: 'l2-6', name: '王彦鑫', role: 'line2', isActive: true, order: 6 },
];

const mockLeaders: StaffMember[] = [
  { id: 'ld-1', name: '蒋帅', role: 'leader', phone: '15984913810', isActive: true, order: 1 },
  { id: 'ld-2', name: '尹翰林', role: 'leader', phone: '13778436997', isActive: true, order: 2 },
  { id: 'ld-3', name: '谭桃', role: 'leader', phone: '13890296682', isActive: true, order: 3 },
  { id: 'ld-4', name: '姚华', role: 'leader', phone: '18783868080', isActive: true, order: 4 },
  { id: 'ld-5', name: '巫奇', role: 'leader', phone: '13708102288', isActive: true, order: 5 },
];

test('getDateRange generates correct sequence of dates', () => {
  const dates = getDateRange('2026-10-01', '2026-10-05');
  assert.equal(dates.length, 5);
  assert.equal(dates[0], '2026-10-01');
  assert.equal(dates[4], '2026-10-05');
});

test('formatMonthDay formats date into Chinese representation', () => {
  assert.equal(formatMonthDay('2026-10-01'), '10月1日');
  assert.equal(formatMonthDay('2026-10-15'), '10月15日');
});

test('generateSchedule generates correct rotation pattern matching hospital requirements', () => {
  const holidayRules: Record<string, string> = {
    '2026-10-01': '国庆1',
    '2026-10-02': '国庆2',
    '2026-10-03': '国庆3',
    '2026-10-04': '国庆4',
    '2026-10-05': '国庆5',
    '2026-10-06': '国庆6',
    '2026-10-07': '国庆7',
  };

  const shifts = generateSchedule({
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
    holidayRules,
  });

  assert.equal(shifts.length, 10);

  // Day 1 (10/1): 李怡林, 刘祯帆, 蒋帅, 国庆1
  assert.equal(shifts[0].line1.name, '李怡林');
  assert.equal(shifts[0].line2.name, '刘祯帆');
  assert.equal(shifts[0].leader.name, '蒋帅');
  assert.equal(shifts[0].holidayLabel, '国庆1');
  assert.equal(shifts[0].isHoliday, true);

  // Day 2 (10/2): 唐红权, 邵爽, 尹翰林, 国庆2
  assert.equal(shifts[1].line1.name, '唐红权');
  assert.equal(shifts[1].line2.name, '邵爽');
  assert.equal(shifts[1].leader.name, '尹翰林');

  // Day 6 (10/6): line 2 wraps to 6th (王彦鑫), leader wraps mod 5 back to 蒋帅
  assert.equal(shifts[5].line2.name, '王彦鑫');
  assert.equal(shifts[5].leader.name, '蒋帅');

  // Day 7 (10/7): line 2 wraps mod 6 back to 刘祯帆, leader is 尹翰林
  assert.equal(shifts[6].line2.name, '刘祯帆');
  assert.equal(shifts[6].leader.name, '尹翰林');
});

test('generateSchedule 支持轮换周期：一线3天一轮', () => {
  const shifts = generateSchedule({
    startDate: '2026-11-01',
    endDate: '2026-11-07',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
    line1CycleDays: 3, // 一线三天一轮
    line2CycleDays: 1, // 二线仍每天换
  });

  // 一线：前3天同一人，第4天换下一位
  assert.equal(shifts[0].line1.name, '李怡林');
  assert.equal(shifts[1].line1.name, '李怡林');
  assert.equal(shifts[2].line1.name, '李怡林');
  assert.equal(shifts[3].line1.name, '唐红权');
  assert.equal(shifts[4].line1.name, '唐红权');

  // 二线仍每天换
  assert.equal(shifts[0].line2.name, '刘祯帆');
  assert.equal(shifts[1].line2.name, '邵爽');
  assert.equal(shifts[2].line2.name, '马丽莉');
});

test('computeContinuationStart 接续上月：返回下一位的起始索引', () => {
  // 先排 10 月 1-31，再算 11 月应从谁开始
  const october = generateSchedule({
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
  });

  const start = computeContinuationStart(
    october,
    '2026-11-01',
    mockLine1,
    mockLine2,
    mockLeaders
  );

  // 10/31 是第31天(索引30)：line1 索引 30 % 8 = 6(胡婧)，下一位应是索引 7
  const activeLine1 = mockLine1.filter((s) => s.isActive);
  assert.equal(activeLine1[start.line1StartIndex].name, activeLine1[(6 + 1) % activeLine1.length].name);
  // 用接续起点排 11 月第一天，应等于“10/31 的下一个人”
  const november = generateSchedule({
    startDate: '2026-11-01',
    endDate: '2026-11-01',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
    line1StartIndex: start.line1StartIndex,
    line2StartIndex: start.line2StartIndex,
    leaderStartIndex: start.leaderStartIndex,
  });
  // 11/1 的一线 != 10/31 的一线（确实换了人），且是名单里的下一位
  assert.notEqual(november[0].line1.name, october[october.length - 1].line1.name);
});

test('swapShifts correctly swaps personnel between two dates', () => {
  const shifts = generateSchedule({
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
  });

  assert.equal(shifts[0].line1.name, '李怡林');
  assert.equal(shifts[1].line1.name, '唐红权');

  const swapped = swapShifts(shifts, '2026-10-01', '2026-10-02', 'line1');
  assert.equal(swapped[0].line1.name, '唐红权');
  assert.equal(swapped[1].line1.name, '李怡林');
  assert.equal(swapped[0].isCustomModified, true);
});

test('replaceDutyPerson replaces target person on given date', () => {
  const shifts = generateSchedule({
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
  });

  const replacement: StaffMember = { id: 'rep-1', name: '梁楚阳', role: 'line1', isActive: true, order: 99 };
  const updated = replaceDutyPerson(shifts, '2026-10-01', 'line1', replacement);

  assert.equal(updated[0].line1.name, '梁楚阳');
  assert.equal(updated[0].isCustomModified, true);
});

test('calculateStaffWorkload aggregates totals and categories accurately', () => {
  const shifts = generateSchedule({
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    line1Staff: mockLine1,
    line2Staff: mockLine2,
    leaderStaff: mockLeaders,
  });

  const stats = calculateStaffWorkload([...mockLine1, ...mockLine2, ...mockLeaders], shifts);

  // Line 2 has 6 people over 10 days, first person gets 2 shifts, etc.
  assert.equal(stats['刘祯帆'].totalShifts, 2);
  assert.equal(stats['蒋帅'].totalShifts, 2);
});
