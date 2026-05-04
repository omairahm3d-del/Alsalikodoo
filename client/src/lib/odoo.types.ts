/**
 * Odoo 19 Community Edition — Type Definitions
 * Comprehensive types for JSON-RPC API interactions
 */

// ─── Authentication & Session ─────────────────────────────────────────────────
export interface OdooAuthRequest {
  jsonrpc: "2.0";
  method: "call";
  params: {
    service: "common";
    method: "authenticate";
    args: [database: string, login: string, password: string, user_agent: string];
  };
  id?: string | number;
}

export interface OdooAuthResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result: number; // user_id
  error?: OdooRPCError;
}

export interface OdooSession {
  uid: number;
  username: string;
  database: string;
  serverUrl: string;
  sessionId?: string;
  authenticated_at: number;
}

// ─── JSON-RPC Request/Response ────────────────────────────────────────────────
export interface OdooRPCRequest {
  jsonrpc: "2.0";
  method: "call";
  params: {
    service: string;
    method: string;
    args: any[];
    kwargs?: Record<string, any>;
  };
  id?: string | number;
}

export interface OdooRPCResponse<T = any> {
  jsonrpc: "2.0";
  id?: string | number;
  result?: T;
  error?: OdooRPCError;
}

export interface OdooRPCError {
  code: number;
  message: string;
  data?: {
    type?: string;
    debug?: string;
    arguments?: any[];
    exception_type?: string;
  };
}

// ─── Product & Catalog ────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  default_code: string; // SKU
  barcode?: string;
  list_price: number;
  standard_price: number;
  categ_id: [number, string]; // [id, name]
  type: "consu" | "service" | "product"; // consumable, service, storable
  tracking: "none" | "lot" | "serial";
  image_1920?: string; // base64 image
  description?: string;
  description_sale?: string;
  taxes_id: number[];
  supplier_taxes_id: number[];
  active: boolean;
  weight: number;
  volume: number;
  qty_available?: number; // requires inventory context
  virtual_available?: number;
  incoming_qty?: number;
  outgoing_qty?: number;
  uom_id: [number, string]; // unit of measure
  uom_po_id: [number, string];
}

export interface ProductCategory {
  id: number;
  name: string;
  parent_id: [number, string] | false;
  child_id: number[];
  property_account_income_categ_id?: [number, string];
  property_account_expense_categ_id?: [number, string];
}

export interface ProductTemplate {
  id: number;
  name: string;
  product_variant_ids: number[];
  list_price: number;
  categ_id: [number, string];
  type: "consu" | "service" | "product";
  taxes_id: number[];
  image_1920?: string;
}

// ─── Customer & Partner ───────────────────────────────────────────────────────
export interface Partner {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  city?: string;
  state_id?: [number, string];
  zip?: string;
  country_id?: [number, string];
  is_company: boolean;
  parent_id?: [number, string] | false;
  type: "contact" | "invoice" | "delivery" | "other";
  active: boolean;
  customer_rank: number; // 0=not customer, >0=customer
  supplier_rank: number;
  credit_limit: number;
  property_payment_term_id?: [number, string];
  property_account_receivable_id?: [number, string];
  property_account_payable_id?: [number, string];
  vat?: string; // tax ID
  website?: string;
  company_id: [number, string];
}

export interface PartnerLoyalty {
  partner_id: number;
  points: number;
  total_spent: number;
  last_purchase?: string; // ISO date
  tier?: "bronze" | "silver" | "gold" | "platinum";
}

// ─── Sales Order & POS Order ──────────────────────────────────────────────────
export interface SalesOrder {
  id: number;
  name: string; // e.g., "SO0001"
  partner_id: [number, string];
  partner_invoice_id?: [number, string];
  partner_shipping_id?: [number, string];
  order_line: number[]; // SalesOrderLine IDs
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  currency_id: [number, string];
  state: "draft" | "sent" | "sale" | "done" | "cancel";
  date_order: string; // ISO datetime
  confirmation_date?: string;
  user_id?: [number, string];
  company_id: [number, string];
  pricelist_id: [number, string];
  payment_term_id?: [number, string];
  fiscal_position_id?: [number, string];
}

export interface SalesOrderLine {
  id: number;
  order_id: [number, string];
  product_id: [number, string];
  product_uom: [number, string];
  product_qty: number;
  qty_delivered: number;
  qty_invoiced: number;
  price_unit: number;
  discount: number; // percentage
  tax_id: number[];
  price_subtotal: number;
  price_tax: number;
  price_total: number;
  state: "draft" | "cancel" | "done";
}

export interface POSOrder {
  id: number;
  name: string; // e.g., "POS-0001"
  session_id: [number, string];
  partner_id?: [number, string];
  lines: POSOrderLine[];
  amount_paid: number;
  amount_return: number;
  amount_tax: number;
  amount_total: number;
  state: "draft" | "paid" | "invoiced" | "done";
  date_order: string;
  user_id: [number, string];
  config_id: [number, string];
  payment_ids: number[];
  note?: string;
}

