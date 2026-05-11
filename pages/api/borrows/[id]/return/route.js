import { getDatabase } from '../../../../../lib/database.js'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'PATCH') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })
      if (existing.status === 'returned') {
        return res.status(400).json({ error: 'Already returned' })
      }

      const returnDate = new Date().toISOString().slice(0, 10)
      database.prepare(`UPDATE borrows SET status = 'returned', updatedAt = datetime('now') WHERE id = ?`).run(id)

      // log to activity
      database.prepare(`
        INSERT INTO activity_logs (category, level, message, metadata, timestamp)
        VALUES ('borrow', 'normal', ?, ?, datetime('now'))
      `).run(`Item returned: ${existing.borrower} คืน ${existing.item} × ${existing.qty}`, JSON.stringify({borrowId: id, borrower: existing.borrower, item: existing.item, qty: existing.qty}))

      const updated = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
