import { useState } from "react";
import type { FeeItem, FeePayment, User } from "../types";
import { getDB, upsertFeeItem, recordPayment, todayISO, studentsForParent } from "../services/api";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, StatCard, Table, Td, useToast } from "../components/ui";

export default function Fees({ user }: { user: User }) {
  const db = getDB();
  const isAdmin = user.role === "admin";
  const [editing, setEditing] = useState<Partial<FeeItem> | null>(null);
  const [paying, setPaying] = useState<{ studentId: string; feeItemId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const kids = user.role === "parent" ? studentsForParent(user.id) : [];
  const visibleStudents = isAdmin ? db.students.filter((s) => s.status === "active") : kids;

  const totalBilled = db.feeItems.reduce((acc, f) => acc + f.amount * db.students.filter((s) => s.status === "active" && (f.classId === "all" || s.classId === f.classId)).length, 0);
  const totalPaid = db.feePayments.reduce((acc, p) => acc + p.amount, 0);
  const outstanding = totalBilled - totalPaid;

  const familyBilled = kids.reduce((acc, k) => acc + db.feeItems.filter((f) => f.classId === "all" || f.classId === k.classId).reduce((a, f) => a + f.amount, 0), 0);
  const familyPaid = kids.reduce((acc, k) => acc + db.feePayments.filter((p) => p.studentId === k.id).reduce((a, p) => a + p.amount, 0), 0);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await upsertFeeItem({
        id: editing?.id,
        name: String(fd.get("name")),
        classId: String(fd.get("classId")),
        term: String(fd.get("term")),
        amount: Number(fd.get("amount")),
        dueDate: String(fd.get("dueDate")),
      });
      setEditing(null);
      toast(editing?.id ? "Fee updated" : "Fee created");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Fees"
        sub={isAdmin ? "Fee structure, billing status and payments" : "Your family's fees and payments"}
        actions={isAdmin ? <Button onClick={() => setEditing({ term: "Fall 2026", dueDate: todayISO() })}>+ New fee</Button> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {isAdmin ? (
          <>
            <StatCard label="Total billed" value={`$${totalBilled.toLocaleString()}`} icon="💰" tone="blue" />
            <StatCard label="Collected" value={`$${totalPaid.toLocaleString()}`} sub={totalBilled ? `${Math.round((totalPaid / totalBilled) * 100)}% of billed` : ""} icon="✅" tone="green" />
            <StatCard label="Outstanding" value={`$${outstanding.toLocaleString()}`} icon="⏳" tone="amber" />
          </>
        ) : (
          <>
            <StatCard label="Billed (family)" value={`$${familyBilled.toLocaleString()}`} icon="💰" tone="blue" />
            <StatCard label="Paid" value={`$${familyPaid.toLocaleString()}`} icon="✅" tone="green" />
            <StatCard label="Balance" value={`$${(familyBilled - familyPaid).toLocaleString()}`} icon="⏳" tone="amber" />
          </>
        )}
      </div>

      {/* Fee items */}
      {isAdmin && (
        <Card className="mt-6 p-0">
          <div className="border-b border-gray-100 p-4 dark:border-slate-800">
            <h3 className="font-semibold">Fee items</h3>
          </div>
          <Table head={["Fee", "Applies to", "Term", "Amount", "Due", "Actions"]}>
            {db.feeItems.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                <Td className="font-medium">{f.name}</Td>
                <Td>{f.classId === "all" ? "All classes" : db.classes.find((c) => c.id === f.classId)?.name ?? f.classId}</Td>
                <Td>{f.term}</Td>
                <Td>${f.amount.toLocaleString()}</Td>
                <Td>{f.dueDate}</Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => setEditing(f)}>Edit</Button>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* Per-student payment status */}
      <Card className="mt-6 p-0">
        <div className="border-b border-gray-100 p-4 dark:border-slate-800">
          <h3 className="font-semibold">{isAdmin ? "Payment status by student" : "Payments"}</h3>
        </div>
        {visibleStudents.length === 0 ? (
          <EmptyState icon="💳" title="No students to show" />
        ) : (
          <Table head={isAdmin ? ["Student", "Class", "Fee", "Paid", "Status", "Action"] : ["Child", "Fee", "Paid", "Due", "Status"]}>
            {visibleStudents.flatMap((st) =>
              db.feeItems
                .filter((f) => f.classId === "all" || f.classId === st.classId)
                .map((f) => {
                  const pay = db.feePayments.find((p) => p.studentId === st.id && p.feeItemId === f.id);
                  const owed = f.amount - (pay?.amount ?? 0);
                  return (
                    <tr key={`${st.id}:${f.id}`} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                      {isAdmin && <Td className="font-medium">{st.name}</Td>}
                      {isAdmin && <Td>{db.classes.find((c) => c.id === st.classId)?.name}</Td>}
                      <Td>{f.name}</Td>
                      <Td>${(pay?.amount ?? 0).toLocaleString()}</Td>
                      {isAdmin ? (
                        <Td>${owed.toLocaleString()}</Td>
                      ) : (
                        <Td>${f.amount.toLocaleString()}</Td>
                      )}
                      <Td>
                        {pay?.status === "paid" ? <Badge tone="green">paid</Badge> : pay?.status === "partial" ? <Badge tone="amber">partial</Badge> : <Badge tone="red">pending</Badge>}
                      </Td>
                      {isAdmin && (
                        <Td>
                          {owed > 0 && (
                            <Button size="sm" onClick={() => setPaying({ studentId: st.id, feeItemId: f.id })}>
                              Record payment
                            </Button>
                          )}
                        </Td>
                      )}
                    </tr>
                  );
                })
            )}
          </Table>
        )}
      </Card>

      {/* payment modal */}
      <Modal open={!!paying} onClose={() => setPaying(null)} title="Record payment">
        {paying && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setBusy(true);
              try {
                await recordPayment(paying.feeItemId, paying.studentId, Number(fd.get("amount")), String(fd.get("method")) as FeePayment["method"]);
                setPaying(null);
                toast("Payment recorded");
              } catch (err) {
                toast(err instanceof Error ? err.message : "Failed", "error");
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {db.students.find((s) => s.id === paying.studentId)?.name} — {db.feeItems.find((f) => f.id === paying.feeItemId)?.name}
            </p>
            <Field label="Amount ($)">
              <Input name="amount" type="number" min={1} required />
            </Field>
            <Field label="Method">
              <Select name="method" defaultValue="online">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank transfer</option>
                <option value="online">Online</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Record"}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* fee editor */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit fee" : "New fee"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Fee name">
            <Input name="name" defaultValue={editing?.name} placeholder="Tuition — Spring 2027" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Applies to">
              <Select name="classId" defaultValue={editing?.classId ?? "all"}>
                <option value="all">All classes</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount ($)">
              <Input name="amount" type="number" min={0} defaultValue={editing?.amount ?? 0} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Term">
              <Input name="term" defaultValue={editing?.term ?? "Fall 2026"} />
            </Field>
            <Field label="Due date">
              <Input name="dueDate" type="date" defaultValue={editing?.dueDate ?? todayISO()} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save fee"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
