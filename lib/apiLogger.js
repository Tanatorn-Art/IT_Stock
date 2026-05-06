import { logActivity } from './logger.js'

/**
 * Simple wrapper for logging API calls
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {number} statusCode - Response status code
 * @param {number} loadTime - Request load time in ms
 * @param {Object} additionalData - Additional data to log
 */
export async function logApiCall(method, endpoint, statusCode, loadTime = 0, additionalData = {}) {
  const logMessage = `${method} ${endpoint} - ${statusCode} - ${loadTime}ms`

  await logActivity('api_request', statusCode >= 400 ? 'error' : 'info', logMessage, {
    method,
    url: endpoint,
    loadTime,
    statusCode,
    timestamp: new Date().toISOString(),
    ...additionalData
  })
}

/**
 * Middleware to log API requests with timing
 * @param {Object} req - Next.js request object
 * @param {string} action - Action being performed
 * @param {Object} additionalData - Additional data to log
 */
export function createApiLogger(req, action = 'api_call', additionalData = {}) {
  const start = Date.now()
  const method = req.method
  const userAgent = req.headers['user-agent'] || 'Unknown'
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1'

  // Return a function to be called after the API operation
  return async (statusCode, error = null) => {
    const loadTime = Date.now() - start

    await logApiCall(method, action, statusCode, loadTime, {
      userAgent,
      ip,
      error: error ? error.message : null,
      ...additionalData
    })
  }
}
