# 🔍 Check Production Database Connection

This guide helps you verify if your **production backend on Railway** is connected to your Railway Postgres database.

---

## ✅ Quick Check Method

### Step 1: Test the Health Endpoint

If you have a backend deployed on Railway, visit your health check endpoint:

```
https://YOUR-BACKEND.up.railway.app/health
```

**Replace `YOUR-BACKEND` with your actual Railway backend service name.**

### Step 2: Check the Response

**✅ Connected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

**❌ Not Connected Response:**
```json
{
  "status": "ok",
  "database": "disconnected",
  "timestamp": "2024-..."
}
```

Or you might see an error page.

---

## 🔧 If Database Shows "disconnected"

This means your **Railway backend service** doesn't have the database environment variables configured. Here's how to fix it:

### Step 1: Get Database Connection Details

Go to **Railway Dashboard** → **Your Postgres Service** → **Variables** tab

You should see:
- `PGHOST` = (e.g., `yamabiko.proxy.rlwy.net` or `postgres.railway.internal`)
- `PGPORT` = `5432`
- `PGDATABASE` = `railway`
- `PGUSER` = `postgres`
- `PGPASSWORD` = (long random string)

### Step 2: Add Variables to Backend Service

1. Go to **Railway Dashboard** → **Your Backend Service** (not the Postgres service)
2. Click on **Variables** tab
3. Click **New Variable** button
4. Add these variables **one by one**:

#### Variable 1: DB_HOST
- **Key**: `DB_HOST`
- **Value**: Copy the value from `PGHOST` in your Postgres service
  - In your case: `yamabiko.proxy.rlwy.net`
  - Or if using private network: `postgres.railway.internal`

#### Variable 2: DB_PORT
- **Key**: `DB_PORT`
- **Value**: `42342` (from your connection URL) or `5432` (if using internal network)

#### Variable 3: DB_NAME
- **Key**: `DB_NAME`
- **Value**: `railway`

#### Variable 4: DB_USER
- **Key**: `DB_USER`
- **Value**: `postgres`

#### Variable 5: DB_PASSWORD
- **Key**: `DB_PASSWORD`
- **Value**: `dstsWeaAwnAayKOLodUCoqRbatzGfAkR` (your password from the connection URL)

#### Variable 6: DB_SSL
- **Key**: `DB_SSL`
- **Value**: `true` (must be lowercase `true`, not `True` or `TRUE`)

### Step 3: Wait for Redeployment

Railway will automatically redeploy your backend service after adding variables. Wait 1-2 minutes.

### Step 4: Test Again

Visit the health endpoint again:
```
https://YOUR-BACKEND.up.railway.app/health
```

It should now show `"database": "connected"`

---

## 📋 Complete Checklist

Before considering production ready, verify:

- [ ] ✅ Railway Postgres service is running (not paused)
- [ ] ✅ Backend service is deployed on Railway
- [ ] ✅ `DB_HOST` variable set in backend service Variables
- [ ] ✅ `DB_PORT` variable set in backend service Variables
- [ ] ✅ `DB_NAME` variable set in backend service Variables
- [ ] ✅ `DB_USER` variable set in backend service Variables
- [ ] ✅ `DB_PASSWORD` variable set in backend service Variables
- [ ] ✅ `DB_SSL` variable set to `true` in backend service Variables
- [ ] ✅ Health endpoint shows `"database": "connected"`
- [ ] ✅ Tables are created (17 tables: tenants, users, products, etc.)
- [ ] ✅ SuperAdmin account exists (can login to superadmin portal)

---

## 🔍 Check Database Tables in Production

If you want to verify tables exist in your production database, you can:

### Option 1: Use Railway's Data Tab
1. Go to Railway → Postgres Service → **Data** tab
2. You should see all 17 tables listed

### Option 2: Connect via Command Line
Use the same migration script but point it to production:
```powershell
cd backend
# Update DATABASE_URL in run-railway.js with production URL
node src/database/migrations/run-railway.js
```

---

## 🚨 Common Issues

### Issue: "database": "disconnected"
**Cause**: Missing or incorrect environment variables in Railway backend service

**Solution**: Follow Step 2 above to add all required variables

### Issue: Connection timeout
**Cause**: Wrong `DB_HOST` or `DB_PORT` values

**Solution**: 
- Use `yamabiko.proxy.rlwy.net` and `42342` for public network
- Or use `postgres.railway.internal` and `5432` for private network

### Issue: Authentication failed
**Cause**: Wrong `DB_PASSWORD` value

**Solution**: Copy the exact password from Postgres service Variables → `PGPASSWORD`

### Issue: SSL required error
**Cause**: `DB_SSL` not set or set incorrectly

**Solution**: Set `DB_SSL=true` (lowercase, exact spelling)

---

## 📝 Your Current Database Connection Details

Based on what we've set up, your connection details are:

```
Host: yamabiko.proxy.rlwy.net
Port: 42342
Database: railway
User: postgres
Password: dstsWeaAwnAayKOLodUCoqRbatzGfAkR
SSL: Required (true)
```

**Note**: If you're using Railway's private network internally, the host might be different (like `postgres.railway.internal`) and port might be `5432`. Check your Postgres service Variables tab to see the exact values.

---

## 🎯 Next Steps After Verification

Once connected:

1. ✅ Test the API endpoints
2. ✅ Login to SuperAdmin portal
3. ✅ Create your first tenant
4. ✅ Start using the system!

