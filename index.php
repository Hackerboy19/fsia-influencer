<?php
/**
 * FSIA VIP Influencer Platform
 * Master Full-Stack PHP Entrypoint & API Router
 */

// Configure header policies for modern security
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Determine routing URI path
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$uri = str_replace($basePath, '', $requestUri);
$uri = parse_url($uri, PHP_URL_PATH);
$uri = trim($uri, '/');

// Check if route is API
if (strpos($uri, 'api/') === 0) {
    header("Content-Type: application/json; charset=UTF-8");
    
    // Include PHP Controller blueprints
    require_once __DIR__ . '/php-mvc-blueprint/db.php';
    require_once __DIR__ . '/php-mvc-blueprint/AdminController.php';
    require_once __DIR__ . '/php-mvc-blueprint/CreatorController.php';
    require_once __DIR__ . '/php-mvc-blueprint/GeminiGateway.php';

    $apiRoute = substr($uri, 4); // Strip "api/"
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    try {
        $db = Database::connect();
        
        // LOGIN ENDPOINT
        if ($apiRoute === 'auth/login' && $method === 'POST') {
            $admin = new AdminController();
            $success = $admin->login($input['username'] ?? '', $input['password'] ?? '');
            if ($success) {
                echo json_encode([
                    "success" => true,
                    "token" => "fsia-admin-session-secure",
                    "username" => $_SESSION['admin_user'],
                    "message" => "Session authenticated successfully"
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Invalid credentials. Please verify your login details."]);
            }
            exit;
        }

        // CREATORS CRUD
        if ($apiRoute === 'creators') {
            if ($method === 'GET') {
                $ctrl = new CreatorController();
                echo json_encode($ctrl->getRunwayRoster());
            } elseif ($method === 'POST') {
                $ctrl = new CreatorController();
                $success = $ctrl->createCreator($input['sectionId'] ?? '', $input['creator'] ?? []);
                if ($success) {
                    http_response_code(201);
                    echo json_encode(["success" => true]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to store creator."]);
                }
            } elseif ($method === 'PUT') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                // Update creator details
                $sectionId = $input['sectionId'] ?? '';
                $originalName = $input['originalName'] ?? '';
                $updatedCreator = $input['updatedCreator'] ?? [];
                
                $stmt = $db->prepare("
                    UPDATE creators SET 
                        role = :role, 
                        city = :city, 
                        image_url = :image, 
                        bio = :bio, 
                        quote = :quote,
                        reach_metric = :reach,
                        engagement_metric = :engagement,
                        is_verified = :is_verified
                    WHERE section_id = :section_id AND name = :name
                ");
                $stmt->execute([
                    'role' => $updatedCreator['role'] ?? '',
                    'city' => $updatedCreator['city'] ?? '',
                    'image' => $updatedCreator['image'] ?? '',
                    'bio' => $updatedCreator['bio'] ?? '',
                    'quote' => $updatedCreator['quote'] ?? '',
                    'reach' => $updatedCreator['stats']['reach'] ?? '100K',
                    'engagement' => $updatedCreator['stats']['engagement'] ?? '5.0%',
                    'is_verified' => isset($updatedCreator['stats']['verified']) && $updatedCreator['stats']['verified'] ? 1 : 0,
                    'section_id' => $sectionId,
                    'name' => $originalName
                ]);
                
                $admin = new AdminController();
                $admin->logAction("Updated creator profile: " . $originalName, $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true]);
            }
            exit;
        }

        // DELETE CREATOR WITH REGEX-LIKE FALLBACK PARSING FOR ROUTE
        if (preg_match('/^creators\/([^\/]+)\/([^\/]+)$/', $apiRoute, $matches)) {
            if ($method === 'DELETE') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $sectionId = urldecode($matches[1]);
                $name = urldecode($matches[2]);
                
                $stmt = $db->prepare("DELETE FROM creators WHERE section_id = :section_id AND LOWER(name) = LOWER(:name)");
                $stmt->execute(['section_id' => $sectionId, 'name' => $name]);
                
                $admin = new AdminController();
                $admin->logAction("Deleted creator profile: " . $name . " from section: " . $sectionId, $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true, "message" => "Creator successfully expunged."]);
            }
            exit;
        }

        // SECTIONS CRUD
        if ($apiRoute === 'sections') {
            if ($method === 'POST') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $title = $input['title'] ?? '';
                $subtitle = $input['subtitle'] ?? 'Custom Runway Station';
                $primaryColor = $input['primaryColor'] ?? '#E1C699';
                $id = strtolower(preg_replace('/[^a-z0-9\-]/', '', str_replace(' ', '-', $title))) ?: 'cat-' . time();
                
                $stmt = $db->prepare("INSERT INTO gallery_sections (id, title, subtitle, primary_color, z_offset) VALUES (:id, :title, :subtitle, :primary_color, -24.00)");
                $stmt->execute([
                    'id' => $id,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'primary_color' => $primaryColor
                ]);
                
                $admin = new AdminController();
                $admin->logAction("Created custom catwalk category: " . $title, $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true, "section" => ["id" => $id, "title" => $title, "subtitle" => $subtitle, "primaryColor" => $primaryColor]]);
            }
            exit;
        }

        if (preg_match('/^sections\/([^\/]+)$/', $apiRoute, $matches)) {
            $id = urldecode($matches[1]);
            if ($method === 'DELETE') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $stmt = $db->prepare("DELETE FROM gallery_sections WHERE id = :id");
                $stmt->execute(['id' => $id]);
                
                $admin = new AdminController();
                $admin->logAction("Deleted catwalk category ID: " . $id, $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true, "message" => "Category successfully deleted."]);
            } elseif ($method === 'PUT') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $title = $input['title'] ?? '';
                $subtitle = $input['subtitle'] ?? '';
                $primaryColor = $input['primaryColor'] ?? '';
                
                $stmt = $db->prepare("UPDATE gallery_sections SET title = :title, subtitle = :subtitle, primary_color = :color WHERE id = :id");
                $stmt->execute([
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'color' => $primaryColor,
                    'id' => $id
                ]);
                
                $admin = new AdminController();
                $admin->logAction("Updated catwalk category: " . $title, $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true]);
            }
            exit;
        }

        // CAMPAIGNS CRUD
        if ($apiRoute === 'campaigns') {
            if ($method === 'GET') {
                $stmt = $db->query("SELECT * FROM campaigns ORDER BY created_at DESC");
                $campaigns = $stmt->fetchAll();
                
                $result = [];
                foreach ($campaigns as $camp) {
                    $perksStmt = $db->prepare("SELECT perk FROM campaign_perks WHERE campaign_id = :campaign_id");
                    $perksStmt->execute(['campaign_id' => $camp['id']]);
                    $perks = $perksStmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    $result[] = [
                        'id' => $camp['id'],
                        'brand' => $camp['brand'],
                        'title' => $camp['title'],
                        'niche' => $camp['niche'],
                        'budget' => $camp['budget'],
                        'requirements' => $camp['requirements'],
                        'duration' => $camp['duration'],
                        'location' => $camp['location'],
                        'description' => $camp['description'],
                        'perks' => $perks
                    ];
                }
                echo json_encode($result);
            } elseif ($method === 'POST') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $id = $input['id'] ?? 'camp-' . time();
                $stmt = $db->prepare("
                    INSERT INTO campaigns (id, brand, title, niche, budget, requirements, duration, location, description)
                    VALUES (:id, :brand, :title, :niche, :budget, :requirements, :duration, :location, :description)
                ");
                $stmt->execute([
                    'id' => $id,
                    'brand' => $input['brand'],
                    'title' => $input['title'],
                    'niche' => $input['niche'] ?? 'Fashion',
                    'budget' => $input['budget'] ?? 'Escrow Quote',
                    'requirements' => $input['requirements'] ?? 'Runway Walk',
                    'duration' => $input['duration'] ?? '1 Day',
                    'location' => $input['location'] ?? 'Mumbai',
                    'description' => $input['description'] ?? ''
                ]);
                
                if (!empty($input['perks']) && is_array($input['perks'])) {
                    $perkStmt = $db->prepare("INSERT INTO campaign_perks (campaign_id, perk) VALUES (:campaign_id, :perk)");
                    foreach ($input['perks'] as $perk) {
                        $perkStmt->execute(['campaign_id' => $id, 'perk' => $perk]);
                    }
                }
                
                $admin = new AdminController();
                $admin->logAction("Created Brand Campaign: " . $input['brand'], $_SERVER['REMOTE_ADDR']);
                echo json_encode(["success" => true]);
            }
            exit;
        }

        // REGISTRATIONS API
        if ($apiRoute === 'registrations') {
            if ($method === 'GET') {
                if (!AdminController::authorize()) {
                    http_response_code(401);
                    echo json_encode(["error" => "Unauthorized access."]);
                    exit;
                }
                $stmt = $db->query("SELECT * FROM registrations ORDER BY timestamp DESC");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $bookingId = "FSIA-VIP-" . rand(100000, 999999);
                $verificationHash = "0x" . strtoupper(bin2hex(random_bytes(4))) . "..." . strtoupper(bin2hex(random_bytes(2)));
                
                $stmt = $db->prepare("
                    INSERT INTO registrations (booking_id, brand_name, creator_name, budget, client_city, contact_email, contact_phone, gstin, scope, duration, verification_hash)
                    VALUES (:booking_id, :brand_name, :creator_name, :budget, :client_city, :contact_email, :contact_phone, :gstin, :scope, :duration, :verification_hash)
                ");
                $stmt->execute([
                    'booking_id' => $bookingId,
                    'brand_name' => $input['brandName'],
                    'creator_name' => $input['creatorName'] ?? 'All VIP Roster',
                    'budget' => $input['budget'] ?? 'Custom Escrow Quote',
                    'client_city' => $input['clientCity'] ?? 'Mumbai',
                    'contact_email' => $input['contactEmail'],
                    'contact_phone' => $input['contactPhone'],
                    'gstin' => $input['gstin'] ?? '',
                    'scope' => $input['scope'] ?? '',
                    'duration' => $input['duration'] ?? '',
                    'verification_hash' => $verificationHash
                ]);
                
                echo json_encode(["success" => true, "registration" => ["id" => $bookingId, "bookingId" => $bookingId, "verificationHash" => $verificationHash, "brandName" => $input['brandName']]]);
            }
            exit;
        }

        // DEFAULT ENDPOINT NOT FOUND
        http_response_code(404);
        echo json_encode(["error" => "Endpoint not implemented: " . $apiRoute]);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
        exit;
    }
}

// 2. OTHERWISE, SERVE FRONTEND REACT BUILD (dist/)
$distPath = __DIR__ . '/dist';
$filePath = $distPath . '/' . $uri;

if (!empty($uri) && file_exists($filePath) && is_file($filePath)) {
    // Serve static asset with correct Mime Type
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'json' => 'application/json',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
    ];
    if (isset($mimeTypes[$ext])) {
        header("Content-Type: " . $mimeTypes[$ext]);
    }
    readfile($filePath);
    exit;
}

// Default fallback to index.html for Single-Page Application Router
if (file_exists($distPath . '/index.html')) {
    readfile($distPath . '/index.html');
} else {
    echo "<h1>FSIA VIP Influencer Platform</h1><p>Vite development build is active. Run <code>npm run build</code> to generate production-ready static assets served by PHP.</p>";
}
