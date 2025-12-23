# Troubleshooting Guide

Common issues and solutions for the Multitenant Inventory Management System.

## 🔧 Database Issues

### PostgreSQL Connection Errors

**Error:** `connection to server at "localhost" (::1), port 5432 failed: server does not support SSL, but SSL was required`

**Solution:**
```powershell
# Windows - Disable SSL for local connections
$env:PGSSLMODE = "disable"
psql -U postgres -h localhost

# Or add to .env file:
# DB_SSL=false
```

**Error:** `psql: command not found` or `psql is not recognized`

**Solution:**
```powershell
# Add PostgreSQL to PATH (replace 18 with your version)
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

# Or use full path:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

**For detailed Windows setup, see:** `WINDOWS_SETUP.md`

**Error:** `FATAL: password authentication failed`

**Solutions:**
1. Verify password in `.env` file matches PostgreSQL password
2. Check if PostgreSQL service is running
3. Reset PostgreSQL password if needed

### Database Migration Errors

**Error:** `relation "tenants" already exists`

**Solution:**
```sql
-- Drop and recreate (WARNING: This deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run migration again
```

**Error:** `permission denied for schema public`

**Solution:**
```sql
-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 🚀 Server Issues

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution (Windows):**
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Solution (Linux/Mac):**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill
```

**Alternative:** Change port in `.env` file:
```env
PORT=5001
```

### Server Won't Start

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd backend
rm -rf node_modules
npm install
```

**Error:** `Database connection failed`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify database credentials in `.env`
3. Ensure database exists: `psql -l | grep inventory_system`
4. Check firewall settings

## 📦 Installation Issues

### npm Install Fails

**Error:** `npm ERR! code ELIFECYCLE`

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. Try with `--legacy-peer-deps` flag

### Puppeteer Installation Errors

**Error:** `Failed to download Chromium`

**Solution:**
```bash
# Skip Puppeteer download during install
export PUPPETEER_SKIP_DOWNLOAD=true
npm install

# Chrome will download automatically on first PDF generation
```

**Windows:**
```powershell
$env:PUPPETEER_SKIP_DOWNLOAD='true'
npm install
```

## 🔐 Authentication Issues

### JWT Token Errors

**Error:** `jwt malformed` or `invalid token`

**Solutions:**
1. Check `JWT_SECRET` is set in `.env`
2. Ensure token is included in Authorization header: `Bearer <token>`
3. Verify token hasn't expired
4. Clear browser localStorage and login again

### Login Fails

**Error:** `Invalid credentials`

**Solutions:**
1. Verify default credentials:
   - Email: `admin@inventorysystem.com`
   - Password: `ChangeThisPassword123!`
2. Check if SuperAdmin was seeded: `node src/database/seeds/run.js`
3. Reset password if needed (see database section)

## 🗄️ Database Data Issues

### SuperAdmin Not Created

**Solution:**
```bash
cd backend
node src/database/seeds/run.js
```

### Can't Access Tenant Data

**Solutions:**
1. Verify tenant exists: `SELECT * FROM tenants;`
2. Check user has correct `tenant_id`
3. Ensure JWT token includes `tenant_id`
4. Verify middleware is working

### Missing Tables

**Solution:**
```bash
# Run migration
psql -U postgres -d inventory_system -f backend/src/database/migrations/001_create_tables.sql
```

## 🌐 Frontend Issues

### CORS Errors

**Error:** `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
1. Check backend CORS configuration
2. Verify `FRONTEND_URL` in `.env` matches frontend URL
3. Ensure backend allows frontend origin

### API Calls Fail

**Error:** `Network Error` or `Failed to fetch`

**Solutions:**
1. Verify backend is running on correct port
2. Check `BACKEND_URL` in frontend environment
3. Verify API endpoint exists
4. Check browser console for detailed errors

### Build Errors

**Error:** `Module not found` or build fails

**Solution:**
```bash
cd frontend/web-app  # or superadmin-portal
rm -rf node_modules dist
npm install
npm run build
```

## 📧 Email Issues

### Emails Not Sending

**Solutions:**
1. Verify email configuration in `.env`
2. For Gmail, use App Password (not regular password)
3. Check SMTP settings are correct
4. Test with a simple email first

### Email Service Errors

**Error:** `Invalid login` or `Authentication failed`

**Solutions:**
1. Use App Password for Gmail (not account password)
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
3. Check if 2FA is enabled (requires App Password)
4. Try different SMTP provider

## 🧾 Receipt Generation Issues

### PDF Generation Fails

**Error:** `Failed to launch browser` or Puppeteer errors

**Solutions:**
1. Ensure Puppeteer is installed: `npm install puppeteer`
2. Check if Chrome/Chromium is available
3. On Linux, may need: `apt-get install -y chromium-browser`
4. Check disk space (PDFs require temporary storage)

### Receipt Template Errors

**Error:** `Template not found` or rendering errors

**Solutions:**
1. Verify template files exist in `backend/src/utils/receiptTemplates.js`
2. Check template syntax is correct
3. Ensure all required data is provided
4. Check logs for specific error messages

## 🔍 Performance Issues

### Slow Queries

**Solutions:**
1. Check database indexes exist
2. Use pagination for large datasets
3. Enable Redis caching if available
4. Review query logs for slow queries
5. Optimize database queries

### High Memory Usage

**Solutions:**
1. Check for memory leaks in code
2. Limit concurrent requests
3. Use connection pooling
4. Monitor with tools like `node --inspect`

## 🛠️ Development Issues

### Hot Reload Not Working

**Solutions:**
1. Check `nodemon` is installed and configured
2. Verify `npm run dev` script is correct
3. Restart development server
4. Check file watcher limits (Linux)

### Environment Variables Not Loading

**Solutions:**
1. Verify `.env` file exists in `backend` directory
2. Check `.env` file syntax (no spaces around `=`)
3. Restart server after changing `.env`
4. Verify `dotenv` package is installed

## 📊 Logging Issues

### Logs Not Appearing

**Solutions:**
1. Check `logs` directory exists and is writable
2. Verify logging configuration in code
3. Check log level settings
4. Ensure Winston is properly configured

### Too Many Logs

**Solutions:**
1. Adjust log level in `.env`: `LOG_LEVEL=error`
2. Configure log rotation
3. Set up log retention policies

## 🔄 Backup/Restore Issues

### Backup Fails

**Solutions:**
1. Verify database credentials
2. Check disk space
3. Ensure `pg_dump` is in PATH
4. Check file permissions

### Restore Fails

**Solutions:**
1. Verify backup file integrity
2. Check database exists
3. Ensure sufficient disk space
4. Verify encryption key if backup is encrypted

## 🆘 Still Having Issues?

1. **Check logs** - Review `backend/logs/` directory
2. **Search issues** - Check GitHub issues for similar problems
3. **Review documentation** - See README.md and SETUP.md
4. **Create issue** - Provide detailed error information
5. **Check environment** - Verify all prerequisites are installed

## 📚 Additional Resources

- **Vite Build Errors:** See `ERROR_EXPLANATION.md` for detailed "vite: command not found" explanation
- **Windows Setup:** See `WINDOWS_SETUP.md` for comprehensive Windows installation guide
- **Database Setup:** See `DATABASE_INITIALIZATION.md` for detailed database initialization
- **Railway Deployment:** See `CHECK_PRODUCTION_CONNECTION.md` and `RAILWAY_POSTGRES_VARIABLES.md` for Railway-specific setup

## 📝 Useful Commands

### Database
```bash
# Connect to database
psql -U postgres -d inventory_system

# List tables
\dt

# Check tenants
SELECT * FROM tenants;

# Check users
SELECT email, role, tenant_id FROM users;
```

### Backend
```bash
# Check if server is running
curl http://localhost:5000/health

# View logs
tail -f backend/logs/combined.log
```

### Frontend
```bash
# Clear build cache
rm -rf dist node_modules/.vite

# Rebuild
npm run build
```

---

**Need more help?** Check the main README.md or create an issue on GitHub.

