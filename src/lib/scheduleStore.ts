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

export type StateKey = 'shifts' | 'line1' | 'line2' | 'leaders';

// localStorage 回退用的键（与原 App.tsx 保持一致）
const LS_KEYS: Record<StateKey, string> = {
  shifts: 'dy_hospital_shifts_v1',
  line1: 'dy_hospital_l1_v1',
  line2: 'dy_hospital_l2_v1',
  leaders: 'dy_hospital_leaders_v1',
};

type DataFor<K extends StateKey> = K extends 'shifts' ? DutyShift[] : StaffMember[];

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

/** 一次性加载全部数据。 */
export async function loadAll(): Promise<{
  shifts: DutyShift[] | null;
  line1: StaffMember[] | null;
  line2: StaffMember[] | null;
  leaders: StaffMember[] | null;
}> {
  const [shifts, line1, line2, leaders] = await Promise.all([
    loadState('shifts'),
    loadState('line1'),
    loadState('line2'),
    loadState('leaders'),
  ]);
  return { shifts, line1, line2, leaders };
}
