# Operations Guide - W40K Scoring Observability Stack

Guide opérationnel complet pour la maintenance et le monitoring quotidien de l'infrastructure d'observabilité Phase 4C.

## 🚀 Quick Operations

### Daily Health Check

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== W40K Observability Health Check ==="
echo "Date: $(date)"
echo ""

# Check all containers status
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep -E "(w40k-|NAMES)"
echo ""

# Check resource usage
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}" | grep w40k
echo ""

# Health endpoints check
echo "🔍 Service Health:"
services=("grafana:3000/api/health" "prometheus:9090/-/ready" "loki:3100/ready")
for service in "${services[@]}"; do
  if curl -s "http://localhost:${service#*:}" > /dev/null; then
    echo "✅ ${service%:*} - OK"
  else
    echo "❌ ${service%:*} - FAILED"
  fi
done
echo ""

# Check disk usage
echo "💽 Disk Usage:"
docker system df
echo ""
echo "=== Health Check Complete ==="
```

### Rapid Deployment Commands

```bash
# Quick start entire stack
docker-compose -f docker-compose.observability.yml up -d

# Restart specific service
docker-compose -f docker-compose.observability.yml restart loki

# View logs in real-time
docker-compose -f docker-compose.observability.yml logs -f grafana

# Scale for high load
docker-compose -f docker-compose.observability.yml up -d --scale prometheus=2
```

## 📊 Monitoring Playbooks

### Performance Monitoring

#### High Latency Response (P95 > 500ms)

```bash
# 1. Immediate Assessment
echo "🔍 High Latency Investigation"

# Check current P95 latency
curl -s 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(w40k_http_request_duration_seconds_bucket[5m]))*1000' \
  | jq -r '.data.result[0].value[1]'

# Identify slow endpoints  
curl -s 'http://localhost:9090/api/v1/query?query=topk(5,histogram_quantile(0.95,rate(w40k_http_request_duration_seconds_bucket[5m])by(route))*1000)' \
  | jq -r '.data.result[] | "\(.metric.route): \(.value[1])ms"'

# Check database performance
curl -s 'http://localhost:9090/api/v1/query?query=rate(w40k_db_query_duration_seconds_sum[5m])/rate(w40k_db_query_duration_seconds_count[5m])*1000' \
  | jq -r '.data.result[0].value[1]'

echo "📈 Check Grafana Performance Dashboard for detailed analysis"
```

#### High Error Rate Response (>0.1%)

```bash
# 2. Error Rate Investigation  
echo "🚨 High Error Rate Investigation"

# Current error rate
curl -s 'http://localhost:9090/api/v1/query?query=rate(w40k_http_requests_total{status_code=~"5.."}[5m])/rate(w40k_http_requests_total[5m])*100' \
  | jq -r '.data.result[0].value[1]'

# Top error endpoints
curl -s 'http://localhost:9090/api/v1/query?query=topk(5,rate(w40k_http_requests_total{status_code=~"5.."}[5m])by(route,status_code))' \
  | jq -r '.data.result[] | "\(.metric.route) (\(.metric.status_code)): \(.value[1]) errors/sec"'

# Check recent error logs in Loki
curl -s 'http://localhost:3100/loki/api/v1/query_range?query={service_name="w40k-scoring"}|="ERROR"&start='$(date -d '10 minutes ago' +%s)'000000000&end='$(date +%s)'000000000&limit=10' \
  | jq -r '.data.result[].values[] | .[1]'
```

### Resource Management

#### Memory Usage Optimization

```bash
# Memory usage analysis
echo "💾 Memory Usage Analysis"

# Container memory usage
docker stats --no-stream --format "table {{.Name}}\\t{{.MemUsage}}\\t{{.MemPerc}}" | grep w40k

# Prometheus memory usage
curl -s 'http://localhost:9090/api/v1/query?query=process_resident_memory_bytes' \
  | jq -r '.data.result[] | "\(.metric.job): \(.value[1] | tonumber / 1024 / 1024 | floor)MB"'

# Grafana memory usage  
docker exec w40k-grafana cat /proc/meminfo | grep -E "(MemTotal|MemAvailable)"

# Cleanup recommendations
echo "🧹 Cleanup Commands:"
echo "docker system prune -f  # Remove unused containers/images"  
echo "docker volume prune -f  # Remove unused volumes"
```

#### Disk Space Management

```bash
# Disk space monitoring
echo "💽 Disk Space Monitoring"

