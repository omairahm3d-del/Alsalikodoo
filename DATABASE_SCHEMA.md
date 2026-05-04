# Odoo 19 POS Mobile App — Local Database Schema

## Overview

This document describes the SQLite database schema for the Odoo 19 POS mobile application. The schema supports offline mode, data synchronization, caching, and audit trails.

**Key Features:**
- Offline-first architecture with sync queue
- Complete product catalog and customer data
- Order and payment tracking
- Automatic sync with Odoo server
- Audit trail and error logging
- Performance-optimized with indexes and views
- Transaction support for data integrity

## Database Architecture

### Schema Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
│              (React Components, Services)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Database Service Layer                     │
│         (CRUD operations, queries, transactions)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              SQLite Database Engine                     │
│    (Triggers, Views, Indexes, Constraints)             │
└─────────────────────────────────────────────────────────┘
```

## Table Reference

### System Tables

#### `app_config`
Global application configuration and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| key | TEXT UNIQUE | Configuration key |
| value | TEXT | Configuration value |
| data_type | TEXT | Value type (string, number, boolean, json) |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_app_config_key`

**Example:**
```sql
INSERT INTO app_config (key, value, data_type) VALUES ('app_version', '1.0.0', 'string');
INSERT INTO app_config (key, value, data_type) VALUES ('offline_mode_enabled', 'true', 'boolean');
```

#### `app_session`
User session information for authentication and tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | Odoo user ID |
| username | TEXT | Login username |
| database | TEXT | Odoo database name |
| server_url | TEXT | Odoo server URL |
| session_token | TEXT UNIQUE | Session token |
| authenticated_at | DATETIME | Authentication time |
| last_activity_at | DATETIME | Last activity time |
| expires_at | DATETIME | Session expiration time |
| is_active | BOOLEAN | Session status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_app_session_user_id`, `idx_app_session_is_active`

#### `sync_queue`
Queue of pending operations to sync with Odoo server.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| operation_id | TEXT UNIQUE | UUID for deduplication |
| model | TEXT | Odoo model name (e.g., 'pos.order') |
| operation_type | TEXT | Operation type (create, write, unlink, call) |
| record_id | INTEGER | Odoo record ID |
| local_id | TEXT | Local temporary ID for new records |
| payload | TEXT | JSON data |
| status | TEXT | Operation status (pending, processing, completed, failed) |
| retry_count | INTEGER | Number of retry attempts |
| max_retries | INTEGER | Maximum retry attempts |
| error_message | TEXT | Error message if failed |
| synced_at | DATETIME | Sync completion time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_sync_queue_status`, `idx_sync_queue_model`, `idx_sync_queue_created_at`

**Example:**
```sql
-- Create order (pending sync)
INSERT INTO sync_queue (
  operation_id, model, operation_type, payload, status
) VALUES (
  'uuid-1234', 'pos.order', 'create',
  '{"customer_id": 1, "total": 99.99}',
  'pending'
);
```

#### `sync_history`
Record of completed sync batches.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| sync_batch_id | TEXT UNIQUE | Batch identifier |
| total_operations | INTEGER | Total operations in batch |
| successful_operations | INTEGER | Successful operations |
| failed_operations | INTEGER | Failed operations |
| duration_ms | INTEGER | Sync duration in milliseconds |
| started_at | DATETIME | Sync start time |
| completed_at | DATETIME | Sync completion time |
| error_summary | TEXT | Summary of errors |
| created_at | DATETIME | Creation timestamp |

**Indexes:** `idx_sync_history_completed_at`

#### `cache_entries`
API response caching for offline support.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| cache_key | TEXT UNIQUE | Cache key |
| model | TEXT | Odoo model name |
| method | TEXT | Method name |
| data | TEXT | JSON data |
| ttl_seconds | INTEGER | Time-to-live in seconds |
| created_at | DATETIME | Creation timestamp |
| expires_at | DATETIME | Expiration timestamp |

**Indexes:** `idx_cache_entries_expires_at`, `idx_cache_entries_model`

### Product Catalog

