import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Building2,
  BookOpen,
  Users,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  Loader2,
  FileText,
  FlaskConical,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import dayjs from 'dayjs';
import { dataAPI, userAPI } from '@/services/api';
import type { Lab, Course, User } from '../../shared/types';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9'];

const MOCK_LABS: Lab[] = [
  { id: 'lab1', name: '计算机实验室A', building: '实验楼', floor: '3层', capacity: 40 },
  { id: 'lab2', name: '计算机实验室B', building: '实验楼', floor: '3层', capacity: 35 },
  { id: 'lab3', name: '电子实验室', building: '实验楼', floor: '2层', capacity: 30 },
  { id: 'lab4', name: '化学实验室', building: '化学楼', floor: '1层', capacity: 25 },
  { id: 'lab5', name: '物理实验室', building: '物理楼', floor: '2层', capacity: 30 },
];

const MOCK_COURSES: Course[] = [
  { id: 'c1', name: '数据结构实验', code: 'CS101', department: '计算机学院', credits: 2 },
  { id: 'c2', name: '操作系统实验', code: 'CS201', department: '计算机学院', credits: 2 },
  { id: 'c3', name: '计算机网络实验', code: 'CS301', department: '计算机学院', credits: 2 },
  { id: 'c4', name: '数据库系统实验', code: 'CS401', department: '计算机学院', credits: 2 },
  { id: 'c5', name: '软件工程实验', code: 'CS501', department: '计算机学院', credits: 3 },
];

interface LabStat {
  labId: string;
  labName: string;
  building: string;
  floor: string;
  capacity: number;
  totalClasses: number;
  completedClasses: number;
  utilizationRate: number;
  totalTeachingHours: number;
}

interface CourseStat {
  courseId: string;
  courseName: string;
  courseCode: string;
  department: string;
  credits: number;
  totalClasses: number;
  studentCount: number;
  averageScore: number;
}

interface TeacherStat {
  teacherId: string;
  teacherName: string;
  department: string;
  totalClasses: number;
  courseCount: number;
  labCount: number;
}

interface MaterialDetail {
  requestId: string;
  chemicalName: string;
  casNumber: string;
  category: string;
  hazardLevel: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purpose: string;
  requesterName: string;
  requesterDepartment: string;
  supervisorName: string;
  directorName: string;
  status: string;
  createdAt: string;
}

interface ExportProgress {
  type: 'monthly' | 'materials' | null;
  progress: number;
  status: 'idle' | 'exporting' | 'completed' | 'error';
  message: string;
}

