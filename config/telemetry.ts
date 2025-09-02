import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import env from '#start/env'

// Configuration des ressources OpenTelemetry
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'w40k-scoring',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: env.get('NODE_ENV', 'development'),
})

// Configuration du SDK Node.js avec auto-instrumentation
const sdk = new NodeSDK({
  resource,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Instrumentation Pino pour les logs AdonisJS
      '@opentelemetry/instrumentation-pino': {
        enabled: true,
        logHook: (span, record) => {
          // Enrichir les logs avec les données de tracing
          record['trace_id'] = span?.spanContext().traceId
          record['span_id'] = span?.spanContext().spanId
        },
      },
      // Instrumentation HTTP pour les métriques de performance
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      // Instrumentation PostgreSQL
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
    }),
  ],
})

// Initialisation du SDK
try {
  sdk.start()
  console.log('🔍 OpenTelemetry initialized successfully')
} catch (error) {
  console.error('❌ OpenTelemetry initialization failed:', error)
}

export default sdk
