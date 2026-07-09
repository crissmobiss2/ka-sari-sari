// Run: node supabase/generate-hashes.js
// Generates bcrypt hashes for the 4 seed users and prints the UPDATE SQL
const { hashSync } = require("bcryptjs");

const users = [
  { id: "00000000-0000-0000-0000-000000000001", email: "admin@kasarisari.com", password: "Admin@123!" },
  { id: "00000000-0000-0000-0000-000000000002", email: "warehouse@kasarisari.com", password: "Warehouse@123!" },
  { id: "00000000-0000-0000-0000-000000000003", email: "driver@kasarisari.com", password: "Driver@123!" },
  { id: "00000000-0000-0000-0000-000000000004", email: "retailer@kasarisari.com", password: "Retailer@123!" },
];

console.log("-- Run this SQL in your Supabase SQL Editor after running the seed migrations:\n");
for (const u of users) {
  const hash = hashSync(u.password, 12);
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE id = '${u.id}'; -- ${u.email}`);
}
console.log("\n-- Done. Each password above matches the email pattern (Role@123!)");
