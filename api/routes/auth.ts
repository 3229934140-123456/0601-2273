import { Router, Request, Response } from 'express';
import { dataStore } from '../data/mockData';
import { setToken, authenticate } from '../middleware/auth';
import type { LoginRequest, ApiResponse, LoginResponse, User } from '../../shared/types';

const router = Router();

router.post('/login', (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }

  const user = dataStore.users.find(u => u.username === username);
  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }

  if (password !== '123456') {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }

  const token = setToken(user.id, user.role);
  res.json({
    success: true,
    data: {
      token,
      user: user as User,
    },
  });
});

router.get('/me', authenticate, (req: Request, res: Response<ApiResponse<User>>) => {
  const userId = (req as Request & { userId: string }).userId;
  const user = dataStore.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }
  res.json({ success: true, data: user as User });
});

export default router;
