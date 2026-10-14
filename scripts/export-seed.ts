import crypto from "crypto";
// Writes the default database used by the PHP backend on first run.
import fs from "fs";
import path from "path";
import { createDefaultDb } from "../server/db";

const seed = createDefaultDb();
// Never ship a key from the build machine's environment, or a custom admin password
seed.system_settings.geminiApiKey = "";
seed.admin_users = [
  // Legacy SHA-256 of "admin123"; upgraded to bcrypt on first login and flagged for change
  { username: "admin", passwordHash: crypto.createHash("sha256").update("admin123").digest("hex") }
];
seed.admin_logs = [];

const out = path.join(process.cwd(), "php-backend", "api", "seed.json");
fs.writeFileSync(out, JSON.stringify(seed, null, 2) + "\n", "utf8");
console.log(`Seed written to ${path.relative(process.cwd(), out)}`);
