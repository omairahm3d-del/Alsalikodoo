/**
 * Odoo 19 Community Edition — JSON-RPC API Connector
 * Production-ready connector for Odoo 19 with authentication, CRUD, and caching
 * 
 * Usage:
 *   const odoo = new OdooConnector({ serverUrl, database, username, password });
 *   await odoo.authenticate();
 *   const products = await odoo.searchRead('product.product', [], ['name', 'list_price']);
 */

import type {
  OdooConnectorConfig,
  OdooConnectorState,
  OdooSession,
  OdooRPCRequest,
  OdooRPCResponse,
  OdooRPCError,
  SearchParams,
  SearchReadResult,
  CacheEntry,
  OdooResponse,
  OdooPaginatedResponse,
  Product,
  Partner,
  SalesOrder,
  POSOrder,
  POSPayment,
  AccountTax,
} from "./odoo.types";

// ─── Errors ──────────────────────────────────────────────────────────────────
export class OdooConnectorError extends Error {
  constructor(
    public code: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = "OdooConnectorError";
  }
}

export class OdooAuthenticationError extends OdooConnectorError {
  constructor(message: string = "Authentication failed") {
    super(401, message);
    this.name = "OdooAuthenticationError";
  }
}

export class OdooNotFoundError extends OdooConnectorError {
  constructor(message: string = "Resource not found") {
    super(404, message);
    this.name = "OdooNotFoundError";
  }
}

// ─── Main Connector Class ────────────────────────────────────────────────────
export class OdooConnector {
  private config: Required<OdooConnectorConfig>;
  private state: OdooConnectorState;
  private cache: Map<string, CacheEntry<any>>;
  private requestId: number = 0;

  constructor(config: OdooConnectorConfig) {
    this.config = {
      userAgent: "OdooConnector/1.0",
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      debug: false,
      ...config,
    };

    this.state = {
      isAuthenticated: false,
      requestCount: 0,
      cacheEnabled: true,
    };

    this.cache = new Map();
  }

  // ─── Authentication ───────────────────────────────────────────────────────
  /**
   * Authenticate with Odoo using username/password
   * Stores session info for subsequent requests
   */
  async authenticate(): Promise<OdooSession> {
    if (this.state.isAuthenticated && this.state.session) {
      return this.state.session;
    }

    try {
      const uid = await this.call<number>("common", "authenticate", [
        this.config.database,
        this.config.username,
        this.config.password,
        this.config.userAgent,
      ]);

      if (!uid) {
        throw new OdooAuthenticationError("Invalid credentials");
      }

      this.state.session = {
        uid,
        username: this.config.username,
        database: this.config.database,
        serverUrl: this.config.serverUrl,
        authenticated_at: Date.now(),
      };

      this.state.isAuthenticated = true;

      if (this.config.debug) {
        console.log("[Odoo] Authenticated:", this.state.session);
      }

      return this.state.session;
    } catch (error) {
      this.state.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && !!this.state.session;
  }

  /**
   * Get current session
   */
  getSession(): OdooSession | undefined {
    return this.state.session;
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.state.isAuthenticated = false;
    this.state.session = undefined;
    this.cache.clear();
  }

  // ─── Low-level RPC ────────────────────────────────────────────────────────
  /**
   * Make a raw JSON-RPC call to Odoo
   * Handles retries, timeouts, and error parsing
   */
  private async call<T = any>(
    service: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<T> {
    const request: OdooRPCRequest = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service,
        method,
        args,
        kwargs,
      },
      id: this.requestId++,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await this.sendRequest<T>(request);

        if (response.error) {
          this.state.lastError = response.error;
          throw new OdooConnectorError(
            response.error.code,
            response.error.message,
            response.error.data
          );
        }

        this.state.requestCount++;
        return response.result as T;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Request failed");
  }

  /**
   * Send HTTP request to Odoo server
   */
  private async sendRequest<T>(request: OdooRPCRequest): Promise<OdooRPCResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.serverUrl}/jsonrpc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OdooRPCResponse<T> = await response.json();

      if (this.config.debug) {
        console.log("[Odoo RPC]", {
          request: request.params,
          response: data,
        });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ─── Model Operations (CRUD) ──────────────────────────────────────────────
  /**
   * Create a new record
   */
  async create<T = any>(
    model: string,
    values: Record<string, any>,
    context?: Record<string, any>
  ): Promise<number> {
    this.ensureAuthenticated();

    const id = await this.call<number>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "create",
      [values],
    ]);

