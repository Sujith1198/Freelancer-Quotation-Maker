CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(32) PRIMARY KEY, number VARCHAR(30) NOT NULL UNIQUE, customer_id VARCHAR(32) NOT NULL,
  customer_name VARCHAR(120) NOT NULL, customer_business VARCHAR(160) NULL,
  issue_date DATE NOT NULL, valid_until DATE NOT NULL,
  status ENUM('Draft','Sent','Accepted','Rejected') NOT NULL DEFAULT 'Draft',
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0, subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0, taxable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0, grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT NULL, terms TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_quotation_customer (customer_id), INDEX idx_quotation_status_date (status, issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotation_items (
  id VARCHAR(40) PRIMARY KEY, quotation_id VARCHAR(32) NOT NULL, line_order INT NOT NULL,
  catalog_item_id VARCHAR(32) NULL, name VARCHAR(160) NOT NULL, description TEXT NULL,
  quantity DECIMAL(14,3) NOT NULL, unit VARCHAR(30) NOT NULL, rate DECIMAL(14,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0, amount DECIMAL(14,2) NOT NULL,
  tax_amount DECIMAL(14,2) NOT NULL, total DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotation_items_header FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  INDEX idx_quotation_items_header (quotation_id, line_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
