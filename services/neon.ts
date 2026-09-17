import type { DB, User, Student, Teacher, ClassRoom, Subject, AttendanceRecord, Exam, Grade, Assignment, Submission, FeeItem, FeePayment, AuditLog } from "../types";

// Neon HTTP SQL client (works from the browser over fetch)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlTagged = ((strings: TemplateStringsArray, ...params: any[]) => Promise<any[]>) & {
  query: (text: string, params?: unknown[]) => Promise<any[]>;
};

let sql: SqlTagged | null = null;
let readyPromise: Promise<void> | null = null;

function connString(): string | undefined {
  return import.meta.env.VITE_DATABASE_URL as string | undefined;
}

export function neonAvailable(): boolean {
  return Boolean(connString());
}

async function ensureSql(): Promise<SqlTagged> {
  if (sql) return sql;
  const cs = connString();
  if (!cs) throw new Error("VITE_DATABASE_URL is not set");
  const mod = await import("@neondatabase/serverless");
  sql = mod.neon(cs) as unknown as SqlTagged;
  return sql;
}

/** Create tables if they don't exist. Idempotent. */
async function ensureSchema(s: SqlTagged): Promise<void> {
  await s`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT 'bg-indigo-500',
    active BOOLEAN NOT NULL DEFAULT TRUE
  )`;
  await s`CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    gender TEXT NOT NULL,
    dob TEXT,
    guardian_name TEXT,
    parent_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    admission_date TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subjects TEXT NOT NULL DEFAULT '[]',
    classes TEXT NOT NULL DEFAULT '[]',
    phone TEXT,
    join_date TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    teacher_id TEXT,
    subjects TEXT NOT NULL DEFAULT '[]'
  )`;
  await s`CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    color TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    date TEXT NOT NULL,
    entries JSONB NOT NULL DEFAULT '{}'::jsonb,
    marked_by TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    term TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    date TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'scheduled'
  )`;
  await s`CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    score INTEGER NOT NULL
  )`;
  await s`CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    class_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    teacher_id TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    submitted_at TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    score INTEGER,
    feedback TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS fee_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL DEFAULT 'all',
    term TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    due_date TEXT
  )`;
  await s`CREATE TABLE IF NOT EXISTS fee_payments (
    id TEXT PRIMARY KEY,
    fee_item_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT,
    method TEXT NOT NULL DEFAULT 'online',
    status TEXT NOT NULL DEFAULT 'pending'
  )`;
  await s`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    admin_id TEXT,
    admin_name TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    detail TEXT
  )`;
}

type Row = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function optStr(v: unknown): string | undefined {
  return v == null ? undefined : String(v);
}
function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}
function bool(v: unknown): boolean {
  return v === true || v === "true" || v === "t";
}
function json<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "object") return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
}

