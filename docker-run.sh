#!/bin/bash

# DSport CMS Docker Management Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if .env file exists, if not create from .env.example
check_env_file() {
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            print_warning ".env file not found. Creating from .env.example..."
            cp .env.example .env
            print_status ".env file created. Please update it with your actual values."
        else
            print_error ".env.example file not found. Please create environment variables manually."
            exit 1
        fi
    fi
}

# Show usage information
show_usage() {
    echo -e "${BLUE}DSport CMS Docker Management${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  prod          Run in production mode"
    echo "  production    Run in production mode (alias for prod)"
    echo "  dev           Run in development mode"
    echo "  development   Run in development mode (alias for dev)"
    echo "  build         Build all images"
    echo "  build-prod    Build production image only"
    echo "  build-dev     Build development image only"
    echo "  stop          Stop all containers"
    echo "  down          Stop and remove all containers"
    echo "  clean         Remove all containers and images"
    echo "  logs          Show logs from running containers"
    echo "  logs-prod     Show logs from production container"
    echo "  logs-dev      Show logs from development container"
    echo "  status        Show status of containers"
    echo "  help          Show this help message"
    echo ""
}

# Main script logic
case "$1" in
    "prod"|"production")
        check_env_file
        print_status "Starting DSport CMS in production mode..."
        docker-compose -f docker-compose.production.yml up --build
        ;;
    "dev"|"development")
        check_env_file
        print_status "Starting DSport CMS in development mode..."
        docker-compose up app-dev --build
        ;;
    "build")
        print_status "Building all Docker images..."
        docker-compose build
        docker-compose -f docker-compose.production.yml build
        ;;
    "build-prod")
        print_status "Building production Docker image..."
        docker-compose -f docker-compose.production.yml build
        ;;
    "build-dev")
        print_status "Building development Docker image..."
        docker-compose build app-dev
        ;;
    "stop")
        print_status "Stopping all containers..."
        docker-compose stop
        docker-compose -f docker-compose.production.yml stop
        ;;
    "down")
        print_status "Stopping and removing all containers..."
        docker-compose down
        docker-compose -f docker-compose.production.yml down
        ;;
    "clean")
        print_warning "This will remove all containers and images. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            print_status "Cleaning up Docker containers and images..."
            docker-compose down --rmi all --volumes --remove-orphans
            docker-compose -f docker-compose.production.yml down --rmi all --volumes --remove-orphans
        else
            print_status "Clean operation cancelled."
        fi
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "logs-prod")
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    "logs-dev")
        docker-compose logs -f app-dev
        ;;
    "status")
        print_status "Container status:"
        docker-compose ps
        docker-compose -f docker-compose.production.yml ps
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        print_error "No command specified."
        show_usage
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac