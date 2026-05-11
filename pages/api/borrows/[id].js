import { getDatabase } from '../../../lib/database.js'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'GET') {
      const db = getDatabase()
      const row = db.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!row) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(row)
    }

    if (method === 'PATCH') {
      const db = getDatabase()
      const existing = db.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })

      // Handle return functionality
      if (req.body.returnQty !== undefined) {
        const { returnQty } = req.body

        try {
          const newQty = existing.qty - returnQty
          const newStatus = newQty <= 0 ? 'returned' : 'active'

          const updateStmt = db.prepare(`UPDATE borrows SET qty = ?, status = ? WHERE id = ?`)
          updateStmt.run(newQty, newStatus, id)

          const updated = db.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
          return res.status(200).json(updated)
        } catch (dbError) {
          console.error('Database error in return logic:', dbError)
          return res.status(500).json({ error: 'Database error: ' + dbError.message })
        }
      }

      return res.status(400).json({ error: 'Invalid request body' })
    }

    if (method === 'PUT') {
      const db = getDatabase()
      const existing = db.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })

      // Handle return functionality
      if (req.body.returnQty !== undefined) {
        const { returnQty } = req.body

        try {
          const newQty = existing.qty - returnQty
          const newStatus = newQty <= 0 ? 'returned' : 'active'

          const updateStmt = db.prepare(`UPDATE borrows SET qty = ?, status = ? WHERE id = ?`)
          updateStmt.run(newQty, newStatus, id)

          const updated = db.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
          return res.status(200).json(updated)
        } catch (dbError) {
          console.error('Database error in return logic:', dbError)
          return res.status(500).json({ error: 'Database error: ' + dbError.message })
        }
      }

      return res.status(400).json({ error: 'Invalid request body' })
    }

    if (method === 'DELETE') {
      const database = getDatabase()
      const existing = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
      if (!existing) return res.status(404).json({ error: 'Not found' })
      database.prepare(`DELETE FROM borrows WHERE id = ?`).run(id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
