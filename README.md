# Hack-AI-thon Application

A scalable web application built with NestJS backend, AI microservice, and Next.js frontend, deployed using Docker with load balancing and monitoring. Features automated AI-powered application reviews.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hackathon
   ```

2. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your actual values
   nano .env
   ```

3. **Build and Run with Docker**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # View logs
   docker-compose logs -f
   
   # Stop all services
   docker-compose down
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:80
   - **Backend API**: http://localhost:80/api
   - **AI Service**: http://localhost:3002 (HTTP) / 3003 (microservice)
   - **Grafana Dashboard**: http://localhost:3000 (admin/admin)
   - **Prometheus Metrics**: http://localhost:9090
   - **Redis**: localhost:6379
   - **PostgreSQL**: localhost:5432

## 🚀 New: AI-Powered Application Reviews

### Automated Review Pipeline

When users submit applications, they now go through an automated AI review process:

1. **External Idea Review**: Checks if similar ideas exist on Product Hunt, Y Combinator, etc.
2. **Internal Idea Review**: Compares with other submissions to avoid duplicates
3. **Categorization**: Automatically assigns applications to relevant categories
4. **Implementation Feasibility**: Evaluates technical complexity and feasibility
5. **Cost Analysis**: Reviews if requested budget is sufficient for implementation
6. **Customer Impact**: Assesses market potential and business viability

### Review States

Applications now progress through these states:
- `DRAFT` → `SUBMITTED` → `EXTERNAL_IDEA_REVIEW` → `INTERNAL_IDEA_REVIEW` → `CATEGORIZATION` → `IMPLEMENTATION_REVIEW` → `COST_REVIEW` → `IMPACT_REVIEW` → `UNDER_REVIEW` or `REJECTED`

### AI Service Features

- **Microservice Architecture**: Independent AI service for scalability
- **Real-time Processing**: Background processing with status tracking
- **Detailed Analytics**: Comprehensive review reports with scoring
- **Retry Mechanism**: Ability to retry failed review steps
- **Admin Controls**: Admin interface for review management

## 🏗️ Architecture

### Services Overview

- **NGINX**: Load balancer and reverse proxy
- **App1, App2, App3**: Three NestJS backend instances for high availability
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

### Load Balancing
Traffic is distributed across three backend instances using NGINX's `least_conn` algorithm.

## 🛠️ Development

### Local Development (without Docker)

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Set up database
   npx prisma migrate dev
   npx prisma generate
   npm run db:seed
   
   # Start development server
   npm run start:dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Database Management

```bash
# Run migrations
docker-compose exec app1 npx prisma migrate deploy

# Seed database
docker-compose exec app1 npm run db:seed

# Access database
docker-compose exec postgres psql -U postgres -d ai_hackathon
```

### Scaling Services

```bash
# Scale backend instances
docker-compose up --scale app1=2 --scale app2=2 --scale app3=2

# Scale specific service
docker-compose up --scale app1=5
```

## 📊 Monitoring

### Health Checks
Each backend instance includes health checks accessible at `/api/health`.

### Metrics
- Prometheus collects metrics from all services
- Grafana provides visual dashboards
- Custom metrics available for application monitoring

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app1
docker-compose logs -f nginx
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@postgres:5432/ai_hackathon` |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `NODE_ENV` | Application environment | `production` |

### OAuth Configuration
Set up GitHub and Google OAuth by registering applications and updating the environment variables:
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check which ports are in use
   lsof -i :80 -i :3000 -i :5432 -i :6379
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify database is running
   docker-compose exec postgres pg_isready
   ```

3. **Build Issues**
   ```bash
   # Clean build
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

4. **Permission Issues**
   ```bash
   # Fix entrypoint script permissions
   chmod +x backend/docker-entrypoint.sh
   ```

### Health Checks
```bash
# Check service health
curl http://localhost/api/health

# Check individual services
docker-compose ps
```

## 📝 API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost/api/docs
- API endpoints: http://localhost/api/*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.
