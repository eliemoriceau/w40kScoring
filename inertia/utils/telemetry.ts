/**
 * Frontend Telemetry Utils for W40K Scoring
 * 
 * 🎯 REAL USER MONITORING (RUM) - Vue 3 + Inertia.js
 * Collecte les métriques de performance frontend et événements business :
 * - Core Web Vitals (LCP, FID, CLS, TTFB)
 * - User interactions et navigation
 * - Business events (game actions, score updates)
 * - Error tracking avec contexte utilisateur
 * 
 * 📊 EXPORT vers OTEL Collector :
 * - Custom metrics via API endpoint
 * - Performance observations
 * - User journey tracking
 */

interface TelemetryEvent {
  name: string
  type: 'performance' | 'business' | 'error' | 'navigation'
  timestamp: number
  userId?: string
  gameId?: string
  attributes: Record<string, string | number | boolean>
}

interface WebVitals {
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

class W40KTelemetry {
  private events: TelemetryEvent[] = []
  private webVitals: WebVitals = {}
  private userId?: string
  private gameId?: string
  private isEnabled = true

  constructor() {
    this.initializeWebVitals()
    this.setupPerformanceObserver()
    this.setupErrorTracking()
    
    // Batch send events every 30 seconds
    setInterval(() => this.flushEvents(), 30000)
    
    // Send events before page unload
    window.addEventListener('beforeunload', () => this.flushEvents())
  }

  /**
   * Initialize Web Vitals collection
   */
  private initializeWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.webVitals.lcp = lastEntry.startTime
      this.trackEvent('web_vitals_lcp', 'performance', {
        lcp: lastEntry.startTime,
        element: (lastEntry as any).element?.tagName || 'unknown',
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        this.webVitals.fid = (entry as any).processingStart - entry.startTime
        this.trackEvent('web_vitals_fid', 'performance', {
          fid: this.webVitals.fid,
          input_type: (entry as any).name,
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      this.webVitals.cls = clsValue
      this.trackEvent('web_vitals_cls', 'performance', {
        cls: clsValue,
      })
    }).observe({ entryTypes: ['layout-shift'] })

    // Time to First Byte (depuis Navigation Timing)
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      this.webVitals.ttfb = navTiming.responseStart - navTiming.fetchStart
      this.trackEvent('web_vitals_ttfb', 'performance', {
        ttfb: this.webVitals.ttfb,
      })
    })
  }

  /**
   * Setup Performance Observer for resource timing
   */
  private setupPerformanceObserver() {
    // Resource timing (JS, CSS, images, API calls)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming
        
        // Track slow resources (>1s)
        if (resource.duration > 1000) {
          this.trackEvent('slow_resource', 'performance', {
            resource_name: resource.name,
            duration_ms: Math.round(resource.duration),
            resource_type: this.getResourceType(resource.name),
            size_bytes: resource.transferSize || 0,
          })
        }
      }
    }).observe({ entryTypes: ['resource'] })

    // Long tasks (blocking main thread >50ms)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackEvent('long_task', 'performance', {
          duration_ms: Math.round(entry.duration),
          start_time: Math.round(entry.startTime),
        })
      }
    }).observe({ entryTypes: ['longtask'] })
  }

  /**
   * Setup global error tracking
   */
  private setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', 'error', {
        error_message: event.message,
        error_file: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        stack: event.error?.stack || 'No stack trace',
      })
    })

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('promise_rejection', 'error', {
        error_message: event.reason?.message || event.reason,
        stack: event.reason?.stack || 'No stack trace',
      })
    })

    // Vue error handler (à configurer dans l'app Vue)
    this.setupVueErrorHandler()
  }

  /**
   * Configuration pour Vue 3 error handler
   */
  private setupVueErrorHandler() {
    // Cette méthode sera appelée depuis l'app Vue principale
    if (window.Vue && window.Vue.config) {
      window.Vue.config.errorHandler = (error: Error, instance: any, info: string) => {
        this.trackEvent('vue_error', 'error', {
          error_message: error.message,
          error_info: info,
          component_name: instance?.$options?.name || 'unknown',
          stack: error.stack || 'No stack trace',
        })
      }
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, gameId?: string) {
    this.userId = userId
    this.gameId = gameId
  }

  /**
   * Track custom business event
   */
  trackBusinessEvent(event: string, attributes: Record<string, any> = {}) {
    this.trackEvent(`business_${event}`, 'business', attributes)
  }

  /**
   * Track navigation event
   */
  trackNavigation(from: string, to: string, duration?: number) {
    this.trackEvent('navigation', 'navigation', {
      from_route: from,
      to_route: to,
      duration_ms: duration || 0,
    })
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(action: string, element: string, attributes: Record<string, any> = {}) {
    this.trackEvent('user_interaction', 'business', {
      action,
      element,
      ...attributes,
    })
  }

  /**
   * Generic event tracking
   */
  private trackEvent(
    name: string,
    type: TelemetryEvent['type'],
    attributes: Record<string, any> = {}
  ) {
    if (!this.isEnabled) return

    const event: TelemetryEvent = {
      name,
      type,
      timestamp: Date.now(),
      userId: this.userId,
      gameId: this.gameId,
      attributes: {
        url: window.location.pathname,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        connection_type: (navigator as any).connection?.effectiveType || 'unknown',
        ...attributes,
      },
    }

    this.events.push(event)

    // Auto-flush if too many events
    if (this.events.length >= 50) {
      this.flushEvents()
    }
  }

  /**
   * Send events to backend
   */
  private async flushEvents() {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      await fetch('/api/telemetry/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          events: eventsToSend,
          web_vitals: this.webVitals,
          session_id: this.getSessionId(),
        }),
      })
    } catch (error) {
      console.warn('Failed to send telemetry events:', error)
      // Re-queue events for next attempt (max 100 events)
      this.events = [...eventsToSend.slice(-50), ...this.events].slice(0, 100)
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('w40k_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('w40k_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Determine resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image'
    if (url.includes('/api/')) return 'api'
    if (url.includes('/inertia')) return 'inertia'
    return 'other'
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (!enabled) {
      this.events = []
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    return {
      webVitals: this.webVitals,
      eventsQueued: this.events.length,
      sessionId: this.getSessionId(),
    }
  }
}

// Create global instance
const telemetry = new W40KTelemetry()

// Export for use in components
export default telemetry

// Export helper functions for common use cases
export const trackGameAction = (action: string, gameId: string, attributes = {}) => {
  telemetry.trackBusinessEvent(`game_${action}`, { game_id: gameId, ...attributes })
}

export const trackScoreUpdate = (scoreType: string, roundId: string, value: number) => {
  telemetry.trackBusinessEvent('score_updated', {
    score_type: scoreType,
    round_id: roundId,
    score_value: value,
  })
}

export const trackUserLogin = (userId: string) => {
  telemetry.setUserContext(userId)
  telemetry.trackBusinessEvent('user_login', { user_id: userId })
}

export const trackUserLogout = () => {
  telemetry.trackBusinessEvent('user_logout', { user_id: telemetry['userId'] })
  telemetry.setUserContext('', '')
}

export const trackRouteChange = (from: string, to: string) => {
  const startTime = performance.now()
  // Use with Vue router hooks
  setTimeout(() => {
    const duration = performance.now() - startTime
    telemetry.trackNavigation(from, to, duration)
  }, 0)
}

// Declare global for Vue error handler setup
declare global {
  interface Window {
    Vue?: any
    w40kTelemetry?: W40KTelemetry
  }
}

// Make available globally
window.w40kTelemetry = telemetry