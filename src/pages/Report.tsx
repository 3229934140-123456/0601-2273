import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Edit3,
  Send,
  X,
  User,
  BookOpen,
  Gauge,
  MessageSquare,
  Award,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { reportAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { LabReport } from '../../shared/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft: { className: 'status-pending', label: '草稿', color: '#86909C' },
  submitted: { className: 'status-info', label: '已提交', color: '#165DFF' },
  reviewing: { className: 'status-warning', label: '批改中', color: '#FF7D00' },
  graded: { className: 'status-success', label: '已批改', color: '#00B42A' },
  rejected: { className: 'status-danger', label: '已驳回', color: '#F53F3F' },
};

const STATUS_ICONS = {
  draft: Edit3,
  submitted: Send,
  reviewing: Clock,
  graded: CheckCircle,
  rejected: XCircle,
};

const MOCK_COURSES = [
  { id: 'course1', name: '计算机网络实验' },
  { id: 'course2', name: '操作系统实验' },
  { id: 'course3', name: '数据结构实验' },
  { id: 'course4', name: '数据库原理实验' },
];

interface SimilarityGaugeProps {
  score: number;
}

function SimilarityGauge({ score }: SimilarityGaugeProps) {
  const getColor = (s: number) => {
    if (s < 30) return '#00B42A';
    if (s < 60) return '#FF7D00';
    return '#F53F3F';
  };

  const gaugeData = [
    { name: '相似度', value: score },
    { name: '剩余', value: 100 - score },
  ];

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#2A2F3A" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A2F3A',
                border: '1px solid #3C4253',
                borderRadius: '8px',
                color: 'white',
              }}
              formatter={(value: number) => [`${value}%`, '相似度']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-dark-500 text-sm">相似度 %</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" style={{ color }} />
        <span className="text-sm" style={{ color }}>
          {score < 30 ? '相似度较低' : score < 60 ? '相似度中等' : '相似度较高'}
        </span>
      </div>
    </div>
  );
}

interface ReportDetailModalProps {
  report: LabReport | null;
  onClose: () => void;
  onGrade?: (id: string, grade: number, feedback: string) => void;
}

