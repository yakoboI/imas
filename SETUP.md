# Setup Guide

## Prerequisites

Before starting, ensure you have:

- **Node.js** 16+ and npm installed
- **PostgreSQL** 12+ installed and running
- **Redis** (optional, for caching)
- **Cloudinary account** (for image uploads) or AWS S3

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb inventory_system

# Or using psql:
psql -U postgres
CREATE DATABASE inventory_system;
\q
```

### 3. Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
=localhost
DB_PORT=5432
DB_NAME=inventory_system
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SuperAdmin
SUPERADMIN_EMAIL=admin@inventorysystem.com
SUPERADMIN_PASSWORD=ChangeThisPassword123!
```

### 4. Run Database Migrations

```bash
cd backend
psql -d inventory_system -f src/database/migrations/001_create_tables.sql
```

Or using psql directly:

```bash
psql -U postgres -d inventory_system -f backend/src/database/migrations/001_create_tables.sql
```

### 5. Seed Initial Data

```bash
cd backend
node src/database/seeds/run.js
```

This will create the initial SuperAdmin account.

### 6. Start the Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000`

### 7. Verify Setup

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "..."
# }
```

## Testing the API

### SuperAdmin Login

```bash
curl -X POST http://localhost:5000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@inventorysystem.com",
    "password": "ChangeThisPassword123!"
  }'
```

### Create a Tenant

```bash
curl -X POST http://localhost:5000/api/superadmin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -d '{
    "name": "Test Company",
    "subdomain": "testcompany",
    "planType": "free"
  }'
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep inventory_system`

### Port Already in Use

- Change `PORT` in `.env` file
- Or kill the process using port 5000:
  ```bash
  # Linux/Mac
  lsof -ti:5000 | xargs kill
  
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Module Not Found Errors

- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

### JWT Secret Issues

- Ensure `JWT_SECRET` is set in `.env`
- Use a strong, random secret in production

## Next Steps

1. **Change SuperAdmin Password** - Log in and change the default password
2. **Create First Tenant** - Use SuperAdmin portal to create a tenant
3. **Create Users** - Add users to the tenant
4. **Configure Settings** - Set up company profile, tax settings, etc.
5. **Start Using** - Begin managing inventory!

## Development Tips

- Use `npm run dev` for development with auto-reload
- Check logs in `backend/logs/` directory
- Use Postman or similar tool for API testing
- Enable debug logging by setting `NODE_ENV=development`

## Production Deployment

See `docs/DEPLOYMENT.md` for production deployment instructions.

---

**Need Help?** Check the [README.md](README.md) or create an issue.

