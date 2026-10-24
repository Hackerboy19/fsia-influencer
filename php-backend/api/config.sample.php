<?php
/**
 * Forever Influencer — PHP backend configuration.
 *
 * Copy this file to config.php (same folder) and adjust. Every value is
 * optional; config.php is never overwritten by a redeploy.
 */
return [
    // Where the JSON database lives. Keep it outside public_html when your host
    // allows it, e.g. dirname(__DIR__, 2) . '/fsia-storage'.
    'storage_dir' => dirname(__DIR__) . '/storage',

    // Gemini API key used by /api/gemini/optimize when none is saved in the admin panel.
    'gemini_api_key' => '',

    // Initial operator account, only used when the database is created for the first time.
    // If left empty the default is admin / admin123 and the panel asks you to change it.
    'admin_username' => '',
    'admin_password' => '',

    // Admin session lifetime in seconds.
    'session_ttl' => 12 * 3600,
];
