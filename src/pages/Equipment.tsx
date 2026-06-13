import { useState, useEffect } from 'react';
import {
  Wrench,
  Monitor,
  Cpu,
  FlaskConical,
  Radio,
  Network,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
  Clock,
  RotateCcw,
  CreditCard,
  Search,
  Package,
} from 'lucide-react';
import { equipmentAPI, authAPI } from '@/services/api';
import type { Equipment, EquipmentBorrow, User } from '../../shared/types';
import { cn } from '@/lib/utils';

const EQUIPMENT_CATEGORIES = [
  { id: 'all', name: '全部', icon: Package },
  { id: '计算机', name: '计算机', icon: Monitor },
  { id: '电子设备', name: '电子设备', icon: Cpu },
  { id: '化学器皿', name: '化学器皿', icon: FlaskConical },
  { id: '显示设备', name: '显示设备', icon: Monitor },
  { id: '网络设备', name: '网络设备', icon: Network },
  { id: '测量仪器', name: '测量仪器', icon: Radio },
];

const EQUIPMENT_STATUS_CONFIG = {
  available: { color: 'bg-success', borderColor: 'border-success', label: '可借用' },
  borrowed: { color: 'bg-primary-500', borderColor: 'border-primary-500', label: '已借出' },
  maintenance: { color: 'bg-warning', borderColor: 'border-warning', label: '维修中' },
  lost: { color: 'bg-danger', borderColor: 'border-danger', label: '丢失' },
};

interface CreditGaugeProps {
  score: number;
}

function CreditGauge({ score }: CreditGaugeProps) {
  const percentage = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const getColor = () => {
    if (score >= 80) return '#00B42A';
    if (score >= 60) return '#FF7D00';
    return '#F53F3F';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="#3C4253"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white number-counter">
            {score}
          </span>
          <span className="text-xs text-dark-500">信用分</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className={cn(
          'text-sm font-medium',
          score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger'
        )}>
          {score >= 80 ? '信用良好' : score >= 60 ? '信用一般' : '信用较差'}
        </p>
      </div>
    </div>
  );
}

interface EquipmentCardProps {
  equipment: Equipment;
  onBorrow: (equipment: Equipment) => void;
}

function EquipmentCard({ equipment, onBorrow }: EquipmentCardProps) {
  const statusConfig = EQUIPMENT_STATUS_CONFIG[equipment.status];
  const isAvailable = equipment.status === 'available';

  return (
    <div className={cn(
      'glass-card-hover p-4 transition-all duration-200',
      !isAvailable && 'opacity-70'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center border-2',
          statusConfig.color,
          statusConfig.borderColor
        )}>
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <span className={cn('status-badge', statusConfig.color.replace('bg-', 'status-'))}>
          {statusConfig.label}
        </span>
      </div>
      <h3 className="text-white font-medium mb-1">{equipment.name}</h3>
      <p className="text-dark-500 text-sm mb-2">型号: {equipment.model}</p>
      <div className="text-dark-500 text-xs space-y-1">
        <p>品牌: {equipment.brand}</p>
        <p>位置: {equipment.purchaseDate}</p>
      </div>
      {isAvailable && (
        <button
          onClick={() => onBorrow(equipment)}
          className="btn-primary w-full mt-4 text-sm"
        >
          申请借用
        </button>
      )}
    </div>
  );
}

