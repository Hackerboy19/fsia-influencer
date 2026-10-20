<?php
/**
 * SEO resolution for the PHP backend: page defaults (seo-routes.json, generated
 * from src/seo.ts) + overrides from Admin → SEO → final <head> tags, crawlable
 * fallback content, sitemap.xml and robots.txt.
 * Keep the rules in sync with src/seo.ts.
 */

function seo_defs(): array
{
    static $defs = null;
    if ($defs === null) {
        $defs = json_decode((string)@file_get_contents(dirname(__DIR__) . '/seo-routes.json'), true);
        if (!is_array($defs)) {
            throw new RuntimeException('SEO page defaults (api/seo-routes.json) are missing.');
        }
    }
    return $defs;
}

function seo_clean($value): string
{
    return is_string($value) ? trim($value) : '';
}

function seo_esc(string $value): string
{
    return htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
}

function seo_len(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

function seo_sub(string $s, int $start, int $len): string
{
    return function_exists('mb_substr') ? mb_substr($s, $start, $len, 'UTF-8') : substr($s, $start, $len);
}

function seo_truncate(string $text, int $max): string
{
    $t = trim(preg_replace('/\s+/u', ' ', $text));
    if (seo_len($t) <= $max) {
        return $t;
    }
    $cut = seo_sub($t, 0, $max - 1);
    $space = function_exists('mb_strrpos') ? mb_strrpos($cut, ' ', 0, 'UTF-8') : strrpos($cut, ' ');
    if ($space !== false && $space > $max * 0.6) {
        $cut = seo_sub($cut, 0, $space);
    }
    return preg_replace('/[\s,.;:—-]+$/u', '', $cut) . '…';
}

function seo_is_url($value): bool
{
    return (bool)preg_match('#^https?://#i', seo_clean($value));
}

function seo_slugify(string $value): string
{
    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($value)), '-');
    return substr($slug, 0, 80);
}

function seo_config(array $db): array
{
    $seo = is_array($db['seo'] ?? null) ? $db['seo'] : [];
    return [
        'site' => is_array($seo['site'] ?? null) ? $seo['site'] : [],
        'pages' => is_array($seo['pages'] ?? null) ? $seo['pages'] : [],
    ];
}

function seo_site_name(array $seo): string
{
    return seo_clean($seo['site']['siteName'] ?? '') ?: seo_defs()['siteName'];
}

function seo_default_image(array $seo): string
{
    $img = seo_clean($seo['site']['defaultImage'] ?? '');
    return seo_is_url($img) ? $img : seo_defs()['ogImage'];
}

function seo_site_indexable(array $seo): bool
{
    return ($seo['site']['allowIndexing'] ?? true) !== false;
}

function seo_normalise_path(string $path): string
{
    $trimmed = trim(preg_replace('#index\.html$#', '', $path), '/');
    return $trimmed === '' ? '/' : '/' . $trimmed . '/';
}

function seo_route_for_path(string $path): ?array
{
    foreach (seo_defs()['routes'] as $route) {
        if ($route['path'] === $path) {
            return $route;
        }
    }
    return null;
}

function seo_route_for_tab(string $tab): array
{
    foreach (seo_defs()['routes'] as $route) {
        if ($route['tab'] === $tab) {
            return $route;
        }
    }
    return seo_defs()['routes'][0];
}

/** Same algorithm as assignProfileSlugs() in src/seo.ts */
function seo_assign_slugs(array $sections): array
{
    $used = [];
    $entries = [];
    foreach ($sections as $section) {
        foreach ($section['creators'] ?? [] as $creator) {
            $base = seo_slugify(seo_clean($creator['seo']['slug'] ?? '')) ?: (seo_slugify(seo_clean($creator['name'] ?? '')) ?: 'creator');
            $slug = $base;
            if (isset($used[$slug])) {
                $slug = $base . '-' . seo_slugify((string)$section['id']);
            }
            for ($n = 2; isset($used[$slug]); $n++) {
                $slug = $base . '-' . $n;
            }
            $used[$slug] = true;
            $entries[] = ['slug' => $slug, 'path' => seo_defs()['profilePrefix'] . $slug . '/', 'section' => $section, 'creator' => $creator];
        }
    }
    return $entries;
}

