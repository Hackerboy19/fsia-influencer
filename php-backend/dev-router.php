<?php
// Local testing only: emulates the bundled .htaccess rules for PHP's built-in server.
//   php -S localhost:8080 -t release/fsia-influencer-live php-backend/dev-router.php
$root = $_SERVER['DOCUMENT_ROOT'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api(/|$)#', $path)) {
    require $root . '/api/index.php';
    return true;
}
if ($path !== '/' && is_file($root . $path)) {
    return false;
}
// DirectoryIndex + DirectorySlash: /talent/ serves talent/index.html, /talent redirects
if (is_file(rtrim($root . $path, '/') . '/index.html')) {
    if (substr($path, -1) !== '/') {
        header('Location: ' . $path . '/', true, 301);
        return true;
    }
    readfile($root . $path . 'index.html');
    return true;
}
// ErrorDocument 404
http_response_code(404);
header('Content-Type: text/html; charset=UTF-8');
header('X-Robots-Tag: noindex');
readfile($root . '/404.html');
