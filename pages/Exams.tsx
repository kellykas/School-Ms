import { useState } from "react";
import type { Exam, User } from "../types";
import { getDB, upsertExam, setGrade, publishGrades, todayISO, studentsForParent, studentForUser } from "../services/api";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, StatCard, Table, Td, cx, useToast } from "../components/ui";

export default function Exams({ user }: { user: User }) {
  const db = getDB();
  const isStaff = user.role === "admin" || user.role === "teacher";
  const [editing, setEditing] = useState<Partial<Exam> | null>(null);
  const [gradeExam, setGradeExam] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  const exams = db.exams.filter((e) => filter === "all" || e.status === filter);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertExam({
        id: editing?.id,
        name: String(fd.get("name")),
        term: String(fd.get("term")),
        classId: String(fd.get("classId")),
        subjectId: String(fd.get("subjectId")),
        date: String(fd.get("date")),
        maxScore: Number(fd.get("maxScore")),
        status: String(fd.get("status")) as Exam["status"],
      });
      setEditing(null);
      toast(editing?.id ? "Exam updated" : "Exam scheduled");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  // ----- student/parent view -----
  if (!isStaff) {
    const kidIds = (user.role === "parent" ? studentsForParent(user.id).map((k) => k.id) : [studentForUser(user.id)?.id].filter(Boolean)) as string[];
    const myGrades = db.grades.filter((g) => kidIds.includes(g.studentId));
    return (
      <>
        <PageHeader title="Exams & results" sub="Published exam results" />
        {myGrades.length === 0 ? (
          <Card className="p-0"><EmptyState icon="📝" title="No results published yet" /></Card>
        ) : (
          <Card className="p-0">
            <Table head={["Exam", "Subject", "Date", "Score"]}>
              {myGrades.map((g) => {
                const exam = db.exams.find((e) => e.id === g.examId);
                const sub = db.subjects.find((s) => s.id === exam?.subjectId);
                return (
                  <tr key={g.id}>
                    <Td className="font-medium">{exam?.name ?? "Exam"}</Td>
                    <Td>{sub?.name ?? "—"}</Td>
                    <Td>{exam?.date}</Td>
                    <Td>
                      <Badge tone={g.score >= 80 ? "green" : g.score >= 60 ? "amber" : "red"}>
                        {g.score}/{exam?.maxScore ?? 100}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        )}
      </>
    );
  }

  // ----- staff view -----
  const selected = db.exams.find((e) => e.id === gradeExam);
  const roster = selected ? db.students.filter((s) => s.classId === selected.classId && s.status === "active") : [];

  return (
    <>
      <PageHeader title="Exams & gradebook" sub="Schedule exams, record scores, publish results" actions={<Button onClick={() => setEditing({ maxScore: 100, date: todayISO(), term: "Fall 2026", status: "scheduled" })}>+ New exam</Button>} />

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-40">
            <option value="all">All exams</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </Select>
          <span className="ml-auto text-xs text-gray-400">{exams.length} exams</span>
        </div>
        <Table head={["Exam", "Class", "Subject", "Date", "Status", "Grades", "Actions"]}>
          {exams.map((e) => {
            const cls = db.classes.find((c) => c.id === e.classId);
            const sub = db.subjects.find((s) => s.id === e.subjectId);
            const graded = db.grades.filter((g) => g.examId === e.id).length;
            const rosterSize = db.students.filter((s) => s.classId === e.classId && s.status === "active").length;
            return (
              <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                <Td className="font-medium">{e.name}</Td>
                <Td>{cls ? `${cls.name} ${cls.section}` : "—"}</Td>
                <Td>{sub?.name ?? "—"}</Td>
                <Td>{e.date}</Td>
                <Td>
                  {e.status === "completed" ? <Badge tone="green">completed</Badge> : <Badge tone="amber">scheduled</Badge>}
                </Td>
                <Td>
                  {graded}/{rosterSize}
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setEditing(e)}>Edit</Button>
                    <Button size="sm" onClick={() => setGradeExam(e.id)}>Grades</Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* gradebook modal */}
      <Modal open={!!gradeExam} onClose={() => setGradeExam(null)} title={selected ? `Gradebook — ${selected.name}` : ""} wide>
        {selected && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="Graded" value={`${db.grades.filter((g) => g.examId === selected.id).length}/${roster.length}`} icon="✅" tone="green" />
              <StatCard
                label="Average"
                value={
                  (() => {
                    const scores = db.grades.filter((g) => g.examId === selected.id).map((g) => g.score);
                    return scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : "—";
                  })()
                }
                icon="📊"
                tone="blue"
              />
              <StatCard label="Max score" value={selected.maxScore} icon="🎯" tone="violet" />
            </div>
            <Table head={["Student", "Score", ""]}>
              {roster.map((s) => {
                const g = db.grades.find((x) => x.examId === selected.id && x.studentId === s.id);
                return (
                  <tr key={s.id}>
                    <Td className="font-medium">{s.name}</Td>
                    <Td>
                      <Input
                        type="number"
                        min={0}
                        max={selected.maxScore}
                        defaultValue={g?.score ?? ""}
                        className="max-w-24"
                        onBlur={async (ev) => {
                          const v = ev.target.value === "" ? undefined : Number(ev.target.value);
                          if (v != null && Number.isFinite(v)) await setGrade(selected.id, s.id, v);
                        }}
                      />
                    </Td>
                    <Td>
                      {g ? (
                        <Badge tone={g.score >= (selected.maxScore * 0.8) ? "green" : g.score >= selected.maxScore * 0.6 ? "amber" : "red"}>
                          {Math.round((g.score / selected.maxScore) * 100)}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">not graded</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGradeExam(null)}>Done</Button>
              <Button
                onClick={async () => {
                  await publishGrades(selected.id);
                  toast("Grades published — students and parents can now see them.");
                }}
              >
                Publish grades
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* exam editor */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit exam" : "New exam"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Exam name">
            <Input name="name" defaultValue={editing?.name} placeholder="Midterm" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <Select name="classId" defaultValue={editing?.classId ?? db.classes[0]?.id}>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Select name="subjectId" defaultValue={editing?.subjectId ?? db.subjects[0]?.id}>
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input name="date" type="date" defaultValue={editing?.date ?? todayISO()} />
            </Field>
            <Field label="Max score">
              <Input name="maxScore" type="number" min={1} defaultValue={editing?.maxScore ?? 100} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Term">
              <Input name="term" defaultValue={editing?.term ?? "Fall 2026"} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={editing?.status ?? "scheduled"}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save exam"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
