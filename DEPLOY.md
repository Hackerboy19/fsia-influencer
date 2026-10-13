# Deploying FSIA Influencer to influencer.fsia.in

This bundle runs on any standard PHP host (cPanel, Hostinger, GoDaddy, LiteSpeed,
Apache). No Node.js, no MySQL and no build step is needed on the server.

## Requirements

- PHP 7.4 or newer (8.x recommended) with the `json` extension, plus `curl` for AI features
- Apache or LiteSpeed with `.htaccess` / `mod_rewrite` enabled (default on cPanel)
- HTTPS on the domain (free AutoSSL / Let's Encrypt in cPanel)

## First-time install

1. In cPanel → **File Manager**, open the folder for the subdomain
   `influencer.fsia.in` (usually `public_html/influencer` or `influencer.fsia.in/`).
2. Upload `fsia-influencer-live.zip` and **Extract** it there. You should see
   `index.html`, `assets/`, `api/`, `storage/` and `.htaccess` directly in that folder
   (enable *Show Hidden Files* to see `.htaccess`).
3. Make sure the `storage/` folder is writable by PHP (permissions `755`; use `775` only if your host requires it).
4. Open `https://influencer.fsia.in/api/health` — it should show `{"ok":true,...}`.
5. Open `https://influencer.fsia.in`, go to the **Admin** tab and sign in with
   **admin / admin123**. A yellow banner asks you to change this password — do it
   immediately in **Security & Data**.

## Updating to a new version

1. Admin → **Security & Data** → **Download backup** (always do this first).
2. Upload and extract the new zip over the existing files and allow overwrite.
   Your data lives in `storage/db.json`, which the zip never contains, so it is kept.
3. Hard-refresh the site (Ctrl + F5).

## Optional configuration

Copy `api/config.sample.php` to `api/config.php` and edit it to:

- move the database outside the web root (`storage_dir`)
- set a Gemini API key (it can also be entered in Admin → AI Config)
- choose the first admin username / password instead of admin / admin123
  (only applied when the database is first created)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Admin login works but every action says "Unauthorized" | Your host strips the `Authorization` header; the app already sends a fallback header, so make sure the bundled `.htaccess` was uploaded. |
| Pages other than the home page show 404 | `.htaccess` is missing or `mod_rewrite` is disabled. |
| "Storage directory is not writable" | Set `storage/` permissions to 755 (or 775). |
| Uploading a creator photo fails | Raise `post_max_size` / `upload_max_filesize` to at least 8M in cPanel → *Select PHP Version* → *Options*. |
| Want to start over | Delete `storage/db.json`; it is re-created with the starter content on the next visit. |

## Node.js hosting (alternative)

If you prefer a Node host (VPS, Render, Railway…): `npm install`, `npm run build`,
then `npm start` (listens on `$PORT`, default 3000). Set `ADMIN_USERNAME` /
`ADMIN_PASSWORD` and optionally `GEMINI_API_KEY` as environment variables. Data is
stored in `server/db.json`.
