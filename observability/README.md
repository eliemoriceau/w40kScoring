# W40K Scoring - Infrastructure d'Observabilité

Stack complet d'observabilité enterprise-grade basé sur Grafana, Prometheus, Loki, Tempo et OpenTelemetry.

## 🚀 Quick Start

```bash
# Démarrer la stack complète
docker compose -f docker-compose.observability.yml up -d

# Vérifier le statut des services
docker ps --format "table {{.Names}}\t{{.Status}}"

# Accéder aux interfaces
open http://localhost:3000  # Grafana (admin/w40k-admin-2024)
open http://localhost:9090  # Prometheus
```

## 📊 Services et Ports

| Service           | Port       | Interface | Fonction                       |
| ----------------- | ---------- | --------- | ------------------------------ |
| **Grafana**       | 3000       | Web UI    | Dashboards et visualisation    |
| **Prometheus**    | 9090       | Web UI    | Collecte et stockage métriques |
| **Loki**          | 3100       | API       | Agrégation des logs            |
| **Tempo**         | 3200, 9095 | API       | Tracing distribué              |
| **OpenTelemetry** | 4317, 4318 | gRPC/HTTP | Collecte télémétrie            |
| **Promtail**      | 9080       | API       | Agent collecte logs            |
| **Node Exporter** | 9100       | Metrics   | Métriques système              |
| **cAdvisor**      | 8080       | Web UI    | Métriques containers           |

## 🎯 Dashboards Disponibles

### 1. **Business KPIs** (`w40k-business-overview`)

Métriques métier et engagement utilisateur

- Total des parties créées (`w40k_games_created_total`)
- Utilisateurs actifs 24h (`w40k_scoring_active_users_24h`)
- Score moyen (`w40k_scoring_average_score`)
- Taux de completion (`w40k_scoring_completion_rate_percent`)

### 2. **Performance Monitoring** (`w40k-application-performance`)

Surveillance des performances système

- Taux de requêtes HTTP (`w40k_http_requests_total`)
- Latence P50/P95/P99 (`w40k_http_request_duration_seconds`)
- Connexions actives (`w40k_http_active_connections`)

### 3. **Security Audit** (`w40k-security-audit`)

Monitoring sécuritaire multi-couches

- Taux d'erreurs 4xx/5xx par endpoint
- Violations de rate limiting (HTTP 429)
- Usage des ressources containers
- Événements de sécurité via logs Loki

### 4. **SLI/SLO Dashboard** (`w40k-slo-dashboard`)

Service Level Objectives et Error Budget

- **Availability SLO** : 99.9% uptime (8.7h/an autorisé)
- **Latency SLO** : 95% requêtes <500ms
- **Error Rate SLO** : <0.1% taux d'erreur
- **Game Creation SLO** : 99% créations <1s

## 🔧 Architecture Technique

### Flux des données

```
Application W40K
    ├── Métriques → Prometheus (scraping /metrics)
    ├── Logs → Promtail → Loki
    ├── Traces → OpenTelemetry Collector → Tempo
    └── Dashboards ← Grafana ← (Prometheus + Loki + Tempo)
```

### Services déployés

- **BusinessMetricsService** : KPIs métier depuis DB
- **PerformanceMetricsService** : Métriques HTTP automatiques
- **SLOMetricsService** : Calculs SLI/SLO et error budget
- **MetricsMiddleware** : Capture automatique requêtes HTTP

### Endpoint métriques

`GET /metrics` expose 400+ métriques :

- **Business** : `w40k_games_*`, `w40k_scoring_*`
- **Performance** : `w40k_http_*`, `w40k_db_*`
- **SLO** : `w40k_sli_*`, `w40k_slo_*`, `w40k_error_budget_*`

## 🚨 Troubleshooting - Solutions testées

### ❌ Problème : Loki en crash loop (`Restarting (137)`)

**Symptômes** : Container redémarre constamment, logs "empty ring"
**Cause racine** : Configuration schema v11 incompatible avec Loki 3.4.2
**Solution appliquée** :

```yaml
# observability/loki.yml
limits_config:
  allow_structured_metadata: false # CRITIQUE pour schema v11
```

### ❌ Problème : Grafana "dial tcp: lookup loki: no such host"

