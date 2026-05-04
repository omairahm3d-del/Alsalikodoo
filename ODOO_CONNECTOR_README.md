# Odoo 19 Community Edition — POS API Connector

A production-ready TypeScript/JavaScript connector for Odoo 19 Community Edition's JSON-RPC API, specifically designed for Point of Sale (POS) applications.

## Features

- **Full JSON-RPC Support** — Direct access to all Odoo models and methods
- **Authentication** — Secure username/password authentication with session management
- **CRUD Operations** — Create, Read, Update, Delete with domain filtering
- **POS-Specific Methods** — Product catalog, customer management, order creation, payment handling
- **Caching** — Built-in request caching with TTL for performance optimization
- **Error Handling** — Comprehensive error types and retry logic
- **Type Safety** — Full TypeScript support with complete type definitions
- **Retry Logic** — Automatic retry with exponential backoff
- **Offline Queue** — Ready for offline mode implementation

## Installation

```bash
# Copy the connector files to your project
cp client/src/lib/odoo.*.ts your-project/src/lib/
```

## Quick Start

### Basic Setup

```typescript
import OdooConnector from "./lib/odoo.connector";

const odoo = new OdooConnector({
  serverUrl: "https://myshop.odoo.com",
  database: "myshop_db",
  username: "admin",
  password: "admin_password",
  debug: true, // Enable debug logging
});

// Authenticate
await odoo.authenticate();
console.log("Connected to Odoo!");

// Use the connector
const products = await odoo.getProducts();
console.log(products);

// Logout when done
odoo.logout();
```

### Configuration Options

```typescript
interface OdooConnectorConfig {
  serverUrl: string;           // Odoo server URL (e.g., https://myshop.odoo.com)
  database: string;            // Database name
  username: string;            // Login username
  password: string;            // Login password
  userAgent?: string;          // Custom user agent (default: "OdooConnector/1.0")
  timeout?: number;            // Request timeout in ms (default: 30000)
  retryAttempts?: number;      // Number of retry attempts (default: 3)
  retryDelay?: number;         // Initial retry delay in ms (default: 1000)
  debug?: boolean;             // Enable debug logging (default: false)
}
```

## Core API Methods

### Authentication

```typescript
// Authenticate with Odoo
const session = await odoo.authenticate();
// Returns: { uid, username, database, serverUrl, authenticated_at }

// Check authentication status
const isAuth = odoo.isAuthenticated(); // boolean

// Get current session
const session = odoo.getSession(); // OdooSession | undefined

// Logout
odoo.logout();
```

### CRUD Operations

```typescript
// Create a new record
const id = await odoo.create("res.partner", {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1-555-0123",
});

// Read records by IDs
const records = await odoo.read("product.product", [1, 2, 3], [
  "id",
  "name",
  "list_price",
]);

// Search for records
const ids = await odoo.search("product.product", [
  ["active", "=", true],
  ["list_price", ">", 10],
]);

// Search and read in one call (most efficient)
const result = await odoo.searchRead("product.product", [
  ["active", "=", true],
]);
// Returns: { records: [], length: 0 }

// Count records
const count = await odoo.searchCount("product.product", [
  ["active", "=", true],
]);

// Update records
await odoo.write("product.product", [1, 2], {
  list_price: 99.99,
});

// Delete records
await odoo.unlink("product.product", [1, 2]);

// Call custom method
const result = await odoo.callMethod("product.product", "custom_method", [
  arg1,
  arg2,
]);
```

### POS-Specific Methods

#### Product Management

```typescript
// Get all products with optional category filter
const products = await odoo.getProducts(
  categoryId, // optional
  limit = 100,
  offset = 0
);

// Search products by name or barcode
const results = await odoo.searchProducts("coffee", limit = 20);

// Get product by barcode
const product = await odoo.getProductByBarcode("5901234123457");

// Get applicable taxes for a product
const taxes = await odoo.getTaxes(productId);
```

#### Customer Management

```typescript
// Get customer by ID
const customer = await odoo.getCustomer(partnerId);

// Search customers
const customers = await odoo.searchCustomers("john", limit = 20);

// Create new customer
const customerId = await odoo.createCustomer({
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1-555-0123",
  mobile: "+1-555-0124",
});
```

#### Order Management

```typescript
// Get active POS session
const session = await odoo.getActivePOSSession(configId);

// Create POS order
const orderId = await odoo.createPOSOrder({
  session_id: sessionId,
  partner_id: customerId, // optional
  lines: [
    {
      product_id: 1,
      qty: 2,
      price_unit: 19.99,
      discount: 0, // percentage
    },
  ],
  amount_paid: 39.98,
  amount_return: 0,
});

// Confirm POS order (mark as paid)
await odoo.confirmPOSOrder(orderId);

// Get order history for session
const orders = await odoo.getSessionOrders(sessionId, limit = 50);
```

