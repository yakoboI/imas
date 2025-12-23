# API Endpoints Reference

## Base URL
- Development: `http://localhost:5000`
- Health Check: `http://localhost:5000/health` (no /api prefix)

---

## SuperAdmin Routes (`/api/superadmin`)

### Authentication (No auth required)
- `POST /api/superadmin/login` - SuperAdmin login

### Tenant Management (Requires SuperAdmin auth)
- `GET /api/superadmin/tenants` - Get all tenants
- `POST /api/superadmin/tenants` - Create tenant
- `GET /api/superadmin/tenants/:id` - Get tenant by ID
- `PUT /api/superadmin/tenants/:id` - Update tenant
- `DELETE /api/superadmin/tenants/:id` - Delete tenant
- `PUT /api/superadmin/tenants/:id/suspend` - Suspend tenant
- `PUT /api/superadmin/tenants/:id/activate` - Activate tenant
- `GET /api/superadmin/tenants/:id/stats` - Get tenant statistics

### User Management (Requires SuperAdmin auth)
- `GET /api/superadmin/users` - Get all users (across all tenants)
- `GET /api/superadmin/users/:id` - Get user by ID
- `PUT /api/superadmin/users/:id/reset-password` - Reset user password
- `PUT /api/superadmin/users/:id/deactivate` - Deactivate user

### Audit & Logs (Requires SuperAdmin auth)
- `GET /api/superadmin/audit-logs` - Get global audit logs
- `GET /api/superadmin/audit-logs/tenant/:id` - Get tenant audit logs
- `GET /api/superadmin/audit-logs/search` - Search audit logs
- `POST /api/superadmin/audit-logs/export` - Export audit logs
- `GET /api/superadmin/system-logs` - Get system logs
- `POST /api/superadmin/system-logs/archive` - Archive system logs (moves old logs to archive table)

**Archive System Logs Request Body:**
```json
{
  "beforeDate": "2024-01-01T00:00:00Z"  // OR
  "daysOld": 90  // Archive logs older than 90 days
}
```

**Archive System Logs Response:**
```json
{
  "message": "System logs archived successfully",
  "archivedCount": 150,
  "cutoffDate": "2024-01-01T00:00:00.000Z"
}
```

### Analytics (Requires SuperAdmin auth)
- `GET /api/superadmin/analytics/overview` - Analytics overview
- `GET /api/superadmin/analytics/revenue` - Revenue reports
- `GET /api/superadmin/analytics/usage` - Usage statistics
- `GET /api/superadmin/analytics/tenants/growth` - Tenant growth

### System Management (Requires SuperAdmin auth)
- `GET /api/superadmin/system/health` - System health check
- `POST /api/superadmin/system/backup` - Trigger backup
- `GET /api/superadmin/system/settings` - Get system settings
- `PUT /api/superadmin/system/settings` - Update system settings

---

## User Authentication Routes (`/api/auth`)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

---

## User Profile Routes (`/api/profile`)

All require authentication and tenant context:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/avatar` - Upload avatar
- `PUT /api/profile/password` - Change password
- `GET /api/profile/activity` - Get user activity
- `GET /api/profile/notifications` - Get notification preferences
- `PUT /api/profile/notifications` - Update notification preferences

---

## User Management Routes (`/api/users`)

All require authentication and admin role:
- `GET /api/users` - Get all users (in tenant)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## Receipt Routes (`/api/receipts`)

All require authentication and appropriate role:
- `GET /api/receipts` - List receipts
- `POST /api/receipts/generate` - Generate receipt
- `GET /api/receipts/:id` - Get receipt by ID
- `GET /api/receipts/:id/pdf` - Download receipt PDF
- `GET /api/receipts/:id/preview` - Preview receipt
- `POST /api/receipts/:id/email` - Email receipt
- `POST /api/receipts/:id/void` - Void receipt
- `GET /api/receipts/:id/audit` - Get receipt audit trail

---

## Audit Routes (`/api/audit`)

All require authentication and appropriate role:
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/logs/:id` - Get audit log by ID
- `GET /api/audit/logs/entity/:type/:id` - Get entity history
- `GET /api/audit/logs/user/:userId` - Get user activity
- `GET /api/audit/logs/search` - Search audit logs
- `POST /api/audit/logs/export` - Export audit logs
- `GET /api/audit/stats` - Get audit statistics

---

## Testing SuperAdmin Login

**Endpoint:** `POST http://localhost:5000/api/superadmin/login`

**Request Body (JSON):**
```json
{
  "email": "admin@inventorysystem.com",
  "password": "ChangeThisPassword123!"
}
```

**Expected Response:**
```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "...",
    "email": "admin@inventorysystem.com",
    "name": "...",
    "role": "superadmin"
  }
}
```

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@inventorysystem.com\",\"password\":\"ChangeThisPassword123!\"}"
```

**Using PowerShell (Invoke-WebRequest):**
```powershell
$body = @{
    email = "admin@inventorysystem.com"
    password = "ChangeThisPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## Important Notes

1. **All routes except login require authentication** - Include the JWT token in the Authorization header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

2. **Routes are prefixed with `/api/`** - Don't forget the prefix!

3. **Health check is the exception** - It's at `/health` (no /api prefix)

