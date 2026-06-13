import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Lock, Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { UserRole } from '../../shared/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-danger/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative z-10 text-center px-4 animate-slide-up">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-danger/10 mb-8 animate-float">
            <ShieldAlert className="w-16 h-16 text-danger" />
          </div>

          <h1 className="text-6xl font-bold text-white mb-4 glow-text">403</h1>
          <h2 className="text-2xl font-semibold text-white mb-3">访问被拒绝</h2>
          <p className="text-dark-500 max-w-md mx-auto mb-8">
            抱歉，您没有权限访问此页面。
            <br />
            此功能需要 {allowedRoles.map((role) => {
              const labels: Record<UserRole, string> = {
                student: '学生',
                teacher: '教师',
                admin: '管理员',
                leader: '领导',
              };
              return labels[role];
            }).join(' 或 ')} 角色权限。
          </p>

          <div className="glass-card p-4 mb-8 max-w-sm mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-warning" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">当前角色</p>
                <p className="text-sm text-dark-500">
                  {user?.role === 'student' && '学生'}
                  {user?.role === 'teacher' && '教师'}
                  {user?.role === 'admin' && '管理员'}
                  {user?.role === 'leader' && '领导'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上一页
            </button>
            <a
              href="/"
              className="btn-primary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
