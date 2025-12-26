# SuperAdmin Credentials

## Production Credentials

**Email:** `admin@inventora.store`  
**Password:** `KILEOchusi123!@`

## Important Security Notes

⚠️ **For Production Deployment:**

1. **DO NOT** rely on default credentials in code
2. **MUST** set environment variables in Railway:
   ```bash
   SUPERADMIN_EMAIL=admin@inventora.store
   SUPERADMIN_PASSWORD=KILEOchusi123!@
   ```

3. The default values in `backend/src/config/environment.js` are fallbacks for development only
4. In production, always use environment variables for security

## Creating/Updating SuperAdmin

The superadmin is created automatically when you run the seed script:

```bash
cd backend
npm run seed
```

Or manually via the seed file:
```bash
node src/database/seeds/run.js
```

## Changing Password

To change the superadmin password:

1. **Via Update Script (Recommended):**
   ```bash
   cd backend
   # Set environment variables first
   export SUPERADMIN_EMAIL=admin@inventora.store
   export SUPERADMIN_PASSWORD=KILEOchusi123!@
   # Or set in .env file
   
   # Run update script
   npm run update-superadmin
   ```

2. **Via Environment Variable in Production (Railway):**
   - Update `SUPERADMIN_PASSWORD` in Railway environment variables
   - Run the update script: `npm run update-superadmin`
   - Or delete existing superadmin and re-run seed: `npm run seed`

3. **Via Database (Manual):**
   - Login to superadmin portal
   - Use password change feature (if available)
   - Or manually update in database (password must be hashed with bcrypt)

## Security Best Practices

- ✅ Use strong, unique passwords
- ✅ Store credentials in environment variables, not code
- ✅ Change default password immediately after first deployment
- ✅ Use different passwords for development and production
- ✅ Enable 2FA if available
- ✅ Regularly rotate passwords

