-- FSIA VIP INFLUENCER GALLERY
-- Relational MySQL Database Schema
-- Production Ready UTF-8 Character Set

CREATE DATABASE IF NOT EXISTS fsia_vip_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fsia_vip_db;

-- 1. Administrative Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Runway Sections / Categories Table
CREATE TABLE IF NOT EXISTS gallery_sections (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    z_offset DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    primary_color VARCHAR(20) NOT NULL DEFAULT '#E1C699',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Dynamic Creators / Runway Models Table
CREATE TABLE IF NOT EXISTS creators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    bio TEXT NOT NULL,
    quote VARCHAR(500) NOT NULL,
    reach_metric VARCHAR(20) NOT NULL DEFAULT '100K',
    engagement_metric VARCHAR(10) NOT NULL DEFAULT '5.0%',
    is_verified TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES gallery_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Creator Portfolio Images Table (One-To-Many relationship)
CREATE TABLE IF NOT EXISTS creator_portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Dynamic Brand Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(50) PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    budget VARCHAR(50) NOT NULL,
    requirements VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Campaign Perks Table (One-To-Many relationship)
CREATE TABLE IF NOT EXISTS campaign_perks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL,
    perk VARCHAR(255) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. VIP Registrations / Applications Table (CRM logs)
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(30) NOT NULL UNIQUE,
    brand_name VARCHAR(100) NOT NULL,
    creator_name VARCHAR(100) NOT NULL DEFAULT 'All VIP Roster',
    budget VARCHAR(50) NOT NULL,
    client_city VARCHAR(100) NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    gstin VARCHAR(50) NULL,
    scope VARCHAR(255) NULL,
    duration VARCHAR(50) NULL,
    verification_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_taken VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL
) ENGINE=InnoDB;


-- SEED INITIAL SECTIONS
INSERT INTO gallery_sections (id, title, subtitle, z_offset, primary_color) VALUES
('miss-india', 'Forever Miss India 2026', 'The Reign of Couture & Prestige', 0.00, '#E1C699'),
('super-hero', 'Super Hero Awards', 'Visionary Social Impact & Leadership', -8.00, '#A3B18A'),
('verified-influencers', 'Verified VIP Influencers', 'The Standard of Modern Digital Authority', -16.00, '#C5C3C0');

-- SEED INITIAL ADMIN USER (Default username: "admin", Password: "admin123" securely hashed via password_hash)
-- Password Hash below is generated with PASSWORD_DEFAULT
INSERT INTO admin_users (username, password_hash) VALUES
('admin', '$2y$10$tZreXyZfe6Pz3.rGshI1O.XitpExYf.C/u7B2CAn9D8Iq8K90T1H6');