export default function DataCenter() {
  const [labStats, setLabStats] = useState<LabStat[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStat[]>([]);
  const [materialDetails, setMaterialDetails] = useState<MaterialDetail[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    type: null,
    progress: 0,
    status: 'idle',
    message: '',
  });

  const [filters, setFilters] = useState({
    labId: '',
    courseId: '',
    startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  useEffect(() => {
    fetchTeachers();
    fetchReportData();
    fetchMaterialData();
  }, []);

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

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params: { labId?: string; courseId?: string; startDate?: string; endDate?: string } = {};
      if (filters.labId) params.labId = filters.labId;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await dataAPI.exportMonthlyReport(params);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setLabStats(data.labStatistics || []);
        setCourseStats(data.courseStatistics || []);
        setTeacherStats(data.teacherStatistics || []);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialData = async () => {
    try {
      const response = await dataAPI.exportMaterials();
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setMaterialDetails(data.materialDetails || []);
      }
    } catch (error) {
      console.error('Failed to fetch material data:', error);
    }
  };

  const handleFilter = () => {
    fetchReportData();
  };

  const handleExportMonthly = async () => {
    setExportProgress({
      type: 'monthly',
      progress: 0,
      status: 'exporting',
      message: '正在导出月度报告...',
    });

    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setExportProgress((prev) => ({ ...prev, progress: i }));
      }

      const params: { labId?: string; courseId?: string; startDate?: string; endDate?: string } = {};
      if (filters.labId) params.labId = filters.labId;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      await dataAPI.exportMonthlyReport(params);

      setExportProgress({
        type: 'monthly',
        progress: 100,
        status: 'completed',
        message: '月度报告导出完成！',
      });

      setTimeout(() => {
        setExportProgress({
          type: null,
          progress: 0,
          status: 'idle',
          message: '',
        });
      }, 3000);
    } catch (error) {
      setExportProgress({
        type: 'monthly',
        progress: 0,
        status: 'error',
        message: '导出失败，请重试',
      });
    }
  };

  const handleExportMaterials = async () => {
    setExportProgress({
      type: 'materials',
      progress: 0,
      status: 'exporting',
      message: '正在导出耗材明细...',
    });

    try {
      for (let i = 0; i <= 100; i += 15) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        setExportProgress((prev) => ({ ...prev, progress: i }));
      }

      await dataAPI.exportMaterials();

      setExportProgress({
        type: 'materials',
        progress: 100,
        status: 'completed',
        message: '耗材明细导出完成！',
      });

      setTimeout(() => {
        setExportProgress({
          type: null,
          progress: 0,
          status: 'idle',
          message: '',
        });
      }, 3000);
    } catch (error) {
      setExportProgress({
        type: 'materials',
        progress: 0,
        status: 'error',
        message: '导出失败，请重试',
      });
    }
  };

  const barChartData = labStats.map((lab) => ({
    name: lab.labName,
    使用率: lab.utilizationRate,
    课时: lab.totalTeachingHours,
  }));

  const lineChartData = courseStats.map((course, index) => ({
    name: course.courseName,
    人次: course.studentCount * course.totalClasses,
    班级数: course.studentCount,
  }));

  const summaryStats = {
    totalLabs: labStats.length,
    totalCourses: courseStats.length,
    totalTeachers: teacherStats.length,
    avgUtilization: labStats.length > 0
      ? Math.round(labStats.reduce((sum, l) => sum + l.utilizationRate, 0) / labStats.length)
      : 0,
    totalClasses: labStats.reduce((sum, l) => sum + l.totalClasses, 0),
    totalHours: Math.round(labStats.reduce((sum, l) => sum + l.totalTeachingHours, 0) * 10) / 10,
  };

  const HAZARD_LEVEL_LABELS: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    extreme: '极高',
  };

  if (loading && labStats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <BarChart3 className="inline w-8 h-8 mr-3 text-primary-400" />
              数据中心
            </h1>
            <p className="text-dark-500">查看实验室教学数据统计和分析报告</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReport(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              预览报告
            </button>
          </div>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-500" />
              <span className="text-dark-500 text-sm">筛选:</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-400" />
              <select
                value={filters.labId}
                onChange={(e) => setFilters((prev) => ({ ...prev, labId: e.target.value }))}
                className="input-field w-auto"
              >
                <option value="">全部实验室</option>
                {MOCK_LABS.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <select
                value={filters.courseId}
                onChange={(e) => setFilters((prev) => ({ ...prev, courseId: e.target.value }))}
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
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="input-field w-auto"
              />
              <span className="text-dark-500">至</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="input-field w-auto"
              />
            </div>
            <button onClick={handleFilter} className="btn-primary text-sm px-3 py-1">
              查询
            </button>
            <button
              onClick={() => setFilters({
                labId: '',
                courseId: '',
                startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endDate: dayjs().format('YYYY-MM-DD'),
              })}
              className="btn-secondary text-sm px-3 py-1"
            >
              重置
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-dark-500 text-sm font-medium">实验室总数</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-500/20">
                <Building2 className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white">{summaryStats.totalLabs}</div>
            <div className="text-sm text-success mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              平均使用率 {summaryStats.avgUtilization}%
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-dark-500 text-sm font-medium">课程总数</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20">
                <BookOpen className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white">{summaryStats.totalCourses}</div>
            <div className="text-sm text-dark-400 mt-2">
              {summaryStats.totalClasses} 节排课
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-dark-500 text-sm font-medium">教师总数</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/20">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white">{summaryStats.totalTeachers}</div>
            <div className="text-sm text-dark-400 mt-2">
              总教学时长 {summaryStats.totalHours} 小时
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-dark-500 text-sm font-medium">耗材领用</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/20">
                <FlaskConical className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white">{materialDetails.length}</div>
            <div className="text-sm text-dark-400 mt-2">
              总金额 ¥{materialDetails.reduce((sum, m) => sum + m.totalPrice, 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              实验室使用率
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C4253" />
                  <XAxis
                    dataKey="name"
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2F3A',
                      border: '1px solid #3C4253',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`${value}%`, '使用率']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#86909C' }}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Bar dataKey="使用率" fill="#165DFF" radius={[4, 4, 0, 0]}>
                    {barChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-primary-400" />
              课程人次统计
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B42A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00B42A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C4253" />
                  <XAxis
                    dataKey="name"
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#5D6478"
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A2F3A',
                      border: '1px solid #3C4253',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [value, '人次']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#86909C' }}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="人次"
                    stroke="#00B42A"
                    strokeWidth={3}
                    dot={{ fill: '#00B42A', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#00B42A' }}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              实验室利用率
            </h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {labStats.map((lab, index) => (
                <div key={lab.labId} className="bg-dark-300/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{lab.labName}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      lab.utilizationRate >= 80 ? 'bg-success/20 text-success' :
                      lab.utilizationRate >= 50 ? 'bg-warning/20 text-warning' :
                      'bg-danger/20 text-danger'
                    )}>
                      {lab.utilizationRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${lab.utilizationRate}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-dark-400">
                    <span>{lab.completedClasses}/{lab.totalClasses} 节课程</span>
                    <span>{lab.totalTeachingHours} 课时</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '700ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              课程排课统计
            </h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {courseStats.map((course) => (
                <div key={course.courseId} className="bg-dark-300/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{course.courseName}</span>
                    <span className="text-xs text-dark-400">{course.courseCode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-dark-500">节数:</span>
                      <span className="text-white ml-1">{course.totalClasses}</span>
                    </div>
                    <div>
                      <span className="text-dark-500">班级:</span>
                      <span className="text-white ml-1">{course.studentCount}</span>
                    </div>
                    <div>
                      <span className="text-dark-500">均分:</span>
                      <span className="text-white ml-1">{course.averageScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '800ms' }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              教师工作量
            </h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {teacherStats.map((teacher) => (
                <div key={teacher.teacherId} className="bg-dark-300/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{teacher.teacherName}</span>
                    <span className="text-xs text-dark-400">{teacher.department}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-dark-500">节数:</span>
                      <span className="text-white ml-1">{teacher.totalClasses}</span>
                    </div>
                    <div>
                      <span className="text-dark-500">课程:</span>
                      <span className="text-white ml-1">{teacher.courseCount}</span>
                    </div>
                    <div>
                      <span className="text-dark-500">实验室:</span>
                      <span className="text-white ml-1">{teacher.labCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-400" />
            耗材消耗明细
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    危化品名称
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
                    数量
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    单价
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    总价
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    用途
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    领用人
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                    日期
                  </th>
                </tr>
              </thead>
              <tbody>
                {materialDetails.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-dark-500">
                      <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无耗材消耗记录</p>
                    </td>
                  </tr>
                ) : (
                  materialDetails.map((item, index) => (
                    <tr
                      key={item.requestId}
                      className={cn(
                        'border-b border-dark-400/50 hover:bg-dark-300/30 transition-colors',
                        index % 2 === 0 ? 'bg-dark-200/20' : 'bg-dark-200/10'
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{item.chemicalName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-400 font-mono text-sm">{item.casNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-300">{item.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          item.hazardLevel === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          item.hazardLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          item.hazardLevel === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        )}>
                          {HAZARD_LEVEL_LABELS[item.hazardLevel] || item.hazardLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white">{item.quantity} {item.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-300">¥{item.unitPrice}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">¥{item.totalPrice.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-300 text-sm">{item.purpose}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white">{item.requesterName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-400 text-sm">
                          {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={handleExportMonthly}
            disabled={exportProgress.status === 'exporting'}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            导出月度报告
          </button>
          <button
            onClick={handleExportMaterials}
            disabled={exportProgress.status === 'exporting'}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            导出耗材明细
          </button>
        </div>
      </div>

      {exportProgress.status !== 'idle' && (
        <div className="fixed bottom-6 right-6 glass-card p-4 w-80 animate-slide-up z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">
              {exportProgress.type === 'monthly' ? '月度报告' : '耗材明细'}
            </span>
            <button
              onClick={() => setExportProgress({
                type: null,
                progress: 0,
                status: 'idle',
                message: '',
              })}
              className="p-1 hover:bg-dark-300 rounded transition-colors"
            >
              <X className="w-4 h-4 text-dark-500" />
            </button>
          </div>
          <p className="text-dark-400 text-sm mb-3">{exportProgress.message}</p>
          <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                exportProgress.status === 'error' ? 'bg-danger' :
                exportProgress.status === 'completed' ? 'bg-success' : 'bg-primary-500'
              )}
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-dark-400 text-xs">{exportProgress.progress}%</span>
            {exportProgress.status === 'exporting' && (
              <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
            )}
            {exportProgress.status === 'completed' && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                月度实验教学分析报告
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>

            <div className="bg-dark-300/30 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">报告概览</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-200/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-primary-400">{summaryStats.totalLabs}</p>
                  <p className="text-dark-400 text-sm mt-1">实验室</p>
                </div>
                <div className="bg-dark-200/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{summaryStats.totalCourses}</p>
                  <p className="text-dark-400 text-sm mt-1">课程</p>
                </div>
                <div className="bg-dark-200/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{summaryStats.totalTeachers}</p>
                  <p className="text-dark-400 text-sm mt-1">教师</p>
                </div>
                <div className="bg-dark-200/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{summaryStats.avgUtilization}%</p>
                  <p className="text-dark-400 text-sm mt-1">平均使用率</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-dark-400">
                <p><Clock className="inline w-4 h-4 mr-1" />
                  统计周期: {filters.startDate} 至 {filters.endDate}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-400" />
                  实验室利用率统计
                </h4>
                <div className="bg-dark-200/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-300/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">实验室</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">位置</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">总课程</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">已完成</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">使用率</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">课时</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labStats.map((lab) => (
                        <tr key={lab.labId} className="border-t border-dark-400/30">
                          <td className="px-4 py-3 text-white">{lab.labName}</td>
                          <td className="px-4 py-3 text-dark-300">{lab.building} {lab.floor}</td>
                          <td className="px-4 py-3 text-dark-300">{lab.totalClasses}</td>
                          <td className="px-4 py-3 text-dark-300">{lab.completedClasses}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              lab.utilizationRate >= 80 ? 'bg-success/20 text-success' :
                              lab.utilizationRate >= 50 ? 'bg-warning/20 text-warning' :
                              'bg-danger/20 text-danger'
                            )}>
                              {lab.utilizationRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-dark-300">{lab.totalTeachingHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                  课程排课统计
                </h4>
                <div className="bg-dark-200/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-300/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">课程名称</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">代码</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">学院</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">节数</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">班级数</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">平均分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStats.map((course) => (
                        <tr key={course.courseId} className="border-t border-dark-400/30">
                          <td className="px-4 py-3 text-white">{course.courseName}</td>
                          <td className="px-4 py-3 text-dark-300">{course.courseCode}</td>
                          <td className="px-4 py-3 text-dark-300">{course.department}</td>
                          <td className="px-4 py-3 text-dark-300">{course.totalClasses}</td>
                          <td className="px-4 py-3 text-dark-300">{course.studentCount}</td>
                          <td className="px-4 py-3 text-dark-300">{course.averageScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-400" />
                  教师工作量统计
                </h4>
                <div className="bg-dark-200/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-300/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">教师姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">学院</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">总节数</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">课程数</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-dark-500">实验室数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStats.map((teacher) => (
                        <tr key={teacher.teacherId} className="border-t border-dark-400/30">
                          <td className="px-4 py-3 text-white">{teacher.teacherName}</td>
                          <td className="px-4 py-3 text-dark-300">{teacher.department}</td>
                          <td className="px-4 py-3 text-dark-300">{teacher.totalClasses}</td>
                          <td className="px-4 py-3 text-dark-300">{teacher.courseCount}</td>
                          <td className="px-4 py-3 text-dark-300">{teacher.labCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowReport(false)} className="btn-secondary">
                关闭
              </button>
              <button
                onClick={() => {
                  setShowReport(false);
                  handleExportMonthly();
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
