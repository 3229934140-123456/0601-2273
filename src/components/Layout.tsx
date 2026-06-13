import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  Home,
  Calendar,
  ClipboardList,
  Wrench,
  FileText,
  BarChart3,
  FlaskConical,
  Database,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import type { UserRole } from '../../shared/types';

interface MenuItem {
  path: string;
  label: string;
  icon: typeof Home;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: '首页', icon: Home, roles: ['student', 'teacher', 'admin', 'leader'] },
  { path: '/schedule', label: '排课管理', icon: Calendar, roles: ['teacher', 'admin', 'leader'] },
  { path: '/reservation', label: '预约管理', icon: ClipboardList, roles: ['student', 'teacher', 'admin', 'leader'] },
  { path: '/equipment', label: '设备借用', icon: Wrench, roles: ['student', 'teacher', 'admin', 'leader'] },
  { path: '/report', label: '实验报告', icon: FileText, roles: ['student', 'teacher', 'admin', 'leader'] },
  { path: '/grade', label: '成绩管理', icon: BarChart3, roles: ['student', 'teacher', 'admin', 'leader'] },
  { path: '/chemical', label: '危化品管理', icon: FlaskConical, roles: ['admin', 'leader'] },
  { path: '/data', label: '数据中心', icon: Database, roles: ['admin', 'leader'] },
  { path: '/profile', label: '个人中心', icon: User, roles: ['student', 'teacher', 'admin', 'leader'] },
];

const roleLabels: Record<UserRole, string> = {
  student: '学生',
  teacher: '教师',
  admin: '管理员',
  leader: '领导',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <aside
        className={cn(
          'relative flex flex-col bg-dark-100/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-slide-in">
                <h1 className="text-lg font-bold text-white">实验室管理</h1>
                <p className="text-xs text-dark-500">Lab Management</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-dark-300 text-dark-500 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-link group',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-400')} />
                {!sidebarCollapsed && (
                  <span className="animate-slide-in text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {user && !sidebarCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="glass-card p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-dark-500 truncate">{roleLabels[user.role]}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-dark-100/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="搜索..."
                className="w-64 pl-10 pr-4 py-2 bg-dark-200/50 border border-dark-400/50 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-dark-300 text-dark-500 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name.charAt(0)}
                </div>
                <ChevronDown className={cn('w-4 h-4 text-dark-500 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card py-2 animate-slide-up z-50">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-500 hover:text-white hover:bg-primary-500/20 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    个人中心
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 grid-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
