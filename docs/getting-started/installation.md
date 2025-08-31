# Installation Guide

This guide provides detailed instructions for installing the GoCars Testing Agent in various environments.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **Memory**: 4GB RAM
- **Storage**: 10GB available disk space
- **Network**: Internet connection for external service testing

### Recommended Requirements
- **Memory**: 8GB RAM or higher
- **CPU**: 4 cores or higher
- **Storage**: 20GB available disk space (SSD preferred)
- **Network**: High-speed internet connection

### Dependencies
- **Node.js & npm**: JavaScript runtime and package manager
- **Git**: Version control system
- **Docker** (optional): For containerized deployment
- **Kubernetes** (optional): For orchestrated deployment

## 🚀 Installation Methods

### Method 1: Direct Installation (Recommended)

#### Step 1: Install Node.js

**Windows:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 2: Clone the Repository

```bash
git clone https://github.com/Saanwar2002/Gocars.git
cd Gocars
```

#### Step 3: Install Dependencies

```bash
# Install all dependencies
npm install

# Install global CLI tools (optional)
npm install -g typescript ts-node
```

#### Step 4: Build the Project

```bash
# Build TypeScript files
npm run build

# Verify build
ls -la dist/
```

#### Step 5: Verify Installation

```bash
# Run self-tests to verify everything works
npm run self-test

# Start the web interface
npm run start:web
```

### Method 2: Docker Installation

#### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

#### Step 1: Clone Repository

```bash
git clone https://github.com/Saanwar2002/Gocars.git
cd Gocars
```

#### Step 2: Build Docker Image

```bash
# Build the Docker image
docker build -t gocars-testing-agent .

# Verify image was created
docker images | grep gocars-testing-agent
```

#### Step 3: Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 4: Access the Application

- Web Interface: `http://localhost:8080`
- API Endpoint: `http://localhost:3000`
- Monitoring: `http://localhost:9090`

### Method 3: Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- Helm (optional, for easier deployment)

#### Step 1: Apply Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace gocars-testing

# Apply all manifests
kubectl apply -f k8s/ -n gocars-testing

# Check deployment status
kubectl get pods -n gocars-testing
```

#### Step 2: Access Services

```bash
# Port forward to access locally
kubectl port-forward service/gocars-web 8080:80 -n gocars-testing

# Or use LoadBalancer/Ingress for external access
kubectl get services -n gocars-testing
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Application Configuration
NODE_ENV=development
PORT=3000
WEB_PORT=8080

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/gocars-testing
REDIS_URL=redis://localhost:6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# External Services
WEBSOCKET_URL=ws://localhost:8080
API_BASE_URL=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/testing-agent.log
```

### Configuration Files

#### Main Configuration (`config/default.json`)

```json
{
  "app": {
    "name": "GoCars Testing Agent",
    "version": "1.0.0",
    "environment": "development"
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:8080"]
    }
  },
  "testing": {
    "defaultTimeout": 30000,
    "maxConcurrentTests": 10,
    "retryAttempts": 3,
    "reportFormats": ["json", "html", "console"]
  },
  "monitoring": {
    "enabled": true,
    "metricsPort": 9090,
    "healthCheckInterval": 30000
  }
}
```

#### Test Configuration (`config/test-config.json`)

```json
{
  "testSuites": {
    "firebase": {
      "enabled": true,
      "timeout": 30000,
      "retryAttempts": 2
    },
    "websocket": {
      "enabled": true,
      "timeout": 15000,
      "retryAttempts": 3
    },
    "ui": {
      "enabled": true,
      "browsers": ["chrome", "firefox"],
      "headless": true
    }
  },
  "virtualUsers": {
    "defaultCount": 10,
    "maxConcurrent": 100,
    "profiles": {
      "passenger": {
        "weight": 70,
        "demographics": {
          "ageRange": [18, 65],
          "locations": ["New York", "Los Angeles", "Chicago"],
          "deviceTypes": ["mobile", "desktop"]
        }
      },
      "driver": {
        "weight": 30,
        "demographics": {
          "ageRange": [21, 60],
          "locations": ["New York", "Los Angeles", "Chicago"],
          "deviceTypes": ["mobile"]
        }
      }
    }
  }
}
```

## 🔍 Verification

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check web interface
curl http://localhost:8080/health

# Run comprehensive health check
./bin/gocars-test health --verbose
```

### Self-Tests

```bash
# Run all self-tests
npm run self-test

# Run specific test categories
npm run self-test -- --suite core-components
npm run self-test -- --suite performance-validation

# Generate detailed report
npm run self-test -- --format html --output ./health-report.html
```

### Service Status

```bash
# Check all services
./bin/gocars-test status

# Check specific components
./bin/gocars-test status --component web
./bin/gocars-test status --component api
./bin/gocars-test status --component database
```

## 🚀 Starting Services

### Development Mode

```bash
# Start all services in development mode
npm run dev

# Start individual services
npm run dev:api      # API server only
npm run dev:web      # Web interface only
npm run dev:worker   # Background workers only
```

### Production Mode

```bash
# Build for production
npm run build

# Start production services
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### Service Management

```bash
# Start services
./bin/gocars-test start

# Stop services
./bin/gocars-test stop

# Restart services
./bin/gocars-test restart

# Check service status
./bin/gocars-test status
```

## 🔧 Troubleshooting Installation

### Common Issues

#### Node.js Version Issues

```bash
# Check Node.js version
node --version

# If version is too old, update Node.js
# Windows: Download from nodejs.org
# macOS: brew upgrade node
# Linux: Use NodeSource repository
```

#### Permission Issues (Linux/macOS)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm for user-level installation
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Port Conflicts

```bash
# Check what's using port 3000
netstat -an | grep 3000
lsof -i :3000

# Kill process using the port
kill -9 $(lsof -t -i:3000)

# Or change port in configuration
export PORT=3001
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or modify package.json scripts
"start": "node --max-old-space-size=4096 dist/main.js"
```

#### Build Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist/
npm run build
```

### Getting Help

If you encounter issues during installation:

1. **Check the logs**: `tail -f logs/installation.log`
2. **Run diagnostics**: `./bin/gocars-test diagnose`
3. **Check system requirements**: Ensure all prerequisites are met
4. **Review error messages**: Look for specific error codes or messages
5. **Consult troubleshooting guide**: [Troubleshooting Guide](../operations/troubleshooting.md)
6. **Report issues**: [GitHub Issues](https://github.com/Saanwar2002/Gocars/issues)

## 📚 Next Steps

After successful installation:

1. **Quick Start**: Follow the [Quick Start Guide](./quick-start.md)
2. **Configuration**: Review the [Configuration Guide](./configuration.md)
3. **Web Interface**: Explore the [Web Dashboard Guide](../user-guides/web-dashboard.md)
4. **CLI Tools**: Learn the [CLI Guide](../user-guides/cli-guide.md)

## 🔄 Updating

### Update to Latest Version

```bash
# Pull latest changes
git pull origin master

# Update dependencies
npm install

# Rebuild project
npm run build

# Run tests to verify update
npm run self-test
```

### Version Management

```bash
# Check current version
./bin/gocars-test version

# Check for updates
./bin/gocars-test update --check

# Update to specific version
git checkout v1.2.0
npm install
npm run build
```

---

*Next: [Configuration Guide](./configuration.md) | [Quick Start Guide](./quick-start.md)*