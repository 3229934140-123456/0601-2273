import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireStudent } from '../middleware/auth';
import type { Reservation, Seat, ApiResponse, WaitlistItem } from '../../shared/types';

const router = Router();

router.get('/', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<Reservation[]>>) => {
  const { studentId, scheduleId, status } = req.query;
  const userId = (req as Request & { userId: string; userRole: string }).userId;
  const userRole = (req as Request & { userId: string; userRole: string }).userRole;

  cleanExpiredLocks();

  let reservations = [...dataStore.reservations];

  if (userRole === 'student') {
    reservations = reservations.filter(r => r.studentId === userId);
  } else if (studentId) {
    reservations = reservations.filter(r => r.studentId === studentId);
  }

  if (scheduleId) {
    reservations = reservations.filter(r => r.scheduleId === scheduleId);
  }

  if (status) {
    reservations = reservations.filter(r => r.status === status);
  }

  res.json({ success: true, data: reservations as Reservation[] });
});

router.post('/', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<Reservation>>) => {
  const { scheduleId, seatId } = req.body as { scheduleId: string; seatId: string };
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const schedule = dataStore.schedules.find(s => s.id === scheduleId);
  if (!schedule) {
    res.status(404).json({ success: false, error: '排课不存在' });
    return;
  }

  const seat = dataStore.seats.find(s => s.id === seatId && s.labId === schedule.labId);
  if (!seat) {
    res.status(404).json({ success: false, error: '座位不存在' });
    return;
  }

  if (seat.status !== 'available') {
    res.status(400).json({ success: false, error: '该座位不可用' });
    return;
  }

  const seatReserved = dataStore.reservations.find(
    r => r.scheduleId === scheduleId && r.seatId === seatId && r.status !== 'cancelled'
  );
  if (seatReserved) {
    res.status(400).json({ success: false, error: '该座位已被预约' });
    return;
  }

  const existingReservation = dataStore.reservations.find(
    r => r.scheduleId === scheduleId && r.studentId === userId && r.status !== 'cancelled'
  );
  if (existingReservation) {
    res.status(400).json({ success: false, error: '您已预约该排课的座位' });
    return;
  }

  const existingWaitlist = dataStore.waitlist.find(
    w => w.scheduleId === scheduleId && w.studentId === userId && w.status !== 'cancelled' && w.status !== 'confirmed'
  );
  if (existingWaitlist) {
    res.status(400).json({ success: false, error: '您已在该排课的候补队列中' });
    return;
  }

  const student = dataStore.users.find(u => u.id === userId);
  if (!student) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const newReservation: Reservation = {
    id: generateId(),
    studentId: userId,
    studentName: student.name,
    scheduleId,
    labId: schedule.labId,
    seatId,
    seatNumber: seat.seatNumber,
    status: 'locked',
    lockedAt: now.toISOString(),
    lockExpiresAt: lockExpiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  dataStore.reservations.push(newReservation);
  res.json({ success: true, data: newReservation, message: '座位已锁定，请在15分钟内确认' });
});

router.post('/:id/confirm', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<Reservation>>) => {
  const { id } = req.params;
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const reservation = dataStore.reservations.find(r => r.id === id);
  if (!reservation) {
    res.status(404).json({ success: false, error: '预约不存在' });
    return;
  }

  if (reservation.studentId !== userId) {
    res.status(403).json({ success: false, error: '无权确认他人的预约' });
    return;
  }

  if (reservation.status === 'confirmed') {
    res.json({ success: true, data: reservation as Reservation, message: '预约已确认' });
    return;
  }

  if (reservation.status !== 'locked') {
    res.status(400).json({ success: false, error: '预约状态不允许确认' });
    return;
  }

  if (reservation.lockExpiresAt && new Date(reservation.lockExpiresAt) < new Date()) {
    res.status(400).json({ success: false, error: '锁定已过期，请重新预约' });
    return;
  }

  reservation.status = 'confirmed';
  delete reservation.lockedAt;
  delete reservation.lockExpiresAt;

  res.json({ success: true, data: reservation as Reservation, message: '预约确认成功' });
});

