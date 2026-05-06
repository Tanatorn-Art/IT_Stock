import { readLocations, createLocation } from './locationDb.js'
import { readShelfConfig } from './shelfConfigDb.js'

/**
 * Generate locations based on shelf configuration
 * Creates locations for all columns and rows defined in each shelf
 */
export async function generateLocationsFromShelfConfig() {
  const locations = await readLocations()
  const shelfConfig = await readShelfConfig()
  const newLocations = []

  // Create a map of existing location names for quick lookup
  const existingNames = new Set(locations.map(loc => loc.name))

  for (const shelf of shelfConfig.shelves) {
    for (const col of shelf.cols) {
      for (const row of shelf.rows) {
        const locationName = `${col}-${row}`

        // Skip if location already exists
        if (existingNames.has(locationName)) {
          continue
        }

        const locationData = {
          name: locationName,
          description: `ชั้น ${col} ด้านที่ ${row}`,
          shelfId: shelf.id,
          status: 'empty'
        }

        try {
          const newLocation = await createLocation(locationData)
          newLocations.push(newLocation)
          existingNames.add(locationName) // Add to set to avoid duplicates in this batch
        } catch (error) {
          console.error(`Error creating location ${locationName}:`, error)
        }
      }
    }
  }

  const allLocations = await readLocations()

  return {
    added: newLocations.length,
    total: allLocations.length,
    newLocations
  }
}

/**
 * Get missing locations that should exist based on shelf config
 */
export async function getMissingLocations() {
  const locations = await readLocations()
  const shelfConfig = await readShelfConfig()
  const existingNames = new Set(locations.map(loc => loc.name))
  const missing = []

  shelfConfig.shelves.forEach(shelf => {
    shelf.cols.forEach(col => {
      shelf.rows.forEach(row => {
        const locationName = `${col}-${row}`
        if (!existingNames.has(locationName)) {
          missing.push({
            name: locationName,
            description: `ชั้น ${col} ด้านที่ ${row}`,
            shelfId: shelf.id
          })
        }
      })
    })
  })

  return missing
}
