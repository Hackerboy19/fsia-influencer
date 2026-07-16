<?php
/**
 * FSIA VIP Influencer Platform
 * Secure Creator CRUD and Runway Controller
 */

require_once 'db.php';
require_once 'AdminController.php';

class CreatorController {
    
    /**
     * Get All Runway Sections and associated Creators (Rich Relational Join)
     */
    public function getRunwayRoster() {
        $db = Database::connect();
        
        // Fetch all sections
        $sectionsStmt = $db->query("SELECT * FROM gallery_sections ORDER BY z_offset DESC");
        $sections = $sectionsStmt->fetchAll();
        
        $roster = [];
        foreach ($sections as $section) {
            // Fetch creators belonging to this runway section
            $creatorStmt = $db->prepare("SELECT * FROM creators WHERE section_id = :section_id");
            $creatorStmt->execute(['section_id' => $section['id']]);
            $creators = $creatorStmt->fetchAll();
            
            $formattedCreators = [];
            foreach ($creators as $creator) {
                // Fetch portfolio sub-relations
                $portfolioStmt = $db->prepare("SELECT image_url FROM creator_portfolio WHERE creator_id = :creator_id");
                $portfolioStmt->execute(['creator_id' => $creator['id']]);
                $portfolio = $portfolioStmt->fetchAll(PDO::FETCH_COLUMN);
                
                $formattedCreators[] = [
                    'name' => $creator['name'],
                    'role' => $creator['role'],
                    'city' => $creator['city'],
                    'image' => $creator['image_url'],
                    'bio' => $creator['bio'],
                    'stats' => [
                        'reach' => $creator['reach_metric'],
                        'engagement' => $creator['engagement_metric'],
                        'verified' => (bool)$creator['is_verified']
                    ],
                    'quote' => $creator['quote'],
                    'portfolio' => $portfolio
                ];
            }
            
            $roster[] = [
                'id' => $section['id'],
                'title' => $section['title'],
                'subtitle' => $section['subtitle'],
                'zOffset' => (float)$section['z_offset'],
                'primaryColor' => $section['primary_color'],
                'creators' => $formattedCreators
            ];
        }
        
        return $roster;
    }
    
    /**
     * Create a New Creator Profile (Requires Admin Session)
     */
    public function createCreator($sectionId, $data) {
        if (!AdminController::authorize()) {
            throw new Exception("Unauthorized administration call.");
        }
        
        $db = Database::connect();
        $db->beginTransaction();
        
        try {
            // Prepared statements to strictly lock SQL parameters
            $stmt = $db->prepare("
                INSERT INTO creators (section_id, name, role, city, image_url, bio, quote, reach_metric, engagement_metric, is_verified) 
                VALUES (:section_id, :name, :role, :city, :image_url, :bio, :quote, :reach, :engagement, :is_verified)
            ");
            
            $stmt->execute([
                'section_id' => filter_var($sectionId, FILTER_SANITIZE_SPECIAL_CHARS),
                'name' => filter_var($data['name'], FILTER_SANITIZE_SPECIAL_CHARS),
                'role' => filter_var($data['role'], FILTER_SANITIZE_SPECIAL_CHARS),
                'city' => filter_var($data['city'], FILTER_SANITIZE_SPECIAL_CHARS),
                'image_url' => filter_var($data['image'], FILTER_VALIDATE_URL) ? $data['image'] : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
                'bio' => filter_var($data['bio'], FILTER_SANITIZE_SPECIAL_CHARS),
                'quote' => filter_var($data['quote'], FILTER_SANITIZE_SPECIAL_CHARS),
                'reach' => filter_var($data['stats']['reach'] ?? '100K', FILTER_SANITIZE_SPECIAL_CHARS),
                'engagement' => filter_var($data['stats']['engagement'] ?? '5.0%', FILTER_SANITIZE_SPECIAL_CHARS),
                'is_verified' => isset($data['stats']['verified']) && $data['stats']['verified'] ? 1 : 0
            ]);
            
            $creatorId = $db->lastInsertId();
            
            // Inset portfolio images
            if (!empty($data['portfolio']) && is_array($data['portfolio'])) {
                $portStmt = $db->prepare("INSERT INTO creator_portfolio (creator_id, image_url) VALUES (:creator_id, :image_url)");
                foreach ($data['portfolio'] as $imageUrl) {
                    if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                        $portStmt->execute([
                            'creator_id' => $creatorId,
                            'image_url' => $imageUrl
                        ]);
                    }
                }
            }
            
            $db->commit();
            
            $admin = new AdminController();
            $admin->logAction("Added creator " . $data['name'] . " via PHP CRUD Desk.", $_SERVER['REMOTE_ADDR']);
            return true;
        } catch (Exception $e) {
            $db->rollBack();
            error_log("Creator Creation Error: " . $e->getMessage());
            return false;
        }
    }
}
?>
