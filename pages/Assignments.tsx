import { useState } from "react";
import type { Assignment, User } from "../types";
import { getDB, upsertAssignment, deleteAssignment, submitAssignment, gradeSubmission, todayISO, studentForUser, studentsForParent } from "../services/api";
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, Table, Td, Textarea, useToast } from "../components/ui";

export default function Assignments({ user }: { user: User }) {
  const db = getDB();
  const isStaff = user.role === "admin" || user.role === "teacher";
  const [editing, setEditing] = useState<Partial<Assignment> | null>(null);
  const [grading, setGrading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const toast = useToast();

  const myAssignments = (() => {
    if (user.role === "teacher") {
      const t = db.teachers.find((x) => x.userId === user.id);
      return db.assignments.filter((a) => a.teacherId === t?.id || t?.classes.includes(a.classId));
    }
    if (user.role === "student") {
      const st = studentForUser(user.id);
      return db.assignments.filter((a) => a.classId === st?.classId && a.status === "published");
    }
    if (user.role === "parent") {
      const kidIds = studentsForParent(user.id).map((k) => k.id);
      const classIds = studentsForParent(user.id).map((k) => k.classId);
      void kidIds;
      return db.assignments.filter((a) => classIds.includes(a.classId) && a.status === "published");
    }
    return db.assignments;
  })();

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertAssignment({
        id: editing?.id,
        title: String(fd.get("title")),
        description: String(fd.get("description")),
        classId: String(fd.get("classId")),
        subjectId: String(fd.get("subjectId")),
        dueDate: String(fd.get("dueDate")),
        status: String(fd.get("status")) as Assignment["status"],
      });
      setEditing(null);
      toast(editing?.id ? "Assignment updated" : "Assignment created");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const gradeTarget = db.assignments.find((a) => a.id === grading);

  return (
    <>
      <PageHeader
        title="Assignments"
        sub={isStaff ? "Create homework, track submissions, grade with feedback" : "Your homework and submissions"}
        actions={isStaff ? <Button onClick={() => setEditing({ dueDate: todayISO(), status: "published" })}>+ New assignment</Button> : undefined}
      />

      {myAssignments.length === 0 ? (
        <Card className="p-0"><EmptyState icon="📚" title="No assignments" hint={isStaff ? "Create the first assignment for your classes." : "Nothing assigned yet."} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {myAssignments.map((a) => {
            const cls = db.classes.find((c) => c.id === a.classId);
            const sub = db.subjects.find((s) => s.id === a.subjectId);
            const teacher = db.teachers.find((t) => t.id === a.teacherId);
            const subs = db.submissions.filter((s) => s.assignmentId === a.id);
            const submitted = subs.filter((s) => s.status === "submitted" || s.status === "graded").length;
            const rosterSize = db.students.filter((s) => s.classId === a.classId && s.status === "active").length;
            const mySub = user.role === "student" ? subs.find((s) => s.studentId === studentForUser(user.id)?.id) : undefined;

            return (
              <Card key={a.id} className="p-5 transition hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
                      {sub?.name} · {cls ? `${cls.name} ${cls.section}` : ""} · {teacher?.name}
                    </p>
                  </div>
                  <Badge tone={a.status === "published" ? "blue" : a.status === "closed" ? "gray" : "amber"}>{a.status}</Badge>
                </div>
                {a.description && <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{a.description}</p>}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  📅 Due <span className="font-medium">{a.dueDate}</span>
                  {a.dueDate < todayISO() && <Badge tone="red">overdue</Badge>}
                </div>

                {isStaff ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>Submissions: {submitted}/{rosterSize}</span>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setEditing(a)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleting(a)}>Delete</Button>
                        <Button size="sm" onClick={() => setGrading(a.id)}>Review</Button>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${rosterSize ? (submitted / rosterSize) * 100 : 0}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between">
                    {mySub ? (
                      <Badge tone={mySub.status === "graded" ? "green" : "blue"}>
                        {mySub.status === "graded" ? `Graded: ${mySub.score ?? "—"}` : `Submitted ${mySub.submittedAt.slice(0, 10)}`}
                      </Badge>
                    ) : (
                      <Badge tone="amber">Not submitted</Badge>
                    )}
                    {user.role === "student" && !mySub && (
                      <Button size="sm" onClick={() => submitAssignment(a.id, studentForUser(user.id)!.id)}>Submit</Button>
                    )}
                    {mySub?.feedback && <span className="max-w-40 truncate text-xs italic text-gray-500">“{mySub.feedback}”</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* review modal */}
      <Modal open={!!grading} onClose={() => setGrading(null)} title={gradeTarget ? `Submissions — ${gradeTarget.title}` : ""} wide>
        {gradeTarget && (
          <Table head={["Student", "Submitted", "Score", "Feedback", ""]}>
            {db.students
              .filter((s) => s.classId === gradeTarget.classId && s.status === "active")
              .map((s) => {
                const sub = db.submissions.find((x) => x.assignmentId === gradeTarget.id && x.studentId === s.id);
                return (
                  <tr key={s.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} color="bg-brand-500" size="sm" />
                        {s.name}
                      </div>
                    </Td>
                    <Td>{sub?.submittedAt ? sub.submittedAt.slice(0, 10) : <Badge tone="red">missing</Badge>}</Td>
                    <Td>
                      <Input
                        type="number"
                        className="max-w-20"
                        defaultValue={sub?.score ?? ""}
                        placeholder="0-100"
                        onBlur={async (e) => {
                          const score = Number(e.target.value);
                          const fb = (e.target.closest("tr")?.querySelector("input[type=text]") as HTMLInputElement)?.value ?? "";
                          if (Number.isFinite(score) && e.target.value !== "") await gradeSubmission(gradeTarget.id, s.id, score, fb);
                        }}
                      />
                    </Td>
                    <Td>
                      <Input type="text" defaultValue={sub?.feedback ?? ""} placeholder="Feedback…" className="max-w-56" />
                    </Td>
                    <Td>{sub?.status === "graded" ? <Badge tone="green">graded</Badge> : null}</Td>
                  </tr>
                );
              })}
          </Table>
        )}
      </Modal>

      {/* editor modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit assignment" : "New assignment"} wide>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title">
            <Input name="title" defaultValue={editing?.title} required />
          </Field>
          <Field label="Description">
            <Textarea name="description" defaultValue={editing?.description} rows={3} />
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
            <Field label="Due date">
              <Input name="dueDate" type="date" defaultValue={editing?.dueDate ?? todayISO()} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={editing?.status ?? "published"}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save assignment"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAssignment(deleting.id);
            toast(`Deleted "${deleting.title}"`);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Delete failed", "error");
          }
          setDeleting(null);
        }}
        title={`Delete "${deleting?.title ?? ""}"?`}
        body="The assignment and all of its submissions will be removed. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