#### `product_category`
Product categories for organization.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Odoo category ID |
| name | TEXT | Category name |
| parent_id | INTEGER | Parent category ID |
| display_name | TEXT | Full category path |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_product_category_parent_id`, `idx_product_category_name`

#### `product`
Product information with pricing and attributes.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Odoo product ID |
| name | TEXT | Product name |
| default_code | TEXT | SKU |
| barcode | TEXT UNIQUE | Product barcode |
| category_id | INTEGER | Category ID |
| type | TEXT | Type (product, service, consumable) |
| list_price | REAL | Selling price |
| cost_price | REAL | Cost price |
| description | TEXT | Product description |
| image_data | BLOB | Base64 encoded image |
| uom_id | INTEGER | Unit of measure ID |
| active | BOOLEAN | Active status |
| tracking | TEXT | Tracking method (none, lot, serial) |
| weight | REAL | Weight in kg |
| volume | REAL | Volume in m³ |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_product_barcode`, `idx_product_default_code`, `idx_product_category_id`, `idx_product_active`, `idx_product_name`

**Example:**
```sql
-- Query products by category
SELECT * FROM product WHERE category_id = 5 AND active = 1;

-- Search by barcode
SELECT * FROM product WHERE barcode = '5901234123457';

-- Search by name
SELECT * FROM product WHERE name LIKE '%coffee%' AND active = 1;
```

#### `product_tax`
Taxes applicable to products.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Tax ID |
| product_id | INTEGER | Product ID |
| tax_id | INTEGER | Odoo tax ID |
| tax_name | TEXT | Tax name |
| tax_amount | REAL | Tax percentage or amount |
| tax_type | TEXT | Type (percent, fixed) |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |

**Indexes:** `idx_product_tax_product_id`, `idx_product_tax_tax_id`

#### `product_stock`
Local stock information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| product_id | INTEGER UNIQUE | Product ID |
| quantity_on_hand | REAL | Stock on hand |
| quantity_reserved | REAL | Reserved quantity |
| quantity_available | REAL | Available quantity |
| last_updated | DATETIME | Last stock update |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_product_stock_product_id`

### Customer Management

#### `customer`
Customer/Partner information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Odoo partner ID |
| name | TEXT | Customer name |
| email | TEXT | Email address |
| phone | TEXT | Phone number |
| mobile | TEXT | Mobile number |
| street | TEXT | Street address |
| city | TEXT | City |
| state | TEXT | State/Province |
| zip_code | TEXT | ZIP code |
| country | TEXT | Country |
| vat_id | TEXT | VAT/Tax ID |
| customer_rank | INTEGER | Customer rank (0=not customer) |
| credit_limit | REAL | Credit limit |
| notes | TEXT | Notes |
| active | BOOLEAN | Active status |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_customer_email`, `idx_customer_phone`, `idx_customer_name`, `idx_customer_active`

**Example:**
```sql
-- Search customers
SELECT * FROM customer WHERE name LIKE '%john%' AND active = 1;

-- Get customer by email
SELECT * FROM customer WHERE email = 'john@example.com';
```

#### `customer_loyalty`
Loyalty points and tier information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| customer_id | INTEGER UNIQUE | Customer ID |
| points | REAL | Loyalty points |
| tier | TEXT | Tier (bronze, silver, gold, platinum) |
| total_spent | REAL | Total spent amount |
| last_purchase_date | DATETIME | Last purchase date |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_customer_loyalty_customer_id`

### Orders & Transactions

#### `pos_order`
Point of Sale orders.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Odoo order ID |
| local_id | TEXT UNIQUE | Local temporary ID |
| session_id | INTEGER | POS session ID |
| customer_id | INTEGER | Customer ID |
| order_date | DATETIME | Order date/time |
| status | TEXT | Status (draft, paid, invoiced, cancelled) |
| subtotal | REAL | Subtotal before tax |
| tax_amount | REAL | Tax amount |
| total_amount | REAL | Total amount including tax |
| amount_paid | REAL | Amount paid |
| amount_return | REAL | Change returned |
| discount_amount | REAL | Discount amount |
| discount_percent | REAL | Discount percentage |
| notes | TEXT | Order notes |
| receipt_printed | BOOLEAN | Receipt printed flag |
| receipt_emailed | BOOLEAN | Receipt emailed flag |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_pos_order_session_id`, `idx_pos_order_customer_id`, `idx_pos_order_status`, `idx_pos_order_order_date`, `idx_pos_order_is_synced`

**Triggers:** `tr_pos_order_insert` (audit), `tr_pos_order_line_insert` (total update), `tr_pos_order_line_delete` (total update)

