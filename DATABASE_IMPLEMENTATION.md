# Database Implementation Guide

This guide provides platform-specific implementation instructions for the Odoo POS database schema.

## Platform Options

### 1. Browser (Web) — sql.js + IndexedDB

**sql.js** is an in-memory SQLite implementation that runs in the browser.

#### Installation

```bash
npm install sql.js
```

#### Implementation

```typescript
import initSqlJs from 'sql.js';

class BrowserDatabase {
  private db: any;
  private SQL: any;

  async initialize() {
    this.SQL = await initSqlJs();
    
    // Load from IndexedDB or create new
    const data = await this.loadFromIndexedDB();
    if (data) {
      this.db = new this.SQL.Database(data);
    } else {
      this.db = new this.SQL.Database();
      await this.initializeSchema();
    }
  }

  async initializeSchema() {
    const schema = await fetch('/db.schema.sql').then(r => r.text());
    this.db.run(schema);
    await this.saveToIndexedDB();
  }

  async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params);
    
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  async executeMutation(sql: string, params?: any[]): Promise<number> {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params);
    stmt.step();
    stmt.free();
    
    await this.saveToIndexedDB();
    return this.db.getRowsModified();
  }

  private async saveToIndexedDB() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OdooPOS', 1);
      
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore('database');
      };
      
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('database', 'readwrite');
        tx.objectStore('database').put(buffer, 'db');
        resolve(undefined);
      };
      
      request.onerror = reject;
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OdooPOS', 1);
      
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('database', 'readonly');
        const getRequest = tx.objectStore('database').get('db');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = reject;
      };
      
      request.onerror = reject;
    });
  }
}
```

#### Usage in React

```typescript
import { useEffect, useState } from 'react';
import { DatabaseService } from './lib/db.service';

export function useDatabase() {
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      const database = new DatabaseService();
      await database.initialize();
      setDb(database);
      setLoading(false);
    };

    initDb();
  }, []);

  return { db, loading };
}

// In component
export function ProductList() {
  const { db, loading } = useDatabase();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!db) return;

    const loadProducts = async () => {
      const result = await db.getAllProducts({ limit: 50 });
      setProducts(result.data);
    };

    loadProducts();
  }, [db]);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name} - ${p.list_price}</li>
      ))}
    </ul>
  );
}
```

### 2. React Native — SQLite

**react-native-sqlite-storage** provides native SQLite support for React Native.

#### Installation

```bash
npm install react-native-sqlite-storage
cd ios && pod install && cd ..
```

#### Implementation

```typescript
import SQLite from 'react-native-sqlite-storage';

class ReactNativeDatabase {
  private db: any;

  async initialize() {
    this.db = await SQLite.openDatabase({
      name: 'OdooPOS.db',
      location: 'default',
    });

    await this.initializeSchema();
  }

  async initializeSchema() {
    const schema = require('./db.schema.sql');
    const statements = schema.split(';').filter((s: string) => s.trim());

    for (const statement of statements) {
      await this.db.executeSql(statement);
    }
  }

  async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          sql,
          params || [],
          (_: any, result: any) => {
            const data: T[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              data.push(result.rows.item(i) as T);
            }
            resolve(data);
          },
          (_: any, error: any) => reject(error)
        );
      });
    });
  }

  async executeMutation(sql: string, params?: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          sql,
          params || [],
          (_: any, result: any) => {
            resolve(result.rowsAffected);
          },
          (_: any, error: any) => reject(error)
        );
      });
    });
  }
}
```

#### Usage in React Native

```typescript
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

export function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDb = async () => {
      const database = new ReactNativeDatabase();
      await database.initialize();
      setDb(database);
    };

    initDb();
  }, []);

  useEffect(() => {
    if (!db) return;

    const loadProducts = async () => {
      const result = await db.getAllProducts({ limit: 50 });
      setProducts(result.data);
    };

    loadProducts();
  }, [db]);

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>${item.list_price}</Text>
        </View>
      )}
    />
  );
}
```

