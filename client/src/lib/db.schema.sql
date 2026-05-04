-- ═══════════════════════════════════════════════════════════════════════════════
-- Odoo 19 POS Mobile App — Local SQLite Database Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- This schema supports:
-- • Offline mode (complete product/customer/order data)
-- • Sync queue (pending operations)
-- • Local caching (API responses)
-- • Session management
-- • Audit trail (sync history)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── System Tables ────────────────────────────────────────────────────────────

/**
 * app_config: Application configuration and metadata
 */
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  data_type TEXT DEFAULT 'string', -- string, number, boolean, json
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

/**
 * app_session: User session information
 */
CREATE TABLE IF NOT EXISTS app_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  database TEXT NOT NULL,
  server_url TEXT NOT NULL,
  session_token TEXT UNIQUE,
  authenticated_at DATETIME NOT NULL,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_session_user_id ON app_session(user_id);
CREATE INDEX IF NOT EXISTS idx_app_session_is_active ON app_session(is_active);

/**
 * sync_queue: Pending operations to sync with Odoo server
 */
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT UNIQUE NOT NULL, -- UUID for deduplication
  model TEXT NOT NULL,               -- e.g., 'pos.order', 'res.partner'
  operation_type TEXT NOT NULL,      -- 'create', 'write', 'unlink', 'call'
  record_id INTEGER,                 -- Odoo record ID (NULL for create)
  local_id TEXT,                     -- Local temporary ID for new records
  payload TEXT NOT NULL,             -- JSON data
  status TEXT DEFAULT 'pending',     -- pending, processing, completed, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_model ON sync_queue(model);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at DESC);

/**
 * sync_history: Record of completed syncs
 */
CREATE TABLE IF NOT EXISTS sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_batch_id TEXT UNIQUE NOT NULL,
  total_operations INTEGER,
  successful_operations INTEGER,
  failed_operations INTEGER,
  duration_ms INTEGER,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NOT NULL,
  error_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_history_completed_at ON sync_history(completed_at DESC);

/**
 * cache_entries: API response caching
 */
CREATE TABLE IF NOT EXISTS cache_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  model TEXT,
  method TEXT,
  data TEXT NOT NULL,                -- JSON data
  ttl_seconds INTEGER DEFAULT 300,   -- 5 minutes default
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_model ON cache_entries(model);

-- ─── Product Catalog ──────────────────────────────────────────────────────────

/**
 * product_category: Product categories
 */
