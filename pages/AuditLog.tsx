import { useState } from "react";
import { getDB, clearAuditLogs } from "../services/api";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Table, Td, useToast } from "../components/ui";

export default function AuditLog() {
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const db = getDB();

  const logs = db.auditLogs.filter((l) => {
    const q = query.toLowerCase();
    return !q || l.actorName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        sub="Every privileged action, in order"
        actions={
          <>
            <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-56" />
            <Button variant="danger" onClick={() => setConfirmClear(true)}>
              Clear log
            </Button>
          </>
        }
      />

      <Card className="p-0">
        {logs.length === 0 ? (
          <EmptyState icon="🛡️" title="No audit entries" hint="Actions like logins, edits and payments will appear here." />
        ) : (
          <Table head={["When", "Actor", "Action", "Entity", "Detail"]}>
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                <Td className="whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">{new Date(l.timestamp).toLocaleString()}</Td>
                <Td className="font-medium">{l.actorName}</Td>
                <Td>
                  <Badge tone={l.action.startsWith("user") ? "blue" : l.action.includes("delete") || l.action.includes("deactivated") ? "red" : "gray"}>{l.action}</Badge>
                </Td>
                <Td>{l.entity}</Td>
                <Td className="max-w-md whitespace-normal">{l.detail}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await clearAuditLogs();
            toast("Audit log cleared");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Clear failed", "error");
          }
          setBusy(false);
          setConfirmClear(false);
        }}
        title="Clear the audit log?"
        body="This permanently removes all audit entries. The clearing itself will be recorded as a new entry."
        confirmLabel="Yes, clear it"
        danger
        busy={busy}
      />
    </>
  );
}
