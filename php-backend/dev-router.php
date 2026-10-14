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
readfile($root . '/index.html');
