// Integration-test bootstrap: ensures a throwaway test database exists, applies
// a fresh schema from db/schema.sql, then runs the *.int.js files with
// NODE_ENV=test so the app's pool (config/db.js) targets the test DB.
//
//   npm run test:integration
//
// TEST_DATABASE_URL is derived from DATABASE_URL (db name -> thriftstore_test)
// unless you set it explicitly in backend/.env.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = "test";

if (!process.env.TEST_DATABASE_URL) {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL or TEST_DATABASE_URL in backend/.env");
    process.exit(1);
  }
  const derived = new URL(process.env.DATABASE_URL);
  derived.pathname = `/${process.env.TEST_DB_NAME || "thriftstore_test"}`;
  process.env.TEST_DATABASE_URL = derived.toString();
}

const testUrl = new URL(process.env.TEST_DATABASE_URL);
const testDbName = decodeURIComponent(testUrl.pathname.slice(1));

// 1. Create the test database if missing (connect to the maintenance DB).
const adminUrl = new URL(process.env.TEST_DATABASE_URL);
adminUrl.pathname = "/postgres";
const admin = new Client({ connectionString: adminUrl.toString() });
await admin.connect();
const existing = await admin.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  [testDbName],
);
if (existing.rowCount === 0) {
  await admin.query(`CREATE DATABASE "${testDbName}"`);
  console.log(`Created test database "${testDbName}"`);
}
await admin.end();

// 2. Apply a fresh schema (drop & recreate public). Strip psql meta-commands
//    (\restrict / \unrestrict) that pg_dump emits but node-postgres can't run.
const schema = readFileSync(join(here, "..", "db", "schema.sql"), "utf8")
  .split("\n")
  .filter((line) => !line.startsWith("\\"))
  .join("\n");

const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
await db.connect();
await db.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
await db.query(schema);
await db.end();
console.log(`Applied schema to "${testDbName}"`);

// 3. Run each integration file in its own subprocess (env inherited).
const files = readdirSync(here)
  .filter((file) => file.endsWith(".int.js"))
  .map((file) => join(here, file));

if (files.length === 0) {
  console.log("No .int.js integration files found.");
  process.exit(0);
}

const result = spawnSync("node", ["--test", ...files], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
