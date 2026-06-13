import { useEffect, useState, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  Building2,
  Wrench,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { dashboardAPI } from '@/services/api';
import type { DashboardStats } from '../../shared/types';
import { cn } from '@/lib/utils';

const COLORS = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9'];

function AnimatedNumber({ value, suffix = '', duration = 1000 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="number-counter">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        'glass-card p-6 relative overflow-hidden animate-slide-up',
        'hover:animate-glow transition-all duration-300'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-dark-500 text-sm font-medium">{title}</span>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
        <div className="text-4xl font-bold text-white glow-text">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await dashboardAPI.getStats();
        if (response.data.success && response.data.data) {
          setStats(response.data.data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch initial stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const eventSource = dashboardAPI.getStatsStream((data) => {
      setStats(data);
      setLastUpdate(new Date());
      setLoading(false);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const occupancyRate = stats
    ? Math.round(
        stats.labOccupancy.reduce((sum, lab) => sum + lab.rate, 0) /
          stats.labOccupancy.length
      )
    : 0;

  const equipmentRate = stats
    ? stats.equipmentCondition.total > 0
      ? Math.round(
          (stats.equipmentCondition.good / stats.equipmentCondition.total) * 100
        )
      : 0
    : 0;

  const pieData = stats?.labOccupancy.map((lab) => ({
    name: lab.labName,
    value: lab.rate,
  }));

  const lineData = stats?.hourlyTrend.map((item) => ({
    hour: `${item.hour}:00`,
    count: item.count,
  }));

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <Activity className="inline w-8 h-8 mr-3 text-primary-400" />
              实验室监控大屏
            </h1>
            <p className="text-dark-500">
              {lastUpdate && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="今日实验人次"
            value={stats?.todayStudents || 0}
            icon={Users}
            color="#165DFF"
            delay={0}
          />
          <StatCard
            title="实验室占用率"
            value={occupancyRate}
            suffix="%"
            icon={Building2}
            color="#00B42A"
            delay={100}
          />
          <StatCard
            title="设备完好率"
            value={equipmentRate}
            suffix="%"
            icon={Wrench}
            color="#FF7D00"
            delay={200}
          />
          <StatCard
            title="报告提交率"
            value={stats?.reportSubmissionRate || 0}
            suffix="%"
            icon={FileCheck}
            color="#722ED1"
            delay={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              实验室占用率
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={{ stroke: '#5D6478', strokeWidth: 1 }}
                  >
                    {pieData?.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2F3A',
                      border: '1px solid #3C4253',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`${value}%`, '占用率']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              今日人次趋势
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C4253" />
                  <XAxis
                    dataKey="hour"
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2F3A',
                      border: '1px solid #3C4253',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [value, '人次']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#86909C' }}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="实验人次"
                    stroke="#165DFF"
                    strokeWidth={3}
                    dot={{ fill: '#165DFF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#165DFF' }}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                实时告警
              </h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {stats?.alerts.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success opacity-50" />
                    <p>暂无告警</p>
                  </div>
                ) : (
                  stats?.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg',
                        alert.type === 'danger'
                          ? 'bg-danger/10 border border-danger/30'
                          : 'bg-warning/10 border border-warning/30'
                      )}
                    >
                      {alert.type === 'danger' ? (
                        <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            alert.type === 'danger' ? 'text-danger' : 'text-warning'
                          )}
                        >
                          {alert.message}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '700ms' }}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-400" />
                实验室状态
              </h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {stats?.labStatus.map((lab) => (
                  <div
                    key={lab.id}
                    className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full animate-pulse',
                          lab.status === 'occupied'
                            ? 'bg-danger'
                            : lab.status === 'maintenance'
                            ? 'bg-warning'
                            : 'bg-success'
                        )}
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{lab.name}</p>
                        {lab.currentCourse && (
                          <p className="text-dark-500 text-xs truncate max-w-[150px]">
                            {lab.currentCourse}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'status-badge',
                        lab.status === 'occupied'
                          ? 'status-danger'
                          : lab.status === 'maintenance'
                          ? 'status-warning'
                          : 'status-success'
                      )}
                    >
                      {lab.status === 'occupied'
                        ? '使用中'
                        : lab.status === 'maintenance'
                        ? '维护中'
                        : '空闲'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