**Example:**
```sql
-- Get today's orders
SELECT * FROM pos_order WHERE DATE(order_date) = DATE('now') ORDER BY order_date DESC;

-- Get pending sync orders
SELECT * FROM pos_order WHERE is_synced = 0;

-- Get customer order history
SELECT * FROM pos_order WHERE customer_id = 1 ORDER BY order_date DESC;
```

#### `pos_order_line`
Individual line items in orders.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| order_id | INTEGER | Order ID |
| product_id | INTEGER | Product ID |
| quantity | REAL | Quantity |
| unit_price | REAL | Unit price |
| discount_amount | REAL | Line discount amount |
| discount_percent | REAL | Line discount percentage |
| tax_amount | REAL | Line tax amount |
| line_total | REAL | Line total (before tax) |
| line_total_incl_tax | REAL | Line total (including tax) |
| notes | TEXT | Line notes |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_pos_order_line_order_id`, `idx_pos_order_line_product_id`

**Triggers:** Auto-updates parent order totals

#### `pos_payment`
Payment records for orders.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| order_id | INTEGER | Order ID |
| payment_method | TEXT | Method (cash, card, mobile, check) |
| amount | REAL | Payment amount |
| payment_date | DATETIME | Payment date/time |
| reference_number | TEXT | Transaction reference |
| card_type | TEXT | Card type (visa, mastercard, amex) |
| card_last_four | TEXT | Last 4 digits of card |
| is_change | BOOLEAN | Is change payment |
| status | TEXT | Status (completed, pending, failed, refunded) |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_pos_payment_order_id`, `idx_pos_payment_payment_method`

#### `pos_session`
POS session tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Session ID |
| session_name | TEXT | Session name |
| config_id | INTEGER | POS config ID |
| user_id | INTEGER | User ID |
| start_time | DATETIME | Session start time |
| end_time | DATETIME | Session end time |
| status | TEXT | Status (open, closed, suspended) |
| opening_balance | REAL | Opening cash balance |
| closing_balance | REAL | Closing cash balance |
| total_sales | REAL | Total sales |
| total_returns | REAL | Total returns |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_pos_session_status`, `idx_pos_session_start_time`

### Taxes & Pricing

#### `tax`
Tax configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Tax ID |
| name | TEXT | Tax name |
| tax_type | TEXT | Type (percent, fixed) |
| amount | REAL | Tax amount |
| active | BOOLEAN | Active status |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### `pricelist`
Pricing rules.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Pricelist ID |
| name | TEXT | Pricelist name |
| currency | TEXT | Currency code |
| active | BOOLEAN | Active status |
| is_synced | BOOLEAN | Sync status |
| synced_at | DATETIME | Last sync time |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### `pricelist_item`
Individual pricing rules.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Item ID |
| pricelist_id | INTEGER | Pricelist ID |
| product_id | INTEGER | Product ID |
| category_id | INTEGER | Category ID |
| min_quantity | REAL | Minimum quantity |
| price_override | REAL | Override price |
| discount_percent | REAL | Discount percentage |
| discount_fixed | REAL | Fixed discount |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### Audit & Logging

#### `audit_log`
Audit trail for all operations.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | User ID |
| action | TEXT | Action (create, read, update, delete, sync) |
| model | TEXT | Model name |
| record_id | INTEGER | Record ID |
| old_values | TEXT | JSON old values |
| new_values | TEXT | JSON new values |
| ip_address | TEXT | IP address |
| device_info | TEXT | Device information |
| status | TEXT | Status (success, error) |
| error_message | TEXT | Error message |
| created_at | DATETIME | Creation timestamp |

**Indexes:** `idx_audit_log_user_id`, `idx_audit_log_action`, `idx_audit_log_created_at`

#### `error_log`
Application error tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| error_type | TEXT | Error type |
| error_message | TEXT | Error message |
| stack_trace | TEXT | Stack trace |
| context | TEXT | JSON context |
| severity | TEXT | Severity (debug, info, warning, error, critical) |
| resolved | BOOLEAN | Resolution status |
| created_at | DATETIME | Creation timestamp |
| resolved_at | DATETIME | Resolution timestamp |

**Indexes:** `idx_error_log_severity`, `idx_error_log_created_at`

### Inventory Management

#### `inventory_move`
Stock movements.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| product_id | INTEGER | Product ID |
| from_location | TEXT | Source location |
| to_location | TEXT | Destination location |
| quantity | REAL | Quantity moved |
| move_type | TEXT | Type (in, out, adjustment, return) |
| reference | TEXT | Reference number |
| notes | TEXT | Notes |
| is_synced | BOOLEAN | Sync status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Indexes:** `idx_inventory_move_product_id`, `idx_inventory_move_move_type`

## Views

### `v_recent_orders`
Recent orders with customer information.

```sql
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
```

### `v_pending_sync`
Pending sync operations.

```sql
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
```

### `v_product_inventory`
Product inventory status.

```sql
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
```

### `v_daily_sales`
Daily sales summary.

```sql
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
```

## Triggers

### `tr_product_update`
Logs product updates to audit trail.

### `tr_pos_order_insert`
Logs order creation to audit trail.

### `tr_pos_order_line_insert`
Automatically updates order totals when line items are added.

### `tr_pos_order_line_delete`
Automatically updates order totals when line items are removed.

### `tr_cache_cleanup`
Auto-deletes expired cache entries.

## Common Queries

### Get active products
```sql
SELECT * FROM product WHERE active = 1 ORDER BY name ASC;
```

### Search products by barcode
```sql
SELECT * FROM product WHERE barcode = '5901234123457';
```

### Get customer order history
```sql
SELECT po.*, COUNT(pol.id) as line_count
FROM pos_order po
LEFT JOIN pos_order_line pol ON po.id = pol.order_id
WHERE po.customer_id = 1
GROUP BY po.id
ORDER BY po.order_date DESC;
```

### Get today's sales
```sql
SELECT
  COUNT(po.id) as order_count,
  SUM(po.total_amount) as total_sales,
  SUM(po.tax_amount) as total_tax
