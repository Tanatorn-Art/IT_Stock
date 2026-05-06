import sqlite3 from 'sqlite3'
import { promisify } from 'util'

const DB_PATH = './database.sqlite'

let db = null

export function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH)
  }
  return db
}

export async function initializeDatabase() {
  const database = getDatabase()

  const run = promisify(database.run.bind(database))

  // Create locations table
  await run(`
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
  await run(`
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
  await run(`
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
  await run(`
    CREATE TABLE IF NOT EXISTS shelf_config (
      id TEXT PRIMARY KEY,
      config JSON NOT NULL
    )
  `)

  // Create activity_logs table
  await run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('error', 'normal', 'warning', 'info')),
      message TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for better query performance
  await run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)
  `)

  await run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs(level)
  `)

  await run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category)
  `)

  console.log('Database initialized successfully')
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
