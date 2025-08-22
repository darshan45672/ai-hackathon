#!/bin/bash

# =============================================================================
# AI HACKATHON - QUICK SETUP SCRIPT
# =============================================================================
# This script helps you set up the AI Hackathon platform quickly
# Usage: ./setup.sh [development|production]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    local mode=${1:-development}
    
    print_header "AI Hackathon Platform Setup"
    
    # Validate environment mode
    if [[ "$mode" != "development" && "$mode" != "production" ]]; then
        print_error "Invalid mode. Use 'development' or 'production'"
        exit 1
    fi
    
    print_info "Setting up in $mode mode..."
    
    # Check prerequisites
    print_header "Checking Prerequisites"
    
    if ! command_exists podman && ! command_exists docker; then
        print_error "Neither Podman nor Docker found. Please install one of them."
        exit 1
    fi
    
    if command_exists podman; then
        CONTAINER_CMD="podman"
        COMPOSE_CMD="podman-compose"
        print_success "Podman found"
    elif command_exists docker; then
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        print_success "Docker found"
    fi
    
    if ! command_exists "$COMPOSE_CMD"; then
        print_error "$COMPOSE_CMD not found. Please install it."
        exit 1
    fi
    
    print_success "$COMPOSE_CMD found"
    
    # Environment setup
    print_header "Environment Configuration"
    
    local env_file=".env.$mode"
    
    if [[ ! -f "$env_file" ]]; then
        print_info "Creating $env_file from template..."
        if [[ -f ".env.template" ]]; then
            cp .env.template "$env_file"
            print_success "Created $env_file"
        else
            print_error ".env.template not found"
            exit 1
        fi
    else
        print_warning "$env_file already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .env.template "$env_file"
            print_success "Recreated $env_file"
        fi
    fi
    
    # Check for required environment variables
    print_header "Checking Required Configuration"
    
    local missing_vars=()
    
    # Check for OAuth credentials
    if ! grep -q "^GITHUB_CLIENT_ID=\"[^\"]*[a-zA-Z0-9][^\"]*\"" "$env_file"; then
        missing_vars+=("GITHUB_CLIENT_ID")
    fi
    
    if ! grep -q "^GITHUB_CLIENT_SECRET=\"[^\"]*[a-zA-Z0-9][^\"]*\"" "$env_file"; then
        missing_vars+=("GITHUB_CLIENT_SECRET")
    fi
    
    if ! grep -q "^GEMINI_API_KEY=\"[^\"]*[a-zA-Z0-9][^\"]*\"" "$env_file"; then
        missing_vars+=("GEMINI_API_KEY")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_warning "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo
        print_info "Please edit $env_file and add the required values:"
        echo
        echo "  GitHub OAuth: https://github.com/settings/applications/new"
        echo "  Gemini API: https://makersuite.google.com/app/apikey"
        echo
        read -p "Press Enter after updating the environment file..."
    else
        print_success "All required environment variables are configured"
    fi
    
    # Container operations
    print_header "Starting Services"
    
    local compose_file="podman-compose.$mode.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        print_error "$compose_file not found"
        exit 1
    fi
    
    print_info "Using $compose_file"
    
    # Stop existing containers if running
    print_info "Stopping existing containers..."
    $COMPOSE_CMD -f "$compose_file" down 2>/dev/null || true
    
    # Start services
    print_info "Starting services in $mode mode..."
    if $COMPOSE_CMD -f "$compose_file" up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_header "Waiting for Services"
    
    print_info "Waiting for services to start..."
    sleep 10
    
    # Check service health
    print_info "Checking service health..."
    
    # Wait for nginx to be healthy
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s http://localhost/health >/dev/null 2>&1; then
            print_success "Application is ready!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_warning "Application might still be starting. Check logs if needed."
            break
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    # Display access information
    print_header "Access Information"
    
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo
    echo -e "${BLUE}Application URLs:${NC}"
    echo "   Main Application:  http://localhost"
    echo "   API Documentation: http://localhost/api"
    echo "   GraphQL Playground: http://localhost/graphql"
    echo
    echo -e "${BLUE}Development Tools:${NC}"
    echo "   Grafana Dashboard: http://localhost:3000 (admin/admin)"
    echo "   Adminer (Database): http://localhost/adminer"
    echo "   Redis Commander:   http://localhost/redis-commander"
    echo "   MailHog (Email):   http://localhost/mailhog"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "   View logs:         $COMPOSE_CMD -f $compose_file logs -f"
    echo "   Stop services:     $COMPOSE_CMD -f $compose_file down"
    echo "   Restart services:  $COMPOSE_CMD -f $compose_file restart"
    echo "   Check status:      $CONTAINER_CMD ps"
    echo
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_warning "Remember to configure the missing environment variables for full functionality"
    fi
}

# Help function
show_help() {
    echo "AI Hackathon Platform Setup Script"
    echo
    echo "Usage: $0 [MODE]"
    echo
    echo "MODE:"
    echo "  development  Setup for development (default)"
    echo "  production   Setup for production"
    echo
    echo "Examples:"
    echo "  $0                # Setup development environment"
    echo "  $0 development    # Setup development environment"
    echo "  $0 production     # Setup production environment"
    echo
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
