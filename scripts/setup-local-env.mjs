// Wires .env.local to the LOCAL Supabase stack for load testing.
// Uses the CLI's non-secret local dev keys; nothing is printed to stdout.
import { execSync } from "node:child_process";
import { writeFileSync, copyFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

const out = execSync("npx --yes supabase status --output env", { encoding: "utf8" });
const get = (k) => (out.match(new RegExp(`${k}="?([^"\\n]+)"?`)) || [])[1];
const url = get("API_URL") || "http://127.0.0.1:54321";
const anon = get("ANON_KEY");
const service = get("SERVICE_ROLE_KEY");
if (!anon || !service) {
  console.error("Could not read Supabase keys from `supabase status`. Keys present:", Object.keys({ anon, service }).join(","));
  process.exit(1);
}

if (existsSync(".env.local")) copyFileSync(".env.local", ".env.local.bak");
const secret = () => randomBytes(32).toString("hex");
const content =
  [
    "# LOCAL SUPABASE LOAD-TEST CONFIG (auto-generated; original at .env.local.bak)",
    `NEXT_PUBLIC_SUPABASE_URL=${url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
    `SUPABASE_SERVICE_ROLE_KEY=${service}`,
    `JWT_SECRET=${secret()}`,
    `OTP_SECRET=${secret()}`,
    "NEXT_PUBLIC_APP_URL=http://localhost:3900",
    "DEFAULT_WAREHOUSE_ID=00000000-0000-0000-0000-000000000010",
  ].join("\n") + "\n";
writeFileSync(".env.local", content);
console.log(`Wrote .env.local → Supabase at ${url} (keys hidden). Backup at .env.local.bak`);
