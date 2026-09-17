import { useEffect, useState } from "react";
import type { Role, User } from "../types";
import { Avatar, Button, ThemeToggle, cx } from "./ui";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Students from "../pages/Students";
import { Classes } from "../pages/Classes";
import Teachers from "../pages/Teachers";
import Attendance from "../pages/Attendance";
import Exams from "../pages/Exams";
import Assignments from "../pages/Assignments";
import Fees from "../pages/Fees";
import AuditLog from "../pages/AuditLog";
import Settings from "../pages/Settings";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["admin", "teacher", "student", "parent"] },
  { path: "/users", label: "Users", icon: "👥", roles: ["admin"] },
  { path: "/students", label: "Students", icon: "🎒", roles: ["admin", "teacher"] },
  { path: "/classes", label: "Classes", icon: "🏫", roles: ["admin", "teacher"] },
  { path: "/teachers", label: "Teachers", icon: "🧑‍🏫", roles: ["admin"] },
  { path: "/attendance", label: "Attendance", icon: "📅", roles: ["admin", "teacher", "student", "parent"] },
  { path: "/exams", label: "Exams", icon: "📝", roles: ["admin", "teacher", "student", "parent"] },
  { path: "/assignments", label: "Assignments", icon: "📚", roles: ["admin", "teacher", "student"] },
  { path: "/fees", label: "Fees", icon: "💳", roles: ["admin", "parent"] },
  { path: "/audit", label: "Audit Log", icon: "🛡️", roles: ["admin"] },
  { path: "/settings", label: "Settings", icon: "⚙️", roles: ["admin", "teacher", "student", "parent"] },
];

export default function AppShell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [route, setRouteState] = useState(() => window.location.hash.replace(/^#/, "") || "/dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setRouteState(window.location.hash.replace(/^#/, "") || "/dashboard");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  // Close mobile nav on Escape and lock scroll behind it
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const nav = NAV.filter((n) => n.roles.includes(user.role));
  const current = nav.some((n) => route.startsWith(n.path)) ? route : "/dashboard";

  const setRoute = (path: string) => {
    window.location.hash = path;
    setRouteState(path);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 md:hidden" onClick={() => setMobileOpen((o) => !o)}>
              ☰
            </button>
            <a
              href="#/dashboard"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                setRoute("/dashboard");
              }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">🎓</span>
              <span className="hidden font-bold tracking-tight sm:block">EduSphere</span>
            </a>
            <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 md:inline">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 dark:border-slate-700 sm:flex">
              <Avatar name={user.name} color={user.avatarColor} size="sm" />
              <span className="hidden text-sm font-medium md:block">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Mobile backdrop */}
        {mobileOpen && <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

        {/* Sidebar */}
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-30 mt-14 w-60 shrink-0 overflow-y-auto border-r border-gray-200/70 bg-white px-3 py-4 transition-transform duration-200 dark:border-slate-800/70 dark:bg-slate-950 md:sticky md:top-14 md:mt-0 md:h-[calc(100vh-3.5rem)] md:translate-x-0",
            mobileOpen ? "translate-x-0 shadow-pop" : "-translate-x-full"
          )}
        >
          <nav className="space-y-0.5">
            {nav.map((n) => {
              const active = current.startsWith(n.path);
              return (
                <a
                  key={n.path}
                  href={`#${n.path}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setRoute(n.path);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden="true" />}
                  <span className="text-base transition-transform group-hover:scale-110">{n.icon}</span>
                  {n.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-400 dark:border-slate-700 dark:text-slate-500">
            Signed in as <span className="font-medium text-gray-600 dark:text-slate-300">{user.email}</span>
          </div>
        </aside>

        {/* Main */}
        <main key={current} className="animate-fade-up min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <RoutePage route={current} user={user} />
        </main>
      </div>
    </div>
  );
}

function RoutePage({ route, user }: { route: string; user: User }) {
  const base = route.split("/").filter(Boolean)[0] ?? "dashboard";
  switch (base) {
    case "users":
      return <Users />;
    case "students":
      return <Students />;
    case "classes":
      return <Classes />;
    case "teachers":
      return <Teachers />;
    case "attendance":
      return <Attendance user={user} />;
    case "exams":
      return <Exams user={user} />;
    case "assignments":
      return <Assignments user={user} />;
    case "fees":
      return <Fees user={user} />;
    case "audit":
      return <AuditLog />;
    case "settings":
      return <Settings />;
    default:
      return <Dashboard user={user} />;
  }
}
