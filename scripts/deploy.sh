#!/bin/bash

# GoCars Testing Agent Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="gocars-testing"
IMAGE_TAG=${1:-latest}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"gocars"}
IMAGE_NAME="${DOCKER_REGISTRY}/testing-agent:${IMAGE_TAG}"

echo -e "${BLUE}🚀 Starting GoCars Testing Agent Deployment${NC}"
echo -e "${BLUE}Image: ${IMAGE_NAME}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ kubectl is available${NC}"
}

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is available${NC}"
}

# Function to build Docker image
build_image() {
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    docker build -t ${IMAGE_NAME} .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build Docker image${NC}"
        exit 1
    fi
}

# Function to push Docker image
push_image() {
    echo -e "${YELLOW}📤 Pushing Docker image to registry...${NC}"
    docker push ${IMAGE_NAME}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image pushed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to push Docker image${NC}"
        exit 1
    fi
}

# Function to create namespace
create_namespace() {
    echo -e "${YELLOW}📁 Creating namespace...${NC}"
    kubectl apply -f k8s/namespace.yaml
    echo -e "${GREEN}✅ Namespace created/updated${NC}"
}

# Function to apply secrets
apply_secrets() {
    echo -e "${YELLOW}🔐 Applying secrets...${NC}"
    
    # Check if secrets file exists and has been configured
    if [ ! -f "k8s/secrets.yaml" ]; then
        echo -e "${RED}❌ secrets.yaml not found. Please create it first.${NC}"
        exit 1
    fi
    
    # Check if Firebase secrets are configured
    if grep -q '""' k8s/secrets.yaml; then
        echo -e "${YELLOW}⚠️  Warning: Some secrets appear to be empty. Please configure them properly.${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    kubectl apply -f k8s/secrets.yaml
    echo -e "${GREEN}✅ Secrets applied${NC}"
}

# Function to apply ConfigMaps
apply_configmaps() {
    echo -e "${YELLOW}⚙️  Applying ConfigMaps...${NC}"
    kubectl apply -f k8s/configmap.yaml
    echo -e "${GREEN}✅ ConfigMaps applied${NC}"
}

# Function to apply PVCs
apply_pvcs() {
    echo -e "${YELLOW}💾 Creating Persistent Volume Claims...${NC}"
    kubectl apply -f k8s/pvc.yaml
    echo -e "${GREEN}✅ PVCs created${NC}"
}

# Function to deploy applications
deploy_apps() {
    echo -e "${YELLOW}🚀 Deploying applications...${NC}"
    
    # Update image in deployment
    sed -i.bak "s|image: gocars/testing-agent:latest|image: ${IMAGE_NAME}|g" k8s/deployment.yaml
    
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/monitoring.yaml
    
    # Restore original deployment file
    mv k8s/deployment.yaml.bak k8s/deployment.yaml
    
    echo -e "${GREEN}✅ Applications deployed${NC}"
}

# Function to apply HPA
apply_hpa() {
    echo -e "${YELLOW}📈 Setting up Horizontal Pod Autoscaler...${NC}"
    kubectl apply -f k8s/hpa.yaml
    echo -e "${GREEN}✅ HPA configured${NC}"
}

# Function to apply Ingress
apply_ingress() {
    echo -e "${YELLOW}🌐 Setting up Ingress...${NC}"
    kubectl apply -f k8s/ingress.yaml
    echo -e "${GREEN}✅ Ingress configured${NC}"
}

# Function to wait for deployments
wait_for_deployments() {
    echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
    
    deployments=("testing-agent" "redis" "postgres" "prometheus" "grafana")
    
    for deployment in "${deployments[@]}"; do
        echo -e "${BLUE}Waiting for ${deployment}...${NC}"
        kubectl wait --for=condition=available --timeout=300s deployment/${deployment} -n ${NAMESPACE}
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${deployment} is ready${NC}"
        else
            echo -e "${RED}❌ ${deployment} failed to become ready${NC}"
            exit 1
        fi
    done
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status${NC}"
    echo -e "${BLUE}==================${NC}"
    
    echo -e "\n${YELLOW}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Services:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}HPA:${NC}"
    kubectl get hpa -n ${NAMESPACE}
    
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Access the testing agent at: https://testing.gocars.com${NC}"
    echo -e "${BLUE}Grafana dashboard: https://testing.gocars.com/grafana${NC}"
    echo -e "${BLUE}Prometheus: https://testing.gocars.com/prometheus${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_kubectl
    check_docker
    
    # Build and push image if not in local mode
    if [ "${LOCAL_DEPLOY:-false}" != "true" ]; then
        build_image
        push_image
    fi
    
    create_namespace
    apply_secrets
    apply_configmaps
    apply_pvcs
    deploy_apps
    apply_hpa
    apply_ingress
    wait_for_deployments
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    "build")
        check_docker
        build_image
        ;;
    "push")
        check_docker
        push_image
        ;;
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 [build|push|deploy|status] [image_tag]"
        echo "  build  - Build Docker image only"
        echo "  push   - Push Docker image to registry"
        echo "  deploy - Full deployment (default)"
        echo "  status - Show deployment status"
        exit 1
        ;;
esac