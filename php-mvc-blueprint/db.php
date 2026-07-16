<?php
/**
 * FSIA VIP Influencer Platform
 * Secure Relational PDO Connection Manager
 */

class Database {
    private static $host = "127.0.0.1";
    private static $db_name = "fsia_vip_db";
    private static $username = "fsia_db_user";
    private static $password = ""; // Secure password loaded via environment
    private static $conn = null;

    /**
     * Connect to database using strict PDO configurations
     * 
     * @return PDO
     */
    public static function connect() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        // Try to load custom environment configurations
        if (getenv('DB_HOST')) self::$host = getenv('DB_HOST');
        if (getenv('DB_NAME')) self::$db_name = getenv('DB_NAME');
        if (getenv('DB_USER')) self::$username = getenv('DB_USER');
        if (getenv('DB_PASS')) self::$password = getenv('DB_PASS');

        $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db_name . ";charset=utf8mb4";
        
        try {
            self::$conn = new PDO($dsn, self::$username, self::$password, [
                // Set error mode to exceptions for clean try-catch handling
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                // Disable emulation of prepared statements to prevent advanced SQL injection tricks
                PDO::ATTR_EMULATE_PREPARES => false,
                // Default fetch mode as associative array
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Set connection encoding
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]);
            return self::$conn;
        } catch (PDOException $e) {
            // Log raw errors internally, never leak database system paths to client browsers
            error_log("FSIA DB Connection Fault: " . $e->getMessage());
            die(json_encode([
                "error" => "The database is temporarily offline. We are implementing security checks. Please try again soon."
            ]));
        }
    }
}
?>
