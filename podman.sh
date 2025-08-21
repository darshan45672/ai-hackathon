#!/bin/bash

# Podman management script for AI Hackathon project

set -e

COMPOSE_FILE="podman-compose.yml"

function usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up              Start all services"
    echo "  down            Stop all services"
    echo "  build           Build all images"
    echo "  rebuild         Rebuild all images without cache"
    echo "  logs [SERVICE]  Show logs for all services or specific service"
    echo "  ps              Show running containers"
    echo "  clean           Remove all containers and volumes"
    echo "  restart         Restart all services"
    echo ""
}

function check_env() {
    if [ ! -f ".env" ]; then
        echo "Warning: .env file not found. Creating a sample .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_hackathon
POSTGRES_DB=ai_hackathon
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
        echo "Please update the .env file with your actual values before running 'up'"
        return 1
    fi
}

case "$1" in
    "up")
        echo "Starting services with Podman..."
        check_env
        podman-compose -f $COMPOSE_FILE up -d
        echo "Services started! Check status with: $0 ps"
        ;;
    "down")
        echo "Stopping services..."
        podman-compose -f $COMPOSE_FILE down
        ;;
    "build")
        echo "Building images..."
        podman-compose -f $COMPOSE_FILE build
        ;;
    "rebuild")
        echo "Rebuilding images without cache..."
        podman-compose -f $COMPOSE_FILE build --no-cache
        ;;
    "logs")
        if [ -n "$2" ]; then
            echo "Showing logs for $2..."
            podman-compose -f $COMPOSE_FILE logs -f "$2"
        else
            echo "Showing logs for all services..."
            podman-compose -f $COMPOSE_FILE logs -f
        fi
        ;;
    "ps")
        echo "Running containers:"
        podman-compose -f $COMPOSE_FILE ps
        ;;
    "clean")
        echo "Cleaning up containers and volumes..."
        podman-compose -f $COMPOSE_FILE down -v
        podman system prune -f
        ;;
    "restart")
        echo "Restarting services..."
        podman-compose -f $COMPOSE_FILE restart
        ;;
    *)
        usage
        exit 1
        ;;
esac
