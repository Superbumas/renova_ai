#!/bin/bash

# Azure Deployment Script for RenovaAI
# This script helps deploy the application to Azure

echo "🚀 RenovaAI Azure Deployment Script"
echo "====================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    
    print_status "✅ All requirements met"
}

# Prepare environment for production
prepare_environment() {
    print_status "Preparing production environment..."
    
    # Copy production environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning "No .env file found. Creating from production template..."
        cp env.production .env
        print_warning "⚠️  Please edit .env file with your actual API keys and domain!"
        print_warning "⚠️  Update FRONTEND_URL with your actual domain"
    fi
    
    # Create necessary directories
    mkdir -p ssl
    mkdir -p nginx
    
    print_status "✅ Environment prepared"
}

# Build and deploy
deploy() {
    print_status "Building and deploying application..."
    
    # Build the application
    print_status "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    if [ $? -eq 0 ]; then
        print_status "✅ Build successful"
    else
        print_error "❌ Build failed"
        exit 1
    fi
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    
    # Start the application
    print_status "Starting application..."
    docker-compose -f docker-compose.prod.yml up -d
    
    if [ $? -eq 0 ]; then
        print_status "✅ Deployment successful"
        print_status "Application is running at: http://localhost (or your domain)"
    else
        print_error "❌ Deployment failed"
        exit 1
    fi
}

# Show status
show_status() {
    print_status "Checking application status..."
    docker-compose -f docker-compose.prod.yml ps
    
    print_status "\nLogs (last 20 lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=20
}

# SSL Setup guidance
setup_ssl_guidance() {
    print_status "\n🔐 SSL Certificate Setup"
    print_status "========================="
    echo ""
    echo "To enable HTTPS, you need to:"
    echo "1. Obtain SSL certificates for your domain"
    echo "2. Place them in the ./ssl/ directory as:"
    echo "   - cert.pem (certificate)"
    echo "   - key.pem (private key)"
    echo "3. Uncomment SSL lines in nginx/default.conf"
    echo "4. Redeploy the application"
    echo ""
    echo "For Let's Encrypt certificates on Azure:"
    echo "  sudo apt install certbot"
    echo "  sudo certbot certonly --standalone -d your-domain.com"
    echo "  sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem"
    echo "  sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem"
}

# Main menu
main() {
    case "$1" in
        "check")
            check_requirements
            ;;
        "prepare")
            check_requirements
            prepare_environment
            ;;
        "deploy")
            check_requirements
            prepare_environment
            deploy
            ;;
        "status")
            show_status
            ;;
        "ssl")
            setup_ssl_guidance
            ;;
        "full")
            check_requirements
            prepare_environment
            deploy
            show_status
            setup_ssl_guidance
            ;;
        *)
            echo "Usage: $0 {check|prepare|deploy|status|ssl|full}"
            echo ""
            echo "Commands:"
            echo "  check    - Check if requirements are installed"
            echo "  prepare  - Prepare environment for deployment"
            echo "  deploy   - Build and deploy the application"
            echo "  status   - Show application status and logs"
            echo "  ssl      - Show SSL setup guidance"
            echo "  full     - Run complete deployment (recommended)"
            echo ""
            echo "Example: $0 full"
            exit 1
            ;;
    esac
}

main "$@" 