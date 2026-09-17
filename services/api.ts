import type {
  Assignment,
  AuditLog,
  ClassRoom,
  DB,
  Exam,
  FeeItem,
  FeePayment,
  Grade,
  Role,
  Session,
  Student,
  Submission,
  Teacher,
  User,
} from "../types";
import { seedDB } from "./mockData";
import { getSnapshot, setSnapshot, emit, subscribe } from "./store";
import { neonBackend, loadDB as neonLoadDB, neonAvailable } from "./neon";

const KEY = "edusphere-db-v1";
let mode: "neon" | "local" = "local";
let neonError: string | null = null;

export { subscribe };

export function isNeon(): boolean {
  return mode === "neon";
}

export function getNeonError(): string | null {
  return neonError;
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      }
    );
  });
}

// ---------- init / loading ----------

export async function initDB(): Promise<DB> {
  const existing = getSnapshot();
  if (existing) return existing;

  if (neonAvailable()) {
    mode = "neon";
    try {
      const db = await withTimeout(neonLoadDB(), 30_000, "Neon connection timed out after 30s");
      neonError = null;
      setSnapshot(db);
      emit();
      return db;
    } catch (e) {
      neonError = e instanceof Error ? e.message : String(e);
      console.error("Neon init failed — falling back to local storage:", neonError);
      mode = "local";
    }
  }

  mode = "local";
  let db: DB;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (!parsed || !Array.isArray(parsed.users)) throw new Error("corrupt");
      db = parsed;
    } else {
      db = seedDB();
      localStorage.setItem(KEY, JSON.stringify(db));
    }
  } catch {
    db = seedDB();
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  setSnapshot(db);
  emit();
  return db;
}

export function getDB(): DB {
  const db = getSnapshot();
  if (!db) throw new Error("DB not initialized");
  return db;
}

export function ready(): boolean {
  return getSnapshot() !== null;
}

// ---------- helpers ----------

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- persistence ----------

function persist(): void {
  if (mode === "local") {
    const db = getSnapshot();
    if (db) localStorage.setItem(KEY, JSON.stringify(db));
  }
  emit();
}

// ---------- auth ----------

export function getSession(): Session | null {
  const db = getSnapshot();
  return db ? db.session : null;
}

export function currentUser(): User | null {
  const db = getSnapshot();
  if (!db || !db.session) return null;
  return db.users.find((u) => u.id === db.session!.userId) ?? null;
}

export function login(email: string, password: string): { ok: boolean; error?: string; user?: User } {
  const db = getSnapshot();
  if (!db) return { ok: false, error: "Still loading — try again in a second." };
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) return { ok: false, error: "Invalid email or password." };
  if (!user.active) return { ok: false, error: "This account has been deactivated." };
  db.session = { userId: user.id, loginAt: nowISO() };
  log(user, "auth.login", "Auth", `${user.name} signed in`);
  persist();
  return { ok: true, user };
}

export function logout(): void {
  const db = getSnapshot();
  if (!db) return;
  const u = currentUser();
  if (u) log(u, "auth.logout", "Auth", `${u.name} signed out`);
  db.session = null;
  persist();
}

// ---------- audit ----------

function log(actorUser: User | null, action: string, entity: string, detail: string): void {
  const db = getSnapshot();
  if (!db) return;
  const entry: AuditLog = {
    id: uid("a"),
    timestamp: nowISO(),
    actorId: actorUser?.id ?? "system",
    actorName: actorUser?.name ?? "System",
    action,
    entity,
    detail,
  };
  db.auditLogs.unshift(entry);
  db.auditLogs = db.auditLogs.slice(0, 500);
  if (mode === "neon") {
    neonBackend.writeAudit(entry).catch((e) => console.error("audit write failed", e));
  }
}

function requireAdmin(): User {
  const u = currentUser();
  if (!u || u.role !== "admin" || !u.active) throw new Error("Only admins can perform this action.");
  return u;
}

function requireStaff(): User {
  const u = currentUser();
  if (!u || (u.role !== "admin" && u.role !== "teacher") || !u.active) throw new Error("Only admins and teachers can perform this action.");
  return u;
}