## Search Domains

Odoo uses domain syntax for filtering. Common operators:

```typescript
// Equality
["name", "=", "John"]

// Inequality
["name", "!=", "John"]

// Comparison
["price", ">", 100]
["price", ">=", 100]
["price", "<", 100]
["price", "<=", 100]

// String matching
["name", "like", "john"]      // case-sensitive
["name", "ilike", "john"]     // case-insensitive

// List membership
["id", "in", [1, 2, 3]]
["id", "not in", [1, 2, 3]]

// Logical operators
// AND (default, no operator needed)
[["active", "=", true], ["price", ">", 10]]

// OR (use "|" as string)
[["name", "=", "A"], "|", ["name", "=", "B"]]

// NOT (use "!" as string)
["!", ["active", "=", true]]

// Complex example
[
  ["active", "=", true],
  ["price", ">", 10],
  ["price", "<", 100],
  "|",
  ["name", "ilike", "coffee"],
  ["name", "ilike", "tea"],
]
```

## Caching

The connector includes built-in caching for improved performance:

```typescript
// Cache is enabled by default
// Caches search_read and read operations for 5 minutes

// Check cache status
const state = odoo.getState();
console.log(state.cacheEnabled); // true

// Disable caching
odoo.setCacheEnabled(false);

// Re-enable caching
odoo.setCacheEnabled(true);

// Clear all cache
odoo.clearCache();

// Cache is automatically invalidated on create/write/unlink
```

## Error Handling

```typescript
import OdooConnector, {
  OdooConnectorError,
  OdooAuthenticationError,
  OdooNotFoundError,
} from "./lib/odoo.connector";

try {
  await odoo.authenticate();
} catch (error) {
  if (error instanceof OdooAuthenticationError) {
    console.error("Login failed:", error.message);
  } else if (error instanceof OdooConnectorError) {
    console.error("Odoo error:", error.code, error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Type Definitions

All types are exported from `odoo.types.ts`:

```typescript
import type {
  Product,
  Partner,
  SalesOrder,
  POSOrder,
  POSPayment,
  AccountTax,
  OdooSession,
  SearchParams,
  OdooResponse,
} from "./lib/odoo.types";

// Use in your code
const product: Product = await odoo.read("product.product", [1]);
```

## Complete Example: POS Transaction

```typescript
import OdooConnector from "./lib/odoo.connector";

