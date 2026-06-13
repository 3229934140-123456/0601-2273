import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList,
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle,
  X,
  AlertCircle,
  Timer,
  Users,
  Lock,
  Wrench,
  Search,
  LogOut,
  Zap,
} from 'lucide-react';
import { reservationAPI, scheduleAPI } from '@/services/api';
import type { Reservation, Seat, Schedule, Lab, WaitlistItem } from '../../shared/types';
import { cn } from '@/lib/utils';

const MOCK_LABS: Lab[] = [
  { id: 'lab1', name: '计算机实验室A', building: '实验楼', floor: '3层', capacity: 40 },
  { id: 'lab2', name: '计算机实验室B', building: '实验楼', floor: '3层', capacity: 35 },
  { id: 'lab3', name: '电子实验室', building: '实验楼', floor: '2层', capacity: 30 },
  { id: 'lab4', name: '化学实验室', building: '化学楼', floor: '1层', capacity: 25 },
  { id: 'lab5', name: '物理实验室', building: '物理楼', floor: '2层', capacity: 30 },
];

const SEAT_STATUS_CONFIG = {
  available: { color: 'bg-success', borderColor: 'border-success', label: '可用' },
  occupied: { color: 'bg-primary-500', borderColor: 'border-primary-500', label: '已预约' },
  locked: { color: 'bg-warning', borderColor: 'border-warning', label: '锁定中' },
  maintenance: { color: 'bg-dark-400', borderColor: 'border-dark-400', label: '维修中' },
};

interface SeatGridProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
}

