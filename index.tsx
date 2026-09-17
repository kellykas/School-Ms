import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import type { DB, User } from "./types";
import { initDB, subscribe, ready, currentUser, logout } from "./services/api";
import { ThemeProvider, ToastProvider } from "./components/ui";
import Landing from "./components/Landing";
import SignIn from "./components/SignIn";
import AppShell from "./components/AppShell";

function useHashRoute(): string {
  const get = () => window.location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const fn = () => setRoute(get());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  return route;
}

export function navigate(to: string) {
  window.location.hash = to;
}

function useDB(): DB | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    initDB().catch((e) => console.error("DB init failed", e));
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);
  return ready() ? ((initDB() as unknown) as DB) : null;
}

export default function App() {
  const route = useHashRoute();
  const db = useDB();

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white">🎓</span>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Loading EduSphere…</p>
          <p className="max-w-xs text-xs text-gray-400 dark:text-slate-500">
            Connecting to the school database — the first visit can take a few seconds while data is prepared.
          </p>
        </div>
      </div>
    );
  }

  const user: User | null = currentUser();

  let view: React.ReactNode;
  if (route.startsWith("/signin") && !user) {
    view = <SignIn onSuccess={() => navigate("/dashboard")} />;
  } else if (user) {
    view = (
      <AppShell
        user={user}
        onSignOut={() => {
          logout();
          navigate("/");
        }}
      />
    );
  } else {
    view = <Landing onSignIn={() => navigate("/signin")} />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>{view}</ToastProvider>
    </ThemeProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
