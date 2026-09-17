import { useMemo } from "react";
import type { DB, Student, User } from "../types";
import { getDB, studentsForParent, studentForUser, teacherForUser, todayISO } from "../services/api";
import { Avatar, Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, cx } from "../components/ui";

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function AttendanceChart({ db, classId }: { db: DB; classId: string }) {
  const days = db.attendance
    .filter((a) => a.classId === classId)
    .slice(0, 10)
    .reverse();
  if (days.length === 0) return <EmptyState icon="📅" title="No attendance recorded yet" />;
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {days.map((d) => {
          const vals = Object.values(d.entries);
          const present = vals.filter((v) => v === "present").length;
          const rateNum = Math.round((present / (vals.length || 1)) * 100);
          const tone = rateNum >= 90 ? "bg-emerald-500/80" : rateNum >= 75 ? "bg-amber-500/80" : "bg-rose-500/80";
          return (
            <div key={d.id} className="group relative flex-1">
              <div
                className={cx("w-full rounded-t-md transition-all duration-300 group-hover:brightness-110", tone)}
                style={{ height: `${Math.max(8, rateNum * 1.4)}px` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white shadow-pop group-hover:block dark:bg-slate-700">
                {d.date} · {rateNum}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-slate-500">
        <span>{days[0]?.date}</span>
        <span>{days[days.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function AdminDashboard({ user }: { user: User }) {
  const db = getDB();
  const activeStudents = db.students.filter((s) => s.status === "active").length;
  const today = todayISO();
  const todayAtt = db.attendance.filter((a) => a.date === today);
  const presentToday = todayAtt.reduce((acc, a) => acc + Object.values(a.entries).filter((v) => v === "present").length, 0);
  const markedToday = todayAtt.reduce((acc, a) => acc + Object.keys(a.entries).length, 0);
  const feesDue = db.feeItems.reduce((acc, f) => acc + f.amount * db.students.filter((s) => s.status === "active").length, 0);
  const feesPaid = db.feePayments.reduce((acc, p) => acc + p.amount, 0);
  const upcomingExams = db.exams.filter((e) => e.status === "scheduled").length;

  return (
    <>
      <PageHeader title={`Good day, ${user.name.split(" ")[0]} 👋`} sub="Here's what's happening across the school today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={activeStudents} sub={`${db.classes.length} classes`} icon="🎒" tone="blue" />
        <StatCard label="Attendance today" value={markedToday ? pct(presentToday, markedToday) : "—"} sub={markedToday ? `${presentToday}/${markedToday} present` : "not yet marked"} icon="📅" tone="green" />
        <StatCard label="Fees collected" value={`$${feesPaid.toLocaleString()}`} sub={`of $${feesDue.toLocaleString()} billed`} icon="💳" tone="amber" />
        <StatCard label="Upcoming exams" value={upcomingExams} sub={`${db.assignments.filter((a) => a.status === "published").length} open assignments`} icon="📝" tone="violet" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Attendance — Grade 10 A (last 10 days)</h3>
            <Badge tone="green">live</Badge>
          </div>
          <AttendanceChart db={db} classId="c-10a" />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <div className="space-y-3">
            {db.auditLogs.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-start gap-3">
                <Avatar name={l.actorName} color="bg-slate-400" size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="font-medium">{l.actorName}</span> <span className="text-gray-500 dark:text-slate-400">{l.detail}</span>
                  </p>
                  <p className="text-xs text-gray-400">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-4 font-semibold">Classes overview</h3>
        <Table head={["Class", "Homeroom teacher", "Students", "Subjects"]}>
          {db.classes.map((c) => {
            const roster = db.students.filter((s) => s.classId === c.id && s.status === "active");
            const teacher = db.teachers.find((t) => t.id === c.teacherId);
            return (
              <tr key={c.id}>
                <Td className="font-medium">
                  {c.name} {c.section}
                </Td>
                <Td>{teacher?.name ?? "—"}</Td>
                <Td>{roster.length}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {c.subjects.slice(0, 4).map((sid) => {
                      const sub = db.subjects.find((s) => s.id === sid);
                      return sub ? (
                        <span key={sid} className={cx("rounded px-1.5 py-0.5 text-[10px] font-medium text-white", sub.color)}>
                          {sub.code}
                        </span>
                      ) : null;
                    })}
                    {c.subjects.length > 4 && <span className="text-xs text-gray-400">+{c.subjects.length - 4}</span>}
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}

function TeacherDashboard({ user }: { user: User }) {
  const db = getDB();
  const me = teacherForUser(user.id);
  const myClasses = db.classes.filter((c) => me?.classes.includes(c.id));
  const myAssignments = db.assignments.filter((a) => a.teacherId === me?.id);
  const toGrade = db.submissions.filter((s) => s.status === "submitted" && myAssignments.some((a) => a.id === s.assignmentId)).length;
  const upcoming = myAssignments
    .filter((a) => a.status === "published")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]} 👋`} sub={me ? `Teaching ${me.subjects.join(", ")}` : "Teacher dashboard"} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My classes" value={myClasses.length} sub={myClasses.map((c) => `${c.name} ${c.section}`).join(", ") || "—"} icon="🏫" tone="blue" />
        <StatCard label="Students taught" value={db.students.filter((s) => myClasses.some((c) => c.id === s.classId) && s.status === "active").length} icon="🎒" tone="violet" />
        <StatCard label="Submissions to grade" value={toGrade} icon="📥" tone="amber" />
        <StatCard label="Open assignments" value={myAssignments.filter((a) => a.status === "published").length} icon="📚" tone="green" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Upcoming assignment deadlines</h3>
          {upcoming.length === 0 ? (
            <EmptyState icon="🎉" title="Nothing due soon" hint="Create an assignment from the Assignments page." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {db.classes.find((c) => c.id === a.classId)?.name} · due {a.dueDate}
                    </p>
                  </div>
                  <Badge tone={a.dueDate < todayISO() ? "red" : "blue"}>{a.dueDate < todayISO() ? "overdue" : "open"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">My class attendance (today)</h3>
          {myClasses.map((c) => {
            const rec = db.attendance.find((a) => a.classId === c.id && a.date === todayISO());
            const vals = rec ? Object.values(rec.entries) : [];
            const present = vals.filter((v) => v === "present").length;
            const roster = db.students.filter((s) => s.classId === c.id && s.status === "active").length;
            return (
              <div key={c.id} className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {c.name} {c.section}
                </span>
                {rec ? (
                  <Badge tone={pct(present, roster || 1) === "100%" ? "green" : "amber"}>
                    {present}/{roster} present
                  </Badge>
                ) : (
                  <Badge tone="gray">not marked</Badge>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </>
  );
}

function StudentDashboard({ user }: { user: User }) {
  const db = getDB();
  const me: Student | undefined = studentForUser(user.id);
  if (!me) return <EmptyState icon="🧭" title="No student profile linked" hint="Ask your school admin to link your login to a student record." />;
  const cls = db.classes.find((c) => c.id === me.classId);
  const mySubs = db.submissions.filter((s) => s.studentId === me.id);
  const myGrades = db.grades.filter((g) => g.studentId === me.id);
  const avg = myGrades.length ? Math.round(myGrades.reduce((a, g) => a + g.score, 0) / myGrades.length) : null;
  const attDays = db.attendance.filter((a) => a.classId === me.classId);
  const attTotal = attDays.length;
  const attPresent = attDays.filter((a) => a.entries[me.id] === "present").length;
  const pendingHW = db.assignments.filter(
    (a) => a.classId === me.classId && a.status === "published" && !mySubs.some((s) => s.assignmentId === a.id && (s.status === "submitted" || s.status === "graded"))
  );

  return (
    <>
      <PageHeader title={`Hi ${user.name.split(" ")[0]} 🎒`} sub={`${cls?.name ?? ""} ${cls?.section ?? ""} · Roll ${me.rollNo}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average score" value={avg != null ? `${avg}%` : "—"} sub={`${myGrades.length} graded exams`} icon="🎯" tone="blue" />
        <StatCard label="Attendance" value={attTotal ? pct(attPresent, attTotal) : "—"} sub={`${attPresent}/${attTotal} days present`} icon="📅" tone="green" />
        <StatCard label="Homework pending" value={pendingHW.length} icon="📚" tone="amber" />
        <StatCard label="Submissions" value={mySubs.filter((s) => s.status !== "missing").length} sub="all time" icon="📥" tone="violet" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Homework to do</h3>
          {pendingHW.length === 0 ? (
            <EmptyState icon="✅" title="You're all caught up!" />
          ) : (
            <div className="space-y-3">
              {pendingHW.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {db.subjects.find((s) => s.id === a.subjectId)?.name} · due {a.dueDate}
                    </p>
                  </div>
                  <Badge tone={a.dueDate < todayISO() ? "red" : "amber"}>{a.dueDate < todayISO() ? "overdue" : "due soon"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Recent grades</h3>
          {myGrades.length === 0 ? (
            <EmptyState icon="📝" title="No grades published yet" />
          ) : (
            <div className="space-y-3">
              {myGrades.slice(0, 6).map((g) => {
                const exam = db.exams.find((e) => e.id === g.examId);
                const sub = db.subjects.find((s) => s.id === exam?.subjectId);
                return (
                  <div key={g.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {sub && <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white", sub.color)}>{sub.code}</span>}
                      <div>
                        <p className="text-sm font-medium">{exam?.name ?? "Exam"}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{sub?.name}</p>
                      </div>
                    </div>
                    <Badge tone={g.score >= 80 ? "green" : g.score >= 60 ? "amber" : "red"}>
                      {g.score}/{exam?.maxScore ?? 100}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function ParentDashboard({ user }: { user: User }) {
  const db = getDB();
  const kids = studentsForParent(user.id);
  if (kids.length === 0) return <EmptyState icon="👨‍👩‍👧" title="No children linked" hint="Ask the school office to link your account to your child(ren)." />;

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(" ")[0]} 👋`} sub={`Following ${kids.length} ${kids.length === 1 ? "child" : "children"}`} />
      <div className="space-y-6">
        {kids.map((kid) => {
          const cls = db.classes.find((c) => c.id === kid.classId);
          const attDays = db.attendance.filter((a) => a.classId === kid.classId);
          const attPresent = attDays.filter((a) => a.entries[kid.id] === "present").length;
          const myGrades = db.grades.filter((g) => g.studentId === kid.id);
          const avg = myGrades.length ? Math.round(myGrades.reduce((a, g) => a + g.score, 0) / myGrades.length) : null;
          const myPayments = db.feePayments.filter((p) => p.studentId === kid.id);
          const owed = myPayments.reduce((acc, p) => {
            const fee = db.feeItems.find((f) => f.id === p.feeItemId);
            return acc + (fee ? Math.max(0, fee.amount - p.amount) : 0);
          }, 0);
          const missingHW = db.assignments.filter((a) => a.classId === kid.classId && a.status === "published").length -
            db.submissions.filter((s) => s.studentId === kid.id && (s.status === "submitted" || s.status === "graded")).length;

          return (
            <Card key={kid.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={kid.name} color="bg-brand-500" size="lg" />
                  <div>
                    <h3 className="font-bold">{kid.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {cls?.name} {cls?.section} · Roll {kid.rollNo}
                    </p>
                  </div>
                </div>
                <Badge tone="blue">Guardian: {kid.guardianName || user.name}</Badge>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <StatCard label="Average score" value={avg != null ? `${avg}%` : "—"} icon="🎯" tone="blue" />
                <StatCard label="Attendance" value={attDays.length ? pct(attPresent, attDays.length) : "—"} sub={`${attPresent}/${attDays.length} days`} icon="📅" tone="green" />
                <StatCard label="Missing homework" value={Math.max(0, missingHW)} icon="📚" tone="amber" />
                <StatCard label="Fees owed" value={`$${owed.toLocaleString()}`} icon="💳" tone="violet" />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default function Dashboard({ user }: { user: User }) {
  const db = getDB();
  void db;
  const content = useMemo(() => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard user={user} />;
      case "teacher":
        return <TeacherDashboard user={user} />;
      case "student":
        return <StudentDashboard user={user} />;
      case "parent":
        return <ParentDashboard user={user} />;
    }
  }, [user]);
  return content;
}
