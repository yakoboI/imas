# Script to create .env file with database configuration

$envPath = Join-Path $PSScriptRoot ".env"

Write-Host "Creating .env file..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path $envPath) {
    Write-Host "WARNING: .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit
    }
}

$envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_system
DB_USER=postgres
DB_PASSWORD=your-database-password-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary (for image uploads - Optional for now)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (Optional - for receipt PDFs)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@inventorysystem.com

# SuperAdmin
SUPERADMIN_EMAIL=admin@inventorysystem.com
SUPERADMIN_PASSWORD=ChangeThisPassword123!

# Application URLs
FRONTEND_URL=http://localhost:3000
SUPERADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:5000
"@

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host ".env file created successfully at:" -ForegroundColor Green
Write-Host "   $envPath" -ForegroundColor White
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Database: inventory_system" -ForegroundColor White
Write-Host "   User: postgres" -ForegroundColor White
Write-Host "   Password: (configured)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test database connection: node test-db.js" -ForegroundColor White
Write-Host "   2. Seed database: npm run seed" -ForegroundColor White
Write-Host "   3. Start server: npm run dev" -ForegroundColor White

