import { URL } from "url";

let step = 0;
const s = (fixed: number) => `[DB:${String(fixed).padStart(2, "0")}|${String(++step).padStart(2, "0")}]`;

export function getDatabaseUrl(): string {
  step = 0;

  console.log(`🔍 ${s(1)} Starting getDatabaseUrl()`);
  console.log(`🔍 ${s(2)} NODE_ENV: ${process.env.NODE_ENV ?? "not set"}`);

  const databaseUrl = process.env.DATABASE_URL;

  // ── 03. Existence check ──────────────────────────────────────────────
  if (!databaseUrl) {
    console.error(`❌ ${s(3)} DATABASE_URL is not set in environment.`);
    console.error(`   ${s(4)} Checked: process.env.DATABASE_URL → undefined/empty`);
    console.error(`   ${s(5)} Fix: Add DATABASE_URL=postgresql://... to .env.local`);
    throw new Error("DATABASE_URL is not set.");
  }
  console.log(`✅ ${s(3)} DATABASE_URL is present, length: ${databaseUrl.length}`);

  // ── 04. Protocol check ───────────────────────────────────────────────
  if (
    !databaseUrl.startsWith("postgresql://") &&
    !databaseUrl.startsWith("postgres://")
  ) {
    console.error(`❌ ${s(4)} Invalid protocol in DATABASE_URL.`);
    console.error(`   ${s(5)} Got prefix: "${databaseUrl.slice(0, 15)}"`);
    console.error(`   ${s(6)} Expected: postgresql:// or postgres://`);
    throw new Error("DATABASE_URL must start with postgresql:// or postgres://");
  }
  console.log(`✅ ${s(4)} Protocol is valid.`);

  // ── 05. URL parsing ──────────────────────────────────────────────────
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
    console.log(`✅ ${s(5)} URL parsed successfully.`);
  } catch (e) {
    console.error(`❌ ${s(5)} DATABASE_URL could not be parsed.`);
    console.error(`   ${s(6)} Error: ${(e as Error).message}`);
    console.error(`   ${s(7)} Check for typos or unencoded special characters.`);
    throw new Error("DATABASE_URL is malformed.");
  }

  // ── 06. Host ─────────────────────────────────────────────────────────
  if (!parsed.hostname) {
    console.error(`❌ ${s(6)} No hostname found in DATABASE_URL.`);
    console.error(`   ${s(7)} Example: postgresql://user:pass@<HOST>:5432/dbname`);
    throw new Error("DATABASE_URL is missing a hostname.");
  }
  console.log(`✅ ${s(6)} Host: ${parsed.hostname}`);

  // ── 07. Port ─────────────────────────────────────────────────────────
  if (!parsed.port) {
    console.warn(`⚠️  ${s(7)} No port specified — defaulting to 5432.`);
    console.warn(`   ${s(8)} May cause issues if DB runs on a non-standard port.`);
  } else {
    console.log(`✅ ${s(7)} Port: ${parsed.port}`);
  }

  // ── 08. Username ─────────────────────────────────────────────────────
  if (!parsed.username) {
    console.error(`❌ ${s(8)} No username found in DATABASE_URL.`);
    console.error(`   ${s(9)} Format: postgresql://<USERNAME>:password@host:port/db`);
    throw new Error("DATABASE_URL is missing a username. Likely a credentials issue.");
  }
  console.log(`✅ ${s(8)} Username: ${parsed.username}`);

  // ── 09. Password ─────────────────────────────────────────────────────
  if (!parsed.password) {
    console.error(`❌ ${s(9)} No password found in DATABASE_URL.`);
    console.error(`   ${s(10)} Format: postgresql://username:<PASSWORD>@host:port/db`);
    console.error(`   ${s(11)} Special chars (@, #, !, /, ?, =) MUST be percent-encoded.`);
    console.error(`   ${s(12)} Example: @ → %40, # → %23, ! → %21`);
    throw new Error("DATABASE_URL is missing a password. Likely a credentials issue.");
  }
  console.log(`✅ ${s(9)} Password: [SET] (length: ${parsed.password.length})`);

  // ── 10. Database name ────────────────────────────────────────────────
  const dbName = parsed.pathname.replace("/", "");
  if (!dbName) {
    console.error(`❌ ${s(10)} No database name found in DATABASE_URL.`);
    console.error(`   ${s(11)} Format: postgresql://user:pass@host:5432/<DBNAME>`);
    throw new Error("DATABASE_URL is missing the database name.");
  }
  console.log(`✅ ${s(10)} Database name: ${dbName}`);

  // ── 11. Special character check in password ──────────────────────────
  const rawPassword = parsed.password;
  const decodedPassword = decodeURIComponent(rawPassword);
  if (rawPassword === decodedPassword && /[@#!/?=]/.test(rawPassword)) {
    console.warn(`⚠️  ${s(11)} Password contains special chars that may need encoding.`);
    console.warn(`   ${s(12)} Characters like @ # ! / ? = must be percent-encoded.`);
    console.warn(`   ${s(13)} Example: myp@ss → myp%40ss`);
    console.warn(`   ${s(14)} Run in Node: encodeURIComponent('yourpassword')`);
  } else {
    console.log(`✅ ${s(11)} Password encoding looks clean.`);
  }

  // ── 12. SSL mode ─────────────────────────────────────────────────────
  const sslMode = parsed.searchParams.get("sslmode");
  if (!sslMode) {
    console.warn(`⚠️  ${s(12)} No sslmode param found.`);
    console.warn(`   ${s(13)} Cloud DBs (Neon, Supabase, Railway) need ?sslmode=require`);
  } else {
    console.log(`✅ ${s(12)} sslmode: ${sslMode}`);
  }

  console.log(`✅ ${s(13)} All checks passed. Returning database URL.\n`);
  return databaseUrl;
}

