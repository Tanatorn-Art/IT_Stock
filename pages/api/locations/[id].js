import { getLocationById, updateLocation, deleteLocation } from '../../../lib/locationDb'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  try {
    if (method === 'PUT') {
      const { name, description, image, shelfId } = req.body
      if (!name) {
        return res.status(400).json({ message: 'name required' })
      }

      const existingLocation = await getLocationById(id)
      if (!existingLocation) {
        return res.status(404).json({ message: 'Location not found' })
      }

      const updates = {
        name: name.trim(),
        description: description || '',
        image: image || existingLocation.image || '',
        shelfId: shelfId !== undefined ? shelfId : existingLocation.shelfId,
      }

      const updatedLocation = await updateLocation(id, updates)
      return res.status(200).json(updatedLocation)
    }

    if (method === 'DELETE') {
      const existingLocation = await getLocationById(id)
      if (!existingLocation) {
        return res.status(404).json({ message: 'Location not found' })
      }

      const deleted = await deleteLocation(id)
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete location' })
      }

      return res.status(200).json({ message: 'Deleted' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in location API:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
