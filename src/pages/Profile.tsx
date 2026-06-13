import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  CreditCard,
  Calendar,
  FileText,
  Wrench,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { UserRole } from '../../shared/types';

const roleLabels: Record<UserRole, string> = {
  student: '学生',
  teacher: '教师',
  admin: '管理员',
  leader: '领导',
};

const roleColors: Record<UserRole, string> = {
  student: 'bg-blue-500/20 text-blue-400',
  teacher: 'bg-green-500/20 text-green-400',
  admin: 'bg-purple-500/20 text-purple-400',
  leader: 'bg-orange-500/20 text-orange-400',
};

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'reservations' | 'borrows' | 'reports'>('info');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const response = await userAPI.update(user.id, formData);
      if (response.data.success) {
        updateUser(formData);
        setSuccess('个人信息更新成功');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    setSuccess('密码修改成功');
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSuccess(''), 3000);
  };

  const tabs = [
    { id: 'info', label: '个人信息', icon: User },
    { id: 'reservations', label: '预约记录', icon: ClipboardList },
    { id: 'borrows', label: '借用记录', icon: Wrench },
    { id: 'reports', label: '报告历史', icon: FileText },
  ];

  if (!user) return null;

  const creditScoreColor = user.creditScore >= 80
    ? 'text-green-400'
    : user.creditScore >= 60
    ? 'text-yellow-400'
    : 'text-red-400';

  const creditScorePercent = Math.min(user.creditScore, 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">个人中心</h1>
        <p className="text-dark-500">管理您的个人信息和使用记录</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold mb-4 glow-border">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
              <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-medium', roleColors[user.role])}>
                {roleLabels[user.role]}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg">
                <div className="flex items-center gap-2 text-dark-500">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">信用分</span>
                </div>
                <span className={cn('text-lg font-bold', creditScoreColor)}>
                  {user.creditScore}
                </span>
              </div>

              <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                    user.creditScore >= 80
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : user.creditScore >= 60
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  )}
                  style={{ width: `${creditScorePercent}%` }}
                />
              </div>

              {user.creditScore < 80 && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    信用分低于80分可能影响设备借用权限，请按时归还设备
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-dark-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-dark-500">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-dark-500">
                <Building className="w-4 h-4" />
                <span className="text-sm">{user.department}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="glass-card">
            <div className="flex border-b border-dark-400/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2',
                      activeTab === tab.id
                        ? 'text-primary-400 border-primary-500 bg-primary-500/10'
                        : 'text-dark-500 border-transparent hover:text-white hover:bg-dark-200/30'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {success && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-success/10 border border-success/30 rounded-lg text-success animate-slide-up">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-danger/10 border border-danger/30 rounded-lg text-danger animate-slide-up">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-400" />
                      基本信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">姓名</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">邮箱</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">手机号</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">部门</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="btn-primary mt-4 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存修改'
                      )}
                    </button>
                  </div>

                  <div className="pt-6 border-t border-dark-400/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-400" />
                      修改密码
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">当前密码</label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? 'text' : 'password'}
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            placeholder="请输入当前密码"
                            className="input-field pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
                          >
                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">新密码</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="请输入新密码"
                            className="input-field pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-500 mb-2">确认新密码</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="请再次输入新密码"
                          className="input-field"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className="btn-primary"
                      >
                        修改密码
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary-400" />
                    我的预约记录
                  </h3>
                  <div className="glass-card p-4 text-center py-12">
                    <Calendar className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-500">暂无预约记录</p>
                  </div>
                </div>
              )}

              {activeTab === 'borrows' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary-400" />
                    我的借用记录
                  </h3>
                  <div className="glass-card p-4 text-center py-12">
                    <Wrench className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-500">暂无借用记录</p>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-400" />
                    报告历史
                  </h3>
                  <div className="glass-card p-4 text-center py-12">
                    <FileText className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-500">暂无报告记录</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
