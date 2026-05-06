import { getDatabase } from './database.js'
import { promisify } from 'util'
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

export async function readShelfConfig() {
  const db = getDatabase()
  const get = promisify(db.get.bind(db))

  try {
    const result = await get('SELECT config FROM shelf_config WHERE id = ?', ['main'])

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

export async function writeShelfConfig(data) {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    const configJson = JSON.stringify(data, null, 2)

    await run(`
      INSERT OR REPLACE INTO shelf_config (id, config)
      VALUES (?, ?)
    `, ['main', configJson])

    return data
  } catch (error) {
    console.error('Error writing shelf config:', error)
    throw error
  }
}
