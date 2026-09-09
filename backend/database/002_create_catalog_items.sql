CREATE TABLE IF NOT EXISTS catalog_items (
  id VARCHAR(32) PRIMARY KEY,
  type ENUM('product', 'service') NOT NULL,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(60) NULL,
  description TEXT NULL,
  unit VARCHAR(30) NOT NULL DEFAULT 'piece',
  rate DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  hsn_sac VARCHAR(10) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_catalog_name (name),
  INDEX idx_catalog_code (code),
  INDEX idx_catalog_type_active (type, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
