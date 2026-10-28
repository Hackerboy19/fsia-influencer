<?php
/**
 * FSIA Influencer — PHP API router.
 *
 * Drop-in replacement for the Node/Express API in server.ts for shared hosting
 * (cPanel, Hostinger, LiteSpeed…). Data is stored in storage/db.json.
 */

declare(strict_types=1);

require __DIR__ . '/lib/helpers.php';
require __DIR__ . '/lib/Store.php';

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header_remove('X-Powered-By');
// API responses are data for the app, not pages: keep them out of search results
header('X-Robots-Tag: noindex, nofollow');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Resolve the route relative to /api/, whatever folder the site is installed in
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$pos = strpos($path, '/api/');
$route = $pos === false ? '' : trim(substr($path, $pos + 5), '/');
$segments = $route === '' ? [] : explode('/', $route);

try {
    $config = fsia_config();
    $store = new Store($config['storage_dir'], __DIR__ . '/seed.json');
    $body = request_body();
    $db = &$store->data();

    $is = function (string $verb, string $pattern, &$params = null) use ($method, $route): bool {
        if ($verb !== $method) {
            return false;
        }
        $regex = '#^' . preg_replace('#\\\\\{[a-zA-Z]+\\\\\}#', '([^/]+)', preg_quote($pattern, '#')) . '$#';
        if (!preg_match($regex, $route, $m)) {
            return false;
        }
        $params = array_slice($m, 1);
        return true;
    };

    // ------------------------------------------------
    // 1. AUTHENTICATION
    // ------------------------------------------------
    if ($is('POST', 'auth/login')) {
        $username = (string)($body['username'] ?? '');
        $password = (string)($body['password'] ?? '');
        if ($username === '' || $password === '') {
            fail(400, 'Username and password are required.');
        }

        $ip = client_ip();
        foreach ($db['login_attempts'] ?? [] as $key => $entry) {
            if (time() - ($entry['first'] ?? 0) > 900) {
                unset($db['login_attempts'][$key]);
            }
        }
        $attempts = $db['login_attempts'][$ip] ?? null;
        if ($attempts && time() - $attempts['first'] > 900) {
            $attempts = null;
        }
        if ($attempts && $attempts['count'] >= 8) {
            fail(429, 'Too many failed attempts. Please wait 15 minutes and try again.');
        }

        $userIndex = null;
        foreach ($db['admin_users'] as $i => $u) {
            if ($u['username'] === $username) {
                $userIndex = $i;
            }
        }
        if ($userIndex === null) {
            password_verify($password, DUMMY_PASSWORD_HASH);
        }
        if ($userIndex === null || !verify_password($password, $db['admin_users'][$userIndex]['passwordHash'])) {
            $db['login_attempts'][$ip] = $attempts
                ? ['count' => $attempts['count'] + 1, 'first' => $attempts['first']]
                : ['count' => 1, 'first' => time()];
            $store->log('Failed login attempt for user: ' . $username);
            $store->save();
            fail(401, 'Invalid credentials. Please verify your login details.');
        }

        unset($db['login_attempts'][$ip]);
        $user = &$db['admin_users'][$userIndex];
        $mustChange = is_default_password($user['passwordHash']);
        if (needs_rehash($user['passwordHash'])) {
            $user['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
        }
        $user['lastLogin'] = gmdate('c');

        $token = bin2hex(random_bytes(32));
        $db['sessions'][] = [
            'tokenHash' => hash('sha256', $token),
            'username' => $user['username'],
            'created' => time(),
            'expires' => time() + (int)$config['session_ttl'],
            'mustChangePassword' => $mustChange,
        ];
        $db['sessions'] = array_slice($db['sessions'], -50);
        $store->log('Successful administrative login: ' . $username);
        $store->save();

        respond([
            'success' => true,
            'token' => $token,
            'username' => $user['username'],
            'mustChangePassword' => $mustChange,
            'message' => 'Session authenticated successfully',
        ]);
    }

    if ($is('GET', 'auth/me')) {
        $admin = require_admin($store, true);
        $mustChange = false;
        foreach ($db['admin_users'] as $u) {
            if ($u['username'] === $admin) {
                $mustChange = is_default_password($u['passwordHash']);
            }
        }
        respond(['success' => true, 'username' => $admin, 'mustChangePassword' => $mustChange]);
    }

    if ($is('POST', 'auth/logout')) {
        $hash = hash('sha256', read_token());
        $db['sessions'] = array_values(array_filter($db['sessions'], function ($s) use ($hash) {
            return !hash_equals($s['tokenHash'], $hash);
        }));
        $store->save();
        respond(['success' => true]);
    }

    if ($is('POST', 'auth/change-password')) {
        $admin = require_admin($store, true);
        $current = (string)($body['currentPassword'] ?? '');
        $new = (string)($body['newPassword'] ?? '');
        if ($current === '' || $new === '') {
            fail(400, 'Current and new password are required.');
        }
        if (strlen($new) < 8) {
            fail(400, 'New password must be at least 8 characters long.');
        }
        if ($new === 'admin123') {
            fail(400, 'Choose a password other than the default one.');
        }
        foreach ($db['admin_users'] as &$u) {
            if ($u['username'] === $admin) {
                if (!verify_password($current, $u['passwordHash'])) {
                    fail(401, 'Current password is incorrect.');
                }
                $u['passwordHash'] = password_hash($new, PASSWORD_DEFAULT);
            }
        }
        unset($u);
        // Sign out every other session of this user
        $keep = hash('sha256', read_token());
        $db['sessions'] = array_values(array_filter($db['sessions'], function ($s) use ($admin, $keep) {
            return $s['username'] !== $admin || hash_equals($s['tokenHash'], $keep);
        }));
        foreach ($db['sessions'] as &$s) {
            if (hash_equals($s['tokenHash'], $keep)) {
                $s['mustChangePassword'] = false;
            }
        }
        unset($s);
        $store->log('Password changed for operator: ' . $admin);
        $store->save();
        respond(['success' => true, 'message' => 'Password updated successfully.']);
    }

    // ------------------------------------------------
    // 1B. ADMIN TEAM
    // ------------------------------------------------
    if ($is('GET', 'admin/users')) {
        require_admin($store);
        respond(array_map(function ($u) {
            return ['username' => $u['username'], 'createdAt' => $u['createdAt'] ?? null, 'lastLogin' => $u['lastLogin'] ?? null];
        }, $db['admin_users']));
    }

    if ($is('POST', 'admin/users')) {
        $admin = require_admin($store);
        $name = trim((string)($body['username'] ?? ''));
        $password = (string)($body['password'] ?? '');
        if ($name === '' || $password === '') {
            fail(400, 'Username and password are required.');
        }
        if (strlen($password) < 8) {
            fail(400, 'Password must be at least 8 characters long.');
        }
        foreach ($db['admin_users'] as $u) {
            if (strtolower($u['username']) === strtolower($name)) {
                fail(400, 'An operator with this username already exists.');
            }
        }
        $db['admin_users'][] = ['username' => $name, 'passwordHash' => password_hash($password, PASSWORD_DEFAULT), 'createdAt' => gmdate('c')];
        $store->log("Created operator account: $name (by $admin)");
        $store->save();
        respond(['success' => true], 201);
    }

    if ($is('DELETE', 'admin/users/{username}', $p)) {
        $admin = require_admin($store);
        $target = $p[0];
        if ($target === $admin) {
            fail(400, 'You cannot remove the account you are signed in with.');
        }
        $before = count($db['admin_users']);
        $db['admin_users'] = array_values(array_filter($db['admin_users'], function ($u) use ($target) {
            return $u['username'] !== $target;
        }));
        if (count($db['admin_users']) === $before) {
            fail(404, 'Operator not found.');
        }
        $db['sessions'] = array_values(array_filter($db['sessions'], function ($s) use ($target) {
            return $s['username'] !== $target;
        }));
        $store->log("Removed operator account: $target (by $admin)");
        $store->save();
        respond(['success' => true]);
    }

    // ------------------------------------------------
    // 2. SECTIONS / CATEGORIES (checked before creators/{a}/{b})
    // ------------------------------------------------
    $sectionIndex = function (string $id) use (&$db): ?int {
        foreach ($db['creators'] as $i => $s) {
            if ($s['id'] === $id) {
                return $i;
            }
        }
        return null;
    };

    if ($is('GET', 'sections') || $is('GET', 'creators/categories') || $is('GET', 'creators')) {
        respond(debrand_value($db['creators']));
    }

    if ($is('POST', 'sections') || $is('POST', 'creators/categories')) {
        require_admin($store);
        $title = trim((string)($body['title'] ?? ''));
        if ($title === '') {
            fail(400, 'Category title is required.');
        }
        $id = slugify($title) ?: 'cat-' . now_ms();
        if ($sectionIndex($id) !== null) {
            fail(400, 'A category with this title already exists.');
        }
        $minOffset = 0;
        foreach ($db['creators'] as $s) {
            $minOffset = min($minOffset, $s['zOffset']);
        }
        $section = [
            'id' => $id,
            'title' => $title,
            'subtitle' => ($body['subtitle'] ?? '') ?: 'Custom Runway Station',
            'primaryColor' => ($body['primaryColor'] ?? '') ?: '#E1C699',
            'creators' => [],
            'zOffset' => $minOffset - 8,
        ];
        $db['creators'][] = $section;
        $store->log('Created custom catwalk category: ' . $title);
        $store->save();
        respond(['success' => true, 'section' => $section, 'creators' => $db['creators']], 201);
    }

    if ($is('PUT', 'sections/{id}', $p) || $is('PUT', 'creators/categories/{id}', $p)) {
        require_admin($store);
        $title = trim((string)($body['title'] ?? ''));
        if ($title === '') {
            fail(400, 'Category title is required.');
        }
        $i = $sectionIndex($p[0]);
        if ($i === null) {
            fail(404, 'Category not found.');
        }
        $db['creators'][$i]['title'] = $title;
        $db['creators'][$i]['subtitle'] = ($body['subtitle'] ?? '') ?: 'Custom Runway Station';
        $db['creators'][$i]['primaryColor'] = ($body['primaryColor'] ?? '') ?: '#E1C699';
        $store->log('Updated catwalk category: ' . $title);
        $store->save();
        respond(['success' => true, 'section' => $db['creators'][$i], 'creators' => $db['creators']]);
    }

    if ($is('DELETE', 'sections/{id}', $p) || $is('DELETE', 'creators/categories/{id}', $p)) {
        require_admin($store);
        $i = $sectionIndex($p[0]);
        if ($i === null) {
            fail(404, 'Category not found.');
        }
        $title = $db['creators'][$i]['title'];
        array_splice($db['creators'], $i, 1);
        foreach ($db['creators'] as $index => &$s) {
            $s['zOffset'] = $index * -8;
        }
        unset($s);
        $store->log('Deleted catwalk category: ' . $title);
        $store->save();
        respond(['success' => true, 'message' => 'Category successfully deleted.', 'creators' => $db['creators']]);
    }

    // ------------------------------------------------
    // 3. CREATORS
    // ------------------------------------------------
    $creatorIndex = function (int $si, string $name) use (&$db): ?int {
        foreach ($db['creators'][$si]['creators'] as $i => $c) {
            if (strtolower($c['name']) === strtolower($name)) {
                return $i;
            }
        }
        return null;
    };

    if ($is('POST', 'creators')) {
        require_admin($store);
        $creator = $body['creator'] ?? null;
        $sectionId = (string)($body['sectionId'] ?? '');
        if ($sectionId === '' || !is_array($creator) || empty($creator['name'])) {
            fail(400, 'Invalid creator submission payload.');
        }
        $si = $sectionIndex($sectionId);
        if ($si === null) {
            fail(404, 'Target runway section not found.');
        }
        if ($creatorIndex($si, $creator['name']) !== null) {
            fail(400, 'A creator with this name already exists in this category.');
        }
        $image = (string)($creator['image'] ?? '');
        $stats = is_array($creator['stats'] ?? null) ? $creator['stats'] : [];
        $new = [
            'name' => $creator['name'],
            // Only what the admin entered: no stand-in photo, city, bio or audience figures
            'role' => (string)($creator['role'] ?? ''),
            'city' => (string)($creator['city'] ?? ''),
            'image' => $image,
            'bio' => (string)($creator['bio'] ?? ''),
            'stats' => array_merge($stats, [
                'reach' => (string)($stats['reach'] ?? ''),
                'engagement' => (string)($stats['engagement'] ?? ''),
                'verified' => ($stats['verified'] ?? true) !== false,
            ]),
            'quote' => (string)($creator['quote'] ?? ''),
            'portfolio' => !empty($creator['portfolio']) && is_array($creator['portfolio']) ? array_values($creator['portfolio']) : ($image !== '' ? [$image] : []),
            'social' => (object)clean_social($creator['social'] ?? []),
        ];
        $db['creators'][$si]['creators'][] = $new;
        $store->log('Added creator: ' . $new['name'] . ' to section: ' . $db['creators'][$si]['title']);
        $store->save();
        respond(['success' => true, 'creator' => $new], 201);
    }

    if ($is('PUT', 'creators')) {
        require_admin($store);
        $sectionId = (string)($body['sectionId'] ?? '');
        $originalName = (string)($body['originalName'] ?? '');
        $updated = $body['updatedCreator'] ?? null;
        if ($sectionId === '' || $originalName === '' || !is_array($updated)) {
            fail(400, 'Missing required update fields.');
        }
        $si = $sectionIndex($sectionId);
        if ($si === null) {
            fail(404, 'Target runway section not found.');
        }
        $ci = $creatorIndex($si, $originalName);
        if ($ci === null) {
            fail(404, 'Target creator not found in section.');
        }
        $existing = $db['creators'][$si]['creators'][$ci];
        $merged = array_merge($existing, $updated);
        $merged['stats'] = array_merge($existing['stats'] ?? [], is_array($updated['stats'] ?? null) ? $updated['stats'] : []);
        if (array_key_exists('social', $updated)) {
            $merged['social'] = (object)clean_social($updated['social']);
        }
        $db['creators'][$si]['creators'][$ci] = $merged;
        $store->log('Updated creator profile: ' . $originalName);
        $store->save();
        respond(['success' => true, 'creator' => $merged]);
    }

    if ($is('DELETE', 'creators/{sectionId}/{name}', $p)) {
        require_admin($store);
        $si = $sectionIndex($p[0]);
        if ($si === null) {
            fail(404, 'Target runway section not found.');
        }
        $ci = $creatorIndex($si, $p[1]);
        if ($ci === null) {
            fail(404, 'Creator not found.');
        }
        array_splice($db['creators'][$si]['creators'], $ci, 1);
        $store->log('Deleted creator profile: ' . $p[1] . ' from section: ' . $p[0]);
        $store->save();
        respond(['success' => true, 'message' => 'Creator successfully expunged.']);
    }

    // ------------------------------------------------
    // 4. GENERIC ID-KEYED COLLECTIONS (membership plans, campaigns)
    // ------------------------------------------------
    $findById = function (string $collection, string $id) use (&$db): ?int {
        foreach ($db[$collection] as $i => $item) {
            if (($item['id'] ?? null) === $id) {
                return $i;
            }
        }
        return null;
    };

    if ($is('GET', 'membership-plans')) {
        respond(debrand_value($db['membership_plans']));
    }

    if ($is('POST', 'membership-plans')) {
        require_admin($store);
        if (empty($body['name']) || empty($body['price'])) {
            fail(400, 'Invalid membership plan data.');
        }
        $plan = array_merge($body, [
            'id' => ($body['id'] ?? '') ?: (slugify((string)$body['name']) ?: 'plan-' . now_ms()),
            'perks' => is_array($body['perks'] ?? null) ? $body['perks'] : [],
        ]);
        $db['membership_plans'][] = $plan;
        $store->log('Created Membership Plan: ' . $plan['name']);
        $store->save();
        respond(['success' => true, 'plan' => $plan], 201);
    }

    if ($is('PUT', 'membership-plans/{id}', $p)) {
        require_admin($store);
        $i = $findById('membership_plans', $p[0]);
        if ($i === null) {
            fail(404, 'Membership plan not found.');
        }
        $db['membership_plans'][$i] = array_merge($db['membership_plans'][$i], $body);
        $store->log('Modified Membership Plan: ' . $db['membership_plans'][$i]['name']);
        $store->save();
        respond(['success' => true, 'plan' => $db['membership_plans'][$i]]);
    }

    if ($is('DELETE', 'membership-plans/{id}', $p)) {
        require_admin($store);
        $i = $findById('membership_plans', $p[0]);
        if ($i === null) {
            fail(404, 'Membership plan not found.');
        }
        array_splice($db['membership_plans'], $i, 1);
        $store->log('Deleted Membership Plan: ' . $p[0]);
        $store->save();
        respond(['success' => true, 'message' => 'Membership plan successfully deleted.']);
    }

    if ($is('GET', 'campaigns')) {
        respond(debrand_value($db['campaigns']));
    }

    if ($is('POST', 'campaigns')) {
        require_admin($store);
        if (empty($body['brand']) || empty($body['title'])) {
            fail(400, 'Invalid campaign payload data.');
        }
        $campaign = array_merge($body, [
            'id' => ($body['id'] ?? '') ?: 'camp-' . now_ms(),
            'perks' => !empty($body['perks']) && is_array($body['perks']) ? $body['perks'] : ['Premium cover photo shoot', 'Ambassador retainer contracts'],
        ]);
        $db['campaigns'][] = $campaign;
        $store->log('Created Brand Campaign: ' . $campaign['brand'] . ' - ' . $campaign['title']);
        $store->save();
        respond(['success' => true, 'campaign' => $campaign], 201);
    }

    if ($is('PUT', 'campaigns/{id}', $p)) {
        require_admin($store);
        $i = $findById('campaigns', $p[0]);
        if ($i === null) {
            fail(404, 'Campaign not found.');
        }
        $db['campaigns'][$i] = array_merge($db['campaigns'][$i], $body);
        $store->log('Modified Brand Campaign: ' . $db['campaigns'][$i]['brand']);
        $store->save();
        respond(['success' => true, 'campaign' => $db['campaigns'][$i]]);
    }

    if ($is('DELETE', 'campaigns/{id}', $p)) {
        require_admin($store);
        $i = $findById('campaigns', $p[0]);
        if ($i === null) {
            fail(404, 'Campaign not found.');
        }
        array_splice($db['campaigns'], $i, 1);
        $store->log('Archived Campaign: ' . $p[0]);
        $store->save();
        respond(['success' => true, 'message' => 'Campaign successfully archived.']);
    }

    // ------------------------------------------------
    // 5. VIP REGISTRATIONS (brand leads)
    // ------------------------------------------------
    if ($is('GET', 'registrations')) {
        require_admin($store);
        respond($db['registrations']);
    }

    if ($is('POST', 'registrations')) {
        if (empty($body['brandName']) || empty($body['contactEmail']) || empty($body['contactPhone'])) {
            fail(400, 'Brand Name, email, and phone contact are mandatory.');
        }
        if (!valid_email($body['contactEmail'])) {
            fail(400, 'Please provide a valid contact email address.');
        }
        if (!valid_phone($body['contactPhone'])) {
            fail(400, PHONE_ERROR);
        }
        enforce_submission_limit($db);
        $registration = [
            'id' => 'reg-' . now_ms(),
            'bookingId' => 'ENQ-' . random_int(100000, 999999),
            'timestamp' => display_date(),
            'brandName' => str_cut($body['brandName'], 200),
            'creatorName' => str_cut(($body['creatorName'] ?? '') ?: 'All VIP Roster', 200),
            'budget' => str_cut(($body['budget'] ?? '') ?: 'Custom Escrow Quote', 100),
            'clientCity' => str_cut(($body['clientCity'] ?? '') ?: 'Mumbai', 100),
            'contactEmail' => str_cut($body['contactEmail'], 200),
            'contactPhone' => str_cut($body['contactPhone'], 50),
            'gstin' => str_cut($body['gstin'] ?? '', 50),
            'scope' => str_cut($body['scope'] ?? '', 1000),
            'duration' => str_cut($body['duration'] ?? '', 100),
            'verificationHash' => '0x' . strtoupper(bin2hex(random_bytes(4))) . '...' . strtoupper(bin2hex(random_bytes(2))),
            'status' => 'new',
        ];
        array_unshift($db['registrations'], $registration);
        $store->log('Received VIP Collaboration Application from: ' . $registration['brandName'] . ' targeting ' . $registration['creatorName']);
        $store->save();
        respond(['success' => true, 'registration' => $registration], 201);
    }

    if ($is('PUT', 'registrations/{id}', $p)) {
        require_admin($store);
        $i = $findById('registrations', $p[0]);
        if ($i === null) {
            fail(404, 'Registration not found.');
        }
        if (isset($body['status'])) {
            if (!in_array($body['status'], ['new', 'contacted', 'confirmed', 'closed'], true)) {
                fail(400, 'Invalid lead status.');
            }
            $db['registrations'][$i]['status'] = $body['status'];
        }
        if (isset($body['notes'])) {
            $db['registrations'][$i]['notes'] = str_cut($body['notes'], 2000);
        }
        $store->log('Updated VIP lead ' . $db['registrations'][$i]['bookingId'] . (isset($body['status']) ? ' → ' . $body['status'] : ''));
        $store->save();
        respond(['success' => true, 'registration' => $db['registrations'][$i]]);
    }

    if ($is('DELETE', 'registrations/{id}', $p)) {
        require_admin($store);
        $i = $findById('registrations', $p[0]);
        if ($i === null) {
            fail(404, 'Registration not found.');
        }
        $reg = $db['registrations'][$i];
        array_splice($db['registrations'], $i, 1);
        $store->log('Deleted VIP lead ' . $reg['bookingId'] . ' (' . $reg['brandName'] . ')');
        $store->save();
        respond(['success' => true]);
    }

    // ------------------------------------------------
    // 6. INFLUENCER / MODEL APPLICATIONS
    // ------------------------------------------------
    if ($is('GET', 'influencer-applications')) {
        require_admin($store);
        respond($db['influencer_applications']);
    }

    if ($is('POST', 'influencer-applications')) {
        if (empty($body['name']) || empty($body['email']) || empty($body['phone']) || empty($body['category'])) {
            fail(400, 'Full Name, Email, Phone Contact, and Runway Category are required.');
        }
        if (!valid_email($body['email'])) {
            fail(400, 'Please provide a valid email address.');
        }
        if (!valid_phone($body['phone'])) {
            fail(400, PHONE_ERROR);
        }
        enforce_submission_limit($db);
        $portfolio = $body['portfolio'] ?? [];
        if (is_string($portfolio)) {
            $portfolio = array_values(array_filter(array_map('trim', explode(',', $portfolio))));
        }
        $image = safe_image($body['image'] ?? '', '');
        $application = [
            'id' => 'inf-app-' . now_ms(),
            'name' => str_cut($body['name'], 200),
            'category' => str_cut($body['category'], 100),
            // Without a title, the category describes the creator (and files them on the Talent page)
            'role' => str_cut(($body['role'] ?? '') ?: trim((string)$body['category']), 200),
            // Blank answers stay blank: nothing is invented for the public profile
            'city' => str_cut((string)($body['city'] ?? ''), 100),
            'image' => $image,
            'bio' => str_cut((string)($body['bio'] ?? ''), 3000),
            'reach' => str_cut((string)($body['reach'] ?? ''), 20),
            'engagement' => str_cut((string)($body['engagement'] ?? ''), 20),
            // Portfolio entries are links; an embedded photo is only kept when it is the profile photo itself
            'portfolio' => is_array($portfolio) ? array_values(array_filter(array_map(function ($u) use ($image) {
                return $u === $image ? $image : safe_image($u, '', false);
            }, array_slice($portfolio, 0, 12)))) : [],
            'quote' => str_cut((string)($body['quote'] ?? ''), 500),
            'social' => (object)clean_social($body['social'] ?? []),
            'email' => str_cut($body['email'], 200),
            'phone' => str_cut($body['phone'], 50),
            'status' => 'pending',
            'timestamp' => display_date(),
        ];
        array_unshift($db['influencer_applications'], $application);
        $store->log('Received new Influencer Registration request from: ' . $application['name'] . ' (Runway: ' . $application['category'] . ')');
        $store->save();
        respond(['success' => true, 'application' => $application], 201);
    }

    if ($is('POST', 'influencer-applications/{id}/approve', $p)) {
        require_admin($store);
        $i = $findById('influencer_applications', $p[0]);
        if ($i === null) {
            fail(404, 'Influencer application not found.');
        }
        $app = &$db['influencer_applications'][$i];
        // The admin chooses the runway section; older applications stored a section id as their category
        $sectionId = trim((string)($body['sectionId'] ?? '')) ?: (string)$app['category'];
        $si = $sectionIndex($sectionId);
        if ($si === null) {
            fail(400, 'Choose the runway section this creator should join.');
        }
        $app['status'] = 'approved';
        if ($creatorIndex($si, $app['name']) !== null) {
            $store->log('Approved model registration: ' . $app['name'] . ' (already exists in runway section)');
        } else {
            $db['creators'][$si]['creators'][] = [
                'name' => $app['name'],
                // Only what the creator submitted: no stand-in city, bio or audience figures
                'role' => (string)($app['role'] ?? ''),
                'city' => (string)($app['city'] ?? ''),
                'image' => (string)($app['image'] ?? ''),
                'bio' => (string)($app['bio'] ?? ''),
                'stats' => ['reach' => (string)($app['reach'] ?? ''), 'engagement' => (string)($app['engagement'] ?? ''), 'verified' => true],
                'quote' => (string)($app['quote'] ?? ''),
                'portfolio' => !empty($app['portfolio']) ? $app['portfolio'] : (!empty($app['image']) ? [$app['image']] : []),
                'social' => (object)clean_social((array)($app['social'] ?? [])),
            ];
            $store->log('Approved & added model registration: ' . $app['name'] . ' to Runway: ' . $db['creators'][$si]['title']);
        }
        $store->save();
        respond(['success' => true, 'application' => $app]);
    }

    if ($is('POST', 'influencer-applications/{id}/decline', $p)) {
        require_admin($store);
        $i = $findById('influencer_applications', $p[0]);
        if ($i === null) {
            fail(404, 'Influencer application not found.');
        }
        $db['influencer_applications'][$i]['status'] = 'declined';
        $store->log('Declined model registration application from: ' . $db['influencer_applications'][$i]['name']);
        $store->save();
        respond(['success' => true, 'application' => $db['influencer_applications'][$i]]);
    }

    if ($is('DELETE', 'influencer-applications/{id}', $p)) {
        require_admin($store);
        $i = $findById('influencer_applications', $p[0]);
        if ($i === null) {
            fail(404, 'Influencer application not found.');
        }
        $name = $db['influencer_applications'][$i]['name'];
        array_splice($db['influencer_applications'], $i, 1);
        $store->log('Deleted model registration application from: ' . $name);
        $store->save();
        respond(['success' => true]);
    }

    // ------------------------------------------------
    // 6B. ENQUIRIES (campaign applications, membership plan requests, contact
    // messages and magazine bookings). Same rules as server.ts.
    // ------------------------------------------------
    if ($is('POST', 'enquiries')) {
        $type = (string)($body['type'] ?? '');
        if (!in_array($type, ['campaign', 'membership', 'contact', 'booking'], true)) {
            fail(400, 'Unknown enquiry type.');
        }
        // The contact page is form-only (name, email, subject, message): no phone number asked
        $phoneOptional = $type === 'contact';
        $phone = trim((string)($body['phone'] ?? ''));
        if (trim((string)($body['name'] ?? '')) === '' || trim((string)($body['email'] ?? '')) === '' || (!$phoneOptional && $phone === '')) {
            fail(400, $phoneOptional ? 'Name and email are required.' : 'Name, email and phone are required.');
        }
        if (!valid_email(trim((string)$body['email']))) {
            fail(400, 'Please provide a valid email address.');
        }
        if ((!$phoneOptional || $phone !== '') && !valid_phone($phone)) {
            fail(400, PHONE_ERROR);
        }
        enforce_submission_limit($db);
        $details = [];
        if (is_array($body['details'] ?? null)) {
            foreach (array_slice($body['details'], 0, 12, true) as $k => $v) {
                $details[str_cut($k, 40)] = str_cut(is_scalar($v) ? trim((string)$v) : '', 2000);
            }
        }
        $enquiry = [
            'id' => 'enq-' . now_ms(),
            'type' => $type,
            'subject' => str_cut(trim((string)($body['subject'] ?? '')), 300),
            'refId' => str_cut(trim((string)($body['refId'] ?? '')), 100),
            'name' => str_cut(trim((string)$body['name']), 200),
            'email' => str_cut(trim((string)$body['email']), 200),
            'phone' => str_cut($phone, 50),
            'details' => (object)$details,
            'status' => 'new',
            'timestamp' => gmdate('c'),
        ];
        array_unshift($db['enquiries'], $enquiry);
        $db['enquiries'] = array_slice($db['enquiries'], 0, 5000);
        $store->log('New ' . $type . ' enquiry from ' . $enquiry['name'] . ': ' . $enquiry['subject']);
        $store->save();
        respond(['success' => true, 'enquiry' => ['id' => $enquiry['id'], 'timestamp' => $enquiry['timestamp']]], 201);
    }

    if ($is('GET', 'enquiries')) {
        require_admin($store);
        respond($db['enquiries']);
    }

    if ($is('PUT', 'enquiries/{id}', $p)) {
        require_admin($store);
        $i = $findById('enquiries', $p[0]);
        if ($i === null) {
            fail(404, 'Enquiry not found.');
        }
        if (isset($body['status'])) {
            if (!in_array($body['status'], ['new', 'contacted', 'confirmed', 'closed'], true)) {
                fail(400, 'Invalid status.');
            }
            $db['enquiries'][$i]['status'] = $body['status'];
        }
        if (isset($body['notes'])) {
            $db['enquiries'][$i]['notes'] = str_cut($body['notes'], 2000);
        }
        $store->log('Updated enquiry ' . $p[0] . (isset($body['status']) ? ' → ' . $body['status'] : ''));
        $store->save();
        respond(['success' => true, 'enquiry' => $db['enquiries'][$i]]);
    }

    if ($is('DELETE', 'enquiries/{id}', $p)) {
        require_admin($store);
        $i = $findById('enquiries', $p[0]);
        if ($i === null) {
            fail(404, 'Enquiry not found.');
        }
        array_splice($db['enquiries'], $i, 1);
        $store->log('Deleted enquiry ' . $p[0]);
        $store->save();
        respond(['success' => true]);
    }

    // ------------------------------------------------
    // 7. SETTINGS & AI
    // ------------------------------------------------
    if ($is('GET', 'settings')) {
        $public = $db['system_settings'];
        foreach (['geminiApiKey', 'aiSystemPrompt', 'modelSelection', 'temperature', 'topK'] as $private) {
            unset($public[$private]);
        }
        respond(debrand_value($public));
    }

    if ($is('GET', 'admin/settings')) {
        require_admin($store);
        respond(array_merge($db['system_settings'], ['geminiApiKey' => mask_key((string)($db['system_settings']['geminiApiKey'] ?? ''))]));
    }

    if ($is('PUT', 'settings')) {
        require_admin($store);
        $key = (string)($body['geminiApiKey'] ?? '');
        if (strpos($key, '••••') !== false) {
            $key = (string)($db['system_settings']['geminiApiKey'] ?? '');
        }
        $db['system_settings'] = array_merge($db['system_settings'], $body, ['geminiApiKey' => $key]);
        $store->log('Modified dynamic system settings and appearance configurations');
        $store->save();
        respond(['success' => true, 'settings' => array_merge($db['system_settings'], ['geminiApiKey' => mask_key($key)])]);
    }

    // Photo upload from the admin panel. Stored in /uploads/YYYY/MM/ next to the site.
    if ($is('POST', 'admin/upload')) {
        require_admin($store);
        $dataUrl = (string)($body['dataUrl'] ?? '');
        if (!preg_match('#^data:image/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$#i', $dataUrl, $m)) {
            fail(400, 'Send a JPG, PNG or WebP image.');
        }
        $bin = base64_decode($m[2], true);
        if ($bin === false) {
            fail(400, 'The file is not a valid image.');
        }
        if (strlen($bin) > 3 * 1024 * 1024) {
            fail(413, 'Image is larger than 3 MB.');
        }
        $kind = null;
        if (strncmp($bin, "\xFF\xD8\xFF", 3) === 0) {
            $kind = 'jpg';
        } elseif (strncmp($bin, "\x89PNG\r\n\x1A\n", 8) === 0) {
            $kind = 'png';
        } elseif (substr($bin, 0, 4) === 'RIFF' && substr($bin, 8, 4) === 'WEBP') {
            $kind = 'webp';
        }
        if ($kind === null || @getimagesizefromstring($bin) === false) {
            fail(400, 'The file is not a valid image.');
        }
        $sub = date('Y') . '/' . date('m');
        $dir = dirname(__DIR__) . '/uploads/' . $sub;
        if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
            fail(500, 'Could not create the uploads folder. Make it writable on the server.');
        }
        $name = bin2hex(random_bytes(9)) . '.' . $kind;
        if (@file_put_contents($dir . '/' . $name, $bin) === false) {
            fail(500, 'Could not save the image. Check that /uploads is writable.');
        }
        $store->log("Uploaded image /uploads/$sub/$name");
        $store->save();
        respond(['url' => "/uploads/$sub/$name"], 201);
    }

    if ($is('GET', 'prompt-logs')) {
        require_admin($store);
        respond($db['prompt_logs']);
    }

    if ($is('POST', 'gemini/optimize')) {
        // Admin only: each call spends the site's Gemini API key
        require_admin($store);
        $prompt = trim((string)($body['prompt'] ?? ''));
        if ($prompt === '') {
            fail(400, 'Application concept prompt is empty.');
        }
        $settings = $db['system_settings'];
        $brand = str_cut($body['brandName'] ?? '', 200);
        $campaign = str_cut($body['campaignTitle'] ?? '', 200);
        $model = preg_replace('/[^a-zA-Z0-9.\-]/', '', (string)(($settings['modelSelection'] ?? '') ?: 'gemini-2.5-flash'));
        $apiKey = (string)(($settings['geminiApiKey'] ?? '') ?: $config['gemini_api_key']);
        $logEntry = function (string $response, string $status) use (&$db, $brand, $campaign, $prompt, $model) {
            array_unshift($db['prompt_logs'], [
                'id' => 'p-log-' . now_ms(),
                'timestamp' => gmdate('c'),
                'userPrompt' => 'Brand: ' . ($brand ?: 'N/A') . ', Campaign: ' . ($campaign ?: 'N/A') . '. Prompt: ' . str_cut($prompt, 4000),
                'aiResponse' => $response,
                'modelUsed' => $model,
                'status' => $status,
            ]);
            $db['prompt_logs'] = array_slice($db['prompt_logs'], 0, 100);
        };

        if ($apiKey === '') {
            $msg = 'Gemini API gateway is active but currently unconfigured. Please input an API key in the Admin Configuration Panel.';
            $logEntry($msg, 'error');
            $store->save();
            fail(404, $msg);
        }
        if (!function_exists('curl_init')) {
            fail(500, 'The PHP cURL extension is required for AI features.');
        }

        $userPrompt = "Brand Campaign context:\n- Brand: " . ($brand ?: 'Luxury Brand Partner') .
            "\n- Campaign: " . ($campaign ?: 'Autumn Runway Series') .
            "\n\nCreator's Raw Concept Draft:\n\"" . $prompt . "\"\n\n" .
            "Generate an upgraded 'Certified Haute Couture Creative Curation Proposal' that includes:\n" .
            "1. REFINED EDITORIAL NARRATIVE (An elegant title and short aesthetic premise)\n" .
            "2. VISUAL STYLE MOODBOARD DIRECTION (Color palettes, atmospheric lighting, and couture garment draping suggestions)\n" .
            "3. INTEGRATED OUTREACH STRATEGY (Specifically designed to showcase high engagement metrics)";
        $payload = [
            'contents' => [['parts' => [['text' => $userPrompt]]]],
            'systemInstruction' => ['parts' => [['text' => ($settings['aiSystemPrompt'] ?? '') ?: 'You are an experienced brand partnerships editor for Influencer Awards. Format the output in clean markdown under 280 words.']]],
            'generationConfig' => ['temperature' => (float)($settings['temperature'] ?? 0.7)],
        ];

        $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $apiKey],
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $result = is_string($response) ? json_decode($response, true) : null;
        $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if ($status !== 200 || $text === null) {
            $detail = $curlError ?: ($result['error']['message'] ?? ('HTTP ' . $status));
            $logEntry('Error: ' . $detail, 'error');
            $store->save();
            fail(502, $status === 429
                ? 'The FSIA AI Gateway is experiencing high traffic. Please wait a moment before re-optimizing.'
                : 'We encountered a temporary issue connecting to the FSIA AI engine: ' . $detail);
        }
        $logEntry($text, 'success');
        $store->save();
        respond(['success' => true, 'optimizedPitch' => debrand_text($text)]);
    }

    // ------------------------------------------------
    // 8. ADMIN DASHBOARD, AUDIT, BACKUP
    // ------------------------------------------------
    if ($is('GET', 'admin/stats')) {
        require_admin($store);
        $creatorsCount = 0;
        $reach = 0.0;
        foreach ($db['creators'] as $s) {
            foreach ($s['creators'] as $c) {
                $creatorsCount++;
                $r = (string)($c['stats']['reach'] ?? '0');
                $reach += (float)$r * (stripos($r, 'M') !== false ? 1000000 : 1000);
            }
        }
        $prompts = count($db['prompt_logs']);
        $ok = count(array_filter($db['prompt_logs'], function ($l) { return ($l['status'] ?? '') === 'success'; }));
        respond([
            'creatorsCount' => $creatorsCount,
            'categoriesCount' => count($db['creators']),
            'campaignsCount' => count($db['campaigns']),
            'applicationsCount' => count($db['registrations']),
            'influencerApplicationsCount' => count($db['influencer_applications']),
            'pendingApplicationsCount' => count(array_filter($db['influencer_applications'], function ($a) { return ($a['status'] ?? '') === 'pending'; })),
            'newLeadsCount' => count(array_filter($db['registrations'], function ($r) { return empty($r['status']) || $r['status'] === 'new'; })),
            'newEnquiriesCount' => count(array_filter($db['enquiries'], function ($e) { return ($e['status'] ?? '') === 'new'; })),
            'membershipPlansCount' => count($db['membership_plans']),
            'estimatedRosterReach' => number_format($reach / 1000000, 1, '.', '') . 'M',
            'totalPromptsCount' => $prompts,
            'apiSuccessRate' => $prompts > 0 ? (int)round($ok / $prompts * 100) : 100,
            'logs' => array_slice($db['admin_logs'], 0, 15),
        ]);
    }

    if ($is('GET', 'admin/logs')) {
        require_admin($store);
        respond($db['admin_logs']);
    }

    if ($is('GET', 'admin/backup')) {
        require_admin($store);
        $export = $db;
        unset($export['admin_users'], $export['sessions'], $export['login_attempts'], $export['submission_log']);
        unset($export['system_settings']['geminiApiKey']);
        $export['exportedAt'] = gmdate('c');
        $store->log('Downloaded full database backup');
        $store->save();
        header('Content-Disposition: attachment; filename="fsia-backup-' . date('Y-m-d') . '.json"');
        respond($export);
    }

    if ($is('POST', 'admin/restore')) {
        require_admin($store);
        if (!is_array($body['creators'] ?? null) || !is_array($body['campaigns'] ?? null)) {
            fail(400, 'This file does not look like an FSIA backup.');
        }
        $db['creators'] = $body['creators'];
        $db['campaigns'] = $body['campaigns'];
        foreach (['registrations', 'influencer_applications', 'prompt_logs', 'enquiries'] as $key) {
            $db[$key] = is_array($body[$key] ?? null) ? $body[$key] : [];
        }
        if (is_array($body['membership_plans'] ?? null)) {
            $db['membership_plans'] = $body['membership_plans'];
        }
        if (is_array($body['system_settings'] ?? null)) {
            $incoming = $body['system_settings'];
            unset($incoming['geminiApiKey']);
            $db['system_settings'] = array_merge($db['system_settings'], $incoming);
        }
        $store->log('Restored database from uploaded backup');
        $store->save();
        respond(['success' => true]);
    }

    if ($is('GET', 'health')) {
        respond(['ok' => true, 'backend' => 'php']);
    }

    fail(404, 'Endpoint not implemented: ' . $route);
} catch (HttpError $e) {
    respond(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    // Details go to the server error log only, never to the visitor
    error_log('FSIA API error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    respond(['error' => 'Something went wrong on our side. Please try again in a moment.'], 500);
}
