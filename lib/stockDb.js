import { getDatabase } from './database.js'
import { promisify } from 'util'

export async function readStock(includeDisabled = false) {
  const db = getDatabase()
  const all = promisify(db.all.bind(db))

  try {
    let query = 'SELECT * FROM stock'
    if (!includeDisabled) {
      query += ' WHERE disabledAt IS NULL'
    }
    query += ' ORDER BY id'

    const stock = await all(query)
    return stock
  } catch (error) {
    console.error('Error reading stock:', error)
    return []
  }
}

export async function writeStock(stockItems) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    for (const item of stockItems) {
      await run(`
        INSERT OR REPLACE INTO stock (id, name, category, brand, model, serial, quantity, minQuantity, location, status, description, image, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    }
  } catch (error) {
    console.error('Error writing stock:', error)
    throw error
  }
}

export async function readTransactions() {
  const db = getDatabase()
  const all = promisify(db.all.bind(db))

  try {
    const transactions = await all('SELECT * FROM transactions ORDER BY createdAt DESC')
    return transactions
  } catch (error) {
    console.error('Error reading transactions:', error)
    return []
  }
}

export async function writeTransactions(transactions) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    for (const transaction of transactions) {
      await run(`
        INSERT OR REPLACE INTO transactions (txnId, itemId, itemName, type, qty, qtyBefore, qtyAfter, note, by, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])
    }
  } catch (error) {
    console.error('Error writing transactions:', error)
    throw error
  }
}

export async function generateId() {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const result = await get(`
      SELECT id FROM stock
      WHERE id LIKE 'IT-%'
      ORDER BY CAST(SUBSTR(id, 4) AS INTEGER) DESC
      LIMIT 1
    `)

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

export async function generateTxnId() {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const result = await get(`
      SELECT txnId FROM transactions
      WHERE txnId LIKE 'TXN-%'
      ORDER BY CAST(SUBSTR(txnId, 5) AS INTEGER) DESC
      LIMIT 1
    `)

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

export async function getStockById(id) {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const item = await get('SELECT * FROM stock WHERE id = ?', [id])
    return item || null
  } catch (error) {
    console.error('Error getting stock by ID:', error)
    return null
  }
}

export async function updateStock(id, updates) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const fields = Object.keys(updates)
    const values = Object.values(updates)

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    values.push(new Date().toISOString()) // updatedAt
    values.push(id)

    await run(`
      UPDATE stock
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `, values)

    return await getStockById(id)
  } catch (error) {
    console.error('Error updating stock:', error)
    throw error
  }
}

export async function createStock(stockData) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const id = await generateId()
    const now = new Date().toISOString()

    await run(`
      INSERT INTO stock (id, name, category, brand, model, serial, quantity, minQuantity, location, status, description, image, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ])

    return await getStockById(id)
  } catch (error) {
    console.error('Error creating stock:', error)
    throw error
  }
}

export async function createTransaction(transactionData) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const txnId = await generateTxnId()
    const now = new Date().toISOString()

    await run(`
      INSERT INTO transactions (txnId, itemId, itemName, type, qty, qtyBefore, qtyAfter, note, by, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ])

    return txnId
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw error
  }
}

export async function softDeleteStock(id) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    await run(`
      UPDATE stock
      SET disabledAt = ?, updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), id])

    return await getStockById(id)
  } catch (error) {
    console.error('Error soft deleting stock:', error)
    throw error
  }
}

export async function restoreStock(id) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    await run(`
      UPDATE stock
      SET disabledAt = NULL, updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), id])

    return await getStockById(id)
  } catch (error) {
    console.error('Error restoring stock:', error)
    throw error
  }
}
