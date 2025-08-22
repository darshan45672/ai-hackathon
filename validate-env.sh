#!/bin/bash

# =============================================================================
# AI HACKATHON - ENVIRONMENT VALIDATION SCRIPT
# =============================================================================
# This script validates your environment configuration
# Usage: ./validate-env.sh [environment-file]
# =============================================================================

set -e

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

# Validation functions
validate_required_var() {
    local var_name="$1"
    local var_value="$2"
    local description="$3"
    
    if [[ -z "$var_value" || "$var_value" == "your-"* || "$var_value" == "change-"* ]]; then
        print_error "$var_name is missing or using placeholder value"
        echo "   Required for: $description"
        return 1
    else
        print_success "$var_name is configured"
        return 0
    fi
}

validate_optional_var() {
    local var_name="$1"
    local var_value="$2"
    local description="$3"
    
    if [[ -z "$var_value" || "$var_value" == "your-"* ]]; then
        print_warning "$var_name is using placeholder value"
        echo "   Used for: $description"
        return 1
    else
        print_success "$var_name is configured"
        return 0
    fi
}

validate_url() {
    local var_name="$1"
    local url="$2"
    
    if [[ "$url" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$ ]]; then
        print_success "$var_name URL format is valid"
        return 0
    else
        print_error "$var_name URL format is invalid: $url"
        return 1
    fi
}

validate_database_url() {
    local url="$1"
    
    if [[ "$url" =~ ^postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+(\?.*)?$ ]]; then
        print_success "DATABASE_URL format is valid"
        return 0
    else
        print_error "DATABASE_URL format is invalid"
        echo "   Expected format: postgresql://user:password@host:port/database"
        return 1
    fi
}

test_connectivity() {
    local service="$1"
    local url="$2"
    
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        print_success "$service is reachable"
        return 0
    else
        print_warning "$service is not reachable (may not be running)"
        return 1
    fi
}

