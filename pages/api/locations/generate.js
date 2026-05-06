import { generateLocationsFromShelfConfig, getMissingLocations } from '../../../lib/locationGenerator'

export default async function handler(req, res) {
  const { method } = req

  try {
    if (method === 'GET') {
      // Get missing locations
      const missing = await getMissingLocations()
      return res.status(200).json({ missing, count: missing.length })
    }

    if (method === 'POST') {
      // Generate missing locations
      const result = await generateLocationsFromShelfConfig()
      return res.status(200).json({
        message: 'Generated locations successfully',
        added: result.added,
        total: result.total,
        newLocations: result.newLocations
      })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in generate locations API:', error)
    res.status(500).json({ error: 'Failed to generate locations' })
  }
}
