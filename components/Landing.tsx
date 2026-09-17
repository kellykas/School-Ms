import { Badge, Button, Card } from "./ui";

const features = [
  {
    icon: "📅",
    title: "Attendance in seconds",
    desc: "Teachers mark daily attendance per class; parents see absences the moment they happen.",
  },
  {
    icon: "📝",
    title: "Exams & gradebooks",
    desc: "Schedule exams, record scores, and publish results with automatic per-subject analytics.",
  },
  {
    icon: "📚",
    title: "Assignments & submissions",
    desc: "Publish homework, track submissions, and grade with feedback — all in one flow.",
  },
  {
    icon: "💳",
    title: "Fee tracking",
    desc: "Tuition, lab, and activity fees with payment status per student and per family.",
  },
  {
    icon: "🛡️",
    title: "Full audit trail",
    desc: "Every login, grade, and payment is logged so admins always know who did what.",
  },
  {
    icon: "🌗",
    title: "Light & dark themes",
    desc: "A polished interface for every role, in the office, classroom, or living room.",
  },
];

const roles = [
  { icon: "🛠️", name: "Admin", desc: "Manage users, students, classes, fees, and monitor the whole school." },
  { icon: "🧑‍🏫", name: "Teacher", desc: "Take attendance, create assignments, grade exams and homework." },
  { icon: "🎒", name: "Student", desc: "See your timetable, grades, homework due, and attendance history." },
  { icon: "👨‍👩‍👧", name: "Parent", desc: "Follow your child's progress, attendance, fees, and teacher feedback." },
];

export default function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">🎓</span>
            <span className="text-lg font-bold tracking-tight">EduSphere</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-300 md:flex">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400">Features</a>
            <a href="#roles" className="hover:text-brand-600 dark:hover:text-brand-400">Roles</a>
            <a href="#demo" className="hover:text-brand-600 dark:hover:text-brand-400">Demo</a>
          </nav>
          <Button onClick={onSignIn}>Sign in</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="blob-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 animate-float rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/10" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 animate-float-slow rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="animate-fade-up">
            <Badge tone="blue">✦ School management, unified</Badge>
          </div>
          <h1 className="animate-fade-up mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl" style={{ animationDelay: "80ms" }}>
            Run your whole school from{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-violet-400">one sphere</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-slate-400" style={{ animationDelay: "160ms" }}>
            Attendance, exams, assignments, and fees — with purpose-built views for admins, teachers, students, and parents.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Button onClick={onSignIn} className="px-6 py-3 text-base">Open the app →</Button>
            <a href="#features">
              <Button variant="outline" className="px-6 py-3 text-base">Explore features</Button>
            </a>
          </div>
          <div className="animate-fade-up mt-6 text-sm text-gray-500 dark:text-slate-500" style={{ animationDelay: "320ms" }}>
            Try it instantly with the demo accounts below — no signup needed.
          </div>

          {/* App preview mock */}
          <div className="animate-fade-up mx-auto mt-14 max-w-4xl" style={{ animationDelay: "400ms" }}>
            <Card className="overflow-hidden p-0 text-left shadow-pop">
              <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-gray-400">edusphere.app/dashboard</span>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {[
                  { l: "Attendance today", v: "96.4%", s: "↑ 1.2% vs last week", t: "text-emerald-600" },
                  { l: "Fees collected", v: "$28.4k", s: "62% of Fall term", t: "text-brand-600 dark:text-brand-400" },
                  { l: "Assignments due", v: "12", s: "across 4 classes", t: "text-violet-600" },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-xs text-gray-500 dark:text-slate-400">{m.l}</p>
                    <p className="mt-1 text-2xl font-bold">{m.v}</p>
                    <p className={`mt-0.5 text-xs font-medium ${m.t}`}>{m.s}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything a school needs</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            One platform replacing spreadsheets, WhatsApp groups, and paper registers.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className="animate-fade-up p-6 transition hover:-translate-y-1 hover:shadow-pop" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl dark:bg-brand-500/10">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-y border-gray-200/60 bg-white py-20 dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Built for four roles</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
              Each role signs in to a focused dashboard with exactly the tools they need.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r, i) => (
              <Card key={r.name} className="animate-fade-up p-6 text-center transition hover:-translate-y-1 hover:shadow-pop" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-2xl shadow-pop">{r.icon}</div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-slate-400">{r.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section id="demo" className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Try the demo</h2>
        <p className="mt-3 text-gray-600 dark:text-slate-400">Pre-filled demo accounts for each role.</p>
        <Card className="mt-8 overflow-hidden p-0 text-left">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <th className="px-5 py-3 text-left font-semibold">Role</th>
                <th className="px-5 py-3 text-left font-semibold">Email</th>
                <th className="px-5 py-3 text-left font-semibold">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {[
                ["Admin", "admin@school.com", "password123"],
                ["Teacher", "anderson@school.com", "teach"],
                ["Student", "emma.t@student.edusphere.com", "learn"],
                ["Parent", "sarah.w@parent.edusphere.com", "care"],
              ].map(([role, email, pw]) => (
                <tr key={email}>
                  <td className="px-5 py-3 font-medium">{role}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-slate-400">{email}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-slate-400">{pw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="mt-8">
          <Button onClick={onSignIn} className="px-6 py-3 text-base">Sign in to EduSphere →</Button>
        </div>
      </section>

      <footer className="border-t border-gray-200/60 py-8 text-center text-sm text-gray-500 dark:border-slate-800/60 dark:text-slate-400">
        🎓 EduSphere — school management for admins, teachers, students & parents.
      </footer>
    </div>
  );
}
