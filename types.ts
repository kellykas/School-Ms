export type Role = "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  avatarColor: string;
  active: boolean;
}

export interface Student {
  id: string;
  userId?: string; // linked login user (for student role)
  name: string;
  classId: string;
  rollNo: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  guardianName: string;
  parentUserId?: string; // linked login user (for parent role)
  status: "active" | "inactive";
  admissionDate: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  section: string;
  teacherId: string; // homeroom teacher
  subjects: string[];
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  subjects: string[];
  classes: string[]; // class ids
  phone: string;
  joinDate: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface AttendanceRecord {
  id: string; // `${classId}:${date}`
  classId: string;
  date: string; // YYYY-MM-DD
  entries: Record<string, "present" | "absent" | "late" | "excused">; // studentId -> status
  markedBy: string;
}

export interface Exam {
  id: string;
  name: string;
  term: string;
  classId: string;
  subjectId: string;
  date: string;
  maxScore: number;
  status: "scheduled" | "completed";
}

export interface Grade {
  id: string; // `${examId}:${studentId}`
  examId: string;
  studentId: string;
  score: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  status: "draft" | "published" | "closed";
  createdAt: string;
}

export interface Submission {
  id: string; // `${assignmentId}:${studentId}`
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: "submitted" | "graded" | "missing";
  score?: number;
  feedback?: string;
}

export interface FeeItem {
  id: string;
  name: string;
  classId: string;
  term: string;
  amount: number;
  dueDate: string;
}

export interface FeePayment {
  id: string;
  feeItemId: string;
  studentId: string;
  amount: number;
  date: string;
  method: "cash" | "card" | "bank" | "online";
  status: "paid" | "partial" | "pending";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  detail: string;
}

export interface Session {
  userId: string;
  loginAt: string;
}

export interface DB {
  users: User[];
  students: Student[];
  classes: ClassRoom[];
  teachers: Teacher[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  grades: Grade[];
  assignments: Assignment[];
  submissions: Submission[];
  feeItems: FeeItem[];
  feePayments: FeePayment[];
  auditLogs: AuditLog[];
  session: Session | null;
}
