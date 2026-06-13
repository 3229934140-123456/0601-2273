import axios from 'axios';
import type {
  User,
  Schedule,
  ScheduleConflict,
  Reservation,
  Equipment,
  EquipmentBorrow,
  LabReport,
  Grade,
  Chemical,
  ChemicalRequest,
  PurchaseRequest,
  DashboardStats,
  Seat,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  WaitlistItem,
} from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

export const scheduleAPI = {
  list: (params?: { date?: string; teacherId?: string; labId?: string }) =>
    api.get<ApiResponse<Schedule[]>>('/schedule', { params }),
  create: (data: Omit<Schedule, 'id'>) =>
    api.post<ApiResponse<Schedule>>('/schedule', data),
  checkConflict: (data: Omit<Schedule, 'id'>) =>
    api.post<ApiResponse<ScheduleConflict | null>>('/schedule/check-conflict', data),
  generate: (params: { courseId: string; teacherId: string; labId: string; className: string; startDate: string; endDate: string }) =>
    api.get<ApiResponse<Schedule[]>>('/schedule/generate', { params }),
  update: (id: string, data: Partial<Schedule>) =>
    api.put<ApiResponse<Schedule>>(`/schedule/${id}`, data),
  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/schedule/${id}`),
};

export const reservationAPI = {
  list: (params?: { studentId?: string; scheduleId?: string; status?: string }) =>
    api.get<ApiResponse<Reservation[]>>('/reservation', { params }),
  create: (data: { scheduleId: string; seatId: string }) =>
    api.post<ApiResponse<Reservation>>('/reservation', data),
  confirm: (id: string) =>
    api.post<ApiResponse<Reservation>>(`/reservation/${id}/confirm`),
  getSeats: (labId: string, scheduleId?: string) =>
    api.get<ApiResponse<Seat[]>>(`/reservation/lab/${labId}/seats`, {
      params: scheduleId ? { scheduleId } : undefined,
    }),
  getWaitlist: (scheduleId?: string) =>
    api.get<ApiResponse<WaitlistItem[]>>('/reservation/waitlist', {
      params: scheduleId ? { scheduleId } : undefined,
    }),
  getMyWaitlist: () =>
    api.get<ApiResponse<WaitlistItem[]>>('/reservation/waitlist/my'),
  joinWaitlist: (data: { scheduleId: string; labId: string }) =>
    api.post<ApiResponse<WaitlistItem>>('/reservation/waitlist', data),
  leaveWaitlist: (id: string) =>
    api.delete<ApiResponse<void>>(`/reservation/waitlist/${id}`),
  claimWaitlist: (id: string) =>
    api.post<ApiResponse<Reservation>>(`/reservation/waitlist/${id}/claim`),
};

export const equipmentAPI = {
  list: (params?: { status?: string; category?: string; labId?: string }) =>
    api.get<ApiResponse<Equipment[]>>('/equipment', { params }),
  borrow: (data: { equipmentId: string; purpose: string; expectedReturnDate: string }) =>
    api.post<ApiResponse<EquipmentBorrow>>('/equipment/borrow', data),
  return: (id: string) =>
    api.post<ApiResponse<EquipmentBorrow>>(`/equipment/${id}/return`),
  myBorrows: () =>
    api.get<ApiResponse<EquipmentBorrow[]>>('/equipment/borrow/my'),
  approve: (id: string, data: { action: 'approve' | 'reject'; comment?: string }) =>
    api.put<ApiResponse<EquipmentBorrow>>(`/equipment/borrow/${id}/approve`, data),
};

export const reportAPI = {
  list: (params?: { courseId?: string; status?: string }) =>
    api.get<ApiResponse<LabReport[]>>('/report', { params }),
  submit: (data: Omit<LabReport, 'id' | 'studentId' | 'studentName' | 'status' | 'submittedAt'>) =>
    api.post<ApiResponse<LabReport>>('/report', data),
  checkSimilarity: (id: string) =>
    api.post<ApiResponse<{ similarityScore: number }>>(`/report/${id}/check-similarity`),
  grade: (id: string, data: { grade: number; feedback?: string }) =>
    api.post<ApiResponse<LabReport>>(`/report/${id}/grade`, data),
};

export const gradeAPI = {
  list: (params?: { courseId?: string; semester?: string }) =>
    api.get<ApiResponse<Grade[]>>('/grade', { params }),
  calculate: (params?: { courseId?: string; semester?: string }) =>
    api.get<ApiResponse<Grade[]>>('/grade/calculate', { params }),
};

export const chemicalAPI = {
  list: (params?: { hazardLevel?: string; category?: string }) =>
    api.get<ApiResponse<Chemical[]>>('/chemical', { params }),
  getRequests: (params?: { mine?: boolean }) =>
    api.get<ApiResponse<ChemicalRequest[]>>('/chemical/requests', { params }),
  request: (data: { chemicalId: string; quantity: number; purpose: string; supervisorId: string }) =>
    api.post<ApiResponse<ChemicalRequest>>('/chemical/request', data),
  approveSupervisor: (id: string, data: { approved: boolean; comment?: string }) =>
    api.post<ApiResponse<ChemicalRequest>>(`/chemical/request/${id}/approve-supervisor`, data),
  approveDirector: (id: string, data: { approved: boolean; comment?: string }) =>
    api.post<ApiResponse<ChemicalRequest>>(`/chemical/request/${id}/approve-director`, data),
  getPurchaseRequests: () =>
    api.get<ApiResponse<PurchaseRequest[]>>('/chemical/purchase-requests'),
  createPurchaseRequest: (data: { chemicalId: string; quantity: number; reason: string }) =>
    api.post<ApiResponse<PurchaseRequest>>('/chemical/purchase-requests', data),
  updatePurchaseRequest: (id: string, data: { status: PurchaseRequest['status'] }) =>
    api.put<ApiResponse<PurchaseRequest>>(`/chemical/purchase-requests/${id}`, data),
};

export const dashboardAPI = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  getStatsStream: (
    onMessage: (data: DashboardStats) => void,
    onConnectionChange?: (status: 'open' | 'error' | 'closed') => void
  ) => {
    const eventSource = new EventSource('/api/dashboard/stats/stream', {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      onConnectionChange?.('open');
    };

    eventSource.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data) as ApiResponse<DashboardStats>;
        if (response.success && response.data) {
          onMessage(response.data);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      if (eventSource.readyState === EventSource.CLOSED) {
        onConnectionChange?.('closed');
      } else {
        onConnectionChange?.('error');
      }
    };

    return eventSource;
  },
};

export const dataAPI = {
  exportMonthlyReport: (params?: { labId?: string; courseId?: string; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<any>>('/data/export/monthly-report', { params }),
  exportMaterials: () =>
    api.get<ApiResponse<any>>('/data/export/materials'),
};

export const userAPI = {
  list: (params?: { role?: string; department?: string }) =>
    api.get<ApiResponse<User[]>>('/users', { params }),
  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),
};

export default api;
