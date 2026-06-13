import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Search,
  Calculator,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  BarChart3,
  User,
  FileText,
  Percent,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { gradeAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Grade } from '../../shared/types';
import { cn } from '@/lib/utils';

const MOCK_COURSES = [
  { id: 'course1', name: '计算机网络实验' },
  { id: 'course2', name: '操作系统实验' },
  { id: 'course3', name: '数据结构实验' },
  { id: 'course4', name: '数据库原理实验' },
];

const MOCK_SEMESTERS = [
  { id: '2024-2', name: '2024-2025学年第二学期' },
  { id: '2024-1', name: '2024-2025学年第一学期' },
  { id: '2023-2', name: '2023-2024学年第二学期' },
];

const GRADE_COLORS = [
  '#F53F3F',
  '#FF7D00',
  '#FFC53D',
  '#14C9C9',
  '#00B42A',
];

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

function StatsCard({ title, value, icon: Icon, color, suffix }: StatsCardProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-dark-500 text-sm font-medium">{title}</span>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-bold text-white">
          {value}
          {suffix && <span className="text-lg text-dark-500 ml-1">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

interface GradeDetailModalProps {
  grade: Grade | null;
  onClose: () => void;
}

function GradeDetailModal({ grade, onClose }: GradeDetailModalProps) {
  if (!grade) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-400" />
            成绩详情
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">学生姓名</p>
              <p className="text-white font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary-400" />
                {grade.studentName}
              </p>
            </div>
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">课程名称</p>
              <p className="text-white font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-400" />
                {grade.courseName}
              </p>
            </div>
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <p className="text-dark-500 text-sm mb-1">学期</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-400" />
                {grade.semester}
              </p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              实验报告成绩
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-400/50">
                    <th className="text-left p-3 text-dark-400 font-medium text-sm">报告名称</th>
                    <th className="text-right p-3 text-dark-400 font-medium text-sm">得分</th>
                    <th className="text-right p-3 text-dark-400 font-medium text-sm">权重</th>
                    <th className="text-right p-3 text-dark-400 font-medium text-sm">加权得分</th>
                  </tr>
                </thead>
                <tbody>
                  {grade.reportGrades.map((rg) => (
                    <tr key={rg.reportId} className="border-b border-dark-400/30">
                      <td className="p-3 text-dark-200">{rg.title}</td>
                      <td className="p-3 text-right text-white font-medium">{rg.score}</td>
                      <td className="p-3 text-right text-dark-400">{rg.weight}%</td>
                      <td className="p-3 text-right text-primary-400 font-medium">
                        {(rg.score * rg.weight / 100).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                操作成绩
              </h4>
              <div className="text-center">
                <div className="text-5xl font-bold text-warning glow-text mb-2">
                  {grade.operationScore}
                </div>
                <p className="text-dark-500">权重: {grade.operationWeight}%</p>
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-primary-500/30">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-400" />
                最终成绩
              </h4>
              <div className="text-center">
                <div
                  className={cn(
                    'text-5xl font-bold glow-text mb-2',
                    grade.finalScore >= 90
                      ? 'text-success'
                      : grade.finalScore >= 60
                      ? 'text-primary-400'
                      : 'text-danger'
                  )}
                >
                  {grade.finalScore}
                </div>
                <p className="text-dark-500">
                  {grade.finalScore >= 90
                    ? '优秀'
                    : grade.finalScore >= 80
                    ? '良好'
                    : grade.finalScore >= 70
                    ? '中等'
                    : grade.finalScore >= 60
                    ? '及格'
                    : '不及格'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-400" />
              成绩计算说明
            </h4>
            <div className="p-4 bg-dark-300/30 rounded-lg text-dark-300 space-y-2">
              <p>
                <span className="text-primary-400 font-medium">报告成绩:</span>{' '}
                Σ(报告得分 × 报告权重) / Σ报告权重
              </p>
              <p>
                <span className="text-primary-400 font-medium">最终成绩:</span>{' '}
                报告成绩 × (100% - 操作权重) + 操作成绩 × 操作权重
              </p>
              <p className="text-sm text-dark-500 mt-2">
                本课程报告权重: {100 - grade.operationWeight}%, 操作权重: {grade.operationWeight}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Grade() {
  const { hasRole } = useAuthStore();
  const isTeacher = hasRole('teacher', 'admin');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState(MOCK_SEMESTERS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGrades();
  }, [courseFilter, semesterFilter]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const params: { courseId?: string; semester?: string } = {};
      if (courseFilter) params.courseId = courseFilter;
      if (semesterFilter) params.semester = semesterFilter;

      const response = await gradeAPI.list(params);
      if (response.data.success && response.data.data) {
        setGrades(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const params: { courseId?: string; semester?: string } = {};
      if (courseFilter) params.courseId = courseFilter;
      if (semesterFilter) params.semester = semesterFilter;

      const response = await gradeAPI.calculate(params);
      if (response.data.success && response.data.data) {
        setGrades(response.data.data);
        setMessage({ type: 'success', text: '成绩计算完成' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '计算失败' });
    } finally {
      setCalculating(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const stats = useMemo(() => {
    if (grades.length === 0) {
      return {
        average: 0,
        max: 0,
        min: 0,
        passRate: 0,
        distribution: [
          { range: '0-59', count: 0 },
          { range: '60-69', count: 0 },
          { range: '70-79', count: 0 },
          { range: '80-89', count: 0 },
          { range: '90-100', count: 0 },
        ],
      };
    }

    const scores = grades.map((g) => g.finalScore);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 60).length;
    const passRate = (passCount / scores.length) * 100;

    const distribution = [
      { range: '0-59', count: scores.filter((s) => s < 60).length },
      { range: '60-69', count: scores.filter((s) => s >= 60 && s < 70).length },
      { range: '70-79', count: scores.filter((s) => s >= 70 && s < 80).length },
      { range: '80-89', count: scores.filter((s) => s >= 80 && s < 90).length },
      { range: '90-100', count: scores.filter((s) => s >= 90).length },
    ];

    return {
      average: Math.round(average * 10) / 10,
      max,
      min,
      passRate: Math.round(passRate * 10) / 10,
      distribution,
    };
  }, [grades]);

  const filteredGrades = grades.filter((grade) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      grade.studentName.toLowerCase().includes(query) ||
      grade.courseName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <Award className="inline w-8 h-8 mr-3 text-primary-400" />
              成绩管理
            </h1>
            <p className="text-dark-500">
              {isTeacher ? '查看和管理班级学生成绩' : '查看我的课程成绩'}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="btn-primary px-6 flex items-center gap-2"
            >
              {calculating ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Calculator className="w-5 h-5" />
              )}
              计算最终成绩
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
              <Calendar className="w-4 h-4 text-primary-400" />
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="input-field w-auto min-w-[220px]"
              >
                {MOCK_SEMESTERS.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            </div>
            {isTeacher && (
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索学生姓名..."
                  className="input-field flex-1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="平均分"
            value={stats.average}
            icon={TrendingUp}
            color="#165DFF"
            suffix="分"
          />
          <StatsCard
            title="最高分"
            value={stats.max}
            icon={Award}
            color="#00B42A"
            suffix="分"
          />
          <StatsCard
            title="最低分"
            value={stats.min}
            icon={AlertCircle}
            color="#F53F3F"
            suffix="分"
          />
          <StatsCard
            title="及格率"
            value={stats.passRate}
            icon={Percent}
            color="#FF7D00"
            suffix="%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              成绩分布
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C4253" />
                  <XAxis
                    dataKey="range"
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2F3A',
                      border: '1px solid #3C4253',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [value, '人数']}
                  />
                  <Bar dataKey="count" name="人数" radius={[4, 4, 0, 0]}>
                    {stats.distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={GRADE_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              分布说明
            </h2>
            <div className="space-y-3">
              {stats.distribution.map((item, index) => (
                <div key={item.range} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: GRADE_COLORS[index] }}
                    />
                    <span className="text-dark-300 text-sm">{item.range} 分</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{item.count} 人</span>
                    <span className="text-dark-500 text-sm">
                      {grades.length > 0 ? Math.round((item.count / grades.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-dark-400/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-500">总人数</span>
                <span className="text-white font-medium">{grades.length} 人</span>
              </div>
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
                    <th className="text-left p-4 text-dark-400 font-medium w-10"></th>
                    {isTeacher && (
                      <th className="text-left p-4 text-dark-400 font-medium">学生姓名</th>
                    )}
                    <th className="text-left p-4 text-dark-400 font-medium">课程名称</th>
                    <th className="text-left p-4 text-dark-400 font-medium">学期</th>
                    <th className="text-right p-4 text-dark-400 font-medium">报告平均</th>
                    <th className="text-right p-4 text-dark-400 font-medium">操作成绩</th>
                    <th className="text-right p-4 text-dark-400 font-medium">最终成绩</th>
                    <th className="text-center p-4 text-dark-400 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.length === 0 ? (
                    <tr>
                      <td colSpan={isTeacher ? 8 : 7} className="p-8 text-center text-dark-500">
                        <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>暂无成绩数据</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGrades.map((grade, index) => {
                      const reportAvg = grade.reportGrades.length > 0
                        ? grade.reportGrades.reduce((sum, rg) => sum + rg.score * rg.weight, 0) /
                          grade.reportGrades.reduce((sum, rg) => sum + rg.weight, 0)
                        : 0;
                      const isExpanded = expandedRows.has(grade.id);

                      return (
                        <React.Fragment key={grade.id}>
                          <tr
                            className="border-b border-dark-400/30 hover:bg-dark-300/30 transition-colors animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="p-4">
                              <button
                                onClick={() => toggleRow(grade.id)}
                                className="p-1 hover:bg-dark-300 rounded transition-colors"
                              >
                                <ChevronDown
                                  className={cn(
                                    'w-4 h-4 text-dark-500 transition-transform',
                                    isExpanded && 'rotate-180'
                                  )}
                                />
                              </button>
                            </td>
                            {isTeacher && (
                              <td className="p-4">
                                <p className="text-white font-medium">{grade.studentName}</p>
                              </td>
                            )}
                            <td className="p-4">
                              <p className="text-dark-300">{grade.courseName}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-dark-500 text-sm">{grade.semester}</p>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-white font-medium">
                                {Math.round(reportAvg * 10) / 10}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-warning font-medium">
                                {grade.operationScore}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={cn(
                                  'font-bold text-lg',
                                  grade.finalScore >= 90
                                    ? 'text-success'
                                    : grade.finalScore >= 60
                                    ? 'text-primary-400'
                                    : 'text-danger'
                                )}
                              >
                                {grade.finalScore}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedGrade(grade)}
                                className="p-2 hover:bg-dark-300 rounded-lg transition-colors text-primary-400"
                                title="查看详情"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-dark-300/20">
                              <td colSpan={isTeacher ? 8 : 7} className="p-4">
                                <div className="pl-8">
                                  <h4 className="text-sm font-semibold text-dark-400 mb-3">各报告成绩明细</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {grade.reportGrades.map((rg) => (
                                      <div
                                        key={rg.reportId}
                                        className="p-3 bg-dark-300/50 rounded-lg"
                                      >
                                        <p className="text-dark-500 text-xs truncate mb-1">
                                          {rg.title}
                                        </p>
                                        <p className="text-white font-medium">
                                          {rg.score}
                                          <span className="text-dark-500 text-xs ml-1">
                                            ({rg.weight}%)
                                          </span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedGrade && (
        <GradeDetailModal
          grade={selectedGrade}
          onClose={() => setSelectedGrade(null)}
        />
      )}
    </div>
  );
}
