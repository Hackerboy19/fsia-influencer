<?php
/**
 * Serves a prerendered page (talent/index.html …) with the admin's SEO and share-card
 * values from Admin → Pages & SEO, and a creator's own card on /creators/?profile=slug,
 * so search engines and link previews see them without JavaScript.
 * Same rules as server/pageMeta.ts (Node). If anything fails, the page is sent unchanged.
 */

declare(strict_types=1);

const SITE_URL = 'https://influencer.fsia.in';
const DEFAULT_OG = SITE_URL . '/og-image.png';

$root = dirname(__DIR__);
$p = (string)($_GET['p'] ?? '/');
if (!preg_match('#^/[a-z0-9\-/]*$#i', $p) || strpos($p, '..') !== false) {
    $p = '/';
}
if (substr($p, -1) !== '/') {
    $p .= '/';
}
$file = $root . $p . 'index.html';
$real = realpath($file);
if ($real === false || strpos($real, realpath($root)) !== 0) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Robots-Tag: noindex');
    readfile($root . '/404.html');
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');
header_remove('X-Powered-By');

$html = (string)file_get_contents($real);

try {
    require __DIR__ . '/lib/helpers.php';
    $dbFile = rtrim(fsia_config()['storage_dir'], '/') . '/db.json';
    $db = is_file($dbFile) ? json_decode((string)file_get_contents($dbFile), true) : null;
    if (is_array($db)) {
        $settings = debrand_value($db['system_settings'] ?? []);
        $meta = page_meta($p, (string)($_GET['profile'] ?? ''), is_array($settings) ? $settings : [], $db['creators'] ?? []);
        if ($meta) {
            $html = inject_meta($html, $meta);
        }
    }
} catch (Throwable $e) {
    error_log('FSIA page meta: ' . $e->getMessage());
}

echo $html;
exit;

function clip_text($v, int $n): string
{
    if (!is_string($v)) {
        return '';
    }
    $v = trim((string)preg_replace('/\s+/u', ' ', $v));
    return function_exists('mb_substr') ? mb_substr($v, 0, $n) : substr($v, 0, $n);
}

function js_slug(string $name): string
{
    $s = function_exists('mb_strtolower') ? mb_strtolower($name) : strtolower($name);
    if (function_exists('iconv')) {
        $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        if ($t !== false) {
            $s = $t;
        }
    }
    $s = (string)preg_replace('/[^a-z0-9]+/', '-', strtolower($s));
    return trim($s, '-');
}

function page_meta(string $path, string $slug, array $settings, $sections): ?array
{
    $limits = ['title' => 120, 'description' => 320, 'heading' => 140, 'intro' => 600, 'ogTitle' => 120, 'ogDescription' => 320, 'ogImage' => 2000];
    $page = [];
    $raw = $settings['pages'][$path] ?? null;
    if (is_array($raw)) {
        foreach ($limits as $k => $n) {
            $v = clip_text($raw[$k] ?? '', $n);
            if ($v !== '') {
                $page[$k] = $v;
            }
        }
        if (isset($page['ogImage']) && !preg_match('#^(https?://|/)#i', $page['ogImage'])) {
            unset($page['ogImage']);
        }
        $kw = clip_text($raw['keywords'] ?? '', 300);
        if ($kw !== '') {
            $page['keywords'] = $kw;
        }
        $schema = clean_schema($raw['schema'] ?? '');
        if ($schema !== '') {
            $page['schema'] = $schema;
        }
        if (($raw['noindex'] ?? false) === true || ($raw['hidden'] ?? false) === true) {
            $page['noindex'] = true;
        }
    }
    // Admin → Page content: built-in text/image => replacement, for this page and every page
    foreach (['t' => 'texts', 'i' => 'images'] as $k => $name) {
        // This page's own changes win over the every-page ones (+ keeps numeric-looking keys)
        $pairs = content_pairs($settings['content'][$path][$k] ?? null, $k) + content_pairs($settings['content']['*'][$k] ?? null, $k);
        if ($pairs) {
            $page[$name] = $pairs;
        }
    }
    $slug = substr($slug, 0, 120);
    if ($path === '/creators/' && $slug !== '' && is_array($sections)) {
        foreach ($sections as $section) {
            foreach (($section['creators'] ?? []) as $c) {
                if (!empty($c['name']) && js_slug((string)$c['name']) === $slug) {
                    $role = clip_text($c['role'] ?? '', 80);
                    $city = clip_text($c['city'] ?? '', 60);
                    $title = clip_text($c['name'], 80) . ($role !== '' ? ", $role" : '') . ($city !== '' ? " ($city)" : '');
                    $bio = clip_text($c['bio'] ?? '', 200);
                    $img = is_string($c['image'] ?? null) && preg_match('#^(https?://|/)#i', $c['image']) ? $c['image'] : ($page['ogImage'] ?? '');
                    return [
                        'title' => $title,
                        'description' => $bio !== '' ? $bio : "$title. See the profile and send an enquiry.",
                        'ogImage' => $img,
                        'url' => SITE_URL . '/creators/?profile=' . rawurlencode($slug),
                        'keywords' => $page['keywords'] ?? '',
                        'texts' => $page['texts'] ?? [],
                        'images' => $page['images'] ?? [],
                        'schema' => $page['schema'] ?? '',
                    ];
                }
            }
        }
    }
    return $page ?: null;
}

