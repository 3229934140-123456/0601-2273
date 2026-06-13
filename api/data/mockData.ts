import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Lab,
  Course,
  Schedule,
  Seat,
  Reservation,
  Equipment,
  EquipmentBorrow,
  LabReport,
  Grade,
  Chemical,
  ChemicalRequest,
  PurchaseRequest,
  DashboardStats,
} from '../../shared/types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'student1',
    name: '张三',
    role: 'student',
    email: 'zhangsan@edu.cn',
    phone: '13800138001',
    department: '计算机学院',
    creditScore: 95,
  },
  {
    id: 'u2',
    username: 'student2',
    name: '李四',
    role: 'student',
    email: 'lisi@edu.cn',
    phone: '13800138002',
    department: '计算机学院',
    creditScore: 88,
  },
  {
    id: 'u3',
    username: 'teacher1',
    name: '王教授',
    role: 'teacher',
    email: 'wangpro@edu.cn',
    phone: '13900139001',
    department: '计算机学院',
    creditScore: 100,
  },
  {
    id: 'u4',
    username: 'admin1',
    name: '实验室管理员',
    role: 'admin',
    email: 'admin@edu.cn',
    phone: '13700137001',
    department: '实验中心',
    creditScore: 100,
  },
  {
    id: 'u5',
    username: 'leader1',
    name: '李院长',
    role: 'leader',
    email: 'dean@edu.cn',
    phone: '13600136001',
    department: '计算机学院',
    creditScore: 100,
  },
];

export const mockLabs: Lab[] = [
  { id: 'lab1', name: '计算机实验室A', building: '实验楼', floor: '3层', capacity: 40, description: '配备高性能计算机，用于编程实验' },
  { id: 'lab2', name: '计算机实验室B', building: '实验楼', floor: '3层', capacity: 35, description: '配备网络设备，用于网络实验' },
  { id: 'lab3', name: '电子实验室', building: '实验楼', floor: '2层', capacity: 30, description: '配备电子实验设备' },
  { id: 'lab4', name: '化学实验室', building: '化学楼', floor: '1层', capacity: 25, description: '配备化学实验设备和通风橱' },
  { id: 'lab5', name: '物理实验室', building: '物理楼', floor: '2层', capacity: 30, description: '配备物理实验设备' },
];

export const mockCourses: Course[] = [
  { id: 'c1', name: '数据结构实验', code: 'CS101', department: '计算机学院', credits: 2 },
  { id: 'c2', name: '操作系统实验', code: 'CS201', department: '计算机学院', credits: 2 },
  { id: 'c3', name: '计算机网络实验', code: 'CS301', department: '计算机学院', credits: 2 },
  { id: 'c4', name: '数据库系统实验', code: 'CS401', department: '计算机学院', credits: 2 },
  { id: 'c5', name: '软件工程实验', code: 'CS501', department: '计算机学院', credits: 3 },
];

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    courseId: 'c1',
    courseName: '数据结构实验',
    teacherId: 'u3',
    teacherName: '王教授',
    labId: 'lab1',
    labName: '计算机实验室A',
    className: '计算机2301班',
    date: '2026-06-15',
    startTime: '08:30',
    endTime: '10:30',
    status: 'scheduled',
  },
  {
    id: 's2',
    courseId: 'c2',
    courseName: '操作系统实验',
    teacherId: 'u3',
    teacherName: '王教授',
    labId: 'lab1',
    labName: '计算机实验室A',
    className: '计算机2301班',
    date: '2026-06-16',
    startTime: '14:00',
    endTime: '16:00',
    status: 'scheduled',
  },
  {
    id: 's3',
    courseId: 'c3',
    courseName: '计算机网络实验',
    teacherId: 'u3',
    teacherName: '王教授',
    labId: 'lab2',
    labName: '计算机实验室B',
    className: '计算机2302班',
    date: '2026-06-14',
    startTime: '08:30',
    endTime: '10:30',
    status: 'ongoing',
  },
  {
    id: 's4',
    courseId: 'c4',
    courseName: '数据库系统实验',
    teacherId: 'u3',
    teacherName: '王教授',
    labId: 'lab1',
    labName: '计算机实验室A',
    className: '计算机2302班',
    date: '2026-06-13',
    startTime: '14:00',
    endTime: '16:00',
    status: 'completed',
  },
];

