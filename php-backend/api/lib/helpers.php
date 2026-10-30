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
    return (bool)preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', trim((string)$email));
}

// 10–15 digits; spaces, dashes, dots, brackets and a leading + allowed (keep in sync with isValidPhone() in server.ts)
function valid_phone($phone): bool
{
    $phone = trim((string)$phone);
    $digits = strlen(preg_replace('/\D/', '', $phone));
    return (bool)preg_match('/^\+?[\d\s().-]+$/', $phone) && $digits >= 10 && $digits <= 15;
}

const PHONE_ERROR = 'Please provide a valid phone number (10 to 15 digits, e.g. +91 98765 43210).';

// Largest embedded photo accepted from the public form. The browser resizes uploads
// to ~100–350 KB, so this only stops oversized payloads that would bloat db.json.
const MAX_DATA_IMAGE_BYTES = 700000;

// Accept only http(s) URLs or embedded raster images
function safe_image($value, string $fallback, bool $allowData = true): string
{
    $value = trim((string)$value);
    if (preg_match('#^https?://#i', $value) && strlen($value) <= 2000) {
        return $value;
    }
    if ($allowData && preg_match('#^data:image/(png|jpe?g|webp|gif);base64,#i', $value) && strlen($value) <= MAX_DATA_IMAGE_BYTES) {
        return $value;
    }
    return $fallback;
}

// ----------------------------------------------------
// PUBLIC FORM LIMITS — every public submission is stored in db.json, which is
// loaded on every request, so spam must not be able to grow it without bound.
// ----------------------------------------------------
const MAX_PUBLIC_BODY_BYTES = 1500000;
const SUBMISSION_LIMIT = 12;          // stored submissions per IP …
const SUBMISSION_WINDOW = 600;        // … per 10 minutes
const MAX_DB_BYTES = 25000000;        // db.json size at which public submissions pause

