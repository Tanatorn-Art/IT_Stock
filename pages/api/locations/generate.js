import { generateLocationsFromShelfConfig, getMissingLocations } from '../../../lib/locationGenerator'

export default function handler(req, res) {
  const { method } = req

  if (method === 'GET') {
    // Get missing locations
    const missing = getMissingLocations()
    return res.status(200).json({ missing, count: missing.length })
  }

  if (method === 'POST') {
    // Generate missing locations
    try {
      const result = generateLocationsFromShelfConfig()
      return res.status(200).json({
        message: 'Generated locations successfully',
        added: result.added,
        total: result.total,
        newLocations: result.newLocations
      })
    } catch (error) {
      console.error('Error generating locations:', error)
      return res.status(500).json({ error: 'Failed to generate locations' })
    }
  }

  res.status(405).json({ message: 'Method not allowed' })
}