    this.invalidateCache(model);
    return id;
  }

  /**
   * Read records by IDs
   */
  async read<T = any>(
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, any>
  ): Promise<T[]> {
    this.ensureAuthenticated();

    const cacheKey = this.getCacheKey(model, "read", { ids, fields });
    const cached = this.getFromCache<T[]>(cacheKey);
    if (cached) return cached;

    const records = await this.call<T[]>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "read",
      [ids, fields || []],
      context || {},
    ]);

    this.setCache(cacheKey, records, 5 * 60 * 1000); // 5 min cache
    return records;
  }

  /**
   * Search for records matching a domain
   */
  async search(
    model: string,
    domain: [string, string, any][] = [],
    params: Partial<SearchParams> = {}
  ): Promise<number[]> {
    this.ensureAuthenticated();

    const ids = await this.call<number[]>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "search",
      [domain],
      {
        limit: params.limit,
        offset: params.offset,
        order: params.order,
        context: params.context,
      },
    ]);

    return ids;
  }

  /**
   * Search and read in one call (most efficient)
   */
  async searchRead<T = any>(
    model: string,
    domain: [string, string, any][] = [],
    fields?: string[],
    params: Partial<SearchParams> = {}
  ): Promise<SearchReadResult<T>> {
    this.ensureAuthenticated();

    const cacheKey = this.getCacheKey(model, "search_read", { domain, fields });
    const cached = this.getFromCache<SearchReadResult<T>>(cacheKey);
    if (cached) return cached;

    const result = await this.call<T[]>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "search_read",
      [domain],
      {
        fields: fields || [],
        limit: params.limit,
        offset: params.offset,
        order: params.order,
        context: params.context,
      },
    ]);

    const searchResult: SearchReadResult<T> = {
      records: result,
      length: result.length,
    };

    this.setCache(cacheKey, searchResult, 5 * 60 * 1000);
    return searchResult;
  }

  /**
   * Get record count matching domain
   */
  async searchCount(
    model: string,
    domain: [string, string, any][] = []
  ): Promise<number> {
    this.ensureAuthenticated();

    const count = await this.call<number>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "search_count",
      [domain],
    ]);

    return count;
  }

  /**
   * Update records
   */
  async write(
    model: string,
    ids: number[],
    values: Record<string, any>
  ): Promise<boolean> {
    this.ensureAuthenticated();

    const result = await this.call<boolean>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "write",
      [ids, values],
    ]);

    this.invalidateCache(model);
    return result;
  }

  /**
   * Delete records
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    this.ensureAuthenticated();

    const result = await this.call<boolean>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      "unlink",
      [ids],
    ]);

    this.invalidateCache(model);
    return result;
  }

  /**
   * Call a custom method on a model
   */
  async callMethod<T = any>(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<T> {
    this.ensureAuthenticated();

    const result = await this.call<T>("object", "execute", [
      this.config.database,
      this.state.session!.uid,
      this.config.password,
      model,
      method,
      args,
      kwargs,
    ]);

    return result;
  }

  // ─── POS-specific Methods ─────────────────────────────────────────────────
  /**
   * Get all products with stock info
   */
  async getProducts(
    categoryId?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<Product[]> {
    const domain: [string, string, any][] = [["active", "=", true]];
    if (categoryId) {
      domain.push(["categ_id", "=", categoryId]);
    }

    const result = await this.searchRead<Product>(
      "product.product",
      domain,
      [
        "id",
        "name",
        "default_code",
        "barcode",
        "list_price",
        "categ_id",
        "type",
        "image_1920",
        "qty_available",
        "uom_id",
        "taxes_id",
      ],
      { limit, offset }
    );

    return result.records;
  }

  /**
   * Search products by name or barcode
   */
  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const domain: any[] = [
      ["active", "=", true],
      "|",
      ["name", "ilike", query],
      ["barcode", "ilike", query],
    ];

    const result = await this.searchRead<Product>(
      "product.product",
      domain,
      ["id", "name", "default_code", "barcode", "list_price", "categ_id", "image_1920"],
      { limit }
    );

    return result.records;
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const result = await this.searchRead<Product>(
      "product.product",
      [["barcode", "=", barcode]],
      ["id", "name", "default_code", "list_price", "categ_id", "taxes_id"]
    );

    return result.records[0] || null;
  }

  /**
   * Get customer by ID with loyalty info
   */
  async getCustomer(partnerId: number): Promise<Partner | null> {
    const records = await this.read<Partner>(
      "res.partner",
      [partnerId],
      [
        "id",
        "name",
        "email",
        "phone",
        "mobile",
        "street",
        "city",
        "zip",
        "country_id",
        "vat",
        "credit_limit",
      ]
    );

    return records[0] || null;
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string, limit: number = 20): Promise<Partner[]> {
    const domain: any[] = [
      ["customer_rank", ">", 0],
      "|",
      ["name", "ilike", query],
      ["email", "ilike", query],
    ];

    const result = await this.searchRead<Partner>(
      "res.partner",
      domain,
      ["id", "name", "email", "phone", "credit_limit"],
      { limit }
    );

    return result.records;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    mobile?: string;
  }): Promise<number> {
    return this.create("res.partner", {
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      customer_rank: 1,
      type: "contact",
    });
  }

  /**
   * Create a POS order
   */
  async createPOSOrder(data: {
    session_id: number;
    partner_id?: number;
    lines: Array<{
      product_id: number;
      qty: number;
      price_unit: number;
      discount?: number;
    }>;
    amount_paid: number;
    amount_return: number;
  }): Promise<number> {
    const orderData = {
      session_id: data.session_id,
      partner_id: data.partner_id || false,
      amount_paid: data.amount_paid,
      amount_return: data.amount_return,
      state: "draft",
    };

    const orderId = await this.create("pos.order", orderData);

    // Create order lines
    for (const line of data.lines) {
      await this.create("pos.order.line", {
        order_id: orderId,
        product_id: line.product_id,
        qty: line.qty,
        price_unit: line.price_unit,
        discount: line.discount || 0,
      });
    }

    return orderId;
  }

  /**
   * Confirm a POS order (mark as paid)
   */
  async confirmPOSOrder(orderId: number): Promise<boolean> {
    return this.write("pos.order", [orderId], { state: "paid" });
  }

  /**
   * Get applicable taxes for a product
   */
  async getTaxes(productId: number): Promise<AccountTax[]> {
    const product = await this.read<Product>("product.product", [productId], [
      "taxes_id",
    ]);

    if (!product[0] || !product[0].taxes_id) {
      return [];
    }

    const taxes = await this.read<AccountTax>(
      "account.tax",
      product[0].taxes_id,
      ["id", "name", "amount", "amount_type"]
    );

    return taxes;
  }

  /**
   * Get active POS session
   */
  async getActivePOSSession(configId: number): Promise<any | null> {
    const result = await this.searchRead(
      "pos.session",
      [
        ["config_id", "=", configId],
        ["state", "in", ["opening_control", "opened"]],
      ],
      ["id", "name", "config_id", "user_id", "start_at", "state"],
      { limit: 1 }
    );

    return result.records[0] || null;
  }

  /**
   * Get order history for a session
   */
  async getSessionOrders(sessionId: number, limit: number = 50): Promise<POSOrder[]> {
    const result = await this.searchRead<POSOrder>(
      "pos.order",
      [["session_id", "=", sessionId]],
      ["id", "name", "amount_total", "amount_paid", "state", "date_order"],
      { limit, order: "date_order desc" }
    );

    return result.records;
  }

  // ─── Caching ──────────────────────────────────────────────────────────────
  private getCacheKey(model: string, method: string, params: any): string {
    return `${model}:${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.state.cacheEnabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    if (!this.state.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateCache(model: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(model + ":")) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.state.cacheEnabled = enabled;
    if (!enabled) {
      this.cache.clear();
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────
  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new OdooAuthenticationError("Not authenticated. Call authenticate() first.");
    }
  }

  /**
   * Get connector state for debugging
   */
  getState(): OdooConnectorState {
    return { ...this.state };
  }

  /**
   * Get request count
   */
  getRequestCount(): number {
    return this.state.requestCount;
  }

  /**
   * Reset request counter
   */
  resetRequestCount(): void {
    this.state.requestCount = 0;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default OdooConnector;
