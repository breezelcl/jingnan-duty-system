import React from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Phone,
  Building,
  CheckCircle2,
  Shield,
  Edit2,
} from 'lucide-react';
import { RoleType, StaffMember } from '../types';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  line1Staff: StaffMember[];
  line2Staff: StaffMember[];
  leaders: StaffMember[];
  onUpdateRosters: (
    l1: StaffMember[],
    l2: StaffMember[],
    ld: StaffMember[]
  ) => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  line1Staff,
  line2Staff,
  leaders,
  onUpdateRosters,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = React.useState<RoleType>('line1');
  const [localL1, setLocalL1] = React.useState<StaffMember[]>([...line1Staff]);
  const [localL2, setLocalL2] = React.useState<StaffMember[]>([...line2Staff]);
  const [localLd, setLocalLd] = React.useState<StaffMember[]>([...leaders]);

  // Form states for adding new staff
  const [newName, setNewName] = React.useState('');
  const [newDept, setNewDept] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');

  const currentList =
    activeTab === 'line1'
      ? localL1
      : activeTab === 'line2'
      ? localL2
      : localLd;

  const setCurrentList = (newList: StaffMember[]) => {
    if (activeTab === 'line1') setLocalL1(newList);
    else if (activeTab === 'line2') setLocalL2(newList);
    else setLocalLd(newList);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...currentList];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setCurrentList(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index >= currentList.length - 1) return;
    const copy = [...currentList];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setCurrentList(copy);
  };

  const handleToggleActive = (id: string) => {
    const updated = currentList.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setCurrentList(updated);
  };

  const handleDelete = (id: string) => {
    if (currentList.length <= 1) {
      alert('请至少保留一位值班人员');
      return;
    }
    const updated = currentList.filter((item) => item.id !== id);
    setCurrentList(updated);
  };

  const handleAddStaff = () => {
    if (!newName.trim()) return;
    const newMember: StaffMember = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      department: newDept.trim() || undefined,
      phone: newPhone.trim() || undefined,
      role: activeTab,
      isActive: true,
      order: currentList.length + 1,
    };

    setCurrentList([...currentList, newMember]);
    setNewName('');
    setNewDept('');
    setNewPhone('');
  };

  const handleSaveAll = () => {
    onUpdateRosters(localL1, localL2, localLd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="text-base font-bold">医院行政总值班人员库管理</h3>
              <p className="text-xs text-teal-200/80">维护一线、二线及带班领导名册与轮转次序</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('line1')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
              activeTab === 'line1'
                ? 'border-cyan-600 text-cyan-800 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            一线人员 ({localL1.length}人)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('line2')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
              activeTab === 'line2'
                ? 'border-indigo-600 text-indigo-800 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            二线人员 ({localL2.length}人)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leader')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
              activeTab === 'leader'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            带班院领导 ({localLd.length}人)
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto space-y-4 grow">
          {/* Add form */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
              <Plus className="w-3.5 h-3.5 mr-1 text-teal-600" />
              添加新
              {activeTab === 'line1'
                ? '一线人员'
                : activeTab === 'line2'
                ? '二线人员'
                : '带班院领导'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                placeholder="姓名 (必填)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="科室/部门 (如医务科)"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="联系电话 (选填)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={!newName.trim()}
                className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-bold flex items-center justify-center transition-colors"
              >
                加入队列
              </button>
            </div>
          </div>

          {/* Staff list with reorder */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-500 flex justify-between px-1">
              <span>轮转顺序 (上下箭头可微调排班轮次)</span>
              <span>状态 / 操作</span>
            </div>

            {currentList.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  member.isActive
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{member.name}</span>
                      {member.department && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {member.department}
                        </span>
                      )}
                    </div>
                    {member.phone && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center">
                        <Phone className="w-2.5 h-2.5 mr-1" />
                        {member.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="上移"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === currentList.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="下移"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(member.id)}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                      member.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {member.isActive ? '参排' : '请假/暂休'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="移除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            修改后将同步到自动排班与导出名册中
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              保存人员名册
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