function ReportDetailModal({ report, onClose, onGrade }: ReportDetailModalProps) {
  const { hasRole } = useAuthStore();
  const isTeacher = hasRole('teacher', 'admin');
  const [gradeValue, setGradeValue] = useState(report?.grade || 0);
  const [feedback, setFeedback] = useState(report?.feedback || '');

  useEffect(() => {
    if (report) {
      setGradeValue(report.grade || 0);
      setFeedback(report.feedback || '');
    }
  }, [report]);

  if (!report) return null;

  const StatusIcon = STATUS_ICONS[report.status];
  const statusConfig = STATUS_CONFIG[report.status];

  const handleSubmitGrade = () => {
    if (onGrade) {
      onGrade(report.id, gradeValue, feedback);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            报告详情
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">报告标题</p>
              <p className="text-white font-medium">{report.title}</p>
            </div>
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">课程名称</p>
              <p className="text-white font-medium">{report.courseName}</p>
            </div>
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">学生姓名</p>
              <p className="text-white font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary-400" />
                {report.studentName}
              </p>
            </div>
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">提交状态</p>
              <span className={cn('status-badge', statusConfig.className)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary-400" />
                相似度检测
              </h4>
              {report.similarityScore !== undefined ? (
                <SimilarityGauge score={report.similarityScore} />
              ) : (
                <div className="text-center py-8 text-dark-500">
                  <Gauge className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无相似度数据</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-400" />
                  成绩
                </h4>
                {report.grade !== undefined ? (
                  <div className="text-center">
                    <span className="text-5xl font-bold text-success glow-text">
                      {report.grade}
                    </span>
                    <span className="text-dark-500 text-lg ml-1">/ 100</span>
                  </div>
                ) : (
                  <div className="text-center py-4 text-dark-500">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>待批改</p>
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-400" />
                  教师评语
                </h4>
                {report.feedback ? (
                  <p className="text-dark-300 whitespace-pre-wrap">{report.feedback}</p>
                ) : (
                  <p className="text-dark-500 text-center py-4">暂无评语</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              报告内容
            </h4>
            <div className="p-4 bg-dark-300/30 rounded-lg whitespace-pre-wrap text-dark-200 min-h-[200px]">
              {report.content}
            </div>
          </div>

          {isTeacher && report.status !== 'graded' && (
            <div className="glass-card p-6 border-2 border-primary-500/30">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-400" />
                批改报告
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-dark-400 text-sm">分数: {gradeValue}</label>
                    <span className="text-2xl font-bold text-primary-400">{gradeValue}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(Number(e.target.value))}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-dark-500 mt-1">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
                <div>
                  <label className="text-dark-400 text-sm block mb-2">评语</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="请输入评语..."
                    className="input-field h-24 resize-none"
                  />
                </div>
                <button onClick={handleSubmitGrade} className="btn-primary w-full">
                  提交批改
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CreateReportModalProps {
  onClose: () => void;
  onSubmit: (data: { courseId: string; title: string; content: string }) => void;
}

function CreateReportModal({ onClose, onSubmit }: CreateReportModalProps) {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!courseId || !title || !content) {
      return;
    }
    onSubmit({ courseId, title, content });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-400" />
            新建实验报告
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-dark-400 text-sm block mb-2">选择课程</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="input-field"
            >
              <option value="">请选择课程</option>
              {MOCK_COURSES.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-dark-400 text-sm block mb-2">报告标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入报告标题"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-dark-400 text-sm block mb-2">报告内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入实验报告内容，包括实验目的、实验原理、实验步骤、实验结果与分析等..."
              className="input-field h-64 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={!courseId || !title || !content}
            >
              提交报告
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Report() {
  const { user, hasRole } = useAuthStore();
  const isTeacher = hasRole('teacher', 'admin');
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [similarityResult, setSimilarityResult] = useState<{ reportId: string; score: number } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, courseFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: { courseId?: string; status?: string } = {};
      if (courseFilter) params.courseId = courseFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await reportAPI.list(params);
      if (response.data.success && response.data.data) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (data: { courseId: string; title: string; content: string }) => {
    try {
      const course = MOCK_COURSES.find(c => c.id === data.courseId);
      const submitData = {
        ...data,
        courseName: course?.name || '',
      };
      const response = await reportAPI.submit(submitData);
      if (response.data.success && response.data.data) {
        const newReport = response.data.data;
        setMessage({ type: 'success', text: '报告提交成功，正在进行查重检测...' });
        setShowCreateModal(false);

        setTimeout(async () => {
          try {
            const similarityResponse = await reportAPI.checkSimilarity(newReport.id);
            if (similarityResponse.data.success && similarityResponse.data.data) {
              setSimilarityResult({
                reportId: newReport.id,
                score: similarityResponse.data.data.similarityScore,
              });
              setMessage({
                type: similarityResponse.data.data.similarityScore < 30 ? 'success' : 'warning' as 'success' | 'error',
                text: `查重完成，相似度：${similarityResponse.data.data.similarityScore}%`,
              });
            }
          } catch (error) {
            console.error('Failed to check similarity:', error);
          }
          fetchReports();
        }, 1500);

        fetchReports();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '提交失败' });
    }
  };

  const handleGrade = async (id: string, grade: number, feedback: string) => {
    try {
      const response = await reportAPI.grade(id, { grade, feedback });
      if (response.data.success && response.data.data) {
        setMessage({ type: 'success', text: '批改成功' });
        setSelectedReport(response.data.data);
        fetchReports();
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMessage({ type: 'error', text: err.response?.data?.error || '批改失败' });
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.studentName.toLowerCase().includes(query) ||
      report.courseName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <FileText className="inline w-8 h-8 mr-3 text-primary-400" />
              实验报告管理
            </h1>
            <p className="text-dark-500">
              {isTeacher ? '查看和批改学生实验报告' : '提交和查看我的实验报告'}
            </p>
          </div>
          {!isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-6 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新建报告
            </button>
          )}
        </div>

        {message && (
          <div
            className={cn(
              'mb-4 p-4 rounded-lg flex items-center gap-3 animate-slide-up',
              message.type === 'success'
                ? 'bg-success/20 border border-success/50 text-success'
                : 'bg-danger/20 border border-danger/50 text-danger'
            )}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {similarityResult && (
          <div className="mb-4 glass-card p-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-primary-400" />
                <span className="text-white">报告查重结果</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-dark-500">相似度：</span>
                <span
                  className={cn(
                    'text-2xl font-bold',
                    similarityResult.score < 30
                      ? 'text-success'
                      : similarityResult.score < 60
                      ? 'text-warning'
                      : 'text-danger'
                  )}
                >
                  {similarityResult.score}%
                </span>
                <button
                  onClick={() => setSimilarityResult(null)}
                  className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-dark-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-dark-500" />
              <span className="text-dark-500 text-sm">筛选:</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="">全部课程</option>
                {MOCK_COURSES.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="">全部状态</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索报告标题、学生姓名..."
                className="input-field flex-1"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-400/50">
                    <th className="text-left p-4 text-dark-400 font-medium">报告标题</th>
                    {isTeacher && (
                      <th className="text-left p-4 text-dark-400 font-medium">学生姓名</th>
                    )}
                    <th className="text-left p-4 text-dark-400 font-medium">课程名称</th>
                    <th className="text-left p-4 text-dark-400 font-medium">状态</th>
                    {isTeacher && (
                      <th className="text-left p-4 text-dark-400 font-medium">相似度</th>
                    )}
                    <th className="text-left p-4 text-dark-400 font-medium">成绩</th>
                    <th className="text-left p-4 text-dark-400 font-medium">提交时间</th>
                    <th className="text-left p-4 text-dark-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={isTeacher ? 8 : 7} className="p-8 text-center text-dark-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>暂无报告数据</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report, index) => {
                      const StatusIcon = STATUS_ICONS[report.status];
                      const statusConfig = STATUS_CONFIG[report.status];
                      return (
                        <tr
                          key={report.id}
                          className="border-b border-dark-400/30 hover:bg-dark-300/30 transition-colors animate-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-4">
                            <p className="text-white font-medium">{report.title}</p>
                          </td>
                          {isTeacher && (
                            <td className="p-4">
                              <p className="text-dark-300">{report.studentName}</p>
                            </td>
                          )}
                          <td className="p-4">
                            <p className="text-dark-300">{report.courseName}</p>
                          </td>
                          <td className="p-4">
                            <span className={cn('status-badge', statusConfig.className)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                          {isTeacher && (
                            <td className="p-4">
                              {report.similarityScore !== undefined ? (
                                <span
                                  className={cn(
                                    'font-bold',
                                    report.similarityScore < 30
                                      ? 'text-success'
                                      : report.similarityScore < 60
                                      ? 'text-warning'
                                      : 'text-danger'
                                  )}
                                >
                                  {report.similarityScore}%
                                </span>
                              ) : (
                                <span className="text-dark-500">-</span>
                              )}
                            </td>
                          )}
                          <td className="p-4">
                            {report.grade !== undefined ? (
                              <span className="text-success font-bold">{report.grade}</span>
                            ) : (
                              <span className="text-dark-500">待批改</span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-dark-500 text-sm">
                              {new Date(report.submittedAt).toLocaleString('zh-CN')}
                            </p>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="p-2 hover:bg-dark-300 rounded-lg transition-colors text-primary-400"
                              title="查看详情"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
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

      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReport}
        />
      )}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onGrade={handleGrade}
        />
      )}
    </div>
  );
}
