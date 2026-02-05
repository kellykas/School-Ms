import { Student, Teacher, Announcement, ExamResult, User, Assignment } from '../types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Kelly Kasongo',
  email: 'kellykasongowww@gmail.com',
  role: 'ADMIN',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  status: 'ACTIVE',
  password: 'kellykas0007'
};

export const MOCK_ADMIN: User = {
  id: 'admin_main',
  name: 'System Admin',
  email: 'admin@school.com',
  role: 'ADMIN',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  status: 'ACTIVE',
  password: 'password123'
};

export const MOCK_TEACHER_USER: User = {
  id: 'u2',
  name: 'Mr. Anderson',
  email: 'anderson@school.com',
  role: 'TEACHER',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  status: 'ACTIVE',
  password: 'teach'
};

export const MOCK_USERS_DIRECTORY: User[] = [
  MOCK_USER,
  MOCK_ADMIN,
  MOCK_TEACHER_USER,
  {
    id: 'u3',
    name: 'Emma Thompson',
    email: 'emma.t@student.edusphere.com',
    role: 'STUDENT',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    status: 'ACTIVE',
    password: 'learn'
  },
  {
    id: 'u4',
    name: 'Sarah Wilson',
    email: 'sarah.w@parent.edusphere.com',
    role: 'PARENT',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: 'ACTIVE',
    password: 'care'
  },
  {
    id: 'u5',
    name: 'Ms. Roberts',
    email: 'roberts@school.com',
    role: 'TEACHER',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'ACTIVE',
    password: 'teach'
  },
  {
    id: 'u6',
    name: 'John Doe',
    email: 'john.doe@temp.com',
    role: 'STUDENT',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    status: 'INACTIVE',
    password: 'pass'
  }
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Emma Thompson', grade: '10', section: 'A', guardianName: 'John Thompson', contact: '+1234567890', attendanceRate: 95, feesStatus: 'PAID' },
  { id: 's2', name: 'Liam Wilson', grade: '10', section: 'A', guardianName: 'Sarah Wilson', contact: '+1234567891', attendanceRate: 88, feesStatus: 'PENDING' },
  { id: 's3', name: 'Olivia Martinez', grade: '10', section: 'B', guardianName: 'Carlos Martinez', contact: '+1234567892', attendanceRate: 98, feesStatus: 'PAID' },
  { id: 's4', name: 'Noah Johnson', grade: '9', section: 'A', guardianName: 'Emily Johnson', contact: '+1234567893', attendanceRate: 75, feesStatus: 'OVERDUE' },
  { id: 's5', name: 'Ava Brown', grade: '9', section: 'C', guardianName: 'Robert Brown', contact: '+1234567894', attendanceRate: 92, feesStatus: 'PAID' },
  { id: 's6', name: 'Sophia Davis', grade: '9', section: 'B', guardianName: 'Michael Davis', contact: '+1234567895', attendanceRate: 96, feesStatus: 'PAID' },
  { id: 's7', name: 'James Miller', grade: '10', section: 'A', guardianName: 'Karen Miller', contact: '+1234567896', attendanceRate: 85, feesStatus: 'PENDING' },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Mr. Anderson', subject: 'Mathematics', email: 'anderson@school.com', classes: ['10-A', '9-B'] },
  { id: 't2', name: 'Ms. Roberts', subject: 'Science', email: 'roberts@school.com', classes: ['10-B', '8-A'] },
  { id: 't3', name: 'Mrs. Davis', subject: 'English', email: 'davis@school.com', classes: ['9-A', '10-A'] },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Annual Sports Day', content: 'The annual sports day will be held on Friday, 24th. All students must wear their house uniforms.', date: '2023-10-20', author: 'Admin', priority: 'HIGH' },
  { id: 'a2', title: 'Parent Teacher Meeting', content: 'PTM for Grade 10 is scheduled for next Saturday.', date: '2023-10-18', author: 'Principal', priority: 'MEDIUM' },
];

export const MOCK_EXAM_RESULTS: ExamResult[] = [
  { studentId: 's1', studentName: 'Emma Thompson', subject: 'Math', score: 95, total: 100, grade: 'A' },
  { studentId: 's2', studentName: 'Liam Wilson', subject: 'Math', score: 78, total: 100, grade: 'B' },
  { studentId: 's3', studentName: 'Olivia Martinez', subject: 'Math', score: 88, total: 100, grade: 'A-' },
  { studentId: 's4', studentName: 'Noah Johnson', subject: 'Math', score: 65, total: 100, grade: 'C' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'as1', classId: '10-A', title: 'Algebra Functions', description: 'Complete Chapter 4 Exercises 1-20.', dueDate: '2023-10-25', subject: 'Mathematics', status: 'OPEN', attachmentName: 'Algebra_Exercises.pdf' },
  { id: 'as2', classId: '10-A', title: 'Geometry Proofs', description: 'Write proofs for the triangle congruence theorems discussed in class.', dueDate: '2023-11-01', subject: 'Mathematics', status: 'OPEN' },
  { id: 'as3', classId: '9-B', title: 'Linear Equations', description: 'Solve the worksheet attached.', dueDate: '2023-10-28', subject: 'Mathematics', status: 'OPEN', attachmentName: 'Worksheet_3B.docx' },
];

export const MOCK_FEES = [
  { invoiceId: 'INV-001', studentId: 's1', name: 'Emma Thompson', grade: '10', amount: 1250, dueDate: '2023-11-01', feesStatus: 'PAID' },
  { invoiceId: 'INV-002', studentId: 's2', name: 'Liam Wilson', grade: '10', amount: 1250, dueDate: '2023-11-01', feesStatus: 'PENDING' },
  { invoiceId: 'INV-003', studentId: 's4', name: 'Noah Johnson', grade: '9', amount: 1100, dueDate: '2023-10-15', feesStatus: 'OVERDUE' },
  { invoiceId: 'INV-004', studentId: 's7', name: 'James Miller', grade: '10', amount: 1250, dueDate: '2023-11-01', feesStatus: 'PENDING' },
];