function SeatGrid({ seats, onSeatClick }: SeatGridProps) {
  const gridSeats = useMemo(() => {
    const grid: (Seat | null)[][] = Array(5).fill(null).map(() => Array(8).fill(null));
    seats.forEach((seat) => {
      if (seat.row < 5 && seat.col < 8) {
        grid[seat.row][seat.col] = seat;
      }
    });
    return grid;
  }, [seats]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 px-12 py-3 bg-dark-300/50 rounded-lg text-dark-500 text-sm">
        讲台
      </div>
      <div className="grid grid-cols-8 gap-3">
        {gridSeats.map((row, rowIndex) =>
          row.map((seat, colIndex) => {
            if (!seat) {
              return <div key={`empty-${rowIndex}-${colIndex}`} className="w-14 h-14" />;
            }
            const statusConfig = SEAT_STATUS_CONFIG[seat.status];
            const isClickable = seat.status === 'available';
            return (
              <button
                key={seat.id}
                onClick={() => isClickable && onSeatClick(seat)}
                disabled={!isClickable}
                className={cn(
                  'w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200',
                  statusConfig.color,
                  statusConfig.borderColor,
                  isClickable && 'hover:scale-110 hover:shadow-lg cursor-pointer',
                  !isClickable && 'cursor-not-allowed opacity-80',
                  seat.status === 'locked' && 'animate-pulse'
                )}
              >
                <span className="text-white font-bold text-sm">{seat.seatNumber}</span>
                {seat.status === 'locked' && <Lock className="w-3 h-3 text-white mt-0.5" />}
                {seat.status === 'maintenance' && <Wrench className="w-3 h-3 text-white mt-0.5" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        onExpire();
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft.minutes < 5;

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg',
      isUrgent ? 'bg-danger/20 border border-danger/50' : 'bg-warning/20 border border-warning/50'
    )}>
      <Timer className={cn('w-6 h-6', isUrgent ? 'text-danger animate-pulse' : 'text-warning')} />
      <div>
        <p className={cn('text-sm font-medium', isUrgent ? 'text-danger' : 'text-warning')}>
          座位锁定倒计时
        </p>
        <p className={cn('text-2xl font-bold number-counter', isUrgent ? 'text-danger' : 'text-warning')}>
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}

interface NotifiedCountdownProps {
  notifiedAvailableAt: string;
  onExpire: () => void;
}

function NotifiedCountdown({ notifiedAvailableAt, onExpire }: NotifiedCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expireTime = new Date(notifiedAvailableAt).getTime() + 15 * 60 * 1000;
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        onExpire();
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [notifiedAvailableAt, onExpire]);

  const isUrgent = timeLeft.minutes < 3;

  return (
    <div className="flex items-center gap-1.5">
      <Timer className={cn('w-3.5 h-3.5', isUrgent ? 'text-danger animate-pulse' : 'text-warning')} />
      <span className={cn(
        'text-xs font-bold number-counter',
        isUrgent ? 'text-danger' : 'text-warning'
      )}>
        剩余可锁定：{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

function getWaitlistStatusBadge(status: WaitlistItem['status']) {
  const statusMap = {
    waiting: { className: 'status-info', label: '等待中' },
    notified: { className: 'status-warning', label: '可认领' },
    cancelled: { className: 'status-danger', label: '已取消' },
    confirmed: { className: 'status-success', label: '已确认' },
  };
  return statusMap[status];
}

export default function Reservation() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [myWaitlist, setMyWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState('lab1');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lockedReservation, setLockedReservation] = useState<Reservation | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchReservations();
    fetchMyWaitlist();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchSeats();
    }
  }, [selectedLab, selectedSchedule]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchWaitlist();
    } else {
      setWaitlist([]);
    }
  }, [selectedSchedule]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchReservations();
      fetchMyWaitlist();
      if (selectedSchedule) {
        fetchWaitlist();
        fetchSeats();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [selectedSchedule]);

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

  const fetchSeats = async () => {
    setLoading(true);
    try {
      const response = await reservationAPI.getSeats(selectedLab, selectedSchedule || undefined);
      if (response.data.success && response.data.data) {
        setSeats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await reservationAPI.list();
      if (response.data.success && response.data.data) {
        setReservations(response.data.data);
        const locked = response.data.data.find(
          (r) => r.status === 'locked' && r.lockExpiresAt
        );
        if (locked) {
          setLockedReservation(locked);
        } else {
          setLockedReservation(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    }
  };

  const fetchWaitlist = async () => {
    if (!selectedSchedule) return;
    setWaitlistLoading(true);
    try {
      const response = await reservationAPI.getWaitlist(selectedSchedule);
      if (response.data.success && response.data.data) {
        setWaitlist(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch waitlist:', error);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const fetchMyWaitlist = async () => {
    try {
      const response = await reservationAPI.getMyWaitlist();
      if (response.data.success && response.data.data) {
        setMyWaitlist(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch my waitlist:', error);
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchWaitlist(),
      fetchMyWaitlist(),
      fetchSeats(),
      fetchReservations(),
    ]);
  }, []);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeat(seat);
    setShowConfirmModal(true);
  };

  const handleReserve = async () => {
    if (!selectedSeat || !selectedSchedule) {
      showMessage('请先选择排课', 'error');
      return;
    }

    try {
      const response = await reservationAPI.create({
        scheduleId: selectedSchedule,
        seatId: selectedSeat.id,
      });

      if (response.data.success && response.data.data) {
        showMessage(response.data.message || '座位锁定成功', 'success');
        setLockedReservation(response.data.data);
        setShowConfirmModal(false);
        setSelectedSeat(null);
        refreshAll();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.error || '预约失败', 'error');
    }
  };

  const handleConfirmReservation = async (reservationId: string) => {
    try {
      const response = await reservationAPI.confirm(reservationId);
      if (response.data.success && response.data.data) {
        showMessage('预约确认成功', 'success');
        setLockedReservation(null);
        refreshAll();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.error || '确认失败', 'error');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedSchedule) {
      showMessage('请先选择排课', 'error');
      return;
    }

    try {
      const response = await reservationAPI.joinWaitlist({
        scheduleId: selectedSchedule,
        labId: selectedLab,
      });

      if (response.data.success && response.data.data) {
        showMessage(response.data.message || '已加入候补队列', 'success');
        refreshAll();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.error || '加入候补失败', 'error');
    }
  };

  const handleLeaveWaitlist = async (id: string) => {
    try {
      const response = await reservationAPI.leaveWaitlist(id);
      if (response.data.success) {
        showMessage(response.data.message || '已退出候补队列', 'success');
        refreshAll();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.error || '退出候补失败', 'error');
    }
  };

  const handleClaimWaitlist = async (id: string) => {
    try {
      const response = await reservationAPI.claimWaitlist(id);
      if (response.data.success && response.data.data) {
        showMessage(response.data.message || '座位已锁定', 'success');
        setLockedReservation(response.data.data);
        fetchWaitlist();
        fetchMyWaitlist();
        fetchSeats();
        fetchReservations();
      }
    } catch (error: any) {
      showMessage(error.response?.data?.error || '认领失败', 'error');
    }
  };

  const handleTimerExpire = () => {
    setLockedReservation(null);
    showMessage('锁定已超时，座位已释放', 'error');
    fetchSeats();
    fetchReservations();
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const statusMap = {
      pending: { className: 'status-pending', label: '待处理' },
      locked: { className: 'status-warning', label: '锁定中' },
      confirmed: { className: 'status-success', label: '已确认' },
      cancelled: { className: 'status-danger', label: '已取消' },
      completed: { className: 'status-info', label: '已完成' },
    };
    return statusMap[status];
  };

  const availableSeatsCount = useMemo(() => {
    return seats.filter(s => s.status === 'available').length;
  }, [seats]);

  const isNoAvailableSeats = selectedSchedule && availableSeatsCount === 0;

  const myWaitlistForCurrentSchedule = useMemo(() => {
    if (!selectedSchedule) return null;
    return myWaitlist.find(w => w.scheduleId === selectedSchedule);
  }, [myWaitlist, selectedSchedule]);

  const activeWaitlist = useMemo(() => {
    return waitlist
      .filter(w => w.status === 'waiting' || w.status === 'notified')
      .sort((a, b) => a.position - b.position);
  }, [waitlist]);

  const activeMyWaitlist = useMemo(() => {
    return myWaitlist
      .filter(w => w.status === 'waiting' || w.status === 'notified')
      .sort((a, b) => a.position - b.position);
  }, [myWaitlist]);

  const handleNotifiedExpire = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <ClipboardList className="inline w-8 h-8 mr-3 text-primary-400" />
              预约管理
            </h1>
            <p className="text-dark-500">选择实验室和排课，预约座位进行实验学习</p>
          </div>
        </div>

        {message && (
          <div className={cn(
            'mb-4 p-4 rounded-lg flex items-center gap-3 animate-slide-up',
            message.type === 'success' ? 'bg-success/20 border border-success/50 text-success' : 'bg-danger/20 border border-danger/50 text-danger'
          )}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-dark-500" />
                  <span className="text-dark-500 text-sm">筛选:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-400" />
                  <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="input-field w-auto"
                  >
                    {MOCK_LABS.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <select
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="input-field w-auto min-w-[280px]"
                  >
                    <option value="">请选择排课</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.courseName} - {schedule.date} {schedule.startTime}-{schedule.endTime}
                      </option>
                    ))}
                  </select>
                </div>
                {isNoAvailableSeats && !myWaitlistForCurrentSchedule && (
                  <button
                    onClick={handleJoinWaitlist}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    加入候补
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">座位平面图</h2>
                <div className="flex items-center gap-4">
                  {Object.entries(SEAT_STATUS_CONFIG).map(([status, config]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded', config.color)} />
                      <span className="text-sm text-dark-500">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <SeatGrid seats={seats} onSeatClick={handleSeatClick} />
              )}

              {isNoAvailableSeats && (
                <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-warning font-medium">当前排课座位已满</p>
                      <p className="text-dark-500 text-sm mt-1">
                        {myWaitlistForCurrentSchedule
                          ? `您已在候补队列中，当前位置：第 ${myWaitlistForCurrentSchedule.position} 位`
                          : '您可以加入候补队列，有座位释放时将按顺序通知您'}
                      </p>
                    </div>
                    {myWaitlistForCurrentSchedule ? (
                      <button
                        onClick={() => handleLeaveWaitlist(myWaitlistForCurrentSchedule.id)}
                        className="btn-danger text-sm flex items-center gap-1"
                      >
                        <LogOut className="w-4 h-4" />
                        退出候补
                      </button>
                    ) : (
                      <button
                        onClick={handleJoinWaitlist}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        加入候补
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {lockedReservation && lockedReservation.lockExpiresAt && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <CountdownTimer
                    expiresAt={lockedReservation.lockExpiresAt}
                    onExpire={handleTimerExpire}
                  />
                  <button
                    onClick={() => handleConfirmReservation(lockedReservation.id)}
                    className="btn-primary px-6"
                  >
                    确认预约
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-80 space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-400" />
                我的预约记录
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reservations.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    暂无预约记录
                  </div>
                ) : (
                  reservations.map((reservation) => {
                    const status = getStatusBadge(reservation.status);
                    const schedule = schedules.find((s) => s.id === reservation.scheduleId);
                    return (
                      <div
                        key={reservation.id}
                        className="p-3 bg-dark-300/50 rounded-lg border border-dark-400/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {reservation.seatNumber} 号座位
                          </span>
                          <span className={cn('status-badge', status.className)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-dark-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{schedule?.courseName || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{schedule?.labName || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {schedule?.date} {schedule?.startTime}-{schedule?.endTime}
                            </span>
                          </div>
                          {reservation.lockedAt && (
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>锁定于 {new Date(reservation.lockedAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        {reservation.status === 'locked' && (
                          <button
                            onClick={() => handleConfirmReservation(reservation.id)}
                            className="btn-primary w-full mt-3 text-sm py-1.5"
                          >
                            确认预约
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                候补队列
                {selectedSchedule && activeWaitlist.length > 0 && (
                  <span className="ml-auto text-sm text-dark-500">
                    共 {activeWaitlist.length} 人
                  </span>
                )}
              </h3>

              {!selectedSchedule ? (
                <div className="text-center py-8 text-dark-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>请先选择排课</p>
                  <p className="text-xs mt-1">选择排课后查看候补队列</p>
                </div>
              ) : waitlistLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : activeWaitlist.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无候补排队</p>
                  <p className="text-xs mt-1">座位满员时可加入候补</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {activeWaitlist.map((item, idx) => {
                    const isMine = myWaitlist.some(m => m.id === item.id);
                    const myItem = myWaitlist.find(m => m.id === item.id);
                    const status = getWaitlistStatusBadge(item.status);
                    const schedule = schedules.find(s => s.id === item.scheduleId);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          isMine && item.status === 'notified'
                            ? 'bg-warning/20 border-warning/50 animate-pulse'
                            : isMine
                              ? 'bg-primary-500/10 border-primary-500/30'
                              : 'bg-dark-300/50 border-dark-400/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                              item.position === 1 ? 'bg-warning text-dark-900' : 'bg-dark-400 text-white'
                            )}>
                              {item.position}
                            </span>
                            <span className={cn(
                              'font-medium',
                              isMine ? 'text-primary-400' : 'text-white'
                            )}>
                              {item.studentName}
                              {isMine && <span className="ml-1 text-xs">(我)</span>}
                            </span>
                          </div>
                          <span className={cn('status-badge text-xs', status.className)}>
                            {status.label}
                          </span>
                        </div>

                        {isMine && item.status === 'notified' && (
                          <div className="mb-3 p-2 bg-warning/30 rounded border border-warning/50">
                            <div className="flex items-center gap-2 text-warning text-sm font-medium">
                              <Zap className="w-4 h-4" />
                              有座位释放，您可锁定！
                            </div>
                            {item.notifiedAvailableAt && (
                              <div className="mt-1.5">
                                <NotifiedCountdown
                                  notifiedAvailableAt={item.notifiedAvailableAt}
                                  onExpire={handleNotifiedExpire}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-dark-500 mb-2">
                          {schedule?.courseName} · {schedule?.date}
                        </div>

                        {isMine && myItem && (
                          <div className="flex gap-2">
                            {myItem.status === 'notified' && (
                              <button
                                onClick={() => handleClaimWaitlist(myItem.id)}
                                className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                              >
                                <Lock className="w-3 h-3" />
                                立即锁定
                              </button>
                            )}
                            {(myItem.status === 'waiting' || myItem.status === 'notified') && (
                              <button
                                onClick={() => handleLeaveWaitlist(myItem.id)}
                                className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                              >
                                <LogOut className="w-3 h-3" />
                                退出候补
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {activeMyWaitlist.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" />
                  我的候补
                </h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activeMyWaitlist.map((item) => {
                    const status = getWaitlistStatusBadge(item.status);
                    const schedule = schedules.find(s => s.id === item.scheduleId);
                    const isNotified = item.status === 'notified';
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          isNotified
                            ? 'bg-warning/20 border-warning/50 animate-pulse'
                            : 'bg-dark-300/50 border-dark-400/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm">
                            第 {item.position} 位
                          </span>
                          <span className={cn('status-badge text-xs', status.className)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-xs text-dark-500 space-y-1 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{schedule?.courseName || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{schedule?.date} {schedule?.startTime}</span>
                          </div>
                        </div>
                        {isNotified && item.notifiedAvailableAt && (
                          <div className="mb-2">
                            <NotifiedCountdown
                              notifiedAvailableAt={item.notifiedAvailableAt}
                              onExpire={handleNotifiedExpire}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          {isNotified && (
                            <button
                              onClick={() => handleClaimWaitlist(item.id)}
                              className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              立即锁定
                            </button>
                          )}
                          <button
                            onClick={() => handleLeaveWaitlist(item.id)}
                            className="btn-danger text-xs py-1.5 flex-1 flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            退出
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && selectedSeat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">确认预约</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedSeat(null);
                }}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg text-center">
                <p className="text-dark-500 text-sm mb-1">您选择的座位</p>
                <p className="text-3xl font-bold text-primary-400">
                  {selectedSeat.seatNumber}
                </p>
                <p className="text-dark-500 text-sm mt-1">
                  第 {selectedSeat.row + 1} 排，第 {selectedSeat.col + 1} 列
                </p>
              </div>

              <div className="p-3 bg-dark-300/50 rounded-lg">
                <p className="text-sm text-dark-500 mb-1">排课信息</p>
                <p className="text-white">
                  {schedules.find((s) => s.id === selectedSchedule)?.courseName || '未选择排课'}
                </p>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-warning font-medium">锁定规则</p>
                    <p className="text-dark-500 mt-1">
                      点击"预约"后将锁定座位15分钟，请在锁定时间内确认预约，超时座位将自动释放。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedSeat(null);
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleReserve}
                className="btn-primary flex-1"
                disabled={!selectedSchedule}
              >
                预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
