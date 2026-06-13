import { Router, Request, Response } from 'express';
import { dataStore } from '../data/mockData';
import { authenticate, requireAdmin } from '../middleware/auth';
import type { ApiResponse, Schedule, Grade, ChemicalRequest } from '../../shared/types';

const router = Router();

router.get('/export/monthly-report', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<object>>) => {
  const { labId, courseId, startDate, endDate } = req.query;

  let schedules = [...dataStore.schedules];
  let grades = [...dataStore.grades];

  if (labId) {
    schedules = schedules.filter(s => s.labId === labId);
  }
  if (courseId) {
    schedules = schedules.filter(s => s.courseId === courseId);
    grades = grades.filter(g => g.courseId === courseId);
  }
  if (startDate) {
    schedules = schedules.filter(s => s.date >= startDate);
  }
  if (endDate) {
    schedules = schedules.filter(s => s.date <= endDate);
  }

  const labStats = dataStore.labs.map(lab => {
    const labSchedules = schedules.filter(s => s.labId === lab.id);
    const completedSchedules = labSchedules.filter(s => s.status === 'completed');
    const totalHours = labSchedules.reduce((sum, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      return sum + (eh - sh) + (em - sm) / 60;
    }, 0);

    return {
      labId: lab.id,
      labName: lab.name,
      building: lab.building,
      floor: lab.floor,
      capacity: lab.capacity,
      totalClasses: labSchedules.length,
      completedClasses: completedSchedules.length,
      utilizationRate: labSchedules.length > 0 ? Math.round((completedSchedules.length / labSchedules.length) * 100) : 0,
      totalTeachingHours: Math.round(totalHours * 10) / 10,
    };
  });

  const courseStats = dataStore.courses.map(course => {
    const courseSchedules = schedules.filter(s => s.courseId === course.id);
    const courseGrades = grades.filter(g => g.courseId === course.id);
    const avgScore = courseGrades.length > 0
      ? Math.round(courseGrades.reduce((sum, g) => sum + g.finalScore, 0) / courseGrades.length * 10) / 10
      : 0;

    return {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      department: course.department,
      credits: course.credits,
      totalClasses: courseSchedules.length,
      studentCount: new Set(courseSchedules.map(s => s.className)).size,
      averageScore: avgScore,
    };
  });

  const teacherStats = Array.from(new Set(schedules.map(s => s.teacherId))).map(teacherId => {
    const teacher = dataStore.users.find(u => u.id === teacherId);
    const teacherSchedules = schedules.filter(s => s.teacherId === teacherId);
    const teacherCourses = new Set(teacherSchedules.map(s => s.courseId));

    return {
      teacherId,
      teacherName: teacher?.name || '',
      department: teacher?.department || '',
      totalClasses: teacherSchedules.length,
      courseCount: teacherCourses.size,
      labCount: new Set(teacherSchedules.map(s => s.labId)).size,
    };
  });

  const summary = {
    totalLabs: labStats.length,
    totalCourses: courseStats.length,
    totalTeachers: teacherStats.length,
    totalClasses: schedules.length,
    completedClasses: schedules.filter(s => s.status === 'completed').length,
    averageUtilizationRate: labStats.length > 0
      ? Math.round(labStats.reduce((sum, l) => sum + l.utilizationRate, 0) / labStats.length)
      : 0,
    overallAverageScore: courseStats.length > 0
      ? Math.round(courseStats.reduce((sum, c) => sum + c.averageScore, 0) / courseStats.length * 10) / 10
      : 0,
    exportDate: new Date().toISOString(),
    filters: {
      labId: labId || null,
      courseId: courseId || null,
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };

  const reportData = {
    summary,
    labStatistics: labStats,
    courseStatistics: courseStats,
    teacherStatistics: teacherStats,
    scheduleDetails: schedules as Schedule[],
  };

  res.json({ success: true, data: reportData, message: '月度报告导出成功' });
});

router.get('/export/materials', authenticate, requireAdmin, (req: Request, res: Response<ApiResponse<object>>) => {
  const approvedRequests = dataStore.chemicalRequests.filter(r => r.status === 'approved' || r.status === 'completed');

  const materialDetails = approvedRequests.map(request => {
    const chemical = dataStore.chemicals.find(c => c.id === request.chemicalId);
    const requester = dataStore.users.find(u => u.id === request.requesterId);

    return {
      requestId: request.id,
      chemicalId: request.chemicalId,
      chemicalName: request.chemicalName,
      casNumber: chemical?.casNumber || '',
      category: chemical?.category || '',
      hazardLevel: chemical?.hazardLevel || 'low',
      unit: chemical?.unit || '',
      quantity: request.quantity,
      unitPrice: chemical?.unitPrice || 0,
      totalPrice: Math.round((chemical?.unitPrice || 0) * request.quantity * 100) / 100,
      purpose: request.purpose,
      requesterId: request.requesterId,
      requesterName: request.requesterName,
      requesterDepartment: requester?.department || '',
      supervisorId: request.supervisorId,
      supervisorName: dataStore.users.find(u => u.id === request.supervisorId)?.name || '',
      directorId: request.directorId,
      directorName: dataStore.users.find(u => u.id === request.directorId)?.name || '',
      status: request.status,
      createdAt: request.createdAt,
    };
  });

  const categoryStats = Array.from(new Set(materialDetails.map(m => m.category))).map(category => {
    const items = materialDetails.filter(m => m.category === category);
    return {
      category,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: Math.round(items.reduce((sum, i) => sum + i.totalPrice, 0) * 100) / 100,
    };
  });

  const requesterStats = Array.from(new Set(materialDetails.map(m => m.requesterId))).map(requesterId => {
    const items = materialDetails.filter(m => m.requesterId === requesterId);
    return {
      requesterId,
      requesterName: items[0]?.requesterName || '',
      department: items[0]?.requesterDepartment || '',
      requestCount: items.length,
      totalAmount: Math.round(items.reduce((sum, i) => sum + i.totalPrice, 0) * 100) / 100,
    };
  });

  const summary = {
    totalRequests: materialDetails.length,
    totalAmount: Math.round(materialDetails.reduce((sum, m) => sum + m.totalPrice, 0) * 100) / 100,
    categoryCount: categoryStats.length,
    requesterCount: requesterStats.length,
    exportDate: new Date().toISOString(),
  };

  const reportData = {
    summary,
    categoryStatistics: categoryStats,
    requesterStatistics: requesterStats,
    materialDetails: materialDetails as unknown as ChemicalRequest[],
  };

  res.json({ success: true, data: reportData, message: '耗材消耗明细导出成功' });
});

export default router;
