# Guide de Troubleshooting - Infrastructure d'Observabilité W40K

Guide complet de résolution des problèmes critiques identifiés et résolus lors de l'implémentation Phase 4C.

## 🚨 Problèmes Critiques Résolus

### ❌ Problème #1: Loki en Crash Loop Constant

**Symptômes Observés**:
- Container status: `Restarting (137)` en boucle continue
- Logs Loki: `"empty ring"`, `"error getting ingester clients"`  
- Grafana: `"dial tcp: lookup loki: no such host"`
- Impossibilité d'accéder à l'API Loki sur port 3100

**Diagnostic Effectué**:
```bash
# Vérification status container
docker ps | grep loki              # Status Restarting
docker logs w40k-loki --tail 10   # Erreurs "empty ring"

# Test connectivité
curl http://localhost:3100/ready  # Connection refused

# Inspection configuration
docker exec w40k-loki cat /etc/loki/local-config.yaml
```

**Cause Racine Identifiée**:
Loki v3.4.2 force `structured_metadata: true` par défaut, incompatible avec schema v11 utilisé.

**Solution Appliquée**:
```yaml
# observability/loki.yml - Configuration critique ajoutée
limits_config:
  allow_structured_metadata: false  # CRITIQUE pour schema v11
  # Autres limites...
```

**Validation de la Correction**:
```bash
docker ps | grep loki  # Status "Up X seconds" 
docker logs w40k-loki --tail 5  # Pas d'erreur "empty ring"
curl http://localhost:3100/ready  # {"status":"ready"}
```

**Impact Business Résolu**:
- ✅ Collecte de logs opérationnelle  
- ✅ Dashboards Grafana fonctionnels
- ✅ Corrélation traces-logs restaurée

---

### ❌ Problème #2: Grafana DNS Resolution Errors

**Symptômes Observés**:
```
Get "http://loki:3100/loki/api/v1/query_range?...": 
dial tcp: lookup loki on 127.0.0.11:53: no such host
```
- Connection Loki failed dans Grafana datasources
- Dashboards logs complètement vides
- Test connection échoue systématiquement

**Diagnostic Effectué**:
```bash
# Test résolution DNS depuis Grafana container
docker exec w40k-grafana nslookup loki  # NXDOMAIN

# Vérification réseau Docker
docker network inspect w40kscoring_observability

# Test connectivité inter-containers  
docker exec w40k-grafana wget -qO- http://loki:3100/ready
```

