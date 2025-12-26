# Installation Guide - Paperless Examination System

## System Requirements

### Hardware Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- Network: 100 Mbps

**Recommended**:
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD
- Network: 1 Gbps

### Software Requirements

- **Node.js**: 20.x or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 6.x or higher
- **Operating System**: Linux (Ubuntu 22.04), macOS 12+, or Windows 10/11
- **Git**: Latest version

## Development Setup

### 1. Install Dependencies

#### Windows

**Node.js**:
```powershell
# Download from https://nodejs.org/
# Or use Chocolatey
choco install nodejs-lts
```

**PostgreSQL**:
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

**Redis**:
```powershell
# Install WSL2 first, then Redis in WSL
# Or use Redis for Windows (unofficial)
# Or use Docker Desktop with Redis container
```

#### macOS

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@20
brew install postgresql@15
brew install redis

# Start services
brew services start postgresql@15
brew services start redis
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-15

# Install Redis
sudo apt install redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd paperless-exam-system
```

### 3. Install Project Dependencies

```bash
# Install all dependencies (root, packages, and apps)
npm install
```

### 4. Configure PostgreSQL

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE paperless_exam;
CREATE USER paperless_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE paperless_exam TO paperless_user;
ALTER DATABASE paperless_exam OWNER TO paperless_user;

# Exit
\q
```

### 5. Configure Backend

```bash
cd apps/api

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Update the following in `.env`:

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://paperless_user:your_secure_password@localhost:5432/paperless_exam?schema=public"

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET=<generate-random-secret-64-chars>
JWT_REFRESH_SECRET=<generate-random-secret-64-chars>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:3000

# Encryption
ENCRYPTION_KEY=<generate-32-character-key>
```

Generate secrets:
```bash
# On Linux/macOS
openssl rand -hex 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 6. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run prisma:seed
```

### 7. Configure Frontend

```bash
cd ../web

# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

Update `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-random-secret>
```

### 8. Start Development Servers

**Option A: Start all services from root**:
```bash
cd ../..
npm run dev
```

**Option B: Start services individually**:

Terminal 1 (Backend):
```bash
cd apps/api
npm run dev
```

Terminal 2 (Frontend):
```bash
cd apps/web
npm run dev
```

### 9. Verify Installation

1. **Backend Health Check**:
   - Open http://localhost:5000/health
   - Should return: `{"status":"OK",...}`

2. **Frontend**:
   - Open http://localhost:3000
   - Should redirect to login page

3. **Prisma Studio** (optional):
   ```bash
   cd apps/api
   npm run prisma:studio
   ```
   - Opens at http://localhost:5555

## Production Setup

### 1. Environment Configuration

Update production `.env` files with:
- Strong, unique secrets
- Production database credentials
- Production Redis configuration
- HTTPS URLs
- Enable security features

### 2. Build Applications

```bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/web
npm run build
```

### 3. Database Setup

```bash
cd apps/api

# Run migrations (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 4. Process Management

Use PM2 for production:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd apps/api
pm2 start dist/server.js --name paperless-api

# Start frontend
cd apps/web
pm2 start npm --name paperless-web -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/paperless-exam

# Backend API
server {
    listen 80;
    server_name api.paperless-exam.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name paperless-exam.com www.paperless-exam.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/paperless-exam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificates

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d paperless-exam.com -d www.paperless-exam.com
sudo certbot --nginx -d api.paperless-exam.com
```

### 7. Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Allow PostgreSQL (only from app server)
sudo ufw allow from <app-server-ip> to any port 5432

# Allow Redis (only from app server)
sudo ufw allow from <app-server-ip> to any port 6379

# Enable firewall
sudo ufw enable
```

## Docker Deployment

### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: paperless_exam
      POSTGRES_USER: paperless_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://paperless_user:${DB_PASSWORD}@postgres:5432/paperless_exam
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis

  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 2. Build and Run

```bash
docker-compose up -d
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check port
sudo netstat -plunt | grep 5432

# Test connection
psql -U paperless_user -d paperless_exam -h localhost
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Prisma Migration Errors

```bash
# Reset database (development only)
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset
```

### Node Module Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Post-Installation

### 1. Create Super Admin

Run seed script or manually create:

```sql
-- Insert super admin role
INSERT INTO roles (id, university_id, name, is_system, description)
VALUES (uuid_generate_v4(), '<university-id>', 'SUPER_ADMIN', true, 'System Administrator');

-- Create permissions and link to role
-- (See seed script for complete setup)
```

### 2. Initial Configuration

1. Login as Super Admin
2. Create University
3. Create Schools/Departments
4. Create Roles and Permissions
5. Assign roles to users

### 3. Backup Strategy

```bash
# Database backup
pg_dump -U paperless_user paperless_exam > backup_$(date +%Y%m%d).sql

# Restore
psql -U paperless_user paperless_exam < backup.sql
```

## Monitoring

### Health Checks

- Backend: `http://localhost:5000/health`
- Database: `pg_isready -U paperless_user`
- Redis: `redis-cli ping`

### Logs

```bash
# Backend logs
tail -f apps/api/logs/combined-*.log

# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/access.log
```

## Support

For installation issues:
- Check logs: `apps/api/logs/`
- Verify environment variables
- Check service status
- Review error messages
- Consult documentation

---

**Installation Complete!** 🎉

Next steps: [User Guide](USER_GUIDE.md) | [API Documentation](API_DOCS.md)
