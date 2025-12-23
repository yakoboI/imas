# Production Deployment Guide

Complete guide for deploying the Multitenant Inventory Management System to production.

## 📋 Pre-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure secure database credentials
- [ ] Set up environment variables securely
- [ ] Enable security headers (Helmet.js)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Review and update dependencies

### Database
- [ ] Set up production PostgreSQL database
- [ ] Run database migrations
- [ ] Seed initial data (SuperAdmin)
- [ ] Configure database backups
- [ ] Set up database monitoring
- [ ] Enable SSL for database connections

### Application
- [ ] Set `NODE_ENV=production`
- [ ] Configure production URLs
- [ ] Set up logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up monitoring (health checks)
- [ ] Configure file storage (S3/Cloudinary)

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Best for:** Quick deployment, managed services

See `VERCEL_DEPLOYMENT.md` for detailed Vercel deployment instructions.

**Backend on Railway:**
1. Connect GitHub repository
2. Set root directory: `backend`
3. Configure environment variables
4. Deploy

**Frontend on Vercel:**
1. Deploy web app from `frontend/web-app`
2. Deploy SuperAdmin portal from `frontend/superadmin-portal`
3. Configure environment variables
4. Set build commands

### Option 2: Docker Deployment

**Best for:** Full control, containerized deployment

#### Dockerfile Example (Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

#### Docker Compose Example

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=inventory_system
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=inventory_system
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Option 3: Traditional VPS (DigitalOcean, AWS EC2, etc.)

**Best for:** Full control, custom configuration

#### Server Setup

1. **Provision Server**
   - Ubuntu 20.04+ or similar
   - Minimum 2GB RAM, 2 CPU cores
   - 20GB+ storage

2. **Install Dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # PostgreSQL
   sudo apt-get install postgresql postgresql-contrib

   # Nginx (reverse proxy)
   sudo apt-get install nginx

   # PM2 (process manager)
   sudo npm install -g pm2
   ```

3. **Set Up Database**
   ```bash
   sudo -u postgres createdb inventory_system
   sudo -u postgres psql -d inventory_system -f backend/src/database/migrations/001_create_tables.sql
   ```

4. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd imas

   # Install dependencies
   cd backend
   npm install --production

   # Configure environment
   cp .env.example .env
   # Edit .env with production values

   # Start with PM2
   pm2 start src/server.js --name inventory-backend
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔧 Environment Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=inventory_system
DB_USER=your-db-user
DB_PASSWORD=your-strong-password
DB_SSL=true

# JWT
JWT_SECRET=your-very-strong-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# URLs
FRONTEND_URL=https://your-frontend-domain.com
SUPERADMIN_URL=https://your-superadmin-domain.com
BACKEND_URL=https://your-backend-domain.com

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Or AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Redis (optional)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# SuperAdmin
SUPERADMIN_EMAIL=admin@yourdomain.com
SUPERADMIN_PASSWORD=ChangeThisStrongPassword123!
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend-domain.com
VITE_SUPERADMIN_API_URL=https://your-backend-domain.com
```

## 📊 Database Setup

### Production Database

1. **Create Database**
   ```sql
   CREATE DATABASE inventory_system;
   ```

2. **Run Migrations**
   ```bash
   psql -h your-db-host -U your-user -d inventory_system -f backend/src/database/migrations/001_create_tables.sql
   ```

3. **Seed Initial Data**
   ```bash
   cd backend
   node src/database/seeds/run.js
   ```

4. **Set Up Backups**
   - Configure automated backups (see `deployment/scripts/README.md`)
   - Set up backup retention policy
   - Test restore procedures

## 🔒 Security Configuration

### SSL/TLS

- **Use HTTPS** - Always use HTTPS in production
- **SSL Certificate** - Use Let's Encrypt or commercial certificate
- **TLS Version** - Use TLS 1.2 or higher
- **Certificate Renewal** - Set up automatic renewal

### Security Headers

Ensure Helmet.js is configured:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### CORS Configuration

```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://your-superadmin-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 📈 Monitoring & Logging

### Application Monitoring

- **Health Checks** - Set up health check endpoint monitoring
- **Uptime Monitoring** - Use services like UptimeRobot, Pingdom
- **Error Tracking** - Integrate Sentry or similar
- **Performance Monitoring** - Use APM tools (New Relic, Datadog)

### Logging

- **Log Aggregation** - Use services like Loggly, Papertrail
- **Log Rotation** - Configure log rotation
- **Log Retention** - Set appropriate retention policies
- **Error Alerts** - Set up error alerting

### Database Monitoring

- **Connection Pooling** - Monitor connection pool usage
- **Query Performance** - Monitor slow queries
- **Database Size** - Monitor database growth
- **Backup Status** - Monitor backup success/failure

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to production
        run: |
          # Your deployment commands
```

## 📦 Build & Deploy Process

### Backend

```bash
# Build
cd backend
npm install --production
npm run build  # If you have a build step

# Deploy
pm2 restart inventory-backend
# Or your deployment method
```

### Frontend

```bash
# Web App
cd frontend/web-app
npm install
npm run build
# Deploy dist/ directory

# SuperAdmin Portal
cd frontend/superadmin-portal
npm install
npm run build
# Deploy dist/ directory
```

## 🧪 Post-Deployment Verification

### Health Checks

1. **Backend Health**
   ```bash
   curl https://your-backend-domain.com/health
   ```

2. **Database Connection**
   - Check logs for database connection status
   - Verify migrations ran successfully

3. **API Endpoints**
   - Test authentication endpoints
   - Verify API responses

4. **Frontend**
   - Verify frontend loads correctly
   - Test login functionality
   - Check API connectivity

### Smoke Tests

- [ ] SuperAdmin login works
- [ ] Tenant creation works
- [ ] User registration works
- [ ] Product creation works
- [ ] Order creation works
- [ ] Receipt generation works
- [ ] File uploads work
- [ ] Email sending works (if configured)

## 🔄 Updates & Maintenance

### Updating Application

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Migrations** (if any)
   ```bash
   psql -d inventory_system -f backend/src/database/migrations/new_migration.sql
   ```

4. **Restart Application**
   ```bash
   pm2 restart inventory-backend
   ```

### Database Migrations

- Always backup before migrations
- Test migrations on staging first
- Run migrations during maintenance window
- Verify migration success

### Dependency Updates

- Regularly update dependencies
- Check for security vulnerabilities: `npm audit`
- Test updates in staging first
- Update one at a time if possible

## 🆘 Rollback Procedures

### Application Rollback

```bash
# Git rollback
git checkout <previous-commit>
npm install
pm2 restart inventory-backend
```

### Database Rollback

- Restore from backup if needed
- Use database migration rollback if available
- Test rollback procedures regularly

## 📚 Additional Resources

- **Vercel Deployment:** See `VERCEL_DEPLOYMENT.md`
- **Railway Setup:** See `CHECK_PRODUCTION_CONNECTION.md` and `RAILWAY_POSTGRES_VARIABLES.md`
- **Database Initialization:** See `DATABASE_INITIALIZATION.md`
- **Backup Scripts:** See `deployment/scripts/README.md`
- **Security:** See `SECURITY.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`

## 🆘 Support

For deployment issues:
1. Check `TROUBLESHOOTING.md`
2. Review logs
3. Check monitoring dashboards
4. Contact support if needed

---

**Remember:** Always test in staging before deploying to production!