### 3. Electron — better-sqlite3

**better-sqlite3** provides synchronous SQLite access for Electron.

#### Installation

```bash
npm install better-sqlite3
```

#### Implementation

```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

class ElectronDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor(dataDir?: string) {
    this.dbPath = dataDir || path.join(process.env.APPDATA || process.env.HOME, 'OdooPOS');
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  initialize() {
    const dbFile = path.join(this.dbPath, 'OdooPOS.db');
    this.db = new Database(dbFile);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  private initializeSchema() {
    const schemaPath = path.join(__dirname, 'db.schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split and execute statements
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      try {
        this.db.exec(statement);
      } catch (error) {
        console.error('Schema error:', error);
      }
    }
  }

  executeQuery<T>(sql: string, params?: any[]): T[] {
    const stmt = this.db.prepare(sql);
    if (params) {
      return stmt.all(...params) as T[];
    }
    return stmt.all() as T[];
  }

  executeMutation(sql: string, params?: any[]): number {
    const stmt = this.db.prepare(sql);
    if (params) {
      const result = stmt.run(...params);
      return result.changes;
    }
    const result = stmt.run();
    return result.changes;
  }

  transaction<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    return transaction();
  }

  backup(backupDir?: string): string {
    const dir = backupDir || this.dbPath;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dir, `backup_${timestamp}.db`);
    
    this.db.backup(backupPath);
    return backupPath;
  }

  close() {
    this.db.close();
  }
}
```

#### Usage in Electron

```typescript
// Main process
import { app, ipcMain } from 'electron';

let db: ElectronDatabase;

app.on('ready', () => {
  db = new ElectronDatabase();
  db.initialize();

  ipcMain.handle('db:query', (event, sql, params) => {
    return db.executeQuery(sql, params);
  });

  ipcMain.handle('db:mutation', (event, sql, params) => {
    return db.executeMutation(sql, params);
  });

  ipcMain.handle('db:backup', () => {
    return db.backup();
  });
});

// Renderer process
const { ipcRenderer } = require('electron');

async function getProducts() {
  const products = await ipcRenderer.invoke('db:query', 
    'SELECT * FROM product WHERE active = 1'
  );
  return products;
}

async function createOrder(order) {
  const result = await ipcRenderer.invoke('db:mutation',
    'INSERT INTO pos_order (...) VALUES (...)',
    [order.customer_id, order.total_amount, ...]
  );
  return result;
}
```

### 4. Node.js — sqlite3

**sqlite3** provides async SQLite access for Node.js backends.

#### Installation

```bash
npm install sqlite3
```

#### Implementation

```typescript
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class NodeDatabase {
  private db: sqlite3.Database;

  async initialize(dbPath: string = './OdooPOS.db') {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, async (err) => {
        if (err) reject(err);
        else {
          await this.initializeSchema();
          resolve(undefined);
        }
      });
    });
  }

  private async initializeSchema() {
    const fs = require('fs').promises;
    const schema = await fs.readFile('./db.schema.sql', 'utf-8');
    
    const statements = schema.split(';').filter((s: string) => s.trim());
    for (const statement of statements) {
      await this.run(statement);
    }
  }

  async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async executeMutation(sql: string, params?: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  private async run(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

## Sync Service Implementation

### Background Sync (Web)

```typescript
// Service Worker
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-pos-data') {
    event.waitUntil(syncPOSData());
  }
});

async function syncPOSData() {
  const db = new DatabaseService();
  const pendingOps = await db.getPendingSyncOperations();
  
  for (const op of pendingOps) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(op),
      });
      
      if (response.ok) {
        await db.updateSyncStatus(op.operation_id, 'completed');
      } else {
        await db.updateSyncStatus(op.operation_id, 'failed', 'HTTP error');
      }
    } catch (error) {
      await db.updateSyncStatus(op.operation_id, 'failed', String(error));
    }
  }
}

