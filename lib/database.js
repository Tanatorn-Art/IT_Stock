import Database from 'better-sqlite3'

const DB_PATH = './database.sqlite'

let db = null

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function initializeDatabase() {
  const database = getDatabase()

  // Create locations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      shelfId TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create stock table
  database.exec(`
    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      brand TEXT,
      model TEXT,
      serial TEXT,
      quantity INTEGER DEFAULT 0,
      minQuantity INTEGER DEFAULT 0,
      location TEXT,
      status TEXT DEFAULT 'active',
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      txnId TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
      qty INTEGER NOT NULL,
      qtyBefore INTEGER NOT NULL,
      qtyAfter INTEGER NOT NULL,
      note TEXT DEFAULT '',
      by TEXT DEFAULT 'System',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create shelf_config table
  database.exec(`
    CREATE TABLE IF NOT EXISTS shelf_config (
      id TEXT PRIMARY KEY,
      config JSON NOT NULL
    )
  `)

  // Create activity_logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('error', 'normal', 'warning', 'info')),
      message TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create borrows table
  database.exec(`
    CREATE TABLE IF NOT EXISTS borrows (
      id TEXT PRIMARY KEY,
      borrower TEXT NOT NULL,
      dept TEXT NOT NULL,
      item TEXT NOT NULL,
      qty INTEGER DEFAULT 1,
      borrow_date DATE NOT NULL,
      due_date DATE,
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create requisitions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS requisitions (
      id TEXT PRIMARY KEY,
      requester TEXT NOT NULL,
      dept TEXT NOT NULL,
      item TEXT NOT NULL,
      qty INTEGER DEFAULT 1,
      request_date DATE NOT NULL,
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs(level);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
    CREATE INDEX IF NOT EXISTS idx_borrows_status ON borrows(status);
    CREATE INDEX IF NOT EXISTS idx_borrows_dept ON borrows(dept);
    CREATE INDEX IF NOT EXISTS idx_borrows_borrow_date ON borrows(borrow_date);
    CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
    CREATE INDEX IF NOT EXISTS idx_requisitions_dept ON requisitions(dept);
    CREATE INDEX IF NOT EXISTS idx_requisitions_request_date ON requisitions(request_date)
  `)

  console.log('Database initialized successfully')
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
