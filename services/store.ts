import type { DB } from "../types";

let snapshot: DB | null = null;
const listeners = new Set<() => void>();

export function getSnapshot(): DB | null {
  return snapshot;
}

export function setSnapshot(db: DB): void {
  snapshot = db;
}

/** Mutate the in-memory snapshot and notify listeners. */
export function patch(fn: (db: DB) => void): void {
  if (!snapshot) return;
  fn(snapshot);
  emit();
}

export function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
