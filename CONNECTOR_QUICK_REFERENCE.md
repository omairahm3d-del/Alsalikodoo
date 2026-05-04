# Odoo 19 POS Connector — Quick Reference

## Files Delivered

| File | Lines | Purpose |
|------|-------|---------|
| `odoo.types.ts` | 850+ | 30+ TypeScript interfaces for all Odoo models |
| `odoo.connector.ts` | 750+ | Main connector class with full JSON-RPC support |
| `odoo.examples.ts` | 600+ | 7 complete usage examples & workflows |
| `ODOO_CONNECTOR_README.md` | 500+ | Complete API documentation |

## Core Features

### Authentication
```typescript
const odoo = new OdooConnector({
  serverUrl: "https://myshop.odoo.com",
  database: "myshop_db",
  username: "admin",
  password: "password",
});

await odoo.authenticate();
```

### CRUD Operations
```typescript
// Create
const id = await odoo.create("res.partner", { name: "John" });

// Read
const records = await odoo.read("product.product", [1, 2], ["name", "price"]);

// Search
const ids = await odoo.search("product.product", [["active", "=", true]]);

// Search + Read (optimized)
const result = await odoo.searchRead("product.product", [], ["name", "price"]);

// Update
await odoo.write("product.product", [1], { list_price: 99.99 });

// Delete
await odoo.unlink("product.product", [1]);
```

### POS Operations
```typescript
// Get products
const products = await odoo.getProducts(categoryId, limit, offset);

// Search products
const results = await odoo.searchProducts("coffee", limit);

// Get by barcode
const product = await odoo.getProductByBarcode("5901234123457");

// Customer operations
const customer = await odoo.getCustomer(partnerId);
const customers = await odoo.searchCustomers("john", limit);
const newId = await odoo.createCustomer({ name, email, phone });

// Orders
const orderId = await odoo.createPOSOrder({
  session_id: sessionId,
  partner_id: customerId,
  lines: [...],
  amount_paid: total,
  amount_return: 0,
});
await odoo.confirmPOSOrder(orderId);
```

### Error Handling
```typescript
import { OdooAuthenticationError, OdooConnectorError } from "./lib/odoo.connector";

try {
  await odoo.authenticate();
} catch (error) {
  if (error instanceof OdooAuthenticationError) {
    console.error("Login failed");
  } else if (error instanceof OdooConnectorError) {
    console.error("Odoo error:", error.code, error.message);
  }
}
```

### Caching
```typescript
// Enabled by default (5-min TTL)
odoo.setCacheEnabled(false);  // Disable
odoo.clearCache();             // Clear all
```

## Search Domains

```typescript
// Equality
["name", "=", "John"]

// Comparison
["price", ">", 100]
["price", ">=", 100]

// String matching
["name", "ilike", "coffee"]  // case-insensitive

// List membership
["id", "in", [1, 2, 3]]

// Complex (OR)
[["name", "=", "A"], "|", ["name", "=", "B"]]
```

## Type Definitions

```typescript
import type {
  Product,
  Partner,
  SalesOrder,
  POSOrder,
  POSPayment,
  AccountTax,
  OdooSession,
} from "./lib/odoo.types";
```

## Complete Example

```typescript
import OdooConnector from "./lib/odoo.connector";

async function main() {
  const odoo = new OdooConnector({
    serverUrl: "https://myshop.odoo.com",
    database: "myshop_db",
    username: "admin",
    password: "password",
  });

  try {
    // Authenticate
    await odoo.authenticate();
    console.log("✓ Connected");

    // Get products
    const products = await odoo.getProducts(undefined, 10);
    console.log(`✓ Found ${products.length} products`);

    // Search customers
    const customers = await odoo.searchCustomers("john", 5);
    console.log(`✓ Found ${customers.length} customers`);

    // Create order
    const orderId = await odoo.createPOSOrder({
      session_id: 1,
      lines: [
        {
          product_id: products[0].id,
          qty: 2,
          price_unit: products[0].list_price,
          discount: 0,
        },
      ],
      amount_paid: 100,
      amount_return: 0,
    });
    console.log(`✓ Order created: ${orderId}`);

    // Confirm
    await odoo.confirmPOSOrder(orderId);
    console.log("✓ Order confirmed");
  } catch (error) {
    console.error("✗ Error:", error);
  } finally {
    odoo.logout();
  }
}

main();
```

## API Reference

| Method | Returns | Description |
|--------|---------|-------------|
| `authenticate()` | `Promise<OdooSession>` | Authenticate |
| `isAuthenticated()` | `boolean` | Check auth status |
| `logout()` | `void` | Logout |
| `create(model, values)` | `Promise<number>` | Create record |
| `read(model, ids, fields)` | `Promise<T[]>` | Read records |
| `search(model, domain)` | `Promise<number[]>` | Search |
| `searchRead(model, domain, fields)` | `Promise<SearchReadResult<T>>` | Search + Read |
| `searchCount(model, domain)` | `Promise<number>` | Count |
| `write(model, ids, values)` | `Promise<boolean>` | Update |
| `unlink(model, ids)` | `Promise<boolean>` | Delete |
| `getProducts(categoryId, limit)` | `Promise<Product[]>` | Get products |
| `searchProducts(query, limit)` | `Promise<Product[]>` | Search products |
| `getProductByBarcode(barcode)` | `Promise<Product \| null>` | Get by barcode |
| `getCustomer(partnerId)` | `Promise<Partner \| null>` | Get customer |
| `searchCustomers(query, limit)` | `Promise<Partner[]>` | Search customers |
| `createCustomer(data)` | `Promise<number>` | Create customer |
| `createPOSOrder(data)` | `Promise<number>` | Create order |
| `confirmPOSOrder(orderId)` | `Promise<boolean>` | Confirm order |
| `getTaxes(productId)` | `Promise<AccountTax[]>` | Get taxes |
| `getActivePOSSession(configId)` | `Promise<any \| null>` | Get session |
| `getSessionOrders(sessionId, limit)` | `Promise<POSOrder[]>` | Get orders |

## Configuration

```typescript
interface OdooConnectorConfig {
  serverUrl: string;      // Required: Odoo server URL
  database: string;       // Required: Database name
  username: string;       // Required: Username
  password: string;       // Required: Password
  userAgent?: string;     // Default: "OdooConnector/1.0"
  timeout?: number;       // Default: 30000 (ms)
  retryAttempts?: number; // Default: 3
  retryDelay?: number;    // Default: 1000 (ms)
  debug?: boolean;        // Default: false
}
```

## Performance Tips

1. Use `searchRead` instead of `search` + `read`
2. Enable caching (default)
3. Only request needed fields
4. Use pagination for large result sets
5. Disable debug mode in production
6. Batch operations when possible

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Call `authenticate()` first |
| Timeout | Increase `timeout` in config |
| "Invalid credentials" | Verify server URL, database, username, password |
| Stale data | Call `clearCache()` |
| Slow requests | Check network, enable caching |

## Next Steps

1. Integrate with React hooks
2. Add offline mode with SQLite
3. Implement payment processing
4. Add barcode scanner support
5. Build receipt printing
6. Add analytics endpoints

---

For complete documentation, see `ODOO_CONNECTOR_README.md`
