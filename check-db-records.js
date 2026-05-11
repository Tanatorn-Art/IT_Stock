import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const DB_PATH = './database.sqlite';

async function checkRecords() {
  const db = new sqlite3.Database(DB_PATH);
  const all = promisify(db.all.bind(db));

  try {
    console.log('=== Checking existing borrows ===');
    const borrows = await all('SELECT id, borrower, item, status FROM borrows ORDER BY id');
    console.log(`Total borrows: ${borrows.length}`);
    borrows.forEach(b => console.log(`  ${b.id}: ${b.borrower} - ${b.item} (${b.status})`));

    console.log('\n=== Checking existing requisitions ===');
    const requisitions = await all('SELECT id, requester, item, status FROM requisitions ORDER BY id');
    console.log(`Total requisitions: ${requisitions.length}`);
    requisitions.forEach(r => console.log(`  ${r.id}: ${r.requester} - ${r.item} (${r.status})`));

    console.log('\n=== Checking highest IDs ===');
    const maxBorrow = await all('SELECT MAX(id) as max_id FROM borrows');
    const maxReq = await all('SELECT MAX(id) as max_id FROM requisitions');
    console.log(`Max borrow ID: ${maxBorrow[0]?.max_id || 'none'}`);
    console.log(`Max requisition ID: ${maxReq[0]?.max_id || 'none'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

checkRecords();
