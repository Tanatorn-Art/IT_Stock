import { readStock, writeStock } from '../../../lib/stockDb'

export default function handler(req, res) {
  const { method, query: { id } } = req
  const items = readStock()
  const idx = items.findIndex(i => i.id === id)

  if (method === 'GET') {
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    return res.status(200).json(items[idx])
  }

  if (method === 'PUT') {
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    const body = { ...req.body }
    delete body.price
    const updated = {
      ...items[idx],
      ...body,
      id: items[idx].id,
      createdAt: items[idx].createdAt,
      updatedAt: new Date().toISOString(),
    }
    updated.status = updated.quantity <= updated.minQuantity ? 'low' : 'active'
    items[idx] = updated
    writeStock(items)
    return res.status(200).json(updated)
  }

  if (method === 'DELETE') {
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    const removed = items.splice(idx, 1)[0]
    writeStock(items)
    return res.status(200).json(removed)
  }

  res.status(405).json({ message: 'Method not allowed' })
}
