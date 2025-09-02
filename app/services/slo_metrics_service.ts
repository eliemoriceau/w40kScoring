import { promClient, globalRegistry } from '#start/metrics'

/**
 * Service pour définir et suivre les Service Level Objectives (SLO)
 *
 * SLI = Service Level Indicators (métriques mesurables)
 * SLO = Service Level Objectives (objectifs de performance)
 */
export default class SLOMetricsService {
  // ======================
  // SLO Definitions
  // ======================

  /**
   * Availability SLO: 99.9% uptime (8.7h/year downtime)
   * SLI: Ratio of successful requests over total requests
   */
  static readonly AVAILABILITY_SLO = 0.999 // 99.9%

  /**
   * Latency SLO: 95% of requests under 500ms
   * SLI: 95th percentile response time
   */
  static readonly LATENCY_P95_SLO = 0.5 // 500ms

  /**
   * Error Budget SLO: Less than 0.1% error rate
   * SLI: Ratio of error responses over total responses
   */
  static readonly ERROR_RATE_SLO = 0.001 // 0.1%

  /**
   * Game Creation Performance SLO: 99% of game creations under 1s
   * SLI: Game creation latency P99
   */
  static readonly GAME_CREATION_LATENCY_SLO = 1.0 // 1 second

  /**
   * Security SLO: Zero successful attacks per month
   * SLI: Unauthorized access attempts blocked
   */
  static readonly SECURITY_INCIDENTS_SLO = 0 // Zero incidents

  // ======================
  // SLI Metrics
  // ======================

  private static availabilitySLI = new promClient.Gauge({
    name: 'w40k_sli_availability',
    help: 'Availability SLI - Ratio of successful requests',
    registers: [globalRegistry],
  })

  private static latencyP95SLI = new promClient.Gauge({
    name: 'w40k_sli_latency_p95_seconds',
    help: 'Latency P95 SLI - 95th percentile response time',
    registers: [globalRegistry],
  })

  private static errorRateSLI = new promClient.Gauge({
    name: 'w40k_sli_error_rate',
    help: 'Error Rate SLI - Ratio of error responses',
    registers: [globalRegistry],
  })

  private static gameCreationLatencySLI = new promClient.Gauge({
    name: 'w40k_sli_game_creation_latency_seconds',
    help: 'Game Creation Latency SLI - Time to create a game',
    registers: [globalRegistry],
  })

  private static securityIncidentsSLI = new promClient.Counter({
    name: 'w40k_sli_security_incidents_total',
    help: 'Security Incidents SLI - Number of security incidents',
    labelNames: ['type'],
    registers: [globalRegistry],
  })

  // ======================
  // Error Budget Metrics
  // ======================

  private static availabilityErrorBudget = new promClient.Gauge({
    name: 'w40k_error_budget_availability',
    help: 'Availability error budget remaining (0-1)',
    registers: [globalRegistry],
  })

  private static latencyErrorBudget = new promClient.Gauge({
    name: 'w40k_error_budget_latency',
    help: 'Latency error budget remaining (0-1)',
    registers: [globalRegistry],
  })

  private static errorRateErrorBudget = new promClient.Gauge({
    name: 'w40k_error_budget_error_rate',
    help: 'Error rate error budget remaining (0-1)',
    registers: [globalRegistry],
  })

  // ======================
  // SLO Compliance Metrics
  // ======================

  private static sloCompliance = new promClient.Gauge({
    name: 'w40k_slo_compliance',
    help: 'SLO compliance status (1 = compliant, 0 = breach)',
    labelNames: ['slo_type'],
    registers: [globalRegistry],
  })

