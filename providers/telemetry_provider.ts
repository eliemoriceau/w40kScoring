import { ApplicationService } from '@adonisjs/core/types'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import env from '#start/env'

/**
 * TelemetryProvider - Configuration centralisée OpenTelemetry pour W40K Scoring
 *
 * 🎯 ARCHITECTURE HEXAGONALE - Infrastructure Layer
 * Configure l'instrumentation automatique et manuelle pour toutes les couches :
 * - Interface Layer (Controllers HTTP)
 * - Application Layer (Services métier)
 * - Infrastructure Layer (Repositories, Database)
 *
 * 🔧 AUTO-INSTRUMENTATION INCLUSE :
 * - HTTP requests (incoming/outgoing)
 * - PostgreSQL queries via pg driver
 * - Pino logger integration
 * - DNS, FS operations
 *
 * 📊 EXPORTERS OTLP :
 * - Traces → Tempo via OTEL Collector
 * - Metrics → Prometheus via OTEL Collector
 */
export default class TelemetryProvider {
  private sdk: NodeSDK | null = null

  constructor(protected app: ApplicationService) {}

  /**
   * Register method appelée au démarrage d'AdonisJS
   */
  register() {
    // La configuration est faite ici pour être prête avant le démarrage des services
    this.configureSDK()
  }

  /**
   * Boot method appelée après l'enregistrement de tous les providers
   */
  async boot() {
    if (this.shouldInitializeTelemetry()) {
      await this.initializeTelemetry()
    }
  }

  /**
   * Ready method appelée une fois l'application prête
   */
  async ready() {
    if (this.sdk) {
      console.log('🔍 W40K Scoring - OpenTelemetry initialized successfully', {
        service: 'w40k-scoring',
        collector_endpoint: env.get('OTEL_EXPORTER_OTLP_ENDPOINT'),
        environment: env.get('NODE_ENV'),
        auto_instrumentations: true,
      })
    }
  }

  /**
   * Shutdown method pour cleanup propre
   */
  async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown()
      console.log('🔍 OpenTelemetry SDK shutdown completed')
    }
  }

  /**
   * Configure le SDK OpenTelemetry avec ressources et instrumentations
   */
  private configureSDK() {
    // 1. Resource identification
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'w40k-scoring',
      [SEMRESATTRS_SERVICE_VERSION]: env.get('APP_VERSION', '1.0.0'),
      'service.environment': env.get('NODE_ENV', 'development'),
      'service.instance.id': `${process.pid}-${Date.now()}`,
      'deployment.environment': env.get('NODE_ENV', 'development'),
    })

    // 2. OTLP Exporters configuration
    const traceExporter = new OTLPTraceExporter({
      url: `${env.get('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318')}/v1/traces`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const metricExporter = new OTLPMetricExporter({
      url: `${env.get('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318')}/v1/metrics`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 3. Metric reader configuration
    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 5000, // Export every 5 seconds
    })

    // 4. Auto-instrumentations pour W40K Scoring
    const instrumentations = getNodeAutoInstrumentations({
      // HTTP - pour les requêtes entrantes/sortantes
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          // Enrichir les spans HTTP avec contexte métier W40K
          span.setAttributes({
            'w40k.service': 'http-layer',
            'w40k.user_agent': request.headers['user-agent'] || 'unknown',
          })
        },
        responseHook: (span, response) => {
          // Ajouter le contexte de réponse
          span.setAttributes({
            'w40k.response.content_type': response.getHeader('content-type') || 'unknown',
          })
        },
      },

      // PostgreSQL - pour les requêtes de base
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,
        addSqlCommenterComments: true,
      },

      // Pino Logger - pour la corrélation logs/traces
      '@opentelemetry/instrumentation-pino': {
        logHook: (span, record) => {
          // Injection des IDs de trace dans les logs
          record['traceId'] = span.spanContext().traceId
          record['spanId'] = span.spanContext().spanId
        },
      },

      // DNS et FS désactivés pour réduire le bruit
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    })

    // 5. SDK Configuration
    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
      instrumentations,
      // Sampling - 100% en dev, configurable en production
      // sampler: this.createSampler(),
    })
  }

  /**
   * Vérifie si la télémétrie doit être initialisée
   */
  private shouldInitializeTelemetry(): boolean {
    const isEnabled = env.get('OTEL_ENABLED', 'true') === 'true'
    const hasEndpoint = !!env.get('OTEL_EXPORTER_OTLP_ENDPOINT')

    if (!isEnabled) {
      console.log('🔍 OpenTelemetry disabled via OTEL_ENABLED=false')
      return false
    }

    if (!hasEndpoint) {
      console.warn('🔍 OpenTelemetry disabled - missing OTEL_EXPORTER_OTLP_ENDPOINT')
      return false
    }

    return true
  }

  /**
   * Initialise la télémétrie
   */
  private async initializeTelemetry() {
    try {
      this.sdk?.start()

      // Test de connectivité avec le collector
      await this.testCollectorConnectivity()

      console.log('🔍 W40K Scoring telemetry initialized', {
        service: 'w40k-scoring',
        environment: env.get('NODE_ENV'),
        collector: env.get('OTEL_EXPORTER_OTLP_ENDPOINT'),
      })
    } catch (error) {
      console.error('🔍 Failed to initialize telemetry', {
        error: error.message,
        stack: error.stack,
      })
      // En cas d'erreur, on continue sans télémétrie pour ne pas bloquer l'app
    }
  }

  /**
   * Test de connectivité avec le collector OTEL
   */
  private async testCollectorConnectivity() {
    const endpoint = env.get('OTEL_EXPORTER_OTLP_ENDPOINT')
    if (!endpoint) return

    try {
      // Test simple HTTP vers le collector
      const response = await fetch(`${endpoint}/v1/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceSpans: [] }),
      })

      if (response.ok || response.status === 400) {
        // 200 OK ou 400 (données vides) = collector accessible
        console.log('🔍 OTEL Collector connectivity: OK', {
          endpoint,
          status: response.status,
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.warn('🔍 OTEL Collector connectivity issue', {
        endpoint,
        error: error.message,
      })
      // Warn seulement, pas de throw pour éviter de bloquer l'app
    }
  }
}
