/**
 * Local Database Service Layer
 * Handles all database operations for the POS app
 * 
 * Note: This is a TypeScript interface/service definition.
 * For browser implementation, use:
 * - sql.js (in-memory SQLite)
 * - IndexedDB (native browser storage)
 * - SQLite (React Native)
 * 
 * For Node.js/Electron, use:
 * - better-sqlite3
 * - sqlite3
 */

import type {
  Product,
  Customer,
  POSOrder,
  POSOrderLine,
  POSPayment,
  SyncQueueItem,
  AppSession,
  QueryOptions,
  QueryResult,
  DatabaseStats,
  BatchInsertResult,
  SyncRequest,
  SyncResponse,
} from "./db.types";

// ─── Database Service Interface ────────────────────────────────────────────────

export interface IDatabase {
  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  backup(): Promise<string>;
  restore(backupPath: string): Promise<void>;

  // Products
  getProduct(id: number): Promise<Product | null>;
  getAllProducts(options?: QueryOptions): Promise<QueryResult<Product>>;
  searchProducts(query: string, options?: QueryOptions): Promise<QueryResult<Product>>;
  getProductByBarcode(barcode: string): Promise<Product | null>;
  insertProduct(product: Product): Promise<number>;
  insertProducts(products: Product[]): Promise<BatchInsertResult>;
  updateProduct(id: number, updates: Partial<Product>): Promise<boolean>;
  deleteProduct(id: number): Promise<boolean>;

