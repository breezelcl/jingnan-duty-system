import test from 'node:test';
import assert from 'node:assert/strict';
import { filterShiftsByDateRange } from './excelExport';
import { DutyShift } from '../types';

const mockShifts: DutyShift[] = [
  {
    id: 's-1',
    date: '2026-10-01',
    dayOfWeek: '周四',
    line1: { id: '1', name: '李怡林', role: 'line1', isActive: true, order: 1 },
    line2: { id: '2', name: '刘祯帆', role: 'line2', isActive: true, order: 1 },
    leader: { id: '3', name: '蒋帅', role: 'leader', isActive: true, order: 1 },
  },
  {
    id: 's-2',
    date: '2026-10-05',
    dayOfWeek: '周一',
    line1: { id: '1', name: '曾杰', role: 'line1', isActive: true, order: 5 },
    line2: { id: '2', name: '刘威麟', role: 'line2', isActive: true, order: 5 },
    leader: { id: '3', name: '巫奇', role: 'leader', isActive: true, order: 5 },
  },
  {
    id: 's-3',
    date: '2026-10-15',
    dayOfWeek: '周四',
    line1: { id: '1', name: '冷晓冬', role: 'line1', isActive: true, order: 15 },
    line2: { id: '2', name: '马丽莉', role: 'line2', isActive: true, order: 3 },
    leader: { id: '3', name: '巫奇', role: 'leader', isActive: true, order: 5 },
  },
];

test('filterShiftsByDateRange correctly filters within bounds', () => {
  const filtered = filterShiftsByDateRange(mockShifts, '2026-10-01', '2026-10-07');
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].date, '2026-10-01');
  assert.equal(filtered[1].date, '2026-10-05');
});

test('filterShiftsByDateRange with single boundary', () => {
  const filtered = filterShiftsByDateRange(mockShifts, '2026-10-06');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].date, '2026-10-15');
});
