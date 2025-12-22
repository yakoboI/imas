# System Architecture

## Overview

This is a multitenant inventory management system built with Node.js/Express backend and React frontend. The system uses a **shared database architecture** where all tenants share the same database tables, with data isolation achieved through `tenant_id` columns.

## Architecture Layers

### 1. Client Layer
- **Web App** (React) - Main tenant application
- **SuperAdmin Portal** (React) - Platform administration
- **Mobile App** (React Native) - Optional mobile access

### 2. API Gateway Layer
- Express.js server with middleware stack:
  - Authentication & Authorization
  - Tenant Resolution
  - Rate Limiting
  - Audit Logging
  - Error Handling
  - Request Logging

### 3. Backend Services Layer
- **Auth Service** - Authentication and authorization
- **User Service** - User profile management
- **Receipt Service** - Receipt generation and management
- **Audit Service** - Audit trail logging and retrieval
- **SuperAdmin Service** - Tenant and platform management
- **Product Service** - Product catalog management
- **Inventory Service** - Stock management
- **Order Service** - Order processing

### 4. Data Layer
- **PostgreSQL** - Primary database (shared across all tenants)
- **Redis** - Caching layer (optional)
- **S3/Cloudinary** - File storage (receipts, avatars)

## Database Architecture

### Shared Database with Tenant Isolation

All tables include a `tenant_id` column (except `superadmins` and `system_logs`). Every query automatically filters by `tenant_id` through middleware.

**Key Tables:**
- `tenants` - Tenant information
- `users` - User accounts (with extended profile fields)
- `superadmins` - SuperAdmin accounts (no tenant_id)
- `products` - Product catalog
- `orders` - Sales orders
- `receipts` - Generated receipts
- `audit_logs` - Audit trail (tenant-scoped)
- `system_logs` - SuperAdmin actions (global)

### Data Isolation Rules

1. Every tenant query MUST include: `WHERE tenant_id = :currentTenantId`
2. Middleware automatically injects `tenant_id` from JWT token
3. Database indexes on `(tenant_id, ...)` for performance
4. SuperAdmin can bypass tenant filtering when needed

## Security Architecture

### Authentication Flow

1. User logs in → JWT token issued with `tenant_id`
2. All subsequent requests include token in header
3. Middleware validates token and extracts `tenant_id`
4. All queries automatically filtered by `tenant_id`

### Authorization

- **Role-Based Access Control (RBAC)** with multiple roles
- **Permission matrix** defines what each role can do
- **SuperAdmin** has platform-wide access
- **Tenant Admin** has full tenant access
- **Other roles** have limited permissions

### Audit Trail

- All actions automatically logged to `audit_logs`
- Immutable records (cannot be edited/deleted)
- Searchable and exportable
- Includes: user, action, entity, old/new values, IP, timestamp

## Receipt Generation

### Flow

1. Order completed → Receipt service triggered
2. Generate receipt number
3. Calculate totals
4. Fetch customer and company details
5. Select template (thermal/A4/invoice/email)
6. Generate HTML from template
7. Convert to PDF (if needed)
8. Save to database
9. Upload PDF to storage
10. Send email (optional)
11. Log audit trail

### Templates

- **Thermal** - 80mm thermal printer format
- **A4** - Standard A4 paper format
- **Invoice** - Formal invoice format
- **Email** - HTML email format

## Performance Optimizations

### Database

- Proper indexing on all foreign keys
- Composite indexes on `(tenant_id, ...)` patterns
- Connection pooling
- Query optimization (avoid N+1 queries)
- Pagination for large datasets

### Caching

- Redis for frequently accessed data
- Cache tenant settings (1 hour TTL)
- Cache product catalog (invalidate on update)
- CDN for static assets

### API

- Response compression (gzip)
- Efficient pagination
- Rate limiting
- Request/response logging

## Deployment Architecture

### Production Setup

- **Load Balancer** - Distribute traffic
- **Application Servers** - Multiple Node.js instances
- **Database** - PostgreSQL with read replicas
- **Cache** - Redis cluster
- **Storage** - S3 for files
- **CDN** - CloudFront for static assets

### Monitoring

- Application logging (Winston)
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring
- Alert system

## Backup & Recovery

### Backup Strategy

- Daily full backups (3:00 AM)
- Hourly incremental backups (business hours)
- Retention: 30 days daily, 12 months monthly
- Stored in S3 Glacier (encrypted)
- Multi-region replication

### Recovery

- Point-in-time recovery (PITR)
- Full system restore
- Partial restore (specific tenant)
- RTO: < 4 hours
- RPO: < 1 hour

## Scalability

### Horizontal Scaling

- Stateless application servers
- Database read replicas
- Redis cluster
- Load balancer distribution

### Vertical Scaling

- Database connection pooling
- Query optimization
- Caching strategies
- Background job processing

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **File Storage**: Cloudinary/S3
- **PDF Generation**: Puppeteer
- **Email**: Nodemailer

### Frontend (To be implemented)
- **Framework**: React
- **State Management**: Redux
- **Routing**: React Router
- **UI Library**: Material-UI / Ant Design
- **HTTP Client**: Axios

---

**Last Updated**: December 2024

