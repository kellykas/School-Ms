/**
 * Export the EduSphere demo dataset to db-export.json so scripts/storage.ts backup can push it
 * to Neon S3-compatible storage. Uses the app's own seed logic so backups match app data 1:1.
 */
import { writeFileSync } from "node:fs";

// Inline import of the app's seed logic (services/mockData.ts is TS; bun runs TS natively)
const mod = await import("../services/mockData");

const db = mod.seedDB();
// Session is runtime state, not data — strip it
const { session: _session, ...data } = db;

writeFileSync("db-export.json", JSON.stringify(data, null, 2));
const kb = (JSON.stringify(data).length / 1024).toFixed(1);
console.log(`Exported db-export.json (${kb} KB):`);
console.log(`  users=${data.users.length} students=${data.students.length} classes=${data.classes.length}`);
console.log(`  teachers=${data.teachers.length} exams=${data.exams.length} grades=${data.grades.length}`);
console.log(`  assignments=${data.assignments.length} submissions=${data.submissions.length}`);
console.log(`  feeItems=${data.feeItems.length} feePayments=${data.feePayments.length} auditLogs=${data.auditLogs.length}`);
