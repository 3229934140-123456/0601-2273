import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../shared/types';

const tokens = new Map<string, { userId: string; role: UserRole }>();

export function setToken(userId: string, role: UserRole): string {
  const token = `token_${userId}_${Date.now()}`;
  tokens.set(token, { userId, role });
  return token;
}

export function removeToken(token: string): void {
  tokens.delete(token);
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未授权访问' });
    return;
  }

  const token = authHeader.substring(7);
  const tokenData = tokens.get(token);
  if (!tokenData) {
    res.status(401).json({ success: false, error: '无效的访问令牌' });
    return;
  }

  (req as Request & { userId: string; userRole: UserRole; token: string }).userId = tokenData.userId;
  (req as Request & { userId: string; userRole: UserRole; token: string }).userRole = tokenData.role;
  (req as Request & { userId: string; userRole: UserRole; token: string }).token = token;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const userRole = (req as Request & { userRole: UserRole }).userRole;
    if (!roles.includes(userRole)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }
    next();
  };
}

export const requireStudent = requireRole('student', 'teacher', 'admin', 'leader');
export const requireTeacher = requireRole('teacher', 'admin', 'leader');
export const requireAdmin = requireRole('admin', 'leader');
export const requireLeader = requireRole('leader');
