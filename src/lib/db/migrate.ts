import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set, skipping migrations");
    process.exit(0);
  }

  console.log("Running database migrations...");
  const sql = neon(url);
  const db = drizzle({ client: sql });

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
