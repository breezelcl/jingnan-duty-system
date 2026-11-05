import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * 登录状态管理。
 * - 未配置 Supabase 时，视为"始终可写"（纯 localStorage 模式，无需登录）。
 * - 配置了 Supabase 时，用邮箱密码登录；登录后才允许写入。
 */
export function useAuth() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState<boolean>(isSupabaseConfigured);

  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: '未配置 Supabase' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // 未接数据库时默认可编辑；接了数据库则需登录
  const canEdit = !isSupabaseConfigured || Boolean(session);

  return {
    session,
    user: session?.user ?? null,
    loading,
    canEdit,
    needsAuth: isSupabaseConfigured,
    signIn,
    signOut,
  };
}
