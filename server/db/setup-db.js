// Creates the database (if missing) and loads schema.sql + seed.sql.
// Usage (from the server folder): npm run db:setup
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const dbName = process.env.PGDATABASE || "BlogDB4";
const base = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
};

async function main() {
  // 1) Connect to the default "postgres" database to create the blog database if needed.
  const admin = new Client({ ...base, database: "postgres" });
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }
  await admin.end();

  // 2) Load tables and starter rows.
  const client = new Client({ ...base, database: dbName });
  await client.connect();
  for (const file of ["schema.sql", "seed.sql"]) {
    await client.query(fs.readFileSync(path.join(__dirname, file), "utf8"));
    console.log(`Ran ${file}`);
  }
  await client.end();
  console.log("Done. Start the API with: npm run dev (from the project root)");
}

main().catch((err) => {
  console.error("Database setup failed:", err.message);
  process.exit(1);
});
