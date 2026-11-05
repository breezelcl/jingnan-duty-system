import {
  INITIAL_LINE1_STAFF,
  INITIAL_LINE2_STAFF,
  INITIAL_LEADER_STAFF,
  INITIAL_SHIFTS,
} from '../src/data/initialData';
import { writeFileSync } from 'node:fs';

function sqlJson(obj: unknown): string {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const rows: Array<[string, unknown]> = [
  ['shifts', INITIAL_SHIFTS],
  ['line1', INITIAL_LINE1_STAFF],
  ['line2', INITIAL_LINE2_STAFF],
  ['leaders', INITIAL_LEADER_STAFF],
];

const values = rows
  .map(([key, data]) => `  ('${key}', ${sqlJson(data)}, now())`)
  .join(',\n');

const sql = `-- 初始排班与人员数据（由 scripts/genSeed.mts 自动生成，请勿手改）
-- 用法：在 Supabase 控制台 > SQL Editor 里整段粘贴运行。
-- 重复运行安全：会覆盖同 key 的数据（on conflict do update）。

insert into public.app_state (key, data, updated_at) values
${values}
on conflict (key) do update
  set data = excluded.data,
      updated_at = excluded.updated_at;
`;

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql, 'utf8');
console.log('已生成 supabase/seed.sql，排班条数:', INITIAL_SHIFTS.length);
