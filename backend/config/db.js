import { Pool } from "pg";

// Tests run against a throwaway database so they never touch dev/prod data.
const connectionString =
  process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

export default pool;
