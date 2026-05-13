import { getDatabase, initializeDatabase } from '../../../lib/database.js'

export default async function handler(req, res) {
  // Ensure database is initialized
  initializeDatabase()
  const { method, query } = req

  try {
    if (method === 'GET') {
      const { status, dept, search } = query

      let sql = `SELECT * FROM borrows WHERE 1=1`
      const params = []

      if (status) { sql += ` AND status = ?`;  params.push(status) }
      if (dept)   { sql += ` AND dept = ?`;    params.push(dept) }
      if (search) {
        sql += ` AND (borrower LIKE ? OR item LIKE ? OR IFNULL(employee_code, '') LIKE ?)`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }
      sql += ` ORDER BY borrow_date DESC`

      const db = getDatabase()
      const rows = db.prepare(sql).all(...params)
      return res.status(200).json(rows)
    }

    if (method === 'POST') {
      const { borrower, dept, item, qty, borrowDate, dueDate, note, status = 'active', employeeCode = '' } = req.body

      if (!borrower || !dept || !item) {
        return res.status(400).json({ error: 'Missing required fields: borrower, dept, item' })
      }

      try {
        // auto-generate ID: B001, B002, …
        const database = getDatabase()
        const last = database.prepare(`SELECT id FROM borrows WHERE id LIKE 'B%' ORDER BY CAST(SUBSTR(id, 2) AS INTEGER) DESC LIMIT 1`).get()
        console.log('Last borrow ID:', last)
        const num  = last && last.id ? parseInt(last.id.slice(1)) + 1 : 1
        const id   = `B${String(num).padStart(3, '0')}`
        console.log('Generated ID:', id)

        database.prepare(`
          INSERT INTO borrows (id, borrower, employee_code, dept, item, qty, borrow_date, due_date, note, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, borrower, String(employeeCode ?? '').trim(), dept, item, qty ?? 1, borrowDate ?? new Date().toISOString().slice(0, 10), dueDate ?? null, note ?? '', status)

        // Log to activity
        database.prepare(`
          INSERT INTO activity_logs (category, level, message, metadata, timestamp)
          VALUES ('borrow', 'normal', ?, ?, datetime('now'))
        `).run(`New borrow created: ${borrower} ยืม ${item} × ${qty}`, JSON.stringify({borrowId: id, borrower, employeeCode: String(employeeCode ?? '').trim(), dept, item, qty, borrowDate, dueDate, note, status}))

        const newRow = database.prepare(`SELECT * FROM borrows WHERE id = ?`).get(id)
        return res.status(201).json(newRow)
      } catch (insertError) {
        console.error('Insert error:', insertError)
        return res.status(500).json({ error: `Failed to insert borrow: ${insertError.message}` })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
