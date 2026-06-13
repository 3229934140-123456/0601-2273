import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/zh-cn';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles,
  BookOpen,
  Users,
} from 'lucide-react';
import { scheduleAPI, userAPI } from '@/services/api';
import type {
  Schedule,
  ScheduleConflict,
  ScheduleSuggestion,
  User,
  Lab,
  Course,
} from '../../shared/types';
import { cn } from '@/lib/utils';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.locale('zh-cn');

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '第1-2节' },
  { start: '10:20', end: '12:20', label: '第3-4节' },
  { start: '14:00', end: '16:00', label: '第5-6节' },
  { start: '16:20', end: '18:20', label: '第7-8节' },
  { start: '19:00', end: '21:00', label: '第9-10节' },
];

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

interface ScheduleFormData {
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  labId: string;
  labName: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Schedule['status'];
}

export default function Schedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [showForm, setShowForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ScheduleConflict | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<ScheduleFormData | null>(null);

  const [filters, setFilters] = useState({
    date: '',
    teacherId: '',
    labId: '',
  });

  const [formData, setFormData] = useState<ScheduleFormData>({
    courseId: '',
    courseName: '',
    teacherId: '',
    teacherName: '',
    labId: '',
    labName: '',
    className: '',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '08:00',
    endTime: '10:00',
    status: 'scheduled',
  });

  const [generateFormData, setGenerateFormData] = useState({
    courseId: '',
    courseName: '',
    teacherId: '',
    teacherName: '',
    labId: '',
    labName: '',
    className: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) =>
      currentWeek.add(i, 'day')
    );
  }, [currentWeek]);

  useEffect(() => {
    fetchTeachers();
    fetchSchedules();
  }, [filters]);

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

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params: { date?: string; teacherId?: string; labId?: string } = {};
      if (filters.date) params.date = filters.date;
      if (filters.teacherId) params.teacherId = filters.teacherId;
      if (filters.labId) params.labId = filters.labId;

      const response = await scheduleAPI.list(params);
      if (response.data.success && response.data.data) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDayAndTime = (day: dayjs.Dayjs, timeSlot: typeof TIME_SLOTS[0]) => {
    return schedules.filter((s) => {
      const scheduleDate = dayjs(s.date);
      const sameDay = scheduleDate.isSame(day, 'day');
      const timeOverlap =
        s.startTime < timeSlot.end && s.endTime > timeSlot.start;
      return sameDay && timeOverlap;
    });
  };

  const handleCourseChange = (courseId: string) => {
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    setFormData((prev) => ({
      ...prev,
      courseId,
      courseName: course?.name || '',
    }));
  };

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setFormData((prev) => ({
      ...prev,
      teacherId,
      teacherName: teacher?.name || '',
    }));
  };

  const handleLabChange = (labId: string) => {
    const lab = MOCK_LABS.find((l) => l.id === labId);
    setFormData((prev) => ({
      ...prev,
      labId,
      labName: lab?.name || '',
    }));
  };

  const handleGenerateCourseChange = (courseId: string) => {
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    setGenerateFormData((prev) => ({
      ...prev,
      courseId,
      courseName: course?.name || '',
    }));
  };

  const handleGenerateTeacherChange = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setGenerateFormData((prev) => ({
      ...prev,
      teacherId,
      teacherName: teacher?.name || '',
    }));
  };

  const handleGenerateLabChange = (labId: string) => {
    const lab = MOCK_LABS.find((l) => l.id === labId);
    setGenerateFormData((prev) => ({
      ...prev,
      labId,
      labName: lab?.name || '',
    }));
  };

  const handleTimeSlotChange = (startTime: string) => {
    const slot = TIME_SLOTS.find((s) => s.start === startTime);
    setFormData((prev) => ({
      ...prev,
      startTime,
      endTime: slot?.end || startTime,
    }));
  };

  const checkAndSubmit = async () => {
    if (
      !formData.courseId ||
      !formData.teacherId ||
      !formData.labId ||
      !formData.className ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert('请填写完整信息');
      return;
    }

    try {
      const conflictResponse = await scheduleAPI.checkConflict(formData);
      if (conflictResponse.data.success && conflictResponse.data.data) {
        setConflictInfo(conflictResponse.data.data);
        setPendingSchedule(formData);
        setShowConflictModal(true);
      } else {
        submitSchedule();
      }
    } catch (error) {
      console.error('Failed to check conflict:', error);
    }
  };

  const submitSchedule = async () => {
    if (!pendingSchedule && !formData) return;

    const dataToSubmit = pendingSchedule || formData;

    try {
      const response = await scheduleAPI.create(dataToSubmit);
      if (response.data.success) {
        setSchedules((prev) => [...prev, response.data.data!]);
        setShowForm(false);
        setShowConflictModal(false);
        setPendingSchedule(null);
        resetForm();
      }
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.data?.conflict) {
        setConflictInfo({
          type: 'lab',
          message: error.response.data.data.conflictInfo,
          suggestions: [],
        });
        setPendingSchedule(dataToSubmit);
        setShowConflictModal(true);
      }
      console.error('Failed to create schedule:', error);
    }
  };

  const applySuggestion = (suggestion: ScheduleSuggestion) => {
    if (!pendingSchedule) return;

    const [startTime, endTime] = suggestion.alternativeTime.split(' - ');
    let updatedSchedule = { ...pendingSchedule };

    if (startTime && endTime && !suggestion.alternativeTime.includes('改日')) {
      updatedSchedule.startTime = startTime.trim();
      updatedSchedule.endTime = endTime.trim();
    }

    if (suggestion.alternativeLab) {
      const lab = MOCK_LABS.find((l) => l.name === suggestion.alternativeLab);
      if (lab) {
        updatedSchedule.labId = lab.id;
        updatedSchedule.labName = lab.name;
      }
    }

    setPendingSchedule(updatedSchedule);
    setFormData(updatedSchedule);
    submitSchedule();
  };

  const handleAutoGenerate = async () => {
    if (
      !generateFormData.courseId ||
      !generateFormData.teacherId ||
      !generateFormData.labId ||
      !generateFormData.className ||
      !generateFormData.startDate ||
      !generateFormData.endDate
    ) {
      alert('请填写完整信息');
      return;
    }

    try {
      const response = await scheduleAPI.generate(generateFormData);
      if (response.data.success && response.data.data) {
        const hasConflicts = response.data.data.some((s) => s.conflict);
        if (hasConflicts) {
          const conflictSchedule = response.data.data.find((s) => s.conflict);
          setConflictInfo({
            type: 'lab',
            message: conflictSchedule?.conflictInfo || '自动排课发现冲突',
            suggestions: response.data.data
              .filter((s) => !s.conflict)
              .slice(0, 3)
              .map((s) => ({
                alternativeTime: `${s.date} ${s.startTime} - ${s.endTime}`,
                alternativeLab: s.labName,
                reason: '推荐时间',
              })),
          });
          setShowConflictModal(true);
        } else {
          for (const schedule of response.data.data) {
            await scheduleAPI.create({
              courseId: schedule.courseId,
              courseName: schedule.courseName,
              teacherId: schedule.teacherId,
              teacherName: schedule.teacherName,
              labId: schedule.labId,
              labName: schedule.labName,
              className: schedule.className,
              date: schedule.date,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              status: 'scheduled',
            });
          }
          fetchSchedules();
          setShowGenerateForm(false);
          resetGenerateForm();
        }
      }
    } catch (error) {
      console.error('Failed to generate schedules:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      courseName: '',
      teacherId: '',
      teacherName: '',
      labId: '',
      labName: '',
      className: '',
      date: dayjs().format('YYYY-MM-DD'),
      startTime: '08:00',
      endTime: '10:00',
      status: 'scheduled',
    });
  };

  const resetGenerateForm = () => {
    setGenerateFormData({
      courseId: '',
      courseName: '',
      teacherId: '',
      teacherName: '',
      labId: '',
      labName: '',
      className: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    });
  };

  const getStatusBadge = (status: Schedule['status']) => {
    const statusMap = {
      scheduled: { className: 'status-info', label: '已排课' },
      ongoing: { className: 'status-warning', label: '进行中' },
      completed: { className: 'status-success', label: '已完成' },
      cancelled: { className: 'status-danger', label: '已取消' },
    };
    return statusMap[status];
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white glow-text mb-2">
              <Calendar className="inline w-8 h-8 mr-3 text-primary-400" />
              排课管理
            </h1>
            <p className="text-dark-500">管理实验室课程排课，检测冲突，自动排课</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGenerateForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              自动排课
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建排课
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
              <Calendar className="w-4 h-4 text-primary-400" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                className="input-field w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary-400" />
              <select
                value={filters.teacherId}
                onChange={(e) => setFilters((prev) => ({ ...prev, teacherId: e.target.value }))}
                className="input-field w-auto"
              >
                <option value="">全部教师</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
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
            <button
              onClick={() => setFilters({ date: '', teacherId: '', labId: '' })}
              className="btn-secondary text-sm px-3 py-1"
            >
              重置
            </button>
          </div>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentWeek((prev) => prev.subtract(1, 'week'))}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {weekDays[0].format('YYYY年MM月DD日')} -{' '}
              {weekDays[6].format('MM月DD日')}
            </h2>
            <button
              onClick={() => setCurrentWeek((prev) => prev.add(1, 'week'))}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-24 px-4 py-3 text-left text-sm font-medium text-dark-500 bg-dark-200/50 border-b border-dark-400">
                      时间
                    </th>
                    {weekDays.map((day, index) => (
                      <th
                        key={index}
                        className={cn(
                          'px-4 py-3 text-center text-sm font-medium border-b border-dark-400',
                          day.isSame(dayjs(), 'day')
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-dark-200/50 text-dark-500'
                        )}
                      >
                        <div>{day.format('dddd')}</div>
                        <div className={day.isSame(dayjs(), 'day') ? 'text-white font-bold' : ''}>
                          {day.format('MM/DD')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, slotIndex) => (
                    <tr key={slotIndex} className="border-b border-dark-400/50">
                      <td className="px-4 py-3 text-sm text-dark-500 bg-dark-200/30">
                        <div className="font-medium">{slot.label}</div>
                        <div className="text-xs mt-1">
                          {slot.start} - {slot.end}
                        </div>
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        const daySchedules = getSchedulesForDayAndTime(day, slot);
                        return (
                          <td
                            key={dayIndex}
                            className="px-2 py-2 align-top bg-dark-200/10 hover:bg-dark-200/30 transition-colors"
                          >
                            <div className="space-y-2 min-h-[100px]">
                              {daySchedules.map((schedule) => {
                                const status = getStatusBadge(schedule.status);
                                return (
                                  <div
                                    key={schedule.id}
                                    className={cn(
                                      'p-3 rounded-lg text-xs transition-all duration-200 hover:scale-[1.02]',
                                      schedule.conflict
                                        ? 'bg-danger/10 border-2 border-danger animate-pulse'
                                        : 'bg-dark-300/80 border border-dark-400 hover:border-primary-500/50'
                                    )}
                                  >
                                    {schedule.conflict && (
                                      <div className="flex items-center gap-1 text-danger mb-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="font-medium">冲突</span>
                                      </div>
                                    )}
                                    <div className="font-medium text-white mb-1 flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-primary-400" />
                                      {schedule.courseName}
                                    </div>
                                    <div className="text-dark-500 flex items-center gap-1 mb-1">
                                      <UserIcon className="w-3 h-3" />
                                      {schedule.teacherName}
                                    </div>
                                    <div className="text-dark-500 flex items-center gap-1 mb-1">
                                      <Building2 className="w-3 h-3" />
                                      {schedule.labName}
                                    </div>
                                    <div className="text-dark-500 flex items-center gap-1 mb-1">
                                      <Users className="w-3 h-3" />
                                      {schedule.className}
                                    </div>
                                    <div className="text-dark-500 flex items-center gap-1 mb-2">
                                      <Clock className="w-3 h-3" />
                                      {schedule.startTime} - {schedule.endTime}
                                    </div>
                                    <span className={cn('status-badge', status.className)}>
                                      {status.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">新建排课</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  课程
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择课程</option>
                  {MOCK_COURSES.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  教师
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  实验室
                </label>
                <select
                  value={formData.labId}
                  onChange={(e) => handleLabChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择实验室</option>
                  {MOCK_LABS.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.building} {lab.floor})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  班级
                </label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, className: e.target.value }))
                  }
                  placeholder="请输入班级名称"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  日期
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  时段
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => handleTimeSlotChange(e.target.value)}
                  className="input-field"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.start} value={slot.start}>
                      {slot.label} ({slot.start} - {slot.end})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button onClick={checkAndSubmit} className="btn-primary flex-1">
                创建排课
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                自动排课
              </h3>
              <button
                onClick={() => {
                  setShowGenerateForm(false);
                  resetGenerateForm();
                }}
                className="p-1 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  课程
                </label>
                <select
                  value={generateFormData.courseId}
                  onChange={(e) => handleGenerateCourseChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择课程</option>
                  {MOCK_COURSES.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  教师
                </label>
                <select
                  value={generateFormData.teacherId}
                  onChange={(e) => handleGenerateTeacherChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  实验室
                </label>
                <select
                  value={generateFormData.labId}
                  onChange={(e) => handleGenerateLabChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择实验室</option>
                  {MOCK_LABS.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.building} {lab.floor})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-500 mb-2">
                  班级
                </label>
                <input
                  type="text"
                  value={generateFormData.className}
                  onChange={(e) =>
                    setGenerateFormData((prev) => ({ ...prev, className: e.target.value }))
                  }
                  placeholder="请输入班级名称"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={generateFormData.startDate}
                    onChange={(e) =>
                      setGenerateFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-500 mb-2">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={generateFormData.endDate}
                    onChange={(e) =>
                      setGenerateFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowGenerateForm(false);
                  resetGenerateForm();
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button onClick={handleAutoGenerate} className="btn-primary flex-1">
                生成排课
              </button>
            </div>
          </div>
        </div>
      )}

      {showConflictModal && conflictInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">排课冲突</h3>
                <p className="text-dark-500 text-sm">检测到资源冲突，请选择解决方案</p>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
              <p className="text-warning text-sm">{conflictInfo.message}</p>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium text-dark-500 mb-3">推荐解决方案：</h4>
              {conflictInfo.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full p-4 bg-dark-300/50 border border-dark-400 rounded-lg text-left hover:border-primary-500/50 hover:bg-dark-300 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/30 transition-colors">
                      <CheckCircle className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {suggestion.alternativeTime}
                        {suggestion.alternativeLab && ` · ${suggestion.alternativeLab}`}
                      </p>
                      <p className="text-dark-500 text-sm mt-1">{suggestion.reason}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setConflictInfo(null);
                  setPendingSchedule(null);
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={submitSchedule}
                className="btn-primary flex-1"
              >
                强制创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
