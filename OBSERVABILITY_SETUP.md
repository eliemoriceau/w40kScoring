# 🔍 W40K Scoring - Observabilité Stack Setup

Phase 4 - Infrastructure complète Grafana + OpenTelemetry pour monitoring et debugging avancé.

## 🚀 **Architecture d'Observabilité**

```
📊 Grafana Dashboard (Port 3000)
    ↓ [Visualizations + Analytics]
🔍 Tempo - Distributed Tracing (Port 3200)
📈 Prometheus - Metrics (Port 9090)
📋 Loki - Centralized Logs (Port 3100)
    ↓ [OTEL Collector - Port 4317/4318]
🛠️ OpenTelemetry Collector
    ↓ [Auto-instrumentation]
🏗️ W40K Scoring App (AdonisJS + Vue3)
```

## ⚡ **Démarrage Rapide**

### 1. Lancer la Stack d'Observabilité

```bash
# Lancer tous les services d'observabilité
docker-compose -f docker-compose.observability.yml up -d

# Vérifier le statut des services
docker-compose -f docker-compose.observability.yml ps

# Voir les logs en temps réel
docker-compose -f docker-compose.observability.yml logs -f
```

### 2. Accès aux Services

| Service            | URL                           | Credentials           | Description           |
| ------------------ | ----------------------------- | --------------------- | --------------------- |
| **Grafana**        | http://localhost:3000         | admin/w40k-admin-2024 | Dashboards unifiés    |
| **Prometheus**     | http://localhost:9090         | -                     | Métriques et alerting |
| **Loki**           | http://localhost:3100         | -                     | Logs centralisés      |
| **Tempo**          | http://localhost:3200         | -                     | Distributed tracing   |
| **OTEL Collector** | http://localhost:8888/metrics | -                     | Collector metrics     |

### 3. Vérification Santé

```bash
# Health check OpenTelemetry Collector
curl http://localhost:13133/health

# Métriques Prometheus
curl http://localhost:9090/api/v1/targets

# Status Grafana datasources
curl -u admin:w40k-admin-2024 http://localhost:3000/api/datasources
```

## 📊 **Dashboards Disponibles**

### 🎮 Business Overview

- **URL**: http://localhost:3000/d/w40k-business-overview
- **KPIs**: Games créés, utilisateurs actifs, scores moyens
- **Graphiques**: Tendances activité, distribution types de jeux
- **Métriques**: Taux de completion, engagement utilisateurs

### ⚡ Application Performance

- **URL**: http://localhost:3000/d/w40k-app-performance
- **Métriques**: Latence (P50, P95), taux d'erreur, throughput
- **Cache**: Hit ratio, performance par type
- **Database**: Temps de requête, connexions actives

## 🔧 **Configuration des Données**

### Collecte Automatique

Le stack collecte automatiquement :

- ✅ **Métriques HTTP** : Latence, erreurs, throughput
- ✅ **Métriques Système** : CPU, RAM, disque, réseau
- ✅ **Métriques Applicatives** : Cache, database, business KPIs
- ✅ **Logs Structurés** : Avec corrélation traces
- ✅ **Traces Distribuées** : Workflow complets end-to-end

### Sources de Données Configurées

```yaml
Datasources Grafana (auto-provisioned):
├── Prometheus (metrics) ✅
├── Loki (logs) ✅
├── Tempo (traces) ✅
└── Corrélations automatiques entre sources ✅
```

## 📈 **Métriques Disponibles**

### Business Metrics

```promql
# Games créés
w40k_scoring_games_created_total

# Utilisateurs actifs
count(count by (user_id) (increase(w40k_scoring_user_sessions_total[24h])))

# Score moyen par partie
avg(w40k_scoring_average_score)

# Taux de completion
(sum(w40k_scoring_games_completed_total) / sum(w40k_scoring_games_created_total)) * 100
```

### Performance Metrics

```promql
# Latence P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taux d'erreur
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Cache hit rate
(w40k_scoring_cache_hits_total / (w40k_scoring_cache_hits_total + w40k_scoring_cache_misses_total)) * 100

# Request rate
sum(rate(http_requests_total[5m]))
```

## 🔍 **Exploration des Données**

### Grafana Explore

1. **Logs** : http://localhost:3000/explore (Datasource: Loki)

   ```logql
   {service_name="w40k-scoring"} |= "error" | json
   {service_name="w40k-scoring"} |= "traceID" | json | line_format "{{.message}}"
   ```

