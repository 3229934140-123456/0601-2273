import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireStudent, requireTeacher } from '../middleware/auth';
import type { Equipment, EquipmentBorrow, ApiResponse } from '../../shared/types';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response<ApiResponse<Equipment[]>>) => {
  const { status, category, labId } = req.query;
  let equipments = [...dataStore.equipments];

  if (status) {
    equipments = equipments.filter(e => e.status === status);
  }
  if (category) {
    equipments = equipments.filter(e => e.category === category);
  }
  if (labId) {
    equipments = equipments.filter(e => e.labId === labId);
  }

  res.json({ success: true, data: equipments as Equipment[] });
});

router.post('/borrow', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<EquipmentBorrow>>) => {
  const { equipmentId, purpose, expectedReturnDate } = req.body as {
    equipmentId: string;
    purpose: string;
    expectedReturnDate: string;
  };

  const equipment = dataStore.equipments.find(e => e.id === equipmentId);
  if (!equipment) {
    res.status(404).json({ success: false, error: '设备不存在' });
    return;
  }

  if (equipment.status !== 'available') {
    res.status(400).json({ success: false, error: '设备当前不可借用' });
    return;
  }

  const { userId, userRole } = req as Request & { userId: string; userRole: string };
  const borrower = dataStore.users.find(u => u.id === userId);
  if (!borrower) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  const borrowDate = new Date().toISOString().split('T')[0];
  const newBorrow: EquipmentBorrow = {
    id: generateId(),
    equipmentId,
    equipmentName: equipment.name,
    borrowerId: userId,
    borrowerName: borrower.name,
    purpose,
    borrowDate,
    expectedReturnDate,
    status: 'pending',
  };

  dataStore.equipmentBorrows.push(newBorrow);
  res.json({ success: true, data: newBorrow, message: '借用申请已提交，等待审批' });
});

router.post('/:id/return', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<EquipmentBorrow>>) => {
  const { id } = req.params;
  const { userId, userRole } = req as Request & { userId: string; userRole: string };

  const borrowIndex = dataStore.equipmentBorrows.findIndex(eb => eb.id === id);
  if (borrowIndex === -1) {
    res.status(404).json({ success: false, error: '借用记录不存在' });
    return;
  }

  const borrow = dataStore.equipmentBorrows[borrowIndex];
  if (borrow.borrowerId !== userId) {
    res.status(403).json({ success: false, error: '无权归还他人借用的设备' });
    return;
  }

  if (borrow.status !== 'approved' && borrow.status !== 'borrowed' && borrow.status !== 'overdue') {
    res.status(400).json({ success: false, error: '该设备无法归还' });
    return;
  }

  const equipment = dataStore.equipments.find(e => e.id === borrow.equipmentId);
  if (equipment) {
    equipment.status = 'available';
  }

  const actualReturnDate = new Date().toISOString().split('T')[0];
  const expectedDate = new Date(borrow.expectedReturnDate);
  const returnDate = new Date(actualReturnDate);
  const isOverdue = returnDate > expectedDate;

  let creditPenalty = 0;
  if (isOverdue) {
    const daysOverdue = Math.ceil((returnDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
    creditPenalty = Math.min(daysOverdue * 2, 20);
    const borrower = dataStore.users.find(u => u.id === borrow.borrowerId);
    if (borrower) {
      borrower.creditScore = Math.max(0, borrower.creditScore - creditPenalty);
    }
  }

  dataStore.equipmentBorrows[borrowIndex] = {
    ...borrow,
    actualReturnDate,
    status: 'returned',
    creditPenalty: isOverdue ? creditPenalty : undefined,
  };

  const message = isOverdue
    ? `设备已归还，逾期${Math.ceil((returnDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))}天，扣除信用分${creditPenalty}分`
    : '设备归还成功';

  res.json({ success: true, data: dataStore.equipmentBorrows[borrowIndex], message });
});

router.get('/borrow/my', authenticate, requireStudent, (req: Request, res: Response<ApiResponse<EquipmentBorrow[]>>) => {
  const { userId, userRole } = req as Request & { userId: string; userRole: string };
  let borrows = [...dataStore.equipmentBorrows];

  borrows = borrows.filter(eb => eb.borrowerId === userId);

  res.json({ success: true, data: borrows as EquipmentBorrow[] });
});

router.put('/borrow/:id/approve', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<EquipmentBorrow>>) => {
  const { id } = req.params;
  const { action, comment } = req.body as { action: 'approve' | 'reject'; comment?: string };
  const { userId } = req as Request & { userId: string };

  const borrowIndex = dataStore.equipmentBorrows.findIndex(eb => eb.id === id);
  if (borrowIndex === -1) {
    res.status(404).json({ success: false, error: '借用记录不存在' });
    return;
  }

  const borrow = dataStore.equipmentBorrows[borrowIndex];
  if (borrow.status !== 'pending') {
    res.status(400).json({ success: false, error: '该申请已处理' });
    return;
  }

  if (action === 'approve') {
    const equipment = dataStore.equipments.find(e => e.id === borrow.equipmentId);
    if (!equipment || equipment.status !== 'available') {
      res.status(400).json({ success: false, error: '设备当前不可借用' });
      return;
    }

    equipment.status = 'borrowed';
    dataStore.equipmentBorrows[borrowIndex] = {
      ...borrow,
      status: 'borrowed',
      approverId: userId,
    };
    res.json({ success: true, data: dataStore.equipmentBorrows[borrowIndex], message: '借用已批准' });
  } else {
    dataStore.equipmentBorrows[borrowIndex] = {
      ...borrow,
      status: 'rejected',
      approverId: userId,
    };
    res.json({ success: true, data: dataStore.equipmentBorrows[borrowIndex], message: '借用已拒绝' });
  }
});

export default router;
