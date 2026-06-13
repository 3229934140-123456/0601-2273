import { useState, useEffect } from 'react';
import {
  Beaker,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  X,
  Filter,
  User as UserIcon,
  ShoppingCart,
  Send,
  Package,
  ChevronRight,
} from 'lucide-react';
import { chemicalAPI, userAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type {
  Chemical,
  ChemicalRequest,
  PurchaseRequest,
  User,
} from '../../shared/types';
import { cn } from '@/lib/utils';

const HAZARD_LEVEL_CONFIG = {
  low: { label: '低', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: '中', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: '高', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  extreme: { label: '极高', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const REQUEST_STATUS_CONFIG = {
  pending: { label: '待导师审批', className: 'bg-warning/20 text-warning border-warning/30' },
  approved: { label: '已批准', className: 'bg-success/20 text-success border-success/30' },
  rejected: { label: '已驳回', className: 'bg-danger/20 text-danger border-danger/30' },
  completed: { label: '已完成', className: 'bg-primary-500/20 text-primary-400 border-primary-500/30' },
};

const PURCHASE_STATUS_CONFIG = {
  pending: { label: '待审批', className: 'bg-warning/20 text-warning border-warning/30' },
  approved: { label: '已批准', className: 'bg-info/20 text-info border-info/30' },
  rejected: { label: '已驳回', className: 'bg-danger/20 text-danger border-danger/30' },
  ordered: { label: '已订购', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  received: { label: '已入库', className: 'bg-success/20 text-success border-success/30' },
};

interface RequestFormData {
  chemicalId: string;
  quantity: number;
  purpose: string;
  supervisorId: string;
}

export default function Chemical() {
  const { user, hasRole } = useAuthStore();
  const isAdminOrLeader = hasRole('admin', 'leader');
  const isTeacher = hasRole('teacher') && !isAdminOrLeader;

  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [chemicalRequests, setChemicalRequests] = useState<ChemicalRequest[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'purchase'>('inventory');
  const [filters, setFilters] = useState({
    hazardLevel: '',
    category: '',
  });

  const [formData, setFormData] = useState<RequestFormData>({
    chemicalId: '',
    quantity: 1,
    purpose: '',
    supervisorId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [newRequestId, setNewRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: { hazardLevel?: string; category?: string } = {};
      if (filters.hazardLevel) params.hazardLevel = filters.hazardLevel;
      if (filters.category) params.category = filters.category;

      const [chemicalsRes, requestsRes] = await Promise.all([
        chemicalAPI.list(params),
        chemicalAPI.getRequests(),
      ]);

      if (chemicalsRes.data.success && chemicalsRes.data.data) {
        setChemicals(chemicalsRes.data.data);
      }
      if (requestsRes.data.success && requestsRes.data.data) {
        setChemicalRequests(requestsRes.data.data);
      }

      if (isAdminOrLeader) {
        const purchaseRes = await chemicalAPI.getPurchaseRequests();
        if (purchaseRes.data.success && purchaseRes.data.data) {
          setPurchaseRequests(purchaseRes.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newRequestId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`request-${newRequestId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => {
          setNewRequestId(null);
        }, 3000);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [newRequestId, chemicalRequests]);

  const fetchTeachers = async () => {
    try {
      const response = await userAPI.list({ role: 'teacher' });
      if (response.data.success && response.data.data) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const getStockStatus = (current: number, safety: number) => {
    if (current < safety * 0.5) return { status: '不足', className: 'bg-danger/20 text-danger border-danger/30' };
    if (current < safety) return { status: '预警', className: 'bg-warning/20 text-warning border-warning/30' };
    return { status: '正常', className: 'bg-success/20 text-success border-success/30' };
  };

  const getStockProgressColor = (current: number, safety: number) => {
    const ratio = current / safety;
    if (ratio < 0.5) return '#F53F3F';
    if (ratio < 1) return '#FF7D00';
    return '#00B42A';
  };

  const handleRequestClick = (chemical: Chemical) => {
    setSelectedChemical(chemical);
    setFormData({
      chemicalId: chemical.id,
      quantity: 1,
      purpose: '',
      supervisorId: '',
    });
    setShowRequestForm(true);
  };

  const handleSubmitRequest = async () => {
    if (!formData.chemicalId || !formData.quantity || !formData.purpose || !formData.supervisorId) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const response = await chemicalAPI.request(formData);
      if (response.data.success && response.data.data) {
        const newRequest = response.data.data;
        setShowRequestForm(false);
        resetForm();
        setActiveTab('requests');
        setNewRequestId(newRequest.id);
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      chemicalId: '',
      quantity: 1,
      purpose: '',
      supervisorId: '',
    });
    setSelectedChemical(null);
  };

  const getRequestStep = (request: ChemicalRequest) => {
    if (request.status === 'rejected') return 4;
    if (request.supervisorStatus !== 'approved') return 1;
    if (request.directorStatus !== 'approved') return 2;
    if (request.status === 'approved') return 3;
    return 1;
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('zh-CN');
  };

  const getApprovalStatusConfig = (status: 'pending' | 'approved' | 'rejected') => {
    if (status === 'approved') return { label: '通过', className: 'bg-success/20 text-success border-success/30' };
    if (status === 'rejected') return { label: '驳回', className: 'bg-danger/20 text-danger border-danger/30' };
    return { label: '待审批', className: 'bg-warning/20 text-warning border-warning/30' };
  };

  const lowStockChemicals = chemicals.filter((c) => c.currentStock < c.safetyStock);
  const categories = Array.from(new Set(chemicals.map((c) => c.category)));

  if (loading && chemicals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <Beaker className="inline w-8 h-8 mr-3 text-primary-400" />
              危化品管理
            </h1>
            <p className="text-dark-500">管理危化品库存、领用申请和采购流程</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              activeTab === 'inventory'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-300/50 text-dark-500 hover:text-white hover:bg-dark-300'
            )}
          >
            <Package className="inline w-4 h-4 mr-2" />
            库存列表
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              activeTab === 'requests'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-300/50 text-dark-500 hover:text-white hover:bg-dark-300'
            )}
          >
            <Send className="inline w-4 h-4 mr-2" />
            {isTeacher ? '我的申请' : '领用审批'}
            {isAdminOrLeader && chemicalRequests.some((r) => r.status === 'pending') && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-white rounded-full">
                {chemicalRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
          {isAdminOrLeader && (
            <button
              onClick={() => setActiveTab('purchase')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                activeTab === 'purchase'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-300/50 text-dark-500 hover:text-white hover:bg-dark-300'
              )}
            >
              <ShoppingCart className="inline w-4 h-4 mr-2" />
              采购申请
              {purchaseRequests.some((p) => p.status === 'pending') && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-white rounded-full">
                  {purchaseRequests.filter((p) => p.status === 'pending').length}
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === 'inventory' && (
          <>
            <div className="glass-card p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-dark-500" />
                  <span className="text-dark-500 text-sm">筛选:</span>
                </div>
                <div>
                  <select
                    value={filters.hazardLevel}
                    onChange={(e) => setFilters((prev) => ({ ...prev, hazardLevel: e.target.value }))}
                    className="input-field w-auto"
                  >
                    <option value="">全部危害等级</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="extreme">极高</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                    className="input-field w-auto"
                  >
                    <option value="">全部分类</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setFilters({ hazardLevel: '', category: '' })}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  重置
                </button>
              </div>
            </div>

            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-400" />
                  危化品库存
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    正常
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    预警
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger" />
                    不足
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        名称
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        CAS号
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        分类
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        危害等级
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        当前库存
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        安全库存
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        库存状态
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        存放位置
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chemicals.map((chemical, index) => {
                      const stockStatus = getStockStatus(chemical.currentStock, chemical.safetyStock);
                      const hazardConfig = HAZARD_LEVEL_CONFIG[chemical.hazardLevel];
                      return (
                        <tr
                          key={chemical.id}
                          className={cn(
                            'border-b border-dark-400/50 hover:bg-dark-300/30 transition-colors',
                            index % 2 === 0 ? 'bg-dark-200/20' : 'bg-dark-200/10'
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">{chemical.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-400 font-mono text-sm">{chemical.casNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-300">{chemical.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', hazardConfig.className)}>
                              {hazardConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">
                                {chemical.currentStock} {chemical.unit}
                              </span>
                              <div className="w-24 h-2 bg-dark-400 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min((chemical.currentStock / chemical.safetyStock) * 100, 100)}%`,
                                    backgroundColor: getStockProgressColor(chemical.currentStock, chemical.safetyStock),
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-300">
                              {chemical.safetyStock} {chemical.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', stockStatus.className)}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-300">{chemical.location}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRequestClick(chemical)}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              <Plus className="inline w-3 h-3 mr-1" />
                              领用
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {lowStockChemicals.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  库存预警
                </h2>
                <div className="space-y-3">
                  {lowStockChemicals.map((chemical) => {
                    const stockStatus = getStockStatus(chemical.currentStock, chemical.safetyStock);
                    const existingPurchase = purchaseRequests.find(
                      (p) => p.chemicalId === chemical.id && p.status !== 'rejected' && p.status !== 'received'
                    );
                    return (
                      <div
                        key={chemical.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border',
                          chemical.currentStock < chemical.safetyStock * 0.5
                            ? 'bg-danger/10 border-danger/30'
                            : 'bg-warning/10 border-warning/30'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <AlertCircle className={cn(
                            'w-6 h-6 flex-shrink-0',
                            chemical.currentStock < chemical.safetyStock * 0.5 ? 'text-danger' : 'text-warning'
                          )} />
                          <div>
                            <p className="text-white font-medium">{chemical.name}</p>
                            <p className="text-dark-400 text-sm">
                              当前库存: {chemical.currentStock} {chemical.unit} / 安全库存: {chemical.safetyStock} {chemical.unit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', stockStatus.className)}>
                            {stockStatus.status}
                          </span>
                          {existingPurchase ? (
                            <span className={cn(
                              'px-3 py-1 rounded-lg text-sm',
                              PURCHASE_STATUS_CONFIG[existingPurchase.status].className
                            )}>
                              {PURCHASE_STATUS_CONFIG[existingPurchase.status].label}
                            </span>
                          ) : (
                            <span className="text-primary-400 text-sm flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              自动触发采购
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary-400" />
              {isTeacher ? '我的申请' : '领用审批流程'}
            </h2>
            <div className="space-y-4">
              {chemicalRequests.length === 0 ? (
                <div className="text-center py-12 text-dark-500">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无领用申请记录</p>
                </div>
              ) : (
                chemicalRequests.map((request) => {
                  const step = getRequestStep(request);
                  const statusConfig = REQUEST_STATUS_CONFIG[request.status];
                  const isNewRequest = newRequestId === request.id;
                  const supervisorStatusConfig = getApprovalStatusConfig(request.supervisorStatus);
                  const directorStatusConfig = getApprovalStatusConfig(request.directorStatus);
                  return (
                    <div
                      key={request.id}
                      id={`request-${request.id}`}
                      className={cn(
                        'bg-dark-300/30 rounded-lg p-4 border transition-all duration-300',
                        isNewRequest
                          ? 'border-primary-500 border-2 animate-pulse shadow-lg shadow-primary-500/20'
                          : 'border-dark-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-medium">{request.chemicalName}</h3>
                          <p className="text-dark-400 text-sm">
                            申请人: {request.requesterName} · 申请时间: {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', statusConfig.className)}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="bg-dark-200/50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-dark-500">申请用量:</span>
                            <span className="text-white ml-2 font-medium">{request.quantity}</span>
                          </div>
                          <div>
                            <span className="text-dark-500">用途:</span>
                            <span className="text-white ml-2">{request.purpose}</span>
                          </div>
                          <div>
                            <span className="text-dark-500">导师:</span>
                            <span className="text-white ml-2">{teachers.find((t) => t.id === request.supervisorId)?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {[
                            { step: 1, label: '提交申请', done: step >= 1 },
                            { step: 2, label: '导师审批', done: step >= 2 && request.supervisorStatus === 'approved' },
                            { step: 3, label: '主任审批', done: step >= 3 && request.directorStatus === 'approved' },
                            { step: 4, label: '完成', done: step >= 4 },
                          ].map((item, index) => (
                            <div key={item.step} className="flex items-center">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                                item.done ? 'bg-primary-500 text-white' : 'bg-dark-400 text-dark-500'
                              )}>
                                {item.done && item.step < 4 ? <CheckCircle className="w-5 h-5" /> : item.step}
                              </div>
                              <span className={cn('ml-2 text-sm', item.done ? 'text-white' : 'text-dark-500')}>
                                {item.label}
                              </span>
                              {index < 3 && (
                                <div className={cn(
                                  'w-12 h-0.5 mx-2',
                                  item.done ? 'bg-primary-500' : 'bg-dark-400'
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-400/50">
                        <div className="text-sm">
                          <div className="text-dark-500 mb-1">提交</div>
                          <div className="text-white text-xs">{formatDateTime(request.createdAt)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-dark-500 mb-1 flex items-center gap-1">
                            导师审批
                            {request.supervisorStatus !== 'pending' && (
                              <span className={cn('px-1.5 py-0.5 rounded text-xs border', supervisorStatusConfig.className)}>
                                {supervisorStatusConfig.label}
                              </span>
                            )}
                          </div>
                          {request.supervisorStatus === 'pending' ? (
                            <div className="text-warning text-xs">待审批</div>
                          ) : (
                            <>
                              <div className="text-white text-xs">{formatDateTime(request.supervisorApprovedAt)}</div>
                              {request.supervisorComment && (
                                <div className="text-dark-400 text-xs mt-0.5">{request.supervisorComment}</div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="text-dark-500 mb-1 flex items-center gap-1">
                            主任审批
                            {request.directorStatus !== 'pending' && (
                              <span className={cn('px-1.5 py-0.5 rounded text-xs border', directorStatusConfig.className)}>
                                {directorStatusConfig.label}
                              </span>
                            )}
                          </div>
                          {request.directorStatus === 'pending' ? (
                            <div className="text-warning text-xs">待审批</div>
                          ) : (
                            <>
                              <div className="text-white text-xs">{formatDateTime(request.directorApprovedAt)}</div>
                              {request.directorComment && (
                                <div className="text-dark-400 text-xs mt-0.5">{request.directorComment}</div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="text-dark-500 mb-1">完成</div>
                          {request.completedAt ? (
                            <div className="text-white text-xs">{formatDateTime(request.completedAt)}</div>
                          ) : request.status === 'rejected' ? (
                            <div className="text-danger text-xs">已驳回</div>
                          ) : (
                            <div className="text-dark-500 text-xs">进行中</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'purchase' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
              采购申请
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      危化品名称
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      采购数量
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      原因
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      申请人
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      申请时间
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-dark-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>暂无采购申请记录</p>
                      </td>
                    </tr>
                  ) : (
                    purchaseRequests.map((pr, index) => {
                      const statusConfig = PURCHASE_STATUS_CONFIG[pr.status];
                      return (
                        <tr
                          key={pr.id}
                          className={cn(
                            'border-b border-dark-400/50 hover:bg-dark-300/30 transition-colors',
                            index % 2 === 0 ? 'bg-dark-200/20' : 'bg-dark-200/10'
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">{pr.chemicalName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white">{pr.quantity}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-300">{pr.reason}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-300">
                              {teachers.find((t) => t.id === pr.createdBy)?.name || pr.createdBy}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-dark-400 text-sm">
                              {new Date(pr.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', statusConfig.className)}>
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary-400" />
                申请领用
              </h3>
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  resetForm();
                }}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>

            {selectedChemical && (
              <div className="bg-dark-300/50 rounded-lg p-4 mb-6">
                <h4 className="text-white font-medium mb-2">{selectedChemical.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-dark-400">
                    CAS号: <span className="text-white">{selectedChemical.casNumber}</span>
                  </p>
                  <p className="text-dark-400">
                    当前库存: <span className="text-white">{selectedChemical.currentStock} {selectedChemical.unit}</span>
                  </p>
                  <p className="text-dark-400">
                    分类: <span className="text-white">{selectedChemical.category}</span>
                  </p>
                  <p className="text-dark-400">
                    单价: <span className="text-white">¥{selectedChemical.unitPrice}/{selectedChemical.unit}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  领用数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                  }
                  className="input-field"
                  placeholder="请输入领用数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  用途
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, purpose: e.target.value }))
                  }
                  className="input-field min-h-[80px] resize-none"
                  placeholder="请输入使用用途"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  <UserIcon className="inline w-4 h-4 mr-1" />
                  选择导师
                </label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, supervisorId: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">请选择导师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  resetForm();
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