router.get('/lab/:labId/seats', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<Seat[]>>) => {
  const { labId } = req.params;
  const { scheduleId } = req.query;

  cleanExpiredLocks();

  const lab = dataStore.labs.find(l => l.id === labId);
  if (!lab) {
    res.status(404).json({ success: false, error: '实验室不存在' });
    return;
  }

  let seats = dataStore.seats.filter(s => s.labId === labId);

  if (scheduleId) {
    const reservedSeatIds = dataStore.reservations
      .filter(r => r.scheduleId === scheduleId && r.status !== 'cancelled')
      .map(r => r.seatId);

    seats = seats.map(seat => {
      if (reservedSeatIds.includes(seat.id)) {
        const reservation = dataStore.reservations.find(
          r => r.scheduleId === scheduleId && r.seatId === seat.id && r.status !== 'cancelled'
        );
        return {
          ...seat,
          status: reservation?.status === 'locked' ? 'locked' : 'occupied' as Seat['status'],
        };
      }
      return seat;
    });
  }

  res.json({ success: true, data: seats as Seat[] });
});

router.get('/waitlist', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<WaitlistItem[]>>) => {
  const { scheduleId } = req.query;

  cleanExpiredLocks();

  let waitlist = [...dataStore.waitlist];

  if (scheduleId) {
    waitlist = waitlist.filter(w => w.scheduleId === scheduleId);
  }

  waitlist.sort((a, b) => a.position - b.position);

  res.json({ success: true, data: waitlist });
});

router.get('/waitlist/my', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<WaitlistItem[]>>) => {
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const myWaitlist = dataStore.waitlist
    .filter(w => w.studentId === userId && w.status !== 'cancelled' && w.status !== 'confirmed')
    .sort((a, b) => a.position - b.position);

  res.json({ success: true, data: myWaitlist });
});

router.post('/waitlist', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<WaitlistItem>>) => {
  const { scheduleId, labId } = req.body as { scheduleId: string; labId: string };
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const schedule = dataStore.schedules.find(s => s.id === scheduleId);
  if (!schedule) {
    res.status(404).json({ success: false, error: '排课不存在' });
    return;
  }

  const lab = dataStore.labs.find(l => l.id === labId);
  if (!lab) {
    res.status(404).json({ success: false, error: '实验室不存在' });
    return;
  }

  const existingReservation = dataStore.reservations.find(
    r => r.scheduleId === scheduleId && r.studentId === userId && r.status !== 'cancelled'
  );
  if (existingReservation) {
    res.status(400).json({ success: false, error: '您已预约该排课的座位' });
    return;
  }

  const existingWaitlist = dataStore.waitlist.find(
    w => w.scheduleId === scheduleId && w.studentId === userId && w.status !== 'cancelled' && w.status !== 'confirmed'
  );
  if (existingWaitlist) {
    res.status(400).json({ success: false, error: '您已在该排课的候补队列中' });
    return;
  }

  const student = dataStore.users.find(u => u.id === userId);
  if (!student) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  const currentCount = dataStore.waitlist.filter(w => w.scheduleId === scheduleId && w.status !== 'cancelled' && w.status !== 'confirmed').length;

  const newWaitlistItem: WaitlistItem = {
    id: generateId(),
    scheduleId,
    labId,
    studentId: userId,
    studentName: student.name,
    position: currentCount + 1,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    missedNotifiedCount: 0,
  };

  dataStore.waitlist.push(newWaitlistItem);
  res.json({ success: true, data: newWaitlistItem, message: '已加入候补队列' });
});

router.delete('/waitlist/:id', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<void>>) => {
  const { id } = req.params;
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const waitlistIndex = dataStore.waitlist.findIndex(w => w.id === id);
  if (waitlistIndex === -1) {
    res.status(404).json({ success: false, error: '候补记录不存在' });
    return;
  }

  const waitlistItem = dataStore.waitlist[waitlistIndex];

  if (waitlistItem.studentId !== userId) {
    res.status(403).json({ success: false, error: '无权退出他人的候补' });
    return;
  }

  if (waitlistItem.status === 'cancelled' || waitlistItem.status === 'confirmed') {
    res.status(400).json({ success: false, error: '该候补状态不允许退出' });
    return;
  }

  const scheduleId = waitlistItem.scheduleId;
  const removedPosition = waitlistItem.position;

  waitlistItem.status = 'cancelled';

  dataStore.waitlist
    .filter(w => w.scheduleId === scheduleId && w.status !== 'cancelled' && w.status !== 'confirmed' && w.position > removedPosition)
    .forEach(w => {
      w.position -= 1;
    });

  res.json({ success: true, message: '已退出候补队列' });
});

