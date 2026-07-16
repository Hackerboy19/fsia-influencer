<?php
/**
 * FSIA VIP Influencer Platform
 * Secure Administrative MVC Controller with Session Curation
 */

require_once 'db.php';

class AdminController {
    
    /**
     * Authenticate Admin User
     */
    public function login($username, $password) {
        $db = Database::connect();
        
        // Always sanitize and filter incoming authentication strings
        $username = trim(filter_var($username, FILTER_SANITIZE_SPECIAL_CHARS));
        
        $stmt = $db->prepare("SELECT id, username, password_hash FROM admin_users WHERE username = :username LIMIT 1");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // Re-hash password if algorithm settings upgraded
            if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $updateStmt = $db->prepare("UPDATE admin_users SET password_hash = :hash WHERE id = :id");
                $updateStmt->execute(['hash' => $newHash, 'id' => $user['id']]);
            }
            
            // Establish secure session
            if (session_status() == PHP_SESSION_NONE) {
                // Configure secure session cookie policies
                session_start([
                    'cookie_httponly' => true,
                    'cookie_secure' => isset($_SERVER['HTTPS']),
                    'cookie_samesite' => 'Strict'
                ]);
            }
            
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user'] = $user['username'];
            $_SESSION['session_fingerprint'] = md5($_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR']);
            
            $this->logAction("Successful administrative login.", $_SERVER['REMOTE_ADDR']);
            return true;
        }
        
        $this->logAction("Failed login attempt for username: " . $username, $_SERVER['REMOTE_ADDR']);
        return false;
    }
    
    /**
     * Check Session Integrity and Hijacking Mitigation
     */
    public static function authorize() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            return false;
        }
        
        // Verify session fingerprint to mitigate session hijacking
        $fingerprint = md5($_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR']);
        if ($fingerprint !== $_SESSION['session_fingerprint']) {
            self::logout();
            return false;
        }
        
        return true;
    }
    
    /**
     * Secure Session Termination
     */
    public static function logout() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }
    
    /**
     * Log Administrative Actions
     */
    public function logAction($action, $ip) {
        try {
            $db = Database::connect();
            $stmt = $db->prepare("INSERT INTO admin_audit_logs (action_taken, ip_address) VALUES (:action, :ip)");
            $stmt->execute([
                'action' => substr($action, 0, 250),
                'ip' => $ip
            ]);
        } catch (Exception $e) {
            // Avoid failing primary flow due to logger errors
            error_log("Failed to write audit log: " . $e->getMessage());
        }
    }
}
?>