// ---------- users ----------

export async function upsertUser(input: Partial<User> & { id?: string }): Promise<User> {
  const admin = requireAdmin();
  const db = getDB();
  let saved: User;
  if (input.id) {
    const existing = db.users.find((x) => x.id === input.id);
    if (!existing) throw new Error("User not found.");
    Object.assign(existing, input);
    saved = existing;
    log(admin, "user.updated", "User", `${saved.name} (${saved.email}) updated`);
  } else {
    saved = {
      id: uid("u"),
      name: input.name ?? "Unnamed",
      email: input.email ?? "",
      role: (input.role ?? "student") as Role,
      password: input.password ?? "welcome123",
      avatarColor: input.avatarColor ?? ["bg-indigo-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500"][Math.floor(Math.random() * 5)],
      active: input.active ?? true,
    };
    db.users.push(saved);
    log(admin, "user.created", "User", `Created ${saved.role} account for ${saved.name}`);
  }
  if (mode === "neon") await neonBackend.writeUser(saved);
  persist();
  return saved;
}

export async function setUserActive(id: string, active: boolean): Promise<User> {
  const admin = requireAdmin();
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new Error("User not found.");
  u.active = active;
  log(admin, active ? "user.activated" : "user.deactivated", "User", `${u.name} ${active ? "activated" : "deactivated"}`);
  if (mode === "neon") await neonBackend.writeUser(u);
  persist();
  return u;
}

export async function resetPassword(id: string, password: string): Promise<User> {
  const admin = requireAdmin();
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new Error("User not found.");
  u.password = password;
  log(admin, "user.password_reset", "User", `Password reset for ${u.name}`);
  if (mode === "neon") await neonBackend.writeUser(u);
  persist();
  return u;
}

// ---------- students ----------

export async function upsertStudent(input: Partial<Student> & { id?: string }): Promise<Student> {
  const admin = requireAdmin();
  const db = getDB();
  let saved: Student;
  if (input.id) {
    const existing = db.students.find((s) => s.id === input.id);
    if (!existing) throw new Error("Student not found.");
    Object.assign(existing, input);
    saved = existing;
    log(admin, "student.updated", "Student", `${saved.name} updated`);
  } else {
    saved = {
      id: uid("st"),
      userId: input.userId,
      name: input.name ?? "New Student",
      classId: input.classId ?? db.classes[0]?.id ?? "c-9a",
      rollNo: input.rollNo ?? String(db.students.length + 1).padStart(3, "0"),
      gender: input.gender ?? "Other",
      dob: input.dob ?? "2012-01-01",
      guardianName: input.guardianName ?? "",
      parentUserId: input.parentUserId,
      status: input.status ?? "active",
      admissionDate: input.admissionDate ?? todayISO(),
    };
    db.students.push(saved);
    log(admin, "student.created", "Student", `${saved.name} enrolled`);
  }
  if (mode === "neon") await neonBackend.writeStudent(saved);
  persist();
  return saved;
}

export async function setStudentStatus(id: string, status: "active" | "inactive"): Promise<Student> {
  const admin = requireAdmin();
  const db = getDB();
  const s = db.students.find((x) => x.id === id);
  if (!s) throw new Error("Student not found.");
  s.status = status;
  log(admin, "student.status", "Student", `${s.name} marked ${status}`);
  if (mode === "neon") await neonBackend.writeStudent(s);
  persist();
  return s;
}

// ---------- teachers ----------

export async function upsertTeacher(input: Partial<Teacher> & { id?: string }): Promise<Teacher> {
  const admin = requireAdmin();
  const db = getDB();
  let saved: Teacher;
  if (input.id) {
    const existing = db.teachers.find((t) => t.id === input.id);
    if (!existing) throw new Error("Teacher not found.");
    Object.assign(existing, input);
    saved = existing;
    log(admin, "teacher.updated", "Teacher", `${saved.name} updated`);
  } else {
    saved = {
      id: uid("t"),
      userId: input.userId ?? "",
      name: input.name ?? "New Teacher",
      email: input.email ?? "",
      subjects: input.subjects ?? [],
      classes: input.classes ?? [],
      phone: input.phone ?? "",
      joinDate: input.joinDate ?? todayISO(),
    };
    db.teachers.push(saved);
    log(admin, "teacher.created", "Teacher", `${saved.name} joined the faculty`);
  }
  if (mode === "neon") await neonBackend.writeTeacher(saved);
  persist();
  return saved;
}