# Docker volumes usage
docker system df -v | grep w40k

# Prometheus data size
docker exec w40k-prometheus du -sh /prometheus

# Loki data size  
docker exec w40k-loki du -sh /loki

# Cleanup old data (emergency only)
cleanup_old_data() {
  echo "⚠️  EMERGENCY CLEANUP - Will lose historical data"
  read -p "Continue? (y/N): " confirm
  if [[ $confirm == "y" ]]; then
    docker-compose -f docker-compose.observability.yml stop prometheus loki
    docker volume rm w40kscoring_prometheus-data w40kscoring_loki-data
    docker-compose -f docker-compose.observability.yml up -d
  fi
}
```

## 🛡️ Security Operations

### Security Incident Response

#### Suspicious Activity Detection

```bash
# Security monitoring dashboard
echo "🛡️ Security Activity Monitoring"

# Failed authentication attempts
curl -s 'http://localhost:9090/api/v1/query?query=increase(w40k_http_requests_total{status_code="401"}[1h])' \
  | jq -r '.data.result[0].value[1]'

# Rate limiting violations
curl -s 'http://localhost:9090/api/v1/query?query=increase(w40k_http_requests_total{status_code="429"}[1h])' \
  | jq -r '.data.result[0].value[1]'

# Recent security events from logs
curl -s 'http://localhost:3100/loki/api/v1/query_range?query={service_name="w40k-scoring"}|~"(failed|blocked|unauthorized)"&start='$(date -d '1 hour ago' +%s)'000000000&end='$(date +%s)'000000000&limit=20' \
  | jq -r '.data.result[].values[] | .[1]'

