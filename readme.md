# Neighbourly - Service Marketplace Platform

A full-stack service marketplace application connecting service providers with seekers. Built with modern technologies for scalability, real-time communication, and optimal user experience.

## Project Overview

Neighbourly is a comprehensive service marketplace platform that enables:
- **Service Providers** to list and manage their services
- **Service Seekers** to discover, book, and review services
- **Real-time Chat** communication between users
- **Booking Management** with status tracking and reviews
- **Location-based Service Discovery** with geospatial queries
- **Secure Authentication** with OTP verification and JWT tokens

## Architecture

The project follows a **monorepo structure** with separate client and server applications:

```
Pro Battle/
├── client/          # Next.js frontend application
└── server/          # NestJS backend API
```

## Tech Stack

### Backend (NestJS)

#### Core Framework
- **[NestJS](https://nestjs.com/)** (v11.0.1) - Progressive Node.js framework for building efficient server-side applications
- **[TypeScript](https://www.typescriptlang.org/)** (v5.7.3) - Type-safe JavaScript
- **[Express](https://expressjs.com/)** - HTTP server framework (via @nestjs/platform-express)

#### Database & ORM
- **[PostgreSQL](https://www.postgresql.org/)** (v16-alpine) - Relational database
- **[Prisma](https://www.prisma.io/)** (v7.3.0) - Next-generation ORM with type-safe database access
  - Prisma Client for database queries
  - Prisma Migrate for database migrations
  - PostgreSQL adapter

#### Caching & Queue Management
- **[Redis](https://redis.io/)** (v7-alpine) - In-memory data structure store
  - Used for caching frequently accessed data
  - Session management
  - Rate limiting storage
- **[ioredis](https://github.com/luin/ioredis)** (v5.9.2) - Redis client for Node.js
- **[BullMQ](https://docs.bullmq.io/)** (v5.67.1) - Robust job queue system
  - **[@nestjs/bullmq](https://docs.nestjs.com/techniques/queues)** (v11.0.4) - NestJS integration for BullMQ
  - Background job processing (email sending, async tasks)
  - Job retry mechanisms and failure handling

#### Real-time Communication
- **[Socket.IO](https://socket.io/)** (v4.8.3) - Real-time bidirectional event-based communication
  - **[@nestjs/websockets](https://docs.nestjs.com/websockets/gateways)** (v11.1.12) - WebSocket support
  - **[@nestjs/platform-socket.io](https://docs.nestjs.com/websockets/gateways)** (v11.1.12) - Socket.IO adapter
  - Real-time chat messaging
  - Live notifications

#### Authentication & Security
- **[@nestjs/jwt](https://docs.nestjs.com/security/authentication)** (v11.0.2) - JSON Web Token implementation
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** (v3.0.3) - Password hashing
- **[cookie-parser](https://www.npmjs.com/package/cookie-parser)** (v1.4.7) - Cookie parsing middleware
- OTP (One-Time Password) verification system
- Rate limiting for API endpoints

#### File Storage & CDN
- **[AWS S3](https://aws.amazon.com/s3/)** - Object storage service
  - **[@aws-sdk/client-s3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)** (v3.975.0) - S3 client
- **[AWS CloudFront](https://aws.amazon.com/cloudfront/)** - Content delivery network
  - **[@aws-sdk/client-cloudfront](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudfront/)** (v3.975.0) - CloudFront client
  - Automatic cache invalidation on file updates

#### Email Service
- **[Nodemailer](https://nodemailer.com/)** (v7.0.12) - Email sending library
  - Gmail SMTP integration
  - HTML email templates
  - OTP email delivery via background jobs

#### API Documentation
- **[Swagger/OpenAPI](https://swagger.io/)** - API documentation
  - **[@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)** (v11.2.5) - NestJS Swagger integration
  - Interactive API explorer at `/docs` endpoint
  - JWT authentication in Swagger UI

#### Task Scheduling
- **[@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling)** (v6.1.0) - Task scheduling module
  - Cron jobs for periodic tasks (e.g., cleanup expired OTPs)
  - Interval-based tasks

#### Validation & Transformation
- **[class-validator](https://github.com/typestack/class-validator)** (v0.14.3) - Decorator-based validation
- **[class-transformer](https://github.com/typestack/class-transformer)** (v0.5.1) - Object transformation

#### Configuration
- **[@nestjs/config](https://docs.nestjs.com/techniques/configuration)** (v4.0.2) - Configuration management
  - Environment variable management
  - Global configuration module

#### Logging
- **Custom Logging Service** - File-based logging system
  - Daily log files (rotated by date)
  - JSON-formatted log entries
  - Structured logging with context
  - Logs stored in `tmp/logs/` directory
  - Built on NestJS Logger

#### Development Tools
- **[ESLint](https://eslint.org/)** (v9.18.0) - Code linting
- **[Prettier](https://prettier.io/)** (v3.4.2) - Code formatting
- **[Jest](https://jestjs.io/)** (v30.0.0) - Testing framework
- **[ts-jest](https://kulshekhar.github.io/ts-jest/)** (v29.2.5) - TypeScript preprocessor for Jest

### Frontend (Next.js)

#### Core Framework
- **[Next.js](https://nextjs.org/)** (v16.1.4) - React framework with App Router
- **[React](https://react.dev/)** (v19.2.3) - UI library
- **[TypeScript](https://www.typescriptlang.org/)** (v5) - Type-safe JavaScript

#### Styling
- **[Tailwind CSS](https://tailwindcss.com/)** (v4) - Utility-first CSS framework
- **[@tailwindcss/postcss](https://tailwindcss.com/docs/installation)** (v4) - PostCSS integration
- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** (v1.4.0) - Animation utilities

#### UI Components
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI component library
  - `@radix-ui/react-avatar` (v1.1.11) - Avatar component
  - `@radix-ui/react-checkbox` (v1.3.3) - Checkbox component
  - `@radix-ui/react-dialog` (v1.1.15) - Dialog/Modal component
  - `@radix-ui/react-dropdown-menu` (v2.1.16) - Dropdown menu
  - `@radix-ui/react-label` (v2.1.8) - Label component
  - `@radix-ui/react-select` (v2.2.6) - Select component
  - `@radix-ui/react-separator` (v1.1.8) - Separator component
  - `@radix-ui/react-slider` (v1.3.6) - Slider component
  - `@radix-ui/react-slot` (v1.2.4) - Slot component
  - `@radix-ui/react-tooltip` (v1.2.8) - Tooltip component
- **[Lucide React](https://lucide.dev/)** (v0.563.0) - Icon library
- **[Sonner](https://sonner.emilkowal.ski/)** (v2.0.7) - Toast notifications

#### State Management
- **[Zustand](https://zustand-demo.pmnd.rs/)** (v5.0.10) - Lightweight state management
  - Auth store for user authentication state
  - OTP store for verification state

#### Data Fetching
- **[TanStack Query (React Query)](https://tanstack.com/query)** (v5.90.20) - Server state management
  - **[@tanstack/react-query-devtools](https://tanstack.com/query/latest/docs/react/devtools)** (v5.91.2) - Development tools
  - Caching, synchronization, and background updates
  - Optimistic updates

#### Forms & Validation
- **[React Hook Form](https://react-hook-form.com/)** (v7.71.1) - Performant form library
- **[Zod](https://zod.dev/)** (v4.3.6) - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** (v5.2.2) - Validation resolvers

#### HTTP Client
- **[Axios](https://axios-http.com/)** (v1.13.2) - Promise-based HTTP client
  - Request/response interceptors
  - Automatic token injection

#### Real-time Communication
- **[socket.io-client](https://socket.io/docs/v4/client-api/)** (v4.8.3) - WebSocket client
  - Real-time chat functionality
  - Connection management

#### Utilities
- **[clsx](https://github.com/lukeed/clsx)** (v2.1.1) - Conditional className utility
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** (v3.4.0) - Merge Tailwind classes
- **[class-variance-authority](https://cva.style/)** (v0.7.1) - Component variant management
- **[date-fns](https://date-fns.org/)** (v4.1.0) - Date utility library

#### Development Tools
- **[ESLint](https://eslint.org/)** (v9) - Code linting
- **[Prettier](https://prettier.io/)** (v3.8.1) - Code formatting

### Infrastructure & DevOps

#### Containerization
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[Docker Compose](https://docs.docker.com/compose/)** - Multi-container orchestration
  - PostgreSQL container
  - Redis container
  - API container
  - Adminer (database management)
  - Redis Insight (Redis management)

#### Web Server
- **[Nginx](https://www.nginx.com/)** - Reverse proxy and load balancer
  - SSL/TLS termination
  - Domain routing
  - Static file serving

#### Database Management
- **[Adminer](https://www.adminer.org/)** - Database management tool
  - Web-based PostgreSQL administration
  - Accessible at `/adminer` endpoint

#### Redis Management
- **[Redis Insight](https://redis.io/insight/)** - Redis GUI and management tool
  - Redis data visualization
  - Query execution
  - Accessible at `/redis-insight` endpoint

## 📁 Project Structure

### Server Structure
```
server/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── processors/    # BullMQ job processors (email)
│   │   └── ...
│   ├── booking/           # Booking management
│   ├── chat/              # Real-time chat (WebSocket gateway)
│   ├── common/            # Shared utilities
│   │   ├── decorators/    # Custom decorators
│   │   ├── filters/       # Exception filters
│   │   ├── guards/        # Auth guards
│   │   ├── modules/       # Shared modules (BullMQ)
│   │   ├── services/      # Shared services (Prisma, Redis, Logger)
│   │   └── utils/         # Utility functions
│   ├── mailer/            # Email service
│   ├── service/           # Service management
│   ├── service-category/  # Service categories
│   ├── storage/            # File upload (S3/CloudFront)
│   └── user/              # User management
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── docker-compose.yaml     # Docker services configuration
├── Dockerfile             # API container definition
└── nginx.config           # Nginx configuration
```

### Client Structure
```
client/
├── app/
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-otp/
│   │   └── ...
│   └── (root)/            # Protected routes
│       ├── bookings/
│       ├── chats/
│       ├── profile/
│       └── ...
├── components/
│   ├── shared/            # Shared components
│   └── ui/                # UI component library
├── API/                   # API client functions
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and constants
├── providers/             # React context providers
├── schema/                # Zod validation schemas
└── store/                 # Zustand stores
```

## 🚀 Key Features

### Authentication & Authorization
- JWT-based authentication
- OTP email verification
- Password reset flow
- Role-based access control (Provider/Seeker)
- Google OAuth support (schema ready)
- Rate limiting for security

### Service Management
- Service listing with categories
- Hierarchical category structure
- Location-based service discovery
- Image uploads with S3/CloudFront
- Service availability management
- Price and duration configuration

### Booking System
- Service booking with date/time selection
- Booking status tracking (Pending, Confirmed, Completed, Cancelled, Rejected)
- Rating and review system
- Booking history for both providers and seekers

### Real-time Chat
- WebSocket-based messaging
- Room-based chat architecture
- Real-time message delivery
- Chat history persistence

### Background Jobs
- Email queue processing with BullMQ
- Async OTP email delivery
- Scheduled tasks (cron jobs)
- Job retry mechanisms

### Logging & Monitoring
- Custom file-based logging service
- Daily log rotation
- Structured JSON logging
- Error tracking and context

## 🔧 Environment Variables

### Server (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neighbourly
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=neighbourly

# Server
PORT=8000
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600

# Email
EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AWS S3 & CloudFront
BUCKET_NAME=your-bucket-name
BUCKET_REGION=us-east-1
AWS_BUCKET_ACCESS_KEY_ID=your-access-key
AWS_BUCKET_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
CLOUDFRONT_URL=https://your-cloudfront-url.cloudfront.net

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- pnpm (package manager)
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Backend Setup
```bash
cd server
pnpm install
cp .env.example .env  # Configure environment variables
pnpm prisma migrate dev
pnpm prisma generate
pnpm start:dev
```

### Frontend Setup
```bash
cd client
pnpm install
cp .env.example .env  # Configure environment variables
pnpm dev
```

### Docker Setup
```bash
cd server
docker compose up -d
```

## 📚 API Documentation

Once the server is running, access the Swagger API documentation at:
```
http://localhost:8000/api/docs
```