export const mockSeats: Seat[] = (() => {
  const seats: Seat[] = [];
  for (let labIdx = 0; labIdx < 2; labIdx++) {
    const labId = `lab${labIdx + 1}`;
    const rows = 5;
    const cols = 8;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const rand = Math.random();
        let status: Seat['status'] = 'available';
        if (rand < 0.3) status = 'occupied';
        else if (rand < 0.4) status = 'locked';
        else if (rand < 0.42) status = 'maintenance';
        seats.push({
          id: `seat-${labId}-${row}-${col}`,
          labId,
          seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
          row,
          col,
          status,
          equipment: ['电脑', '显示器'],
        });
      }
    }
  }
  return seats;
})();

export const mockReservations: Reservation[] = [
  {
    id: 'r1',
    studentId: 'u1',
    studentName: '张三',
    scheduleId: 's1',
    labId: 'lab1',
    seatId: 'seat-lab1-0-0',
    seatNumber: 'A1',
    status: 'confirmed',
    createdAt: '2026-06-13T10:00:00Z',
  },
  {
    id: 'r2',
    studentId: 'u2',
    studentName: '李四',
    scheduleId: 's1',
    labId: 'lab1',
    seatId: 'seat-lab1-0-1',
    seatNumber: 'A2',
    status: 'locked',
    lockedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    createdAt: '2026-06-13T10:30:00Z',
  },
];

export const mockEquipments: Equipment[] = [
  { id: 'e1', name: '笔记本电脑', model: 'ThinkPad X1', brand: 'Lenovo', labId: 'lab1', status: 'available', category: '计算机', purchaseDate: '2023-09-01', price: 8999 },
  { id: 'e2', name: '投影仪', model: 'CB-FH52', brand: 'Epson', labId: 'lab1', status: 'available', category: '显示设备', purchaseDate: '2023-06-15', price: 5999 },
  { id: 'e3', name: '示波器', model: 'DS1054Z', brand: 'Rigol', labId: 'lab3', status: 'available', category: '电子设备', purchaseDate: '2022-12-20', price: 3599 },
  { id: 'e4', name: '万用表', model: 'Fluke 17B+', brand: 'Fluke', labId: 'lab3', status: 'borrowed', category: '电子设备', purchaseDate: '2023-03-10', price: 899 },
  { id: 'e5', name: '网络分析仪', model: 'N9310A', brand: 'Agilent', labId: 'lab2', status: 'maintenance', category: '网络设备', purchaseDate: '2022-08-05', price: 28000 },
  { id: 'e6', name: '烧杯套装', model: '50-1000ml', brand: '蜀玻', labId: 'lab4', status: 'available', category: '化学器皿', purchaseDate: '2023-09-10', price: 299 },
];

export const mockEquipmentBorrows: EquipmentBorrow[] = [
  {
    id: 'eb1',
    equipmentId: 'e4',
    equipmentName: '万用表',
    borrowerId: 'u1',
    borrowerName: '张三',
    purpose: '电子电路实验测量',
    borrowDate: '2026-06-10',
    expectedReturnDate: '2026-06-12',
    status: 'overdue',
    creditPenalty: 5,
  },
  {
    id: 'eb2',
    equipmentId: 'e1',
    equipmentName: '笔记本电脑',
    borrowerId: 'u2',
    borrowerName: '李四',
    purpose: '课程设计编程',
    borrowDate: '2026-06-12',
    expectedReturnDate: '2026-06-14',
    status: 'borrowed',
    approverId: 'u3',
  },
];

