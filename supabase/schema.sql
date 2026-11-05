-- ============================================================
-- 旌南院区总值班系统 —— Supabase 数据库初始化脚本
-- 在 Supabase 控制台 > SQL Editor 里，整段粘贴后点 Run 执行。
-- ============================================================

-- 1. 建表：每种数据存一行（key 作主键，data 存 JSON）
create table if not exists public.app_state (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. 开启行级安全（RLS）
alter table public.app_state enable row level security;

-- 3. 策略：任何人（含匿名）可读
drop policy if exists "anyone can read" on public.app_state;
create policy "anyone can read"
  on public.app_state
  for select
  to anon, authenticated
  using (true);

-- 4. 策略：仅登录用户可写（插入 / 更新 / 删除）
drop policy if exists "authenticated can insert" on public.app_state;
create policy "authenticated can insert"
  on public.app_state
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update" on public.app_state;
create policy "authenticated can update"
  on public.app_state
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete" on public.app_state;
create policy "authenticated can delete"
  on public.app_state
  for delete
  to authenticated
  using (true);

-- ============================================================
-- 创建管理员账号：
-- 控制台 > Authentication > Users > Add user，
-- 填邮箱和密码，勾选 "Auto Confirm User"。
-- 用这个账号在应用里登录即可编辑。
-- ============================================================
