# Guide de Troubleshooting - Infrastructure d'Observabilité W40K

Guide complet de résolution des problèmes courants de la stack d'observabilité.

## 🚨 Problèmes critiques résolus

### ❌ Loki en crash loop constant

**Symptômes** :

- Container status : `Restarting (137)`
- Logs : `"empty ring"`, `"error getting ingester clients"`
- Grafana : `"dial tcp: lookup loki: no such host"`

**Diagnostic** :

```bash
docker ps | grep loki              # Status Restarting
docker logs w40k-loki --tail 10   # Erreurs "empty ring"
```

**Cause racine identifiée** :
Loki 3.4.2 force structured metadata par défaut, incompatible avec schema v11

**Solution appliquée** :

```yaml
# observability/loki.yml
limits_config:
  allow_structured_metadata: false # CRITIQUE
```

**Validation** :

```bash
docker ps | grep loki  # Status "Up X seconds"
docker logs w40k-loki --tail 5  # Pas d'erreur "empty ring"
```

---

### ❌ Grafana ne trouve pas Loki (DNS lookup failed)

**Symptômes** :

- Error : `dial tcp: lookup loki on 127.0.0.11:53: no such host`
- Dashboard logs vides
- Test connection failed dans Grafana

**Diagnostic** :

```bash
docker ps | grep loki                    # Vérifier statut Loki
docker logs w40k-loki                   # Analyser crash loops
docker exec w40k-grafana nslookup loki  # Test résolution DNS
```

**Cause racine identifiée** :
Loki inaccessible à cause du crash loop, pas un problème DNS

**Solution** :

1. Corriger configuration Loki (voir section précédente)
2. Redémarrer Loki : `docker compose -f docker-compose.observability.yml restart loki`
3. Attendre stabilisation (30s)
4. Tester depuis Grafana

---

### ❌ Logs non remontés dans Loki/Grafana

**Symptômes** :

- Dashboards logs vides
- Loki query : `total_entries=0`
- Promtail fonctionne mais pas de données

**Diagnostic** :

```bash
curl -s "http://localhost:3100/loki/api/v1/query_range?query={job=\"w40k-app\"}"
docker logs w40k-promtail --tail 10
```

**Cause racine identifiée** :
Application W40K tourne sur l'hôte (npm run dev), pas en container Docker. Promtail configuré pour Docker seulement.

**Solutions testées** :

1. ✅ **Fichier temporaire** : Logs → `/tmp/w40k-app.log` → Promtail
2. ✅ **OpenTelemetry SDK** : Envoi direct OTLP → Collector → Loki
3. ✅ **Docker service discovery** : Collection containers Docker

**Configuration finale** :

```yaml
# promtail.yml - Collection Docker
scrape_configs:
  - job_name: w40k-docker-logs
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
```

---

## 🔧 Diagnostics par service

### Prometheus

**Problèmes courants** :

- Targets down/unreachable
- Scraping errors
- Storage full

**Diagnostic** :

```bash
curl http://localhost:9090/api/v1/targets  # Vérifier targets
docker logs w40k-prometheus --tail 10     # Erreurs scraping
docker exec w40k-prometheus df -h         # Usage disque
```

**Solutions** :

- Target down : Vérifier app sur port 3333
- Storage : Réduire retention ou nettoyer données
- Scraping : Corriger configuration dans `prometheus.yml`

### Grafana

**Problèmes courants** :

- Datasources unreachable
- Dashboard import failed
- Permission errors

**Diagnostic** :

```bash
docker logs w40k-grafana --tail 15
curl http://localhost:3000/api/health
docker exec w40k-grafana ls /var/lib/grafana/dashboards
```

**Solutions** :

- Datasource : Tester connectivité depuis Grafana UI
- Dashboard : Vérifier JSON validity
- Permissions : Vérifier volumes et ownership

### OpenTelemetry Collector

**Problèmes courants** :

- Receiver errors (OTLP)
- Processor crashes
- Exporter timeouts

**Diagnostic** :

