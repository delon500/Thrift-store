// Minimal, idempotent migration runner so deploys can't silently miss a
// migration. Tracks applied files in a `schema_migrations` table.
//
// Migrations are incremental deltas applied on top of a base schema (see
// migrations/001…). For a DB that was already migrated by hand, adopt the
// runner once with `--baseline` (records every existing file as applied
// WITHOUT re-running it). After that, `migrate` applies only new files.
//
// Usage (from backend/):
//   npm run migrate            apply pending migrations
//   npm run migrate:status     list applied vs pending
//   npm run migrate:baseline   mark all current files as applied (no execution)
//
// Targets process.env.DATABASE_URL.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const ensureTable = () =>
  pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

const migrationFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

const appliedSet = async () => {
  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  return new Set(rows.map((row) => row.filename));
};

const run = async () => {
  await ensureTable();
  const applied = await appliedSet();
  const pending = migrationFiles().filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    await pool.query(sql);
    await pool.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [file],
    );
    console.log("done");
  }

  console.log(`Applied ${pending.length} migration(s).`);
};

const baseline = async () => {
  await ensureTable();
  const files = migrationFiles();
  for (const file of files) {
    await pool.query(
      `INSERT INTO schema_migrations (filename) VALUES ($1)
       ON CONFLICT (filename) DO NOTHING`,
      [file],
    );
  }
  console.log(
    `Baselined ${files.length} migration(s) as already applied (not executed).`,
  );
};

const status = async () => {
  await ensureTable();
  const applied = await appliedSet();
  for (const file of migrationFiles()) {
    console.log(`${applied.has(file) ? "[applied]" : "[pending]"} ${file}`);
  }
};

const command = process.argv[2];

const main = async () => {
  if (command === "--baseline") return baseline();
  if (command === "--status") return status();
  return run();
};

main()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