function enforce_submission_limit(array &$db): void
{
    if (strlen((string)file_get_contents('php://input')) > MAX_PUBLIC_BODY_BYTES) {
        fail(413, 'This submission is too large. Please use a smaller photo.');
    }
    $now = time();
    $ip = client_ip();
    // IPv6 visitors control a whole /64, so count it as one address
    $packed = @inet_pton($ip);
    if ($packed !== false && strlen($packed) === 16) {
        $ip = bin2hex(substr($packed, 0, 8)) . '::/64';
    }
    foreach ($db['submission_log'] ?? [] as $key => $entry) {
        if ($now - ($entry['first'] ?? 0) > SUBMISSION_WINDOW) {
            unset($db['submission_log'][$key]);
        }
    }
    // Hard ceiling on the database size: past it, the forms pause instead of the whole site failing
    $dbFile = rtrim(fsia_config()['storage_dir'], '/') . '/db.json';
    if (is_file($dbFile) && filesize($dbFile) > MAX_DB_BYTES) {
        error_log('FSIA API: db.json is over ' . MAX_DB_BYTES . ' bytes; public submissions are paused.');
        fail(503, 'We are not accepting new submissions right now. Please try again later or email partner@fsia.in.');
    }
    $entry = $db['submission_log'][$ip] ?? ['count' => 0, 'first' => $now];
    if ($entry['count'] >= SUBMISSION_LIMIT) {
        fail(429, 'Too many submissions from your connection. Please wait a few minutes and try again.');
    }
    $db['submission_log'][$ip] = ['count' => $entry['count'] + 1, 'first' => $entry['first']];
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

// Checked when a username does not exist, so a failed login takes the same time either way
const DUMMY_PASSWORD_HASH = '$2y$10$mbxJy9aNBBl7G0GWQ/TYke/nhjaom2/4XlxLelWY1d0ZGMCqCfoky';

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

// Sessions slide while in use, but never outlive this absolute limit
const SESSION_MAX_AGE = 7 * 86400;

/** The signed-in admin for this request: ['username' => …, 'restricted' => still on the default password]. */
function current_admin(Store $store): ?array
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
        if (!isset($session['created'])) {
            // Sessions from before the absolute limit existed start counting now
            $session['created'] = $now;
            $dirty = true;
        }
        if ($session['expires'] < $now || $now - $session['created'] > SESSION_MAX_AGE) {
            unset($data['sessions'][$i]);
            $dirty = true;
            continue;
        }
        if (hash_equals($session['tokenHash'], $hash)) {
            if (!array_key_exists('mustChangePassword', $session)) {
                $session['mustChangePassword'] = false;
                foreach ($data['admin_users'] as $u) {
                    if ($u['username'] === $session['username']) {
                        $session['mustChangePassword'] = is_default_password($u['passwordHash']);
                    }
                }
                $dirty = true;
            }
            $found = ['username' => $session['username'], 'restricted' => (bool)$session['mustChangePassword']];
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

// Until the default password is changed, a session may only read its own status,
// change the password and sign out: the default login is public knowledge.
function require_admin(Store $store, bool $allowDefaultPassword = false): string
{
    $session = current_admin($store);
    if ($session === null) {
        fail(401, 'Unauthorized access. Authentication token is invalid or expired.');
    }
    if ($session['restricted'] && !$allowDefaultPassword) {
        fail(403, 'Change the default admin password first (Admin → Password & team).');
    }
    $request = $GLOBALS['fsia_request'] ?? ['GET', ''];
    if (!role_can(admin_role($store, $session['username']), route_area($request[0], $request[1]))) {
        fail(403, 'Your login does not have access to this part of the admin panel.');
    }
    return $session['username'];
}

// ----------------------------------------------------
// TEAM ROLES. Same map as src/lib/adminRoles.ts (keep in sync).
// owner: everything; editor: the website; inbox: applications and enquiries.
// ----------------------------------------------------
function normalise_role($role): string
{
    return in_array($role, ['editor', 'inbox'], true) ? $role : 'owner';
}

function admin_role(Store $store, string $username): string
{
    foreach ($store->data()['admin_users'] as $u) {
        if ($u['username'] === $username) {
            return normalise_role($u['role'] ?? null);
        }
    }
    return 'owner';
}

/** The area an admin API call belongs to (route is the path after /api/), or null when every role may use it */
function route_area(string $method, string $route): ?string
{
    $r = trim($route, '/');
    if (preg_match('#^admin/(users|backup|restore|logs)(/|$)#', $r)) {
        return 'team';
    }
    if (preg_match('#^(registrations|influencer-applications|enquiries)(/|$)#', $r)) {
        return 'inbox';
    }
    if (strtoupper($method) !== 'GET' && preg_match('#^(settings|creators|sections|campaigns|membership-plans|admin/upload|admin/settings-history)(/|$)#', $r)) {
        return 'website';
    }
    return null;
}

function role_can(string $role, ?string $area): bool
{
    if ($area === null || $role === 'owner') {
        return true;
    }
    return ($role === 'editor' && $area === 'website') || ($role === 'inbox' && $area === 'inbox');
}

/** Email alert for a new application or enquiry, to Admin → Site settings → Email alerts. Never blocks the form. */
function notify_team(array $db, string $subject, array $lines): void
{
    $to = trim((string)($db['system_settings']['notifyEmail'] ?? ''));
    if ($to === '' || !valid_email($to) || !function_exists('mail')) {
        return;
    }
    $host = preg_replace('/[^a-z0-9.\-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
    $host = preg_replace('/^www\./i', '', $host);
    $clean = function ($v): string {
        return trim((string)preg_replace('/[\r\n]+/', ' ', (string)$v));
    };
    $body = '';
    foreach ($lines as $label => $value) {
        if ($clean($value) !== '') {
            $body .= $label . ': ' . $clean($value) . "\n";
        }
    }
    $body .= "\nOpen the admin panel: https://$host/admin/\n";
    $headers = "From: Website <no-reply@$host>\r\nContent-Type: text/plain; charset=UTF-8";
    try {
        @mail($to, '=?UTF-8?B?' . base64_encode($clean($subject)) . '?=', $body, $headers);
    } catch (Throwable $e) {
        error_log('FSIA email alert: ' . $e->getMessage());
    }
}

// ----------------------------------------------------
// BRAND NAME — the public brand is "Influencer Awards" and the award is the "Influencer Award"
// (PLACEHOLDERS until Boss confirms; keep in sync with src/content/brand.ts).
// The word "Forever" must not appear in anything visitors see (Boss, 2026-10-26), and the award
// is separate from FSIA (Boss, 2026-10-26), so stored text from every earlier naming is rewritten
// in every public API response. Keep in sync with debrandText() in server/db.ts
// ----------------------------------------------------
function debrand_text(string $text): string
{
    $brand = 'Influencer Awards';
    $award = 'Influencer Award';
    $rules = [
        // Only one award exists (Boss, 2026-10-27): older section names and titles that read as other
        // awards or as a verification are shown under neutral niche names. The stored data is unchanged.
        ['/\b(?:Winner|(?:1st|2nd|3rd) Runner[- ]Up|Runner[- ]Up),?\s+Miss India \d{4}\b/iu', 'Fashion creator'],
        ['/\bMiss India \d{4}\b/iu', 'Fashion & Modelling'],
        ['/\bSuper Hero Awards?\b/iu', 'Social Impact'],
        ['/\bVerified VIP Influencers\b/iu', 'Lifestyle & Design'],
        ['/FSIA\s*[—-]\s*Forever Star India Awards/iu', $brand],
        ['/Forever Star India(?: Awards| Association)?(?: \(FSIA\))?/iu', $brand],
        ['/\b(?:Forever|FSIA) Influencer Awards\b/iu', $brand],
        ['/\b(?:Forever|FSIA) Influencer Award\b/iu', $award],
        ['/\b(?:Forever|FSIA) Influencer\b/iu', $brand],
        ['/\bForever Free\b/iu', 'Always Free'],
        // Lower-case prose ("stay forever young") keeps its meaning with "always"
        ['/\bforever\b/u', 'always'],
        // Any other spelling is the old brand prefix or suffix: drop it
        ['/\bforever\s+/iu', ''],
        ['/\s*\bforever\b/iu', ''],
        ['/forever/iu', ''],
        // Other mentions of FSIA as a name ("the FSIA team"); IDs such as FSIA-24527 and domains stay
        ['/\bFSIA\b(?![-.]\w)/u', $brand, true],
        ['/\b(Influencer Awards)(?: Influencer)+(?: Awards?)?\b/iu', null],
    ];
    // An all-caps match gets an all-caps replacement unless the rule's third value (as is) is true
    foreach ($rules as $rule) {
        [$pattern, $replacement] = $rule;
        $asIs = $rule[2] ?? false;
        $text = preg_replace_callback($pattern, function ($m) use ($replacement, $asIs) {
            $out = $replacement ?? $m[1];
            return !$asIs && $m[0] === strtoupper($m[0]) && preg_match('/[A-Z]/', $m[0]) ? strtoupper($out) : $out;
        }, $text);
    }
    return $text;
}

function debrand_value($value)
{
    if (is_string($value)) {
        return preg_match('#^(https?:|data:)#i', $value) ? $value : debrand_text($value);
    }
    if (is_array($value)) {
        foreach ($value as $k => $v) {
            $value[$k] = debrand_value($v);
        }
    }
    return $value;
}

/**
 * Social media links on a profile: only known platforms, short single-line text.
 * The site turns each value into a safe https link when it shows the profile.
 */
function clean_social($input): array
{
    $out = [];
    if (!is_array($input)) {
        return $out;
    }
    foreach (['instagram', 'youtube', 'facebook', 'x', 'linkedin', 'website'] as $key) {
        $v = $input[$key] ?? '';
        if (!is_string($v)) {
            continue;
        }
        $v = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $v) ?? '');
        if ($v !== '') {
            $out[$key] = str_cut($v, 200);
        }
    }
    return $out;
}

/** Keeps a copy of the settings before a change (newest first, at most 20), without the API key */
function save_settings_version(array &$db, string $by, array $keys): void
{
    $settings = $db['system_settings'];
    unset($settings['geminiApiKey']);
    if (!is_array($db['settings_history'] ?? null)) {
        $db['settings_history'] = [];
    }
    array_unshift($db['settings_history'], [
        'id' => 'ver-' . now_ms() . '-' . random_int(0, 999),
        'at' => gmdate('c'),
        'by' => $by,
        'keys' => array_slice(array_map('strval', $keys), 0, 30),
        'settings' => $settings,
    ]);
    $db['settings_history'] = array_slice($db['settings_history'], 0, 20);
}
