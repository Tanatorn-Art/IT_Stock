import { getDatabase } from './database.js'
import fs from 'fs'
import path from 'path'

const DEFAULT_CONFIG_FILE = path.join(process.cwd(), 'data', 'shelfConfig.json')

function getDefaultConfig() {
  try {
    return JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf8'))
  } catch {
    // Fallback if file doesn't exist during first run
    return {
      defaults: {
        rowH: 65,
        beamH: 6,
        uprightW: 6,
        pad: 4,
        x0: 35,
        y0: 10,
        beamColor: '#F59E0B',
        uprightColor: '#3B82F6',
        filledColor: '#10B981',
        emptyColor: '#E2E8F0',
        selectedColor: '#1E40AF',
        nameReplacePattern: 'ชั้น\\s+[A-Z]-\\d+\\s*',
        nameReplaceFlags: 'i',
      },
      shelves: [],
    }
  }
}

export function readShelfConfig() {
  try {
    const db = getDatabase()
    const result = db.prepare('SELECT config FROM shelf_config WHERE id = ?').get('main')

    if (result && result.config) {
      return JSON.parse(result.config)
    } else {
      // Return default config if none exists in database
      return getDefaultConfig()
    }
  } catch (error) {
    console.error('Error reading shelf config:', error)
    return getDefaultConfig()
  }
}

export function writeShelfConfig(data) {
  try {
    const db = getDatabase()
    const configJson = JSON.stringify(data, null, 2)

    db.prepare(`
      INSERT OR REPLACE INTO shelf_config (id, config)
      VALUES (?, ?)
    `).run('main', configJson)

    return data
  } catch (error) {
    console.error('Error writing shelf config:', error)
    throw error
  }
}