  // Customers
  getCustomer(id: number): Promise<Customer | null>;
  getAllCustomers(options?: QueryOptions): Promise<QueryResult<Customer>>;
  searchCustomers(query: string, options?: QueryOptions): Promise<QueryResult<Customer>>;
  insertCustomer(customer: Customer): Promise<number>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<boolean>;
  deleteCustomer(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<POSOrder | null>;
  getOrdersBySession(sessionId: number, options?: QueryOptions): Promise<QueryResult<POSOrder>>;
  getOrdersByCustomer(customerId: number, options?: QueryOptions): Promise<QueryResult<POSOrder>>;
  getOrdersByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<QueryResult<POSOrder>>;
  getAllOrders(options?: QueryOptions): Promise<QueryResult<POSOrder>>;
  insertOrder(order: POSOrder): Promise<number>;
  updateOrder(id: number, updates: Partial<POSOrder>): Promise<boolean>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Lines
  getOrderLines(orderId: number): Promise<POSOrderLine[]>;
  insertOrderLine(line: POSOrderLine): Promise<number>;
  insertOrderLines(lines: POSOrderLine[]): Promise<BatchInsertResult>;
  updateOrderLine(id: number, updates: Partial<POSOrderLine>): Promise<boolean>;
  deleteOrderLine(id: number): Promise<boolean>;
  deleteOrderLines(orderId: number): Promise<number>;

  // Payments
  getPayment(id: number): Promise<POSPayment | null>;
  getOrderPayments(orderId: number): Promise<POSPayment[]>;
  insertPayment(payment: POSPayment): Promise<number>;
  updatePayment(id: number, updates: Partial<POSPayment>): Promise<boolean>;

  // Sync Queue
  getPendingSyncOperations(): Promise<SyncQueueItem[]>;
  addSyncOperation(operation: SyncRequest): Promise<string>;
  updateSyncStatus(operationId: string, status: string, error?: string): Promise<boolean>;
  clearSyncQueue(): Promise<number>;
  getSyncStats(): Promise<{ pending: number; failed: number; completed: number }>;

  // Session
  getCurrentSession(): Promise<AppSession | null>;
  saveSession(session: AppSession): Promise<number>;
  clearSession(): Promise<void>;

  // Statistics
  getStats(): Promise<DatabaseStats>;
  getDailySales(date: string): Promise<any>;
  getTopProducts(limit?: number): Promise<Product[]>;
  getTopCustomers(limit?: number): Promise<Customer[]>;

  // Cache
  getCached(key: string): Promise<any | null>;
  setCached(key: string, data: any, ttlSeconds?: number): Promise<void>;
  clearExpiredCache(): Promise<number>;
  clearCache(): Promise<void>;

  // Utilities
  executeQuery<T>(sql: string, params?: any[]): Promise<T[]>;
  executeMutation(sql: string, params?: any[]): Promise<number>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

// ─── Base Database Service Implementation ──────────────────────────────────────

export class DatabaseService implements IDatabase {
  private db: any; // Database connection (type varies by implementation)
  private isInitialized: boolean = false;

  constructor(dbConnection?: any) {
    this.db = dbConnection;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Implementation depends on the database driver
    // This is a placeholder for the actual implementation
    console.log("Database initialized");
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    if (this.db) {
      // Close database connection
      console.log("Database closed");
    }
    this.isInitialized = false;
  }

  async clear(): Promise<void> {
    // Clear all data (use with caution)
    await this.executeMutation("DELETE FROM pos_order");
    await this.executeMutation("DELETE FROM pos_order_line");
    await this.executeMutation("DELETE FROM customer");
    await this.executeMutation("DELETE FROM product");
    console.log("Database cleared");
  }

  async backup(): Promise<string> {
    // Create database backup
    const timestamp = new Date().toISOString();
    const backupPath = `backup_${timestamp}.db`;
    console.log(`Backup created: ${backupPath}`);
    return backupPath;
  }

  async restore(backupPath: string): Promise<void> {
    console.log(`Restoring from: ${backupPath}`);
    // Restore database from backup
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  async getProduct(id: number): Promise<Product | null> {
    const results = await this.executeQuery<Product>(
      "SELECT * FROM product WHERE id = ?",
      [id]
    );
    return results[0] || null;
  }

  async getAllProducts(options?: QueryOptions): Promise<QueryResult<Product>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<Product>(
      `SELECT * FROM product WHERE active = 1 ORDER BY name ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM product WHERE active = 1"
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async searchProducts(query: string, options?: QueryOptions): Promise<QueryResult<Product>> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const searchTerm = `%${query}%`;

    const data = await this.executeQuery<Product>(
      `SELECT * FROM product 
       WHERE active = 1 AND (name LIKE ? OR default_code LIKE ? OR barcode LIKE ?)
       ORDER BY name ASC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM product 
       WHERE active = 1 AND (name LIKE ? OR default_code LIKE ? OR barcode LIKE ?)`,
      [searchTerm, searchTerm, searchTerm]
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const results = await this.executeQuery<Product>(
      "SELECT * FROM product WHERE barcode = ?",
      [barcode]
    );
    return results[0] || null;
  }

  async insertProduct(product: Product): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO product (
        id, name, default_code, barcode, category_id, type, list_price,
        cost_price, description, uom_id, active, tracking, weight, volume,
        is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.default_code,
        product.barcode,
        product.category_id,
        product.type,
        product.list_price,
        product.cost_price,
        product.description,
        product.uom_id,
        product.active ? 1 : 0,
        product.tracking,
        product.weight,
        product.volume,
        product.is_synced ? 1 : 0,
        product.created_at,
        product.updated_at,
      ]
    );
    return result;
  }

  async insertProducts(products: Product[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      inserted: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      try {
        await this.insertProduct(products[i]);
        result.inserted++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: String(error),
        });
      }
    }

    return result;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.executeMutation(
      `UPDATE product SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return true;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await this.executeMutation("DELETE FROM product WHERE id = ?", [id]);
    return true;
  }

  // ─── Customers ────────────────────────────────────────────────────────────

  async getCustomer(id: number): Promise<Customer | null> {
    const results = await this.executeQuery<Customer>(
      "SELECT * FROM customer WHERE id = ?",
      [id]
    );
    return results[0] || null;
  }

  async getAllCustomers(options?: QueryOptions): Promise<QueryResult<Customer>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<Customer>(
      `SELECT * FROM customer WHERE active = 1 ORDER BY name ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM customer WHERE active = 1"
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async searchCustomers(query: string, options?: QueryOptions): Promise<QueryResult<Customer>> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const searchTerm = `%${query}%`;

    const data = await this.executeQuery<Customer>(
      `SELECT * FROM customer 
       WHERE active = 1 AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
       ORDER BY name ASC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM customer 
       WHERE active = 1 AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`,
      [searchTerm, searchTerm, searchTerm]
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async insertCustomer(customer: Customer): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO customer (
        id, name, email, phone, mobile, street, city, state, zip_code,
        country, vat_id, customer_rank, credit_limit, notes, active,
        is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.mobile,
        customer.street,
        customer.city,
        customer.state,
        customer.zip_code,
        customer.country,
        customer.vat_id,
        customer.customer_rank,
        customer.credit_limit,
        customer.notes,
        customer.active ? 1 : 0,
        customer.is_synced ? 1 : 0,
        customer.created_at,
        customer.updated_at,
      ]
    );
    return result;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.executeMutation(
      `UPDATE customer SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return true;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await this.executeMutation("DELETE FROM customer WHERE id = ?", [id]);
    return true;
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async getOrder(id: number): Promise<POSOrder | null> {
    const results = await this.executeQuery<POSOrder>(
      "SELECT * FROM pos_order WHERE id = ? OR local_id = ?",
      [id, id]
    );
    return results[0] || null;
  }

  async getOrdersBySession(sessionId: number, options?: QueryOptions): Promise<QueryResult<POSOrder>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<POSOrder>(
      `SELECT * FROM pos_order WHERE session_id = ? ORDER BY order_date DESC LIMIT ? OFFSET ?`,
      [sessionId, limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM pos_order WHERE session_id = ?",
      [sessionId]
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async getOrdersByCustomer(customerId: number, options?: QueryOptions): Promise<QueryResult<POSOrder>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<POSOrder>(
      `SELECT * FROM pos_order WHERE customer_id = ? ORDER BY order_date DESC LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM pos_order WHERE customer_id = ?",
      [customerId]
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async getOrdersByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<QueryResult<POSOrder>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<POSOrder>(
      `SELECT * FROM pos_order 
       WHERE order_date >= ? AND order_date <= ?
       ORDER BY order_date DESC LIMIT ? OFFSET ?`,
      [startDate, endDate, limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM pos_order 
       WHERE order_date >= ? AND order_date <= ?`,
      [startDate, endDate]
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async getAllOrders(options?: QueryOptions): Promise<QueryResult<POSOrder>> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const data = await this.executeQuery<POSOrder>(
      `SELECT * FROM pos_order ORDER BY order_date DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM pos_order"
    );

    return {
      data,
      total: countResult[0]?.count || 0,
      limit,
      offset,
      has_more: offset + limit < (countResult[0]?.count || 0),
    };
  }

  async insertOrder(order: POSOrder): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO pos_order (
        id, local_id, session_id, customer_id, order_date, status,
        subtotal, tax_amount, total_amount, amount_paid, amount_return,
        discount_amount, discount_percent, notes, receipt_printed,
        receipt_emailed, is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.local_id,
        order.session_id,
        order.customer_id,
        order.order_date,
        order.status,
        order.subtotal,
        order.tax_amount,
        order.total_amount,
        order.amount_paid,
        order.amount_return,
        order.discount_amount,
        order.discount_percent,
        order.notes,
        order.receipt_printed ? 1 : 0,
        order.receipt_emailed ? 1 : 0,
        order.is_synced ? 1 : 0,
        order.created_at,
        order.updated_at,
      ]
    );
    return result;
  }

  async updateOrder(id: number, updates: Partial<POSOrder>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "local_id") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.executeMutation(
      `UPDATE pos_order SET ${fields.join(", ")} WHERE id = ? OR local_id = ?`,
      values
    );

    return true;
  }

  async deleteOrder(id: number): Promise<boolean> {
    await this.executeMutation("DELETE FROM pos_order WHERE id = ? OR local_id = ?", [id, id]);
    return true;
  }

  // ─── Order Lines ──────────────────────────────────────────────────────────

  async getOrderLines(orderId: number): Promise<POSOrderLine[]> {
    return this.executeQuery<POSOrderLine>(
      "SELECT * FROM pos_order_line WHERE order_id = ? ORDER BY id ASC",
      [orderId]
    );
  }

  async insertOrderLine(line: POSOrderLine): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO pos_order_line (
        order_id, product_id, quantity, unit_price, discount_amount,
        discount_percent, tax_amount, line_total, line_total_incl_tax, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        line.order_id,
        line.product_id,
        line.quantity,
        line.unit_price,
        line.discount_amount,
        line.discount_percent,
        line.tax_amount,
        line.line_total,
        line.line_total_incl_tax,
        line.notes,
        line.created_at,
        line.updated_at,
      ]
    );
    return result;
  }

  async insertOrderLines(lines: POSOrderLine[]): Promise<BatchInsertResult> {
    const result: BatchInsertResult = {
      inserted: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < lines.length; i++) {
      try {
        await this.insertOrderLine(lines[i]);
        result.inserted++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: String(error),
        });
      }
    }

    return result;
  }

  async updateOrderLine(id: number, updates: Partial<POSOrderLine>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.executeMutation(
      `UPDATE pos_order_line SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return true;
  }

  async deleteOrderLine(id: number): Promise<boolean> {
    await this.executeMutation("DELETE FROM pos_order_line WHERE id = ?", [id]);
    return true;
  }

  async deleteOrderLines(orderId: number): Promise<number> {
    await this.executeMutation("DELETE FROM pos_order_line WHERE order_id = ?", [orderId]);
    return orderId;
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async getPayment(id: number): Promise<POSPayment | null> {
    const results = await this.executeQuery<POSPayment>(
      "SELECT * FROM pos_payment WHERE id = ?",
      [id]
    );
    return results[0] || null;
  }

  async getOrderPayments(orderId: number): Promise<POSPayment[]> {
    return this.executeQuery<POSPayment>(
      "SELECT * FROM pos_payment WHERE order_id = ? ORDER BY payment_date DESC",
      [orderId]
    );
  }

  async insertPayment(payment: POSPayment): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO pos_payment (
        order_id, payment_method, amount, payment_date, reference_number,
        card_type, card_last_four, is_change, status, is_synced,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.order_id,
        payment.payment_method,
        payment.amount,
        payment.payment_date,
        payment.reference_number,
        payment.card_type,
        payment.card_last_four,
        payment.is_change ? 1 : 0,
        payment.status,
        payment.is_synced ? 1 : 0,
        payment.created_at,
        payment.updated_at,
      ]
    );
    return result;
  }

  async updatePayment(id: number, updates: Partial<POSPayment>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.executeMutation(
      `UPDATE pos_payment SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return true;
  }

  // ─── Sync Queue ───────────────────────────────────────────────────────────

  async getPendingSyncOperations(): Promise<SyncQueueItem[]> {
    return this.executeQuery<SyncQueueItem>(
      `SELECT * FROM sync_queue WHERE status IN ('pending', 'failed')
       ORDER BY created_at ASC LIMIT 100`
    );
  }

  async addSyncOperation(operation: SyncRequest): Promise<string> {
    await this.executeMutation(
      `INSERT INTO sync_queue (
        operation_id, model, operation_type, record_id, local_id, payload,
        status, retry_count, max_retries, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        operation.operation_id,
        operation.model,
        operation.operation_type,
        operation.record_id,
        operation.local_id,
        JSON.stringify(operation.payload),
        "pending",
        0,
        3,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    return operation.operation_id;
  }

  async updateSyncStatus(operationId: string, status: string, error?: string): Promise<boolean> {
    await this.executeMutation(
      `UPDATE sync_queue SET status = ?, error_message = ?, updated_at = ?
       WHERE operation_id = ?`,
      [status, error, new Date().toISOString(), operationId]
    );
    return true;
  }

  async clearSyncQueue(): Promise<number> {
    await this.executeMutation("DELETE FROM sync_queue WHERE status = 'completed'");
    return 0;
  }

  async getSyncStats(): Promise<{ pending: number; failed: number; completed: number }> {
    const results = await this.executeQuery<any>(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM sync_queue`
    );

    return {
      pending: results[0]?.pending || 0,
      failed: results[0]?.failed || 0,
      completed: results[0]?.completed || 0,
    };
  }

  // ─── Session ───────────────────────────────────────────────────────────────

  async getCurrentSession(): Promise<AppSession | null> {
    const results = await this.executeQuery<AppSession>(
      `SELECT * FROM app_session WHERE is_active = 1 ORDER BY authenticated_at DESC LIMIT 1`
    );
    return results[0] || null;
  }

  async saveSession(session: AppSession): Promise<number> {
    const result = await this.executeMutation(
      `INSERT INTO app_session (
        user_id, username, database, server_url, session_token,
        authenticated_at, last_activity_at, expires_at, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.user_id,
        session.username,
        session.database,
        session.server_url,
        session.session_token,
        session.authenticated_at,
        session.last_activity_at,
        session.expires_at,
        session.is_active ? 1 : 0,
        session.created_at,
        session.updated_at,
      ]
    );
    return result;
  }

  async clearSession(): Promise<void> {
    await this.executeMutation("UPDATE app_session SET is_active = 0");
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStats(): Promise<DatabaseStats> {
    const productCount = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM product"
    );
    const customerCount = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM customer"
    );
    const orderCount = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM pos_order"
    );
    const syncCount = await this.executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')"
    );
    const lastSync = await this.executeQuery<{ completed_at: string }>(
      "SELECT completed_at FROM sync_history ORDER BY completed_at DESC LIMIT 1"
    );

    return {
      total_products: productCount[0]?.count || 0,
      total_customers: customerCount[0]?.count || 0,
      total_orders: orderCount[0]?.count || 0,
      pending_sync_count: syncCount[0]?.count || 0,
      cache_size_bytes: 0, // Implementation-specific
      last_sync: lastSync[0]?.completed_at || null,
    };
  }

  async getDailySales(date: string): Promise<any> {
    return this.executeQuery(
      `SELECT * FROM v_daily_sales WHERE sale_date = ?`,
      [date]
    );
  }

  async getTopProducts(limit: number = 10): Promise<Product[]> {
    return this.executeQuery<Product>(
      `SELECT p.* FROM product p
       LEFT JOIN pos_order_line pol ON p.id = pol.product_id
       GROUP BY p.id
       ORDER BY COUNT(pol.id) DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    return this.executeQuery<Customer>(
      `SELECT c.* FROM customer c
       LEFT JOIN pos_order po ON c.id = po.customer_id
       GROUP BY c.id
       ORDER BY SUM(po.total_amount) DESC
       LIMIT ?`,
      [limit]
    );
  }

  // ─── Cache ────────────────────────────────────────────────────────────────

  async getCached(key: string): Promise<any | null> {
    const results = await this.executeQuery<any>(
      `SELECT data FROM cache_entries WHERE cache_key = ? AND expires_at > CURRENT_TIMESTAMP`,
      [key]
    );
    if (results[0]) {
      return JSON.parse(results[0].data);
    }
    return null;
  }

  async setCached(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await this.executeMutation(
      `INSERT OR REPLACE INTO cache_entries (cache_key, data, ttl_seconds, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [key, JSON.stringify(data), ttlSeconds, expiresAt, new Date().toISOString()]
    );
  }

  async clearExpiredCache(): Promise<number> {
    await this.executeMutation(
      "DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP"
    );
    return 0;
  }

  async clearCache(): Promise<void> {
    await this.executeMutation("DELETE FROM cache_entries");
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    // Implementation depends on database driver
    console.log("Query:", sql, params);
    return [];
  }

  async executeMutation(sql: string, params?: any[]): Promise<number> {
    // Implementation depends on database driver
    console.log("Mutation:", sql, params);
    return 0;
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      // BEGIN TRANSACTION
      const result = await callback();
      // COMMIT
      return result;
    } catch (error) {
      // ROLLBACK
      throw error;
    }
  }
}

export default DatabaseService;
