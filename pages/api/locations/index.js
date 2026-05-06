import { readLocations, createLocation } from '../../../lib/locationDb'
import { readShelfConfig } from '../../../lib/shelfConfigDb'

export default async function handler(req, res) {
  const { method, query } = req

  try {
    if (method === 'GET') {
      const locations = await readLocations()
      const shelfConfig = await readShelfConfig()

      // Create a set of valid location names based on current shelf configuration
      const validLocationNames = new Set()

      shelfConfig.shelves.forEach(shelf => {
        shelf.cols.forEach(col => {
          shelf.rows.forEach(row => {
            validLocationNames.add(`${col}-${row}`)
          })
        })
      })

      // Filter locations to only include those that match current shelf config
      const filteredLocations = locations.filter(location =>
        validLocationNames.has(location.name)
      )

      return res.status(200).json(filteredLocations)
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
