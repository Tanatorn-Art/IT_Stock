import { getLogs, getLogStats, getLogCategories, logActivity } from '../../lib/logger.js'

export default async function handler(req, res) {
  const { method, query } = req

  try {
    if (method === 'GET') {
      const {
        level,
        category,
        limit = 50,
        offset = 0,
        startDate,
        endDate,
        action = 'list'
      } = query

      if (action === 'stats') {
        // Get log statistics
        const stats = await getLogStats()
        return res.status(200).json({ stats })
      }

      if (action === 'categories') {
        // Get log categories
        const categories = await getLogCategories()
        return res.status(200).json({ categories })
      }

      // Get logs with filtering
      const options = {
        level: level || null,
        category: category || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
        startDate: startDate || null,
        endDate: endDate || null
      }

      const logs = await getLogs(options)
      return res.status(200).json({ logs })
    }

    if (method === 'POST') {
      const logEntry = req.body

      // Validate log entry structure
      if (!logEntry || !logEntry.timestamp || !logEntry.category || !logEntry.message) {
        return res.status(400).json({ error: 'Invalid log entry' })
      }

      // Log HTTP request
      await logActivity(
        logEntry.category,
        logEntry.level,
        logEntry.message,
        logEntry.metadata || {}
      )

      return res.status(200).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Logs API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
