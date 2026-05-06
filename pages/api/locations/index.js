import { readLocations, createLocation } from '../../../lib/locationDb'

export default async function handler(req, res) {
  const { method, query } = req

  try {
    if (method === 'GET') {
      const locations = await readLocations()
      return res.status(200).json(locations)
    }

    if (method === 'POST') {
      const { name, description, image, shelfId } = req.body
      if (!name) {
        return res.status(400).json({ message: 'name required' })
      }

      const locationData = {
        name: name.trim(),
        description: description || '',
        image: image || '',
        shelfId: shelfId || null,
      }

      const newLocation = await createLocation(locationData)
      return res.status(201).json(newLocation)
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in locations API:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