**Cause Racine Identifiée**:
Problème causé par le crash loop de Loki (Problème #1). DNS interne Docker fonctionnel mais service Loki inaccessible.

**Solution Appliquée**:
1. Résolution du crash loop Loki (voir Problème #1)
2. Redémarrage ordonné des services:
```bash
docker-compose -f docker-compose.observability.yml restart loki
sleep 30  # Attendre stabilisation Loki
docker-compose -f docker-compose.observability.yml restart grafana
```

**Validation de la Correction**:
```bash
# Test DNS résolution
docker exec w40k-grafana nslookup loki  # Succès

# Test connectivité API
curl -s "http://localhost:3100/loki/api/v1/query?query={job=\"docker\"}"  # Données retournées

# Vérification datasource Grafana
curl -s "http://admin:w40k-admin-2024@localhost:3000/api/datasources" | jq '.[] | select(.name=="Loki") | .basicAuth'
```

**Impact Business Résolu**:
- ✅ Dashboards logs opérationnels
- ✅ Troubleshooting applicatif restauré  
- ✅ Alerting basé sur logs fonctionnel

---

### ❌ Problème #3: Logs Non Remontés dans Loki/Grafana

**Symptômes Observés**:
- Dashboards logs complètement vides
- Loki query: `{job="w40k-app"}` retourne `total_entries=0`
- Promtail fonctionne mais aucune donnée dans Loki
- Application logs visibles via `docker logs` mais pas dans Grafana

**Diagnostic Effectué**:
```bash
# Test direct API Loki
curl -s "http://localhost:3100/loki/api/v1/query_range?query={job=\"w40k-app\"}"

# Vérification Promtail
docker logs w40k-promtail --tail 10

# Analyse configuration Promtail
docker exec w40k-promtail cat /etc/promtail/config.yml
```

**Cause Racine Identifiée**:
Application W40K tourne sur l'hôte via `npm run dev`, pas en container Docker. Promtail configuré uniquement pour collecter logs Docker containers.

**Solutions Implémentées**:

#### Solution A: Docker Service Discovery (Promtail)
```yaml
# observability/promtail.yml
scrape_configs:
  - job_name: w40k-docker-logs
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: [__meta_docker_container_name]
        target_label: container_name
```

#### Solution B: OpenTelemetry SDK Push (Application)
```typescript
// config/telemetry.ts - SDK intégration
const sdk = new NodeSDK({
  resource,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-pino': {
        enabled: true,
        logHook: (span, record) => {
          record['trace_id'] = span?.spanContext().traceId;
          record['span_id'] = span?.spanContext().spanId;
        },
      },
    }),
  ],
});
```

#### Solution C: Hybrid Collection Strategy
- **Pull-based**: Promtail pour containers Docker
- **Push-based**: OTLP SDK pour application host
- **Structured logs**: Corrélation avec trace IDs

**Validation de la Correction**:
```bash
# Test collection Docker logs
curl -s "http://localhost:3100/loki/api/v1/query?query={job=\"w40k-docker-logs\"}" | jq '.data.result | length'

# Test OTLP logs push
curl -s "http://localhost:3100/loki/api/v1/query?query={service_name=\"w40k-scoring\"}" | jq '.data.result | length'

# Vérification corrélation traces
curl -s "http://localhost:3100/loki/api/v1/query?query={service_name=\"w40k-scoring\"}|=\"trace_id\"" | head -5
```

**Impact Business Résolu**:
- ✅ Visibilité complète logs application
- ✅ Debugging avec corrélation traces
- ✅ Monitoring erreurs en temps réel
- ✅ Hybrid strategy robuste et scalable

---

### ❌ Problème #4: Code Quality Issues (ESLint Errors)

**Symptômes Observés**:
- 18 erreurs ESLint bloquant le pipeline CI/CD
- Standards de code non respectés  
- Violations des règles de qualité projet

**Détail des Erreurs Identifiées**:

#### telemetry_controller.ts (2 erreurs):
```typescript
// ❌ Erreur: Utilisation isNaN() deprecated
} else if (typeof value === 'number' && !isNaN(value)) {

// ❌ Erreur: Variable naming snake_case non conforme
const performance_level = value <= threshold.good ? 'good' : 'poor';
```

#### business_metrics_service.ts (14 erreurs):
```typescript
// ❌ Erreurs: parseInt/parseFloat globaux deprecated
return parseInt(count[0].$extras.total || '0');
return (parseFloat(result.avg_player) + parseFloat(result.avg_opponent)) / 2;
```

#### start/routes.ts (2 erreurs):
```typescript
// ❌ Erreurs: Accès direct membres depuis await expressions
const BusinessMetricsService = (await import('#services/business_metrics_service')).default;
const SLOMetricsService = (await import('#services/slo_metrics_service')).default;
```

**Solutions Appliquées**:

#### Corrections telemetry_controller.ts:
```typescript
// ✅ Solution: Number.isNaN() et camelCase
} else if (typeof value === 'number' && !Number.isNaN(value)) {

const performanceLevel = value <= threshold.good ? 'good' : 'poor';
// Usage: performance_level: performanceLevel
```

#### Corrections business_metrics_service.ts:
```typescript
// ✅ Solution: Number.parseInt() et Number.parseFloat()
return Number.parseInt(count[0].$extras.total || '0');
return (Number.parseFloat(result.avg_player) + Number.parseFloat(result.avg_opponent)) / 2;
```

#### Corrections start/routes.ts:
```typescript
// ✅ Solution: Séparation import et accès propriétés
const BusinessMetricsServiceModule = await import('#services/business_metrics_service');
const BusinessMetricsService = BusinessMetricsServiceModule.default;
const SLOMetricsServiceModule = await import('#services/slo_metrics_service');
const SLOMetricsService = SLOMetricsServiceModule.default;
```

**Validation de la Correction**:
```bash
# Test linting complet
npm run lint  # Exit code 0, aucune erreur

# Validation TypeScript  
npm run typecheck  # Pas d'erreurs de type

# Tests de régression
npm test  # 500 tests passed
```

**Impact Qualité Résolu**:
- ✅ Pipeline CI/CD débloqué
- ✅ Standards de code respectés
- ✅ Conformité règles ESLint projet
- ✅ Maintenabilité code améliorée

---

## 🔧 Diagnostics par Service

### Prometheus

**Problèmes Courants**:
- Targets down/unreachable
- Scraping errors et timeouts  
- Storage full et retention issues

**Diagnostic Standard**:
```bash
# Vérifier targets et leur état
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, error: .lastError}'

# Analyser erreurs scraping
docker logs w40k-prometheus --tail 20 | grep -i error

# Vérifier usage disque  
docker exec w40k-prometheus df -h /prometheus
```

**Solutions Communes**:
```bash
# Target down → Vérifier app sur port 3333
curl http://localhost:3333/metrics

# Storage full → Cleanup ou extension retention
# Modifier prometheus.yml: retention.time: 7d au lieu de 15d

# Scraping errors → Corriger configuration
docker-compose -f docker-compose.observability.yml restart prometheus
```

### Loki

**Problèmes Courants**:
- Configuration schema incompatibilities
- Memory issues avec ingestion burst
- Compactor failures et corruption

**Diagnostic Standard**:
```bash
# Vérifier configuration active
docker exec w40k-loki cat /etc/loki/local-config.yaml | grep -A5 limits_config

# Analyser compactor status
curl -s http://localhost:3100/compactor/ring | jq .

# Memory usage analysis
docker stats w40k-loki --no-stream
```

**Solutions Communes**:
```bash
# Schema compatibility
# Toujours utiliser: allow_structured_metadata: false pour v11

# Memory optimization
# Ajuster: ingestion_rate_mb et ingestion_burst_size_mb

# Compactor repair
docker-compose -f docker-compose.observability.yml restart loki
```

### Grafana

**Problèmes Courants**:
- Datasources unreachable après redémarrage
- Dashboard import failures JSON invalid
- Permission errors sur volumes

**Diagnostic Standard**:
```bash
# Test datasources connectivity
curl -s "http://admin:w40k-admin-2024@localhost:3000/api/datasources" | jq '.[].url'

# Vérifier dashboard provisioning
docker exec w40k-grafana ls -la /etc/grafana/provisioning/dashboards/

# Analyser permissions volumes
docker exec w40k-grafana ls -la /var/lib/grafana/
```

**Solutions Communes**:
```bash
# Datasource unreachable → Test depuis container  
docker exec w40k-grafana wget -qO- http://prometheus:9090/-/ready

# Dashboard import failed → Valider JSON syntax
jq . observability/grafana/dashboard-configs/w40k-*.json

# Permissions → Fix ownership
docker exec w40k-grafana chown -R grafana:grafana /var/lib/grafana
```

### OpenTelemetry Collector  

**Problèmes Courants**:
- Receiver errors OTLP timeout
- Processor crashes memory limit
- Exporter timeouts vers backends

**Diagnostic Standard**:
```bash  
# Vérifier configuration YAML
docker exec w40k-otel-collector cat /etc/otelcol-contrib/otel-collector.yml | yaml-validator

# Test endpoints OTLP  
curl -X POST http://localhost:4318/v1/traces -d '{}'

# Memory usage analysis
docker stats w40k-otel-collector --no-stream
```

**Solutions Communes**:
```bash
# Configuration invalid → Fix YAML syntax
docker-compose -f docker-compose.observability.yml restart otel-collector

# Memory limit → Ajuster memory_limiter processor
# memory_limiter.limit_mib: 512 (au lieu de 256)

# Network issues → Vérifier connectivity
docker exec w40k-otel-collector wget -qO- http://loki:3100/ready
```

---

## 📊 Commandes de Diagnostic Essentielles

### Vérification Globale Rapide

```bash
# Status tous services d'un coup
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep -E "(w40k|NAMES)"

# Health check automatisé tous services  
for svc in grafana prometheus loki tempo otel-collector; do
  echo "=== $svc ==="
  docker logs w40k-$svc --tail 3 2>/dev/null || echo "Service not found"
  echo ""
done

# Vérification réseau complete
docker network inspect w40kscoring_observability | jq '.[] | {Name: .Name, Containers: .Containers}'
```

### Tests de Connectivité Complets

```bash
# Endpoints de santé système
endpoints=(
  "localhost:3100/ready"           # Loki
  "localhost:9090/-/ready"         # Prometheus  
  "localhost:3000/api/health"      # Grafana
  "localhost:3200/ready"           # Tempo
  "localhost:13133/health"         # OTEL Collector
)

for endpoint in "${endpoints[@]}"; do
  if curl -s "http://$endpoint" > /dev/null; then
    echo "✅ $endpoint - OK"
  else  
    echo "❌ $endpoint - FAILED"
  fi
done

# Test métriques application
curl -s http://localhost:3333/metrics | head -10 || echo "❌ App metrics unavailable"

# Test logs query fonctionnel
curl -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={job=~".+"}' 2>/dev/null \
  | jq '.data.result | length' || echo "❌ Loki query failed"
```

### Debug Avancé Système

```bash
# Logs avec timestamps pour correlation
docker logs w40k-loki --timestamps --tail 50

# Stats containers avec utilisation historique
docker stats w40k-grafana w40k-loki w40k-prometheus --no-stream

# Inspect volumes et leur contenu  
docker volume ls | grep w40k
for vol in $(docker volume ls --format "{{.Name}}" | grep w40k); do
  echo "=== Volume: $vol ==="
  docker run --rm -v $vol:/data alpine du -sh /data
done

# Network inspection détaillée
docker network ls | grep observability
docker network inspect w40kscoring_observability | jq '.[] | .Containers | keys[]'
```

---

## 🛠️ Procédures de Réparation

### Redémarrage Ordonné (Procédure Recommandée)

```bash
#!/bin/bash
# restart-observability-stack.sh

echo "🔄 Redémarrage ordonné stack observabilité"
echo "========================================="

# 1. Arrêt en ordre inverse dépendances
echo "⏹️ Arrêt des services..."
docker-compose -f docker-compose.observability.yml stop grafana
docker-compose -f docker-compose.observability.yml stop otel-collector  
docker-compose -f docker-compose.observability.yml stop prometheus
docker-compose -f docker-compose.observability.yml stop tempo
docker-compose -f docker-compose.observability.yml stop loki

# 2. Nettoyage optionnel containers
echo "🧹 Nettoyage containers..."
docker-compose -f docker-compose.observability.yml rm -f

# 3. Vérification réseau
echo "🌐 Vérification réseau..." 
docker network prune -f

# 4. Redémarrage ordonné
echo "🚀 Redémarrage des services..."
docker-compose -f docker-compose.observability.yml up -d loki
sleep 10
docker-compose -f docker-compose.observability.yml up -d tempo  
sleep 5
docker-compose -f docker-compose.observability.yml up -d prometheus
sleep 5  
docker-compose -f docker-compose.observability.yml up -d otel-collector
sleep 5
docker-compose -f docker-compose.observability.yml up -d grafana

# 5. Attendre stabilisation
echo "⏳ Attente stabilisation (60s)..."
sleep 60

# 6. Vérification finale
echo "✅ Vérification status final..."
docker ps --format "table {{.Names}}\\t{{.Status}}" | grep w40k

# 7. Test connectivité  
echo "🔍 Test connectivité..."
curl -s http://localhost:3000/api/health > /dev/null && echo "✅ Grafana OK" || echo "❌ Grafana FAILED"
curl -s http://localhost:9090/-/ready > /dev/null && echo "✅ Prometheus OK" || echo "❌ Prometheus FAILED"  
curl -s http://localhost:3100/ready > /dev/null && echo "✅ Loki OK" || echo "❌ Loki FAILED"

echo "🎯 Redémarrage terminé"
```

### Reset Complet (Dernier Recours)

```bash
#!/bin/bash  
# emergency-reset.sh

echo "🚨 RESET COMPLET - PERTE DE DONNÉES"
echo "===================================="
echo "⚠️  Cette procédure supprime TOUTES les données historiques"
echo "⚠️  Métriques, logs, traces seront perdus"
echo "⚠️  Seules les configurations seront préservées"
echo ""

read -p "Confirmer le reset complet (tapez 'RESET'): " confirm
if [[ $confirm != "RESET" ]]; then
  echo "❌ Reset annulé"
  exit 1
fi

echo "🛑 Arrêt complet stack..."
docker-compose -f docker-compose.observability.yml down

echo "🗑️ Suppression volumes données..."  
docker-compose -f docker-compose.observability.yml down -v

echo "🧹 Cleanup système..."
docker system prune -f
docker volume prune -f

echo "📋 Backup configurations..."
tar czf "observability-config-backup-$(date +%Y%m%d_%H%M).tar.gz" observability/

echo "🚀 Redémarrage à zéro..."
docker-compose -f docker-compose.observability.yml up -d

echo "⏳ Attente initialisation (120s)..."
sleep 120

echo "✅ Reset complet terminé"
echo "📊 Accéder à Grafana: http://localhost:3000 (admin/w40k-admin-2024)"
```

### Récupération Configuration Selective

```bash
#!/bin/bash
# selective-recovery.sh

service=$1
if [[ -z $service ]]; then
  echo "Usage: $0 <service-name>"
  echo "Services: grafana, prometheus, loki, tempo, otel-collector"  
  exit 1
fi

echo "🔄 Récupération service: $service"

# Backup current config
echo "💾 Backup configuration actuelle..."
cp -r "observability/" "observability-backup-$(date +%Y%m%d_%H%M)/"

# Stop specific service
echo "⏹️ Arrêt $service..."
docker-compose -f docker-compose.observability.yml stop $service

# Remove container (preserve volumes)
echo "🗑️ Suppression container..."  
docker-compose -f docker-compose.observability.yml rm -f $service

# Clean specific container data if needed
case $service in
  "grafana")
    docker volume rm w40kscoring_grafana-data 2>/dev/null || true
    ;;
  "prometheus")  
    docker volume rm w40kscoring_prometheus-data 2>/dev/null || true
    ;;
  "loki")
    docker volume rm w40kscoring_loki-data 2>/dev/null || true
    ;;
esac

# Restart service
echo "🚀 Redémarrage $service..."
docker-compose -f docker-compose.observability.yml up -d $service

echo "✅ Récupération $service terminée"
```

---

## 📈 Monitoring de l'Infrastructure

### Métriques Système Importantes

```promql
# Containers up/down
up{job=~".*w40k.*"}

# Usage ressources par container  
container_memory_usage_bytes{name=~"w40k-.*"} / 1024 / 1024 / 1024
container_cpu_usage_seconds_total{name=~"w40k-.*"}

# Santé Loki spécifique
loki_ingester_chunks_created_total
loki_distributor_ingester_appends_total  
loki_distributor_ingester_append_failures_total

# Performance Prometheus
prometheus_rule_evaluation_duration_seconds
prometheus_tsdb_compactions_total
prometheus_tsdb_head_series

# Throughput OpenTelemetry Collector  
otelcol_processor_batch_send_size_count
otelcol_receiver_accepted_spans_total
otelcol_exporter_sent_spans_total
```

### Alertes Recommandées (Configuration Future)

```yaml
# alerts-observability.yml
groups:
  - name: w40k_observability_alerts
    rules:
      # Container health
      - alert: ObservabilityContainerDown
        expr: up{job=~".*w40k.*"} == 0  
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service observabilité {{ $labels.job }} down"
          
      # High memory usage  
      - alert: ObservabilityHighMemoryUsage
        expr: container_memory_usage_bytes{name=~"w40k-.*"} / 1024 / 1024 / 1024 > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Service {{ $labels.name }} utilise >80% mémoire"
          
      # Loki ingestion errors
      - alert: LokiIngestionErrors  
        expr: increase(loki_distributor_ingester_append_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Loki erreurs ingestion élevées"
          
      # Prometheus target down
      - alert: PrometheusTargetDown
        expr: up{job="w40k-scoring-app"} == 0
        for: 1m  
        labels:
          severity: warning
        annotations:
          summary: "Application W40K indisponible pour scraping"
          
      # Grafana dashboard access
      - alert: GrafanaDashboardUnavailable
        expr: up{job="grafana"} == 0
        for: 3m
        labels: 
          severity: critical  
        annotations:
          summary: "Dashboards Grafana inaccessibles"
```

---

## 🎯 Checklist de Résolution

**Avant d'escalader un problème, vérifier systématiquement**:

### ✅ Diagnostic Niveau 1 (2 min)
- [ ] Services status: `docker ps | grep w40k`  
- [ ] Logs récents: `docker logs w40k-<service> --tail 20`
- [ ] Connectivité réseau: `curl http://localhost:<port>/health`
- [ ] Usage ressources: `docker stats --no-stream | grep w40k`

### ✅ Diagnostic Niveau 2 (5 min)  
- [ ] Configuration validation: Syntax YAML correcte
- [ ] Volumes permissions: `docker exec <container> ls -la /data`
- [ ] Réseau Docker: `docker network inspect w40kscoring_observability`
- [ ] Changements récents: Git log, modifications config

### ✅ Diagnostic Niveau 3 (10 min)
- [ ] Tests connectivité inter-services depuis containers
- [ ] Analyse mémoire/CPU detailed avec historique
- [ ] Vérification intégrité données volumes  
- [ ] Comparaison avec état fonctionnel antérieur (backups)

### ✅ Solutions Appliquées Système
- [ ] Problème Loki crash loop: `allow_structured_metadata: false`
- [ ] DNS resolution: Dépendance Loki fixée → restart Grafana  
- [ ] Log collection: Hybrid strategy (Pull + Push OTLP)
- [ ] Code quality: 18 erreurs ESLint corrigées

### 📋 Informations pour Support Avancé

**En cas d'escalation, fournir**:
```bash
# Collecte informations complète
./collect-diagnostic-info.sh > diagnostic-$(date +%Y%m%d_%H%M).txt

# Contient:
# - Status tous containers
# - Logs 100 dernières lignes par service  
# - Configuration files checksums
# - Resource usage historique
# - Network topology 
# - Recent changes timeline
```

---

**Guide de troubleshooting validé avec résolutions prouvées** ✅  
**Procédures testées en environnement de développement** 🔧  
**Solutions applicables en production** 🚀