export interface POSOrderLine {
  id: number;
  order_id: [number, string];
  product_id: [number, string];
  qty: number;
  price_unit: number;
  discount: number;
  tax_ids: number[];
  price_subtotal: number;
  price_subtotal_incl: number;
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export interface POSPayment {
  id: number;
  pos_order_id: [number, string];
  payment_method_id: [number, string];
  amount: number;
  payment_date: string;
  state: "draft" | "done" | "cancel";
  is_change: boolean;
  card_type?: string; // "visa", "mastercard", etc.
  transaction_id?: string;
  receipt_number?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: "cash" | "card" | "bank" | "wallet" | "check";
  journal_id: [number, string];
  active: boolean;
  split_transactions: boolean;
  is_cash_count: boolean;
}

// ─── Taxes ────────────────────────────────────────────────────────────────────
export interface AccountTax {
  id: number;
  name: string;
  type_tax_use: "sale" | "purchase" | "none";
  tax_scope: "consu" | "service" | "consu_service";
  amount_type: "group" | "fixed" | "percent" | "division";
  amount: number;
  children_tax_ids: number[];
  active: boolean;
  company_id: [number, string];
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export interface StockMove {
  id: number;
  name: string;
  product_id: [number, string];
  product_qty: number;
  quantity_done: number;
  state: "draft" | "cancel" | "waiting" | "confirmed" | "assigned" | "done";
  location_id: [number, string];
  location_dest_id: [number, string];
  picking_id?: [number, string];
  date: string;
}

export interface StockPicking {
  id: number;
  name: string;
  picking_type_id: [number, string];
  partner_id?: [number, string];
  move_ids: number[];
  state: "draft" | "cancel" | "waiting" | "confirmed" | "assigned" | "done";
  date: string;
}

export interface StockQuant {
  id: number;
  product_id: [number, string];
  location_id: [number, string];
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

// ─── POS Session & Config ─────────────────────────────────────────────────────
export interface POSSession {
  id: number;
  name: string;
  config_id: [number, string];
  user_id: [number, string];
  start_at: string;
  stop_at?: string;
  state: "opening_control" | "opened" | "closing_control" | "closed";
  order_ids: number[];
  cash_register_balance_start: number;
  cash_register_balance_end?: number;
  cash_register_total_entry_encoding?: number;
}

export interface POSConfig {
  id: number;
  name: string;
  journal_ids: number[];
  payment_method_ids: number[];
  pricelist_id: [number, string];
  currency_id: [number, string];
  company_id: [number, string];
  warehouse_id: [number, string];
  stock_location_id: [number, string];
  receipt_header?: string;
  receipt_footer?: string;
  iface_print_via_proxy: boolean;
  iface_print_skip_screen: boolean;
  iface_invoicing: boolean;
  module_pos_discount: boolean;
  module_pos_restaurant: boolean;
}

// ─── Accounting ───────────────────────────────────────────────────────────────
export interface AccountMove {
  id: number;
  name: string;
  move_type: "entry" | "out_invoice" | "out_refund" | "in_invoice" | "in_refund";
  partner_id?: [number, string];
  invoice_date?: string;
  due_date?: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  state: "draft" | "posted" | "cancel";
  line_ids: number[];
  currency_id: [number, string];
  company_id: [number, string];
}

export interface AccountMoveLine {
  id: number;
  move_id: [number, string];
  account_id: [number, string];
  partner_id?: [number, string];
  debit: number;
  credit: number;
  amount_currency: number;
  currency_id: [number, string];
  tax_ids: number[];
  tax_line_id?: [number, string];
}

// ─── Pricelist ────────────────────────────────────────────────────────────────
export interface Pricelist {
  id: number;
  name: string;
  currency_id: [number, string];
  item_ids: number[];
  active: boolean;
  company_id: [number, string];
}

export interface PricelistItem {
  id: number;
  pricelist_id: [number, string];
  product_id?: [number, string];
  product_tmpl_id?: [number, string];
  categ_id?: [number, string];
  applied_on: "3_global" | "2_product_category" | "1_product" | "0_product_variant";
  base: "list_price" | "standard_price" | "pricelist";
  base_pricelist_id?: [number, string];
  compute_price: "fixed" | "percentage" | "formula";
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  price_surcharge?: number;
  min_quantity: number;
  date_start?: string;
  date_end?: string;
}

// ─── Company & Settings ───────────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  street?: string;
  city?: string;
  zip?: string;
  country_id?: [number, string];
  phone?: string;
  email?: string;
  website?: string;
  vat?: string;
  currency_id: [number, string];
  logo?: string; // base64
  company_registry?: string;
}

export interface ResUsers {
  id: number;
  name: string;
  login: string;
  email?: string;
  active: boolean;
  company_id: [number, string];
  company_ids: number[];
  groups_id: number[];
  tz?: string;
  lang?: string;
}

// ─── Search & Filter ──────────────────────────────────────────────────────────
export interface SearchDomain {
  field: string;
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "like" | "ilike" | "in" | "not in" | "child_of";
  value: any;
}

export type SearchDomainTuple = [string, string, any];

export interface SearchParams {
  domain?: SearchDomainTuple[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, any>;
}

export interface SearchReadResult<T> {
  records: T[];
  length: number;
}

// ─── Connector Configuration ───────────────────────────────────────────────────
export interface OdooConnectorConfig {
  serverUrl: string;
  database: string;
  username: string;
  password: string;
  userAgent?: string;
  timeout?: number; // ms
  retryAttempts?: number;
  retryDelay?: number; // ms
  debug?: boolean;
}

export interface OdooConnectorState {
  isAuthenticated: boolean;
  session?: OdooSession;
  lastError?: OdooRPCError;
  requestCount: number;
  cacheEnabled: boolean;
}

// ─── Cache & Offline ──────────────────────────────────────────────────────────
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export interface OfflineQueue {
  id: string;
  method: string;
  model: string;
  args: any[];
  kwargs?: Record<string, any>;
  timestamp: number;
  retries: number;
  status: "pending" | "failed" | "synced";
}

// ─── Response Wrappers ────────────────────────────────────────────────────────
export interface OdooResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
  timestamp: number;
}

export interface OdooPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  limit: number;
  offset: number;
  timestamp: number;
}
