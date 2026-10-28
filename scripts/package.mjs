// Builds an upload-ready bundle for PHP shared hosting (cPanel / Hostinger / LiteSpeed):
//   release/fsia-influencer-live/       → contents go into public_html
//   release/fsia-influencer-live.zip
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const releaseDir = path.join(root, "release");
const outDir = path.join(releaseDir, "fsia-influencer-live");
const zipPath = path.join(releaseDir, "fsia-influencer-live.zip");
const run = (cmd) => execSync(cmd, { stdio: "inherit", cwd: root });

run("npx tsx scripts/export-seed.ts");
run("npx vite build");
run("npx tsx scripts/prerender-seo.ts");

fs.rmSync(outDir, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });
fs.mkdirSync(outDir, { recursive: true });

// 1. Static frontend at the web root
fs.cpSync(path.join(root, "dist"), outDir, { recursive: true });

// 2. PHP API + private storage folder
const php = path.join(root, "php-backend");
fs.copyFileSync(path.join(php, ".htaccess"), path.join(outDir, ".htaccess"));
fs.cpSync(path.join(php, "api"), path.join(outDir, "api"), {
  recursive: true,
  filter: (src) => path.basename(src) !== "config.php"
});
// Uploaded photos live in /uploads on the server; ship only its .htaccess (blocks scripts)
fs.mkdirSync(path.join(outDir, "uploads"), { recursive: true });
fs.copyFileSync(path.join(php, "uploads", ".htaccess"), path.join(outDir, "uploads", ".htaccess"));
fs.cpSync(path.join(php, "storage"), path.join(outDir, "storage"), {
  recursive: true,
  filter: (src) => !/db\.(json|lock)|\.tmp$|corrupt/.test(path.basename(src))
});
// DEPLOY.md is deliberately not shipped: it would be publicly readable at /DEPLOY.md

// 3. Zip (contents at the archive root so it extracts straight into public_html)
const tryRun = (cmd, cwd) => {
  try {
    execSync(cmd, { stdio: "ignore", cwd });
    return true;
  } catch {
    return false;
  }
};
const zipped =
  tryRun(`zip -r -q -X "${zipPath}" .`, outDir) ||
  tryRun(`python3 -c "import shutil,sys; shutil.make_archive(sys.argv[1][:-4], 'zip', sys.argv[2])" "${zipPath}" "${outDir}"`, root) ||
  tryRun(`powershell -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}'"`, root);

console.log(`\nRelease folder: ${path.relative(root, outDir)}`);
console.log("Deployment steps: DEPLOY.md in the project (not included in the bundle).");
console.log(zipped ? `Release zip:    ${path.relative(root, zipPath)}` : "Could not create the zip automatically — zip the release folder manually.");