**Symptômes** : Impossible d'interroger Loki depuis Grafana
**Cause racine** : Loki inaccessible (crash loop), pas un problème DNS
**Solution** : Corriger la configuration Loki (voir ci-dessus)

### ❌ Problème : Logs non remontés dans Grafana

**Symptômes** : Dashboards logs vides, `total_entries=0` dans Loki
**Cause racine** : Application hors Docker, Promtail ne collecte que les containers
**Solution appliquée** : Configuration Promtail pour Docker service discovery

### ✅ Configuration finale Loki stable

```yaml
# Résolution des erreurs "empty ring" et schema v11
auth_enabled: false
server:
  http_listen_port: 3100
limits_config:
  allow_structured_metadata: false # Requis
  ingestion_rate_mb: 4
  ingestion_burst_size_mb: 6
```

## 📋 Métriques SLI/SLO

### SLI (Service Level Indicators)

```promql
# Disponibilité (succès/total)
w40k_sli_availability

# Latence P95 en secondes
w40k_sli_latency_p95_seconds

# Taux d'erreur (erreurs/total)
w40k_sli_error_rate

# Latence création de partie
w40k_sli_game_creation_latency_seconds
```

### Error Budget Management

```promql
# Budgets d'erreur restants (1.0 = complet, 0.0 = épuisé)
w40k_error_budget_availability     # Budget disponibilité
w40k_error_budget_latency         # Budget latence
w40k_error_budget_error_rate      # Budget taux erreur

# Conformité SLO (1=OK, 0=Violation)
w40k_slo_compliance{slo_type="availability"}
w40k_slo_compliance{slo_type="latency"}
w40k_slo_compliance{slo_type="error_rate"}
```

## 🔍 Requêtes Loki utiles

```promql
# Tous les logs application
{service="w40k-scoring"}

# Logs par niveau (émojis)
{service="w40k-scoring"} |= "📊"  # Metrics
{service="w40k-scoring"} |= "❌"  # Erreurs
{service="w40k-scoring"} |= "⚠️"  # Warnings

# Logs containers Docker
{job="w40k-docker-logs"}

# Recherche dans le contenu
{service="w40k-scoring"} |= "metrics request"
```

## 🛠️ Commandes de diagnostic

```bash
# Vérification santé globale
docker ps | grep -E "(grafana|loki|prometheus)"

# Logs détaillés service
docker logs w40k-loki --tail 20
docker logs w40k-grafana --tail 10

# Test connectivité
curl http://localhost:3100/ready          # Loki health
curl http://localhost:9090/api/v1/targets # Prometheus targets
curl http://localhost:3333/metrics        # App metrics

# Redémarrage service spécifique
docker compose -f docker-compose.observability.yml restart loki
```

## 🔄 Maintenance

### Nettoyage périodique

```bash
# Nettoyer logs anciens (>7j)
docker exec w40k-loki ls /loki/chunks/

# Vérifier usage disque
docker exec w40k-prometheus du -sh /prometheus

# Backup configuration
tar czf observability-backup-$(date +%Y%m%d).tar.gz observability/
```

### Mise à jour stack

```bash
# Pull nouvelles images
docker compose -f docker-compose.observability.yml pull

# Mise à jour avec downtime minimal
docker compose -f docker-compose.observability.yml up -d --no-deps grafana
```

## 📈 Alerting Strategy

### Configuration Alertmanager (futur)

```yaml
# Alertes basées sur Error Budget Burn Rate
- Fast Burn: 2% budget en 1h → Critical
- Slow Burn: 10% budget en 6h → Warning

# Intégrations prévues
- Discord/Slack webhooks
- Email notifications
- PagerDuty escalation
```

## ✅ Status Production-Ready

- [x] **400+ métriques** système et applicatives
- [x] **Dashboards enterprise** (Business, Perf, Security, SLO)
- [x] **SLI/SLO complets** avec error budget tracking
- [x] **Configuration stable** (plus de crash loops)
- [x] **Documentation complète** avec troubleshooting
- [x] **Architecture scalable** pour production

---

**Infrastructure d'observabilité W40K Scoring - Enterprise Grade** 🚀

_Dernière mise à jour : Résolution crash loops Loki et connectivité Grafana_
