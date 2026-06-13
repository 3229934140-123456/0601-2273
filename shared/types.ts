export type UserRole = 'student' | 'teacher' | 'admin' | 'leader';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  department: string;
  creditScore: number;
  avatar?: string;
}

export interface Lab {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  description?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
}

export interface Schedule {
  id: string;
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
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  conflict?: boolean;
  conflictInfo?: string;
}

export interface ScheduleConflict {
  type: 'teacher' | 'lab' | 'equipment';
  message: string;
  suggestions: ScheduleSuggestion[];
}

export interface ScheduleSuggestion {
  alternativeTime: string;
  alternativeLab?: string;
  reason: string;
}

export interface Seat {
  id: string;
  labId: string;
  seatNumber: string;
  row: number;
  col: number;
  status: 'available' | 'occupied' | 'locked' | 'maintenance';
  equipment: string[];
}

export interface Reservation {
  id: string;
  studentId: string;
  studentName: string;
  scheduleId: string;
  labId: string;
  seatId: string;
  seatNumber: string;
  groupId?: string;
  status: 'pending' | 'locked' | 'confirmed' | 'cancelled' | 'completed';
  lockedAt?: string;
  lockExpiresAt?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  brand: string;
  labId: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'lost';
  category: string;
  purchaseDate: string;
  price: number;
}

export interface EquipmentBorrow {
  id: string;
  equipmentId: string;
  equipmentName: string;
  borrowerId: string;
  borrowerName: string;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue';
  approverId?: string;
  creditPenalty?: number;
}

export interface LabReport {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  title: string;
  content: string;
  attachments?: string[];
  similarityScore?: number;
  status: 'draft' | 'submitted' | 'reviewing' | 'graded' | 'rejected';
  grade?: number;
  feedback?: string;
  graderId?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  reportGrades: { reportId: string; title: string; score: number; weight: number }[];
  operationScore: number;
  operationWeight: number;
  finalScore: number;
  semester: string;
}

export interface Chemical {
  id: string;
  name: string;
  casNumber: string;
  category: string;
  hazardLevel: 'low' | 'medium' | 'high' | 'extreme';
  unit: string;
  currentStock: number;
  safetyStock: number;
  unitPrice: number;
  location: string;
}

export interface ChemicalRequest {
  id: string;
  chemicalId: string;
  chemicalName: string;
  requesterId: string;
  requesterName: string;
  quantity: number;
  purpose: string;
  supervisorId: string;
  supervisorStatus: 'pending' | 'approved' | 'rejected';
  supervisorComment?: string;
  directorId: string;
  directorStatus: 'pending' | 'approved' | 'rejected';
  directorComment?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  chemicalId: string;
  chemicalName: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';
  createdBy: string;
  createdAt: string;
}

export interface DashboardStats {
  labOccupancy: { labId: string; labName: string; rate: number }[];
  equipmentCondition: { total: number; good: number; maintenance: number; broken: number };
  todayStudents: number;
  reportSubmissionRate: number;
  hourlyTrend: { hour: number; count: number }[];
  labStatus: { id: string; name: string; status: 'free' | 'occupied' | 'maintenance'; currentCourse?: string }[];
  alerts: { id: string; type: 'warning' | 'danger'; message: string; timestamp: string }[];
}

export interface WaitlistItem {
  id: string;
  scheduleId: string;
  labId: string;
  studentId: string;
  studentName: string;
  position: number;
  notifiedAvailableAt?: string;
  status: 'waiting' | 'notified' | 'cancelled' | 'confirmed';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
