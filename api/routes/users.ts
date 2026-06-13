import { Router, Request, Response } from 'express';
import { dataStore } from '../data/mockData';
import { authenticate, requireAdmin } from '../middleware/auth';
import type { User, ApiResponse } from '../../shared/types';

const router = Router();

router.get('/', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<User[]>>) => {
  const { role, department } = req.query;
  let users = [...dataStore.users];

  if (role) {
    users = users.filter(u => u.role === role);
  }
  if (department) {
    users = users.filter(u => u.department === department);
  }

  res.json({ success: true, data: users as User[] });
});

router.put('/:id', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<User>>) => {
  const { id } = req.params;
  const userData = req.body as Partial<User>;

  const index = dataStore.users.findIndex(u => u.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  dataStore.users[index] = { ...dataStore.users[index], ...userData };
  res.json({ success: true, data: dataStore.users[index] as User, message: '用户信息更新成功' });
});

export default router;
