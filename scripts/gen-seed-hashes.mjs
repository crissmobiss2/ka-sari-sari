// Generates real bcrypt hashes for the seed demo accounts and writes an
// UPDATE .sql (the committed seed migration ships placeholder hashes).
import bcrypt from "bcryptjs";
import { writeFileSync } from "node:fs";

const accounts = {
  "09171234567": "admin",
  "09172345678": "warehouse",
  "09173456789": "driver",
  "09181234567": "demo1234",
};

let sql = "-- Real bcrypt hashes for the seed demo accounts (local dev / load test)\n";
for (const [phone, pw] of Object.entries(accounts)) {
  const hash = bcrypt.hashSync(pw, 10);
  sql += `UPDATE users SET password_hash = '${hash}' WHERE phone = '${phone}';\n`;
}
writeFileSync("scripts/fix-seed-hashes.sql", sql);
console.log(`Wrote scripts/fix-seed-hashes.sql (${Object.keys(accounts).length} users)`);
