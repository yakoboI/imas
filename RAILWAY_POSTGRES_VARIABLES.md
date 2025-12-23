# Railway PostgreSQL Environment Variables

This document lists the PostgreSQL database environment variables required for Railway deployment.

## Required PostgreSQL Variables

Add these variables to your **backend service** in Railway:

### DB_HOST
- **Description**: PostgreSQL server hostname
- **Example**: `containers-us-west-xxx.railway.app` or `postgres.railway.internal`
- **Source**: Get from PostgreSQL service → Connect tab → `PGHOST` value
- **Required**: Yes

### DB_PORT
- **Description**: PostgreSQL server port
- **Example**: `5432`
- **Source**: Get from PostgreSQL service → Connect tab → `PGPORT` value
- **Required**: Yes

### DB_NAME
- **Description**: PostgreSQL database name
- **Example**: `railway` or `postgres`
- **Source**: Get from PostgreSQL service → Connect tab → `PGDATABASE` value
- **Required**: Yes

### DB_USER
- **Description**: PostgreSQL username
- **Example**: `postgres`
- **Source**: Get from PostgreSQL service → Connect tab → `PGUSER` value
- **Required**: Yes

### DB_PASSWORD
- **Description**: PostgreSQL password
- **Example**: `your_password_here`
- **Source**: Get from PostgreSQL service → Connect tab → `PGPASSWORD` value
- **Required**: Yes

### DB_SSL
- **Description**: Enable SSL connection (Railway requires this)
- **Example**: `true`
- **Source**: Set manually
- **Required**: Yes (must be `true` for Railway)

---

## Railway PostgreSQL Service Variables

When you add a PostgreSQL service in Railway, it automatically creates these variables:

**Example of actual Railway PostgreSQL service variables:**

```
PGHOST=${{RAILWAY_PRIVATE_DOMAIN}}
PGPORT=5432
PGDATABASE=${{POSTGRES_DB}}
PGUSER=${{POSTGRES_USER}}
PGPASSWORD=${{POSTGRES_PASSWORD}}
POSTGRES_DB=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dstsWeaAwnAayKOLodUCoqRbatzGfAkR
```

**Note:** The `${{...}}` syntax means Railway will resolve these to actual values. When you view the Variables tab, you'll see the resolved values.

### Variables in PostgreSQL Service

Railway PostgreSQL service provides these variables (visible in PostgreSQL service → Variables tab):

- `PGHOST` = `${{RAILWAY_PRIVATE_DOMAIN}}` (internal Railway domain)
- `PGPORT` = `5432`
- `PGDATABASE` = `${{POSTGRES_DB}}` (usually `railway`)
- `PGUSER` = `${{POSTGRES_USER}}` (usually `postgres`)
- `PGPASSWORD` = `${{POSTGRES_PASSWORD}}` (auto-generated password)
- `POSTGRES_DB` = `railway`
- `POSTGRES_USER` = `postgres`
- `POSTGRES_PASSWORD` = (auto-generated, e.g., `dstsWeaAwnAayKOLodUCoqRbatzGfAkR`)

### Variable Mapping

Map Railway PostgreSQL variables to your app's required variables:

| App Variable | Railway Variable | Value Source |
|--------------|------------------|--------------|
| `DB_HOST` | `PGHOST` | Copy from PostgreSQL service → Variables → `PGHOST` |
| `DB_PORT` | `PGPORT` | Copy from PostgreSQL service → Variables → `PGPORT` (usually `5432`) |
| `DB_NAME` | `PGDATABASE` or `POSTGRES_DB` | Copy from PostgreSQL service → Variables → `PGDATABASE` (usually `railway`) |
| `DB_USER` | `PGUSER` or `POSTGRES_USER` | Copy from PostgreSQL service → Variables → `PGUSER` (usually `postgres`) |
| `DB_PASSWORD` | `PGPASSWORD` or `POSTGRES_PASSWORD` | Copy from PostgreSQL service → Variables → `PGPASSWORD` |
| `DB_SSL` | (not provided) | Set manually to `true` |

### How to Get These Values

1. Go to your Railway project
2. Click on your **PostgreSQL service**
3. Go to **Variables** tab
4. You'll see all the PostgreSQL variables listed
5. Copy the values for: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

---

## Setting Variables in Railway

### Step-by-Step:

