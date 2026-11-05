import React from 'react';
import {
  CalendarDays,
  FileSpreadsheet,
  Users,
  Repeat,
  BarChart3,
  Sparkles,
  PhoneCall,
  Menu,
  X,
  RotateCcw,
  LogIn,
  LogOut,
} from 'lucide-react';
import { HospitalConfig } from '../types';

interface HeaderProps {
  config: HospitalConfig;
  onOpenAutoSchedule: () => void;
  onOpenStaffModal: () => void;
  onOpenExportModal: () => void;
  onOpenStatsModal: () => void;
  onOpenSwapModal: () => void;
  onResetData: () => void;
  activeTab: 'table' | 'mobile_list' | 'calendar';
  onChangeTab: (tab: 'table' | 'mobile_list' | 'calendar') => void;
  canEdit: boolean;
  needsAuth: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenAutoSchedule,
  onOpenStaffModal,
  onOpenExportModal,
  onOpenStatsModal,
  onOpenSwapModal,
  onResetData,
  activeTab,
  onChangeTab,
  canEdit,
  needsAuth,
  onLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hospital Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v16m-8-8h16" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                  {config.hospitalName}
                  <span className="ml-1 text-teal-700 bg-teal-50 text-xs px-2 py-0.5 rounded-full border border-teal-200">
                    {config.campusName}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">总值班工作人员安排及管理系统</p>
            </div>
          </div>

          {/* Desktop Navigation / View switcher */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeTab('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              医院原版周表格
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              月历大卡片
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('mobile_list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'mobile_list'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              逐日列表
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenAutoSchedule}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              自动排班
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              导出Excel
            </button>

            <button
              type="button"
              onClick={onOpenSwapModal}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Repeat className="w-3.5 h-3.5 mr-1 text-slate-500" />
              调班换班
            </button>

            <button
              type="button"
              onClick={onOpenStaffModal}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
              人员库
            </button>

            <button
              type="button"
              onClick={onOpenStatsModal}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
              均衡统计
            </button>

            <button
              type="button"
              onClick={onResetData}
              title="重置为默认10月排班表"
              aria-label="重置为默认10月排班表"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {needsAuth &&
              (canEdit ? (
                <button
                  type="button"
                  onClick={onLogout}
                  title="退出登录"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  退出
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  title="登录后可编辑"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  登录
                </button>
              ))}
          </div>

          {/* Mobile Right Quick Action & Hamburger */}
          <div className="flex items-center space-x-2 lg:hidden">
            {needsAuth &&
              (canEdit ? (
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="退出登录"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  aria-label="登录"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              ))}
            <button
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              导出
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="打开功能菜单"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => {
                onChangeTab('mobile_list');
                setMobileMenuOpen(false);
              }}
              className={`py-1.5 text-xs font-medium rounded-lg text-center ${
                activeTab === 'mobile_list' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              手机日历卡
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeTab('table');
                setMobileMenuOpen(false);
              }}
              className={`py-1.5 text-xs font-medium rounded-lg text-center ${
                activeTab === 'table' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              周网格大表
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeTab('calendar');
                setMobileMenuOpen(false);
              }}
              className={`py-1.5 text-xs font-medium rounded-lg text-center ${
                activeTab === 'calendar' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              月历大卡片
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenAutoSchedule();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              智能自动排班
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenExportModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              按时间段导出
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenSwapModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <Repeat className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              申请调班换班
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenStaffModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              一线/二线名册
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenStatsModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              值班工作量统计
            </button>
            <button
              type="button"
              onClick={() => {
                onResetData();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              恢复原版排班
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
