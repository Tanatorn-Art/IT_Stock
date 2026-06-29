import { readStock, createStock } from '../../../lib/stockDb'
import { createApiLogger } from '../../../lib/apiLogger.js'

export default async function handler(req, res) {
  const { method, query } = req
  const logApi = createApiLogger(req, 'stock', { query })

  try {
    if (method === 'GET') {
      const { includeDisabled } = query
      const items = await readStock(includeDisabled === 'true')
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

      // Sort by createdAt descending (newest first)
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      // Paginate if page is specified
      const { page, limit } = query
      if (page) {
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 20
        const startIndex = (pageNum - 1) * limitNum
        const endIndex = pageNum * limitNum
        result = result.slice(startIndex, endIndex)
      }

      await logApi(200)
      return res.status(200).json(result)
    }

    if (method === 'POST') {
      const { name, brand, quantity, location } = req.body
      if (name === undefined || brand === undefined || quantity === undefined || location === undefined) {
        await logApi(400, new Error('Missing required fields'))
        return res.status(400).json({ message: 'name, brand, quantity, location required' })
      }

      const stockData = { ...req.body }
      delete stockData.price
      stockData.status = stockData.quantity <= stockData.minQuantity ? 'low' : 'active'

      const newItem = await createStock(stockData)
      await logApi(201, null, { itemId: newItem.id })
      return res.status(201).json(newItem)
    }

    await logApi(405)
    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in stock API:', error)
    await logApi(500, error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