```bash
docker logs w40k-otel-collector --tail 20
curl http://localhost:4318/v1/logs  # Test OTLP endpoint
docker exec w40k-otel-collector cat /etc/otelcol-contrib/otel-collector.yml
```

**Solutions** :

- Config : Valider YAML syntax
- Memory : Ajuster memory_limiter processor
- Network : Vérifier connectivity vers Loki/Tempo

---

## 📊 Commandes de diagnostic essentielles

### Vérification globale

```bash
# Status tous services
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check automatique
for svc in grafana loki prometheus; do
  echo "=== $svc ==="
  docker logs w40k-$svc --tail 3
  echo ""
done

# Vérification réseau
docker network inspect w40kscoring_observability
```

### Tests de connectivité

```bash
# Endpoints de santé
curl -s http://localhost:3100/ready           # Loki
curl -s http://localhost:9090/-/ready         # Prometheus
curl -s http://localhost:3000/api/health      # Grafana

# Test métriques application
curl -s http://localhost:3333/metrics | head -10

# Test logs query
curl -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="w40k-docker-logs"}'
```

### Debug avancé

```bash
# Logs avec timestamps
docker logs w40k-loki --timestamps --tail 50

# Stats containers
docker stats w40k-grafana w40k-loki w40k-prometheus --no-stream

# Inspect volumes
docker volume ls | grep w40k
docker volume inspect w40kscoring_grafana-data
```

---

## 🛠️ Procédures de réparation

### Redémarrage ordonné

```bash
# 1. Arrêt en ordre inverse
docker compose -f docker-compose.observability.yml stop grafana
docker compose -f docker-compose.observability.yml stop prometheus
docker compose -f docker-compose.observability.yml stop loki

# 2. Nettoyage si nécessaire
docker compose -f docker-compose.observability.yml down

# 3. Redémarrage
docker compose -f docker-compose.observability.yml up -d

# 4. Vérification
sleep 30
docker ps | grep -E "(grafana|loki|prometheus)"
```

### Reset complet (dernier recours)

```bash
# ATTENTION : Perte de toutes les données
docker compose -f docker-compose.observability.yml down -v
docker volume prune -f
docker compose -f docker-compose.observability.yml up -d
```

### Récupération de configuration

```bash
# Backup avant intervention
tar czf observability-backup-$(date +%Y%m%d_%H%M).tar.gz observability/

# Restore configuration
tar xzf observability-backup-YYYYMMDD_HHMM.tar.gz
docker compose -f docker-compose.observability.yml restart
```

---

## 📈 Monitoring de l'infrastructure

### Métriques système importantes

```promql
# Containers up/down
up{job="prometheus"}
up{job="node-exporter"}

# Usage ressources
container_memory_usage_bytes{name=~"w40k-.*"}
container_cpu_usage_seconds_total{name=~"w40k-.*"}

# Santé Loki
loki_ingester_chunks_created_total
loki_distributor_ingester_appends_total

# Performance Prometheus
prometheus_rule_evaluation_duration_seconds
prometheus_tsdb_compactions_total
```

### Alertes recommandées (futur)

```yaml
# Container down
- alert: ContainerDown
  expr: up{job=~"w40k-.*"} == 0

# High memory usage
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes{name=~"w40k-.*"} > 500MB

# Loki ingestion errors
- alert: LokiIngestionErrors
  expr: increase(loki_distributor_ingester_append_failures_total[5m]) > 10
```

---

## 🎯 Checklist de résolution

Avant d'escalader un problème :

- [ ] Services status checked (`docker ps`)
- [ ] Recent logs analyzed (`docker logs --tail 20`)
- [ ] Network connectivity tested (`curl` health endpoints)
- [ ] Configuration validated (YAML syntax)
- [ ] Resources checked (CPU, memory, disk)
- [ ] Volumes permissions verified
- [ ] Recent changes identified (config, data, network)

**Pour support avancé** : Inclure outputs des commandes ci-dessus + description timeline du problème.

---

**Guide maintenu par l'équipe DevOps W40K** 🚀
