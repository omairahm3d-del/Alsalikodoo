/**
 * Odoo 19 POS Connector — Usage Examples & Workflows
 * Complete examples for common POS operations
 */

import OdooConnector, {
  OdooAuthenticationError,
  OdooConnectorError,
} from "./odoo.connector";
import type {
  OdooConnectorConfig,
  Product,
  Partner,
  POSOrder,
} from "./odoo.types";

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Basic Authentication & Setup
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleBasicSetup() {
  const config: OdooConnectorConfig = {
    serverUrl: "https://myshop.odoo.com",
    database: "myshop_db",
    username: "admin",
    password: "admin_password",
    debug: true,
  };

  const odoo = new OdooConnector(config);

  try {
    // Authenticate
    const session = await odoo.authenticate();
    console.log("✓ Authenticated as:", session.username);
    console.log("✓ User ID:", session.uid);
    console.log("✓ Session:", session);

    // Check authentication status
    if (odoo.isAuthenticated()) {
      console.log("✓ Connector is ready for operations");
    }

    // Logout when done
    odoo.logout();
    console.log("✓ Logged out");
  } catch (error) {
    if (error instanceof OdooAuthenticationError) {
      console.error("✗ Authentication failed:", error.message);
    } else if (error instanceof OdooConnectorError) {
      console.error("✗ Odoo error:", error.message);
    } else {
      console.error("✗ Unexpected error:", error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Product Catalog Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleProductCatalog(odoo: OdooConnector) {
  console.log("\n=== Product Catalog Operations ===\n");

  try {
    // Get all active products
    console.log("1. Fetching all products...");
    const allProducts = await odoo.getProducts(undefined, 50);
    console.log(`✓ Found ${allProducts.length} products`);
    console.log("Sample:", allProducts.slice(0, 2));

    // Get products by category
    console.log("\n2. Fetching products by category (Beverages)...");
    const categoryId = 1; // Replace with actual category ID
    const beverages = await odoo.getProducts(categoryId, 20);
    console.log(`✓ Found ${beverages.length} beverages`);

    // Search products by name/barcode
    console.log("\n3. Searching for 'coffee'...");
    const coffeeProducts = await odoo.searchProducts("coffee", 10);
    console.log(`✓ Found ${coffeeProducts.length} matching products`);
    coffeeProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.default_code}): $${p.list_price}`);
    });

    // Get product by barcode
    console.log("\n4. Looking up product by barcode...");
    const barcode = "5901234123457";
    const product = await odoo.getProductByBarcode(barcode);
    if (product) {
      console.log(`✓ Found: ${product.name}`);
      console.log(`  SKU: ${product.default_code}`);
      console.log(`  Price: $${product.list_price}`);
      console.log(`  Stock: ${product.qty_available} units`);
    } else {
      console.log("✗ Product not found");
    }

    // Get product taxes
    console.log("\n5. Getting taxes for a product...");
    if (allProducts.length > 0) {
      const taxes = await odoo.getTaxes(allProducts[0].id);
      console.log(`✓ Taxes for "${allProducts[0].name}":`);
      taxes.forEach(t => {
        console.log(`  - ${t.name}: ${t.amount}%`);
      });
    }
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Customer Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleCustomerManagement(odoo: OdooConnector) {
  console.log("\n=== Customer Management ===\n");

  try {
    // Search customers
    console.log("1. Searching for customers...");
    const customers = await odoo.searchCustomers("john", 10);
    console.log(`✓ Found ${customers.length} customers`);
    customers.forEach(c => {
      console.log(`  - ${c.name} (${c.email})`);
    });

    // Get specific customer
    console.log("\n2. Getting customer details...");
    if (customers.length > 0) {
      const customerId = customers[0].id;
      const customer = await odoo.getCustomer(customerId);
      if (customer) {
        console.log(`✓ Customer: ${customer.name}`);
        console.log(`  Email: ${customer.email}`);
        console.log(`  Phone: ${customer.phone}`);
        console.log(`  Credit Limit: $${customer.credit_limit}`);
      }
    }

    // Create new customer
    console.log("\n3. Creating new customer...");
    const newCustomerId = await odoo.createCustomer({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1-555-0123",
      mobile: "+1-555-0124",
    });
    console.log(`✓ Created customer #${newCustomerId}`);

    // Verify creation
    const newCustomer = await odoo.getCustomer(newCustomerId);
    console.log(`✓ Verified: ${newCustomer?.name}`);
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Complete POS Transaction Workflow
// ═══════════════════════════════════════════════════════════════════════════════

export async function examplePOSTransaction(odoo: OdooConnector) {
  console.log("\n=== Complete POS Transaction ===\n");

  try {
    // Step 1: Get active POS session
    console.log("1. Getting active POS session...");
    const configId = 1; // Replace with actual POS config ID
    const session = await odoo.getActivePOSSession(configId);

    if (!session) {
      console.log("✗ No active POS session. Please open a session first.");
      return;
    }

    console.log(`✓ Active session: ${session.name}`);
    const sessionId = session.id;

    // Step 2: Get products for order
    console.log("\n2. Selecting products...");
    const products = await odoo.getProducts(undefined, 5);
    if (products.length < 2) {
      console.log("✗ Not enough products available");
      return;
    }

    const product1 = products[0];
    const product2 = products[1];
    console.log(`✓ Selected: "${product1.name}" and "${product2.name}"`);

    // Step 3: Search for customer (optional)
    console.log("\n3. Searching for customer...");
    const customers = await odoo.searchCustomers("", 1);
    const customerId = customers.length > 0 ? customers[0].id : undefined;
    if (customerId) {
      console.log(`✓ Customer: ${customers[0].name}`);
    } else {
      console.log("✓ No customer (walk-in)");
    }

    // Step 4: Calculate order totals
    console.log("\n4. Calculating order...");
    const orderLines = [
      {
        product_id: product1.id,
        qty: 2,
        price_unit: product1.list_price,
        discount: 0, // 0% discount
      },
      {
        product_id: product2.id,
        qty: 1,
        price_unit: product2.list_price,
        discount: 10, // 10% discount
      },
    ];

    let subtotal = 0;
    orderLines.forEach(line => {
      const lineTotal = line.qty * line.price_unit * (1 - line.discount / 100);
      subtotal += lineTotal;
      console.log(
        `  - ${line.qty}x ${product1.name || product2.name}: $${lineTotal.toFixed(2)}`
      );
    });

    // Simplified tax calculation (assume 10% tax)
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    console.log(`  Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`  Tax (10%): $${taxAmount.toFixed(2)}`);
    console.log(`  Total: $${totalAmount.toFixed(2)}`);

    // Step 5: Create POS order
    console.log("\n5. Creating POS order...");
    const orderId = await odoo.createPOSOrder({
      session_id: sessionId,
      partner_id: customerId,
      lines: orderLines,
      amount_paid: totalAmount,
      amount_return: 0,
    });
    console.log(`✓ Order created: #${orderId}`);

    // Step 6: Confirm order (mark as paid)
    console.log("\n6. Confirming payment...");
    const confirmed = await odoo.confirmPOSOrder(orderId);
    if (confirmed) {
      console.log("✓ Order confirmed and marked as paid");
    }

    // Step 7: Retrieve order history
    console.log("\n7. Retrieving session order history...");
    const orders = await odoo.getSessionOrders(sessionId, 5);
    console.log(`✓ Session has ${orders.length} orders`);
    orders.slice(0, 3).forEach(o => {
      console.log(`  - ${o.name}: $${o.amount_total.toFixed(2)} (${o.state})`);
    });
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Advanced CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleAdvancedCRUD(odoo: OdooConnector) {
  console.log("\n=== Advanced CRUD Operations ===\n");

  try {
    // Search with complex domain
    console.log("1. Search with complex domain...");
    const domain: any[] = [
      ["active", "=", true],
      ["list_price", ">", 10],
      ["list_price", "<", 100],
    ];
    const productIds = await odoo.search("product.product", domain, {
      limit: 10,
      order: "list_price desc",
    });
    console.log(`✓ Found ${productIds.length} products with price between $10-$100`);

    // Search and count
    console.log("\n2. Count records...");
    const count = await odoo.searchCount("product.product", [
      ["active", "=", true],
    ]);
    console.log(`✓ Total active products: ${count}`);

    // Read specific fields
    console.log("\n3. Read specific fields...");
    if (productIds.length > 0) {
      const products = await odoo.read<Product>(
        "product.product",
        [productIds[0]],
        ["id", "name", "list_price", "categ_id"]
      );
      console.log(`✓ Product:`, products[0]);
    }

    // Update record
    console.log("\n4. Update record...");
    if (productIds.length > 0) {
      const updated = await odoo.write("product.product", [productIds[0]], {
        // Note: Only update fields that are writable
        // This is a demonstration; actual update depends on field permissions
      });
      console.log(`✓ Update result: ${updated}`);
    }

    // Call custom method
    console.log("\n5. Call custom method...");
    try {
      const result = await odoo.callMethod("product.product", "get_product_info", [
        productIds[0],
      ]);
      console.log(`✓ Custom method result:`, result);
    } catch (e) {
      console.log("✓ Custom method not available (expected for demo)");
    }
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Caching & Performance
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleCaching(odoo: OdooConnector) {
  console.log("\n=== Caching & Performance ===\n");

  try {
    // First call (cache miss)
    console.log("1. First product fetch (cache miss)...");
    const start1 = performance.now();
    const products1 = await odoo.getProducts(undefined, 10);
    const time1 = performance.now() - start1;
    console.log(`✓ Fetched ${products1.length} products in ${time1.toFixed(2)}ms`);

    // Second call (cache hit)
    console.log("\n2. Second product fetch (cache hit)...");
    const start2 = performance.now();
    const products2 = await odoo.getProducts(undefined, 10);
    const time2 = performance.now() - start2;
    console.log(`✓ Fetched ${products2.length} products in ${time2.toFixed(2)}ms`);
    console.log(`✓ Cache speedup: ${(time1 / time2).toFixed(1)}x faster`);

    // Clear cache
    console.log("\n3. Clearing cache...");
    odoo.clearCache();
    console.log("✓ Cache cleared");

    // Disable caching
    console.log("\n4. Disabling cache...");
    odoo.setCacheEnabled(false);
    const products3 = await odoo.getProducts(undefined, 10);
    console.log(`✓ Fetched ${products3.length} products (cache disabled)`);

    // Re-enable caching
    odoo.setCacheEnabled(true);
    console.log("✓ Cache re-enabled");

    // Check request count
    console.log("\n5. Request statistics...");
    const state = odoo.getState();
    console.log(`✓ Total requests made: ${state.requestCount}`);
  } catch (error) {
    console.error("✗ Error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

export async function exampleErrorHandling(odoo: OdooConnector) {
  console.log("\n=== Error Handling ===\n");

  try {
    // Authentication error
    console.log("1. Testing authentication error...");
    const badConfig: OdooConnectorConfig = {
      serverUrl: "https://myshop.odoo.com",
      database: "myshop_db",
      username: "admin",
      password: "wrong_password",
    };

    const badOdoo = new OdooConnector(badConfig);
    try {
      await badOdoo.authenticate();
    } catch (error) {
      if (error instanceof OdooAuthenticationError) {
        console.log(`✓ Caught authentication error: ${error.message}`);
      }
    }

    // Not authenticated error
    console.log("\n2. Testing not authenticated error...");
    const unauthOdoo = new OdooConnector(badConfig);
    try {
      await unauthOdoo.getProducts();
    } catch (error) {
      if (error instanceof OdooAuthenticationError) {
        console.log(`✓ Caught: ${error.message}`);
      }
    }

    // Invalid record ID
    console.log("\n3. Testing invalid record...");
    try {
      const record = await odoo.read("product.product", [999999], [
        "id",
        "name",
      ]);
      console.log(`✓ Result: ${record.length} records found`);
    } catch (error) {
      console.log(`✓ Handled gracefully`);
    }
  } catch (error) {
    console.error("✗ Unexpected error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: Run all examples
// ═══════════════════════════════════════════════════════════════════════════════

export async function runAllExamples() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Odoo 19 POS Connector — Complete Usage Examples         ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const config: OdooConnectorConfig = {
    serverUrl: process.env.ODOO_SERVER_URL || "https://myshop.odoo.com",
    database: process.env.ODOO_DATABASE || "myshop_db",
    username: process.env.ODOO_USERNAME || "admin",
    password: process.env.ODOO_PASSWORD || "admin_password",
    debug: true,
  };

  const odoo = new OdooConnector(config);

  try {
    // Authenticate first
    console.log("Authenticating...\n");
    await odoo.authenticate();

    // Run examples
    await exampleProductCatalog(odoo);
    await exampleCustomerManagement(odoo);
    await examplePOSTransaction(odoo);
    await exampleAdvancedCRUD(odoo);
    await exampleCaching(odoo);
    await exampleErrorHandling(odoo);

    // Cleanup
    odoo.logout();
    console.log("\n✓ All examples completed successfully!");
  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  }
}

// Export for use in tests or scripts
export { OdooConnector };