2. **Métriques** : http://localhost:3000/explore (Datasource: Prometheus)

   ```promql
   rate(http_requests_total[5m])
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

3. **Traces** : http://localhost:3000/explore (Datasource: Tempo)
   - Search by service, operation, tags
   - TraceQL queries pour recherches avancées

## ⚠️ **Alerting (Configuré mais Non-Actif)**

### Règles d'Alerting Disponibles

```yaml
Alertes configurées dans Prometheus:
├── HighHTTPErrorRate (>5% erreurs 5xx) ⚠️
├── HighLatency (P95 >2s) ⚠️
├── LowCacheHitRate (<70%) ⚠️
├── HighCPUUsage (>80%) ⚠️
├── HighMemoryUsage (>85%) ⚠️
└── ServiceDown (up == 0) 🚨
```

### Activation Notifications (Optionnel)

Pour activer les notifications Slack/Email :

```bash
# 1. Configurer Alertmanager
cp observability/configs/alertmanager.yml.example observability/configs/alertmanager.yml

# 2. Modifier docker-compose.observability.yml
# Décommenter la section alertmanager

# 3. Redémarrer
docker-compose -f docker-compose.observability.yml restart
```

## 🔧 **Maintenance & Tuning**

### Gestion du Stockage

```bash
# Taille des volumes
docker system df

# Cleanup des anciennes données (si nécessaire)
docker-compose -f docker-compose.observability.yml down -v
docker volume prune
```

### Configuration Avancée

**Prometheus** (`observability/prometheus.yml`) :

- Rétention : 15 jours par défaut
- Intervalle scraping : 30s
- Targets : Auto-découverte + configuration statique

**Loki** (`observability/loki.yml`) :

- Rétention logs : 7 jours
- Compression automatique
- Index optimisé pour recherches

**Tempo** (`observability/tempo.yml`) :

- Rétention traces : 1 heure (dev)
- Sampling : Configurable via OTEL Collector
- Corrélation metrics via metrics-generator

### Performance Tuning

```yaml
# Pour environnement production, ajuster :
Resource Limits:
├── Prometheus: 2GB RAM, 2 CPU
├── Loki: 1GB RAM, 1 CPU
├── Tempo: 1GB RAM, 1 CPU
├── Grafana: 512MB RAM, 0.5 CPU
└── OTEL Collector: 512MB RAM, 1 CPU

Retention Policies:
├── Prometheus: 30d (production)
├── Loki: 30d (production)
├── Tempo: 24h (production)
└── Sampling: 5-10% (production)
```

## 🚨 **Troubleshooting**

### Services ne Démarrent Pas

```bash
# Vérifier les logs d'erreur
docker-compose -f docker-compose.observability.yml logs service-name

# Problèmes courants :
# 1. Port occupé : modifier les ports dans docker-compose
# 2. Permissions volume : sudo chown -R 472:472 volume-path
# 3. Mémoire insuffisante : ajuster les limits
```

### Données non Collectées

```bash
# Vérifier OTEL Collector
curl http://localhost:13133/health
curl http://localhost:8888/metrics

# Vérifier targets Prometheus
curl http://localhost:9090/api/v1/targets

# Vérifier datasources Grafana
curl -u admin:w40k-admin-2024 http://localhost:3000/api/health
```

### Performance Dégradée

```bash
# Monitoring des containers
docker stats

# Logs de performance
docker-compose -f docker-compose.observability.yml logs --tail=100 otel-collector
docker-compose -f docker-compose.observability.yml logs --tail=100 prometheus
```

## 📚 **Ressources Utiles**

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Loki LogQL](https://grafana.com/docs/loki/latest/logql/)
- [Tempo TraceQL](https://grafana.com/docs/tempo/latest/traceql/)

---

## 🎯 **Phase 4A - Infrastructure : TERMINÉE ✅**

**Stack Complète Déployée** :

- ✅ Docker Compose avec 7 services optimisés
- ✅ OpenTelemetry Collector configuré et fonctionnel
- ✅ 3 backends (Prometheus, Loki, Tempo) intégrés
- ✅ Grafana avec datasources auto-provisionnées
- ✅ 2 dashboards prêts à l'emploi
- ✅ Alerting configuré (notifications en option)
- ✅ Documentation complète setup et maintenance

**Prochaines Étapes** :

- Phase 4B : Instrumentation application W40K
- Phase 4C : Métriques business personnalisées
- Déploiement production avec sécurisation
