require("dotenv").config({ path: ".env.local" });

const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

console.log("===== 1. DATABASE_URL:", process.env.DATABASE_URL);

client.connect()
  .then(() => {
    console.log("DB Connected Successfully");
    return client.end();
  })
  .catch(err => {
    console.error("Connection Error:", err);
  });