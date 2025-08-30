#!/bin/bash

# GoCars Testing Agent Undeployment Script
set -euo pipefail

# Configuration
NAMESPACE="gocars-testing"
KUBECTL_CONTEXT="${KUBECTL_CONTEXT:-}"
FORCE="${FORCE:-false}"

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
    
    # Check kubectl context
    if [[ -n "$KUBECTL_CONTEXT" ]]; then
        kubectl config use-context "$KUBECTL_CONTEXT"
    fi
    
    # Verify cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist"
        exit 0
    fi
    
    log_success "Prerequisites check passed"
}

# Confirm deletion
confirm_deletion() {
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        log_warning "This will delete all resources in namespace: $NAMESPACE"
        echo "This action cannot be undone!"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Undeployment cancelled"
            exit 0
        fi
    fi
}

# Delete monitoring
delete_monitoring() {
    log_info "Deleting monitoring stack..."
    
    if kubectl get deployment prometheus -n "$NAMESPACE" &> /dev/null; then
        kubectl delete -f k8s/monitoring.yaml --ignore-not-found=true
        log_success "Monitoring stack deleted"
    else
        log_info "Monitoring stack not found, skipping"
    fi
}

# Delete ingress
delete_ingress() {
    log_info "Deleting Ingress..."
    
    kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
    log_success "Ingress deleted"
}

# Delete autoscaling
delete_autoscaling() {
    log_info "Deleting autoscaling..."
    
    kubectl delete -f k8s/hpa.yaml --ignore-not-found=true
    log_success "Autoscaling deleted"
}

# Delete main application
delete_application() {
    log_info "Deleting testing agent application..."
    
    kubectl delete -f k8s/service.yaml --ignore-not-found=true
    kubectl delete -f k8s/deployment.yaml --ignore-not-found=true
    
    # Wait for pods to terminate
    log_info "Waiting for application pods to terminate..."
    kubectl wait --for=delete pod -l app=gocars-testing-agent -n "$NAMESPACE" --timeout=300s || true
    
    log_success "Application deleted"
}

# Delete databases
delete_databases() {
    log_info "Deleting databases..."
    
    kubectl delete -f k8s/databases.yaml --ignore-not-found=true
    
    # Wait for database pods to terminate
    log_info "Waiting for database pods to terminate..."
    kubectl wait --for=delete pod -l component=database -n "$NAMESPACE" --timeout=300s || true
    kubectl wait --for=delete pod -l component=cache -n "$NAMESPACE" --timeout=300s || true
    
    log_success "Databases deleted"
}

# Delete storage (with confirmation)
delete_storage() {
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        log_warning "This will delete all persistent data including:"
        echo "  - Test data"
        echo "  - Logs"
        echo "  - Reports"
        echo "  - Database data"
        echo "  - Monitoring data"
        echo ""
        read -p "Do you want to delete persistent storage? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Skipping storage deletion"
            return
        fi
    fi
    
    log_info "Deleting storage..."
    
    kubectl delete -f k8s/pvc.yaml --ignore-not-found=true
    
    # Wait for PVCs to be deleted
    log_info "Waiting for PVCs to be deleted..."
    kubectl wait --for=delete pvc --all -n "$NAMESPACE" --timeout=300s || true
    
    log_success "Storage deleted"
}

# Delete RBAC
delete_rbac() {
    log_info "Deleting RBAC..."
    
    kubectl delete -f k8s/rbac.yaml --ignore-not-found=true
    log_success "RBAC deleted"
}

# Delete ConfigMaps
delete_configmaps() {
    log_info "Deleting ConfigMaps..."
    
    kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
    log_success "ConfigMaps deleted"
}

# Delete secrets (with confirmation)
delete_secrets() {
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        read -p "Do you want to delete secrets? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Skipping secrets deletion"
            return
        fi
    fi
    
    log_info "Deleting secrets..."
    
    kubectl delete -f k8s/secrets.yaml --ignore-not-found=true
    log_success "Secrets deleted"
}

# Delete namespace
delete_namespace() {
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        read -p "Do you want to delete the entire namespace? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Skipping namespace deletion"
            return
        fi
    fi
    
    log_info "Deleting namespace..."
    
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    
    # Wait for namespace to be deleted
    log_info "Waiting for namespace to be deleted..."
    while kubectl get namespace "$NAMESPACE" &> /dev/null; do
        sleep 5
        echo -n "."
    done
    echo ""
    
    log_success "Namespace deleted"
}

# Verify deletion
verify_deletion() {
    log_info "Verifying deletion..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Remaining resources in namespace:"
        kubectl get all -n "$NAMESPACE" 2>/dev/null || true
        kubectl get pvc -n "$NAMESPACE" 2>/dev/null || true
        kubectl get secrets -n "$NAMESPACE" 2>/dev/null || true
        kubectl get configmaps -n "$NAMESPACE" 2>/dev/null || true
    else
        log_success "Namespace completely removed"
    fi
}

# Main undeployment function
main() {
    log_info "Starting GoCars Testing Agent undeployment..."
    log_info "Namespace: $NAMESPACE"
    
    check_prerequisites
    confirm_deletion
    
    delete_monitoring
    delete_ingress
    delete_autoscaling
    delete_application
    delete_databases
    delete_storage
    delete_rbac
    delete_configmaps
    delete_secrets
    delete_namespace
    verify_deletion
    
    log_success "Undeployment completed successfully!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --context|-c)
            KUBECTL_CONTEXT="$2"
            shift 2
            ;;
        --force|-f)
            FORCE="true"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --context        Kubectl context to use"
            echo "  -f, --force          Force deletion without confirmation"
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