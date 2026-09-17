import { useState } from "react";
import { login, getDB } from "../services/api";
import { Button, Card, Input, Label, PasswordInput } from "./ui";

export default function SignIn({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("admin@school.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const demoUsers = getDB().users.filter((u) => u.active);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = login(email, password);
    setBusy(false);
    if (res.ok) onSuccess();
    else setError(res.error ?? "Sign-in failed.");
  };

  const quick = (u: { email: string; password: string }) => {
    setEmail(u.email);
    setPassword(u.password);
    setError("");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 dark:bg-slate-950">
      <div className="blob-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

      <div className="relative grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="animate-fade-up hidden lg:block">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">🎓</span>
            <span className="text-xl font-bold tracking-tight">EduSphere</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight">Welcome back to your school's command center.</h1>
          <p className="mt-3 text-gray-600 dark:text-slate-400">
            Sign in as an admin, teacher, student, or parent — every role gets a tailored dashboard.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-center gap-2">✅ Attendance, grades & fees in one place</li>
            <li className="flex items-center gap-2">✅ Role-scoped permissions on every action</li>
            <li className="flex items-center gap-2">✅ Full audit trail of who did what</li>
          </ul>
        </div>

        <Card className="animate-fade-up p-7 sm:p-8">
          <h2 className="text-xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Use a demo account or your school credentials.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" required />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/30 dark:text-rose-300">
                {error}
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full py-2.5">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-slate-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => quick(u)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                >
                  <span className="block font-semibold">{u.role[0].toUpperCase() + u.role.slice(1)}</span>
                  <span className="text-gray-500 dark:text-slate-400">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
