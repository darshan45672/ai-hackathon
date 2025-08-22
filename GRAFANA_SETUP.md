# Grafana Monitoring Setup

This document describes the Grafana monitoring setup for the AI Hackathon platform.

## Overview

The monitoring stack includes:
- **2. **Restart Grafana container**:
   ```bash
   podman-compose -f podman-compose.development.yml restart grafana
   ```etheus**: Metrics collection and storage
- **Grafana**: Visualization and alerting dashboard
- **Pre-configured Dashboards**: Application, API, Database, and AI Service metrics
- **Alerting Rules**: Automated alerts for critical issues

## Architecture

```
Application Services → Prometheus (metrics collection) → Grafana (visualization)
```

## Dashboards Included

### 1. Application Overview (`application-overview.json`)
- Container CPU and Memory usage
- Service health status (Backend, Frontend, AI Service, Database)
- System overview metrics

### 2. API Performance (`api-performance.json`)
- HTTP request rate and response times
- Error rates (5xx responses)
- AI review processing times
- API endpoint performance metrics

### 3. Database Metrics (`database-metrics.json`)
- Database connections and transaction rates
- Database size and growth
- Table operations (inserts, updates, deletes)
- Query performance by operation type

### 4. AI Service Metrics (`ai-service-metrics.json`)
- AI review request rates and processing times
- Error rates and service health
- Review type distribution
- MCP server performance
- Processing queue metrics

## Setup Instructions

### 1. Start the Monitoring Stack

```bash
# Start all services including monitoring (Podman)
podman-compose -f podman-compose.development.yml up -d

# Or with Docker
docker-compose up -d

# View logs
podman-compose -f podman-compose.development.yml logs -f

# Stop services
podman-compose -f podman-compose.development.yml down
```

### 2. Access Grafana

- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin (configurable via `GF_SECURITY_ADMIN_PASSWORD`)

### 3. Verify Setup

1. **Check Prometheus**: http://localhost:9090
   - Verify targets are up in Status → Targets
   - Test queries in the Query interface

2. **Check Grafana Dashboards**:
   - Navigate to Dashboards in the sidebar
   - Verify all 4 dashboards are loaded
   - Check that data is being displayed

## Configuration Files

### Prometheus Configuration (`prometheus.yml`)
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ai-hackathon-backend'
    static_configs:
      - targets: ['app1:3001', 'app2:3001', 'app3:3001']
  
  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:3002']
  
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana Datasource (`grafana/provisioning/datasources.yml`)
- Automatically configures Prometheus as the primary datasource
- Connection: http://prometheus:9090
- Scrape interval: 5s

### Grafana Dashboards (`grafana/provisioning/dashboards.yml`)
- Automatically loads all dashboard JSON files from `/var/lib/grafana/dashboards`
- Dashboards are editable and can be modified through the UI

## Alerting Rules

The setup includes pre-configured alerting rules for:

### Critical Alerts
- **Service Down**: Triggers when any service becomes unavailable
- **High Memory Usage**: Memory usage > 85%
- **Database Connection Issues**: Connection count > 80

### Warning Alerts  
- **High CPU Usage**: CPU usage > 80% for 5 minutes
- **High Error Rate**: HTTP 5xx error rate > 5%

### Alert Configuration
Alerts are defined in `grafana/provisioning/alerting.yml` and include:
- Email notifications (configurable)
- Severity levels (critical, warning)
- Service-specific labeling

## Customization

### Adding New Metrics

1. **Backend Metrics**: Add Prometheus metrics to NestJS services:
   ```typescript
   import { register, Counter, Histogram } from 'prom-client';
   
   const httpRequestsTotal = new Counter({
     name: 'http_requests_total',
     help: 'Total HTTP requests',
     labelNames: ['method', 'status']
   });
   ```

2. **Database Metrics**: Install and configure postgres_exporter:
   ```bash
   docker run -d --name postgres_exporter \
     -e DATA_SOURCE_NAME="postgresql://user:password@postgres:5432/ai_hackathon?sslmode=disable" \
     quay.io/prometheuscommunity/postgres-exporter
   ```

### Creating Custom Dashboards

1. Access Grafana UI
2. Go to Dashboards → New Dashboard
3. Add panels with Prometheus queries
4. Export JSON and save to `grafana/dashboards/`

### Modifying Alert Rules

1. Edit `grafana/provisioning/alerting.yml`
2. Restart Grafana container:
   ```bash
   docker-compose restart grafana
   ```

## Troubleshooting

### Common Issues

1. **No data in dashboards**:
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify container names match Prometheus configuration
   - Ensure services are exposing metrics endpoints

2. **Grafana not loading dashboards**:
   - Check volume mounts in docker-compose.yml
   - Verify JSON syntax in dashboard files
   - Check Grafana logs: `podman-compose -f podman-compose.development.yml logs grafana`

3. **Alerts not firing**:
   - Verify alert rules syntax in alerting.yml
   - Check Grafana alerting status in UI
   - Configure notification channels (email, Slack, etc.)

### Performance Tuning

1. **Prometheus Storage**:
   ```yaml
   prometheus:
     command:
       - '--storage.tsdb.retention.time=30d'
       - '--storage.tsdb.path=/prometheus'
   ```

2. **Grafana Performance**:
   ```yaml
   grafana:
     environment:
       - GF_DATABASE_TYPE=postgres
       - GF_DATABASE_HOST=postgres:5432
   ```

## Security Considerations

1. **Change Default Passwords**:
   ```yaml
   grafana:
     environment:
       - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
   ```

2. **Enable HTTPS**:
   - Configure SSL certificates
   - Update nginx.conf to proxy Grafana over HTTPS

3. **Access Control**:
   - Configure authentication providers (OAuth, LDAP)
   - Set up user roles and permissions

## Maintenance

### Regular Tasks

1. **Monitor disk usage**: Prometheus and Grafana data growth
2. **Update images**: Keep Prometheus and Grafana up to date
3. **Backup dashboards**: Export dashboard JSON regularly
4. **Review alerts**: Tune thresholds based on actual usage patterns

### Backup and Recovery

1. **Grafana Dashboards**:
   ```bash
   # Export all dashboards
   curl -X GET http://admin:admin@localhost:3000/api/search?query=&starred=false \
     | jq -r '.[] | .uid' | xargs -I {} curl -X GET \
     http://admin:admin@localhost:3000/api/dashboards/uid/{} > backup.json
   ```

2. **Prometheus Data**:
   ```bash
   # Create backup of Prometheus data
   docker-compose exec prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
   ```

## Integration with CI/CD

### Automated Testing
```bash
# Test dashboard JSON syntax
find grafana/dashboards -name "*.json" -exec jq empty {} \;

# Validate Prometheus config
docker run --rm -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml
```

### Deployment Scripts
```bash
#!/bin/bash
# deploy-monitoring.sh

echo "Deploying monitoring stack..."
docker-compose up -d prometheus grafana

echo "Waiting for services to be ready..."
sleep 30

echo "Checking service health..."
curl -f http://localhost:9090/-/healthy
curl -f http://localhost:3000/api/health

echo "Monitoring stack deployed successfully!"
```
