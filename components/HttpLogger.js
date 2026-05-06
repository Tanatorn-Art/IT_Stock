import { useEffect } from 'react'

export default function HttpLogger() {
  useEffect(() => {
    const logPageVisit = () => {
      const start = performance.now()

      // Log page visit
      const logEntry = {
        timestamp: new Date().toISOString(),
        category: 'http_request',
        level: 'info',
        message: `GET ${window.location.pathname} - Loading...`,
        metadata: {
          method: 'GET',
          url: window.location.pathname,
          loadTime: 0,
          userAgent: navigator.userAgent,
          ip: null // Will be set server-side
        }
      }

      // Send initial log entry
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      }).catch(console.error)

      // Log page load completion
      const logPageLoad = () => {
        const loadTime = Math.round(performance.now() - start)
        const completeLogEntry = {
          timestamp: new Date().toISOString(),
          category: 'http_request',
          level: 'info',
          message: `GET ${window.location.pathname} - ${loadTime}ms`,
          metadata: {
            method: 'GET',
            url: window.location.pathname,
            loadTime,
            userAgent: navigator.userAgent,
            ip: null
          }
        }

        fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeLogEntry)
        }).catch(console.error)
      }

      // Log when page is fully loaded
      if (document.readyState === 'complete') {
        logPageLoad()
      } else {
        window.addEventListener('load', logPageLoad)
      }
    }

    logPageVisit()

    // Intercept fetch calls to log API requests
    const originalFetch = window.fetch
    window.fetch = async function(...args) {
      const start = performance.now()
      const [url, options = {}] = args
      const method = options.method || 'GET'

      try {
        const response = await originalFetch.apply(this, args)
        const loadTime = Math.round(performance.now() - start)

        // Only log API calls, not the logging API itself
        if (typeof url === 'string' && url.includes('/api/') && !url.includes('/api/logs')) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            category: 'api_request',
            level: response.ok ? 'info' : 'error',
            message: `${method} ${url} - ${response.status} - ${loadTime}ms`,
            metadata: {
              method,
              url,
              loadTime,
              statusCode: response.status,
              userAgent: navigator.userAgent,
              ip: null
            }
          }

          fetch('/api/logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry)
          }).catch(console.error)
        }

        return response
      } catch (error) {
        const loadTime = Math.round(performance.now() - start)

        if (typeof url === 'string' && url.includes('/api/') && !url.includes('/api/logs')) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            category: 'api_request',
            level: 'error',
            message: `${method} ${url} - ERROR - ${loadTime}ms`,
            metadata: {
              method,
              url,
              loadTime,
              statusCode: 500,
              error: error.message,
              userAgent: navigator.userAgent,
              ip: null
            }
          }

          fetch('/api/logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry)
          }).catch(console.error)
        }

        throw error
      }
    }

    return () => {
      // Restore original fetch on cleanup
      window.fetch = originalFetch
    }
  }, [])

  return null
}
