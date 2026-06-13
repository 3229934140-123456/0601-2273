import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireTeacher, requireAdmin } from '../middleware/auth';
import type { Chemical, ChemicalRequest, PurchaseRequest, ApiResponse } from '../../shared/types';

const router = Router();

router.get('/', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<Chemical[]>>) => {
  const { hazardLevel, category } = req.query;
  let chemicals = [...dataStore.chemicals];

  if (hazardLevel) {
    chemicals = chemicals.filter(c => c.hazardLevel === hazardLevel);
  }
  if (category) {
    chemicals = chemicals.filter(c => c.category === category);
  }

  res.json({ success: true, data: chemicals as Chemical[] });
});

router.post('/request', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<ChemicalRequest>>) => {
  const { chemicalId, quantity, purpose, supervisorId } = req.body as Omit<ChemicalRequest, 'id' | 'chemicalName' | 'requesterId' | 'requesterName' | 'supervisorStatus' | 'directorId' | 'directorStatus' | 'status' | 'createdAt'>;

  const chemical = dataStore.chemicals.find(c => c.id === chemicalId);
  if (!chemical) {
    res.status(404).json({ success: false, error: '危化品不存在' });
    return;
  }

  const requester = dataStore.users.find(u => u.id === (req as Request & { userId: string }).userId);
  if (!requester) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  const supervisor = dataStore.users.find(u => u.id === supervisorId);
  if (!supervisor || supervisor.role !== 'teacher') {
    res.status(400).json({ success: false, error: '导师不存在或角色不正确' });
    return;
  }

  const director = dataStore.users.find(u => u.role === 'admin' || u.role === 'leader');
  if (!director) {
    res.status(500).json({ success: false, error: '系统错误，未找到审批人' });
    return;
  }

  const newRequest: ChemicalRequest = {
    id: generateId(),
    chemicalId,
    chemicalName: chemical.name,
    requesterId: requester.id,
    requesterName: requester.name,
    quantity,
    purpose,
    supervisorId,
    supervisorStatus: 'pending',
    directorId: director.id,
    directorStatus: 'pending',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  dataStore.chemicalRequests.push(newRequest);
  res.json({ success: true, data: newRequest, message: '领用申请已提交' });
});

router.post('/request/:id/approve-supervisor', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<ChemicalRequest>>) => {
  const { id } = req.params;
  const { approved, comment } = req.body as { approved: boolean; comment?: string };

  const index = dataStore.chemicalRequests.findIndex(r => r.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '申请不存在' });
    return;
  }

  const request = dataStore.chemicalRequests[index];
  const userId = (req as Request & { userId: string }).userId;

  if (request.supervisorId !== userId) {
    res.status(403).json({ success: false, error: '您不是该申请的导师，无权审批' });
    return;
  }

  if (request.supervisorStatus !== 'pending') {
    res.status(400).json({ success: false, error: '该申请已被导师审批' });
    return;
  }

  request.supervisorStatus = approved ? 'approved' : 'rejected';
  if (comment) {
    request.supervisorComment = comment;
  }

  if (!approved) {
    request.status = 'rejected';
  } else if (request.directorStatus === 'approved') {
    request.status = 'approved';
    const chemical = dataStore.chemicals.find(c => c.id === request.chemicalId);
    if (chemical) {
      chemical.currentStock -= request.quantity;
      checkAndTriggerPurchase(chemical);
    }
  }

  dataStore.chemicalRequests[index] = request;
  res.json({ success: true, data: request, message: approved ? '导师审批通过' : '导师审批驳回' });
});

router.post('/request/:id/approve-director', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<ChemicalRequest>>) => {
  const { id } = req.params;
  const { approved, comment } = req.body as { approved: boolean; comment?: string };

  const index = dataStore.chemicalRequests.findIndex(r => r.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '申请不存在' });
    return;
  }

  const request = dataStore.chemicalRequests[index];

  if (request.directorStatus !== 'pending') {
    res.status(400).json({ success: false, error: '该申请已被主任审批' });
    return;
  }

  request.directorStatus = approved ? 'approved' : 'rejected';
  if (comment) {
    request.directorComment = comment;
  }

  if (!approved) {
    request.status = 'rejected';
  } else if (request.supervisorStatus === 'approved') {
    request.status = 'approved';
    const chemical = dataStore.chemicals.find(c => c.id === request.chemicalId);
    if (chemical) {
      chemical.currentStock -= request.quantity;
      checkAndTriggerPurchase(chemical);
    }
  }

  dataStore.chemicalRequests[index] = request;
  res.json({ success: true, data: request, message: approved ? '主任审批通过' : '主任审批驳回' });
});

router.get('/purchase-requests', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<PurchaseRequest[]>>) => {
  res.json({ success: true, data: dataStore.purchaseRequests as PurchaseRequest[] });
});

router.post('/purchase-requests', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<PurchaseRequest>>) => {
  const { chemicalId, quantity, reason } = req.body as Omit<PurchaseRequest, 'id' | 'chemicalName' | 'status' | 'createdBy' | 'createdAt'>;

  const chemical = dataStore.chemicals.find(c => c.id === chemicalId);
  if (!chemical) {
    res.status(404).json({ success: false, error: '危化品不存在' });
    return;
  }

  const userId = (req as Request & { userId: string }).userId;

  const newPurchaseRequest: PurchaseRequest = {
    id: generateId(),
    chemicalId,
    chemicalName: chemical.name,
    quantity,
    reason,
    status: 'pending',
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };

  dataStore.purchaseRequests.push(newPurchaseRequest);
  res.json({ success: true, data: newPurchaseRequest, message: '采购申请已创建' });
});

router.put('/purchase-requests/:id', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<PurchaseRequest>>) => {
  const { id } = req.params;
  const { status } = req.body as { status: PurchaseRequest['status'] };

  const index = dataStore.purchaseRequests.findIndex(p => p.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '采购申请不存在' });
    return;
  }

  const purchaseRequest = dataStore.purchaseRequests[index];
  purchaseRequest.status = status;

  if (status === 'received') {
    const chemical = dataStore.chemicals.find(c => c.id === purchaseRequest.chemicalId);
    if (chemical) {
      chemical.currentStock += purchaseRequest.quantity;
    }
  }

  dataStore.purchaseRequests[index] = purchaseRequest;
  res.json({ success: true, data: purchaseRequest, message: '采购申请已更新' });
});

function checkAndTriggerPurchase(chemical: Chemical): void {
  if (chemical.currentStock < chemical.safetyStock) {
    const existingPending = dataStore.purchaseRequests.find(
      p => p.chemicalId === chemical.id && p.status === 'pending'
    );
    if (!existingPending) {
      const admin = dataStore.users.find(u => u.role === 'admin');
      if (admin) {
        const purchaseRequest: PurchaseRequest = {
          id: generateId(),
          chemicalId: chemical.id,
          chemicalName: chemical.name,
          quantity: chemical.safetyStock * 2,
          reason: '库存低于安全线，自动触发采购',
          status: 'pending',
          createdBy: admin.id,
          createdAt: new Date().toISOString(),
        };
        dataStore.purchaseRequests.push(purchaseRequest);
      }
    }
  }
}

export default router;