// ---------- classes ----------

export async function upsertClass(input: Partial<ClassRoom> & { id?: string }): Promise<ClassRoom> {
  const admin = requireAdmin();
  const db = getDB();
  let saved: ClassRoom;
  if (input.id) {
    const existing = db.classes.find((c) => c.id === input.id);
    if (!existing) throw new Error("Class not found.");
    Object.assign(existing, input);
    saved = existing;
    log(admin, "class.updated", "Class", `${saved.name} ${saved.section} updated`);
  } else {
    saved = {
      id: uid("c"),
      name: input.name ?? "Grade 9",
      section: input.section ?? "A",
      teacherId: input.teacherId ?? db.teachers[0]?.id ?? "",
      subjects: input.subjects ?? [],
    };
    db.classes.push(saved);
    log(admin, "class.created", "Class", `${saved.name} ${saved.section} created`);
  }
  if (mode === "neon") await neonBackend.writeClass(saved);
  persist();
  return saved;
}

// ---------- attendance ----------

export async function saveAttendance(classId: string, date: string, entries: Record<string, "present" | "absent" | "late" | "excused">): Promise<void> {
  const u = requireStaff();
  const db = getDB();
  const id = `${classId}:${date}`;
  const rec = { id, classId, date, entries, markedBy: u.id };
  const existing = db.attendance.find((a) => a.id === id);
  if (existing) Object.assign(existing, rec);
  else db.attendance.unshift(rec);
  const present = Object.values(entries).filter((v) => v === "present").length;
  log(u, "attendance.marked", "Attendance", `${classId} on ${date} — ${present}/${Object.keys(entries).length} present`);
  if (mode === "neon") await neonBackend.writeAttendance(rec);
  persist();
}

// ---------- exams & grades ----------

export async function upsertExam(input: Partial<Exam> & { id?: string }): Promise<Exam> {
  const staff = requireStaff();
  const db = getDB();
  let saved: Exam;
  if (input.id) {
    const existing = db.exams.find((e) => e.id === input.id);
    if (!existing) throw new Error("Exam not found.");
    Object.assign(existing, input);
    saved = existing;
    log(staff, "exam.updated", "Exam", `${saved.name} updated`);
  } else {
    saved = {
      id: uid("ex"),
      name: input.name ?? "Exam",
      term: input.term ?? "Fall 2026",
      classId: input.classId ?? db.classes[0]?.id ?? "",
      subjectId: input.subjectId ?? db.subjects[0]?.id ?? "",
      date: input.date ?? todayISO(),
      maxScore: input.maxScore ?? 100,
      status: input.status ?? "scheduled",
    };
    db.exams.push(saved);
    log(staff, "exam.created", "Exam", `${saved.name} scheduled for ${saved.date}`);
  }
  if (mode === "neon") await neonBackend.writeExam(saved);
  persist();
  return saved;
}

export async function setGrade(examId: string, studentId: string, score: number): Promise<void> {
  const staff = requireStaff();
  const db = getDB();
  const id = `${examId}:${studentId}`;
  const g: Grade = { id, examId, studentId, score };
  const existing = db.grades.find((x) => x.id === id);
  if (existing) Object.assign(existing, g);
  else db.grades.push(g);
  if (mode === "neon") await neonBackend.writeGrade(g);
  persist();
}

export async function publishGrades(examId: string): Promise<void> {
  const staff = requireStaff();
  const db = getDB();
  const exam = db.exams.find((e) => e.id === examId);
  if (!exam) throw new Error("Exam not found.");
  exam.status = "completed";
  log(staff, "grades.published", "Grade", `Grades published for ${exam.name} (${exam.classId})`);
  if (mode === "neon") await neonBackend.writeExam(exam);
  persist();
}

