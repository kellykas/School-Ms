# EduSphere - School Management System

A role-based school management platform for **Admins, Teachers, Students, and Parents**: attendance, exams & grades, assignments, fee tracking, and a full user directory with an audit trail.

## Quick start

```bash
npm install
npm run dev        # binds 0.0.0.0, honors PORT
```

Then open the app and sign in. Demo accounts (pre-filled in the login screen):

| Role   | Email                  | Password    |
| ------ | ---------------------- | ----------- |
| Admin  | admin@school.com       | password123 |
| Teacher| anderson@school.com    | teach       |
| Student| emma.t@student.edusphere.com | learn |
| Parent | sarah.w@parent.edusphere.com | care  |

## Architecture

- **Frontend:** React 19 + Vite + TypeScript, Tailwind CSS, Recharts, lucide-react.
- **Data layer:** a self-contained persistent client-side store (`services/mockData.ts` + `services/api.ts`). All data lives in `localStorage` under `edusphere-db-v1` on first load, so admin edits, attendance, and fee payments survive reloads. No backend is required to run the demo.
- **Backend reference:** `backend/` contains an Express + SQLite REST API (login/JWT, users, students, teachers, assignments, exams, fees, attendance, audit logs). It is excluded from the frontend typecheck and is intended as the starting point if you later add a hosted database - swap the method bodies in `services/api.ts` for `fetch()` calls against it.

## Scripts

| Command              | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the dev server (host 0.0.0.0)        |
| `npm run build`      | Production build to `dist/`                |
| `npm run preview`    | Preview the production build               |
| `npm run typecheck`  | TypeScript project check (no emit)         |

## Notes

- The landing page lives in `components/Landing.tsx`; sign-in is routed via `#/signin`.
- Theme (light/dark/system) is persisted per browser.
- AI features were intentionally removed from this build.
