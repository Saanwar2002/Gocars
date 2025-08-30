# GoCars Testing Agent - Deployment Guide

This guide covers the containerized deployment of the GoCars Testing Agent using Docker and Kubernetes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Scaling](#scaling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Kubernetes** (v1.24+)
- **kubectl** (compatible with your cluster version)
- **Helm** (v3.8+) - optional but recommended

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **Memory**: 4GB RAM
- **Storage**: 20GB available space
- **Network**: Stable internet connection

#### Recommended for Production
- **CPU**: 4+ cores
- **Memory**: 8GB+ RAM
- **Storage**: 100GB+ SSD storage
- **Network**: High-bandwidth connection

### Kubernetes Cluster Requirements

- **Node Count**: 3+ nodes (for high availability)
- **Storage Classes**: 
  - `fast-ssd` for databases and critical data
  - `standard` for logs and reports
- **Ingress Controller**: NGINX Ingress Controller
- **Cert Manager**: For SSL/TLS certificates
- **Metrics Server**: For HPA functionality

## Quick Start

### Local Development with Docker Compose

```bash
# Clone the repository
git clone https://github.com/Saanwar2002/Gocars.git
cd Gocars

# Start the development environment
docker-compose --profile dev up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f testing-agent-dev
```

Access the application at:
- **Main App**: http://localhost:3001
- **Metrics**: http://localhost:8081/metrics

### Production Deployment with Kubernetes

```bash
# Deploy to Kubernetes
chmod +x scripts/deploy.sh
./scripts/deploy.sh --environment production --image-tag v1.0.0

# Check deployment status
kubectl get pods -n gocars-testing

# View logs
kubectl logs -f deployment/testing-agent -n gocars-testing
```

## Docker Deployment

### Building the Image

```bash
# Build production image
docker build -t gocars/testing-agent:latest .

# Build development image
docker build --target development -t gocars/testing-agent:dev .

# Build with specific tag
docker build -t gocars/testing-agent:v1.0.0 .
```

### Running with Docker

```bash
# Run standalone container
docker run -d \
  --name gocars-testing-agent \
  -p 3000:3000 \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -v $(pwd)/test-data:/app/test-data \
  -v $(pwd)/logs:/app/logs \
  gocars/testing-agent:latest

# Run with environment file
docker run -d \
  --name gocars-testing-agent \
  --env-file .env.production \
  -p 3000:3000 \
  -p 8080:8080 \
  gocars/testing-agent:latest
```

### Docker Compose Profiles

#### Development Profile
```bash
# Start development environment
docker-compose --profile dev up -d

# Includes:
# - Testing agent (development mode)
# - Redis
# - MongoDB
# - PostgreSQL
```

#### Production Profile
```bash
# Start production environment
docker-compose --profile production up -d

# Includes:
# - Testing agent (production mode)
# - Redis
# - MongoDB
# - PostgreSQL
# - Nginx reverse proxy
```

#### Monitoring Profile
```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Additional services:
# - Prometheus
# - Grafana
```

### Environment Variables

Create `.env` file for Docker Compose:

```bash
# Database passwords
REDIS_PASSWORD=your_redis_password
MONGO_PASSWORD=your_mongo_password
POSTGRES_PASSWORD=your_postgres_password

# Application secrets
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
ENCRYPTION_KEY=your_encryption_key

# External services
SLACK_WEBHOOK_URL=your_slack_webhook
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

## Kubernetes Deployment

### Automated Deployment

Use the provided deployment script:

```bash
# Deploy to staging
./scripts/deploy.sh --environment staging --image-tag v1.0.0

# Deploy to production
./scripts/deploy.sh --environment production --image-tag v1.0.0

# Deploy with specific context
./scripts/deploy.sh --context my-cluster --environment production
```

### Manual Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy secrets (update with real values first)
kubectl apply -f k8s/secrets.yaml

# Deploy configuration
kubectl apply -f k8s/configmap.yaml

# Deploy RBAC
kubectl apply -f k8s/rbac.yaml

# Deploy storage
kubectl apply -f k8s/pvc.yaml

# Deploy databases
kubectl apply -f k8s/databases.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l component=database -n gocars-testing --timeout=300s

# Deploy main application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Deploy autoscaling
kubectl apply -f k8s/hpa.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Deploy monitoring (optional)
kubectl apply -f k8s/monitoring.yaml
```

### Updating Secrets

Before deployment, update the secrets in `k8s/secrets.yaml`:

```bash
# Generate base64 encoded secrets
echo -n "your_password" | base64

# Update secrets.yaml with real values
# Then apply:
kubectl apply -f k8s/secrets.yaml
```

### Verifying Deployment

```bash
# Check all resources
kubectl get all -n gocars-testing

# Check pod status
kubectl get pods -n gocars-testing -o wide

# Check services
kubectl get services -n gocars-testing

# Check ingress
kubectl get ingress -n gocars-testing

# Check persistent volumes
kubectl get pv,pvc -n gocars-testing

# Test connectivity
kubectl port-forward service/testing-agent-service 8080:80 -n gocars-testing
curl http://localhost:8080/health
```

## Configuration

### Application Configuration

The application can be configured through:

1. **Environment Variables** (highest priority)
2. **ConfigMaps** (Kubernetes)
3. **Configuration Files** (mounted volumes)
4. **Default Values** (lowest priority)

### Key Configuration Options

#### Testing Configuration
```yaml
TEST_TIMEOUT: "300000"              # Test timeout in milliseconds
MAX_CONCURRENT_TESTS: "10"         # Maximum concurrent test executions
TEST_DATA_RETENTION_DAYS: "30"     # How long to keep test data
```

#### Analytics Configuration
```yaml
METRICS_COLLECTION_INTERVAL: "60000"        # Metrics collection interval
ENABLE_REAL_TIME_ANALYSIS: "true"           # Enable real-time analysis
ENABLE_BUSINESS_IMPACT_ANALYSIS: "true"     # Enable business impact analysis
```

#### Performance Configuration
```yaml
PERFORMANCE_THRESHOLD_CPU: "80"      # CPU usage threshold (%)
PERFORMANCE_THRESHOLD_MEMORY: "85"   # Memory usage threshold (%)
```

### Database Configuration

#### Redis Configuration
```yaml
REDIS_URL: "redis://redis-service:6379"
REDIS_PASSWORD: "from_secret"
```

#### MongoDB Configuration
```yaml
MONGODB_URL: "mongodb://mongodb-service:27017/gocars-testing"
MONGO_USERNAME: "from_secret"
MONGO_PASSWORD: "from_secret"
```

#### PostgreSQL Configuration
```yaml
POSTGRES_URL: "postgresql://postgres:password@postgres-service:5432/gocars_testing"
POSTGRES_USERNAME: "from_secret"
POSTGRES_PASSWORD: "from_secret"
```

## Monitoring

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint:

- **Test Metrics**: Pass rates, execution times, failure counts
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: User satisfaction, system availability
- **Custom Metrics**: Application-specific KPIs

### Grafana Dashboards

Pre-configured dashboards for:

- **Application Overview**: High-level system health
- **Test Execution**: Test results and trends
- **Performance Monitoring**: Resource usage and bottlenecks
- **Business Impact**: Business metrics and KPIs

### Alerting Rules

Configured alerts for:

- **Application Down**: Service unavailability
- **High Test Failure Rate**: Unusual test failures
- **Resource Usage**: High CPU/memory usage
- **Database Issues**: Database connectivity problems

### Accessing Monitoring

```bash
# Port forward to Prometheus
kubectl port-forward service/prometheus-service 9090:9090 -n gocars-testing

# Port forward to Grafana
kubectl port-forward service/grafana-service 3000:3000 -n gocars-testing

# Access via ingress (if configured)
# https://monitoring.testing.gocars.com/prometheus
# https://monitoring.testing.gocars.com/grafana
```

## Scaling

### Horizontal Pod Autoscaler (HPA)

Automatic scaling based on:
- **CPU Usage**: Target 70%
- **Memory Usage**: Target 80%
- **Custom Metrics**: Active tests count

```bash
# Check HPA status
kubectl get hpa -n gocars-testing

# View HPA details
kubectl describe hpa testing-agent-hpa -n gocars-testing
```

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment testing-agent --replicas=5 -n gocars-testing

# Check scaling status
kubectl get deployment testing-agent -n gocars-testing
```

### Vertical Pod Autoscaler (VPA)

Automatic resource adjustment:
- **CPU**: 100m - 2000m
- **Memory**: 256Mi - 4Gi

```bash
# Check VPA recommendations
kubectl describe vpa testing-agent-vpa -n gocars-testing
```

### Database Scaling

#### Redis Scaling
```bash
# Scale Redis (if using deployment instead of StatefulSet)
kubectl scale deployment redis --replicas=3 -n gocars-testing
```

#### MongoDB Scaling
```bash
# For production, consider MongoDB replica sets
# Update StatefulSet replicas
kubectl patch statefulset mongodb -p '{"spec":{"replicas":3}}' -n gocars-testing
```

## Security

### Network Policies

```yaml
# Example network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: testing-agent-netpol
  namespace: gocars-testing
spec:
  podSelector:
    matchLabels:
      app: gocars-testing-agent
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
```

### Pod Security Standards

```yaml
# Pod Security Context
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault
```

### RBAC Configuration

The deployment includes minimal RBAC permissions:

- **ServiceAccount**: `testing-agent-sa`
- **ClusterRole**: Read-only access to cluster resources
- **Role**: Namespace-specific permissions for testing

### Secrets Management

#### Using External Secret Management

```bash
# Example with AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: gocars-testing
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
```

#### Rotating Secrets

```bash
# Update secret
kubectl create secret generic testing-agent-secrets \
  --from-literal=JWT_SECRET=new_jwt_secret \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment to pick up new secrets
kubectl rollout restart deployment/testing-agent -n gocars-testing
```

## Troubleshooting

### Common Issues

#### Pod Startup Issues

```bash
# Check pod status
kubectl get pods -n gocars-testing

# View pod logs
kubectl logs -f pod/testing-agent-xxx -n gocars-testing

# Describe pod for events
kubectl describe pod testing-agent-xxx -n gocars-testing

# Check resource constraints
kubectl top pods -n gocars-testing
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it deployment/testing-agent -n gocars-testing -- /bin/sh

# Inside the pod:
# Test Redis
redis-cli -h redis-service -p 6379 ping

# Test MongoDB
mongosh mongodb://mongodb-service:27017/gocars-testing

# Test PostgreSQL
psql postgresql://postgres:password@postgres-service:5432/gocars_testing
```

#### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n gocars-testing

# Check PV status
kubectl get pv

# Check storage class
kubectl get storageclass

# View PVC events
kubectl describe pvc test-data-pvc -n gocars-testing
```

#### Ingress Issues

```bash
# Check ingress status
kubectl get ingress -n gocars-testing

# Check ingress controller logs
kubectl logs -f deployment/ingress-nginx-controller -n ingress-nginx

# Test internal service
kubectl port-forward service/testing-agent-service 8080:80 -n gocars-testing
```

### Performance Issues

#### High CPU Usage

```bash
# Check resource usage
kubectl top pods -n gocars-testing

# Check HPA status
kubectl get hpa -n gocars-testing

# Scale manually if needed
kubectl scale deployment testing-agent --replicas=5 -n gocars-testing
```

#### Memory Leaks

```bash
# Monitor memory usage over time
kubectl top pods -n gocars-testing --sort-by=memory

# Check for memory limits
kubectl describe pod testing-agent-xxx -n gocars-testing

# Restart pod if necessary
kubectl delete pod testing-agent-xxx -n gocars-testing
```

#### Database Performance

```bash
# Check database resource usage
kubectl top pods -l component=database -n gocars-testing

# Check database logs
kubectl logs -f statefulset/mongodb -n gocars-testing
kubectl logs -f statefulset/postgres -n gocars-testing
kubectl logs -f statefulset/redis -n gocars-testing
```

### Debugging Commands

```bash
# Get all resources
kubectl get all -n gocars-testing

# Check events
kubectl get events -n gocars-testing --sort-by='.lastTimestamp'

# Check resource quotas
kubectl describe resourcequota -n gocars-testing

# Check network policies
kubectl get networkpolicy -n gocars-testing

# Export configuration for debugging
kubectl get deployment testing-agent -o yaml -n gocars-testing > debug-deployment.yaml
```

### Log Analysis

```bash
# View application logs
kubectl logs -f deployment/testing-agent -n gocars-testing

# View logs from all pods
kubectl logs -f -l app=gocars-testing-agent -n gocars-testing

# View previous container logs (if pod restarted)
kubectl logs --previous deployment/testing-agent -n gocars-testing

# Export logs for analysis
kubectl logs deployment/testing-agent -n gocars-testing > application.log
```

### Health Checks

```bash
# Test health endpoint
kubectl exec -it deployment/testing-agent -n gocars-testing -- curl http://localhost:3000/health

# Test metrics endpoint
kubectl exec -it deployment/testing-agent -n gocars-testing -- curl http://localhost:8080/metrics

# Test database connections
kubectl exec -it deployment/testing-agent -n gocars-testing -- npm run health-check
```

## Cleanup

### Undeployment

```bash
# Use the undeployment script
./scripts/undeploy.sh

# Or force deletion without confirmation
./scripts/undeploy.sh --force

# Manual cleanup
kubectl delete namespace gocars-testing
```

### Docker Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (careful - this deletes data)
docker-compose down -v

# Remove images
docker rmi gocars/testing-agent:latest
```

## Support

For deployment issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Check Kubernetes events
4. Verify configuration and secrets
5. Test connectivity between components

For additional support, please refer to the main project documentation or create an issue in the repository.