  /**
   * Calculer et mettre à jour tous les SLI/SLO
   */
  static async updateSLOMetrics() {
    try {
      // Calculer les SLI actuels (simulé pour l'exemple)
      const availability = await this.calculateAvailability()
      const latencyP95 = await this.calculateLatencyP95()
      const errorRate = await this.calculateErrorRate()
      const gameCreationLatency = await this.calculateGameCreationLatency()

      // Mettre à jour les métriques SLI
      this.availabilitySLI.set(availability)
      this.latencyP95SLI.set(latencyP95)
      this.errorRateSLI.set(errorRate)
      this.gameCreationLatencySLI.set(gameCreationLatency)

      // Calculer les error budgets (budget d'erreur restant)
      const availabilityErrorBudget = Math.max(
        0,
        1 - (1 - availability) / (1 - this.AVAILABILITY_SLO)
      )
      const latencyErrorBudget = Math.max(0, 1 - latencyP95 / this.LATENCY_P95_SLO)
      const errorRateErrorBudget = Math.max(0, 1 - errorRate / this.ERROR_RATE_SLO)

      this.availabilityErrorBudget.set(availabilityErrorBudget)
      this.latencyErrorBudget.set(latencyErrorBudget)
      this.errorRateErrorBudget.set(errorRateErrorBudget)

      // Déterminer la compliance des SLO
      this.sloCompliance.set(
        { slo_type: 'availability' },
        availability >= this.AVAILABILITY_SLO ? 1 : 0
      )
      this.sloCompliance.set({ slo_type: 'latency' }, latencyP95 <= this.LATENCY_P95_SLO ? 1 : 0)
      this.sloCompliance.set({ slo_type: 'error_rate' }, errorRate <= this.ERROR_RATE_SLO ? 1 : 0)
      this.sloCompliance.set(
        { slo_type: 'game_creation' },
        gameCreationLatency <= this.GAME_CREATION_LATENCY_SLO ? 1 : 0
      )
    } catch (error) {
      console.error('Error updating SLO metrics:', error)
    }
  }

  /**
   * Calculer la disponibilité (availability SLI)
   */
  private static async calculateAvailability(): Promise<number> {
    // Simulé pour l'exemple - dans un vrai système, utiliser Prometheus queries
    // Formule: (total_requests - error_requests) / total_requests
    return 0.9995 // 99.95% availability
  }

  /**
   * Calculer la latence P95 (latency SLI)
   */
  private static async calculateLatencyP95(): Promise<number> {
    // Simulé pour l'exemple - dans un vrai système, utiliser histogram_quantile
    return 0.25 // 250ms P95
  }

  /**
   * Calculer le taux d'erreur (error rate SLI)
   */
  private static async calculateErrorRate(): Promise<number> {
    // Simulé pour l'exemple
    return 0.0005 // 0.05% error rate
  }

  /**
   * Calculer la latence de création de partie
   */
  private static async calculateGameCreationLatency(): Promise<number> {
    // Simulé pour l'exemple
    return 0.3 // 300ms average game creation time
  }

  /**
   * Enregistrer un incident de sécurité
   */
  static recordSecurityIncident(type: string) {
    this.securityIncidentsSLI.labels({ type }).inc()
  }

  /**
   * Obtenir les objectifs SLO pour affichage
   */
  static getSLOTargets() {
    return {
      availability: {
        target: this.AVAILABILITY_SLO,
        description: '99.9% uptime (8.7h/year downtime allowed)',
      },
      latency_p95: {
        target: this.LATENCY_P95_SLO,
        description: '95% of requests under 500ms',
      },
      error_rate: {
        target: this.ERROR_RATE_SLO,
        description: 'Less than 0.1% error rate',
      },
      game_creation: {
        target: this.GAME_CREATION_LATENCY_SLO,
        description: '99% of game creations under 1 second',
      },
      security: {
        target: this.SECURITY_INCIDENTS_SLO,
        description: 'Zero successful attacks per month',
      },
    }
  }

  /**
   * Calculer le burn rate (taux de consommation du budget d'erreur)
   */
  static calculateBurnRate(
    actualErrorRate: number,
    sloTarget: number,
    windowHours: number
  ): number {
    const allowedErrorRate = 1 - sloTarget
    const burnRate = actualErrorRate / allowedErrorRate

    // Burn rate normalisé sur une période de 30 jours
    return (burnRate * windowHours) / (30 * 24)
  }

  /**
   * Alerting thresholds basés sur le burn rate
   */
  static getAlertingThresholds() {
    return {
      // Fast burn: 2% budget consommé en 1h = alerte critique
      fast_burn: {
        threshold: 0.02,
        window_hours: 1,
        severity: 'critical',
      },
      // Slow burn: 10% budget consommé en 6h = alerte warning
      slow_burn: {
        threshold: 0.1,
        window_hours: 6,
        severity: 'warning',
      },
    }
  }
}