// Register sync
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-pos-data');
});
```

### Background Task (React Native)

```typescript
import BackgroundTask from 'react-native-background-task';

BackgroundTask.define(async () => {
  const db = new ReactNativeDatabase();
  await db.initialize();
  
  const pendingOps = await db.getPendingSyncOperations();
  
  for (const op of pendingOps) {
    try {
      const response = await fetch('https://your-server.com/api/sync', {
        method: 'POST',
        body: JSON.stringify(op),
      });
      
      if (response.ok) {
        await db.updateSyncStatus(op.operation_id, 'completed');
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  
  BackgroundTask.finish();
});

// Schedule sync every 15 minutes
BackgroundTask.schedule({
  period: 900, // 15 minutes
});
```

## Migration Strategy

### Version Management

```typescript
interface Migration {
  version: string;
  name: string;
  up: (db: IDatabase) => Promise<void>;
  down: (db: IDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    name: 'initial_schema',
    up: async (db) => {
      // Run schema.sql
    },
    down: async (db) => {
      // Drop all tables
    },
  },
  {
    version: '1.1.0',
    name: 'add_loyalty_points',
    up: async (db) => {
      await db.executeMutation(`
        ALTER TABLE customer ADD COLUMN loyalty_points REAL DEFAULT 0;
      `);
    },
    down: async (db) => {
      // Drop column (SQLite limitation)
    },
  },
];

async function runMigrations(db: IDatabase) {
  for (const migration of migrations) {
    const exists = await db.executeQuery(
      `SELECT * FROM migrations WHERE version = ?`,
      [migration.version]
    );
    
    if (!exists.length) {
      await migration.up(db);
      await db.executeMutation(
        `INSERT INTO migrations (version, name, executed_at) VALUES (?, ?, ?)`,
        [migration.version, migration.name, new Date().toISOString()]
      );
    }
  }
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should insert and retrieve products', async () => {
    const product = {
      id: 1,
      name: 'Test Product',
      list_price: 99.99,
      // ... other fields
    };

    await db.insertProduct(product);
    const retrieved = await db.getProduct(1);

    expect(retrieved).toEqual(product);
  });

  it('should search products by barcode', async () => {
    const product = {
      id: 1,
      barcode: '5901234123457',
      // ... other fields
    };

    await db.insertProduct(product);
    const found = await db.getProductByBarcode('5901234123457');

    expect(found?.id).toBe(1);
  });

  it('should handle transactions', async () => {
    const result = await db.transaction(async () => {
      const id1 = await db.insertProduct({ id: 1, name: 'P1', ... });
      const id2 = await db.insertProduct({ id: 2, name: 'P2', ... });
      return [id1, id2];
    });

    expect(result).toHaveLength(2);
  });
});
```

## Performance Tips

1. **Use transactions** for batch operations
2. **Enable WAL mode** (Write-Ahead Logging) for better concurrency
3. **Create indexes** on frequently queried columns
4. **Use LIMIT** for pagination
5. **Batch sync operations** to reduce network calls
6. **Cache frequently accessed data** in memory
7. **Use connection pooling** for Node.js

## Troubleshooting

### Database Locked
```typescript
// Increase timeout
db.configure('busyTimeout', 5000);
```

### Memory Issues
```typescript
// Clear cache periodically
await db.clearExpiredCache();
```

### Sync Failures
```typescript
// Check pending operations
const pending = await db.getPendingSyncOperations();
console.log('Pending:', pending);

// Retry failed operations
for (const op of pending) {
  if (op.status === 'failed' && op.retry_count < op.max_retries) {
    await retrySync(op);
  }
}
```

## Related Files

- `db.schema.sql` — Complete SQL schema
- `db.types.ts` — TypeScript type definitions
- `db.service.ts` — Database service layer
- `DATABASE_SCHEMA.md` — Schema documentation
