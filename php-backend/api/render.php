<?php
/**
 * Serves every HTML page (and robots.txt / sitemap.xml) with search-engine tags
 * filled in from Admin → SEO, so changes there are visible to Google at once.
 */

declare(strict_types=1);

require __DIR__ . '/lib/helpers.php';
require __DIR__ . '/lib/Store.php';
require __DIR__ . '/lib/seo.php';

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

try {
    $store = new Store(fsia_config()['storage_dir'], __DIR__ . '/seed.json');
    $db = $store->data();
    $seo = seo_config($db);
    $profiles = seo_assign_slugs($db['creators']);

    if ($path === '/robots.txt') {
        header('Content-Type: text/plain; charset=UTF-8');
        header('Cache-Control: public, max-age=300');
        echo seo_render_robots($seo);
        exit;
    }
    if ($path === '/sitemap.xml') {
        header('Content-Type: application/xml; charset=UTF-8');
        header('Cache-Control: public, max-age=300');
        echo seo_render_sitemap($seo, $profiles, date('Y-m-d'));
        exit;
    }

    $template = @file_get_contents(__DIR__ . '/template.html');
    if ($template === false) {
        throw new RuntimeException('Page template (api/template.html) is missing.');
    }

    $normal = seo_normalise_path($path);
    $status = 200;
    $meta = null;
    if (preg_match('#^/talent/([a-z0-9-]+)/$#', $normal, $m)) {
        foreach ($profiles as $entry) {
            if ($entry['slug'] === $m[1]) {
                $meta = seo_profile_meta($entry, $seo);
            }
        }
    } elseif (($route = seo_route_for_path($normal)) !== null) {
        $meta = seo_page_meta($route, $seo, $profiles);
    }
    if ($meta === null) {
        $status = 404;
        $meta = seo_not_found_meta($normal, $seo);
    }

    $html = preg_replace('/<!--SEO-HEAD-->[\s\S]*?<!--\/SEO-HEAD-->/', str_replace(['\\', '$'], ['\\\\', '\\$'], seo_render_head($meta, $seo)), $template, 1);
    $html = str_replace('<!--SEO-BODY-->', $meta['bodyHtml'], $html);

    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache');
    header('X-Content-Type-Options: nosniff');
    echo $html;
} catch (Throwable $e) {
    error_log('FSIA render error: ' . $e->getMessage());
    // Fall back to the plain app shell so the site keeps working
    $fallback = @file_get_contents(__DIR__ . '/template.html');
    http_response_code($fallback === false ? 500 : 200);
    header('Content-Type: text/html; charset=UTF-8');
    echo $fallback === false ? 'The site is temporarily unavailable.' : str_replace('<!--SEO-BODY-->', '', $fallback);
}
