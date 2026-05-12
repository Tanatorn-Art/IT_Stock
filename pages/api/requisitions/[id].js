import { getDatabase, initializeDatabase } from '../../../lib/database.js'

export default async function handler(req, res) {
  // Ensure database is initialized
  initializeDatabase()
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'GET') {
      const db = getDatabase()
      const row = db.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
      if (!row) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(row)
    }

    if (method === 'PATCH') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })

      // Handle receive return functionality
      if (existing.status === 'pending') {
        database.prepare(`UPDATE requisitions SET status = 'completed' WHERE id = ?`).run(id)

        const updated = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
        return res.status(200).json(updated)
      }

      return res.status(400).json({ error: 'Requisition cannot be processed' })
    }

    if (method === 'PUT') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })

      // Handle receive return functionality
      if (existing.status === 'pending') {
        database.prepare(`UPDATE requisitions SET status = 'completed' WHERE id = ?`).run(id)

        const updated = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
        return res.status(200).json(updated)
      }

      return res.status(400).json({ error: 'Requisition cannot be processed' })
    }

    if (method === 'DELETE') {
      const database = getDatabase()
      database.prepare(`DELETE FROM requisitions WHERE id = ?`).run(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
