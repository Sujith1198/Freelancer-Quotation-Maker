CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id VARCHAR(64) PRIMARY KEY,
  source_type ENUM('Quotation', 'Invoice') NOT NULL,
  source_id VARCHAR(32) NOT NULL,
  document_number VARCHAR(30) NOT NULL,
  customer_id VARCHAR(32) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reminder_source (source_type, source_id),
  INDEX idx_reminder_schedule (completed_at, scheduled_at),
  INDEX idx_reminder_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