// ---------- assignments & submissions ----------

export async function upsertAssignment(input: Partial<Assignment> & { id?: string }): Promise<Assignment> {
  const staff = requireStaff();
  const db = getDB();
  let saved: Assignment;
  if (input.id) {
    const existing = db.assignments.find((a) => a.id === input.id);
    if (!existing) throw new Error("Assignment not found.");
    Object.assign(existing, input);
    saved = existing;
    log(staff, "assignment.updated", "Assignment", saved.title);
  } else {
    const teacherId = staff.role === "teacher" ? db.teachers.find((t) => t.userId === staff.id)?.id ?? "" : input.teacherId ?? db.teachers[0]?.id ?? "";
    saved = {
      id: uid("asg"),
      title: input.title ?? "Untitled",
      description: input.description ?? "",
      classId: input.classId ?? db.classes[0]?.id ?? "",
      subjectId: input.subjectId ?? db.subjects[0]?.id ?? "",
      teacherId,
      dueDate: input.dueDate ?? todayISO(),
      status: input.status ?? "published",
      createdAt: nowISO(),
    };
    db.assignments.unshift(saved);
    log(staff, "assignment.created", "Assignment", saved.title);
  }
  if (mode === "neon") await neonBackend.writeAssignment(saved);
  persist();
  return saved;
}

export async function deleteAssignment(id: string): Promise<void> {
  const staff = requireStaff();
  const db = getDB();
  const a = db.assignments.find((x) => x.id === id);
  db.assignments = db.assignments.filter((x) => x.id !== id);
  db.submissions = db.submissions.filter((s) => s.assignmentId !== id);
  if (a) log(staff, "assignment.deleted", "Assignment", a.title);
  if (mode === "neon") await neonBackend.deleteRows("assignments", id);
  persist();
}

export async function submitAssignment(assignmentId: string, studentId: string): Promise<void> {
  const u = currentUser();
  if (!u) throw new Error("Not signed in.");
  const db = getDB();
  const id = `${assignmentId}:${studentId}`;
  const sub: Submission = { id, assignmentId, studentId, submittedAt: nowISO(), status: "submitted" };
  const existing = db.submissions.find((s) => s.id === id);
  if (existing) {
    existing.status = "submitted";
    existing.submittedAt = sub.submittedAt;
  } else {
    db.submissions.push(sub);
  }
  const st = db.students.find((s) => s.id === studentId);
  const a = db.assignments.find((x) => x.id === assignmentId);
  log(u, "assignment.submitted", "Submission", `${st?.name ?? "Student"} submitted ${a?.title ?? "assignment"}`);
  if (mode === "neon") await neonBackend.writeSubmission(existing ?? sub);
  persist();
}

export async function gradeSubmission(assignmentId: string, studentId: string, score: number, feedback: string): Promise<void> {
  const staff = requireStaff();
  const db = getDB();
  const id = `${assignmentId}:${studentId}`;
  const sub: Submission = { id, assignmentId, studentId, submittedAt: nowISO(), status: "graded", score, feedback };
  const existing = db.submissions.find((s) => s.id === id);
  if (existing) {
    existing.status = "graded";
    existing.score = score;
    existing.feedback = feedback;
  } else {
    db.submissions.push(sub);
  }
  const st = db.students.find((s) => s.id === studentId);
  const a = db.assignments.find((x) => x.id === assignmentId);
  log(staff, "assignment.graded", "Submission", `${st?.name ?? "Student"} — ${a?.title ?? "assignment"}: ${score}`);
  if (mode === "neon") await neonBackend.writeSubmission(existing ?? sub);
  persist();
}

// ---------- fees ----------

