#!/bin/bash

# AI Hackathon Platform - Monitoring Management Script

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="podman-compose.development.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if services are running
check_services() {
    echo_info "Checking service status..."
    podman-compose -f $COMPOSE_FILE ps
}

# Function to start all services
start_services() {
    echo_info "Starting AI Hackathon platform with monitoring..."
    
    # Check if .env.development exists
    if [ ! -f ".env.development" ]; then
        if [ -f ".env" ]; then
            echo_warn ".env.development not found, creating from .env"
            cp .env .env.development
        else
            echo_error ".env.development file is required. Please create it from .env.template"
            exit 1
        fi
    fi
    
    podman-compose -f $COMPOSE_FILE up -d
    
    echo_info "Waiting for services to start..."
    sleep 10
    
    check_health
}

# Function to stop all services
stop_services() {
    echo_info "Stopping AI Hackathon platform..."
    podman-compose -f $COMPOSE_FILE down
}

# Function to restart monitoring services
restart_monitoring() {
    echo_info "Restarting monitoring services..."
    podman-compose -f $COMPOSE_FILE restart prometheus grafana
    
    echo_info "Waiting for services to restart..."
    sleep 10
    
    check_monitoring_health
}

# Function to check health of key services
check_health() {
    echo_info "Checking service health..."
    
    # Check Prometheus
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo_info "✅ Prometheus is healthy"
    else
        echo_error "❌ Prometheus is not responding"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo_info "✅ Grafana is healthy"
    else
        echo_error "❌ Grafana is not responding"
    fi
    
    # Check main application (through nginx)
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo_info "✅ Main application is healthy"
    else
        echo_warn "⚠️  Main application may still be starting"
    fi
}

# Function to check if dashboards are loaded
check_dashboards() {
    echo_info "Checking if dashboards are loaded in Grafana..."
    
    # Wait a bit for Grafana to fully start
    sleep 5
    
    # Try to get dashboard list
    dashboard_count=$(curl -s -u admin:admin http://localhost:3000/api/search | jq length 2>/dev/null || echo "0")
    
    if [ "$dashboard_count" -gt 0 ]; then
        echo_info "✅ Found $dashboard_count dashboards in Grafana"
        echo_info "Available dashboards:"
        curl -s -u admin:admin http://localhost:3000/api/search | jq -r '.[].title' 2>/dev/null || echo "   - Unable to list dashboard names"
    else
        echo_warn "⚠️  No dashboards found or unable to connect to Grafana"
        echo_info "Try refreshing Grafana at http://localhost:3000"
        echo_info "Login with admin/admin and go to Dashboards → Browse"
    fi
}

# Function to show logs
show_logs() {
    service=${1:-""}
    if [ -z "$service" ]; then
        echo_info "Showing logs for all services..."
        podman-compose -f $COMPOSE_FILE logs -f
    else
        echo_info "Showing logs for $service..."
        podman-compose -f $COMPOSE_FILE logs -f "$service"
    fi
}

# Function to show monitoring URLs
show_urls() {
    echo_info "AI Hackathon Platform - Service URLs:"
    echo ""
    echo "🌐 Main Application:     http://localhost"
    echo "📊 Grafana Dashboard:    http://localhost:3000 (admin/admin)"
    echo "📈 Prometheus Metrics:   http://localhost:9090"
    echo "🔧 Frontend Dev:         http://localhost:3004"
    echo "🤖 AI Service:           http://localhost:3002"
    echo "🗄️  Database Admin:      http://localhost:8080"
    echo "📮 Email Testing:        http://localhost:8025"
    echo "⚡ Redis Commander:      http://localhost:8081"
    echo ""
    echo_info "Note: Some services may take a few minutes to fully start"
}

# Function to backup monitoring configuration
backup_monitoring() {
    backup_dir="monitoring-backup-$(date +%Y%m%d-%H%M%S)"
    echo_info "Creating monitoring backup in $backup_dir..."
    
    mkdir -p "$backup_dir"
    cp -r grafana/ "$backup_dir/"
    cp prometheus/prometheus.dev.yml "$backup_dir/"
    
    echo_info "Backup created successfully in $backup_dir"
}

# Function to clean up stopped containers and volumes
cleanup() {
    echo_warn "This will remove stopped containers and unused volumes. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo_info "Cleaning up..."
        podman-compose -f $COMPOSE_FILE down -v
        podman system prune -f
        echo_info "Cleanup completed"
    else
        echo_info "Cleanup cancelled"
    fi
}

# Function to perform complete cleanup (DANGEROUS)
cleanup_all() {
    echo_error "⚠️  WARNING: This will remove ALL containers, images, volumes, and networks!"
    echo_error "This action cannot be undone and will affect ALL podman projects on this system."
    echo_warn "Are you absolutely sure? Type 'YES' to confirm:"
    read -r response
    if [[ "$response" == "YES" ]]; then
        echo_info "Stopping all containers..."
        podman-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
        
        echo_info "Removing all containers..."
        podman container rm -a -f 2>/dev/null || true
        
        echo_info "Removing all images..."
        podman image rm -a -f 2>/dev/null || true
        
        echo_info "Removing all volumes..."
        podman volume rm -a -f 2>/dev/null || true
        
        echo_info "Removing custom networks..."
        podman network rm $(podman network ls -q --filter type=custom) 2>/dev/null || true
        
        echo_info "Final system cleanup..."
        podman system prune -a -f --volumes 2>/dev/null || true
        
        echo_info "✅ Complete cleanup finished!"
        echo_info "You can now run './manage-monitoring.sh start' to rebuild everything"
    else
        echo_info "Complete cleanup cancelled"
    fi
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        echo ""
        show_urls
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        echo ""
        show_urls
        ;;
    restart-monitoring)
        restart_monitoring
        ;;
    status)
        check_services
        echo ""
        check_health
        ;;
    health)
        check_health
        echo ""
        check_dashboards
        ;;
    dashboards)
        check_dashboards
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    urls)
        show_urls
        ;;
    backup)
        backup_monitoring
        ;;
    cleanup)
        cleanup
        ;;
    cleanup-all)
        cleanup_all
        ;;
    help|*)
        echo "AI Hackathon Platform - Monitoring Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start              Start all services"
        echo "  stop               Stop all services"
        echo "  restart            Restart all services"
        echo "  restart-monitoring Restart only monitoring services"
        echo "  status             Show service status and health"
        echo "  health             Check service health"
        echo "  dashboards         Check if dashboards are loaded"
        echo "  logs [service]     Show logs (all services or specific service)"
        echo "  urls               Show service URLs"
        echo "  backup             Backup monitoring configuration"
        echo "  cleanup            Clean up stopped containers and volumes"
        echo "  cleanup-all        🔥 DANGER: Remove ALL containers, images, volumes"
        echo "  help               Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start           # Start the platform"
        echo "  $0 logs grafana    # Show Grafana logs"
        echo "  $0 health          # Check if services are healthy"
        ;;
esac