function rowToUser(r: Row): User {
  return { id: str(r.id), name: str(r.name), email: str(r.email), role: str(r.role) as User["role"], password: str(r.password), avatarColor: str(r.avatar_color), active: bool(r.active) };
}
function rowToStudent(r: Row): Student {
  return { id: str(r.id), userId: optStr(r.user_id), name: str(r.name), classId: str(r.class_id), rollNo: str(r.roll_no), gender: str(r.gender) as Student["gender"], dob: str(r.dob), guardianName: str(r.guardian_name), parentUserId: optStr(r.parent_user_id), status: str(r.status) as Student["status"], admissionDate: str(r.admission_date) };
}
function rowToTeacher(r: Row): Teacher {
  return { id: str(r.id), userId: str(r.user_id), name: str(r.name), email: str(r.email), subjects: json<string[]>(r.subjects, []), classes: json<string[]>(r.classes, []), phone: str(r.phone), joinDate: str(r.join_date) };
}
function rowToClass(r: Row): ClassRoom {
  return { id: str(r.id), name: str(r.name), section: str(r.section), teacherId: str(r.teacher_id), subjects: json<string[]>(r.subjects, []) };
}
function rowToSubject(r: Row): Subject {
  return { id: str(r.id), name: str(r.name), code: str(r.code), color: str(r.color) };
}
function rowToAttendance(r: Row): AttendanceRecord {
  return { id: str(r.id), classId: str(r.class_id), date: str(r.date), entries: json(r.entries, {}), markedBy: str(r.marked_by) };
}
function rowToExam(r: Row): Exam {
  return { id: str(r.id), name: str(r.name), term: str(r.term), classId: str(r.class_id), subjectId: str(r.subject_id), date: str(r.date), maxScore: num(r.max_score), status: str(r.status) as Exam["status"] };
}
function rowToGrade(r: Row): Grade {
  return { id: str(r.id), examId: str(r.exam_id), studentId: str(r.student_id), score: num(r.score) };
}
function rowToAssignment(r: Row): Assignment {
  return { id: str(r.id), title: str(r.title), description: str(r.description), classId: str(r.class_id), subjectId: str(r.subject_id), teacherId: str(r.teacher_id), dueDate: str(r.due_date), status: str(r.status) as Assignment["status"], createdAt: str(r.created_at) };
}
function rowToSubmission(r: Row): Submission {
  return { id: str(r.id), assignmentId: str(r.assignment_id), studentId: str(r.student_id), submittedAt: str(r.submitted_at), status: str(r.status) as Submission["status"], score: r.score == null ? undefined : num(r.score), feedback: optStr(r.feedback) };
}
function rowToFeeItem(r: Row): FeeItem {
  return { id: str(r.id), name: str(r.name), classId: str(r.class_id), term: str(r.term), amount: num(r.amount), dueDate: str(r.due_date) };
}
function rowToFeePayment(r: Row): FeePayment {
  return { id: str(r.id), feeItemId: str(r.fee_item_id), studentId: str(r.student_id), amount: num(r.amount), date: str(r.date), method: str(r.method) as FeePayment["method"], status: str(r.status) as FeePayment["status"] };
}
function rowToAudit(r: Row): AuditLog {
  return { id: str(r.id), timestamp: str(r.timestamp), actorId: str(r.admin_id), actorName: str(r.admin_name), action: str(r.action), entity: str(r.entity), detail: str(r.detail) };
}

