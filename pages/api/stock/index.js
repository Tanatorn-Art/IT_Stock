import { readStock, writeStock, generateId } from '../../../lib/stockDb'

export default function handler(req, res) {
  const { method, query } = req

  if (method === 'GET') {
    const items = readStock()
    const { search, category } = query
    let result = items
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(i =>
        i.name?.toLowerCase().includes(s) ||
        i.id?.toLowerCase().includes(s) ||
        i.brand?.toLowerCase().includes(s) ||
        i.serial?.toLowerCase().includes(s) ||
        i.model?.toLowerCase().includes(s)
      )
    }
    if (category && category !== 'all') {
      result = result.filter(i => i.category === category)
    }
    return res.status(200).json(result)
  }

  if (method === 'POST') {
    const { name, brand, quantity, location } = req.body
    if (!name || !brand || !quantity || !location) {
      return res.status(400).json({ message: 'name, brand, quantity, location required' })
    }
    const items = readStock()
    const now = new Date().toISOString()
    const newItem = {
      ...req.body,
      id: generateId(items),
      status: req.body.quantity <= req.body.minQuantity ? 'low' : 'active',
      createdAt: now,
      updatedAt: now,
    }
    delete newItem.price
    items.push(newItem)
    writeStock(items)
    return res.status(201).json(newItem)
  }

  res.status(405).json({ message: 'Method not allowed' })
}
