import type { DB } from "../types";

const AV = ["bg-indigo-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-orange-500"];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoDaysAhead(days: number): string {
  return isoDaysAgo(-days);
}

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function seedDB(): DB {
  const users: DB["users"] = [
    { id: "u-admin", name: "Morgan Reyes", email: "admin@school.com", role: "admin", password: "password123", avatarColor: AV[0], active: true },
    { id: "u-t1", name: "Ava Anderson", email: "anderson@school.com", role: "teacher", password: "teach", avatarColor: AV[1], active: true },
    { id: "u-t2", name: "Liam Brooks", email: "brooks@school.com", role: "teacher", password: "teach", avatarColor: AV[2], active: true },
    { id: "u-t3", name: "Noor Haddad", email: "haddad@school.com", role: "teacher", password: "teach", avatarColor: AV[3], active: true },
    { id: "u-s1", name: "Emma Thompson", email: "emma.t@student.edusphere.com", role: "student", password: "learn", avatarColor: AV[4], active: true },
    { id: "u-s2", name: "Noah Patel", email: "noah.p@student.edusphere.com", role: "student", password: "learn", avatarColor: AV[4], active: true },
    { id: "u-p1", name: "Sarah Wilson", email: "sarah.w@parent.edusphere.com", role: "parent", password: "care", avatarColor: AV[5], active: true },
    { id: "u-p2", name: "David Chen", email: "david.c@parent.edusphere.com", role: "parent", password: "care", avatarColor: AV[6], active: true },
    { id: "u-p3", name: "Priya Rao", email: "priya.r@parent.edusphere.com", role: "parent", password: "care", avatarColor: AV[7], active: true },
  ];

  const teachers: DB["teachers"] = [
    { id: "t-1", userId: "u-t1", name: "Ava Anderson", email: "anderson@school.com", subjects: ["Mathematics", "Physics"], classes: ["c-10a", "c-9a"], phone: "555-0101", joinDate: "2019-08-12" },
    { id: "t-2", userId: "u-t2", name: "Liam Brooks", email: "brooks@school.com", subjects: ["English", "History"], classes: ["c-10a", "c-10b"], phone: "555-0102", joinDate: "2020-01-06" },
    { id: "t-3", userId: "u-t3", name: "Noor Haddad", email: "haddad@school.com", subjects: ["Biology", "Chemistry"], classes: ["c-9a", "c-10b"], phone: "555-0103", joinDate: "2021-08-23" },
  ];

  const subjects: DB["subjects"] = [
    { id: "s-math", name: "Mathematics", code: "MTH", color: "bg-blue-500" },
    { id: "s-eng", name: "English", code: "ENG", color: "bg-rose-500" },
    { id: "s-phy", name: "Physics", code: "PHY", color: "bg-violet-500" },
    { id: "s-bio", name: "Biology", code: "BIO", color: "bg-emerald-500" },
    { id: "s-chem", name: "Chemistry", code: "CHM", color: "bg-amber-500" },
    { id: "s-hist", name: "History", code: "HIS", color: "bg-orange-500" },
  ];

  const classes: DB["classes"] = [
    { id: "c-9a", name: "Grade 9", section: "A", teacherId: "t-1", subjects: ["s-math", "s-eng", "s-phy", "s-bio", "s-chem", "s-hist"] },
    { id: "c-9b", name: "Grade 9", section: "B", teacherId: "t-2", subjects: ["s-math", "s-eng", "s-phy", "s-bio", "s-chem", "s-hist"] },
    { id: "c-10a", name: "Grade 10", section: "A", teacherId: "t-1", subjects: ["s-math", "s-eng", "s-phy", "s-bio", "s-chem", "s-hist"] },
    { id: "c-10b", name: "Grade 10", section: "B", teacherId: "t-2", subjects: ["s-p-hist"] },
  ];
  classes[3].subjects = ["s-math", "s-eng", "s-phy", "s-bio", "s-chem", "s-hist"];

  const studentSeed: Array<[string, string, string, number, string, string?]> = [
    ["st-1", "Emma Thompson", "Female", 16, "Robert Thompson", "u-s1"],
    ["st-2", "Noah Patel", "Male", 15, "Anita Patel", "u-s2"],
    ["st-3", "Olivia Garcia", "Female", 15, "Maria Garcia", "u-p1"],
    ["st-4", "Liam Wilson", "Male", 16, "Sarah Wilson", "u-p1"],
    ["st-5", "Ava Chen", "Female", 16, "David Chen", "u-p2"],
    ["st-6", "Ethan Rodriguez", "Male", 15, "Carla Rodriguez", undefined],
    ["st-7", "Mia Kim", "Female", 15, "Jin Kim", "u-p3"],
    ["st-8", "Lucas Meyer", "Male", 16, "Anna Meyer", undefined],
    ["st-9", "Isabella Novak", "Female", 16, "Petra Novak", "u-p2"],
    ["st-10", "James Okafor", "Male", 15, "Grace Okafor", undefined],
    ["st-11", "Sophia Rossi", "Female", 15, "Elena Rossi", "u-p3"],
    ["st-12", "Ben Adams", "Male", 16, "Kate Adams", undefined],
    ["st-13", "Zara Ali", "Female", 15, "Imran Ali", undefined],
    ["st-14", "Daniel Park", "Male", 16, "Soo Park", undefined],
    ["st-15", "Chloe Martin", "P", 15, "Luc Martin", undefined],
  ];

  const students: DB["students"] = studentSeed.map(([id, name, gender, age, guardian, parentUserId], i) => ({
    id,
    userId: id === "st-1" ? "u-s1" : id === "st-2" ? "u-s2" : undefined,
    name,
    classId: ["c-9a", "c-9b", "c-10a", "c-10b"][i % 4],
    rollNo: String(i + 1).padStart(3, "0"),
    gender: (gender === "Male" ? "Male" : gender === "Other" ? "Other" : "Female") as "Male" | "Female" | "Other",
    dob: isoDaysAgo(365 * age + 30),
    guardianName: guardian,
    parentUserId: parentUserId,
    status: "active" as const,
    admissionDate: "2023-08-15",
  }));
  students[13].status = "inactive";

  const rand = rng(42);

  // Attendance for the last 14 weekdays
  const attendance: DB["attendance"] = [];
  let dayOffset = 0;
  while (attendance.length < 14) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const date = d.toISOString().slice(0, 10);
      for (const cls of classes) {
        const roster = students.filter((s) => s.classId === cls.id && s.status === "active");
        const entries: Record<string, "present" | "absent" | "late" | "excused"> = {};
        for (const s of roster) {
          const r = rand();
          entries[s.id] = r > 0.94 ? "absent" : r > 0.9 ? "late" : r > 0.88 ? "excused" : "present";
        }
        attendance.push({ id: `${cls.id}:${date}`, classId: cls.id, date, entries, markedBy: cls.teacherId });
      }
    }
    dayOffset += 1;
  }

  // Exams + grades
  const exams: DB["exams"] = [];
  const grades: DB["grades"] = [];
  let ex = 1;
  for (const cls of classes) {
    for (const subj of cls.subjects.slice(0, 4)) {
      const examId = `ex-${ex++}`;
      const completed = ex % 3 !== 0;
      exams.push({
        id: examId,
        name: "Midterm",
        term: "Fall 2026",
        classId: cls.id,
        subjectId: subj,
        date: completed ? isoDaysAgo(20) : isoDaysAhead(9),
        maxScore: 100,
        status: completed ? "completed" : "scheduled",
        });
      if (completed) {
        for (const st of students.filter((s) => s.classId === cls.id && s.status === "active")) {
          grades.push({
            id: `${examId}:${st.id}`,
            examId,
            studentId: st.id,
            score: Math.round(55 + rand() * 44),
            });
        }
        }
    }
  }

  // Assignments + submissions
  const assignments: DB["assignments"] = [];
  const submissions: DB["submissions"] = [];
  let asg = 1;
  for (const t of teachers) {
    for (const clsId of t.classes) {
      const subj = t.subjects[0];
      const subjId = subjects.find((s) => s.name === subj)?.id ?? "s-math";
      const aid = `asg-${asg++}`;
      assignments.push({
        id: aid,
        title: `${subj} practice set ${asg - 1}`,
        description: `Complete exercises and submit before the due date.`,
        classId: clsId,
        subjectId: subjId,
        teacherId: t.id,
        dueDate: isoDaysAhead(3 + (asg % 10)),
        status: "published",
        createdAt: isoDaysAgo(4),
      });
      for (const st of students.filter((s) => s.classId === clsId && s.status === "active")) {
        const r = rand();
        submissions.push({
          id: `${aid}:${st.id}`,
          assignmentId: aid,
          studentId: st.id,
          submittedAt: isoDaysAgo(Math.floor(rand() * 3)),
          status: r > 0.85 ? "missing" : "submitted",
        });
      }
    }
  }

  // Fees
  const feeItems: DB["feeItems"] = [
    { id: "f-1", name: "Tuition — Fall 2026", classId: "all", term: "Fall 2026", amount: 1200, dueDate: "2026-10-01" },
    { id: "f-2", name: "Lab fee", classId: "all", term: "Fall 2026", amount: 150, dueDate: "2026-10-01" },
    { id: "f-3", name: "Sports & activities", classId: "all", term: "Fall 2026", amount: 90, dueDate: "2026-11-01" },
  ];
  const feePayments: DB["feePayments"] = [];
  for (const st of students.filter((s) => s.status === "active")) {
    for (const f of feeItems) {
      const r = rand();
      const status = r > 0.72 ? "pending" : r > 0.6 ? "partial" : "paid";
      feePayments.push({
        id: `fp-${st.id}-${f.id}`,
        feeItemId: f.id,
        studentId: st.id,
        amount: status === "paid" ? f.amount : status === "partial" ? Math.round(f.amount * 0.5) : 0,
        date: status === "pending" ? "" : isoDaysAgo(Math.floor(rand() * 40) + 5),
        method: "online",
        status,
      });
    }
  }

  const auditLogs: DB["auditLogs"] = [
    { id: "a-1", timestamp: new Date(Date.now() - 36e5).toISOString(), actorId: "u-admin", actorName: "Morgan Reyes", action: "user.created", entity: "User", detail: "Created login for Daniel Park" },
    { id: "a-2", timestamp: new Date(Date.now() - 72e5).toISOString(), actorId: "u-t1", actorName: "Ava Anderson", action: "attendance.marked", entity: "Attendance", detail: "Grade 10 A — 2026-09-16" },
    { id: "a-3", timestamp: new Date(Date.now() - 864e5).toISOString(), actorId: "u-admin", actorName: "Morgan Reyes", action: "fee.created", entity: "Fee", detail: "Lab fee $150 due 2026-10-01" },
  ];

  return {
    users,
    students,
    classes,
    teachers,
    subjects,
    attendance,
    exams,
    grades,
    assignments,
    submissions,
    feeItems,
    feePayments,
    auditLogs,
    session: null,
  };
}
