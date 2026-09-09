CREATE TABLE IF NOT EXISTS subscriptions (
  account_id VARCHAR(32) PRIMARY KEY,
  plan_code ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  provider ENUM('google_play', 'admin') NULL,
  provider_subscription_id VARCHAR(190) NULL UNIQUE,
  purchase_token_hash CHAR(64) NULL,
  status ENUM('active', 'grace_period', 'paused', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  current_period_end DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
