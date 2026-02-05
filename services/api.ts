import { Student, User, Teacher, Assignment, ExamResult, AuditLog } from '../types';
import { MOCK_ADMIN, MOCK_USERS_DIRECTORY, MOCK_STUDENTS, MOCK_TEACHERS, MOCK_ASSIGNMENTS, MOCK_EXAM_RESULTS, MOCK_FEES } from './mockData';

// Use 127.0.0.1 to force IPv4 and avoid localhost DNS issues
const API_BASE_URL = 'http://127.0.0.1:3001/api';
const HEALTH_URL = 'http://127.0.0.1:3001/health';

// ENABLE FALLBACK: Allow app to work if backend is down
const USE_MOCK_FALLBACK = true; 

// Mock Audit Logs for Fallback
const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'log-1', action: 'USER_CREATED', targetUserId: 'u101', targetUserName: 'Alice Wonderland', performedBy: 'System Admin', timestamp: new Date(Date.now() - 1000000).toISOString(), details: 'Role: STUDENT' },
    { id: 'log-2', action: 'PASSWORD_RESET', targetUserId: 'u3', targetUserName: 'Emma Thompson', performedBy: 'System Admin', timestamp: new Date(Date.now() - 500000).toISOString(), details: 'Password changed by admin' },
    { id: 'log-3', action: 'STATUS_CHANGE', targetUserId: 'u6', targetUserName: 'John Doe', performedBy: 'System Admin', timestamp: new Date().toISOString(), details: 'Status changed from ACTIVE to INACTIVE' },
];

class ApiService {
  private token: string | null = localStorage.getItem('token');

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : '',
    };
  }

  // Check if backend is reachable
  async checkHealth(): Promise<boolean> {
    try {
      // console.log(`Checking backend connection at ${HEALTH_URL}...`);
      const res = await fetch(HEALTH_URL);
      return res.ok;
    } catch (e) {
      if (!USE_MOCK_FALLBACK) console.error("Backend connection FAILED.", e);
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
        if (window.location.pathname !== '/') {
           window.location.reload();
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      // If Fallback is disabled, rethrow the error
      if (!USE_MOCK_FALLBACK) {
        console.error(`API Fetch Error [${endpoint}]:`, error);
        throw new Error(error.message || 'Connection to server failed.');
      }
      
      // If Fallback is enabled, throw specific error code to be caught by method
      throw new Error('FALLBACK_TRIGGER');
    }
  }

  // --- Auth ---
  
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
        console.log("Using Mock Login Fallback");
        const user = MOCK_USERS_DIRECTORY.find(u => u.email === email && u.password === password);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          const mockToken = `mock-token-${user.id}`;
          this.token = mockToken;
          localStorage.setItem('token', mockToken);
          return userWithoutPassword;
        }
        throw new Error('Invalid credentials (Mock Mode)');
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
         // Mock logic: assume token contains ID or just return Admin if token exists
         if (this.token?.includes('u')) {
             const id = this.token.replace('mock-token-', '');
             // This simple logic might fail if token structure differs, fallback to Admin for simplicity in demo
             const user = MOCK_USERS_DIRECTORY.find(u => this.token?.includes(u.id)) || MOCK_ADMIN;
             return user;
         }
         return MOCK_ADMIN; 
       }
       return null;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // --- Users ---

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
         // In-memory update
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

  // --- Students ---

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

  // --- Teachers ---

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

  // --- Assignments ---

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

  // --- Exams & Fees ---

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
        // Calculate from mocks
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

  // --- Attendance ---

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

  // --- Notifications ---

  async sendEmailNotification(data: { recipientName: string, subject: string, message: string, type: 'FEE_REMINDER' | 'ASSIGNMENT_REMINDER' }): Promise<void> {
    try {
      return await this.request('/notifications/email', { method: 'POST', body: JSON.stringify(data) });
    } catch (e: any) {
      if (e.message === 'FALLBACK_TRIGGER') {
         console.log("Mock Email Sent:", data);
         return;
      }
      throw e;
    }
  }
}

export const api = new ApiService();