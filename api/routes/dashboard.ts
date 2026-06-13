import { Router, Request, Response } from 'express';
import { generateDashboardStats } from '../data/mockData';
import { authenticate } from '../middleware/auth';
import type { DashboardStats, ApiResponse } from '../../shared/types';

const router = Router();

router.get('/stats', authenticate, (req: Request, res: Response<ApiResponse<DashboardStats>>) => {
  const stats = generateDashboardStats();
  res.json({ success: true, data: stats });
});

router.get('/stats/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });
  (res as any).flushHeaders?.();

  const sendStats = () => {
    try {
      const stats = generateDashboardStats();
      const payload = `data: ${JSON.stringify({ success: true, data: stats, timestamp: Date.now() })}\n\n`;
      res.write(payload);
      const sock = res.socket as any;
      sock?.flush?.();
    } catch (err) {
      console.error('[SSE] send error:', err);
    }
  };

  sendStats();

  const intervalId = setInterval(sendStats, 5000);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
      const sock = res.socket as any;
      sock?.flush?.();
    } catch {
      /* ignore */
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(intervalId);
    clearInterval(heartbeat);
    try {
      res.end();
    } catch {
      /* ignore */
    }
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('finish', cleanup);
  res.on('error', cleanup);
});

export default router;
