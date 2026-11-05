-- ============================================================
-- 迁移：排班改为「按天存储」，历史永久累积，不再整份覆盖
-- 在 Supabase 控制台 > SQL Editor 里整段粘贴运行。可重复运行。
-- ============================================================

-- 1. 新表：每天一行
create table if not exists public.duty_shifts (
  date       text primary key,          -- YYYY-MM-DD
  data       jsonb not null,            -- 当天排班详情（DutyShift 对象）
  updated_at timestamptz not null default now()
);

-- 2. RLS：匿名可读，登录可写
alter table public.duty_shifts enable row level security;

drop policy if exists "shifts anyone read" on public.duty_shifts;
create policy "shifts anyone read"
  on public.duty_shifts for select
  to anon, authenticated using (true);

drop policy if exists "shifts auth insert" on public.duty_shifts;
create policy "shifts auth insert"
  on public.duty_shifts for insert
  to authenticated with check (true);

drop policy if exists "shifts auth update" on public.duty_shifts;
create policy "shifts auth update"
  on public.duty_shifts for update
  to authenticated using (true) with check (true);

drop policy if exists "shifts auth delete" on public.duty_shifts;
create policy "shifts auth delete"
  on public.duty_shifts for delete
  to authenticated using (true);

-- 3. 把旧的 app_state.shifts（整份数组）拆成按天的行，一条不丢。
--    jsonb_array_elements 展开数组，每个元素的 date 作主键。
--    on conflict do nothing：已存在的日期保留，不覆盖。
insert into public.duty_shifts (date, data, updated_at)
select
  elem->>'date' as date,
  elem          as data,
  now()
from public.app_state s,
     lateral jsonb_array_elements(s.data) as elem
where s.key = 'shifts'
  and elem->>'date' is not null
on conflict (date) do nothing;

-- 迁移完成后，app_state.shifts 可保留作备份，前端不再读取它。
