#!/bin/bash

# GoCars Testing Agent Deployment Script
set -euo pipefail

# Configuration
NAMESPACE="gocars-testing"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
KUBECTL_CONTEXT="${KUBECTL_CONTEXT:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl context
    if [[ -n "$KUBECTL_CONTEXT" ]]; then
        kubectl config use-context "$KUBECTL_CONTEXT"
    fi
    
    # Verify cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    docker build -t "gocars/testing-agent:${IMAGE_TAG}" .
    
    if [[ "$ENVIRONMENT" != "local" ]]; then
        log_info "Pushing image to registry..."
        docker push "gocars/testing-agent:${IMAGE_TAG}"
    fi
    
    log_success "Docker image built and pushed"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists"
    else
        kubectl apply -f k8s/namespace.yaml
        log_success "Namespace created"
    fi
}

# Deploy secrets
deploy_secrets() {
    log_info "Deploying secrets..."
    
    # Check if secrets already exist
    if kubectl get secret testing-agent-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secrets already exist, skipping creation"
    else
        kubectl apply -f k8s/secrets.yaml
        log_success "Secrets deployed"
    fi
}

# Deploy ConfigMaps
deploy_configmaps() {
    log_info "Deploying ConfigMaps..."
    
    kubectl apply -f k8s/configmap.yaml
    log_success "ConfigMaps deployed"
}

# Deploy RBAC
deploy_rbac() {
    log_info "Deploying RBAC..."
    
    kubectl apply -f k8s/rbac.yaml
    log_success "RBAC deployed"
}

# Deploy PVCs
deploy_storage() {
    log_info "Deploying storage..."
    
    kubectl apply -f k8s/pvc.yaml
    log_success "Storage deployed"
}

# Deploy databases
deploy_databases() {
    log_info "Deploying databases..."
    
    kubectl apply -f k8s/databases.yaml
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=mongodb -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s
    
    log_success "Databases deployed and ready"
}

# Deploy main application
deploy_application() {
    log_info "Deploying testing agent application..."
    
    # Update image tag in deployment
    sed -i.bak "s|gocars/testing-agent:latest|gocars/testing-agent:${IMAGE_TAG}|g" k8s/deployment.yaml
    
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    
    # Wait for deployment to be ready
    log_info "Waiting for application to be ready..."
    kubectl wait --for=condition=available deployment/testing-agent -n "$NAMESPACE" --timeout=600s
    
    # Restore original deployment file
    mv k8s/deployment.yaml.bak k8s/deployment.yaml
    
    log_success "Application deployed and ready"
}

# Deploy HPA
deploy_autoscaling() {
    log_info "Deploying autoscaling..."
    
    kubectl apply -f k8s/hpa.yaml
    log_success "Autoscaling deployed"
}

# Deploy Ingress
deploy_ingress() {
    log_info "Deploying Ingress..."
    
    kubectl apply -f k8s/ingress.yaml
    log_success "Ingress deployed"
}

# Deploy monitoring (optional)
deploy_monitoring() {
    if [[ "$ENVIRONMENT" == "production" ]] || [[ "$ENVIRONMENT" == "staging" ]]; then
        log_info "Deploying monitoring stack..."
        
        kubectl apply -f k8s/monitoring.yaml
        
        # Wait for monitoring to be ready
        log_info "Waiting for monitoring to be ready..."
        kubectl wait --for=condition=available deployment/prometheus -n "$NAMESPACE" --timeout=300s
        kubectl wait --for=condition=available deployment/grafana -n "$NAMESPACE" --timeout=300s
        
        log_success "Monitoring deployed"
    else
        log_info "Skipping monitoring deployment for $ENVIRONMENT environment"
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n "$NAMESPACE"
    
    # Check service endpoints
    kubectl get endpoints -n "$NAMESPACE"
    
    # Test health endpoint
    if kubectl get service testing-agent-service -n "$NAMESPACE" &> /dev/null; then
        log_info "Testing health endpoint..."
        kubectl port-forward service/testing-agent-service 8080:80 -n "$NAMESPACE" &
        PORT_FORWARD_PID=$!
        sleep 5
        
        if curl -f http://localhost:8080/health &> /dev/null; then
            log_success "Health check passed"
        else
            log_warning "Health check failed"
        fi
        
        kill $PORT_FORWARD_PID 2>/dev/null || true
    fi
    
    log_success "Deployment verification completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Kill any background processes
    jobs -p | xargs -r kill 2>/dev/null || true
}

# Main deployment function
main() {
    log_info "Starting GoCars Testing Agent deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Namespace: $NAMESPACE"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    
    if [[ "$ENVIRONMENT" != "local" ]]; then
        build_image
    fi
    
    create_namespace
    deploy_secrets
    deploy_configmaps
    deploy_rbac
    deploy_storage
    deploy_databases
    deploy_application
    deploy_autoscaling
    deploy_ingress
    deploy_monitoring
    verify_deployment
    
    log_success "Deployment completed successfully!"
    
    # Display access information
    echo ""
    log_info "Access Information:"
    echo "  Application: https://testing.gocars.com"
    echo "  API: https://api.testing.gocars.com"
    
    if [[ "$ENVIRONMENT" == "production" ]] || [[ "$ENVIRONMENT" == "staging" ]]; then
        echo "  Monitoring: https://monitoring.testing.gocars.com"
    fi
    
    echo ""
    log_info "To check deployment status:"
    echo "  kubectl get pods -n $NAMESPACE"
    echo "  kubectl logs -f deployment/testing-agent -n $NAMESPACE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --image-tag|-t)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --context|-c)
            KUBECTL_CONTEXT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment    Deployment environment (local|staging|production)"
            echo "  -t, --image-tag      Docker image tag (default: latest)"
            echo "  -c, --context        Kubectl context to use"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main