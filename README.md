# IMAS - Inventory Management System

A comprehensive multitenant inventory management system with SuperAdmin portal, audit trails, and receipt generation.

## 🚀 Features

- **Multitenant Architecture** - Isolated data per tenant
- **SuperAdmin Portal** - Platform-wide management and analytics
- **Inventory Management** - Products, warehouses, stock tracking
- **Order Management** - Sales orders and receipts
- **Audit Trails** - Complete activity logging
- **User Management** - Role-based access control
- **Notifications** - Email, SMS, and push notifications
- **Reports & Analytics** - Business insights and reporting

## 📁 Project Structure

```
imas/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Auth, validation, etc.
│   └── migrations/       # Database migrations
├── frontend/
│   ├── web-app/          # Main tenant application
│   └── superadmin-portal/ # SuperAdmin dashboard
└── deployment/           # Backup/restore scripts
```

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Sequelize
- JWT Authentication
- Cloudinary (file uploads)

**Frontend:**
- React + Vite
- Material-UI
- Redux Toolkit
- React Router

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend/web-app && npm install
cd ../superadmin-portal && npm install
```

### Environment Setup

1. Copy `.env.example` to `.env` in backend directory
2. Configure database and API keys
3. Set up environment variables (see `DEPLOYMENT_URLS.txt`)

### Database Setup

```bash
# Run migrations
cd backend
npm run migrate:all

# Seed initial data (optional)
npm run seed
```

### Development

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend      # Backend API
npm run dev:frontend     # Web app
npm run dev:superadmin   # SuperAdmin portal
```

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System architecture
- [API Endpoints](backend/API_ENDPOINTS.md) - API documentation
- [Database Migrations](backend/DATABASE_MIGRATIONS.md) - Migration guide
- [Deployment Guide](DEPLOYMENT_URLS.txt) - Deployment instructions
- [Security Audit](SECURITY_AUDIT_REPORT.md) - Security documentation

## 🌐 Deployment

### Backend (Railway)
- Deploy to Railway
- Set environment variables
- Run migrations: `npm run migrate:all`

### Frontend (Vercel)
- Deploy web-app and superadmin-portal separately
- Set `VITE_API_URL` environment variable
- See `DEPLOYMENT_URLS.txt` for details

## 📝 License

MIT

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