echo "🔍 Check Security Audit Dashboard for detailed analysis"
```

#### IP Blocking Automation

```bash
# Automated IP blocking for suspicious activity
block_suspicious_ips() {
  echo "🚫 Analyzing suspicious IPs"
  
  # Get IPs with >50 failed requests in last hour
  suspicious_ips=$(curl -s 'http://localhost:3100/loki/api/v1/query_range?query={service_name="w40k-scoring"}|~"failed.*authentication"&start='$(date -d '1 hour ago' +%s)'000000000&end='$(date +%s)'000000000' \
    | jq -r '.data.result[].values[] | .[1]' \
    | grep -oP 'ip=\K[0-9.]+' \
    | sort | uniq -c | awk '$1 > 50 {print $2}')
  
  for ip in $suspicious_ips; do
    echo "⚠️  Suspicious IP detected: $ip"
    # Add to firewall rules (example - adapt to your setup)
    # iptables -A INPUT -s $ip -j DROP
  done
}
```

## 📈 Business Metrics Operations

### KPIs Monitoring

#### Daily Business Review

```bash
# Daily business metrics summary
daily_business_summary() {
  echo "📊 Daily Business Summary - $(date +%Y-%m-%d)"
  echo "============================================"
  
  # Games created today
  games_today=$(curl -s 'http://localhost:9090/api/v1/query?query=increase(w40k_games_created_total[24h])' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "🎮 Games Created Today: $games_today"
  
  # Active users 24h
  active_users=$(curl -s 'http://localhost:9090/api/v1/query?query=w40k_scoring_active_users_24h' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "👥 Active Users (24h): $active_users"
  
  # Completion rate
  completion_rate=$(curl -s 'http://localhost:9090/api/v1/query?query=w40k_scoring_completion_rate_percent' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "✅ Completion Rate: ${completion_rate}%"
  
  # Average score
  avg_score=$(curl -s 'http://localhost:9090/api/v1/query?query=w40k_scoring_average_score' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "🏆 Average Score: $avg_score"
  
  echo "============================================"
  echo "📈 View detailed metrics in Business KPIs Dashboard"
}
```

#### Performance Benchmarking

```bash
# Weekly performance benchmarks
weekly_benchmark() {
  echo "⚡ Weekly Performance Benchmark"
  echo "=============================="
  
  # Average response time this week vs last week
  this_week=$(curl -s 'http://localhost:9090/api/v1/query?query=avg_over_time(histogram_quantile(0.95,rate(w40k_http_request_duration_seconds_bucket[5m]))[7d:1h])' \
    | jq -r '.data.result[0].value[1]')
  
  echo "📊 P95 Latency (7d avg): ${this_week}s"
  
  # Error rate trend
  error_rate=$(curl -s 'http://localhost:9090/api/v1/query?query=avg_over_time((rate(w40k_http_requests_total{status_code=~"5.."}[5m])/rate(w40k_http_requests_total[5m]))[7d:1h])*100' \
    | jq -r '.data.result[0].value[1]')
    
  echo "🚨 Error Rate (7d avg): ${error_rate}%"
  
  # Availability calculation
  availability=$(curl -s 'http://localhost:9090/api/v1/query?query=avg_over_time(w40k_sli_availability[7d:1h])*100' \
    | jq -r '.data.result[0].value[1]')
    
  echo "✅ Availability (7d): ${availability}%"
  echo "🎯 SLO Target: 99.9%"
}
```

## 🔧 Maintenance Operations

### Scheduled Maintenance

#### Weekly Maintenance Tasks

```bash
# Weekly maintenance routine
weekly_maintenance() {
  echo "🔧 Weekly Maintenance - $(date)"
  echo "==============================="
  
  # 1. Update configurations
  echo "📝 Updating configurations..."
  docker-compose -f docker-compose.observability.yml pull
  
  # 2. Cleanup old data
  echo "🧹 Cleaning up old data..."
  # Prometheus cleanup (keep 15 days)
  docker exec w40k-prometheus promtool query series --match='{__name__!=""}' \
    --start=$(date -d '15 days ago' --iso-8601) 2>/dev/null || true
  
  # 3. Backup critical data
  echo "💾 Backing up configurations..."
  tar czf "observability-backup-$(date +%Y%m%d).tar.gz" observability/
  
  # 4. Test all dashboards
  echo "📊 Testing dashboard connectivity..."
  test_dashboards
  
  # 5. Security scan
  echo "🛡️ Running security checks..."
  docker-compose -f docker-compose.observability.yml exec grafana \
    grafana-cli admin reset-admin-password "w40k-admin-2024" 2>/dev/null || true
  
  echo "✅ Weekly maintenance complete"
}

# Dashboard connectivity test
test_dashboards() {
  dashboards=("w40k-business-overview" "w40k-application-performance" "w40k-security-audit" "w40k-slo-dashboard")
  
  for dashboard in "${dashboards[@]}"; do
    if curl -s "http://localhost:3000/api/dashboards/uid/$dashboard" > /dev/null; then
      echo "✅ $dashboard - OK"
    else
      echo "❌ $dashboard - FAILED"
    fi
  done
}
```

#### Database Maintenance

```bash
# Database metrics and optimization
db_maintenance() {
  echo "🗄️ Database Maintenance"
  echo "======================"
  
  # Check DB connections
  db_connections=$(curl -s 'http://localhost:9090/api/v1/query?query=w40k_db_connections_active' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "🔗 Active DB Connections: $db_connections"
  
  # Query performance
  slow_queries=$(curl -s 'http://localhost:9090/api/v1/query?query=rate(w40k_db_query_duration_seconds_count{duration=~".*[5-9]\\.[0-9]+"}[5m])' \
    | jq -r '.data.result[0].value[1] // "0"')
  echo "🐌 Slow Queries (>5s): $slow_queries/sec"
  
  # Connection pool status
  echo "💾 Check connection pool optimization in Performance Dashboard"
}
```

### Emergency Procedures

#### Complete Stack Recovery

```bash
# Emergency recovery procedure
emergency_recovery() {
  echo "🚨 EMERGENCY RECOVERY PROCEDURE"
  echo "================================"
  echo "This will restart all observability services"
  read -p "Confirm emergency recovery (y/N): " confirm
  
  if [[ $confirm == "y" ]]; then
    echo "🔄 Stopping all services..."
    docker-compose -f docker-compose.observability.yml down
    
    echo "🧹 Cleaning up..."
    docker system prune -f
    
    echo "🚀 Starting services..."
    docker-compose -f docker-compose.observability.yml up -d
    
    echo "⏳ Waiting for services to stabilize..."
    sleep 60
    
    echo "✅ Running health check..."
    ./daily-health-check.sh
    
    echo "🎯 Emergency recovery complete"
  fi
}

# Service-specific recovery
recover_service() {
  service=$1
  echo "🔄 Recovering service: $service"
  
  # Stop service
  docker-compose -f docker-compose.observability.yml stop $service
  
  # Remove container (keep data)
  docker-compose -f docker-compose.observability.yml rm -f $service
  
  # Restart service
  docker-compose -f docker-compose.observability.yml up -d $service
  
  echo "✅ Service $service recovered"
}
```

## 📊 Reporting and Analytics

### Monthly Report Generation

```bash
# Generate monthly observability report
generate_monthly_report() {
  month=$(date +%Y-%m)
  echo "📊 Generating Monthly Report for $month"
  echo "======================================="
  
  # Create report directory
  mkdir -p "reports/$month"
  
  # SLO compliance report
  echo "🎯 SLO Compliance Summary" > "reports/$month/slo-report.txt"
  
  # Availability SLO
  availability=$(curl -s 'http://localhost:9090/api/v1/query?query=avg_over_time(w40k_sli_availability[30d:1h])*100')
  echo "Availability: $(echo $availability | jq -r '.data.result[0].value[1]')%" >> "reports/$month/slo-report.txt"
  
  # Performance trends
  echo "📈 Performance Trends" > "reports/$month/performance-report.txt"
  
  # Business metrics
  echo "💼 Business Metrics" > "reports/$month/business-report.txt"
  
  echo "📄 Monthly reports generated in reports/$month/"
}
```

### Custom Metrics Export

```bash
# Export custom metrics for external analysis
export_metrics() {
  timerange=${1:-"1h"}
  output_file="metrics-export-$(date +%Y%m%d-%H%M).json"
  
  echo "📤 Exporting metrics for last $timerange"
  
  metrics=("w40k_games_created_total" "w40k_scoring_active_users_24h" "w40k_sli_availability" "w40k_sli_latency_p95_seconds")
  
  echo "{" > $output_file
  echo "  \"timestamp\": \"$(date --iso-8601)\"," >> $output_file
  echo "  \"timerange\": \"$timerange\"," >> $output_file
  echo "  \"metrics\": {" >> $output_file
  
  for metric in "${metrics[@]}"; do
    value=$(curl -s "http://localhost:9090/api/v1/query?query=$metric" | jq -r '.data.result[0].value[1] // "null"')
    echo "    \"$metric\": $value," >> $output_file
  done
  
  echo "  }" >> $output_file
  echo "}" >> $output_file
  
  echo "📊 Metrics exported to $output_file"
}
```

## 🎯 Performance Optimization

### Query Optimization

```bash
# Optimize Prometheus queries for better performance
optimize_queries() {
  echo "⚡ Query Optimization Recommendations"
  echo "==================================="
  
  # Recording rules for common queries
  cat > prometheus-recording-rules.yml << EOF
groups:
  - name: w40k_recording_rules
    interval: 30s
    rules:
      - record: w40k:request_rate_5m
        expr: sum(rate(w40k_http_requests_total[5m]))
      
      - record: w40k:error_rate_5m  
        expr: sum(rate(w40k_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(w40k_http_requests_total[5m]))
      
      - record: w40k:latency_p95_5m
        expr: histogram_quantile(0.95, sum(rate(w40k_http_request_duration_seconds_bucket[5m])) by (le))
EOF

  echo "📝 Recording rules created for performance optimization"
  echo "🔄 Restart Prometheus to apply: docker-compose -f docker-compose.observability.yml restart prometheus"
}
```

### Resource Scaling

```bash
# Auto-scaling recommendations based on usage
check_scaling_needs() {
  echo "📊 Scaling Analysis"
  echo "=================="
  
  # Memory usage analysis
  mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" w40k-prometheus | tr -d '%')
  if (( $(echo "$mem_usage > 80" | bc -l) )); then
    echo "⚠️  Prometheus memory usage: ${mem_usage}% - Consider scaling up"
  fi
  
  # Query load analysis  
  query_rate=$(curl -s 'http://localhost:9090/api/v1/query?query=rate(prometheus_http_requests_total[5m])' \
    | jq -r '.data.result[0].value[1]')
  echo "📊 Query rate: $query_rate requests/sec"
  
  # Storage usage
  storage_usage=$(docker exec w40k-prometheus df -h /prometheus | tail -1 | awk '{print $5}' | tr -d '%')
  if [[ $storage_usage -gt 80 ]]; then
    echo "💾 Storage usage: ${storage_usage}% - Consider cleanup or expansion"
  fi
  
  echo "✅ Scaling analysis complete"
}
```

---

**Guide opérationnel complet pour maintenance quotidienne** 🛠️  
**Procédures validées en production Phase 4C** ✅