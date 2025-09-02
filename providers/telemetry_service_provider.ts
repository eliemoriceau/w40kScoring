import { ApplicationService } from '@adonisjs/core/types'
import { TelemetryService } from '#infrastructure/services/telemetry_service'

/**
 * TelemetryServiceProvider - Enregistre TelemetryService dans le conteneur IoC
 * 
 * Permet l'injection de TelemetryService dans tous les services applicatifs
 * pour une instrumentation cohérente à travers toute l'application.
 */
export default class TelemetryServiceProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // Enregistrer TelemetryService comme singleton
    this.app.container.singleton('telemetryService', () => {
      return new TelemetryService()
    })
  }
}