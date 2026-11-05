import { DutyShift, StaffMember } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * 排班数据的存取层。
 *
 * - 已配置 Supabase：数据存在云端的 `app_state` 表，每种数据一行（key + data JSON）。
 *   匿名用户可读，登录用户可写（由 Supabase RLS 策略控制，见 supabase/schema.sql）。
 * - 未配置 Supabase：自动回退到浏览器 localStorage（保持原有行为）。
 */

const TABLE = 'app_state';
const SHIFTS_TABLE = 'duty_shifts';

// 人员名单仍整份存在 app_state；排班改为按天存在 duty_shifts。
export type StateKey = 'line1' | 'line2' | 'leaders';

// localStorage 回退用的键
const LS_KEYS: Record<StateKey, string> = {
  line1: 'dy_hospital_l1_v1',
  line2: 'dy_hospital_l2_v1',
  leaders: 'dy_hospital_leaders_v1',
};
const LS_SHIFTS_KEY = 'dy_hospital_shifts_v1';

type DataFor<K extends StateKey> = StaffMember[];

/** 读取某一类数据。读不到返回 null（由调用方决定用默认初始数据）。 */
export async function loadState<K extends StateKey>(key: K): Promise<DataFor<K> | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('key', key)
      .maybeSingle();
    if (error) {
      console.error(`[scheduleStore] 读取 ${key} 失败:`, error.message);
      return null;
    }
    return (data?.data as DataFor<K>) ?? null;
  }

  // localStorage 回退
  try {
    const raw = localStorage.getItem(LS_KEYS[key]);
    if (raw) return JSON.parse(raw) as DataFor<K>;
  } catch {
    // ignore
  }
  return null;
}

/** 保存某一类数据（整份覆盖）。返回是否成功。 */
export async function saveState<K extends StateKey>(key: K, value: DataFor<K>): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, data: value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) {
      console.error(`[scheduleStore] 保存 ${key} 失败:`, error.message);
      return false;
    }
    return true;
  }

  // localStorage 回退
  try {
    localStorage.setItem(LS_KEYS[key], JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// 排班：按天存储（duty_shifts 表），历史永久累积
// ============================================================

/** 读取排班。不传范围则读全部；传 from/to（含）则只读该日期范围。按日期升序返回。 */
export async function loadShifts(from?: string, to?: string): Promise<DutyShift[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from(SHIFTS_TABLE).select('data').order('date', { ascending: true });
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    const { data, error } = await query;
    if (error) {
      console.error('[scheduleStore] 读取排班失败:', error.message);
      return [];
    }
    return (data ?? []).map((row) => row.data as DutyShift);
  }

  // localStorage 回退
  try {
    const raw = localStorage.getItem(LS_SHIFTS_KEY);
    let all: DutyShift[] = raw ? JSON.parse(raw) : [];
    all = all.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (from) all = all.filter((s) => s.date >= from);
    if (to) all = all.filter((s) => s.date <= to);
    return all;
  } catch {
    return [];
  }
}

/** 返回数据库中所有已排班的月份（如 ["2026-10","2026-11"]，升序去重）。 */
export async function loadShiftMonths(): Promise<string[]> {
  const all = await loadShifts();
  const months = new Set(all.map((s) => s.date.slice(0, 7)));
  return Array.from(months).sort();
}

/**
 * 批量 upsert 排班（按天）。只影响传入的那些日期，其他日期不动。
 * 返回是否成功。
 */
export async function upsertShifts(shifts: DutyShift[]): Promise<boolean> {
  if (shifts.length === 0) return true;

  if (isSupabaseConfigured && supabase) {
    const rows = shifts.map((s) => ({
      date: s.date,
      data: s,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from(SHIFTS_TABLE).upsert(rows, { onConflict: 'date' });
    if (error) {
      console.error('[scheduleStore] 保存排班失败:', error.message);
      return false;
    }
    return true;
  }

  // localStorage 回退：合并进全量数组
  try {
    const raw = localStorage.getItem(LS_SHIFTS_KEY);
    const existing: DutyShift[] = raw ? JSON.parse(raw) : [];
    const byDate = new Map(existing.map((s) => [s.date, s]));
    for (const s of shifts) byDate.set(s.date, s);
    const merged = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
    localStorage.setItem(LS_SHIFTS_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/** 加载人员名单（排班单独用 loadShifts）。 */
export async function loadRosters(): Promise<{
  line1: StaffMember[] | null;
  line2: StaffMember[] | null;
  leaders: StaffMember[] | null;
}> {
  const [line1, line2, leaders] = await Promise.all([
    loadState('line1'),
    loadState('line2'),
    loadState('leaders'),
  ]);
  return { line1, line2, leaders };
}
