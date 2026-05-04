/**
 * Local Database Type Definitions
 * Complete TypeScript interfaces for all database tables
 */

// ─── System Tables ────────────────────────────────────────────────────────────

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  data_type: "string" | "number" | "boolean" | "json";
  created_at: string;
  updated_at: string;
}

export interface AppSession {
  id: number;
  user_id: number;
  username: string;
  database: string;
  server_url: string;
  session_token?: string;
  authenticated_at: string;
  last_activity_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncQueueItem {
  id: number;
  operation_id: string;
  model: string;
  operation_type: "create" | "write" | "unlink" | "call";
  record_id?: number;
  local_id?: string;
  payload: string; // JSON
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  max_retries: number;
  error_message?: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncHistory {
  id: number;
  sync_batch_id: string;
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  duration_ms: number;
  started_at: string;
  completed_at: string;
  error_summary?: string;
  created_at: string;
}

export interface CacheEntry {
  id: number;
  cache_key: string;
  model?: string;
  method?: string;
  data: string; // JSON
  ttl_seconds: number;
  created_at: string;
  expires_at: string;
}

// ─── Product Catalog ──────────────────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  name: string;
  parent_id?: number;
  display_name: string;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  default_code?: string;
  barcode?: string;
  category_id?: number;
  type: "product" | "service" | "consumable";
  list_price: number;
  cost_price: number;
  description?: string;
  image_data?: string; // Base64
  uom_id?: number;
  active: boolean;
  tracking: "none" | "lot" | "serial";
  weight: number;
  volume: number;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductTax {
  id: number;
  product_id: number;
  tax_id: number;
  tax_name: string;
  tax_amount: number;
  tax_type: "percent" | "fixed";
  is_synced: boolean;
  created_at: string;
}

export interface ProductStock {
  id: number;
  product_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_updated?: string;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Customer Management ──────────────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  vat_id?: string;
  customer_rank: number;
  credit_limit: number;
  notes?: string;
  active: boolean;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerLoyalty {
  id: number;
  customer_id: number;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  total_spent: number;
  last_purchase_date?: string;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Orders & Transactions ────────────────────────────────────────────────────

export interface POSOrder {
  id: number;
  local_id?: string;
  session_id?: number;
  customer_id?: number;
  order_date: string;
  status: "draft" | "paid" | "invoiced" | "cancelled";
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_return: number;
  discount_amount: number;
  discount_percent: number;
  notes?: string;
  receipt_printed: boolean;
  receipt_emailed: boolean;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface POSOrderLine {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  line_total: number;
  line_total_incl_tax: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSPayment {
  id: number;
  order_id: number;
  payment_method: "cash" | "card" | "mobile" | "check";
  amount: number;
  payment_date: string;
  reference_number?: string;
  card_type?: string;
  card_last_four?: string;
  is_change: boolean;
  status: "completed" | "pending" | "failed" | "refunded";
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSSession {
  id: number;
  session_name: string;
  config_id?: number;
  user_id?: number;
  start_time: string;
  end_time?: string;
  status: "open" | "closed" | "suspended";
  opening_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_returns: number;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Taxes & Pricing ──────────────────────────────────────────────────────────

export interface Tax {
  id: number;
  name: string;
  tax_type: string;
  amount: number;
  active: boolean;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Pricelist {
  id: number;
  name: string;
  currency: string;
  active: boolean;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PricelistItem {
  id: number;
  pricelist_id: number;
  product_id?: number;
  category_id?: number;
  min_quantity: number;
  price_override?: number;
  discount_percent?: number;
  discount_fixed?: number;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Audit & Logging ──────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  user_id?: number;
  action: "create" | "read" | "update" | "delete" | "sync";
  model?: string;
  record_id?: number;
  old_values?: string; // JSON
  new_values?: string; // JSON
  ip_address?: string;
  device_info?: string;
  status: "success" | "error";
  error_message?: string;
  created_at: string;
}

export interface ErrorLog {
  id: number;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: string; // JSON
  severity: "debug" | "info" | "warning" | "error" | "critical";
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// ─── Inventory Management ─────────────────────────────────────────────────────

export interface InventoryMove {
  id: number;
  product_id: number;
  from_location?: string;
  to_location?: string;
  quantity: number;
  move_type: "in" | "out" | "adjustment" | "return";
  reference?: string;
  notes?: string;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Settings & Preferences ───────────────────────────────────────────────────

export interface UserPreference {
  id: number;
  user_id: number;
  key: string;
  value?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value?: string;
  description?: string;
  data_type: string;
  created_at: string;
  updated_at: string;
}

// ─── Query Results & Views ────────────────────────────────────────────────────

export interface RecentOrdersView {
  id: number;
  local_id?: string;
  order_date: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_email?: string;
  line_count: number;
}

export interface PendingSyncView {
  id: number;
  operation_id: string;
  model: string;
  operation_type: string;
  record_id?: number;
  status: string;
  retry_count: number;
  created_at: string;
}

export interface ProductInventoryView {
  id: number;
  name: string;
  default_code?: string;
  barcode?: string;
  list_price: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  category_name?: string;
}

export interface DailySalesView {
  sale_date: string;
  order_count: number;
  total_sales: number;
  total_tax: number;
  avg_order_value: number;
}

// ─── Database Operations ──────────────────────────────────────────────────────

export interface DatabaseStats {
  total_products: number;
  total_customers: number;
  total_orders: number;
  pending_sync_count: number;
  cache_size_bytes: number;
  last_sync: string | null;
}

export interface DatabaseBackup {
  backup_id: string;
  created_at: string;
  size_bytes: number;
  file_path: string;
  checksum: string;
}

export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  executed_at: string;
  duration_ms: number;
  status: "success" | "failed";
  error_message?: string;
}

// ─── Batch Operations ─────────────────────────────────────────────────────────

export interface BatchInsertResult {
  inserted: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface BatchUpdateResult {
  updated: number;
  failed: number;
  errors: Array<{
    id: number;
    error: string;
  }>;
}

// ─── Search & Filter ──────────────────────────────────────────────────────────

export interface QueryOptions {
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  search?: string;
  filters?: Record<string, any>;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ─── Sync Operations ──────────────────────────────────────────────────────────

export interface SyncRequest {
  operation_id: string;
  model: string;
  operation_type: "create" | "write" | "unlink" | "call";
  record_id?: number;
  local_id?: string;
  payload: any;
}

export interface SyncResponse {
  operation_id: string;
  success: boolean;
  record_id?: number;
  error?: string;
  timestamp: string;
}

export interface SyncBatch {
  batch_id: string;
  operations: SyncRequest[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

// ─── Export/Import ────────────────────────────────────────────────────────────

export interface ExportOptions {
  tables?: string[];
  format: "json" | "csv" | "sqlite";
  include_metadata: boolean;
  compress: boolean;
}

export interface ImportOptions {
  file_path: string;
  format: "json" | "csv" | "sqlite";
  merge: boolean;
  validate: boolean;
}

export interface ImportResult {
  tables_imported: number;
  records_imported: number;
  errors: string[];
  warnings: string[];
}
