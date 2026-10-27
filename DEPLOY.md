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
2. Open **`https://influencer.fsia.in/admin/`** (there is no admin button on the public site; bookmark it) and sign in with
   **admin / admin123**. The panel stays locked (the server refuses every admin action)
   until you set a new password in **Security & Data**: this default is public knowledge.

## Updating to a new version

1. Admin → **Security & Data** → **Download backup** (always do this first).
2. Upload and extract the new zip over the existing files and allow overwrite.
   Your data lives in `storage/db.json`, which the zip never contains, so it is kept.
3. Hard-refresh the site (Ctrl + F5).
4. Check the release (read-only, safe to run against the live site) from a computer with the
   project checked out: `npm run audit -- https://influencer.fsia.in`. It checks every page's status
   code, metadata, sitemap, 404 handling, retired branding and WCAG 2.2 AA accessibility, and
   prints anything that fails.

## Security checklist (after every upload)

1. **Delete `DEPLOY.md` from the server** if it is there (Plesk → Files → `influencer.fsia.in`).
   Older bundles shipped it, and extracting a new zip never deletes old files. The current
   bundle no longer contains it and `.htaccess` blocks `.md` files, but remove the old copy anyway.
2. **Admin password:** sign in. If the panel asks you to change the default password, do it now.
3. **Security headers on every page.** Plesk serves the HTML pages through nginx, so add these in
   Plesk → *Websites & Domains* → `influencer.fsia.in` → **Apache & nginx Settings** →
   *Additional nginx directives*, then **OK**:

   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   add_header Strict-Transport-Security "max-age=15552000" always;
   add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
   ```

4. **Real visitor IPs.** Admin → Security & Data → audit log: login entries should show visitors'
   IP addresses. If they all show `127.0.0.1` or the server's own IP, the login lock-out and the
   form spam limit treat every visitor as one; ask the host to enable the real-IP setting
   (`mod_remoteip`) for nginx → Apache.
5. **Optional, strongest:** keep the database outside the website folder. Create
   `api/config.php` from `api/config.sample.php` with
   `'storage_dir' => '/var/www/vhosts/fsia.in/private/influencer-storage'` (a folder outside
   `influencer.fsia.in/`), move `storage/db.json` there, and check the site still loads.

**Built-in protections** (no action needed): admin sessions are random tokens that expire
(12 h idle, 7 days at most); 8 failed logins lock an IP for 15 minutes; each visitor can send
12 form submissions per 10 minutes; photos are capped at 700 KB; and if `db.json` ever passes
25 MB the forms pause, without breaking the site, until old leads are cleaned up.

## Google Search Console (indexing)

The bundle already contains everything Google needs: a title, description, canonical URL,
Open Graph/Twitter tags and structured data (WebSite, Organization, FAQPage) on every page,
plus `/robots.txt` and `/sitemap.xml`. Each section has its own URL:
`/`, `/gallery/`, `/talent/`, `/campaigns/`, `/join/`, `/membership/`, `/star-india/`, `/green-light/`, `/faq/`, `/contact/`.

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

5. **After each release:** Search Console → *Pages* (Indexing) shows why any URL is not indexed.
   Mistyped or retired URLs now return a real **404 Not Found** page instead of the home page,
   so they drop out of the index instead of being reported as *Soft 404*. Use *Validate fix* on
   any older *Soft 404* or *Duplicate without user-selected canonical* entries.
6. Indexing is decided by Google and can take days to weeks; Search Console's URL Inspection
   (*URL is on Google*) is the only reliable confirmation for a given page.

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
| Section pages (`/talent/`, `/faq/` …) show "Page not found" | Their folders (`gallery/`, `talent/`, `campaigns/`, `join/`, `membership/`, `star-india/`, `green-light/`, `faq/`, `contact/`, `admin/`) were not uploaded next to `index.html`. |
| A mistyped address shows "Page not found" | Intended: unknown URLs return a real 404 status (`404.html`) so search engines never index them as duplicates of the home page. |
| A Plesk-branded "404 Not Found" page appears instead of the site's own | Harmless (the status is still 404). To show the site's page, untick *Custom error documents* in the subdomain's **Hosting Settings**. |
| API calls return 404 / the admin panel cannot load data | `.htaccess` is missing or `mod_rewrite` is disabled (it routes `/api/…` to `api/index.php`). |
| "Storage directory is not writable" | Set `storage/` permissions to 755 (or 775). |
| Uploading a creator photo fails | Raise `post_max_size` / `upload_max_filesize` to at least 8M in cPanel → *Select PHP Version* → *Options*. |
| Want to start over | Delete `storage/db.json`; it is re-created with the starter content on the next visit. |

## Node.js hosting (alternative)

If you prefer a Node host (VPS, Render, Railway…): `npm install`, `npm run build`,
then `npm start` (listens on `$PORT`, default 3000). Behind the platform's proxy, set
`TRUST_PROXY=1` so visitors' real IPs are used for the login and form limits. Set `ADMIN_USERNAME` /
`ADMIN_PASSWORD` and optionally `GEMINI_API_KEY` as environment variables. Data is
stored in `server/db.json`.
