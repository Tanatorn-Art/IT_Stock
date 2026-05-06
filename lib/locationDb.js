import { getDatabase } from './database.js'
import { promisify } from 'util'

export async function readLocations() {
  const db = getDatabase()
  const all = promisify(db.all.bind(db))

  try {
    const locations = await all('SELECT * FROM locations ORDER BY id')
    return locations
  } catch (error) {
    console.error('Error reading locations:', error)
    return []
  }
}

export async function writeLocations(locations) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    // This is a simple implementation - in practice, you might want to use transactions
    // for better performance and consistency
    for (const location of locations) {
      await run(`
        INSERT OR REPLACE INTO locations (id, name, description, image, shelfId, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        location.id,
        location.name,
        location.description || '',
        location.image || '',
        location.shelfId || null,
        location.status || 'active',
        location.createdAt || new Date().toISOString(),
        location.updatedAt || new Date().toISOString()
      ])
    }
  } catch (error) {
    console.error('Error writing locations:', error)
    throw error
  }
}

export async function generateLocationId() {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const result = await get(`
      SELECT id FROM locations
      WHERE id LIKE 'LOC-%'
      ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC
      LIMIT 1
    `)

    if (result) {
      const num = parseInt(result.id.replace('LOC-', '')) || 0
      return 'LOC-' + String(num + 1).padStart(3, '0')
    } else {
      return 'LOC-001'
    }
  } catch (error) {
    console.error('Error generating location ID:', error)
    return 'LOC-001'
  }
}

export async function getLocationById(id) {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const location = await get('SELECT * FROM locations WHERE id = ?', [id])
    return location || null
  } catch (error) {
    console.error('Error getting location by ID:', error)
    return null
  }
}

export async function updateLocation(id, updates) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const fields = Object.keys(updates)
    const values = Object.values(updates)

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    values.push(new Date().toISOString()) // updatedAt
    values.push(id)

    await run(`
      UPDATE locations
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `, values)

    return await getLocationById(id)
  } catch (error) {
    console.error('Error updating location:', error)
    throw error
  }
}

export async function deleteLocation(id) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const result = await run('DELETE FROM locations WHERE id = ?', [id])
    return result.changes > 0
  } catch (error) {
    console.error('Error deleting location:', error)
    throw error
  }
}

export async function createLocation(locationData) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const id = await generateLocationId()
    const now = new Date().toISOString()

    await run(`
      INSERT INTO locations (id, name, description, image, shelfId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      locationData.name,
      locationData.description || '',
      locationData.image || '',
      locationData.shelfId || null,
      locationData.status || 'active',
      now,
      now
    ])

    return await getLocationById(id)
  } catch (error) {
    console.error('Error creating location:', error)
    throw error
  }
}
