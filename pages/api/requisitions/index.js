import { getDatabase, initializeDatabase } from '../../../lib/database.js'

export default async function handler(req, res) {
  // Ensure database is initialized
  initializeDatabase()
  const { method, query } = req

  try {
    if (method === 'GET') {
      const { status, dept, search } = query

      let sql = `SELECT * FROM requisitions WHERE 1=1`
      const params = []

      if (status) { sql += ` AND status = ?`;   params.push(status) }
      if (dept)   { sql += ` AND dept = ?`;     params.push(dept) }
      if (search) {
        sql += ` AND (requester LIKE ? OR item LIKE ? OR IFNULL(employee_code, '') LIKE ?)`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }
      sql += ` ORDER BY request_date DESC`

      const db = getDatabase()
      const rows = db.prepare(sql).all(...params)
      return res.status(200).json(rows)
    }

    if (method === 'POST') {
      const { requester, dept, item, qty, note, requestDate, status = 'pending', employeeCode = '' } = req.body

      if (!requester || !dept || !item) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      try {
        const database = getDatabase()
        const last = database.prepare(`SELECT id FROM requisitions WHERE id LIKE 'R%' ORDER BY CAST(SUBSTR(id, 2) AS INTEGER) DESC LIMIT 1`).get()
        console.log('Last requisition ID:', last)
        const num  = last && last.id ? parseInt(last.id.slice(1)) + 1 : 1
        const id   = `R${String(num).padStart(3, '0')}`
        console.log('Generated ID:', id)

        database.prepare(`
          INSERT INTO requisitions (id, requester, employee_code, dept, item, qty, request_date, note, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, requester, String(employeeCode ?? '').trim(), dept, item, qty ?? 1, requestDate ?? new Date().toISOString().slice(0, 10), note ?? '', status)

        // Log to activity
        database.prepare(`
          INSERT INTO activity_logs (category, level, message, metadata, timestamp)
          VALUES ('requisition', 'normal', ?, ?, datetime('now'))
        `).run(`New requisition created: ${requester} เบิก ${item} × ${qty}`, JSON.stringify({requisitionId: id, requester, employeeCode: String(employeeCode ?? '').trim(), dept, item, qty, requestDate, note, status}))

        const newRow = database.prepare(`SELECT * FROM requisitions WHERE id = ?`).get(id)
        return res.status(201).json(newRow)
      } catch (insertError) {
        console.error('Insert error:', insertError)
        return res.status(500).json({ error: `Failed to insert requisition: ${insertError.message}` })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
