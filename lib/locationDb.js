import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'locations.json')

function ensure(file) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8')
}

export function readLocations() {
  ensure(DATA_FILE)
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

export function writeLocations(data) {
  ensure(DATA_FILE)
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function generateLocationId(locations) {
  const nums = locations
    .map(l => parseInt(l.id.replace('LOC-', '')) || 0)
    .filter(n => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'LOC-' + String(max + 1).padStart(3, '0')
}
