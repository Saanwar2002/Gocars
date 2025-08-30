# GoCars Testing Agent - Containerized Deployment

This document provides comprehensive instructions for deploying the GoCars Testing Agent using Docker and Kubernetes.

## Overview

The GoCars Testing Agent is containerized for easy deployment and scaling. It includes:

- **Main Testing Agent**: Core testing functionality with REST API
- **Metrics Service**: Prometheus-compatible metrics endpoint
- **Health Checks**: Kubernetes-ready health and readiness probes
- **Monitoring Stack**: Prometheus and Grafana for observability
- **Auto-scaling**: Horizontal Pod Autoscaler configuration
- **Persistent Storage**: For logs, reports, and data

## Prerequisites

### Local Development
- Node.js 18+
- Docker Desktop
- Docker Compose

### Production Deployment
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm (optional, for advanced deployments)
- Container registry access

## Quick Start

### 1. Local Development with Docker Compose

```bash
# Clone and setup
git clone <repository>
cd gocars-testing-agent

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Build and run with Docker Compose
docker-compose up --build

# Access services
# API: http://localhost:3000
# Metrics: http://localhost:9090/metrics
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9091
```

### 2. Build Docker Image

```bash
# Build the testing agent image
npm run docker:build

# Or manually
docker build -t gocars/testing-agent:latest .

# Run the container
npm run docker:run

# Or manually
docker run -p 3000:3000 -p 9090:9090 gocars/testing-agent:latest
```

### 3. Kubernetes Deployment

```bash
# Make scripts executable (Linux/Mac)
chmod +x scripts/deploy.sh scripts/undeploy.sh

# Deploy to Kubernetes
./scripts/deploy.sh

# Or on Windows
bash scripts/deploy.sh

# Check deployment status
kubectl get pods -n gocars-testing
kubectl get services -n gocars-testing
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `API_PORT` | Main API server port | `3000` |
| `METRICS_PORT` | Metrics server port | `9090` |
| `LOG_LEVEL` | Logging level | `info` |
| `AUTO_FIX_ENABLED` | Enable automatic fixes | `true` |
| `METRICS_ENABLED` | Enable metrics collection | `true` |
| `MAX_CONCURRENT_USERS` | Max virtual users | `100` |
| `TEST_TIMEOUT` | Test timeout (ms) | `300000` |

### Firebase Configuration

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Database Configuration

```bash
POSTGRES_HOST=postgres-service
POSTGRES_PORT=5432
POSTGRES_DB=testing_agent
POSTGRES_USER=testingagent
POSTGRES_PASSWORD=testingagent123
```

## Kubernetes Resources

### Core Components

1. **Namespace**: `gocars-testing`
2. **Deployments**:
   - `testing-agent` (3 replicas)
   - `redis` (1 replica)
   - `postgres` (1 replica)
   - `prometheus` (1 replica)
   - `grafana` (1 replica)

3. **Services**:
   - `testing-agent-service` (ClusterIP)
   - `redis-service` (ClusterIP)
   - `postgres-service` (ClusterIP)
   - `prometheus-service` (ClusterIP)
   - `grafana-service` (ClusterIP)

4. **Storage**:
   - `testing-agent-logs-pvc` (10Gi)
   - `testing-agent-reports-pvc` (20Gi)
   - `redis-data-pvc` (5Gi)
   - `postgres-data-pvc` (50Gi)
   - `prometheus-data-pvc` (20Gi)
   - `grafana-data-pvc` (5Gi)

### Auto-scaling Configuration

The Horizontal Pod Autoscaler (HPA) scales the testing agent based on:

- **CPU Usage**: Target 70%
- **Memory Usage**: Target 80%
- **Active Test Sessions**: Target 10 per pod
- **Min Replicas**: 3
- **Max Replicas**: 20

### Health Checks

- **Liveness Probe**: `/health` endpoint
- **Readiness Probe**: `/ready` endpoint
- **Startup Probe**: 40s initial delay

## Monitoring and Observability

### Metrics

The testing agent exposes Prometheus metrics at `/metrics`:

- `test_executions_total` - Total test executions
- `test_successes_total` - Successful tests
- `test_failures_total` - Failed tests
- `active_virtual_users` - Current virtual users
- `test_duration_seconds` - Test execution time
- `memory_usage_bytes` - Memory consumption
- `api_request_duration_seconds` - API response times

### Dashboards

Grafana dashboards are automatically provisioned:

- **Testing Agent Overview**: Key metrics and health
- **Performance Metrics**: Response times and throughput
- **System Resources**: CPU, memory, and storage
- **Error Analysis**: Error rates and categories

### Alerting

Prometheus alerting rules (configure as needed):

- High error rate (>5%)
- High response time (>2s)
- Memory usage (>90%)
- Pod restart frequency
- Test execution failures

## Security

### Container Security

- Non-root user (UID 1001)
- Read-only root filesystem where possible
- Dropped capabilities
- Security context constraints

### Network Security

- Network policies for pod-to-pod communication
- TLS termination at ingress
- Secrets management for sensitive data

### Access Control

- RBAC for service accounts
- Pod security policies
- Resource quotas and limits

## Scaling and Performance

### Horizontal Scaling

```bash
# Manual scaling
kubectl scale deployment testing-agent --replicas=10 -n gocars-testing

