import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'shelfConfig.json')
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

function ensure() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultConfig(), null, 2), 'utf8')
  }
}

export function readShelfConfig() {
  ensure()
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

export function writeShelfConfig(data) {
  ensure()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
  return data
}