function seo_base_graph(array $seo, string $canonical, string $title, string $description): array
{
    $site = seo_defs()['siteUrl'];
    return [
        '@context' => 'https://schema.org',
        '@graph' => [
            ['@type' => 'Organization', '@id' => "$site/#organization", 'name' => seo_site_name($seo), 'url' => "$site/", 'logo' => "$site/logo.png"],
            ['@type' => 'WebSite', '@id' => "$site/#website", 'name' => seo_site_name($seo), 'url' => "$site/", 'inLanguage' => 'en-IN', 'publisher' => ['@id' => "$site/#organization"]],
            ['@type' => 'WebPage', '@id' => "$canonical#webpage", 'url' => $canonical, 'name' => $title, 'description' => $description, 'isPartOf' => ['@id' => "$site/#website"]],
        ],
    ];
}

function seo_nav_links(): string
{
    $links = [];
    foreach (seo_defs()['routes'] as $r) {
        if ($r['indexable']) {
            $links[] = '<a href="' . $r['path'] . '">' . seo_esc($r['heading']) . '</a>';
        }
    }
    return implode(' · ', $links);
}

function seo_page_meta(array $route, array $seo, array $profiles): array
{
    $o = is_array($seo['pages'][$route['path']] ?? null) ? $seo['pages'][$route['path']] : [];
    $canonical = seo_defs()['siteUrl'] . $route['path'];
    $title = seo_clean($o['title'] ?? '') ?: $route['title'];
    $description = seo_clean($o['description'] ?? '') ?: $route['description'];
    $image = seo_is_url($o['image'] ?? '') ? seo_clean($o['image']) : seo_default_image($seo);
    $jsonLd = [seo_base_graph($seo, $canonical, $title, $description)];
    $extra = '';
    if ($route['tab'] === 'faq') {
        $qs = [];
        foreach (seo_defs()['faqs'] as $f) {
            $qs[] = ['@type' => 'Question', 'name' => $f['question'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['answer']]];
            $extra .= '<h2>' . seo_esc($f['question']) . '</h2><p>' . seo_esc($f['answer']) . '</p>';
        }
        $jsonLd[] = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $qs];
    }
    if ($route['tab'] === 'directory') {
        $items = '';
        foreach ($profiles as $p) {
            if (!empty($p['creator']['seo']['noindex'])) {
                continue;
            }
            $role = seo_clean($p['creator']['role'] ?? '');
            $items .= '<li><a href="' . $p['path'] . '">' . seo_esc(seo_clean($p['creator']['name'] ?? '')) . '</a>' . ($role !== '' ? ' — ' . seo_esc($role) : '') . '</li>';
        }
        if ($items !== '') {
            $extra = "<ul>$items</ul>";
        }
    }
    return [
        'path' => $route['path'],
        'canonical' => $canonical,
        'title' => $title,
        'description' => $description,
        'image' => $image,
        'indexable' => seo_site_indexable($seo) && $route['indexable'] && empty($o['noindex']),
        'jsonLd' => $jsonLd,
        'bodyHtml' => '<main class="seo-fallback"><h1>' . seo_esc($route['heading']) . '</h1><p>' . seo_esc($description) . '</p>' . $extra . '<nav aria-label="Site">' . seo_nav_links() . '</nav></main>',
    ];
}

function seo_default_profile_title(array $entry, array $seo): string
{
    // First option that fits Google's ~60 characters (same order as src/seo.ts)
    $name = seo_clean($entry['creator']['name'] ?? '');
    $role = seo_clean($entry['creator']['role'] ?? '');
    $short = trim(explode(',', $role)[0]);
    $site = seo_site_name($seo);
    $options = array_values(array_filter([
        $role !== '' ? "$name — $role | $site" : '',
        $role !== '' ? "$name — $role" : '',
        $short !== '' ? "$name — $short | $site" : '',
        "$name | $site",
    ], 'strlen'));
    foreach ($options as $option) {
        if (seo_len($option) <= 60) {
            return $option;
        }
    }
    return seo_truncate($options[count($options) - 1], 60);
}

