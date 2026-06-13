import { Router, Request, Response } from 'express';
import { dataStore, generateId } from '../data/mockData';
import { authenticate, requireTeacher } from '../middleware/auth';
import type { LabReport, ApiResponse, UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response<ApiResponse<LabReport[]>>) => {
  const { userId, userRole } = req as Request & { userId: string; userRole: UserRole };
  const { courseId, status } = req.query;

  let reports = [...dataStore.labReports];

  if (userRole === 'student') {
    reports = reports.filter(r => r.studentId === userId);
  }

  if (courseId) {
    reports = reports.filter(r => r.courseId === courseId);
  }

  if (status) {
    reports = reports.filter(r => r.status === status);
  }

  res.json({ success: true, data: reports as LabReport[] });
});

router.post('/', authenticate, (req: Request, res: Response<ApiResponse<LabReport>>) => {
  const { userId, userRole } = req as Request & { userId: string; userRole: UserRole };

  if (userRole !== 'student') {
    res.status(403).json({ success: false, error: '只有学生可以提交实验报告' });
    return;
  }

  const reportData = req.body as Omit<LabReport, 'id' | 'studentId' | 'studentName' | 'status' | 'submittedAt'>;

  if (!reportData.courseId || !reportData.title || !reportData.content) {
    res.status(400).json({ success: false, error: '缺少必要字段' });
    return;
  }

  const student = dataStore.users.find(u => u.id === userId);
  const course = dataStore.courses.find(c => c.id === reportData.courseId);

  if (!student || !course) {
    res.status(404).json({ success: false, error: '学生或课程不存在' });
    return;
  }

  const newReport: LabReport = {
    ...reportData,
    id: generateId(),
    studentId: userId,
    studentName: student.name,
    courseName: course.name,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };

  dataStore.labReports.push(newReport);
  res.json({ success: true, data: newReport, message: '实验报告提交成功' });
});

router.post('/:id/check-similarity', authenticate, (req: Request, res: Response<ApiResponse<{ similarityScore: number }>>) => {
  const { id } = req.params;
  const { userId, userRole } = req as Request & { userId: string; userRole: UserRole };

  const report = dataStore.labReports.find(r => r.id === id);
  if (!report) {
    res.status(404).json({ success: false, error: '实验报告不存在' });
    return;
  }

  if (userRole === 'student' && report.studentId !== userId) {
    res.status(403).json({ success: false, error: '无权查看他人的实验报告' });
    return;
  }

  const similarityScore = Math.floor(Math.random() * 101);

  report.similarityScore = similarityScore;
  report.status = 'reviewing';

  res.json({ success: true, data: { similarityScore }, message: '查重完成' });
});

router.post('/:id/grade', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<LabReport>>) => {
  const { id } = req.params;
  const { userId } = req as Request & { userId: string };
  const { grade, feedback } = req.body as { grade: number; feedback?: string };

  const report = dataStore.labReports.find(r => r.id === id);
  if (!report) {
    res.status(404).json({ success: false, error: '实验报告不存在' });
    return;
  }

  if (grade === undefined || grade < 0 || grade > 100) {
    res.status(400).json({ success: false, error: '请输入有效的分数（0-100）' });
    return;
  }

  report.grade = grade;
  report.feedback = feedback || '';
  report.graderId = userId;
  report.status = 'graded';
  report.gradedAt = new Date().toISOString();

  res.json({ success: true, data: report as LabReport, message: '批改完成' });
});

export default router;
