/**
 * EduSphere storage CLI — Neon S3-compatible object storage.
 *
 * Usage:
 *   bun scripts/storage.ts check               verify credentials + round-trip an object
 *   bun scripts/storage.ts backup              push a snapshot of the demo dataset to storage
 *   bun scripts/storage.ts restore [prefix]    download the latest snapshot and print a summary
 *
 * Credentials are read from .env.local (never committed).
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// ---------- env loading ----------
const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^\"|\"$/g, "");
}

if (!env.AWS_ENDPOINT_URL_S3 || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
  console.error("Missing AWS_ENDPOINT_URL_S3 / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const BUCKET = "edusphere-demo";
const client = new S3Client({
  region: env.AWS_REGION || "us-east-2",
  endpoint: env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
});

// ---------- helpers ----------

async function ensureBucket(): Promise<void> {
  if (!(await bucketExists())) {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

async function bucketExists(): Promise<boolean> {
  try {
    await client.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }));
    return true;
  } catch {
    return false;
  }
}

async function put(key: string, body: string | Uint8Array, contentType?: string): Promise<void> {
  await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

async function get(key: string): Promise<string> {
  const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return (await res.Body?.transformToString()) ?? "";
}

async function list(prefix: string): Promise<Array<{ key: string; size?: number; lastModified?: Date }>> {
  const res = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (res.Contents ?? []).map((o) => ({ key: o.Key ?? "", size: o.Size, lastModified: o.LastModified }));
}

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// ---------- commands ----------

async function cmdCheck(): Promise<void> {
  const lb = await client.send(new ListBucketsCommand({}));
  console.log("Buckets:", lb.Buckets?.map((b) => b.Name).join(", ") || "(none)");

  if (!(await bucketExists())) {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log("Created bucket:", BUCKET);
  }

  const key = `_health/check-${ts()}.txt`;
  await put(key, `edusphere storage check @ ${new Date().toISOString()}`);
  const body = await get(key);
  console.log("Round-trip OK:", body);
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  console.log("Cleanup OK");
  console.log("RESULT: storage-verified");
}

async function cmdBackup(): Promise<void> {
  if (!(await bucketExists())) {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }

  const stamp = ts();
  const prefix = `snapshots/${stamp}`;
  const dbJson = existsSync("db-export.json") ? readFileSync("db-export.json", "utf8") : null;
  if (!dbJson) {
    console.error("No db-export.json found. Run the backup export step first.");
    process.exit(1);
  }

  await put(`${prefix}/db.json`, dbJson, "application/json");
  console.log(`Uploaded snapshot: s3://${BUCKET}/${prefix}/db.json (${(dbJson.length / 1024).toFixed(1)} KB)`);

  const all = await list("snapshots/");
  const snaps = [...new Set(all.map((o) => o.key.split("/")[1]))].filter(Boolean).sort();
  console.log(`Total snapshots stored: ${snaps.length}`);
}

async function cmdRestore(prefix?: string): Promise<void> {
  if (!(await bucketExists())) {
    console.error("Bucket does not exist yet — nothing to restore.");
    process.exit(1);
  }
  const all = await list("snapshots/");
  const snaps = [...new Set(all.map((o) => o.key.split("/")[1]))].filter(Boolean).sort();
  if (snaps.length === 0) {
    console.error("No snapshots found.");
    process.exit(1);
  }
  const target = prefix ?? snaps[snaps.length - 1];
  const raw = await get(`snapshots/${target}/db.json`);
  const parsed = JSON.parse(raw);
  mkdirSync("backups", { recursive: true });
  writeFileSync(`backups/restore-${target}.json`, JSON.stringify(parsed, null, 2));
  console.log(`Restored snapshot ${target} -> backups/restore-${target}.json`);
  console.log(`Records: users=${parsed.users?.length ?? 0}, students=${parsed.students?.length ?? 0}, exams=${parsed.exams?.length ?? 0}`);
}

// ---------- entry ----------

const cmd = process.argv[2] ?? "check";
switch (cmd) {
  case "check":
    await cmdCheck();
    break;
  case "backup":
    await cmdBackup();
    break;
  case "restore":
    await cmdRestore(process.argv[3]);
    break;
  default:
    console.error(`Unknown command: ${cmd}. Use check | backup | restore.`);
    process.exit(1);
}
