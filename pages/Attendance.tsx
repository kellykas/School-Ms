import { useState } from "react";
import type { User } from "../types";
import { getDB, saveAttendance, todayISO, studentsForParent, studentForUser } from "../services/api";
import { Avatar, Badge, Button, Card, EmptyState, Field, PageHeader, Select, StatCard, Table, Td, cx, useToast } from "../components/ui";

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: Status[] = ["present", "absent", "late", "excused"];
const TONE: Record<Status, "green" | "red" | "amber" | "gray"> = { present: "green", absent: "red", late: "amber", excused: "gray" };

export default function Attendance({ user }: { user: User }) {
  const db = getDB();
  const isStaff = user.role === "admin" || user.role === "teacher";

  // staff: pick class + date
  const [classId, setClassId] = useState(() => {
    if (user.role === "teacher") {
      const t = db.teachers.find((x) => x.userId === user.id);
      return t?.classes[0] ?? db.classes[0]?.id ?? "";
    }
    return db.classes[0]?.id ?? "";
  });
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const myClasses = user.role === "teacher" ? db.classes.filter((c) => db.teachers.find((t) => t.userId === user.id)?.classes.includes(c.id)) : db.classes;
  const roster = db.students.filter((s) => s.classId === classId && s.status === "active");
  const existing = db.attendance.find((a) => a.classId === classId && a.date === date);

  const current: Record<string, Status> = existing ? (existing.entries as Record<string, Status>) : draft;

  const setStatus = (sid: string, st: Status) => {
    if (existing) return; // already marked — staff can still edit via "Edit" button
    setDraft((d) => ({ ...d, [sid]: st }));
  };

  const markAll = (st: Status) => {
    if (existing) return;
    const next: Record<string, Status> = {};
    for (const s of roster) next[s.id] = st;
    setDraft(next);
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveAttendance(classId, date, current);
      setDraft({});
      toast(`Attendance saved for ${date}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  // ----- views for student/parent -----
  if (!isStaff) {
    const kidIds = user.role === "parent" ? studentsForParent(user.id).map((k) => k.id) : [studentForUser(user.id)?.id].filter(Boolean) as string[];
    const days = db.attendance.filter((a) => kidIds.some((kid) => a.entries[kid] != null)).slice(0, 30);
    return (
      <>
        <PageHeader title="Attendance" sub="Your attendance history" />
        <Card className="p-0">
          {days.length === 0 ? (
            <EmptyState icon="📅" title="No attendance records yet" />
          ) : (
            <Table head={["Date", "Status"]}>
              {days.map((a) => {
                const st = a.entries[kidIds[0]];
                return (
                  <tr key={a.id}>
                    <Td>{a.date}</Td>
                    <Td>
                      <Badge tone={TONE[st as Status] ?? "gray"}>{st}</Badge>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        sub="Mark daily attendance per class"
        actions={
          <div className="flex items-center gap-2">
            <Select value={classId} onChange={(e) => { setClassId(e.target.value); setDraft({}); }} className="max-w-48">
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </Select>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setDraft({}); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
          </div>
        }
      />

      {roster.length === 0 ? (
        <Card className="p-0"><EmptyState icon="🎒" title="No active students in this class" /></Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {existing ? <Badge tone="green">✓ Marked {existing.date} — editing allowed</Badge> : <Badge tone="amber">Not marked yet</Badge>}
              <Button size="sm" variant="outline" onClick={() => markAll("present")}>All present</Button>
            </div>
            <Button size="sm" onClick={save} disabled={busy || (!existing && Object.keys(current).length === 0)}>
              {busy ? "Saving…" : existing ? "Update attendance" : "Save attendance"}
            </Button>
          </div>
          <Table head={["Student", "Status"]}>
            {roster.map((s) => (
              <tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} color="bg-brand-500" size="sm" />
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Roll {s.rollNo}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(s.id, st)}
                        className={cx(
                          "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
                          current[s.id] === st
                            ? st === "present" ? "bg-emerald-500 text-white" : st === "absent" ? "bg-rose-500 text-white" : st === "late" ? "bg-amber-500 text-white" : "bg-slate-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  {!current[s.id] && <p className="mt-1 text-[11px] text-gray-400">unmarked</p>}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {existing && (
        <Card className="mt-5 p-5">
          <h3 className="mb-3 font-semibold">Summary for {existing.date}</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Present" value={Object.values(existing.entries).filter((v) => v === "present").length} icon="✅" tone="green" />
            <StatCard label="Absent" value={Object.values(existing.entries).filter((v) => v === "absent").length} icon="❌" tone="blue" />
            <StatCard label="Late" value={Object.values(existing.entries).filter((v) => v === "late").length} icon="⏰" tone="amber" />
            <StatCard label="Excused" value={Object.values(existing.entries).filter((v) => v === "excused").length} icon="📄" tone="violet" />
          </div>
        </Card>
      )}
    </>
  );
}
