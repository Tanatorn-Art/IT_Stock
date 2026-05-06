import { readShelfConfig, writeShelfConfig } from '../../lib/shelfConfigDb'

export default function handler(req, res) {
  if (req.method === 'GET') {
    const config = readShelfConfig()
    return res.status(200).json(config)
  }

  if (req.method === 'PUT') {
    const config = req.body
    if (!config || !config.shelves || !Array.isArray(config.shelves)) {
      return res.status(400).json({ message: 'Invalid config format' })
    }
    // Validate each shelf has required fields
    for (const shelf of config.shelves) {
      if (!shelf.id || !Array.isArray(shelf.cols) || !Array.isArray(shelf.rows)) {
        return res.status(400).json({ message: `Shelf missing required fields (id, cols, rows): ${JSON.stringify(shelf)}` })
      }
    }
    const saved = writeShelfConfig(config)
    return res.status(200).json(saved)
  }

  res.status(405).json({ message: 'Method not allowed' })
}
