import { getDatabase } from '../../../../../lib/database.js'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'PATCH') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Can only approve pending requisitions' })
      }

      database.prepare(`UPDATE requisitions SET status = 'approved', updatedAt = datetime('now') WHERE id = ?`).run(id)

      database.prepare(`
        INSERT INTO activity_logs (category, level, message, metadata, timestamp)
        VALUES ('requisition', 'normal', ?, ?, datetime('now'))
      `).run(`Requisition approved: ${existing.item} × ${existing.qty} ให้ ${existing.requester}`, JSON.stringify({requisitionId: id, requester: existing.requester, item: existing.item, qty: existing.qty}))

      const updated = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