function seo_default_profile_description(array $entry): string
{
    $c = $entry['creator'];
    $lead = implode(', ', array_filter([seo_clean($c['role'] ?? ''), seo_clean($c['city'] ?? '')], 'strlen'));
    $text = seo_clean($c['bio'] ?? '') ?: seo_clean($c['name'] ?? '') . ' is a verified creator in ' . $entry['section']['title'] . '.';
    return seo_truncate($lead !== '' ? "$lead. $text" : $text, 160);
}

/** Public link to a creator's photo; uploaded photos are served by the API at /api/media/profile/<slug>.jpg */
function seo_profile_photo_url(array $entry): string
{
    $photo = seo_clean($entry['creator']['image'] ?? '');
    if (seo_is_url($photo)) {
        return $photo;
    }
    if (preg_match('#^data:image/(jpeg|png|webp);base64,#i', $photo)) {
        return seo_defs()['siteUrl'] . '/api/media/profile/' . $entry['slug'] . '.jpg?v=' . strlen($photo);
    }
    return '';
}

/**
 * Decode an image sent as a data: URL. Returns ['bytes', 'mime', 'ext', 'width', 'height'] or an error string.
 */
function seo_decode_image(string $dataUrl, int $maxBytes = 5242880)
{
    if (!preg_match('#^data:image/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$#', $dataUrl, $m)) {
        return 'Please choose a JPG, PNG or WebP image.';
    }
    $bytes = base64_decode(preg_replace('/\s+/', '', $m[2]), true);
    if ($bytes === false || $bytes === '') {
        return 'The image could not be read. Please try another file.';
    }
    if (strlen($bytes) > $maxBytes) {
        return 'The image is too large. Please use one under 5 MB.';
    }
    if (strncmp($bytes, "\xFF\xD8\xFF", 3) === 0) {
        $mime = 'image/jpeg'; $ext = 'jpg';
    } elseif (strncmp($bytes, "\x89PNG", 4) === 0) {
        $mime = 'image/png'; $ext = 'png';
    } elseif (substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP') {
        $mime = 'image/webp'; $ext = 'webp';
    } else {
        return 'Please choose a JPG, PNG or WebP image.';
    }
    $size = @getimagesizefromstring($bytes);
    return ['bytes' => $bytes, 'mime' => $mime, 'ext' => $ext, 'width' => $size ? (int)$size[0] : 0, 'height' => $size ? (int)$size[1] : 0];
}

function seo_profile_meta(array $entry, array $seo): array
{
    $c = $entry['creator'];
    $canonical = seo_defs()['siteUrl'] . $entry['path'];
    $title = seo_clean($c['seo']['title'] ?? '') ?: seo_default_profile_title($entry, $seo);
    $description = seo_clean($c['seo']['description'] ?? '') ?: seo_default_profile_description($entry);
    $photo = seo_profile_photo_url($entry);
    $image = $photo !== '' ? $photo : seo_default_image($seo);
    $person = ['@type' => 'Person', 'name' => seo_clean($c['name'] ?? ''), 'url' => $canonical, 'description' => seo_clean($c['bio'] ?? '') ?: $description];
    if (seo_clean($c['role'] ?? '') !== '') {
        $person['jobTitle'] = seo_clean($c['role']);
    }
    if ($photo !== '') {
        $person['image'] = $photo;
    }
    if (seo_clean($c['city'] ?? '') !== '') {
        $person['address'] = ['@type' => 'PostalAddress', 'addressLocality' => seo_clean($c['city']), 'addressCountry' => 'IN'];
    }
    $graph = seo_base_graph($seo, $canonical, $title, $description);
    $graph['@graph'][] = ['@type' => 'ProfilePage', '@id' => "$canonical#profile", 'url' => $canonical, 'mainEntity' => $person];
    $sub = implode(' · ', array_filter([seo_clean($c['role'] ?? ''), seo_clean($c['city'] ?? ''), (string)$entry['section']['title']], 'strlen'));
    return [
        'path' => $entry['path'],
        'canonical' => $canonical,
        'title' => $title,
        'description' => $description,
        'image' => $image,
        'indexable' => seo_site_indexable($seo) && empty($c['seo']['noindex']),
        'jsonLd' => [$graph],
        'bodyHtml' => '<main class="seo-fallback"><h1>' . seo_esc(seo_clean($c['name'] ?? '')) . '</h1><p>' . seo_esc($sub) . '</p><p>'
            . seo_esc(seo_clean($c['bio'] ?? '') ?: $description) . '</p><p><a href="' . seo_defs()['profilePrefix'] . '">Browse all creators</a></p><nav aria-label="Site">' . seo_nav_links() . '</nav></main>',
    ];
}