export const mockLabReports: LabReport[] = [
  {
    id: 'rep1',
    studentId: 'u1',
    studentName: '张三',
    courseId: 'c1',
    courseName: '数据结构实验',
    title: '栈和队列的实现与应用',
    content: '## 实验目的\n掌握栈和队列的基本操作...\n\n## 实验内容\n1. 实现顺序栈...\n2. 实现链队列...',
    similarityScore: 15,
    status: 'graded',
    grade: 92,
    feedback: '代码实现完整，分析深入，优秀！',
    graderId: 'u3',
    submittedAt: '2026-06-10T15:30:00Z',
    gradedAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 'rep2',
    studentId: 'u2',
    studentName: '李四',
    courseId: 'c1',
    courseName: '数据结构实验',
    title: '栈和队列的实现与应用',
    content: '## 实验目的\n...',
    similarityScore: 78,
    status: 'reviewing',
    submittedAt: '2026-06-11T16:00:00Z',
  },
  {
    id: 'rep3',
    studentId: 'u1',
    studentName: '张三',
    courseId: 'c2',
    courseName: '操作系统实验',
    title: '进程调度算法模拟',
    content: '## 实验目的\n...',
    status: 'draft',
    submittedAt: '',
  },
];

export const mockGrades: Grade[] = [
  {
    id: 'g1',
    studentId: 'u1',
    studentName: '张三',
    courseId: 'c1',
    courseName: '数据结构实验',
    reportGrades: [
      { reportId: 'rep1', title: '第一次实验', score: 92, weight: 50 },
      { reportId: 'rep4', title: '第二次实验', score: 88, weight: 50 },
    ],
    operationScore: 90,
    operationWeight: 30,
    finalScore: 90.5,
    semester: '2025-2026春季',
  },
  {
    id: 'g2',
    studentId: 'u2',
    studentName: '李四',
    courseId: 'c1',
    courseName: '数据结构实验',
    reportGrades: [
      { reportId: 'rep2', title: '第一次实验', score: 0, weight: 50 },
    ],
    operationScore: 85,
    operationWeight: 30,
    finalScore: 0,
    semester: '2025-2026春季',
  },
];

export const mockChemicals: Chemical[] = [
  { id: 'chem1', name: '硫酸', casNumber: '7664-93-9', category: '酸', hazardLevel: 'high', unit: 'L', currentStock: 15, safetyStock: 10, unitPrice: 120, location: '化学柜A-1' },
  { id: 'chem2', name: '氢氧化钠', casNumber: '1310-73-2', category: '碱', hazardLevel: 'medium', unit: 'kg', currentStock: 8, safetyStock: 5, unitPrice: 45, location: '化学柜A-2' },
  { id: 'chem3', name: '乙醇', casNumber: '64-17-5', category: '有机溶剂', hazardLevel: 'medium', unit: 'L', currentStock: 25, safetyStock: 20, unitPrice: 85, location: '防爆柜B-1' },
  { id: 'chem4', name: '丙酮', casNumber: '67-64-1', category: '有机溶剂', hazardLevel: 'medium', unit: 'L', currentStock: 3, safetyStock: 10, unitPrice: 95, location: '防爆柜B-2' },
  { id: 'chem5', name: '氰化钾', casNumber: '151-50-8', category: '剧毒', hazardLevel: 'extreme', unit: 'g', currentStock: 50, safetyStock: 100, unitPrice: 280, location: '保险柜C-1' },
];