# Auto-scaling is configured via HPA
kubectl get hpa -n gocars-testing
```

### Vertical Scaling

Update resource requests/limits in `k8s/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

### Performance Tuning

1. **Node.js Optimization**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048"
   UV_THREADPOOL_SIZE=16
   ```

2. **Database Connection Pooling**:
   ```bash
   POSTGRES_MAX_CONNECTIONS=20
   POSTGRES_IDLE_TIMEOUT=30000
   ```

3. **Redis Configuration**:
   ```bash
   REDIS_MAX_CONNECTIONS=10
   REDIS_CONNECT_TIMEOUT=5000
   ```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**:
   ```bash
   kubectl describe pod <pod-name> -n gocars-testing
   kubectl logs <pod-name> -n gocars-testing
   ```

2. **Database Connection Issues**:
   ```bash
   kubectl exec -it <postgres-pod> -n gocars-testing -- psql -U testingagent -d testing_agent
   ```

3. **Redis Connection Issues**:
   ```bash
   kubectl exec -it <redis-pod> -n gocars-testing -- redis-cli ping
   ```

4. **Storage Issues**:
   ```bash
   kubectl get pvc -n gocars-testing
   kubectl describe pvc <pvc-name> -n gocars-testing
   ```

### Debug Mode

Enable debug logging:

```bash
kubectl set env deployment/testing-agent LOG_LEVEL=debug -n gocars-testing
```

### Health Check Debugging

```bash
# Check health endpoint
kubectl port-forward svc/testing-agent-service 3000:3000 -n gocars-testing
curl http://localhost:3000/health

# Check metrics
curl http://localhost:3000/metrics
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
kubectl exec <postgres-pod> -n gocars-testing -- pg_dump -U testingagent testing_agent > backup.sql

# Restore backup
kubectl exec -i <postgres-pod> -n gocars-testing -- psql -U testingagent testing_agent < backup.sql
```

### Persistent Volume Backup

Use your cloud provider's volume snapshot feature or:

```bash
# Example with rsync
kubectl exec <pod-name> -n gocars-testing -- tar czf - /app/data | tar xzf - -C ./backup/
```

## Maintenance

### Updates

1. **Rolling Update**:
   ```bash
   kubectl set image deployment/testing-agent testing-agent=gocars/testing-agent:v2.0.0 -n gocars-testing
   ```

2. **Configuration Updates**:
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl rollout restart deployment/testing-agent -n gocars-testing
   ```

### Cleanup

```bash
# Remove deployment
./scripts/undeploy.sh

# Or manually
kubectl delete namespace gocars-testing
```

## Production Considerations

### High Availability

- Deploy across multiple availability zones
- Use external managed databases (RDS, Cloud SQL)
- Implement proper backup strategies
- Configure monitoring and alerting

### Security Hardening

- Use private container registries
- Implement network policies
- Regular security scanning
- Rotate secrets regularly

### Cost Optimization

- Use spot instances where appropriate
- Implement resource quotas
- Monitor and optimize resource usage
- Use cluster autoscaling

## Support

For issues and questions:

1. Check the logs: `kubectl logs -f deployment/testing-agent -n gocars-testing`
2. Review metrics: Access Grafana dashboard
3. Check health status: `curl http://<service>/health`
4. Review documentation and troubleshooting guide

## API Endpoints

Once deployed, the testing agent provides these endpoints:

- `GET /` - API information
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /info` - System information
- `GET /metrics` - Prometheus metrics
- `POST /api/tests/start` - Start test execution
- `GET /api/tests/:id/status` - Get test status
- `POST /api/tests/:id/stop` - Stop test execution
- `GET /api/config` - Get configuration