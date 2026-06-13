import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Timer,
  Zap,
  Search,
} from 'lucide-react';
import { reservationAPI, scheduleAPI } from '@/services/api';
import type { Reservation, Schedule, WaitlistItem } from '../../shared/types';
import { cn } from '@/lib/utils';

interface RosterData {
  scheduleId: string;
  schedule: Schedule;
  confirmed: Reservation[];
  locked: Reservation[];
  waitlist: WaitlistItem[];
}

interface CountdownProps {
  expiresAt: string;
  onExpire?: () => void;
}

function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const expireTime = new Date(expiresAt).getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        onExpire?.();
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft.minutes < 5;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded',
      isUrgent ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
    )}>
      <Timer className="w-3 h-3" />
      {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

function NotifiedCountdown({ notifiedAt, onExpire }: { notifiedAt: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const notifiedTime = new Date(notifiedAt).getTime();
      const timeout = 15 * 60 * 1000;
      const diff = notifiedTime + timeout - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        onExpire?.();
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [notifiedAt, onExpire]);

  const isUrgent = timeLeft.minutes < 5;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded',
      isUrgent ? 'bg-danger/20 text-danger animate-pulse' : 'bg-warning/20 text-warning'
    )}>
      <Zap className="w-3 h-3" />
      {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

type TabType = 'confirmed' | 'locked' | 'waitlist';

interface ScheduleCardProps {
  data: RosterData;
}

function ScheduleCard({ data }: ScheduleCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('confirmed');
  const { schedule, confirmed, locked, waitlist } = data;

  const tabs: { key: TabType; label: string; icon: typeof CheckCircle; count: number; color: string }[] = [
    { key: 'confirmed', label: '已确认', icon: CheckCircle, count: confirmed.length, color: 'text-success' },
    { key: 'locked', label: '锁定中', icon: Timer, count: locked.length, color: 'text-warning' },
    { key: 'waitlist', label: '候补队列', icon: Users, count: waitlist.length, color: 'text-info' },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-dark-200/30">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              {schedule.courseName}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-dark-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {schedule.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {schedule.startTime} - {schedule.endTime}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {schedule.labName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {schedule.teacherName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-badge status-success">
              已确认 {confirmed.length}
            </span>
            <span className="status-badge status-warning">
              锁定 {locked.length}
            </span>
            <span className="status-badge status-info">
              候补 {waitlist.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-500 hover:text-white hover:bg-dark-300/50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive && tab.color)} />
              {tab.label}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                isActive ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-400/50 text-dark-500'
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {activeTab === 'confirmed' && (
          confirmed.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无已确认的学生</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {confirmed.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 bg-dark-300/50 rounded-lg border border-dark-400/50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center text-success font-bold">
                    {r.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{r.studentName}</p>
                    <p className="text-xs text-dark-500">座位号: {r.seatNumber}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'locked' && (
          locked.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <Timer className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无锁定中的学生</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {locked.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg border border-warning/30"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center text-warning font-bold">
                    {r.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{r.studentName}</p>
                    <p className="text-xs text-dark-500 mb-1">座位号: {r.seatNumber}</p>
                    {r.lockExpiresAt && (
                      <Countdown expiresAt={r.lockExpiresAt} />
                    )}
                  </div>
                  <Timer className="w-5 h-5 text-warning flex-shrink-0" />
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'waitlist' && (
          waitlist.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无候补学生</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waitlist.map((w, idx) => (
                <div
                  key={w.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    w.status === 'notified'
                      ? 'bg-warning/10 border-warning/40'
                      : 'bg-dark-300/50 border-dark-400/50'
                  )}
                >
                  <span className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    idx === 0
                      ? 'bg-warning text-dark-900'
                      : 'bg-dark-400 text-white'
                  )}>
                    {w.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium flex items-center gap-2">
                      {w.studentName}
                      {w.status === 'notified' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-warning/20 text-warning">
                          <Zap className="w-3 h-3" />
                          可认领
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-dark-500">
                        状态: {w.status === 'waiting' ? '等待中' : '已通知'}
                      </span>
                      {w.status === 'notified' && w.notifiedAvailableAt && (
                        <NotifiedCountdown notifiedAt={w.notifiedAvailableAt} />
                      )}
                    </div>
                  </div>
                  <Users className={cn(
                    'w-5 h-5 flex-shrink-0',
                    w.status === 'notified' ? 'text-warning' : 'text-dark-500'
                  )} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function Roster() {
  const [roster, setRoster] = useState<RosterData[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRoster = useCallback(async (scheduleId?: string) => {
    setLoading(true);
    try {
      const response = await reservationAPI.getRoster(scheduleId || undefined);
      if (response.data.success && response.data.data) {
        setRoster(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch roster:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await scheduleAPI.list();
      if (response.data.success && response.data.data) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchRoster(selectedScheduleId || undefined);
  }, [selectedScheduleId, fetchRoster]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoster(selectedScheduleId || undefined);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedScheduleId, fetchRoster]);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <ClipboardList className="inline w-8 h-8 mr-3 text-primary-400" />
              预约名单
            </h1>
            <p className="text-dark-500">查看课程预约学生名单</p>
          </div>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-dark-500" />
              <span className="text-dark-500 text-sm">筛选:</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="input-field w-auto min-w-[280px]"
              >
                <option value="">全部排课</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.courseName} - {schedule.date} {schedule.startTime}-{schedule.endTime}
                  </option>
                ))}
              </select>
            </div>
            {selectedScheduleId && (
              <button
                onClick={() => setSelectedScheduleId('')}
                className="btn-secondary text-sm px-3 py-1"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : roster.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-dark-500 opacity-30" />
            <p className="text-dark-500 text-lg">暂无预约名单数据</p>
            <p className="text-dark-500 text-sm mt-2">选择排课或稍后再试</p>
          </div>
        ) : (
          <div className="space-y-6">
            {roster.map((data) => (
              <ScheduleCard key={data.scheduleId} data={data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
