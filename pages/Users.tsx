import { useMemo, useState } from "react";
import type { User as UserType } from "../types";
import { getDB, upsertUser, setUserActive, resetPassword } from "../services/api";
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageHeader, PasswordInput, Select, Table, Td, useToast } from "../components/ui";

const ROLES = ["admin", "teacher", "student", "parent"] as const;
const COLORS = ["bg-indigo-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500"];

export default function Users() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<UserType> | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwReset, setPwReset] = useState<UserType | null>(null);
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const db = getDB();
  void db;

  const users = useMemo(() => {
    const db2 = getDB();
    return db2.users.filter((u) => {
      const matchesQ = !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase());
      const matchesR = roleFilter === "all" || u.role === roleFilter;
      return matchesQ && matchesR;
    });
  }, [query, roleFilter, db]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertUser({
        id: editing?.id,
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        role: String(fd.get("role")) as UserType["role"],
        password: String(fd.get("password") || "welcome123"),
        avatarColor: editing?.avatarColor ?? COLORS[Math.floor(Math.random() * COLORS.length)],
        active: fd.get("active") === "on",
      });
      setEditing(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const doPwReset = async () => {
    if (!pwReset || !newPw) return;
    setPwBusy(true);
    try {
      await resetPassword(pwReset.id, newPw);
      toast(`Password updated for ${pwReset.name}`);
      setPwReset(null);
      setNewPw("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Password reset failed", "error");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        sub="Login accounts for admins, teachers, students and parents"
        actions={
          <Button onClick={() => setEditing({ active: true })}>+ New user</Button>
        }
      />

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-slate-800">
          <Input placeholder="Search name or email…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-40">
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-gray-400">{users.length} of {getDB().users.length} users</span>
        </div>
        <Table head={["User", "Role", "Status", "Actions"]}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} color={u.avatarColor} size="sm" />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td className="capitalize">{u.role}</Td>
              <Td>
                {u.active ? <Badge tone="green">active</Badge> : <Badge tone="red">deactivated</Badge>}
              </Td>
              <Td>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setEditing(u)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewPw("");
                      setPwReset(u);
                    }}
                  >
                    Reset pw
                  </Button>
                  <Button size="sm" variant={u.active ? "danger" : "outline"} onClick={() => setUserActive(u.id, !u.active)}>
                    {u.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit user" : "New user"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Full name">
            <Input name="name" defaultValue={editing?.name} required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={editing?.email} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select name="role" defaultValue={editing?.role ?? "student"}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={editing?.id ? "Password (leave blank to keep)" : "Password"}>
              <Input name="password" type="text" placeholder="welcome123" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} className="h-4 w-4 rounded border-gray-300" />
            Account active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save user"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pwReset} onClose={() => setPwReset(null)} title={`Reset password — ${pwReset?.name ?? ""}`}>
        <div className="space-y-4">
          <Field label="New password">
            <PasswordInput value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
          </Field>
          <p className="text-xs text-gray-400 dark:text-slate-500">The user will need this password the next time they sign in.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPwReset(null)}>
              Cancel
            </Button>
            <Button onClick={doPwReset} disabled={!newPw || pwBusy}>
              {pwBusy ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