export const mockChemicalRequests: ChemicalRequest[] = [
  {
    id: 'cr1',
    chemicalId: 'chem1',
    chemicalName: '硫酸',
    requesterId: 'u3',
    requesterName: '王教授',
    quantity: 2,
    purpose: '分析化学实验',
    supervisorId: 'u3',
    supervisorStatus: 'approved',
    directorId: 'u4',
    directorStatus: 'pending',
    status: 'pending',
    createdAt: '2026-06-12T09:00:00Z',
  },
  {
    id: 'cr2',
    chemicalId: 'chem3',
    chemicalName: '乙醇',
    requesterId: 'u3',
    requesterName: '王教授',
    quantity: 5,
    purpose: '有机化学实验',
    supervisorId: 'u3',
    supervisorStatus: 'approved',
    supervisorComment: '同意领用',
    directorId: 'u4',
    directorStatus: 'approved',
    directorComment: '批准',
    status: 'approved',
    createdAt: '2026-06-10T14:30:00Z',
  },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr1',
    chemicalId: 'chem4',
    chemicalName: '丙酮',
    quantity: 20,
    reason: '库存低于安全线，实验教学需要',
    status: 'pending',
    createdBy: 'u4',
    createdAt: '2026-06-13T10:00:00Z',
  },
  {
    id: 'pr2',
    chemicalId: 'chem5',
    chemicalName: '氰化钾',
    quantity: 100,
    reason: '库存不足，需要补充',
    status: 'approved',
    createdBy: 'u4',
    createdAt: '2026-06-11T11:00:00Z',
  },
];

export function generateDashboardStats(): DashboardStats {
  return {
    labOccupancy: [
      { labId: 'lab1', labName: '计算机实验室A', rate: Math.floor(Math.random() * 30) + 60 },
      { labId: 'lab2', labName: '计算机实验室B', rate: Math.floor(Math.random() * 30) + 50 },
      { labId: 'lab3', labName: '电子实验室', rate: Math.floor(Math.random() * 30) + 40 },
      { labId: 'lab4', labName: '化学实验室', rate: Math.floor(Math.random() * 20) + 30 },
      { labId: 'lab5', labName: '物理实验室', rate: Math.floor(Math.random() * 20) + 20 },
    ],
    equipmentCondition: {
      total: 156,
      good: 142,
      maintenance: 12,
      broken: 2,
    },
    todayStudents: Math.floor(Math.random() * 50) + 200,
    reportSubmissionRate: Math.floor(Math.random() * 20) + 75,
    hourlyTrend: Array.from({ length: 12 }, (_, i) => ({
      hour: i + 8,
      count: Math.floor(Math.random() * 30) + 10,
    })),
    labStatus: [
      { id: 'lab1', name: '计算机实验室A', status: 'occupied', currentCourse: '计算机网络实验' },
      { id: 'lab2', name: '计算机实验室B', status: 'free' },
      { id: 'lab3', name: '电子实验室', status: 'maintenance' },
      { id: 'lab4', name: '化学实验室', status: 'free' },
      { id: 'lab5', name: '物理实验室', status: 'occupied', currentCourse: '力学实验' },
    ],
    alerts: [
      { id: 'a1', type: 'danger', message: '丙酮库存低于安全线，请及时采购', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'a2', type: 'warning', message: '设备借用eb1已逾期2天', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'a3', type: 'warning', message: '氰化钾库存不足100g', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ],
  };
}

interface DataStore {
  users: User[];
  labs: Lab[];
  courses: Course[];
  schedules: Schedule[];
  seats: Seat[];
  reservations: Reservation[];
  equipments: Equipment[];
  equipmentBorrows: EquipmentBorrow[];
  labReports: LabReport[];
  grades: Grade[];
  chemicals: Chemical[];
  chemicalRequests: ChemicalRequest[];
  purchaseRequests: PurchaseRequest[];
}

export const dataStore: DataStore = {
  users: [...mockUsers],
  labs: [...mockLabs],
  courses: [...mockCourses],
  schedules: [...mockSchedules],
  seats: [...mockSeats],
  reservations: [...mockReservations],
  equipments: [...mockEquipments],
  equipmentBorrows: [...mockEquipmentBorrows],
  labReports: [...mockLabReports],
  grades: [...mockGrades],
  chemicals: [...mockChemicals],
  chemicalRequests: [...mockChemicalRequests],
  purchaseRequests: [...mockPurchaseRequests],
};

export function generateId(): string {
  return uuidv4();
}
