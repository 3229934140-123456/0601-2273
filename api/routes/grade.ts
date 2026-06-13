import { Router, Request, Response } from 'express';
import { dataStore } from '../data/mockData';
import { authenticate, requireTeacher } from '../middleware/auth';
import type { Grade, ApiResponse, UserRole } from '../../shared/types';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response<ApiResponse<Grade[]>>) => {
  const { userId, userRole } = req as Request & { userId: string; userRole: UserRole };
  const { courseId, semester } = req.query;

  let grades = [...dataStore.grades];

  if (userRole === 'student') {
    grades = grades.filter(g => g.studentId === userId);
  }

  if (courseId) {
    grades = grades.filter(g => g.courseId === courseId);
  }

  if (semester) {
    grades = grades.filter(g => g.semester === semester);
  }

  res.json({ success: true, data: grades as Grade[] });
});

router.get('/calculate', authenticate, requireTeacher, (req: Request, res: Response<ApiResponse<Grade[]>>) => {
  const { courseId, semester } = req.query;

  let grades = [...dataStore.grades];

  if (courseId) {
    grades = grades.filter(g => g.courseId === courseId);
  }

  if (semester) {
    grades = grades.filter(g => g.semester === semester);
  }

  const calculatedGrades: Grade[] = grades.map(grade => {
    let reportTotal = 0;
    let reportWeightTotal = 0;

    for (const rg of grade.reportGrades) {
      reportTotal += rg.score * rg.weight;
      reportWeightTotal += rg.weight;
    }

    const reportScore = reportWeightTotal > 0 ? reportTotal / reportWeightTotal : 0;
    const reportWeight = 100 - grade.operationWeight;
    const finalScore = (reportScore * reportWeight + grade.operationScore * grade.operationWeight) / 100;

    const updatedGrade: Grade = {
      ...grade,
      finalScore: Math.round(finalScore * 10) / 10,
    };

    const index = dataStore.grades.findIndex(g => g.id === grade.id);
    if (index !== -1) {
      dataStore.grades[index] = updatedGrade;
    }

    return updatedGrade;
  });

  res.json({ success: true, data: calculatedGrades as Grade[], message: '成绩计算完成' });
});

export default router;
