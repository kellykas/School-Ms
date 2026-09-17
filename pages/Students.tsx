import { useState } from "react";
import type { Student } from "../types";
import { getDB, upsertStudent, setStudentStatus, todayISO } from "../services/api";
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Table, Td, useToast } from "../components/ui";

export default function Students() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Student> | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const db = getDB();

  const students = db.students.filter((s) => {
    const q = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.rollNo.includes(query);
    const c = classFilter === "all" || s.classId === classFilter;
    return q && c;
  });

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertStudent({
        id: editing?.id,
        name: String(fd.get("name")),
        classId: String(fd.get("classId")),
        rollNo: String(fd.get("rollNo")),
        gender: String(fd.get("gender")) as Student["gender"],
        dob: String(fd.get("dob")),
        guardianName: String(fd.get("guardianName")),
        parentUserId: String(fd.get("parentUserId")) || undefined,
        status: (fd.get("status") as Student["status"]) ?? "active",
        admissionDate: String(fd.get("admissionDate")) || todayISO(),
      });
      setEditing(null);
      toast(editing?.id ? "Student updated" : "Student enrolled");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        sub="Enrollment records and class placement"
        actions={<Button onClick={() => setEditing({ status: "active", admissionDate: todayISO() })}>+ Enroll student</Button>}
      />

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
          <Input placeholder="Search name or roll no…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="max-w-44">
            <option value="all">All classes</option>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-gray-400">{students.length} students</span>
        </div>
        <Table head={["Student", "Class", "Roll", "Guardian", "Status", "Actions"]}>
          {students.map((s) => {
            const cls = db.classes.find((c) => c.id === s.classId);
            return (
              <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} color="bg-brand-500" size="sm" />
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{s.gender} · DOB {s.dob}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {cls ? `${cls.name} ${cls.section}` : "—"}
                </Td>
                <Td className="font-mono text-xs">{s.rollNo}</Td>
                <Td>{s.guardianName || "—"}</Td>
                <Td>{s.status === "active" ? <Badge tone="green">active</Badge> : <Badge tone="gray">inactive</Badge>}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Edit</Button>
                    <Button size="sm" variant={s.status === "active" ? "danger" : "outline"} onClick={() => setStudentStatus(s.id, s.status === "active" ? "inactive" : "active")}>
                      {s.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit student" : "Enroll student"} wide>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input name="name" defaultValue={editing?.name} required />
          </Field>
          <Field label="Class">
            <Select name="classId" defaultValue={editing?.classId ?? db.classes[0]?.id}>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Roll number">
            <Input name="rollNo" defaultValue={editing?.rollNo} placeholder="016" />
          </Field>
          <Field label="Gender">
            <Select name="gender" defaultValue={editing?.gender ?? "Other"}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input name="dob" type="date" defaultValue={editing?.dob} />
          </Field>
          <Field label="Admission date">
            <Input name="admissionDate" type="date" defaultValue={editing?.admissionDate ?? todayISO()} />
          </Field>
          <Field label="Guardian name">
            <Input name="guardianName" defaultValue={editing?.guardianName} />
          </Field>
          <Field label="Linked parent account">
            <Select name="parentUserId" defaultValue={editing?.parentUserId ?? ""}>
              <option value="">— none —</option>
              {db.users.filter((u) => u.role === "parent").map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={editing?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <div className="col-span-full flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save student"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