async function seed(s: SqlTagged): Promise<DB> {
  const { seedDB } = await import("./mockData");
  const seed = seedDB();

  for (const u of seed.users) {
    await s`INSERT INTO users (id, name, email, role, password, avatar_color, active)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.password}, ${u.avatarColor}, ${u.active})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const t of seed.teachers) {
    await s`INSERT INTO teachers (id, user_id, name, email, subjects, classes, phone, join_date)
      VALUES (${t.id}, ${t.userId}, ${t.name}, ${t.email}, ${JSON.stringify(t.subjects)}, ${JSON.stringify(t.classes)}, ${t.phone}, ${t.joinDate})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const sub of seed.subjects) {
    await s`INSERT INTO subjects (id, name, code, color) VALUES (${sub.id}, ${sub.name}, ${sub.code}, ${sub.color}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const c of seed.classes) {
    await s`INSERT INTO classes (id, name, section, teacher_id, subjects)
      VALUES (${c.id}, ${c.name}, ${c.section}, ${c.teacherId}, ${JSON.stringify(c.subjects)}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const st of seed.students) {
    await s`INSERT INTO students (id, user_id, name, class_id, roll_no, gender, dob, guardian_name, parent_user_id, status, admission_date)
      VALUES (${st.id}, ${st.userId ?? null}, ${st.name}, ${st.classId}, ${st.rollNo}, ${st.gender}, ${st.dob}, ${st.guardianName}, ${st.parentUserId ?? null}, ${st.status}, ${st.admissionDate})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const a of seed.attendance) {
    await s`INSERT INTO attendance (id, class_id, date, entries, marked_by)
      VALUES (${a.id}, ${a.classId}, ${a.date}, ${JSON.stringify(a.entries)}::jsonb, ${a.markedBy}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const e of seed.exams) {
    await s`INSERT INTO exams (id, name, term, class_id, subject_id, date, max_score, status)
      VALUES (${e.id}, ${e.name}, ${e.term}, ${e.classId}, ${e.subjectId}, ${e.date}, ${e.maxScore}, ${e.status}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const g of seed.grades) {
    await s`INSERT INTO grades (id, exam_id, student_id, score) VALUES (${g.id}, ${g.examId}, ${g.studentId}, ${g.score}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const a of seed.assignments) {
    await s`INSERT INTO assignments (id, title, description, class_id, subject_id, teacher_id, due_date, status, created_at)
      VALUES (${a.id}, ${a.title}, ${a.description}, ${a.classId}, ${a.subjectId}, ${a.teacherId}, ${a.dueDate}, ${a.status}, ${a.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const sub of seed.submissions) {
    await s`INSERT INTO submissions (id, assignment_id, student_id, submitted_at, status, score, feedback)
      VALUES (${sub.id}, ${sub.assignmentId}, ${sub.studentId}, ${sub.submittedAt}, ${sub.status}, ${sub.score ?? null}, ${sub.feedback ?? null}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const f of seed.feeItems) {
    await s`INSERT INTO fee_items (id, name, class_id, term, amount, due_date)
      VALUES (${f.id}, ${f.name}, ${f.classId}, ${f.term}, ${f.amount}, ${f.dueDate}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const p of seed.feePayments) {
    await s`INSERT INTO fee_payments (id, fee_item_id, student_id, amount, date, method, status)
      VALUES (${p.id}, ${p.feeItemId}, ${p.studentId}, ${p.amount}, ${p.date}, ${p.method}, ${p.status}) ON CONFLICT (id) DO NOTHING`;
  }
  for (const l of seed.auditLogs) {
    await s`INSERT INTO audit_logs (id, timestamp, admin_id, admin_name, action, entity, detail)
      VALUES (${l.id}, ${l.timestamp}, ${l.actorId}, ${l.actorName}, ${l.action}, ${l.entity}, ${l.detail}) ON CONFLICT (id) DO NOTHING`;
  }

  return seed;
}

/** Load the full DB from Neon, creating schema + seed data if the DB is empty. */
export async function loadDB(): Promise<DB> {
  const s = await ensureSql();
  if (!readyPromise) {
    readyPromise = (async () => {
      await ensureSchema(s);
    })();
  }
  await readyPromise;

  const [users, teachers, subjects, classes, students, attendance, exams, grades, assignments, submissions, feeItems, feePayments, auditLogs] = await Promise.all([
    s`SELECT * FROM users ORDER BY id`,
    s`SELECT * FROM teachers ORDER BY id`,
    s`SELECT * FROM subjects ORDER BY id`,
    s`SELECT * FROM classes ORDER BY id`,
    s`SELECT * FROM students ORDER BY roll_no`,
    s`SELECT * FROM attendance ORDER BY date DESC LIMIT 60`,
    s`SELECT * FROM exams ORDER BY date DESC`,
    s`SELECT * FROM grades`,
    s`SELECT * FROM assignments ORDER BY created_at DESC`,
    s`SELECT * FROM submissions`,
    s`SELECT * FROM fee_items ORDER BY id`,
    s`SELECT * FROM fee_payments`,
    s`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200`,
  ]);

  if (users.length === 0) {
    await seed(s);
    return loadDB();
  }

  return {
    users: users.map(rowToUser),
    teachers: teachers.map(rowToTeacher),
    subjects: subjects.map(rowToSubject),
    classes: classes.map(rowToClass),
    students: students.map(rowToStudent),
    attendance: attendance.map(rowToAttendance),
    exams: exams.map(rowToExam),
    grades: grades.map(rowToGrade),
    assignments: assignments.map(rowToAssignment),
    submissions: submissions.map(rowToSubmission),
    feeItems: feeItems.map(rowToFeeItem),
    feePayments: feePayments.map(rowToFeePayment),
    auditLogs: auditLogs.map(rowToAudit),
    session: null,
  };
}

function esc(v: string): string {
  return v.replace(/'/g, "''");
}

async function exec(query: string): Promise<void> {
  const s = await ensureSql();
  await s.query(query);
}

export const neonBackend = {
  async writeUser(u: User): Promise<void> {
    await exec(
      `INSERT INTO users (id, name, email, role, password, avatar_color, active)
       VALUES ('${esc(u.id)}', '${esc(u.name)}', '${esc(u.email)}', '${esc(u.role)}', '${esc(u.password)}', '${esc(u.avatarColor)}', ${u.active})
       ON CONFLICT (id) DO UPDATE SET name='${esc(u.name)}', email='${esc(u.email)}', role='${esc(u.role)}', password='${esc(u.password)}', avatar_color='${esc(u.avatarColor)}', active=${u.active}`
    );
  },
  async writeStudent(st: Student): Promise<void> {
    await exec(
      `INSERT INTO students (id, user_id, name, class_id, roll_no, gender, dob, guardian_name, parent_user_id, status, admission_date)
       VALUES ('${esc(st.id)}', ${st.userId ? `'${esc(st.userId)}'` : "NULL"}, '${esc(st.name)}', '${esc(st.classId)}', '${esc(st.rollNo)}', '${esc(st.gender)}', '${esc(st.dob)}', '${esc(st.guardianName)}', ${st.parentUserId ? `'${esc(st.parentUserId)}'` : "NULL"}, '${esc(st.status)}', '${esc(st.admissionDate)}')
       ON CONFLICT (id) DO UPDATE SET user_id=${st.userId ? `'${esc(st.userId)}'` : "NULL"}, name='${esc(st.name)}', class_id='${esc(st.classId)}', roll_no='${esc(st.rollNo)}', gender='${esc(st.gender)}', dob='${esc(st.dob)}', guardian_name='${esc(st.guardianName)}', parent_user_id=${st.parentUserId ? `'${esc(st.parentUserId)}'` : "NULL"}, status='${esc(st.status)}', admission_date='${esc(st.admissionDate)}'`
    );
  },
  async writeTeacher(t: Teacher): Promise<void> {
    await exec(
      `INSERT INTO teachers (id, user_id, name, email, subjects, classes, phone, join_date)
       VALUES ('${esc(t.id)}', '${esc(t.userId)}', '${esc(t.name)}', '${esc(t.email)}', '${esc(JSON.stringify(t.subjects))}', '${esc(JSON.stringify(t.classes))}', '${esc(t.phone)}', '${esc(t.joinDate)}')
       ON CONFLICT (id) DO UPDATE SET user_id='${esc(t.userId)}', name='${esc(t.name)}', email='${esc(t.email)}', subjects='${esc(JSON.stringify(t.subjects))}', classes='${esc(JSON.stringify(t.classes))}', phone='${esc(t.phone)}', join_date='${esc(t.joinDate)}'`
    );
  },
  async writeClass(c: ClassRoom): Promise<void> {
    await exec(
      `INSERT INTO classes (id, name, section, teacher_id, subjects)
       VALUES ('${esc(c.id)}', '${esc(c.name)}', '${esc(c.section)}', '${esc(c.teacherId)}', '${esc(JSON.stringify(c.subjects))}')
       ON CONFLICT (id) DO UPDATE SET name='${esc(c.name)}', section='${esc(c.section)}', teacher_id='${esc(c.teacherId)}', subjects='${esc(JSON.stringify(c.subjects))}'`
    );
  },
  async writeAttendance(a: AttendanceRecord): Promise<void> {
    await exec(
      `INSERT INTO attendance (id, class_id, date, entries, marked_by)
       VALUES ('${esc(a.id)}', '${esc(a.classId)}', '${esc(a.date)}', '${esc(JSON.stringify(a.entries))}'::jsonb, '${esc(a.markedBy)}')
       ON CONFLICT (id) DO UPDATE SET entries='${esc(JSON.stringify(a.entries))}'::jsonb, marked_by='${esc(a.markedBy)}'`
    );
  },
  async writeExam(e: Exam): Promise<void> {
    await exec(
      `INSERT INTO exams (id, name, term, class_id, subject_id, date, max_score, status)
       VALUES ('${esc(e.id)}', '${esc(e.name)}', '${esc(e.term)}', '${esc(e.classId)}', '${esc(e.subjectId)}', '${esc(e.date)}', ${e.maxScore}, '${esc(e.status)}')
       ON CONFLICT (id) DO UPDATE SET name='${esc(e.name)}', term='${esc(e.term)}', class_id='${esc(e.classId)}', subject_id='${esc(e.subjectId)}', date='${esc(e.date)}', max_score=${e.maxScore}, status='${esc(e.status)}'`
    );
  },
  async writeGrade(g: Grade): Promise<void> {
    await exec(
      `INSERT INTO grades (id, exam_id, student_id, score) VALUES ('${esc(g.id)}', '${esc(g.examId)}', '${esc(g.studentId)}', ${g.score})
       ON CONFLICT (id) DO UPDATE SET score=${g.score}`
    );
  },
  async writeAssignment(a: Assignment): Promise<void> {
    await exec(
      `INSERT INTO assignments (id, title, description, class_id, subject_id, teacher_id, due_date, status, created_at)
       VALUES ('${esc(a.id)}', '${esc(a.title)}', '${esc(a.description)}', '${esc(a.classId)}', '${esc(a.subjectId)}', '${esc(a.teacherId)}', '${esc(a.dueDate)}', '${esc(a.status)}', '${esc(a.createdAt)}')
       ON CONFLICT (id) DO UPDATE SET title='${esc(a.title)}', description='${esc(a.description)}', class_id='${esc(a.classId)}', subject_id='${esc(a.subjectId)}', teacher_id='${esc(a.teacherId)}', due_date='${esc(a.dueDate)}', status='${esc(a.status)}'`
    );
  },
  async writeSubmission(sub: Submission): Promise<void> {
    await exec(
      `INSERT INTO submissions (id, assignment_id, student_id, submitted_at, status, score, feedback)
       VALUES ('${esc(sub.id)}', '${esc(sub.assignmentId)}', '${esc(sub.studentId)}', '${esc(sub.submittedAt)}', '${esc(sub.status)}', ${sub.score ?? "NULL"}, ${sub.feedback ? `'${esc(sub.feedback)}'` : "NULL"})
       ON CONFLICT (id) DO UPDATE SET submitted_at='${esc(sub.submittedAt)}', status='${esc(sub.status)}', score=${sub.score ?? "NULL"}, feedback=${sub.feedback ? `'${esc(sub.feedback)}'` : "NULL"}`
    );
  },
  async writeFeeItem(f: FeeItem): Promise<void> {
    await exec(
      `INSERT INTO fee_items (id, name, class_id, term, amount, due_date)
       VALUES ('${esc(f.id)}', '${esc(f.name)}', '${esc(f.classId)}', '${esc(f.term)}', ${f.amount}, '${esc(f.dueDate)}')
       ON CONFLICT (id) DO UPDATE SET name='${esc(f.name)}', class_id='${esc(f.classId)}', term='${esc(f.term)}', amount=${f.amount}, due_date='${esc(f.dueDate)}'`
    );
  },
  async writeFeePayment(p: FeePayment): Promise<void> {
    await exec(
      `INSERT INTO fee_payments (id, fee_item_id, student_id, amount, date, method, status)
       VALUES ('${esc(p.id)}', '${esc(p.feeItemId)}', '${esc(p.studentId)}', ${p.amount}, '${esc(p.date)}', '${esc(p.method)}', '${esc(p.status)}')
       ON CONFLICT (id) DO UPDATE SET amount=${p.amount}, date='${esc(p.date)}', method='${esc(p.method)}', status='${esc(p.status)}'`
    );
  },
  async writeAudit(l: AuditLog): Promise<void> {
    await exec(
      `INSERT INTO audit_logs (id, timestamp, admin_id, admin_name, action, entity, detail)
       VALUES ('${esc(l.id)}', '${esc(l.timestamp)}', '${esc(l.actorId)}', '${esc(l.actorName)}', '${esc(l.action)}', '${esc(l.entity)}', '${esc(l.detail)}')`
    );
  },
  async deleteRows(table: string, id: string): Promise<void> {
    const allowed = ["assignments", "users", "students", "audit_logs"];
    if (!allowed.includes(table)) throw new Error("Table not writable");
    await exec(`DELETE FROM ${table} WHERE id = '${esc(id)}'`);
  },
};
