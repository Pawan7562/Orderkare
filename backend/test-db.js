const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_6qwSBRlnKui4@ep-silent-darkness-aeuf1dek-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to:", connectionString);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log("Connected successfully to Neon PostgreSQL!");
    return client.query("SELECT NOW();");
  })
  .then((res) => {
    console.log("Database time:", res.rows[0]);
    client.end();
  })
  .catch((err) => {
    console.error("Connection error:", err);
    client.end();
  });
