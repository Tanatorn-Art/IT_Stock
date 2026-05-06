import { getStockById, updateStock, readStock, writeStock, softDeleteStock, restoreStock } from '../../../lib/stockDb'
import { deleteImage } from '../../../lib/imageUtils'

export default async function handler(req, res) {
  const { method, query: { id } } = req

  try {
    if (method === 'GET') {
      const item = await getStockById(id)
      if (!item) return res.status(404).json({ message: 'Not found' })
      return res.status(200).json(item)
    }

    if (method === 'PUT') {
      const existingItem = await getStockById(id)
      if (!existingItem) return res.status(404).json({ message: 'Not found' })

      const { name, brand, quantity, location } = req.body
      if (name === undefined || brand === undefined || quantity === undefined || location === undefined) {
        return res.status(400).json({ message: 'name, brand, quantity, location required' })
      }

      const body = { ...req.body }
      delete body.price
      body.status = body.quantity <= body.minQuantity ? 'low' : 'active'

      // Handle image preservation: only update image if it's actually provided
      if (body.image === undefined || body.image === '') {
        // Remove image from body to preserve existing image
        delete body.image
      } else if (existingItem.image && body.image !== existingItem.image) {
        // Delete old image if new image is being uploaded
        deleteImage(existingItem.image)
      }

      const updated = await updateStock(id, body)
      return res.status(200).json(updated)
    }

    if (method === 'DELETE') {
      const item = await getStockById(id)
      if (!item) return res.status(404).json({ message: 'Not found' })

      // Check if item is already disabled (soft deleted)
      const isDisabled = item.disabledAt !== null && item.disabledAt !== undefined

      let result
      if (isDisabled) {
        // Restore the item
        result = await restoreStock(id)
      } else {
        // Soft delete the item
        result = await softDeleteStock(id)
        // Note: We don't delete the image on soft delete as item might be restored later
      }

      return res.status(200).json(result)
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in stock [id] API:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
