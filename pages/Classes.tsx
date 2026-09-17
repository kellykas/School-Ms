import { useState } from "react";
import type { ClassRoom, Teacher } from "../types";
import { getDB, upsertClass, upsertTeacher } from "../services/api";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Table, Td, useToast } from "../components/ui";

export function Classes() {
  const [editing, setEditing] = useState<Partial<ClassRoom> | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const db = getDB();

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertClass({
        id: editing?.id,
        name: String(fd.get("name")),
        section: String(fd.get("section")),
        teacherId: String(fd.get("teacherId")),
        subjects: fd.getAll("subjects").map(String),
      });
      setEditing(null);
      toast(editing?.id ? "Class updated" : "Class created");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Classes" sub="Grade sections, homeroom teachers and subject plans" actions={<Button onClick={() => setEditing({ name: "Grade 9", section: "A" })}>+ New class</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {db.classes.map((c) => {
          const teacher = db.teachers.find((t) => t.id === c.teacherId);
          const roster = db.students.filter((s) => s.classId === c.id && s.status === "active");
          return (
            <Card key={c.id} className="p-5 transition hover:shadow-pop">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {c.name} {c.section}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Homeroom: {teacher?.name ?? "—"}</p>
                </div>
                <Badge tone="blue">{roster.length} students</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.subjects.map((sid) => {
                  const sub = db.subjects.find((s) => s.id === sid);
                  return sub ? (
                    <span key={sid} className={`rounded-md px-2 py-0.5 text-xs font-medium text-white ${sub.color}`}>
                      {sub.name}
                    </span>
                  ) : null;
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {roster.slice(0, 6).map((s) => (
                    <Avatar key={s.id} name={s.name} color="bg-brand-500" size="sm" />
                  ))}
                  {roster.length > 6 && <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold dark:bg-slate-700">+{roster.length - 6}</div>}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                  Edit
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit class" : "New class"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade name">
              <Input name="name" defaultValue={editing?.name} placeholder="Grade 9" required />
            </Field>
            <Field label="Section">
              <Input name="section" defaultValue={editing?.section} placeholder="A" required />
            </Field>
          </div>
          <Field label="Homeroom teacher">
            <Select name="teacherId" defaultValue={editing?.teacherId ?? db.teachers[0]?.id}>
              {db.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subjects">
            <div className="grid grid-cols-2 gap-2">
              {db.subjects.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-700">
                  <input type="checkbox" name="subjects" value={s.id} defaultChecked={editing?.subjects?.includes(s.id)} className="h-4 w-4" />
                  {s.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save class"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function Teachers() {
  const [editing, setEditing] = useState<Partial<Teacher> | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const db = getDB();

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertTeacher({
        id: editing?.id,
        userId: String(fd.get("userId")),
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        phone: String(fd.get("phone")),
        subjects: fd.getAll("subjects").map(String).map((id) => db.subjects.find((s) => s.id === id)?.name ?? id),
        classes: fd.getAll("classes").map(String),
        joinDate: String(fd.get("joinDate")),
      });
      setEditing(null);
      toast(editing?.id ? "Teacher updated" : "Teacher added");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Teachers" sub="Faculty directory and assignments" actions={<Button onClick={() => setEditing({})}>+ New teacher</Button>} />
      {db.teachers.length === 0 ? (
        <Card className="p-0"><EmptyState icon="🧑‍🏫" title="No teachers yet" hint="Add your first faculty member." /></Card>
      ) : (
        <Card className="p-0">
          <Table head={["Teacher", "Subjects", "Classes", "Contact", "Joined", "Actions"]}>
            {db.teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} color="bg-violet-500" size="sm" />
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{t.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {t.subjects.map((s) => (
                      <Badge key={s} tone="violet">{s}</Badge>
                    ))}
                  </div>
                </Td>
                <Td>
                  {t.classes.map((cid) => {
                    const c = db.classes.find((x) => x.id === cid);
                    return c ? `${c.name} ${c.section}` : cid;
                  }).join(", ") || "—"}
                </Td>
                <Td>{t.phone || "—"}</Td>
                <Td>{t.joinDate}</Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Edit</Button>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit teacher" : "New teacher"} wide>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="name" defaultValue={editing?.name} required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={editing?.email} required />
          </Field>
          <Field label="Linked login account">
            <Select name="userId" defaultValue={editing?.userId ?? ""}>
              <option value="">— none —</option>
              {db.users.filter((u) => u.role === "teacher").map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={editing?.phone} placeholder="555-0100" />
          </Field>
          <Field label="Subjects taught">
            <div className="flex flex-wrap gap-2">
              {db.subjects.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
                  <input type="checkbox" name="subjects" value={s.id} defaultChecked={editing?.subjects?.includes(s.name)} className="h-3.5 w-3.5" />
                  {s.name}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Classes">
            <div className="flex flex-wrap gap-2">
              {db.classes.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
                  <input type="checkbox" name="classes" value={c.id} defaultChecked={editing?.classes?.includes(c.id)} className="h-3.5 w-3.5" />
                  {c.name} {c.section}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Join date">
            <Input name="joinDate" type="date" defaultValue={editing?.joinDate} />
          </Field>
          <div className="col-span-full flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save teacher"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
