import { Router, Request, Response } from 'express';
import { generateDashboardStats } from '../data/mockData';
import { authenticate } from '../middleware/auth';
import type { DashboardStats, ApiResponse } from '../../shared/types';

const router = Router();

router.get('/stats', authenticate, (req: Request, res: Response<ApiResponse<DashboardStats>>) => {
  const stats = generateDashboardStats();
  res.json({ success: true, data: stats });
});

router.get('/stats/stream', authenticate, (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendStats = () => {
    const stats = generateDashboardStats();
    res.write(`data: ${JSON.stringify({ success: true, data: stats })}\n\n`);
  };

  sendStats();

  const intervalId = setInterval(sendStats, 5000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

export default router;
