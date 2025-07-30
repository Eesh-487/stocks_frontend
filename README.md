# Stock Portfolio Analyzer

A full-stack application for tracking, analyzing, and optimizing stock portfolios with real-time market data.

## Features

- Real-time stock price updates
- Portfolio performance tracking
- Risk analysis tools
- Portfolio optimization algorithms
- Interactive charts and visualizations
- User authentication and portfolio management

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Real-time Updates**: WebSockets (Socket.IO)
- **Market Data**: Yahoo Finance API integration

## Deployment Options

### 1. Docker (Recommended, Most Secure)

We use a security-hardened approach with distroless containers:

```bash
# Build and run with Docker Compose
docker-compose up -d
```

#### Security Features:
- Distroless container with minimal attack surface
- Multi-stage builds to separate build and runtime environments
- Security scanning during build
- Resource limits to prevent DoS attacks
- No shell access in production container
- No new privileges security option

See [SECURITY.md](./SECURITY.md) for more details on our security practices.

### 2. Render.com Deployment

```bash
# Deploy to Render using Blueprint
render blueprint render.yaml
```

### 3. Manual Deployment

```bash
# Install dependencies
npm install

# Build frontend
npm run build-client

# Start production server
NODE_ENV=production npm start
```

## Environment Configuration

The application uses environment-specific configuration files:

- `.env.development` - Development environment settings
- `.env.production` - Production environment settings

Required environment variables:
- `NODE_ENV` - Environment (development or production)
- `CLIENT_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret for JWT authentication

## API Documentation

REST API endpoints:
- `/api/auth` - Authentication endpoints
- `/api/portfolio` - Portfolio management
- `/api/risk` - Risk analysis
- `/api/performance` - Performance tracking
- `/api/optimization` - Portfolio optimization
- `/api/analytics` - Analytics and metrics
- `/api/market-data` - Market data access

## Development

```bash
# Install dependencies
npm install

# Start development server (backend)
npm run dev-server

# Start frontend
npm run dev-client
```

## License

MIT
