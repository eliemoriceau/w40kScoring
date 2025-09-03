import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (requestOrigin, ctx) => {
    // Define allowed origins based on environment
    const allowedOrigins = [
      // Production domain and subdomains
      'https://w40kscoring.moriceau.dev',
      'https://admin.w40kscoring.moriceau.dev',
      'https://api.w40kscoring.moriceau.dev',
      'https://www.w40kscoring.moriceau.dev',
      // Development origins
      'http://localhost:3333',
      'http://127.0.0.1:3333',
      // Development server (dynamic ports)
      'http://localhost',
      'http://127.0.0.1',
    ]

    // Allow same-origin requests (no origin header) - common for direct server requests
    if (!requestOrigin) {
      return true
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(requestOrigin)) {
      return true
    }

    // In development, allow localhost/127.0.0.1 with any port
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev && (requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:'))) {
      return true
    }

    // Log blocked origins for security monitoring
    console.warn(`CORS: Blocked origin attempt from ${requestOrigin}`)
    // Return false to block origin
    return false
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 86400, // 24 hours cache
})

export default corsConfig
