import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireTeacher } from '../middleware/auth';
import type { Schedule, ApiResponse, ScheduleConflict, ScheduleSuggestion } from '../../shared/types';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response<ApiResponse<Schedule[]>>) => {
  const { date, teacherId, labId } = req.query;
  const reqWithAuth = req as Request & { userId: string; userRole: string };
  let schedules = [...dataStore.schedules];

  if (reqWithAuth.userRole === 'student') {
    const userId = reqWithAuth.userId;
    schedules = schedules.filter(s =>
      s.studentIds === undefined ||
      s.studentIds.length === 0 ||
      s.studentIds.includes(userId)
    );
  }

  if (date) {
    schedules = schedules.filter(s => s.date === date);
  }
  if (teacherId) {
    schedules = schedules.filter(s => s.teacherId === teacherId);
  }
  if (labId) {
    schedules = schedules.filter(s => s.labId === labId);
  }

  res.json({ success: true, data: schedules as Schedule[] });
});

router.post('/', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<Schedule>>) => {
  const scheduleData = req.body as Omit<Schedule, 'id'>;

  const conflicts = checkConflicts(scheduleData);
  if (conflicts.length > 0) {
    res.status(400).json({
      success: false,
      error: '存在资源冲突',
      data: {
        ...scheduleData,
        id: '',
        conflict: true,
        conflictInfo: conflicts[0].message,
      } as unknown as Schedule,
    });
    return;
  }

  const newSchedule: Schedule = {
    ...scheduleData,
    id: generateId(),
  };

  dataStore.schedules.push(newSchedule);
  res.json({ success: true, data: newSchedule, message: '排课创建成功' });
});

router.post('/check-conflict', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<ScheduleConflict | null>>) => {
  const scheduleData = req.body as Omit<Schedule, 'id'>;
  const conflicts = checkConflicts(scheduleData);

  if (conflicts.length === 0) {
    res.json({ success: true, data: null });
    return;
  }

  res.json({ success: true, data: conflicts[0] });
});

router.get('/generate', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<Schedule[]>>) => {
  const { courseId, teacherId, labId, className, startDate, endDate } = req.query;

  if (!courseId || !teacherId || !labId || !className || !startDate || !endDate) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }

  const course = dataStore.courses.find(c => c.id === courseId);
  const teacher = dataStore.users.find(u => u.id === teacherId);
  const lab = dataStore.labs.find(l => l.id === labId);

  if (!course || !teacher || !lab) {
    res.status(404).json({ success: false, error: '课程、教师或实验室不存在' });
    return;
  }

  const generatedSchedules: Schedule[] = [];
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
    const dateStr = d.toISOString().split('T')[0];
    const schedule: Schedule = {
      id: generateId(),
      courseId: courseId as string,
      courseName: course.name,
      teacherId: teacherId as string,
      teacherName: teacher.name,
      labId: labId as string,
      labName: lab.name,
      className: className as string,
      date: dateStr,
      startTime: '08:30',
      endTime: '10:30',
      status: 'scheduled',
    };

    const conflicts = checkConflicts(schedule);
    if (conflicts.length > 0) {
      schedule.conflict = true;
      schedule.conflictInfo = conflicts[0].message;
    }

    generatedSchedules.push(schedule);
  }

  res.json({ success: true, data: generatedSchedules, message: '已生成课表草稿' });
});

router.put('/:id', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<Schedule>>) => {
  const { id } = req.params;
  const scheduleData = req.body as Partial<Schedule>;

  const index = dataStore.schedules.findIndex(s => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '排课不存在' });
    return;
  }

  dataStore.schedules[index] = { ...dataStore.schedules[index], ...scheduleData };
  res.json({ success: true, data: dataStore.schedules[index] as Schedule, message: '排课更新成功' });
});

router.delete('/:id', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<void>>) => {
  const { id } = req.params;

  const index = dataStore.schedules.findIndex(s => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: '排课不存在' });
    return;
  }

  dataStore.schedules.splice(index, 1);
  res.json({ success: true, message: '排课已删除' });
});

function checkConflicts(schedule: Omit<Schedule, 'id'>): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  const existingSchedules = dataStore.schedules.filter(
    s => s.date === schedule.date && s.status !== 'cancelled' && s.id !== (schedule as Schedule).id
  );

  for (const existing of existingSchedules) {
    const timeOverlap = checkTimeOverlap(
      schedule.startTime, schedule.endTime,
      existing.startTime, existing.endTime
    );

    if (timeOverlap) {
      if (existing.teacherId === schedule.teacherId) {
        conflicts.push({
          type: 'teacher',
          message: `教师 ${schedule.teacherName} 在该时间段已有课程：${existing.courseName}`,
          suggestions: generateSuggestions(schedule, existing),
        });
      }

      if (existing.labId === schedule.labId) {
        conflicts.push({
          type: 'lab',
          message: `实验室 ${schedule.labName} 在该时间段已被占用：${existing.courseName}`,
          suggestions: generateSuggestions(schedule, existing),
        });
      }
    }
  }

  return conflicts;
}

function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return !(e1 <= s2 || e2 <= s1);
}

function generateSuggestions(schedule: Omit<Schedule, 'id'>, conflicting: Schedule): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = [];

  suggestions.push({
    alternativeTime: `${conflicting.endTime} - ${addHours(conflicting.endTime, 2)}`,
    reason: '顺延至冲突课程结束后',
  });

  const otherLabs = dataStore.labs.filter(l => l.id !== schedule.labId);
  if (otherLabs.length > 0) {
    suggestions.push({
      alternativeTime: `${schedule.startTime} - ${schedule.endTime}`,
      alternativeLab: otherLabs[0].name,
      reason: `更换至 ${otherLabs[0].name}`,
    });
  }

  suggestions.push({
    alternativeTime: '改日同一时段',
    reason: '调整至其他周次',
  });

  return suggestions;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newH = h + hours;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default router;
