-- Index for category analytics queries
CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON transactions (user_id, type, category, date DESC);
