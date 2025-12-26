# Production URLs Checklist

## ✅ CORRECT Production URLs

### Frontend Applications
- **Web App (Main Application)**: `https://app.inventora.store`
- **SuperAdmin Portal**: `https://admin.inventora.store`

### Backend API
- **Backend API (Railway)**: `https://api.inventora.store`
- **API Base URL**: `https://api.inventora.store/api`
- **Health Check**: `https://api.inventora.store/health`

### Backend Environment Variables (Railway)
These MUST be set in your Railway backend environment variables:

1. **FRONTEND_URL**: `https://app.inventora.store`
   - Used for: Password reset emails, CORS, redirects
   - Location: Backend `.env` or Railway environment variables

2. **SUPERADMIN_URL**: `https://admin.inventora.store`
   - Used for: SuperAdmin portal access, CORS
   - Location: Backend `.env` or Railway environment variables

3. **VITE_API_URL** (Frontend environment variable):
   - Web App: Set in Vercel environment variables
   - SuperAdmin Portal: Set in Vercel environment variables
   - Value: `https://api.inventora.store/api` (Production Railway backend URL)

## ❌ INCORRECT / What Was Fixed

### 1. Registration Form Helper Text
**BEFORE (WRONG):**
```
"This will be your unique subdomain (e.g., yourcompany.inventorysystem.com)"
```

**AFTER (CORRECT):**
```
"Enter your unique subdomain identifier (e.g., yourcompany). This will be used to identify your organization."
```

**Why:** The subdomain is just an identifier (like "yourcompany"), not a full domain. All tenants access the same app at `app.inventora.store`.

### 2. Default Email Domains
**BEFORE (WRONG):**
- `admin@inventorysystem.com` (in config files)

**AFTER (CORRECT):**
- `admin@inventora.store` (updated in config files)

### 3. Deployment URLs Documentation
**BEFORE (WRONG):**
- Listed placeholder Vercel URLs

**AFTER (CORRECT):**
- Updated to actual production URLs: `app.inventora.store` and `admin.inventora.store`

## 🔧 What Needs to Be Configured in Production

### Railway Backend Environment Variables
Make sure these are set in your Railway backend:

```bash
FRONTEND_URL=https://app.inventora.store
SUPERADMIN_URL=https://admin.inventora.store
NODE_ENV=production
```

### Vercel Frontend Environment Variables

**For Web App (`app.inventora.store`):**
```bash
VITE_API_URL=https://api.inventora.store/api
```

**For SuperAdmin Portal (`admin.inventora.store`):**
```bash
VITE_API_URL=https://api.inventora.store/api
```

## 📧 Email Service URLs

The password reset email uses `FRONTEND_URL` from backend environment:
- Reset link format: `${FRONTEND_URL}/reset-password?token=...`
- Should resolve to: `https://app.inventora.store/reset-password?token=...`

## ✅ Verification Checklist

- [ ] `FRONTEND_URL` is set to `https://app.inventora.store` in Railway
- [ ] `SUPERADMIN_URL` is set to `https://admin.inventora.store` in Railway
- [ ] `VITE_API_URL` is set correctly in both Vercel projects
- [ ] Password reset emails contain correct URLs
- [ ] CORS is configured to allow `app.inventora.store` and `admin.inventora.store`
- [ ] All hardcoded URLs have been updated
- [ ] Registration form helper text is correct

## 🚨 Important Notes

1. **Subdomain Field**: Users enter just the identifier (e.g., "yourcompany"), NOT the full domain
2. **Email Links**: All email links use `FRONTEND_URL` environment variable
3. **CORS**: Backend must allow requests from both production domains
4. **HTTPS**: All production URLs use HTTPS (required for security)

