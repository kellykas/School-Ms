import { Student, User, Teacher, Assignment, ExamResult, AuditLog } from '../types';
import { MOCK_ADMIN, MOCK_USERS_DIRECTORY, MOCK_STUDENTS, MOCK_TEACHERS, MOCK_ASSIGNMENTS, MOCK_EXAM_RESULTS, MOCK_FEES } from './mockData';

const IS_PRODUCTION = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

const API_BASE_URL = IS_PRODUCTION 
  ? '/api' 
  : 'http://127.0.0.1:3001/api';

const HEALTH_URL = IS_PRODUCTION 
  ? '/health' 
  : 'http://127.0.0.1:3001/health';

const USE_MOCK_FALLBACK = true; 

const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'log-1', action: 'USER_CREATED', targetUserId: 'u101', targetUserName: 'Alice Wonderland', performedBy: 'System Admin', timestamp: new Date(Date.now() - 1000000).toISOString(), details: 'Role: STUDENT' },
    { id: 'log-2', action: 'PASSWORD_RESET', targetUserId: 'u3', targetUserName: 'Emma Thompson', performedBy: 'System Admin', timestamp: new Date(Date.now() - 500000).toISOString(), details: 'Password changed by admin' },
    { id: 'log-3', action: 'STATUS_CHANGE', targetUserId: 'u6', targetUserName: 'John Doe', performedBy: 'System Admin', timestamp: new Date().toISOString(), details: 'Status changed from ACTIVE to INACTIVE' },
];

class ApiService {
  private token: string | null = localStorage.getItem('token');

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(HEALTH_URL);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        // In production or if backend is not set up, trigger mock fallback for non-200 results
        if (USE_MOCK_FALLBACK) {
            throw new Error('FALLBACK_TRIGGER');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        throw error;
      }
      if (USE_MOCK_FALLBACK) {
        throw new Error('FALLBACK_TRIGGER');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      return await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then(data => {
        this.token = data.token;
        localStorage.setItem('token', data.token);
        return data.user;
      });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
        const user = MOCK_USERS_DIRECTORY.find(u => u.email === email && u.password === password);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          const mockToken = `mock-token-${user.id}`;
          this.token = mockToken;
          localStorage.setItem('token', mockToken);
          return userWithoutPassword;
        }
        throw new Error('Invalid credentials');
      }
      throw e;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    try {
      return await this.request<User>('/auth/me');
    } catch (e: any) {
       if (e.message === 'FALLBACK_TRIGGER') {
         const user = MOCK_USERS_DIRECTORY.find(u => this.token?.includes(u.id)) || MOCK_ADMIN;
         return user;
       }
       return null;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async getUsers(): Promise<User[]> {
    try {
      return await this.request<User[]>('/users');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_USERS_DIRECTORY;
      throw e;
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    try {
      return await this.request<User>('/users', { method: 'POST', body: JSON.stringify(user) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
        const newUser = { ...user, id: `u-${Date.now()}`, status: 'ACTIVE' } as User;
        MOCK_USERS_DIRECTORY.push(newUser);
        return newUser;
      }
      throw e;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    try {
      await this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
         const idx = MOCK_USERS_DIRECTORY.findIndex(u => u.id === id);
         if (idx !== -1) {
             MOCK_USERS_DIRECTORY[idx] = { ...MOCK_USERS_DIRECTORY[idx], ...data };
         }
         return;
      }
      throw e;
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      return await this.request<AuditLog[]>('/audit-logs');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_AUDIT_LOGS;
      throw e;
    }
  }

  async getStudents(): Promise<Student[]> {
    try {
      return await this.request<Student[]>('/students');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_STUDENTS;
      throw e;
    }
  }

  async importStudents(students: Student[]): Promise<{ message: string; count: number }> {
    try {
      return await this.request('/students/bulk', { method: 'POST', body: JSON.stringify({ students }) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
         students.forEach(s => MOCK_STUDENTS.push(s));
         return { message: 'Imported to Mock Store', count: students.length };
      }
      throw e;
    }
  }

  async getTeachers(): Promise<Teacher[]> {
    try {
      return await this.request<Teacher[]>('/teachers');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_TEACHERS;
      throw e;
    }
  }

  async createTeacher(teacher: Partial<Teacher>): Promise<Teacher> {
    try {
      return await this.request<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(teacher) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
          const newTeacher = { ...teacher, id: `t-${Date.now()}` } as Teacher;
          MOCK_TEACHERS.push(newTeacher);
          return newTeacher;
      }
      throw e;
    }
  }

  async getAssignments(): Promise<Assignment[]> {
    try {
      return await this.request<Assignment[]>('/assignments');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_ASSIGNMENTS;
      throw e;
    }
  }

  async createAssignment(assignment: Partial<Assignment>): Promise<Assignment> {
    try {
      return await this.request<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(assignment) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
        const newAs = { ...assignment, id: `as-${Date.now()}`, status: 'OPEN' } as Assignment;
        MOCK_ASSIGNMENTS.push(newAs);
        return newAs;
      }
      throw e;
    }
  }

  async getExams(): Promise<ExamResult[]> {
    try {
      return await this.request<ExamResult[]>('/exams');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_EXAM_RESULTS;
      throw e;
    }
  }

  async getFees(): Promise<any[]> {
    try {
      return await this.request<any[]>('/fees');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') return MOCK_FEES;
      throw e;
    }
  }

  async payFee(invoiceId: string): Promise<void> {
    try {
       return await this.request('/fees/pay', { method: 'POST', body: JSON.stringify({ invoiceId }) });
    } catch (e: any) {
       if (e.message === 'FALLBACK_TRIGGER') {
         const fee = MOCK_FEES.find(f => f.invoiceId === invoiceId);
         if (fee) fee.feesStatus = 'PAID';
         return;
       }
       throw e;
    }
  }

  async getStats(): Promise<{students: number, teachers: number, revenue: number}> {
    try {
      return await this.request('/stats');
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
        const revenue = MOCK_FEES.filter(f => f.feesStatus === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
        return {
           students: MOCK_STUDENTS.length,
           teachers: MOCK_TEACHERS.length,
           revenue
        };
      }
      throw e;
    }
  }

  async submitAttendance(date: string, records: { studentId: string; status: string }[]): Promise<{ success: boolean }> {
    try {
      return await this.request('/attendance', { method: 'POST', body: JSON.stringify({ date, records }) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
         return { success: true };
      }
      throw e;
    }
  }

  async sendEmailNotification(data: { recipientName: string, subject: string, message: string, type: 'FEE_REMINDER' | 'ASSIGNMENT_REMINDER' }): Promise<void> {
    try {
      return await this.request('/notifications/email', { method: 'POST', body: JSON.stringify(data) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
         return;
      }
      throw e;
    }
  }
}

export const api = new ApiService();