1. Go to your Railway project
2. Click on your **PostgreSQL service**
3. Go to **Variables** tab
4. Note down these values:
   - `PGHOST` (e.g., `postgres.railway.internal` or similar)
   - `PGPORT` (usually `5432`)
   - `PGDATABASE` (usually `railway`)
   - `PGUSER` (usually `postgres`)
   - `PGPASSWORD` (long random string)

5. Now go to your **backend service** (not the PostgreSQL service)
6. Click on **Variables** tab
7. Click **New Variable** button
8. Add each variable one by one:

   **Variable 1:**
   - Key: `DB_HOST`
   - Value: (paste the `PGHOST` value from PostgreSQL service)

   **Variable 2:**
   - Key: `DB_PORT`
   - Value: `5432` (or copy from `PGPORT`)

   **Variable 3:**
   - Key: `DB_NAME`
   - Value: `railway` (or copy from `PGDATABASE`)

   **Variable 4:**
   - Key: `DB_USER`
   - Value: `postgres` (or copy from `PGUSER`)

   **Variable 5:**
   - Key: `DB_PASSWORD`
   - Value: (paste the `PGPASSWORD` value from PostgreSQL service - it's a long random string)

   **Variable 6:**
   - Key: `DB_SSL`
   - Value: `true`

9. Railway will automatically redeploy after adding variables
10. Wait 1-2 minutes for deployment
11. Test: Visit `https://YOUR-BACKEND.up.railway.app/health`
12. Should return: `{"status":"ok","database":"connected",...}`

---

## Quick Checklist

Before deployment, verify you have:

- [ ] PostgreSQL service added to Railway project
- [ ] PostgreSQL service is running (not paused)
- [ ] `DB_HOST` variable set in backend service
- [ ] `DB_PORT` variable set in backend service
- [ ] `DB_NAME` variable set in backend service
- [ ] `DB_USER` variable set in backend service
- [ ] `DB_PASSWORD` variable set in backend service
- [ ] `DB_SSL` variable set to `true` in backend service
- [ ] Backend service redeployed after adding variables

---

## Troubleshooting

### Database Still Shows "disconnected"

1. **Check variable names**: Must be exactly `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` (case-sensitive)
2. **Check DB_SSL**: Must be set to `true` (not `True` or `TRUE`, just `true`)
3. **Check PostgreSQL service**: Make sure it's running, not paused
4. **Check values**: Copy exact values from PostgreSQL service, no extra spaces
5. **Check logs**: Go to backend service → Deployments → View logs for connection errors

### Common Errors

**Error: "Connection refused"**
- Check `DB_HOST` and `DB_PORT` are correct
- Verify PostgreSQL service is running

**Error: "Authentication failed"**
- Check `DB_USER` and `DB_PASSWORD` are correct
- Copy exact values from PostgreSQL service

**Error: "SSL required"**
- Set `DB_SSL=true` (must be lowercase `true`)

**Error: "Database does not exist"**
- Check `DB_NAME` matches the database name in PostgreSQL service
- Usually `railway` or `postgres`

---

## Example Variable Values

### PostgreSQL Service Variables (Reference Only)

Here's what Railway provides in the PostgreSQL service Variables tab:

```
PGHOST=${{RAILWAY_PRIVATE_DOMAIN}}
PGPORT=5432
PGDATABASE=${{POSTGRES_DB}}
PGUSER=${{POSTGRES_USER}}
PGPASSWORD=${{POSTGRES_PASSWORD}}
POSTGRES_DB=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dstsWeaAwnAayKOLodUCoqRbatzGfAkR
```

### Backend Service Variables (What You Need to Add)

Here's what your Railway backend service Variables tab should look like:

```
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=dstsWeaAwnAayKOLodUCoqRbatzGfAkR
DB_SSL=true
```

**Important Notes:**
- `DB_HOST` will be the value from `PGHOST` (usually something like `postgres.railway.internal` or a Railway domain)
- `DB_PASSWORD` will be the value from `PGPASSWORD` (a long auto-generated string)
- `DB_SSL` must be set to `true` (Railway requires SSL)
- Your actual values will be different - copy them from your PostgreSQL service Variables tab

---

## Important Notes

1. **Never commit these values to Git** - They're already in `.gitignore`
2. **DB_SSL must be `true`** - Railway PostgreSQL requires SSL connections
3. **Variable names are case-sensitive** - Use exact names: `DB_HOST`, not `db_host`
4. **Railway auto-redeploys** - After adding variables, wait for automatic redeployment
5. **Test the connection** - Always check `/health` endpoint after deployment