export async function upsertFeeItem(input: Partial<FeeItem> & { id?: string }): Promise<FeeItem> {
  const admin = requireAdmin();
  const db = getDB();
  let saved: FeeItem;
  if (input.id) {
    const existing = db.feeItems.find((f) => f.id === input.id);
    if (!existing) throw new Error("Fee item not found.");
    Object.assign(existing, input);
    saved = existing;
    log(admin, "fee.updated", "Fee", saved.name);
  } else {
    saved = {
      id: uid("f"),
      name: input.name ?? "New fee",
      classId: input.classId ?? "all",
      term: input.term ?? "Fall 2026",
      amount: input.amount ?? 0,
      dueDate: input.dueDate ?? todayISO(),
    };
    db.feeItems.push(saved);
    for (const st of db.students.filter((s) => s.status === "active" && (saved.classId === "all" || s.classId === saved.classId))) {
      const payId = `fp-${st.id}-${saved.id}`;
      if (!db.feePayments.some((p) => p.id === payId)) {
        db.feePayments.push({ id: payId, feeItemId: saved.id, studentId: st.id, amount: 0, date: "", method: "online", status: "pending" });
      }
    }
    log(admin, "fee.created", "Fee", `${saved.name} — $${saved.amount}`);
  }
  if (mode === "neon") await neonBackend.writeFeeItem(saved);
  persist();
  return saved;
}

export async function recordPayment(feeItemId: string, studentId: string, amount: number, method: FeePayment["method"]): Promise<FeePayment> {
  const admin = requireAdmin();
  const db = getDB();
  const fee = db.feeItems.find((f) => f.id === feeItemId);
  if (!fee) throw new Error("Fee item not found.");
  const payId = `fp-${studentId}-${feeItemId}`;
  const existing = db.feePayments.find((p) => p.id === payId);
  const newTotal = (existing?.amount ?? 0) + amount;
  const status: FeePayment["status"] = newTotal >= fee.amount ? "paid" : newTotal > 0 ? "partial" : "pending";
  const saved: FeePayment = { id: payId, feeItemId, studentId, amount: newTotal, date: nowISO(), method, status };
  if (existing) Object.assign(existing, saved);
  else db.feePayments.push(saved);
  const st = db.students.find((s) => s.id === studentId);
  log(admin, "fee.payment", "Fee", `$${amount} from ${st?.name ?? "student"} for ${fee.name}`);
  if (mode === "neon") await neonBackend.writeFeePayment(saved);
  persist();
  return saved;
}

// ---------- audit & system ----------

export function listAuditLogs(): AuditLog[] {
  return getDB().auditLogs;
}

export async function clearAuditLogs(): Promise<void> {
  const admin = requireAdmin();
  const db = getDB();
  db.auditLogs = [];
  log(admin, "audit.cleared", "Audit", "Audit trail cleared");
  if (mode === "neon") {
    for (const l of db.auditLogs) await neonBackend.writeAudit(l);
  }
  persist();
}

export async function resetDemoData(): Promise<void> {
  requireAdmin();
  const fresh = seedDB();
  setSnapshot(fresh);
  if (mode === "local") {
    localStorage.setItem(KEY, JSON.stringify(fresh));
  } else {
    for (const u of fresh.users) await neonBackend.writeUser(u);
    for (const t of fresh.teachers) await neonBackend.writeTeacher(t);
    for (const c of fresh.classes) await neonBackend.writeClass(c);
    for (const st of fresh.students) await neonBackend.writeStudent(st);
    for (const a of fresh.attendance) await neonBackend.writeAttendance(a);
    for (const e of fresh.exams) await neonBackend.writeExam(e);
    for (const g of fresh.grades) await neonBackend.writeGrade(g);
    for (const a of fresh.assignments) await neonBackend.writeAssignment(a);
    for (const s of fresh.submissions) await neonBackend.writeSubmission(s);
    for (const f of fresh.feeItems) await neonBackend.writeFeeItem(f);
    for (const p of fresh.feePayments) await neonBackend.writeFeePayment(p);
    for (const l of fresh.auditLogs) await neonBackend.writeAudit(l);
  }
  emit();
}

// ---------- role helpers ----------

export function studentsForParent(userId: string): Student[] {
  return getDB().students.filter((s) => s.parentUserId === userId);
}

export function studentForUser(userId: string): Student | undefined {
  return getDB().students.find((s) => s.userId === userId);
}

export function teacherForUser(userId: string): Teacher | undefined {
  return getDB().teachers.find((t) => t.userId === userId);
}
