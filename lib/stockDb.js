import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'stock.json')
const TXN_FILE  = path.join(process.cwd(), 'data', 'transactions.json')

function ensure(file) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8')
}

export function readStock() {
  ensure(DATA_FILE)
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

export function writeStock(data) {
  ensure(DATA_FILE)
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function readTransactions() {
  ensure(TXN_FILE)
  return JSON.parse(fs.readFileSync(TXN_FILE, 'utf8'))
}

export function writeTransactions(data) {
  ensure(TXN_FILE)
  fs.writeFileSync(TXN_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function generateId(items) {
  const nums = items
    .map(i => parseInt(i.id.replace('IT-', '')) || 0)
    .filter(n => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'IT-' + String(max + 1).padStart(3, '0')
}

export function generateTxnId(txns) {
  const nums = txns
    .map(t => parseInt((t.txnId || '').replace('TXN-', '')) || 0)
    .filter(n => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return 'TXN-' + String(max + 1).padStart(5, '0')
}
