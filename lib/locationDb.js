import { getDatabase } from './database.js'

export function readLocations() {
  try {
    const db = getDatabase()
    const locations = db.prepare('SELECT * FROM locations ORDER BY id').all()
    return locations || []
  } catch (error) {
    console.error('Error reading locations:', error)
    return []
  }
}

export function writeLocations(locations) {
  try {
    const db = getDatabase()
    for (const location of locations) {
      db.prepare(`
        INSERT OR REPLACE INTO locations (id, name, description, image, shelfId, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        location.id,
        location.name,
        location.description || '',
        location.image || '',
        location.shelfId || null,
        location.status || 'active',
        location.createdAt || new Date().toISOString(),
        location.updatedAt || new Date().toISOString()
      )
    }
  } catch (error) {
    console.error('Error writing locations:', error)
    throw error
  }
}

export function generateLocationId() {
  try {
    const db = getDatabase()
    const result = db.prepare(`
      SELECT id FROM locations
      WHERE id LIKE 'LOC-%'
      ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC
      LIMIT 1
    `).get()

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

export function getLocationById(id) {
  try {
    const db = getDatabase()
    const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id)
    return location || null
  } catch (error) {
    console.error('Error getting location by ID:', error)
    return null
  }
}

export function updateLocation(id, updates) {
  try {
    const db = getDatabase()
    const fields = Object.keys(updates)
    const values = Object.values(updates)

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    values.push(new Date().toISOString()) // updatedAt
    values.push(id)

    db.prepare(`
      UPDATE locations
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `).run(...values)

    return getLocationById(id)
  } catch (error) {
    console.error('Error updating location:', error)
    throw error
  }
}

export function deleteLocation(id) {
  try {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM locations WHERE id = ?').run(id)
    return result.changes > 0
  } catch (error) {
    console.error('Error deleting location:', error)
    throw error
  }
}

export function createLocation(locationData) {
  try {
    const db = getDatabase()
    const id = generateLocationId()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO locations (id, name, description, image, shelfId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      locationData.name,
      locationData.description || '',
      locationData.image || '',
      locationData.shelfId || null,
      locationData.status || 'active',
      now,
      now
    )

    return getLocationById(id)
  } catch (error) {
    console.error('Error creating location:', error)
    throw error
  }
}