async function completePOSTransaction() {
  const odoo = new OdooConnector({
    serverUrl: "https://myshop.odoo.com",
    database: "myshop_db",
    username: "cashier1",
    password: "cashier_password",
  });

  try {
    // 1. Authenticate
    await odoo.authenticate();
    console.log("✓ Logged in");

    // 2. Get active session
    const session = await odoo.getActivePOSSession(1); // POS config ID
    if (!session) throw new Error("No active POS session");
    console.log("✓ Session:", session.name);

    // 3. Search for customer (optional)
    const customers = await odoo.searchCustomers("john", 1);
    const customerId = customers[0]?.id;

    // 4. Get products
    const products = await odoo.getProducts(undefined, 5);
    console.log(`✓ Found ${products.length} products`);

    // 5. Build order
    const orderLines = [
      {
        product_id: products[0].id,
        qty: 2,
        price_unit: products[0].list_price,
        discount: 0,
      },
      {
        product_id: products[1].id,
        qty: 1,
        price_unit: products[1].list_price,
        discount: 10, // 10% discount
      },
    ];

    // 6. Calculate total
    const subtotal = orderLines.reduce(
      (sum, line) =>
        sum + line.qty * line.price_unit * (1 - line.discount / 100),
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // 7. Create order
    const orderId = await odoo.createPOSOrder({
      session_id: session.id,
      partner_id: customerId,
      lines: orderLines,
      amount_paid: total,
      amount_return: 0,
    });
    console.log("✓ Order created:", orderId);

    // 8. Confirm payment
    await odoo.confirmPOSOrder(orderId);
    console.log("✓ Order confirmed and paid");

    // 9. Get order history
    const orders = await odoo.getSessionOrders(session.id, 10);
    console.log(`✓ Session has ${orders.length} orders`);

    // 10. Logout
    odoo.logout();
    console.log("✓ Logged out");
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// Run
completePOSTransaction();
```

## Performance Tips

1. **Use searchRead instead of search + read** — Combines both operations into one API call
2. **Enable caching** — Default 5-minute TTL for read operations
3. **Batch operations** — Create/update multiple records in one call when possible
4. **Limit fields** — Only request fields you need
5. **Use pagination** — Set appropriate `limit` and `offset` for large result sets
6. **Disable debug mode in production** — Set `debug: false` to reduce logging overhead

## Debugging

Enable debug logging to see all API calls:

```typescript
const odoo = new OdooConnector({
  serverUrl: "https://myshop.odoo.com",
  database: "myshop_db",
  username: "admin",
  password: "password",
  debug: true, // Enable debug logging
});

// Check request count
const state = odoo.getState();
console.log("Requests made:", state.requestCount);

// Reset counter
odoo.resetRequestCount();
```

## Troubleshooting

### "Not authenticated" Error

```typescript
// Make sure to authenticate first
await odoo.authenticate();

// Check authentication status
if (!odoo.isAuthenticated()) {
  console.error("Not authenticated");
}
```

### Timeout Errors

Increase timeout in config:

```typescript
const odoo = new OdooConnector({
  // ... other config
  timeout: 60000, // 60 seconds
});
```

### "Invalid credentials" Error

Verify your Odoo credentials:

```typescript
// Check server URL format
// ✓ https://myshop.odoo.com
// ✓ https://myshop.odoo.com:8069
// ✗ https://myshop.odoo.com/web (wrong)

// Check database name
// Usually the subdomain or a specific database name

// Check username/password
// Typically "admin" for default user
```

### Cache Issues

Clear cache if you're seeing stale data:

```typescript
odoo.clearCache();

// Or disable caching temporarily
odoo.setCacheEnabled(false);
await odoo.getProducts();
odoo.setCacheEnabled(true);
```

## File Structure

```
client/src/lib/
├── odoo.types.ts       # Type definitions (100+ types)
├── odoo.connector.ts   # Main connector class
└── odoo.examples.ts    # Usage examples & workflows
```

## API Reference

### OdooConnector Class

| Method | Returns | Description |
|--------|---------|-------------|
| `authenticate()` | `Promise<OdooSession>` | Authenticate with Odoo |
| `isAuthenticated()` | `boolean` | Check if authenticated |
| `getSession()` | `OdooSession \| undefined` | Get current session |
| `logout()` | `void` | Logout and clear session |
| `create(model, values)` | `Promise<number>` | Create record |
| `read(model, ids, fields)` | `Promise<T[]>` | Read records |
| `search(model, domain, params)` | `Promise<number[]>` | Search records |
| `searchRead(model, domain, fields)` | `Promise<SearchReadResult<T>>` | Search and read |
| `searchCount(model, domain)` | `Promise<number>` | Count records |
| `write(model, ids, values)` | `Promise<boolean>` | Update records |
| `unlink(model, ids)` | `Promise<boolean>` | Delete records |
| `callMethod(model, method, args)` | `Promise<T>` | Call custom method |
| `getProducts(categoryId, limit)` | `Promise<Product[]>` | Get products |
| `searchProducts(query, limit)` | `Promise<Product[]>` | Search products |
| `getProductByBarcode(barcode)` | `Promise<Product \| null>` | Get product by barcode |
| `getCustomer(partnerId)` | `Promise<Partner \| null>` | Get customer |
| `searchCustomers(query, limit)` | `Promise<Partner[]>` | Search customers |
| `createCustomer(data)` | `Promise<number>` | Create customer |
| `createPOSOrder(data)` | `Promise<number>` | Create POS order |
| `confirmPOSOrder(orderId)` | `Promise<boolean>` | Confirm order |
| `getTaxes(productId)` | `Promise<AccountTax[]>` | Get product taxes |
| `getActivePOSSession(configId)` | `Promise<any \| null>` | Get active session |
| `getSessionOrders(sessionId, limit)` | `Promise<POSOrder[]>` | Get session orders |
| `clearCache()` | `void` | Clear all cache |
| `setCacheEnabled(enabled)` | `void` | Enable/disable cache |
| `getState()` | `OdooConnectorState` | Get connector state |
| `getRequestCount()` | `number` | Get request count |
| `resetRequestCount()` | `void` | Reset counter |

## License

MIT

## Support

For issues, feature requests, or contributions, please refer to the Odoo documentation:
- [Odoo 19 API Documentation](https://www.odoo.com/documentation/19.0/)
- [JSON-RPC Protocol](https://www.jsonrpc.org/specification)