function seo_not_found_meta(string $path, array $seo): array
{
    $home = seo_page_meta(seo_defs()['routes'][0], $seo, []);
    return array_merge($home, [
        'path' => $path,
        'title' => 'Page not found | ' . seo_site_name($seo),
        'indexable' => false,
        'bodyHtml' => '<main class="seo-fallback"><h1>Page not found</h1><p>This page does not exist.</p><nav aria-label="Site">' . seo_nav_links() . '</nav></main>',
    ]);
}

function seo_render_head(array $meta, array $seo): string
{
    $t = seo_esc($meta['title']);
    $d = seo_esc($meta['description']);
    $gsc = preg_replace('/[^A-Za-z0-9_\-]/', '', seo_clean($seo['site']['googleVerification'] ?? ''));
    $prefix = seo_defs()['profilePrefix'];
    $isProfile = strpos($meta['path'], $prefix) === 0 && $meta['path'] !== $prefix;
    $tags = [
        "<title>$t</title>",
        "<meta name=\"description\" content=\"$d\" />",
        '<meta name="robots" content="' . ($meta['indexable'] ? 'index, follow, max-image-preview:large' : 'noindex, nofollow') . '" />',
        '<link rel="canonical" href="' . seo_esc($meta['canonical']) . '" />',
    ];
    if ($gsc !== '') {
        $tags[] = "<meta name=\"google-site-verification\" content=\"$gsc\" />";
    }
    $tags[] = '<meta property="og:type" content="' . ($isProfile ? 'profile' : 'website') . '" />';
    $tags[] = '<meta property="og:site_name" content="' . seo_esc(seo_site_name($seo)) . '" />';
    $tags[] = '<meta property="og:locale" content="en_IN" />';
    $tags[] = "<meta property=\"og:title\" content=\"$t\" />";
    $tags[] = "<meta property=\"og:description\" content=\"$d\" />";
    $tags[] = '<meta property="og:url" content="' . seo_esc($meta['canonical']) . '" />';
    $tags[] = '<meta property="og:image" content="' . seo_esc($meta['image']) . '" />';
    if ($meta['image'] === seo_defs()['ogImage']) {
        $tags[] = '<meta property="og:image:width" content="1200" />';
        $tags[] = '<meta property="og:image:height" content="630" />';
    }
    $tags[] = "<meta property=\"og:image:alt\" content=\"$t\" />";
    $tags[] = '<meta name="twitter:card" content="summary_large_image" />';
    $tags[] = "<meta name=\"twitter:title\" content=\"$t\" />";
    $tags[] = "<meta name=\"twitter:description\" content=\"$d\" />";
    $tags[] = '<meta name="twitter:image" content="' . seo_esc($meta['image']) . '" />';
    foreach ($meta['jsonLd'] as $block) {
        $json = json_encode($block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $tags[] = '<script type="application/ld+json">' . str_replace('<', '\\u003c', $json) . '</script>';
    }
    return implode("\n    ", $tags);
}

function seo_render_sitemap(array $seo, array $profiles, string $lastmod): string
{
    $head = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    if (!seo_site_indexable($seo)) {
        return $head . "</urlset>\n";
    }
    $site = seo_defs()['siteUrl'];
    $rows = [];
    foreach (seo_defs()['routes'] as $r) {
        if (!$r['indexable'] || !empty($seo['pages'][$r['path']]['noindex'])) {
            continue;
        }
        $rows[] = "  <url>\n    <loc>$site{$r['path']}</loc>\n    <lastmod>$lastmod</lastmod>\n    <changefreq>{$r['changefreq']}</changefreq>\n    <priority>{$r['priority']}</priority>\n  </url>";
    }
    foreach ($profiles as $p) {
        if (!empty($p['creator']['seo']['noindex'])) {
            continue;
        }
        $rows[] = "  <url>\n    <loc>$site{$p['path']}</loc>\n    <lastmod>$lastmod</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>";
    }
    return $head . implode("\n", $rows) . "\n</urlset>\n";
}

function seo_render_robots(array $seo): string
{
    if (!seo_site_indexable($seo)) {
        return "User-agent: *\nDisallow: /\n";
    }
    return "User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: " . seo_defs()['siteUrl'] . "/sitemap.xml\n";
}

/**
 * Validate and store settings from Admin → SEO. Returns an error message, or null on success.
 */
function seo_apply_update(array &$db, array $body): ?string
{
    $site = is_array($body['site'] ?? null) ? $body['site'] : [];
    $gsc = seo_clean($site['googleVerification'] ?? '');
    // Accept the whole <meta …> tag Google shows, or just its code
    if (preg_match('/content\s*=\s*["\']([^"\']+)["\']/i', $gsc, $m)) {
        $gsc = $m[1];
    }
    $gsc = preg_replace('/[^A-Za-z0-9_\-]/', '', $gsc);
    $defaultImage = seo_clean($site['defaultImage'] ?? '');
    if ($defaultImage !== '' && !seo_is_url($defaultImage)) {
        return 'The default share image must be a full link starting with https://';
    }
    $cleanSite = [
        'siteName' => str_cut(seo_clean($site['siteName'] ?? ''), 80),
        'defaultImage' => str_cut($defaultImage, 500),
        'googleVerification' => str_cut($gsc, 120),
        'allowIndexing' => ($site['allowIndexing'] ?? true) !== false,
    ];

    $cleanPages = [];
    foreach (is_array($body['pages'] ?? null) ? $body['pages'] : [] as $path => $page) {
        if (!is_array($page) || seo_route_for_path((string)$path) === null) {
            continue;
        }
        $image = seo_clean($page['image'] ?? '');
        if ($image !== '' && !seo_is_url($image)) {
            return 'Share image for ' . $path . ' must be a full link starting with https://';
        }
        $entry = array_filter([
            'title' => str_cut(seo_clean($page['title'] ?? ''), 120),
            'description' => str_cut(seo_clean($page['description'] ?? ''), 320),
            'image' => str_cut($image, 500),
        ], 'strlen');
        if (!empty($page['noindex'])) {
            $entry['noindex'] = true;
        }
        if ($entry) {
            $cleanPages[$path] = $entry;
        }
    }

    $creators = $db['creators'];
    foreach (is_array($body['profiles'] ?? null) ? $body['profiles'] : [] as $profile) {
        if (!is_array($profile)) {
            continue;
        }
        foreach ($creators as $si => $section) {
            if ($section['id'] !== ($profile['sectionId'] ?? null)) {
                continue;
            }
            foreach ($section['creators'] as $ci => $creator) {
                if ($creator['name'] !== ($profile['name'] ?? null)) {
                    continue;
                }
                $in = is_array($profile['seo'] ?? null) ? $profile['seo'] : [];
                $seo = array_filter([
                    'slug' => seo_slugify(seo_clean($in['slug'] ?? '')),
                    'title' => str_cut(seo_clean($in['title'] ?? ''), 120),
                    'description' => str_cut(seo_clean($in['description'] ?? ''), 320),
                ], 'strlen');
                if (!empty($in['noindex'])) {
                    $seo['noindex'] = true;
                }
                if ($seo) {
                    $creators[$si]['creators'][$ci]['seo'] = $seo;
                } else {
                    unset($creators[$si]['creators'][$ci]['seo']);
                }
            }
        }
    }

    // Custom profile URLs must be unique
    foreach (seo_assign_slugs($creators) as $entry) {
        $wanted = $entry['creator']['seo']['slug'] ?? '';
        if ($wanted !== '' && $entry['slug'] !== $wanted) {
            return 'The profile URL "' . $wanted . '" is already used by another creator. Please choose a different one for ' . $entry['creator']['name'] . '.';
        }
    }

    $db['creators'] = $creators;
    $db['seo'] = ['site' => $cleanSite, 'pages' => $cleanPages];
    return null;
}
