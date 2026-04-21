import { readLocations, writeLocations } from '../../../lib/locationDb'

export default function handler(req, res) {
  const { method, query } = req
  const { id } = query

  if (method === 'PUT') {
    const { name, description, image } = req.body
    if (!name) {
      return res.status(400).json({ message: 'name required' })
    }

    const locations = readLocations()
    const idx = locations.findIndex(l => l.id === id)
    if (idx === -1) return res.status(404).json({ message: 'Location not found' })

    locations[idx] = {
      ...locations[idx],
      name: name.trim(),
      description: description || '',
      image: image || locations[idx].image || '',
      updatedAt: new Date().toISOString(),
    }
    writeLocations(locations)

    return res.status(200).json(locations[idx])
  }

  if (method === 'DELETE') {
    const locations = readLocations()
    const idx = locations.findIndex(l => l.id === id)
    if (idx === -1) return res.status(404).json({ message: 'Location not found' })

    locations.splice(idx, 1)
    writeLocations(locations)

    return res.status(200).json({ message: 'Deleted' })
  }

  res.status(405).json({ message: 'Method not allowed' })
}
