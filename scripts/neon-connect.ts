/**
 * Fetch the Neon Postgres connection string via the Neon API and save it as
 * VITE_DATABASE_URL in .env.local. Prints only masked info (never the password).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const envPath = ".env.local";
const env: Record<string, string> = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
}

const token = env.NEON_AI_GATEWAY_TOKEN;
if (!token) {
  console.error("NEON_AI_GATEWAY_TOKEN missing from .env.local");
  process.exit(1);
}

const API = "https://console.neon.tech/api/v2";
const H = { Authorization: `Bearer ${token}` };

function mergeEnvLine(key: string, value: string): void {
  let lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const found = lines.some((l) => l.startsWith(`${key}=`));
  if (found) lines = lines.map((l) => (l.startsWith(`${key}=`) ? `${key}="${value}"` : l));
  else lines.push(`${key}="${value}"`);
  writeFileSync(envPath, lines.join("\n"));
}

interface Branch {
  id: string;
  name: string;
  default?: boolean;
}

async function main(): Promise<void> {
  const pr = await fetch(`${API}/projects`, { headers: H });
  console.log("GET /projects ->", pr.status);
  if (!pr.ok) {
    console.error("Token was not accepted by the Neon API.");
    process.exit(2);
  }
  const { projects } = (await pr.json()) as { projects: Array<{ id: string; name: string }> };
  console.log("projects:", projects.map((p) => `${p.name} (${p.id})`).join(", ") || "(none)");
  if (projects.length === 0) process.exit(3);

  // Prefer the project that owns the branch referenced by the storage endpoint
  const wantBranch = "br-empty-poetry-b4sbwztm";
  let chosen = projects[0];
  let branchId = "";
  for (const p of projects) {
    const br = await fetch(`${API}/projects/${p.id}/branches`, { headers: H });
    if (!br.ok) continue;
    const { branches } = (await br.json()) as { branches: Branch[] };
    const match = branches.find((b) => b.id === wantBranch);
    if (match) {
      chosen = p;
      branchId = match.id;
      break;
    }
  }
  if (!branchId) {
    const br = await fetch(`${API}/projects/${chosen.id}/branches`, { headers: H });
    if (!br.ok) {
      console.error("Could not list branches");
      process.exit(4);
    }
    const { branches } = (await br.json()) as { branches: Branch[] };
    branchId = branches.find((b) => b.default)?.id ?? branches[0]?.id ?? "";
  }
  if (!branchId) {
    console.error("No branch found");
    process.exit(5);
  }

  const csr = await fetch(`${API}/projects/${chosen.id}/branches/${branchId}/connection_string`, { headers: H });
  console.log("GET connection_string ->", csr.status);
  if (!csr.ok) {
    console.error("Could not fetch connection string");
    process.exit(6);
  }
  const { connection_string } = (await csr.json()) as { connection_string: string };
  const u = new URL(connection_string);
  const pw = u.password;
  const pwLooksReal = pw.length > 0 && !pw.includes("[") && !pw.includes("]");
  console.log(`Using project ${chosen.id}, branch ${branchId}`);
  console.log(`host=${u.host} db=${u.pathname.slice(1)} user=${u.username} password=${pwLooksReal ? "(present, hidden)" : "(MISSING/placeholder)"}`);
  if (!pwLooksReal) {
    console.error("Connection string has no usable password — paste a full URI from the Neon console instead.");
    process.exit(7);
  }
  mergeEnvLine("VITE_DATABASE_URL", connection_string);
  console.log("Saved VITE_DATABASE_URL into .env.local");
}

main();
