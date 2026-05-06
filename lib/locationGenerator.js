import { readLocations, writeLocations, generateLocationId } from './locationDb.js'
import { readShelfConfig } from './shelfConfigDb.js'

/**
 * Generate locations based on shelf configuration
 * Creates locations for all columns and rows defined in each shelf
 */
export function generateLocationsFromShelfConfig() {
  const locations = readLocations()
  const shelfConfig = readShelfConfig()
  const newLocations = []
  
  // Create a map of existing location names for quick lookup
  const existingNames = new Set(locations.map(loc => loc.name))
  
  shelfConfig.shelves.forEach(shelf => {
    shelf.cols.forEach(col => {
      shelf.rows.forEach(row => {
        const locationName = `${col}-${row}`
        
        // Skip if location already exists
        if (existingNames.has(locationName)) {
          return
        }
        
        const newLocation = {
          id: generateLocationId([...locations, ...newLocations]),
          name: locationName,
          description: `ชั้น ${col} ด้านที่ ${row}`,
          shelfId: shelf.id,
          status: 'empty',
          createdAt: new Date().toISOString()
        }
        
        newLocations.push(newLocation)
      })
    })
  })
  
  // Write all locations (existing + new)
  const allLocations = [...locations, ...newLocations]
  writeLocations(allLocations)
  
  return {
    added: newLocations.length,
    total: allLocations.length,
    newLocations
  }
}

/**
 * Get missing locations that should exist based on shelf config
 */
export function getMissingLocations() {
  const locations = readLocations()
  const shelfConfig = readShelfConfig()
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