export function validateDatabaseConfig(): boolean {
  console.log(`🔍 [DB:V1|00] validateDatabaseConfig() called`);
  getDatabaseUrl();
  console.log(`✅ [DB:V2|--] validateDatabaseConfig() passed\n`);
  return true;
}
/**
 * 
 * 
 * ============================================================================================
 */

// /**
//  * Gets the database URL from environment variables
//  * Uses a single DATABASE_URL for both development and production
//  * 
//  * @returns The database connection string
//  * @throws Error if DATABASE_URL is not configured
//  */
// export function getDatabaseUrl(): string {
//   const databaseUrl = process.env.DATABASE_URL
  
//   if (!databaseUrl) {
//     console.error('❌ Database Configuration Error:')
//     console.error('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
//     console.error('   NODE_ENV:', process.env.NODE_ENV || 'not set')
//     console.error('   Please set DATABASE_URL in your .env.local file')
//     throw new Error(
//       'DATABASE_URL environment variable is required. Please set it in .env.local file.'
//     )
//   }
  
//   // Basic validation
//   if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
//     console.error('❌ Invalid Database URL format:')
//     console.error('   URL should start with postgresql:// or postgres://')
//     throw new Error(
//       'DATABASE_URL must be a valid PostgreSQL connection string (starting with postgresql:// or postgres://)'
//     )
//   }
  
//   return databaseUrl
// }

// /**
//  * Validates that a database URL is properly configured
//  * @returns true if valid, throws error if not
//  */
// export function validateDatabaseConfig(): boolean {
//   try {
//     const url = getDatabaseUrl()
//     // Basic validation - check if it's a valid PostgreSQL URL format
//     if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
//       throw new Error('Database URL must be a PostgreSQL connection string')
//     }
//     return true
//   } catch (error) {
//     if (error instanceof Error) {
//       throw error
//     }
//     throw new Error('Invalid database configuration')
//   }
// }