export default function Equipment() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [myBorrows, setMyBorrows] = useState<EquipmentBorrow[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    purpose: '',
    expectedReturnDate: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUser();
    fetchEquipments();
    fetchMyBorrows();
  }, [selectedCategory]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.me();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const params: { status?: string; category?: string } = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await equipmentAPI.list(params);
      if (response.data.success && response.data.data) {
        setEquipments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBorrows = async () => {
    try {
      const response = await equipmentAPI.myBorrows();
      if (response.data.success && response.data.data) {
        setMyBorrows(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch my borrows:', error);
    }
  };

  const handleBorrowClick = (equipment: Equipment) => {
    if (user && user.creditScore < 60) {
      setMessage({ type: 'error', text: '信用分不足60分，无法借用设备' });
      return;
    }
    setSelectedEquipment(equipment);
    setBorrowForm({ purpose: '', expectedReturnDate: '' });
    setShowBorrowForm(true);
  };

  const handleSubmitBorrow = async () => {
    if (!selectedEquipment || !borrowForm.purpose || !borrowForm.expectedReturnDate) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (borrowForm.expectedReturnDate < today) {
      setMessage({ type: 'error', text: '归还日期不能早于今天' });
      return;
    }

    try {
      const response = await equipmentAPI.borrow({
        equipmentId: selectedEquipment.id,
        purpose: borrowForm.purpose,
        expectedReturnDate: borrowForm.expectedReturnDate,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message || '借用申请已提交' });
        setShowBorrowForm(false);
        setSelectedEquipment(null);
        fetchEquipments();
        fetchMyBorrows();
        fetchUser();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '申请失败' });
    }
  };

  const handleReturn = async (borrowId: string) => {
    if (!confirm('确定要归还此设备吗？')) return;

    try {
      const response = await equipmentAPI.return(borrowId);
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message || '设备归还成功' });
        fetchEquipments();
        fetchMyBorrows();
        fetchUser();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '归还失败' });
    }
  };

  const getStatusBadge = (status: EquipmentBorrow['status']) => {
    const statusMap = {
      pending: { className: 'status-pending', label: '待审批' },
      approved: { className: 'status-info', label: '已批准' },
      rejected: { className: 'status-danger', label: '已拒绝' },
      borrowed: { className: 'status-success', label: '借用中' },
      returned: { className: 'status-info', label: '已归还' },
      overdue: { className: 'status-danger', label: '已逾期' },
    };
    return statusMap[status];
  };

  const isOverdue = (expectedReturnDate: string) => {
    const today = new Date();
    const expected = new Date(expectedReturnDate);
    return today > expected;
  };

  const calculateOverdueDays = (expectedReturnDate: string) => {
    const today = new Date();
    const expected = new Date(expectedReturnDate);
    const diff = today.getTime() - expected.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <Wrench className="inline w-8 h-8 mr-3 text-primary-400" />
              设备借用
            </h1>
            <p className="text-dark-500">浏览实验室设备，申请借用，管理借用记录</p>
          </div>
        </div>

        {message && (
          <div className={cn(
            'mb-4 p-4 rounded-lg flex items-center gap-3 animate-slide-up',
            message.type === 'success' ? 'bg-success/20 border border-success/50 text-success' : 'bg-danger/20 border border-danger/50 text-danger'
          )}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-6">
          <div className="w-64 space-y-6">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-400" />
                我的信用分
              </h3>
              {user && <CreditGauge score={user.creditScore} />}
              <div className="mt-4 p-3 bg-dark-300/50 rounded-lg text-xs text-dark-500 space-y-1">
                <p>• 信用分 ≥ 80: 信用良好</p>
                <p>• 60 ≤ 信用分 &lt; 80: 信用一般</p>
                <p>• 信用分 &lt; 60: 无法借用</p>
                <p className="text-warning mt-2">逾期每天扣除2分，最多扣除20分</p>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-400" />
                设备分类
              </h3>
              <div className="space-y-2">
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                        selectedCategory === category.id
                          ? 'bg-primary-500/30 text-white'
                          : 'text-dark-500 hover:bg-dark-300 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">设备列表</h2>
                <div className="flex items-center gap-4">
                  {Object.entries(EQUIPMENT_STATUS_CONFIG).map(([status, config]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className={cn('w-4 h-4 rounded', config.color)} />
                      <span className="text-sm text-dark-500">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {equipments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-dark-500">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>暂无设备</p>
                    </div>
                  ) : (
                    equipments.map((equipment) => (
                      <EquipmentCard
                        key={equipment.id}
                        equipment={equipment}
                        onBorrow={handleBorrowClick}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-80">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-400" />
                我的借用记录
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {myBorrows.length === 0 ? (
                  <div className="text-center py-8 text-dark-500">
                    <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>暂无借用记录</p>
                  </div>
                ) : (
                  myBorrows.map((borrow) => {
                    const status = getStatusBadge(borrow.status);
                    const overdue = borrow.status === 'overdue' || (borrow.status === 'borrowed' && isOverdue(borrow.expectedReturnDate));
                    const overdueDays = overdue ? calculateOverdueDays(borrow.expectedReturnDate) : 0;

                    return (
                      <div
                        key={borrow.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          overdue
                            ? 'bg-danger/10 border-danger/30 border-danger/50'
                            : 'bg-dark-300/50 border-dark-400/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{borrow.equipmentName}</span>
                          <span className={cn('status-badge', status.className)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-dark-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>借用日期: {borrow.borrowDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>预计归还: {borrow.expectedReturnDate}</span>
                          </div>
                          {borrow.actualReturnDate && (
                            <div className="flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              <span>实际归还: {borrow.actualReturnDate}</span>
                            </div>
                          )}
                          {overdue && (
                            <div className="flex items-center gap-1 text-danger">
                              <AlertCircle className="w-3 h-3" />
                              <span>已逾期 {Math.max(1, overdueDays)} 天</span>
                            </div>
                          )}
                          {borrow.creditPenalty && (
                            <div className="flex items-center gap-1 text-danger">
                              <AlertCircle className="w-3 h-3" />
                              <span>扣除信用分 {borrow.creditPenalty} 分</span>
                            </div>
                          )}
                        </div>
                        {(borrow.status === 'borrowed' || borrow.status === 'overdue') && (
                          <button
                            onClick={() => handleReturn(borrow.id)}
                            className={cn(
                              'w-full mt-3 text-sm py-1.5 rounded-lg font-medium transition-all duration-200',
                              overdue
                                ? 'bg-danger/20 text-danger border border-danger/50 hover:bg-danger/30'
                                : 'btn-success'
                            )}
                          >
                            {overdue ? '归还 (逾期设备)' : '归还设备'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBorrowForm && selectedEquipment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">申请借用</h3>
              <button
                onClick={() => {
                  setShowBorrowForm(false);
                  setSelectedEquipment(null);
                }}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-dark-500 text-sm mb-1">借用设备</p>
                <p className="text-white font-medium">{selectedEquipment.name}</p>
                <p className="text-dark-500 text-sm">型号: {selectedEquipment.model}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  用途说明
                </label>
                <textarea
                  value={borrowForm.purpose}
                  onChange={(e) => setBorrowForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  placeholder="请输入借用用途..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  预计归还日期
                </label>
                <input
                  type="date"
                  value={borrowForm.expectedReturnDate}
                  onChange={(e) => setBorrowForm((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-warning font-medium">借用规则</p>
                    <p className="text-dark-500 mt-1">
                      请按时归还设备，逾期每天扣除2分信用分，最多扣除20分。信用分低于60分将无法继续借用设备。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBorrowForm(false);
                  setSelectedEquipment(null);
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSubmitBorrow}
                className="btn-primary flex-1"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