router.post('/waitlist/:id/claim', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<Reservation>>) => {
  const { id } = req.params;
  const userId = (req as Request & { userId: string; userRole: string }).userId;

  cleanExpiredLocks();

  const waitlistItem = dataStore.waitlist.find(w => w.id === id);
  if (!waitlistItem) {
    res.status(404).json({ success: false, error: '候补记录不存在' });
    return;
  }

  if (waitlistItem.studentId !== userId) {
    res.status(403).json({ success: false, error: '无权认领他人的候补' });
    return;
  }

  if (waitlistItem.status !== 'notified') {
    res.status(400).json({ success: false, error: '当前状态不允许认领，请等待通知' });
    return;
  }

  const schedule = dataStore.schedules.find(s => s.id === waitlistItem.scheduleId);
  if (!schedule) {
    res.status(404).json({ success: false, error: '排课不存在' });
    return;
  }

  const reservedSeatIds = dataStore.reservations
    .filter(r => r.scheduleId === schedule.id && r.status !== 'cancelled')
    .map(r => r.seatId);

  const availableSeat = dataStore.seats.find(
    s => s.labId === schedule.labId && s.status === 'available' && !reservedSeatIds.includes(s.id)
  );
  if (!availableSeat) {
    res.status(400).json({ success: false, error: '暂无可用座位' });
    return;
  }

  const student = dataStore.users.find(u => u.id === userId);
  if (!student) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const newReservation: Reservation = {
    id: generateId(),
    studentId: userId,
    studentName: student.name,
    scheduleId: schedule.id,
    labId: schedule.labId,
    seatId: availableSeat.id,
    seatNumber: availableSeat.seatNumber,
    status: 'locked',
    lockedAt: now.toISOString(),
    lockExpiresAt: lockExpiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  waitlistItem.status = 'confirmed';

  const scheduleId = waitlistItem.scheduleId;
  const removedPosition = waitlistItem.position;
  dataStore.waitlist
    .filter(w => w.scheduleId === scheduleId && w.status !== 'cancelled' && w.status !== 'confirmed' && w.position > removedPosition)
    .forEach(w => {
      w.position -= 1;
    });

  dataStore.reservations.push(newReservation);
  res.json({ success: true, data: newReservation, message: '座位已锁定，请在15分钟内确认' });
});

function recalcWaitlistPositions(scheduleId: string): void {
  const activeItems = dataStore.waitlist
    .filter(w => w.scheduleId === scheduleId && w.status !== 'cancelled' && w.status !== 'confirmed')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  activeItems.forEach((item, idx) => {
    item.position = idx + 1;
  });
}

function notifyNextWaitlist(scheduleId: string, labId: string): void {
  const nextWaiter = dataStore.waitlist
    .filter(w => w.scheduleId === scheduleId && w.status === 'waiting')
    .sort((a, b) => a.position - b.position)[0];

  if (nextWaiter) {
    nextWaiter.status = 'notified';
    nextWaiter.notifiedAvailableAt = new Date().toISOString();
  }
}

function cleanExpiredLocks(): void {
  const now = new Date();

  const expiredReservationsBySchedule: Record<string, { labId: string }> = {};

  dataStore.reservations = dataStore.reservations.filter(reservation => {
    if (reservation.status === 'locked' && reservation.lockExpiresAt) {
      if (new Date(reservation.lockExpiresAt) < now) {
        expiredReservationsBySchedule[reservation.scheduleId] = { labId: reservation.labId };
        return false;
      }
    }
    return true;
  });

  Object.entries(expiredReservationsBySchedule).forEach(([scheduleId, { labId }]) => {
    notifyNextWaitlist(scheduleId, labId);
  });

  const expiredNotifiedBySchedule: Record<string, { labId: string }> = {};

  dataStore.waitlist.forEach(item => {
    if (item.status === 'notified' && item.notifiedAvailableAt) {
      const notifiedTime = new Date(item.notifiedAvailableAt).getTime();
      const timeout = 15 * 60 * 1000;
      if (now.getTime() - notifiedTime > timeout) {
        const currentCount = item.missedNotifiedCount ?? 0;
        const newCount = currentCount + 1;

        item.missedNotifiedCount = newCount;
        item.createdAt = now.toISOString();
        delete item.notifiedAvailableAt;

        if (newCount >= 2) {
          item.status = 'cancelled';
        } else {
          item.status = 'waiting';
        }

        recalcWaitlistPositions(item.scheduleId);
        expiredNotifiedBySchedule[item.scheduleId] = { labId: item.labId };
      }
    }
  });

  Object.entries(expiredNotifiedBySchedule).forEach(([scheduleId, { labId }]) => {
    notifyNextWaitlist(scheduleId, labId);
  });
}

export default router;
