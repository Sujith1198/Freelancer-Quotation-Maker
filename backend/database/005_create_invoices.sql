CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(32) PRIMARY KEY, number VARCHAR(30) NOT NULL UNIQUE,
  quotation_id VARCHAR(32) NOT NULL UNIQUE, quotation_number VARCHAR(30) NOT NULL,
  customer_id VARCHAR(32) NOT NULL, customer_name VARCHAR(120) NOT NULL,
  customer_business VARCHAR(160) NULL, issue_date DATE NOT NULL, due_date DATE NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0, subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0, taxable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0, grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT NULL, terms TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  INDEX idx_invoice_customer (customer_id), INDEX idx_invoice_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(40) PRIMARY KEY, invoice_id VARCHAR(32) NOT NULL, line_order INT NOT NULL,
  catalog_item_id VARCHAR(32) NULL, name VARCHAR(160) NOT NULL, description TEXT NULL,
  quantity DECIMAL(14,3) NOT NULL, unit VARCHAR(30) NOT NULL, rate DECIMAL(14,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0, amount DECIMAL(14,2) NOT NULL,
  tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0, total DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_item_order (invoice_id, line_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
