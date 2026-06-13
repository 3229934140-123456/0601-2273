import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireStudent } from '../middleware/auth';
import type { Reservation, Seat, ApiResponse } from '../../shared/types';

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

  const existingReservation = dataStore.reservations.find(
    r => r.scheduleId === scheduleId && r.studentId === userId && r.status !== 'cancelled'
  );
  if (existingReservation) {
    res.status(400).json({ success: false, error: '您已预约该排课的座位' });
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

  seat.status = 'locked';

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

  const seat = dataStore.seats.find(s => s.id === reservation.seatId);
  if (seat) {
    seat.status = 'occupied';
  }

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

function cleanExpiredLocks(): void {
  const now = new Date();

  dataStore.reservations = dataStore.reservations.filter(reservation => {
    if (reservation.status === 'locked' && reservation.lockExpiresAt) {
      if (new Date(reservation.lockExpiresAt) < now) {
        const seat = dataStore.seats.find(s => s.id === reservation.seatId);
        if (seat && seat.status === 'locked') {
          seat.status = 'available';
        }
        return false;
      }
    }
    return true;
  });
}

export default router;
