ALTER TABLE accounts ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER status;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_settings (setting_key,setting_value) VALUES
('monthly_price_inr','199'),('yearly_price_inr','1999')
ON DUPLICATE KEY UPDATE setting_value=setting_value;

-- After registering your owner account, promote only that verified email:
-- UPDATE accounts SET role='admin' WHERE email='owner@example.com';
