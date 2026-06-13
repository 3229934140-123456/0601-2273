import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  FlaskConical,
  Eye,
  EyeOff,
  Lock,
  User,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { UserRole } from '../../shared/types';

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  { value: 'student', label: '学生', description: '实验预约、报告提交' },
  { value: 'teacher', label: '教师', description: '排课管理、成绩评定' },
  { value: 'admin', label: '管理员', description: '系统管理、危化品管控' },
  { value: 'leader', label: '领导', description: '数据查看、决策支持' },
];

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student' as UserRole,
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }

    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedRole = localStorage.getItem('rememberedRole') as UserRole;
    if (savedUsername && savedRole) {
      setFormData((prev) => ({
        ...prev,
        username: savedUsername,
        role: savedRole,
        remember: true,
      }));
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        username: formData.username,
        password: formData.password,
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;

        if (formData.remember) {
          localStorage.setItem('rememberedUsername', formData.username);
          localStorage.setItem('rememberedRole', formData.role);
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedRole');
        }

        login(token, user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roleOptions.find((r) => r.value === formData.role);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-700/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 grid-bg opacity-50" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-6 glow-border animate-float">
            <FlaskConical className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 glow-text">实验室管理系统</h1>
          <p className="text-dark-500">Laboratory Management System</p>
        </div>

        <div className="glass-card p-8 glow-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-white mb-6 text-center">账号登录</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">选择角色</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark-200 border border-dark-400 rounded-lg text-left transition-all hover:border-primary-500/50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center text-primary-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{selectedRole?.label}</p>
                    <p className="text-xs text-dark-500">{selectedRole?.description}</p>
                  </div>
                  <ChevronDown className={cn('w-5 h-5 text-dark-500 transition-transform', roleDropdownOpen && 'rotate-180')} />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-card py-2 z-50 animate-slide-up">
                    {roleOptions.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, role: role.value }));
                          setRoleDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          formData.role === role.value
                            ? 'bg-primary-500/20 text-white'
                            : 'text-dark-500 hover:bg-dark-300 hover:text-white'
                        )}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{role.label}</p>
                          <p className="text-xs opacity-70">{role.description}</p>
                        </div>
                        {formData.role === role.value && (
                          <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="请输入用户名"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-500 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="请输入密码"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remember: e.target.checked }))}
                  className="w-4 h-4 rounded border-dark-400 bg-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="text-sm text-dark-500 group-hover:text-white transition-colors">记住密码</span>
              </label>
              <button type="button" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                忘记密码?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-400/50">
            <p className="text-xs text-dark-500 text-center">
              测试账号: student / teacher / admin / leader
              <br />
              密码: 123456
            </p>
          </div>
        </div>

        <p className="text-center text-dark-500 text-sm mt-8">
          © 2024 实验室管理系统. All rights reserved.
        </p>
      </div>
    </div>
  );
}
