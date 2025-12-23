# 🏗️ Multitenant Inventory Management System

A comprehensive multitenant inventory management system with SuperAdmin capabilities, comprehensive audit trails, and full receipt generation.

## ✨ Features

- 👤 **User Profile System** - Extended profile fields with personal info, address, emergency contacts, employment details, and notification preferences
- 👑 **SuperAdmin Portal** - Complete tenant and user management across the platform
- 📋 **Audit Trail System** - Comprehensive logging of all actions with search and export capabilities
- 🧾 **Receipt Generation** - Multiple templates (thermal, A4, invoice, email) with PDF generation
- 🔒 **Role-Based Access Control** - Multiple user roles with granular permissions
- 🚀 **Performance Optimized** - Database indexing, caching, and query optimization
- 💾 **Backup & Restore** - Automated backup system with point-in-time recovery
- 🔄 **Data Migration** - Import/export capabilities for data migration

## 📁 Project Structure

```
inventory-system/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utility functions
│   │   └── database/    # Migrations and seeds
│   └── package.json
├── frontend/            # React frontend (to be implemented)
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Redis (optional, for caching)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd imas
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```bash
   createdb inventory_system
   ```

5. **Run database migrations**
   ```bash
   cd backend
   psql -d inventory_system -f src/database/migrations/001_create_tables.sql
   ```

6. **Seed initial data**
   ```bash
   cd backend
   node src/database/seeds/superadmin.seed.js
   ```

7. **Start the server**
   ```bash
   cd backend
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new tenant
- `POST /api/auth/logout` - Logout

### User Profile

- `GET /api/profile` - Get own profile
- `PUT /api/profile` - Update own profile
- `PUT /api/profile/avatar` - Upload profile picture
- `PUT /api/profile/password` - Change password
- `GET /api/profile/activity` - Get own activity log
- `GET /api/profile/notifications` - Get notification preferences
- `PUT /api/profile/notifications` - Update notification preferences

### Receipts

- `GET /api/receipts` - List receipts
- `POST /api/receipts/generate` - Generate receipt from order
- `GET /api/receipts/:id` - Get receipt details
- `GET /api/receipts/:id/pdf` - Download PDF
- `POST /api/receipts/:id/email` - Email receipt
- `POST /api/receipts/:id/void` - Void receipt

### Audit Logs

- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/logs/:id` - Get audit log details
- `GET /api/audit/logs/entity/:type/:id` - Get entity history
- `GET /api/audit/logs/search` - Search audit logs
- `POST /api/audit/logs/export` - Export audit logs

### SuperAdmin

- `POST /api/superadmin/login` - SuperAdmin login
- `GET /api/superadmin/tenants` - List all tenants
- `POST /api/superadmin/tenants` - Create tenant
- `GET /api/superadmin/audit-logs` - Get global audit logs
- `GET /api/superadmin/system/health` - System health check

## 🔐 Default Credentials

After seeding, SuperAdmin credentials:
- Email: `admin@inventorysystem.com` (or as set in `.env`)
- Password: `ChangeThisPassword123!` (or as set in `.env`)

**⚠️ IMPORTANT: Change the default password after first login!**

## 🗄️ Database Schema

The system uses a **shared database** architecture with tenant isolation via `tenant_id` column. All tables include proper indexes for performance.

Key tables:
- `tenants` - Tenant information
- `users` - User accounts with extended profile fields
- `superadmins` - SuperAdmin accounts
- `products` - Product catalog
- `orders` - Sales orders
- `receipts` - Generated receipts
- `audit_logs` - Audit trail
- `system_logs` - SuperAdmin actions

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- Input validation
- SQL injection protection (Sequelize ORM)
- CORS configuration
- Helmet security headers

## 📊 Performance Optimizations

- Database indexes on all foreign keys and frequently queried columns
- Composite indexes for common query patterns
- Connection pooling
- Redis caching (optional)
- Pagination for large datasets
- Query optimization to avoid N+1 queries

## 🧪 Testing

```bash
cd backend
npm test
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[QUICK_START_WINDOWS.md](QUICK_START_WINDOWS.md)** - Quick start guide for Windows
- **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** - Complete Windows setup guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Vercel deployment instructions
- **[FEATURES.md](FEATURES.md)** - Comprehensive features documentation
- **[SECURITY.md](SECURITY.md)** - Security best practices
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[backend/API_ENDPOINTS.md](backend/API_ENDPOINTS.md)** - API endpoints reference
- **[deployment/scripts/README.md](deployment/scripts/README.md)** - Backup & restore scripts

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📧 Support

For support, email support@inventorysystem.com or create an issue in the repository.

---

**Built with ❤️ for efficient inventory management**

