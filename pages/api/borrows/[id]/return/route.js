import { getDatabase } from '../../../../../lib/database.js'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'PATCH') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })
      if (existing.status === 'คืนแล้ว') {
        return res.status(400).json({ error: 'Already returned' })
      }

      const { returnQty } = req.body
      const newQty = existing.qty - returnQty
      const newStatus = newQty <= 0 ? 'คืนแล้ว' : 'active'

      const returnDate = new Date().toISOString().slice(0, 10)
      database.prepare(`UPDATE borrows SET qty = ?, status = ?, updatedAt = datetime('now') WHERE id = ?`).run(newQty, newStatus, id)

      // log to activity
      const actionType = newQty <= 0 ? 'คืนเต็มจำนวน' : `คืนบางส่วน ${returnQty} ชิ้น`
      database.prepare(`
        INSERT INTO activity_logs (category, level, message, metadata, timestamp)
          VALUES ('borrow', 'normal', ?, ?, datetime('now'))
      `).run(`Item returned: ${existing.borrower} ${actionType} ${existing.item}`, JSON.stringify({borrowId: id, borrower: existing.borrower, item: existing.item, returnQty, newQty, newStatus}))

      const updated = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