/** Valid replacement pairs, keyed by the built-in text (spacing ignored) or image address */
function content_pairs($raw, string $kind): array
{
    $out = [];
    if (!is_array($raw)) {
        return $out;
    }
    $norm = function ($v): string {
        return is_string($v) ? trim((string)preg_replace('/\s+/u', ' ', $v)) : '';
    };
    foreach (array_slice($raw, 0, 400, true) as $from => $to) {
        $from = (string)$from;
        if ($kind === 't') {
            $from = $norm($from);
            $to = $norm($to);
            if ($from === '' || $to === '' || $from === $to || strlen($from) > 8000 || strlen($to) > 8000) {
                continue;
            }
        } else {
            $to = is_string($to) ? trim($to) : '';
            $ok = '#^(https?://|/)\S+$#i';
            if (!preg_match($ok, $from) || !preg_match($ok, $to) || $from === $to) {
                continue;
            }
        }
        $out[$from] = $to;
    }
    return $out;
}

function react_escape(string $v): string
{
    return str_replace(['&', '<', '>', '"', "'"], ['&amp;', '&lt;', '&gt;', '&quot;', '&#x27;'], $v);
}

/** Admin JSON-LD: an object or a list of objects, re-encoded compactly; anything else is dropped */
function clean_schema($raw): string
{
    if (!is_string($raw) || trim($raw) === '' || strlen($raw) > 20000) {
        return '';
    }
    $data = json_decode($raw);
    $ok = is_object($data) || (is_array($data) && $data && count(array_filter($data, 'is_object')) === count($data));
    if (!$ok) {
        return '';
    }
    $out = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return is_string($out) && strlen($out) <= 10000 ? $out : '';
}

function set_attr(string $html, string $pattern, string $value): string
{
    $safe = htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return (string)preg_replace_callback($pattern, function ($m) use ($safe) {
        return $m[1] . $safe . $m[3];
    }, $html, 1);
}

function inject_meta(string $html, array $m): string
{
    $esc = function (string $v): string {
        return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    };
    if (!empty($m['title'])) {
        $t = $esc($m['title']);
        $html = (string)preg_replace_callback('#<title>[\s\S]*?</title>#', function () use ($t) {
            return "<title>$t</title>";
        }, $html, 1);
    }
    if (!empty($m['description'])) {
        $html = set_attr($html, '#(<meta name="description" content=")([^"]*)(")#', $m['description']);
    }
    $ogTitle = $m['ogTitle'] ?? ($m['title'] ?? '');
    $ogDesc = $m['ogDescription'] ?? ($m['description'] ?? '');
    if ($ogTitle !== '') {
        $html = set_attr($html, '#(<meta property="og:title" content=")([^"]*)(")#', $ogTitle);
        $html = set_attr($html, '#(<meta name="twitter:title" content=")([^"]*)(")#', $ogTitle);
    }
    if ($ogDesc !== '') {
        $html = set_attr($html, '#(<meta property="og:description" content=")([^"]*)(")#', $ogDesc);
        $html = set_attr($html, '#(<meta name="twitter:description" content=")([^"]*)(")#', $ogDesc);
    }
    if (!empty($m['ogImage'])) {
        $img = preg_match('#^https?://#i', $m['ogImage']) ? $m['ogImage'] : SITE_URL . '/' . ltrim($m['ogImage'], '/');
        $html = set_attr($html, '#(<meta property="og:image" content=")([^"]*)(")#', $img);
        $html = set_attr($html, '#(<meta name="twitter:image" content=")([^"]*)(")#', $img);
        if ($img !== DEFAULT_OG) {
            $html = (string)preg_replace('#\s*<meta property="og:image:(width|height)" content="[^"]*" />#', '', $html);
        }
    }
    if (!empty($m['url'])) {
        $html = set_attr($html, '#(<meta property="og:url" content=")([^"]*)(")#', $m['url']);
    }
    if (!empty($m['noindex'])) {
        $html = set_attr($html, '#(<meta name="robots" content=")([^"]*)(")#', 'noindex, nofollow');
    }
    if (!empty($m['keywords'])) {
        $kw = $esc($m['keywords']);
        $html = (string)preg_replace_callback('#<meta name="description" content="[^"]*" />#', function ($t) use ($kw) {
            return $t[0] . "\n    <meta name=\"keywords\" content=\"$kw\" />";
        }, $html, 1);
    }
    if (!empty($m['schema'])) {
        $block = '<script type="application/ld+json" id="page-schema">' . str_replace('<', '\u003c', $m['schema']) . "</script>\n  ";
        $pos = strpos($html, '</head>');
        if ($pos !== false) {
            $html = substr($html, 0, $pos) . $block . substr($html, $pos);
        }
    }
    if (!empty($m['texts']) || !empty($m['images'])) {
        $at = strpos($html, '<div id="root">');
        if ($at !== false) {
            $body = substr($html, $at);
            foreach (($m['texts'] ?? []) as $from => $to) {
                $to = react_escape((string)$to);
                $body = (string)preg_replace_callback('#>(\s*)' . preg_quote(react_escape((string)$from), '#') . '(\s*)<#u', function ($x) use ($to) {
                    return '>' . $x[1] . $to . $x[2] . '<';
                }, $body);
            }
            foreach (($m['images'] ?? []) as $from => $to) {
                $body = str_replace('src="' . react_escape((string)$from) . '"', 'src="' . react_escape((string)$to) . '"', $body);
            }
            $html = substr($html, 0, $at) . $body;
        }
    }
    if (!empty($m['heading'])) {
        // The first H1 of the page content in the prerendered HTML (the app redraws it in the browser)
        if (preg_match('#id="main-content"|class="seo-fallback"#', $html, $found, PREG_OFFSET_CAPTURE)) {
            $at = $found[0][1];
            $h = $esc($m['heading']);
            $rest = (string)preg_replace_callback('#(<h1\b[^>]*>)[\s\S]*?(</h1>)#', function ($x) use ($h) {
                return $x[1] . $h . $x[2];
            }, substr($html, $at), 1);
            $html = substr($html, 0, $at) . $rest;
        }
    }
    return $html;
}
