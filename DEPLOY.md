# Deploying FSIA Influencer to influencer.fsia.in

This bundle runs on any standard PHP host (cPanel, Hostinger, GoDaddy, LiteSpeed,
Apache). No Node.js, no MySQL and no build step is needed on the server.

## Requirements

- PHP 7.4 or newer (8.x recommended) with the `json` extension, plus `curl` for AI features
- Apache or LiteSpeed with `.htaccess` / `mod_rewrite` enabled (default on cPanel)
- HTTPS on the domain (free AutoSSL / Let's Encrypt in cPanel)

## First-time install

The fsia.in hosting runs **Plesk** (cPanel steps are listed after).

### 0. Create the subdomain (required: `influencer.fsia.in` has no DNS record until you do)

Plesk → **Websites & Domains** → **Add Subdomain** → name `influencer`, parent `fsia.in`,
document root `influencer.fsia.in`. Because fsia.in uses the hosting company's
nameservers, Plesk creates the DNS record for you; it can take up to an hour to work everywhere.

Then on the new subdomain: **SSL/TLS Certificates** → **Let's Encrypt** → issue a free
certificate (the site redirects every visitor to HTTPS). In **Hosting & DNS → Apache & nginx
Settings**, keep the default "nginx as proxy to Apache" so `.htaccess` is honoured
(do *not* enable "Serve static files directly by nginx" only / "proxy mode off").

### 1. Upload

1. Plesk → **Files** → open the subdomain's folder (`influencer.fsia.in/`).
   Delete the placeholder `index.html` Plesk created there.
2. Upload `fsia-influencer-live.zip`, then select it and click **Extract Files**.
   You should see `index.html`, `assets/`, `api/`, `storage/` and `.htaccess`
   directly in that folder, not inside an extra sub-folder.
3. Make sure the `storage/` folder is writable by PHP (Plesk: right-click → *Change Permissions*, owner write).
4. In **PHP Settings** for the subdomain choose PHP 8.x.

*cPanel instead:* **Domains → Create a New Domain** `influencer.fsia.in`, then
**File Manager** → its folder → Upload → Extract, and **SSL/TLS Status → Run AutoSSL**.

### 2. Check it

1. Open `https://influencer.fsia.in/api/health` — it should show `{"ok":true,...}`.
2. Open `https://influencer.fsia.in`, go to the **Admin** tab (lock icon) and sign in with
   **admin / admin123**. A yellow banner asks you to change this password — do it
   immediately in **Security & Data**.

## Updating to a new version

1. Admin → **Security & Data** → **Download backup** (always do this first).
2. Upload and extract the new zip over the existing files and allow overwrite.
   Your data lives in `storage/db.json`, which the zip never contains, so it is kept.
3. Hard-refresh the site (Ctrl + F5).

## Google Search Console (indexing)

The bundle already contains everything Google needs: a title, description, canonical URL,
Open Graph/Twitter tags and structured data (WebSite, Organization, FAQPage) on every page,
plus `/robots.txt` and `/sitemap.xml`. Each section has its own URL:
`/`, `/talent/`, `/campaigns/`, `/join/`, `/membership/`, `/faq/`.

1. **Add the property.** In [Search Console](https://search.google.com/search-console):
   - *Domain property* `fsia.in` covers every subdomain, but needs a DNS TXT record at your
     DNS host (cloudhostdns), or
   - *URL-prefix property* `https://influencer.fsia.in/`, verified by one of the methods below.
2. **Verify (URL-prefix):** pick one
   - **HTML file (easiest on Plesk):** download Google's `googleXXXX.html` file and upload it
     into the `influencer.fsia.in` folder next to `index.html`. It is served as-is.
   - **HTML tag:** open `index.html` in Plesk File Manager and replace the line
     `<!--GSC-VERIFICATION-->` with Google's `<meta name="google-site-verification" …>` tag.
     Redo this after uploading a new version, or build with
     `GSC_VERIFICATION=<token> npm run package` so it is included automatically.
   - **DNS TXT:** add the TXT record Google shows you at your DNS provider.
3. **Submit the sitemap:** Search Console → *Sitemaps* → enter `sitemap.xml` → *Submit*.
4. **Request indexing:** paste `https://influencer.fsia.in/` into the URL Inspection bar →
   *Test live URL* → when it shows as available, click *Request indexing*. Repeat for
   `/talent/`, `/campaigns/` and `/join/` if you want them crawled sooner.

Check any time: `https://influencer.fsia.in/robots.txt` and `https://influencer.fsia.in/sitemap.xml`.

## Optional configuration

Copy `api/config.sample.php` to `api/config.php` and edit it to:

- move the database outside the web root (`storage_dir`)
- set a Gemini API key (it can also be entered in Admin → AI Config)
- choose the first admin username / password instead of admin / admin123
  (only applied when the database is first created)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Browser says "site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN | The subdomain doesn't exist yet: do step 0, then wait for DNS. |
| Plesk "default page" or old site still shows | The files were extracted into the wrong folder or into a sub-folder; `index.html` must sit directly in the subdomain's document root. Clear the browser cache. |
| Blank white page | Open the browser console: if `assets/…` files return 404, the `assets/` folder was not uploaded next to `index.html`. |
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
