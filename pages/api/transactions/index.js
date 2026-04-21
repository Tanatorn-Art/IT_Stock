import { readTransactions, writeTransactions, readStock, writeStock, generateTxnId } from '../../../lib/stockDb'

export default function handler(req, res) {
  const { method, query } = req

  if (method === 'GET') {
    let txns = readTransactions()
    const { limit, itemId } = query
    if (itemId) txns = txns.filter(t => t.itemId === itemId)
    txns = txns.slice().reverse()
    if (limit) txns = txns.slice(0, parseInt(limit))
    return res.status(200).json(txns)
  }

  if (method === 'POST') {
    const { itemId, type, qty, note, by, location } = req.body
    if (!itemId || !type || !qty) {
      return res.status(400).json({ message: 'itemId, type, qty required' })
    }

    const items = readStock()
    const idx = items.findIndex(i => i.id === itemId)
    if (idx === -1) return res.status(404).json({ message: 'Item not found' })

    const item = items[idx]
    const amount = parseInt(qty)
    let newQty = item.quantity

    if (type === 'IN') {
      newQty = item.quantity + amount
    } else if (type === 'OUT') {
      if (item.quantity < amount) {
        return res.status(400).json({ message: 'Stock ไม่เพียงพอ', current: item.quantity })
      }
      newQty = item.quantity - amount
    } else {
      return res.status(400).json({ message: 'type must be IN or OUT' })
    }

    items[idx] = {
      ...item,
      quantity: newQty,
      status: newQty <= item.minQuantity ? 'low' : 'active',
      updatedAt: new Date().toISOString(),
    }
    writeStock(items)

    const txns = readTransactions()
    const txn = {
      txnId: generateTxnId(txns),
      itemId,
      itemName: item.name,
      type,
      qty: amount,
      qtyBefore: item.quantity,
      qtyAfter: newQty,
      note: note || '',
      by: by || 'System',
      location: location || '',
      createdAt: new Date().toISOString(),
    }
    txns.push(txn)
    writeTransactions(txns)

    return res.status(201).json({ txn, item: items[idx] })
  }

  res.status(405).json({ message: 'Method not allowed' })
}
