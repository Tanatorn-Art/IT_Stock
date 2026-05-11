import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const DB_PATH = './database.sqlite';

async function initializeDatabase() {
  const db = new sqlite3.Database(DB_PATH);
  const run = promisify(db.run.bind(db));

  try {
    console.log('Creating borrows table...');
    await run(`
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
    `);

    console.log('Creating requisitions table...');
    await run(`
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
    `);

    console.log('Creating indexes for borrows table...');
    await run(`CREATE INDEX IF NOT EXISTS idx_borrows_status ON borrows(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_borrows_dept ON borrows(dept)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_borrows_borrow_date ON borrows(borrow_date)`);

    console.log('Creating indexes for requisitions table...');
    await run(`CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_requisitions_dept ON requisitions(dept)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_requisitions_request_date ON requisitions(request_date)`);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

initializeDatabase().catch(console.error);
