#!/bin/bash

# GoCars Testing Agent Undeployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="gocars-testing"

echo -e "${BLUE}🗑️  Starting GoCars Testing Agent Undeployment${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ kubectl is available${NC}"
}

# Function to confirm deletion
confirm_deletion() {
    echo -e "${YELLOW}⚠️  This will delete all resources in the ${NAMESPACE} namespace${NC}"
    echo -e "${YELLOW}⚠️  This action cannot be undone!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Aborted by user${NC}"
        exit 0
    fi
}

# Function to delete ingress
delete_ingress() {
    echo -e "${YELLOW}🌐 Deleting Ingress...${NC}"
    kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
    echo -e "${GREEN}✅ Ingress deleted${NC}"
}

# Function to delete HPA
delete_hpa() {
    echo -e "${YELLOW}📈 Deleting Horizontal Pod Autoscaler...${NC}"
    kubectl delete -f k8s/hpa.yaml --ignore-not-found=true
    echo -e "${GREEN}✅ HPA deleted${NC}"
}

# Function to delete applications
delete_apps() {
    echo -e "${YELLOW}🗑️  Deleting applications...${NC}"
    kubectl delete -f k8s/monitoring.yaml --ignore-not-found=true
    kubectl delete -f k8s/service.yaml --ignore-not-found=true
    kubectl delete -f k8s/deployment.yaml --ignore-not-found=true
    echo -e "${GREEN}✅ Applications deleted${NC}"
}

# Function to delete ConfigMaps
delete_configmaps() {
    echo -e "${YELLOW}⚙️  Deleting ConfigMaps...${NC}"
    kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
    echo -e "${GREEN}✅ ConfigMaps deleted${NC}"
}

# Function to delete secrets
delete_secrets() {
    echo -e "${YELLOW}🔐 Deleting secrets...${NC}"
    kubectl delete -f k8s/secrets.yaml --ignore-not-found=true
    echo -e "${GREEN}✅ Secrets deleted${NC}"
}

# Function to delete PVCs (optional)
delete_pvcs() {
    echo -e "${YELLOW}💾 Do you want to delete Persistent Volume Claims?${NC}"
    echo -e "${YELLOW}⚠️  This will permanently delete all stored data!${NC}"
    read -p "Delete PVCs? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete -f k8s/pvc.yaml --ignore-not-found=true
        echo -e "${GREEN}✅ PVCs deleted${NC}"
    else
        echo -e "${BLUE}PVCs preserved${NC}"
    fi
}

# Function to delete namespace
delete_namespace() {
    echo -e "${YELLOW}📁 Do you want to delete the entire namespace?${NC}"
    echo -e "${YELLOW}⚠️  This will delete any remaining resources in the namespace!${NC}"
    read -p "Delete namespace? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete namespace ${NAMESPACE} --ignore-not-found=true
        echo -e "${GREEN}✅ Namespace deleted${NC}"
    else
        echo -e "${BLUE}Namespace preserved${NC}"
    fi
}

# Function to wait for cleanup
wait_for_cleanup() {
    echo -e "${YELLOW}⏳ Waiting for resources to be cleaned up...${NC}"
    
    # Wait for pods to terminate
    while kubectl get pods -n ${NAMESPACE} 2>/dev/null | grep -q "Terminating"; do
        echo -e "${BLUE}Waiting for pods to terminate...${NC}"
        sleep 5
    done
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show final status
show_final_status() {
    echo -e "${BLUE}📊 Final Status${NC}"
    echo -e "${BLUE}==============${NC}"
    
    if kubectl get namespace ${NAMESPACE} &>/dev/null; then
        echo -e "\n${YELLOW}Remaining resources in ${NAMESPACE}:${NC}"
        kubectl get all -n ${NAMESPACE} 2>/dev/null || echo "No resources found"
        
        echo -e "\n${YELLOW}Remaining PVCs:${NC}"
        kubectl get pvc -n ${NAMESPACE} 2>/dev/null || echo "No PVCs found"
    else
        echo -e "${GREEN}Namespace ${NAMESPACE} has been completely removed${NC}"
    fi
    
    echo -e "\n${GREEN}🎉 Undeployment completed!${NC}"
}

# Function for graceful shutdown
graceful_shutdown() {
    echo -e "${YELLOW}🛑 Performing graceful shutdown...${NC}"
    
    # Scale down deployments first
    echo -e "${BLUE}Scaling down deployments...${NC}"
    kubectl scale deployment --all --replicas=0 -n ${NAMESPACE} 2>/dev/null || true
    
    # Wait for pods to terminate gracefully
    sleep 30
    
    echo -e "${GREEN}✅ Graceful shutdown completed${NC}"
}

# Function for force cleanup
force_cleanup() {
    echo -e "${YELLOW}💥 Performing force cleanup...${NC}"
    
    # Delete all resources in namespace
    kubectl delete all --all -n ${NAMESPACE} --force --grace-period=0 2>/dev/null || true
    kubectl delete pvc --all -n ${NAMESPACE} --force --grace-period=0 2>/dev/null || true
    kubectl delete secrets --all -n ${NAMESPACE} --force --grace-period=0 2>/dev/null || true
    kubectl delete configmaps --all -n ${NAMESPACE} --force --grace-period=0 2>/dev/null || true
    
    echo -e "${GREEN}✅ Force cleanup completed${NC}"
}

# Main undeployment flow
main() {
    echo -e "${BLUE}Starting undeployment process...${NC}"
    
    check_kubectl
    confirm_deletion
    
    delete_ingress
    delete_hpa
    graceful_shutdown
    delete_apps
    delete_configmaps
    delete_secrets
    delete_pvcs
    wait_for_cleanup
    delete_namespace
    show_final_status
}

# Handle script arguments
case "${1:-undeploy}" in
    "undeploy")
        main
        ;;
    "force")
        check_kubectl
        confirm_deletion
        force_cleanup
        delete_namespace
        show_final_status
        ;;
    "status")
        check_kubectl
        if kubectl get namespace ${NAMESPACE} &>/dev/null; then
            echo -e "${YELLOW}Resources in ${NAMESPACE}:${NC}"
            kubectl get all -n ${NAMESPACE}
        else
            echo -e "${GREEN}Namespace ${NAMESPACE} does not exist${NC}"
        fi
        ;;
    *)
        echo "Usage: $0 [undeploy|force|status]"
        echo "  undeploy - Graceful undeployment (default)"
        echo "  force    - Force cleanup all resources"
        echo "  status   - Show current status"
        exit 1
        ;;
esac