FROM pos_order po
WHERE DATE(po.order_date) = DATE('now')
  AND po.status IN ('paid', 'invoiced');
```

### Get pending sync operations
```sql
SELECT * FROM v_pending_sync ORDER BY created_at ASC;
```

### Get inventory status
```sql
SELECT * FROM v_product_inventory WHERE quantity_available < 10;
```

## Performance Optimization

### Indexes
- All foreign keys are indexed
- Search columns (name, barcode, email) are indexed
- Status columns are indexed for filtering
- Date columns are indexed for range queries

### Query Optimization Tips
1. Use `LIMIT` and `OFFSET` for pagination
2. Filter by `is_synced` to find pending operations
3. Use views for complex queries
4. Cache frequently accessed data in `cache_entries`
5. Batch insert/update operations when possible

## Sync Strategy

### Offline-First Approach
1. All operations are performed locally first
2. Operations are queued in `sync_queue`
3. When online, operations are synced to Odoo
4. Conflicts are resolved with server data taking precedence
5. Sync history is maintained for audit trail

### Sync Queue Lifecycle
```
PENDING → PROCESSING → COMPLETED
   ↓
 FAILED → PENDING (retry)
```

## Backup & Recovery

### Backup
```sql
-- Create backup (implementation-specific)
VACUUM INTO 'backup_2026-05-04.db';
```

### Recovery
```sql
-- Restore from backup (implementation-specific)
RESTORE FROM 'backup_2026-05-04.db';
```

## Data Retention

| Table | Retention Policy |
|-------|------------------|
| pos_order | Keep all (historical data) |
| sync_queue | Delete after 30 days if completed |
| sync_history | Keep all (audit trail) |
| cache_entries | Auto-delete on expiration |
| audit_log | Keep for 90 days |
| error_log | Keep for 30 days |

## Implementation Notes

### Browser (Web)
- Use `sql.js` for in-memory SQLite
- Use `IndexedDB` for persistent storage
- Implement sync service for background sync

### React Native
- Use `react-native-sqlite-storage`
- Implement background task for sync

### Electron
- Use `better-sqlite3` or `sqlite3`
- Implement file-based backup

## Schema Version

- **Version:** 1.0.0
- **Created:** 2026-05-04
- **Last Updated:** 2026-05-04

## Related Files

- `db.schema.sql` — Complete SQL schema
- `db.types.ts` — TypeScript type definitions
- `db.service.ts` — Database service layer
