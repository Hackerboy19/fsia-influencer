<?php
/**
 * JSON-file database with exclusive locking.
 * Mirrors server/db.ts so both backends share the same data shape.
 */
class Store
{
    private string $file;
    private string $seedFile;
    private $lock = null;
    private ?array $data = null;

    public function __construct(string $dir, string $seedFile)
    {
        if (!is_dir($dir) && !@mkdir($dir, 0750, true)) {
            throw new RuntimeException('Storage directory is not writable: ' . $dir);
        }
        $this->file = rtrim($dir, '/') . '/db.json';
        $this->seedFile = $seedFile;
        $this->lock = fopen(rtrim($dir, '/') . '/db.lock', 'c');
        if (!$this->lock || !flock($this->lock, LOCK_EX)) {
            throw new RuntimeException('Unable to lock the storage directory.');
        }
    }

    public function __destruct()
    {
        if ($this->lock) {
            flock($this->lock, LOCK_UN);
            fclose($this->lock);
        }
    }

    public function &data(): array
    {
        if ($this->data === null) {
            $this->data = $this->load();
        }
        return $this->data;
    }

    private function load(): array
    {
        if (!file_exists($this->file)) {
            $data = $this->seed();
            $this->data = $data;
            $this->save();
            return $data;
        }
        $data = json_decode((string)file_get_contents($this->file), true);
        if (!is_array($data)) {
            // Never silently wipe a corrupt database: keep a copy for manual recovery
            @copy($this->file, $this->file . '.corrupt-' . time());
            $data = $this->seed();
            $this->data = $data;
            $this->save();
            return $data;
        }
        $seed = null;
        foreach (['creators', 'campaigns', 'registrations', 'admin_logs', 'prompt_logs', 'influencer_applications', 'sessions', 'enquiries', 'settings_history'] as $key) {
            if (!isset($data[$key]) || !is_array($data[$key])) {
                $data[$key] = [];
            }
        }
        if (empty($data['admin_users']) || empty($data['membership_plans']) || empty($data['system_settings'])) {
            $seed = $this->seed();
            foreach (['admin_users', 'membership_plans', 'system_settings'] as $key) {
                if (empty($data[$key])) {
                    $data[$key] = $seed[$key];
                }
            }
        }
        if (empty($data['migrations']['debrand_v1'])) {
            // Settings still on the old default copy get the new defaults; customised text is only debranded
            $oldDefaults = [
                'websiteTitle' => ['FSIA — Forever Star India Awards', 'FSIA Creators & Influencer Portal'],
                'heroTitle' => ['FOREVER STAR INDIA', 'FSIA INFLUENCER'],
                'heroSubtitle' => ['THE EXQUISITE HALL OF LUXURY INFLUENCING & PRESTIGE COUTURE', 'Connect with verified creators, launch brand campaigns and grow your influence.'],
                'ctaText' => ['SECURE VIP RUNWAY ACCESS', 'EXPLORE THE PORTAL'],
                'footerText' => ['© 2026 FOREVER STAR INDIA AWARDS (FSIA). ALL RIGHTS RESERVED.', '© 2026 FSIA Influencer. All rights reserved.'],
            ];
            foreach ($oldDefaults as $field => [$before, $after]) {
                if (($data['system_settings'][$field] ?? null) === $before) {
                    $data['system_settings'][$field] = $after;
                }
            }
            foreach (['creators', 'campaigns', 'membership_plans', 'system_settings'] as $key) {
                $data[$key] = debrand_value($data[$key]);
            }
            $data['migrations']['debrand_v1'] = gmdate('c');
            $this->data = $data;
            $this->save();
        }
        if (empty($data['migrations']['debrand_v2'])) {
            // v2 rules are case-insensitive (v1 only matched capitalised spellings)
            foreach (['creators', 'campaigns', 'membership_plans', 'system_settings'] as $key) {
                $data[$key] = debrand_value($data[$key]);
            }
            $data['migrations']['debrand_v2'] = gmdate('c');
            $this->data = $data;
            $this->save();
        }
        if (empty($data['migrations']['debrand_v3'])) {
            // v3: "Forever" is removed again and the site is "FSIA Influencer"
            foreach (['creators', 'campaigns', 'membership_plans', 'system_settings'] as $key) {
                $data[$key] = debrand_value($data[$key]);
            }
            $data['migrations']['debrand_v3'] = gmdate('c');
            $this->data = $data;
            $this->save();
        }
        if (empty($data['migrations']['debrand_v4'])) {
            // v4: the award is separate from FSIA, so stored "FSIA" names are rewritten too
            foreach (['creators', 'campaigns', 'membership_plans', 'system_settings'] as $key) {
                $data[$key] = debrand_value($data[$key]);
            }
            $data['migrations']['debrand_v4'] = gmdate('c');
            $this->data = $data;
            $this->save();
        }
        return $data;
    }

    private function seed(): array
    {
        $seed = json_decode((string)@file_get_contents($this->seedFile), true);
        if (!is_array($seed)) {
            throw new RuntimeException('Seed data (api/seed.json) is missing or invalid.');
        }
        $config = fsia_config();
        if (!empty($config['admin_username']) && !empty($config['admin_password'])) {
            $seed['admin_users'] = [[
                'username' => $config['admin_username'],
                'passwordHash' => password_hash($config['admin_password'], PASSWORD_DEFAULT),
                'createdAt' => gmdate('c'),
            ]];
        }
        if (!empty($config['gemini_api_key'])) {
            $seed['system_settings']['geminiApiKey'] = $config['gemini_api_key'];
        }
        $seed['sessions'] = [];
        $seed['admin_logs'] = [[
            'id' => 'log-' . round(microtime(true) * 1000),
            'timestamp' => gmdate('c'),
            'action' => 'System initialized with base VIP runway assets.',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        ]];
        return $seed;
    }

    public function save(): void
    {
        $tmp = $this->file . '.tmp';
        $json = json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || file_put_contents($tmp, $json) === false || !rename($tmp, $this->file)) {
            throw new RuntimeException('Failed to write the database file.');
        }
    }

    public function log(string $action): void
    {
        $data = &$this->data();
        array_unshift($data['admin_logs'], [
            'id' => 'log-' . round(microtime(true) * 1000) . '-' . random_int(0, 999),
            'timestamp' => gmdate('c'),
            'action' => str_cut($action, 500),
            'ip' => client_ip(),
        ]);
        $data['admin_logs'] = array_slice($data['admin_logs'], 0, 500);
    }
}
