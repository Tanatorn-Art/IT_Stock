import { readLocations, writeLocations, generateLocationId } from '../../../lib/locationDb'

export default function handler(req, res) {
  const { method, query } = req

  if (method === 'GET') {
    const locations = readLocations()
    return res.status(200).json(locations)
  }

  if (method === 'POST') {
    const { name, description, image, shelfId } = req.body
    if (!name) {
      return res.status(400).json({ message: 'name required' })
    }

    const locations = readLocations()
    const location = {
      id: generateLocationId(locations),
      name: name.trim(),
      description: description || '',
      image: image || '',
      shelfId: shelfId || null,
      createdAt: new Date().toISOString(),
    }
    locations.push(location)
    writeLocations(locations)

    return res.status(201).json(location)
  }

  res.status(405).json({ message: 'Method not allowed' })
}
