<?php
/**
 * Shared helpers for the FSIA PHP API.
 */

function fsia_config(): array
{
    static $config = null;
    if ($config === null) {
        $defaults = [
            'storage_dir' => dirname(__DIR__, 2) . '/storage',
            'gemini_api_key' => getenv('GEMINI_API_KEY') ?: '',
            'admin_username' => getenv('ADMIN_USERNAME') ?: '',
            'admin_password' => getenv('ADMIN_PASSWORD') ?: '',
            'session_ttl' => 12 * 3600,
        ];
        $file = dirname(__DIR__) . '/config.php';
        $custom = file_exists($file) ? (include $file) : [];
        $config = array_merge($defaults, is_array($custom) ? array_filter($custom, function ($v) { return $v !== '' && $v !== null; }) : []);
    }
    return $config;
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function str_cut($value, int $max): string
{
    $value = (string)$value;
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

function starts_with(string $haystack, string $needle): bool
{
    return strncmp($haystack, $needle, strlen($needle)) === 0;
}

class HttpError extends Exception
{
    public int $status;

    public function __construct(int $status, string $message)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function respond($payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message): void
{
    throw new HttpError($status, $message);
}

function request_body(): array
{
    static $body = null;
    if ($body === null) {
        $decoded = json_decode((string)file_get_contents('php://input'), true);
        $body = is_array($decoded) ? $decoded : [];
    }
    return $body;
}

function slugify(string $value): string
{
    $slug = strtolower(preg_replace('/\s+/', '-', trim($value)));
    return preg_replace('/[^a-z0-9\-]/', '', $slug);
}

function now_ms(): string
{
    return (string)round(microtime(true) * 1000);
}

function display_date(): string
{
    return date('j F Y');
}

function valid_email($email): bool
{
    return (bool)preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', (string)$email);
}

// Accept only http(s) URLs or embedded raster images up to ~1.5 MB
function safe_image($value, string $fallback): string
{
    $value = trim((string)$value);
    if (preg_match('#^https?://#i', $value) && strlen($value) <= 2000) {
        return $value;
    }
    if (preg_match('#^data:image/(png|jpe?g|webp|gif);base64,#i', $value) && strlen($value) <= 1500000) {
        return $value;
    }
    return $fallback;
}

function mask_key(string $key): string
{
    return $key === '' ? '' : substr($key, 0, 4) . '••••••••' . substr($key, -4);
}

// ----------------------------------------------------
// PASSWORDS — bcrypt via password_hash, with legacy SHA-256 hex support
// (the seed data and older Node databases use unsalted SHA-256)
// ----------------------------------------------------
function verify_password(string $password, string $stored): bool
{
    if (preg_match('/^[a-f0-9]{64}$/', $stored)) {
        return hash_equals($stored, hash('sha256', $password));
    }
    return password_verify($password, $stored);
}

function needs_rehash(string $stored): bool
{
    return preg_match('/^[a-f0-9]{64}$/', $stored) || password_needs_rehash($stored, PASSWORD_DEFAULT);
}

function is_default_password(string $stored): bool
{
    return verify_password('admin123', $stored);
}

// ----------------------------------------------------
// SESSIONS — random bearer tokens, stored hashed
// ----------------------------------------------------
function read_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
            }
        }
    }
    if (starts_with($header, 'Bearer ')) {
        return trim(substr($header, 7));
    }
    return trim($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
}

function current_admin(Store $store): ?string
{
    $token = read_token();
    if ($token === '') {
        return null;
    }
    $data = &$store->data();
    $hash = hash('sha256', $token);
    $now = time();
    $found = null;
    $dirty = false;
    foreach ($data['sessions'] as $i => &$session) {
        if ($session['expires'] < $now) {
            unset($data['sessions'][$i]);
            $dirty = true;
            continue;
        }
        if (hash_equals($session['tokenHash'], $hash)) {
            $found = $session['username'];
            // Sliding expiry, refreshed at most once a minute to limit writes
            if ($session['expires'] - $now < fsia_config()['session_ttl'] - 60) {
                $session['expires'] = $now + fsia_config()['session_ttl'];
                $dirty = true;
            }
        }
    }
    unset($session);
    if ($dirty) {
        $data['sessions'] = array_values($data['sessions']);
        $store->save();
    }
    return $found;
}

function require_admin(Store $store): string
{
    $user = current_admin($store);
    if ($user === null) {
        fail(401, 'Unauthorized access. Authentication token is invalid or expired.');
    }
    return $user;
}
