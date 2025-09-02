import promClient from 'prom-client'

// Exporter le client Prometheus pour utilisation dans d'autres services
export { promClient }

// Créer un registre global pour les métriques
export const globalRegistry = new promClient.Registry()

// Collecter les métriques par défaut du système
promClient.collectDefaultMetrics({
  register: globalRegistry,
  prefix: 'w40k_scoring_',
})

// Métriques business créées une seule fois
let businessMetricsInitialized = false
let w40kAppInfo: promClient.Gauge<string>
let totalGamesMetric: promClient.Gauge<string>
let activeUsersMetric: promClient.Gauge<string>
let averageScoreMetric: promClient.Gauge<string>
let completionRateMetric: promClient.Gauge<string>
let gamesByTypeMetric: promClient.Gauge<string>
let gamesByStatusMetric: promClient.Gauge<string>
let weeklyGrowthMetric: promClient.Gauge<string>
let totalUsersMetric: promClient.Gauge<string>
let activeUsers7dMetric: promClient.Gauge<string>
let avgGamesPerUserMetric: promClient.Gauge<string>
let retentionRateMetric: promClient.Gauge<string>
let completedGamesMetric: promClient.Gauge<string>
let userSessionsMetric: promClient.Counter<string>

export function initializeBusinessMetrics() {
  if (businessMetricsInitialized) return

  // Métriques custom W40K - Application Info
  w40kAppInfo = new promClient.Gauge({
    name: 'w40k_app_info',
    help: 'W40K Scoring application info',
    labelNames: ['version', 'environment', 'service'],
    registers: [globalRegistry],
  })

  // Métriques Business KPIs
  totalGamesMetric = new promClient.Gauge({
    name: 'w40k_games_created_total',
    help: 'Total number of games created',
    registers: [globalRegistry],
  })

  activeUsersMetric = new promClient.Gauge({
    name: 'w40k_scoring_active_users_24h',
    help: 'Number of active users in the last 24 hours',
    registers: [globalRegistry],
  })

  averageScoreMetric = new promClient.Gauge({
    name: 'w40k_scoring_average_score',
    help: 'Average score across all completed games',
    registers: [globalRegistry],
  })

  completionRateMetric = new promClient.Gauge({
    name: 'w40k_scoring_completion_rate_percent',
    help: 'Percentage of games that have been completed',
    registers: [globalRegistry],
  })

  // Métriques par type de jeu
  gamesByTypeMetric = new promClient.Gauge({
    name: 'w40k_scoring_games_by_type_total',
    help: 'Number of games by type',
    labelNames: ['game_type'],
    registers: [globalRegistry],
  })

  // Métriques par statut
  gamesByStatusMetric = new promClient.Gauge({
    name: 'w40k_scoring_games_by_status_total',
    help: 'Number of games by status',
    labelNames: ['status'],
    registers: [globalRegistry],
  })

  // Métriques de croissance
  weeklyGrowthMetric = new promClient.Gauge({
    name: 'w40k_scoring_weekly_growth_percent',
    help: 'Weekly growth percentage of games created',
    registers: [globalRegistry],
  })

  // Métriques d'engagement utilisateur
  totalUsersMetric = new promClient.Gauge({
    name: 'w40k_scoring_total_users',
    help: 'Total number of registered users',
    registers: [globalRegistry],
  })

  activeUsers7dMetric = new promClient.Gauge({
    name: 'w40k_scoring_active_users_7d',
    help: 'Number of active users in the last 7 days',
    registers: [globalRegistry],
  })

  avgGamesPerUserMetric = new promClient.Gauge({
    name: 'w40k_scoring_avg_games_per_user',
    help: 'Average number of games per user',
    registers: [globalRegistry],
  })

  retentionRateMetric = new promClient.Gauge({
    name: 'w40k_scoring_user_retention_rate',
    help: 'User retention rate (users who return after 30 days)',
    registers: [globalRegistry],
  })

  // Métriques spécifiques pour les dashboards Grafana
  completedGamesMetric = new promClient.Gauge({
    name: 'w40k_scoring_games_completed_total',
    help: 'Total number of completed games',
    registers: [globalRegistry],
  })

  // Métriques de sessions utilisateur (simulées pour les dashboards)
  userSessionsMetric = new promClient.Counter({
    name: 'w40k_scoring_user_sessions_total',
    help: 'Total number of user sessions',
    labelNames: ['user_id'],
    registers: [globalRegistry],
  })

  businessMetricsInitialized = true
}

export function updateBusinessMetrics(businessMetrics: any, engagementMetrics: any) {
  // Assurer que les métriques sont initialisées
  initializeBusinessMetrics()

  w40kAppInfo.set(
    {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'w40k-scoring',
    },
    1
  )

  totalGamesMetric.set(businessMetrics.totalGames)
  activeUsersMetric.set(businessMetrics.activeUsers24h)
  averageScoreMetric.set(businessMetrics.averageScore)
  completionRateMetric.set(businessMetrics.completionRate)

  // Reset and set games by type
  gamesByTypeMetric.reset()
  Object.entries(businessMetrics.gamesByType).forEach(([type, count]) => {
    gamesByTypeMetric.set({ game_type: type }, count as number)
  })

  // Reset and set games by status
  gamesByStatusMetric.reset()
  Object.entries(businessMetrics.gamesByStatus).forEach(([status, count]) => {
    gamesByStatusMetric.set({ status: status }, count as number)
  })

  weeklyGrowthMetric.set(businessMetrics.weeklyGrowth.growth)
  totalUsersMetric.set(engagementMetrics.totalUsers)
  activeUsers7dMetric.set(engagementMetrics.activeUsers7d)
  avgGamesPerUserMetric.set(engagementMetrics.avgGamesPerUser)
  retentionRateMetric.set(engagementMetrics.retentionRate)
  completedGamesMetric.set(businessMetrics.gamesByStatus.COMPLETED || 0)
}

export default globalRegistry