# Main validation function
main() {
    local env_file="${1:-.env.development}"
    
    print_header "AI Hackathon Environment Validation"
    
    if [[ ! -f "$env_file" ]]; then
        print_error "Environment file not found: $env_file"
        echo
        echo "Available environment files:"
        ls -la .env* 2>/dev/null || echo "No .env files found"
        exit 1
    fi
    
    print_info "Validating environment file: $env_file"
    
    # Source the environment file
    set -a  # Export all variables
    source "$env_file"
    set +a  # Stop exporting
    
    local errors=0
    local warnings=0
    
    # Validate required variables
    print_header "Required Configuration"
    
    validate_required_var "NODE_ENV" "$NODE_ENV" "Application environment mode" || ((errors++))
    validate_required_var "DATABASE_URL" "$DATABASE_URL" "Database connection" || ((errors++))
    validate_required_var "JWT_SECRET" "$JWT_SECRET" "JWT token signing" || ((errors++))
    validate_required_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "GitHub OAuth authentication" || ((errors++))
    validate_required_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "GitHub OAuth authentication" || ((errors++))
    validate_required_var "GEMINI_API_KEY" "$GEMINI_API_KEY" "AI-powered application reviews" || ((errors++))
    validate_required_var "FRONTEND_URL" "$FRONTEND_URL" "OAuth redirects and CORS" || ((errors++))
    
    # Validate optional variables
    print_header "Optional Configuration"
    
    validate_optional_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "Google OAuth authentication" || ((warnings++))
    validate_optional_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "Google OAuth authentication" || ((warnings++))
    validate_optional_var "SMTP_HOST" "$SMTP_HOST" "Email notifications" || ((warnings++))
    validate_optional_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "File uploads to S3" || ((warnings++))
    
    # Validate URL formats
    print_header "URL Format Validation"
    
    if [[ -n "$FRONTEND_URL" ]]; then
        validate_url "FRONTEND_URL" "$FRONTEND_URL" || ((errors++))
    fi
    
    if [[ -n "$BACKEND_URL" ]]; then
        validate_url "BACKEND_URL" "$BACKEND_URL" || ((errors++))
    fi
    
    if [[ -n "$DATABASE_URL" ]]; then
        validate_database_url "$DATABASE_URL" || ((errors++))
    fi
    
    # Validate security configuration
    print_header "Security Validation"
    
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        print_warning "JWT_SECRET should be at least 32 characters long"
        ((warnings++))
    else
        print_success "JWT_SECRET length is adequate"
    fi
    
    if [[ "$NODE_ENV" == "production" ]]; then
        if [[ "$JWT_SECRET" == *"development"* || "$JWT_SECRET" == *"not-for-production"* ]]; then
            print_error "Using development JWT secret in production"
            ((errors++))
        fi
        
        if [[ "$FRONTEND_URL" == *"localhost"* ]]; then
            print_warning "Using localhost URL in production environment"
            ((warnings++))
        fi
        
        if [[ "$GRAFANA_PASSWORD" == "admin" ]]; then
            print_warning "Using default Grafana password in production"
            ((warnings++))
        fi
    fi
    
    # Test connectivity (if services are running)
    print_header "Connectivity Tests"
    
    if [[ -n "$FRONTEND_URL" ]] && [[ "$FRONTEND_URL" != *"localhost"* || "$NODE_ENV" == "development" ]]; then
        test_connectivity "Frontend" "$FRONTEND_URL/health" || ((warnings++))
    fi
    
    # Test localhost services for development
    if [[ "$NODE_ENV" == "development" ]]; then
        test_connectivity "Main Application" "http://localhost/health" || ((warnings++))
        test_connectivity "Grafana" "http://localhost:3000/api/health" || ((warnings++))
    fi
    
    # Configuration recommendations
    print_header "Configuration Recommendations"
    
    if [[ "$NODE_ENV" == "development" ]]; then
        print_info "Development mode detected"
        
        if [[ "$DEBUG_MODE" != "true" ]]; then
            print_warning "Consider enabling DEBUG_MODE for development"
        fi
        
        if [[ "$HOT_RELOAD" != "true" ]]; then
            print_warning "Consider enabling HOT_RELOAD for development"
        fi
        
        if [[ "$ENABLE_API_DOCS" != "true" ]]; then
            print_warning "Consider enabling ENABLE_API_DOCS for development"
        fi
    fi
    
    if [[ "$NODE_ENV" == "production" ]]; then
        print_info "Production mode detected"
        
        if [[ "$DEBUG_MODE" == "true" ]]; then
            print_warning "Consider disabling DEBUG_MODE in production"
        fi
        
        if [[ "$ENABLE_API_DOCS" == "true" ]]; then
            print_warning "Consider disabling ENABLE_API_DOCS in production"
        fi
    fi
    
    # Summary
    print_header "Validation Summary"
    
    if [[ $errors -eq 0 ]]; then
        print_success "No critical errors found"
    else
        print_error "$errors critical error(s) found"
    fi
    
    if [[ $warnings -eq 0 ]]; then
        print_success "No warnings"
    else
        print_warning "$warnings warning(s) found"
    fi
    
    if [[ $errors -eq 0 ]]; then
        echo
        print_success "Environment configuration is valid!"
        
        if [[ $warnings -gt 0 ]]; then
            echo
            print_info "You can proceed with deployment, but consider addressing the warnings for optimal functionality."
        fi
        
        exit 0
    else
        echo
        print_error "Please fix the critical errors before proceeding."
        echo
        echo "For help with configuration:"
        echo "  - Check the README.md file"
        echo "  - Use .env.template as reference"
        echo "  - Visit the documentation links provided"
        
        exit 1
    fi
}

# Help function
show_help() {
    echo "AI Hackathon Environment Validation Script"
    echo
    echo "Usage: $0 [ENVIRONMENT_FILE]"
    echo
    echo "ENVIRONMENT_FILE:"
    echo "  Path to environment file (default: .env.development)"
    echo
    echo "Examples:"
    echo "  $0                        # Validate .env.development"
    echo "  $0 .env.production        # Validate .env.production"
    echo "  $0 .env                   # Validate .env"
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
