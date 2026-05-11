import { getDatabase } from './database.js'

export function readStock(includeDisabled = false) {
  try {
    const db = getDatabase()
    let query = 'SELECT * FROM stock'
    if (!includeDisabled) {
      query += ' WHERE disabledAt IS NULL'
    }
    query += ' ORDER BY id'

    const stock = db.prepare(query).all()
    return stock || []
  } catch (error) {
    console.error('Error reading stock:', error)
    return []
  }
}

export function writeStock(stockItems) {
  try {
    const db = getDatabase()
    for (const item of stockItems) {
      db.prepare(`
        INSERT OR REPLACE INTO stock (id, name, category, brand, model, serial, quantity, minQuantity, location, status, description, image, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id,
        item.name,
        item.category || '',
        item.brand || '',
        item.model || '',
        item.serial || '',
        item.quantity || 0,
        item.minQuantity || 0,
        item.location || '',
        item.status || 'active',
        item.description || '',
        item.image || '',
        item.createdAt || new Date().toISOString(),
        item.updatedAt || new Date().toISOString()
      )
    }
  } catch (error) {
    console.error('Error writing stock:', error)
    throw error
  }
}

export function readTransactions() {
  try {
    const db = getDatabase()
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC').all()
    return transactions || []
  } catch (error) {
    console.error('Error reading transactions:', error)
    return []
  }
}

export function writeTransactions(transactions) {
  try {
    const db = getDatabase()
    for (const transaction of transactions) {
      db.prepare(`
        INSERT OR REPLACE INTO transactions (txnId, itemId, itemName, type, qty, qtyBefore, qtyAfter, note, by, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transaction.txnId,
        transaction.itemId,
        transaction.itemName,
        transaction.type,
        transaction.qty,
        transaction.qtyBefore,
        transaction.qtyAfter,
        transaction.note || '',
        transaction.by || 'System',
        transaction.createdAt || new Date().toISOString()
      )
    }
  } catch (error) {
    console.error('Error writing transactions:', error)
    throw error
  }
}

export function generateId() {
  try {
    const db = getDatabase()
    const result = db.prepare(`
      SELECT id FROM stock
      WHERE id LIKE 'IT-%'
      ORDER BY CAST(SUBSTR(id, 4) AS INTEGER) DESC
      LIMIT 1
    `).get()

    if (result) {
      const num = parseInt(result.id.replace('IT-', '')) || 0
      return 'IT-' + String(num + 1).padStart(3, '0')
    } else {
      return 'IT-001'
    }
  } catch (error) {
    console.error('Error generating stock ID:', error)
    return 'IT-001'
  }
}

export function generateTxnId() {
  try {
    const db = getDatabase()
    const result = db.prepare(`
      SELECT txnId FROM transactions
      WHERE txnId LIKE 'TXN-%'
      ORDER BY CAST(SUBSTR(txnId, 5) AS INTEGER) DESC
      LIMIT 1
    `).get()

    if (result) {
      const num = parseInt(result.txnId.replace('TXN-', '')) || 0
      return 'TXN-' + String(num + 1).padStart(5, '0')
    } else {
      return 'TXN-00001'
    }
  } catch (error) {
    console.error('Error generating transaction ID:', error)
    return 'TXN-00001'
  }
}

export function getStockById(id) {
  try {
    const db = getDatabase()
    const item = db.prepare('SELECT * FROM stock WHERE id = ?').get(id)
    return item || null
  } catch (error) {
    console.error('Error getting stock by ID:', error)
    return null
  }
}

export function updateStock(id, updates) {
  try {
    const db = getDatabase()
    const fields = Object.keys(updates)
    const values = Object.values(updates)

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    values.push(new Date().toISOString()) // updatedAt
    values.push(id)

    db.prepare(`
      UPDATE stock
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `).run(...values)

    return getStockById(id)
  } catch (error) {
    console.error('Error updating stock:', error)
    throw error
  }
}

export function createStock(stockData) {
  try {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO stock (id, name, category, brand, model, serial, quantity, minQuantity, location, status, description, image, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      stockData.name,
      stockData.category || '',
      stockData.brand || '',
      stockData.model || '',
      stockData.serial || '',
      stockData.quantity || 0,
      stockData.minQuantity || 0,
      stockData.location || '',
      stockData.status || 'active',
      stockData.description || '',
      stockData.image || '',
      now,
      now
    )

    return getStockById(id)
  } catch (error) {
    console.error('Error creating stock:', error)
    throw error
  }
}

export function createTransaction(transactionData) {
  try {
    const db = getDatabase()
    const txnId = generateTxnId()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO transactions (txnId, itemId, itemName, type, qty, qtyBefore, qtyAfter, note, by, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      txnId,
      transactionData.itemId,
      transactionData.itemName,
      transactionData.type,
      transactionData.qty,
      transactionData.qtyBefore,
      transactionData.qtyAfter,
      transactionData.note || '',
      transactionData.by || 'System',
      transactionData.createdAt || now
    )

    return txnId
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw error
  }
}

export function softDeleteStock(id) {
  try {
    const db = getDatabase()
    db.prepare(`
      UPDATE stock
      SET disabledAt = ?, updatedAt = ?
      WHERE id = ?
    `).run(new Date().toISOString(), new Date().toISOString(), id)

    return getStockById(id)
  } catch (error) {
    console.error('Error soft deleting stock:', error)
    throw error
  }
}

export function restoreStock(id) {
  try {
    const db = getDatabase()
    db.prepare(`
      UPDATE stock
      SET disabledAt = NULL, updatedAt = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id)

    return getStockById(id)
  } catch (error) {
    console.error('Error restoring stock:', error)
    throw error
  }
}
