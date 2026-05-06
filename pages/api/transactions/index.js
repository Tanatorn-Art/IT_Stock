import { readTransactions, createTransaction, getStockById, updateStock } from '../../../lib/stockDb'

export default async function handler(req, res) {
  const { method, query } = req

  try {
    if (method === 'GET') {
      let txns = await readTransactions()
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

      const item = await getStockById(itemId)
      if (!item) return res.status(404).json({ message: 'Item not found' })

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

      // Update stock quantity
      const updatedItem = await updateStock(itemId, {
        quantity: newQty,
        status: newQty <= item.minQuantity ? 'low' : 'active'
      })

      // Create transaction
      const transactionData = {
        itemId,
        itemName: item.name,
        type,
        qty: amount,
        qtyBefore: item.quantity,
        qtyAfter: newQty,
        note: note || '',
        by: by || 'System',
        location: location || ''
      }

      const txnId = await createTransaction(transactionData)
      const txn = {
        txnId,
        ...transactionData,
        createdAt: new Date().toISOString()
      }

      return res.status(201).json({ txn, item: updatedItem })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in transactions API:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
