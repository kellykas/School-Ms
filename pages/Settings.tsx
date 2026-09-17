import { useState } from "react";
import { getDB, isNeon, resetDemoData, currentUser } from "../services/api";
import { Badge, Button, Card, ConfirmDialog, PageHeader, useTheme, useToast, cx } from "../components/ui";

const THEME_OPTIONS: Array<{ key: "light" | "dark" | "system"; label: string; icon: string; hint: string }> = [
  { key: "light", label: "Light", icon: "☀️", hint: "Bright and clean" },
  { key: "dark", label: "Dark", icon: "🌙", hint: "Easy on the eyes" },
  { key: "system", label: "System", icon: "💻", hint: "Match your device" },
];

export default function Settings() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const db = getDB();
  const me = currentUser();
  void db;

  return (
    <>
      <PageHeader title="Settings" sub="Appearance, account and system preferences" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Appearance</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Choose how EduSphere looks on this device.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={cx(
                    "group flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-sm font-medium transition",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/50"
                  )}
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">{opt.icon}</span>
                  {opt.label}
                  <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Account</h3>
          {me ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-slate-400">Signed in as</span>
                <span className="font-medium">{me.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-slate-400">Email</span>
                <span className="font-medium">{me.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-slate-400">Role</span>
                <span className="inline-flex">
                  <Badge tone="blue">{me.role}</Badge>
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Not signed in.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Data source</h3>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={cx(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg",
                isNeon()
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
              )}
            >
              {isNeon() ? "☁️" : "💾"}
            </span>
            <div>
              <p className="text-sm font-medium">{isNeon() ? "Neon Postgres — cloud persistence active" : "Local browser storage"}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                {isNeon()
                  ? "All records are saved to your Neon database in real time — data survives across devices and browsers."
                  : "Data persists only in this browser. Add a VITE_DATABASE_URL (Neon connection string) to enable cloud persistence."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-rose-200 p-5 dark:border-rose-900/50">
          <h3 className="font-semibold">Danger zone</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Reset all students, classes, attendance, grades, fees and audit entries back to the original demo seed.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmReset(true)} disabled={resetting}>
            ♻️ Reset demo data
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          setResetting(true);
          try {
            await resetDemoData();
            toast("Demo data has been reset to the original seed");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Reset failed", "error");
          }
          setResetting(false);
          setConfirmReset(false);
        }}
        title="Reset all demo data?"
        body="Every change you've made — new students, payments, grades, attendance — will be replaced by the original demo dataset. This cannot be undone."
        confirmLabel="Yes, reset everything"
        danger
        busy={resetting}
      />
    </>
  );
}
