# W40K Scoring - Observability Stack

Stack complet d'observabilité basé sur Grafana, Prometheus, Loki, Tempo et OpenTelemetry.

## 🚀 Quick Start

```bash
# Démarrer la stack complète
docker-compose -f docker-compose.observability.yml up -d

# Accéder à Grafana
open http://localhost:3000
# Login: admin / w40k-admin-2024
```

## 📁 Structure des Fichiers

```
observability/
├── README.md                          # Ce fichier
├── otel-collector.yml                 # Configuration OpenTelemetry Collector
├── prometheus.yml                     # Configuration Prometheus
├── alert.rules.yml                    # Règles d'alerting Prometheus
├── loki.yml                          # Configuration Loki (logs)
├── tempo.yml                         # Configuration Tempo (traces)
└── grafana/
    ├── datasources/
    │   └── datasources.yml           # Auto-provisioning datasources
    ├── dashboards/
    │   └── dashboards.yml           # Auto-provisioning dashboards
    └── dashboard-configs/
        ├── w40k-business-overview.json      # KPIs business
        └── w40k-application-performance.json # Performance app
```

## 🔧 Configuration

### Ports Utilisés

| Service        | Port      | Description              |
| -------------- | --------- | ------------------------ |
| Grafana        | 3000      | Interface web principale |
| Prometheus     | 9090      | Métriques et alerting    |
| Loki           | 3100      | API logs                 |
| Tempo          | 3200      | API traces               |
| OTEL Collector | 4317/4318 | Réception télémétrie     |
| OTEL Metrics   | 8888      | Métriques collector      |

### Variables d'Environnement

```bash
# Grafana
GF_SECURITY_ADMIN_PASSWORD=w40k-admin-2024

# Personnalisables
PROMETHEUS_RETENTION=15d
LOKI_RETENTION=168h
TEMPO_RETENTION=1h
```

## 📊 Dashboards Inclus

1. **W40K Business Overview**
   - Games créés/terminés
   - Utilisateurs actifs
   - Scores moyens
   - Distribution types de jeux

2. **W40K Application Performance**
   - Latence HTTP (P50, P95)
   - Taux d'erreur
   - Performance cache
   - Métriques database

## 🔍 Exploration des Données

### Prometheus Queries

```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Latency P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Loki LogQL

```logql
# Erreurs applicatives
{service_name="w40k-scoring"} |= "ERROR"

# Avec trace ID
{service_name="w40k-scoring"} |= "traceID" | json
```

### Tempo TraceQL

```
# Traces lentes
{ duration > 1s }

# Par service
{ service.name = "w40k-scoring" }
```

## 🚨 Alerting

Règles configurées mais notifications désactivées par défaut :

- **HighHTTPErrorRate** : >5% erreurs 5xx
- **HighLatency** : P95 >2s
- **LowCacheHitRate** : <70%
- **ServiceDown** : Service indisponible

## 🛠 Maintenance

### Cleanup

```bash
# Arrêter et supprimer volumes
docker-compose -f docker-compose.observability.yml down -v

# Cleanup Docker
docker system prune
```

### Logs

```bash
# Logs temps réel
docker-compose -f docker-compose.observability.yml logs -f

# Logs spécifique
docker-compose -f docker-compose.observability.yml logs grafana
```

## 🔗 Documentation Complète

Voir [OBSERVABILITY_SETUP.md](../OBSERVABILITY_SETUP.md) pour la documentation complète.
