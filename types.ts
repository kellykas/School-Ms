
import React from 'react';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  guardianName: string;
  contact: string;
  attendanceRate: number;
  feesStatus: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
  classes: string[];
}

export interface Assignment {
  id: string;
  classId: string; // e.g. "10-A"
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  attachmentName?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO string
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface ExamResult {
  studentId: string;
  studentName: string;
  subject: string;
  score: number;
  total: number;
  grade: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditLog {
  id: string;
  action: 'USER_CREATED' | 'USER_UPDATED' | 'STATUS_CHANGE' | 'PASSWORD_RESET';
  targetUserId: string;
  targetUserName: string;
  performedBy: string; // Name or ID of admin
  timestamp: string;
  details: string;
}