CREATE TABLE IF NOT EXISTS product_category (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER,
  display_name TEXT,
  is_synced BOOLEAN DEFAULT 1,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_category(id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_parent_id ON product_category(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_category_name ON product_category(name);

/**
 * product: Product information
 */
CREATE TABLE IF NOT EXISTS product (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  default_code TEXT,                 -- SKU
  barcode TEXT UNIQUE,
  category_id INTEGER,
  type TEXT DEFAULT 'product',       -- product, service, consumable
  list_price REAL NOT NULL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  description TEXT,
  image_data BLOB,                   -- Base64 encoded image
  uom_id INTEGER,                    -- Unit of measure
  active BOOLEAN DEFAULT 1,
  tracking TEXT DEFAULT 'none',      -- none, lot, serial
  weight REAL DEFAULT 0,
  volume REAL DEFAULT 0,
  is_synced BOOLEAN DEFAULT 1,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_category(id)
);

CREATE INDEX IF NOT EXISTS idx_product_barcode ON product(barcode);
CREATE INDEX IF NOT EXISTS idx_product_default_code ON product(default_code);
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_active ON product(active);
CREATE INDEX IF NOT EXISTS idx_product_name ON product(name);

/**
 * product_tax: Taxes applicable to products
 */
CREATE TABLE IF NOT EXISTS product_tax (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  tax_id INTEGER NOT NULL,
  tax_name TEXT,
  tax_amount REAL,
  tax_type TEXT,                     -- percent, fixed
  is_synced BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_tax_product_id ON product_tax(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tax_tax_id ON product_tax(tax_id);

/**
 * product_stock: Local stock information
 */
CREATE TABLE IF NOT EXISTS product_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER UNIQUE NOT NULL,
  quantity_on_hand REAL DEFAULT 0,
  quantity_reserved REAL DEFAULT 0,
  quantity_available REAL DEFAULT 0,
  last_updated DATETIME,
  is_synced BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_stock_product_id ON product_stock(product_id);

-- ─── Customer Management ──────────────────────────────────────────────────────

/**
 * customer: Customer/Partner information
 */
CREATE TABLE IF NOT EXISTS customer (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  vat_id TEXT,
  customer_rank INTEGER DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT 1,
  is_synced BOOLEAN DEFAULT 1,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer(name);
CREATE INDEX IF NOT EXISTS idx_customer_active ON customer(active);

/**
 * customer_loyalty: Loyalty points and tier information
 */
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER UNIQUE NOT NULL,
  points REAL DEFAULT 0,
  tier TEXT DEFAULT 'bronze',        -- bronze, silver, gold, platinum
  total_spent REAL DEFAULT 0,
  last_purchase_date DATETIME,
  is_synced BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);

-- ─── Orders & Transactions ────────────────────────────────────────────────────

/**
 * pos_order: Point of Sale orders
 */
CREATE TABLE IF NOT EXISTS pos_order (
  id INTEGER PRIMARY KEY,
  local_id TEXT UNIQUE,              -- Local temp ID before sync
  session_id INTEGER,
  customer_id INTEGER,
  order_date DATETIME NOT NULL,
  status TEXT DEFAULT 'draft',       -- draft, paid, invoiced, cancelled
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  amount_return REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  notes TEXT,
  receipt_printed BOOLEAN DEFAULT 0,
  receipt_emailed BOOLEAN DEFAULT 0,
  is_synced BOOLEAN DEFAULT 0,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customer(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_session_id ON pos_order(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_customer_id ON pos_order(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_status ON pos_order(status);
CREATE INDEX IF NOT EXISTS idx_pos_order_order_date ON pos_order(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_pos_order_is_synced ON pos_order(is_synced);

/**
 * pos_order_line: Individual line items in orders
 */
CREATE TABLE IF NOT EXISTS pos_order_line (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  line_total_incl_tax REAL NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES pos_order(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES product(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_line_order_id ON pos_order_line(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_line_product_id ON pos_order_line(product_id);

/**
 * pos_payment: Payment records for orders
 */
CREATE TABLE IF NOT EXISTS pos_payment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  payment_method TEXT NOT NULL,      -- cash, card, mobile, check
  amount REAL NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  reference_number TEXT,             -- For card/check/mobile payments
  card_type TEXT,                    -- visa, mastercard, amex
  card_last_four TEXT,
  is_change BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'completed',   -- completed, pending, failed, refunded
  is_synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES pos_order(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pos_payment_order_id ON pos_payment(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_payment_payment_method ON pos_payment(payment_method);

/**
 * pos_session: POS session tracking
 */
CREATE TABLE IF NOT EXISTS pos_session (
  id INTEGER PRIMARY KEY,
  session_name TEXT NOT NULL,
  config_id INTEGER,
  user_id INTEGER,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  status TEXT DEFAULT 'open',        -- open, closed, suspended
  opening_balance REAL DEFAULT 0,
  closing_balance REAL,
  total_sales REAL DEFAULT 0,
  total_returns REAL DEFAULT 0,
  is_synced BOOLEAN DEFAULT 0,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_session_status ON pos_session(status);
CREATE INDEX IF NOT EXISTS idx_pos_session_start_time ON pos_session(start_time DESC);

-- ─── Taxes & Pricing ──────────────────────────────────────────────────────────

/**
 * tax: Tax configuration
 */
CREATE TABLE IF NOT EXISTS tax (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  tax_type TEXT,                     -- percent, fixed
  amount REAL NOT NULL,
  active BOOLEAN DEFAULT 1,
  is_synced BOOLEAN DEFAULT 1,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_active ON tax(active);

/**
 * pricelist: Pricing rules
 */
CREATE TABLE IF NOT EXISTS pricelist (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  active BOOLEAN DEFAULT 1,
  is_synced BOOLEAN DEFAULT 1,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

/**
 * pricelist_item: Individual pricing rules
 */
CREATE TABLE IF NOT EXISTS pricelist_item (
  id INTEGER PRIMARY KEY,
  pricelist_id INTEGER NOT NULL,
  product_id INTEGER,
  category_id INTEGER,
  min_quantity REAL DEFAULT 1,
  price_override REAL,
  discount_percent REAL,
  discount_fixed REAL,
  is_synced BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pricelist_id) REFERENCES pricelist(id),
  FOREIGN KEY (product_id) REFERENCES product(id),
  FOREIGN KEY (category_id) REFERENCES product_category(id)
);

CREATE INDEX IF NOT EXISTS idx_pricelist_item_pricelist_id ON pricelist_item(pricelist_id);
CREATE INDEX IF NOT EXISTS idx_pricelist_item_product_id ON pricelist_item(product_id);

-- ─── Audit & Logging ──────────────────────────────────────────────────────────

/**
 * audit_log: Audit trail for all operations
 */
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,              -- create, read, update, delete, sync
  model TEXT,
  record_id INTEGER,
  old_values TEXT,                   -- JSON
  new_values TEXT,                   -- JSON
  ip_address TEXT,
  device_info TEXT,
  status TEXT DEFAULT 'success',     -- success, error
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

/**
 * error_log: Application error tracking
 */
CREATE TABLE IF NOT EXISTS error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context TEXT,                      -- JSON context
  severity TEXT DEFAULT 'error',     -- debug, info, warning, error, critical
  resolved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_error_log_severity ON error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);

-- ─── Inventory Management ─────────────────────────────────────────────────────

/**
 * inventory_move: Stock movements
 */
CREATE TABLE IF NOT EXISTS inventory_move (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  from_location TEXT,
  to_location TEXT,
  quantity REAL NOT NULL,
  move_type TEXT,                    -- in, out, adjustment, return
  reference TEXT,
  notes TEXT,
  is_synced BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_move_product_id ON inventory_move(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_move_move_type ON inventory_move(move_type);

-- ─── Settings & Preferences ───────────────────────────────────────────────────

/**
 * user_preferences: User-specific settings
 */
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

/**
 * app_settings: Global application settings
 */
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  data_type TEXT DEFAULT 'string',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- ─── Views for Common Queries ─────────────────────────────────────────────────

/**
 * View: Recent orders with customer info
 */
CREATE VIEW IF NOT EXISTS v_recent_orders AS
SELECT
  po.id,
  po.local_id,
  po.order_date,
  po.total_amount,
  po.status,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(pol.id) as line_count
FROM pos_order po
LEFT JOIN customer c ON po.customer_id = c.id
LEFT JOIN pos_order_line pol ON po.id = pol.order_id
GROUP BY po.id
ORDER BY po.order_date DESC;

/**
 * View: Pending sync operations
 */
CREATE VIEW IF NOT EXISTS v_pending_sync AS
SELECT
  id,
  operation_id,
  model,
  operation_type,
  record_id,
  status,
  retry_count,
  created_at
FROM sync_queue
WHERE status IN ('pending', 'failed')
ORDER BY created_at ASC;

/**
 * View: Product inventory status
 */
CREATE VIEW IF NOT EXISTS v_product_inventory AS
SELECT
  p.id,
  p.name,
  p.default_code,
  p.barcode,
  p.list_price,
  ps.quantity_on_hand,
  ps.quantity_reserved,
  ps.quantity_available,
  pc.name as category_name
FROM product p
LEFT JOIN product_stock ps ON p.id = ps.product_id
LEFT JOIN product_category pc ON p.category_id = pc.id
WHERE p.active = 1;

/**
 * View: Daily sales summary
 */
CREATE VIEW IF NOT EXISTS v_daily_sales AS
SELECT
  DATE(po.order_date) as sale_date,
  COUNT(po.id) as order_count,
  SUM(po.total_amount) as total_sales,
  SUM(po.tax_amount) as total_tax,
  AVG(po.total_amount) as avg_order_value
FROM pos_order po
WHERE po.status IN ('paid', 'invoiced')
GROUP BY DATE(po.order_date)
ORDER BY sale_date DESC;

-- ─── Triggers for Audit Trail ─────────────────────────────────────────────────

/**
 * Trigger: Log product updates
 */
CREATE TRIGGER IF NOT EXISTS tr_product_update
AFTER UPDATE ON product
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (action, model, record_id, old_values, new_values)
  VALUES (
    'update',
    'product',
    NEW.id,
    json_object(
      'name', OLD.name,
      'list_price', OLD.list_price,
      'active', OLD.active
    ),
    json_object(
      'name', NEW.name,
      'list_price', NEW.list_price,
      'active', NEW.active
    )
  );
END;

/**
 * Trigger: Log order creation
 */
CREATE TRIGGER IF NOT EXISTS tr_pos_order_insert
AFTER INSERT ON pos_order
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (action, model, record_id, new_values)
  VALUES (
    'create',
    'pos_order',
    NEW.id,
    json_object(
      'customer_id', NEW.customer_id,
      'total_amount', NEW.total_amount,
      'status', NEW.status
    )
  );
END;

/**
 * Trigger: Update pos_order total when line items change
 */
CREATE TRIGGER IF NOT EXISTS tr_pos_order_line_insert
AFTER INSERT ON pos_order_line
FOR EACH ROW
BEGIN
  UPDATE pos_order
  SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM pos_order_line WHERE order_id = NEW.order_id),
    tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM pos_order_line WHERE order_id = NEW.order_id),
    total_amount = (SELECT COALESCE(SUM(line_total_incl_tax), 0) FROM pos_order_line WHERE order_id = NEW.order_id),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.order_id;
END;

/**
 * Trigger: Update pos_order total when line items are deleted
 */
CREATE TRIGGER IF NOT EXISTS tr_pos_order_line_delete
AFTER DELETE ON pos_order_line
FOR EACH ROW
BEGIN
  UPDATE pos_order
  SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM pos_order_line WHERE order_id = OLD.order_id),
    tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM pos_order_line WHERE order_id = OLD.order_id),
    total_amount = (SELECT COALESCE(SUM(line_total_incl_tax), 0) FROM pos_order_line WHERE order_id = OLD.order_id),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.order_id;
END;

-- ─── Cleanup: Expired Cache Entries ────────────────────────────────────────────

/**
 * Trigger: Auto-delete expired cache entries
 */
CREATE TRIGGER IF NOT EXISTS tr_cache_cleanup
AFTER INSERT ON cache_entries
FOR EACH ROW
WHEN NEW.expires_at < CURRENT_TIMESTAMP
BEGIN
  DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP;
END;

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Schema
-- ═══════════════════════════════════════════════════════════════════════════════
