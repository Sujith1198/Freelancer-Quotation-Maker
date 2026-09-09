CREATE TABLE IF NOT EXISTS quotation_payments (
  quotation_id VARCHAR(32) PRIMARY KEY,
  status ENUM('Unpaid', 'Partial', 'Paid') NOT NULL DEFAULT 'Unpaid',
  amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0,
  transaction_reference VARCHAR(120) NULL,
  paid_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_quotation FOREIGN KEY (quotation_id)
    REFERENCES quotations(id) ON DELETE CASCADE,
  INDEX idx_payment_status (status),
  INDEX idx_payment_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
