# Multi-Tenant Hospital Management System - Git Branching Strategy

## 🏥 Project Architecture Overview

This project consists of **three interconnected applications**:

1. **`backend/`** - Node.js + TypeScript API server with multi-tenant architecture
2. **`hospital-management-system/`** - Next.js frontend for hospital operations
3. **`admin-dashboard/`** - Next.js admin interface for system management

## 🌳 Branch Structure

### **Main Branches:**
- **`main`** - Production-ready code (protected, all apps)
- **`development`** - Integration branch for all applications
- **`staging`** - Pre-production testing environment (optional)

### **Application-Specific Feature Branches:**
- **`feature/backend/feature-name`** - Backend API features
- **`feature/frontend/feature-name`** - Hospital management system features  
- **`feature/admin/feature-name`** - Admin dashboard features
- **`feature/fullstack/feature-name`** - Cross-application features

### **Bug Fix Branches:**
- **`bugfix/backend/bug-description`** - Backend bug fixes
- **`bugfix/frontend/bug-description`** - Frontend bug fixes
- **`bugfix/admin/bug-description`** - Admin dashboard bug fixes
- **`hotfix/critical-fix`** - Emergency production fixes (all apps)

### **User Branches:**
- **`user/username/backend/feature-name`** - Personal backend development
- **`user/username/frontend/feature-name`** - Personal frontend development
- **`user/username/admin/feature-name`** - Personal admin development
- **`user/username/fullstack/feature-name`** - Personal full-stack features

---

## 🔄 Multi-Application Workflow Process

### **1. Backend API Development:**
```bash
# Create backend feature branch
git checkout development
git pull origin development
git checkout -b feature/backend/patient-records-api

# Work on backend
cd backend
npm run dev
# Make changes to src/, tests/, docs/
git add backend/
git commit -m "feat(backend): add patient records API endpoints"
git push origin feature/backend/patient-records-api

# Create Pull Request: feature/backend/patient-records-api → development
```

### **2. Frontend Feature Development:**
```bash
# Create frontend feature branch
git checkout development
git pull origin development
git checkout -b feature/frontend/patient-dashboard

# Work on hospital management system
cd hospital-management-system
npm run dev
# Make changes to app/, components/, lib/
git add hospital-management-system/
git commit -m "feat(frontend): add patient dashboard interface"
git push origin feature/frontend/patient-dashboard

# Create Pull Request: feature/frontend/patient-dashboard → development
```

### **3. Admin Dashboard Development:**
```bash
# Create admin feature branch
git checkout development
git pull origin development
git checkout -b feature/admin/tenant-management

# Work on admin dashboard
cd admin-dashboard
npm run dev
# Make changes to app/, components/, lib/
git add admin-dashboard/
git commit -m "feat(admin): add tenant management interface"
git push origin feature/admin/tenant-management

# Create Pull Request: feature/admin/tenant-management → development
```

### **4. Full-Stack Feature Development:**
```bash
# Create full-stack feature branch
git checkout development
git pull origin development
git checkout -b feature/fullstack/file-upload-system

# Work across multiple applications
cd backend && npm run dev &
cd hospital-management-system && npm run dev &
cd admin-dashboard && npm run dev &

# Make coordinated changes
git add backend/ hospital-management-system/ admin-dashboard/
git commit -m "feat(fullstack): implement secure file upload system"
git push origin feature/fullstack/file-upload-system

# Create Pull Request: feature/fullstack/file-upload-system → development
```

### **5. Release Process:**
```bash
# Test all applications in development
cd backend && npm run test
cd hospital-management-system && npm run build
cd admin-dashboard && npm run build

# Deploy to staging (optional)
git checkout staging
git merge development
git push origin staging

# Deploy to production
git checkout main
git pull origin main
git merge development
git push origin main

# Tag release with version
git tag -a v1.0.0 -m "Release v1.0.0: Multi-tenant hospital management system"
git push origin v1.0.0
```

---

## 🛡️ Branch Protection Rules

### **Main Branch Protection:**
- ✅ Require pull request reviews (minimum 2)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to main branch
- ✅ Require signed commits (recommended)

### **Development Branch Protection:**
- ✅ Require pull request reviews (minimum 1)
- ✅ Require status checks to pass
- ✅ Allow force pushes by admins only

---

## 🏗️ Multi-Application Environment Mapping

### **Branch → Environment Mapping:**

#### **Production Environment (`main` branch):**
- **Backend API:**
  - Database: `hospital_prod_db`
  - Port: 8000
  - Config: `backend/.env.production`
  - AWS: Production Cognito + S3

- **Hospital Management System:**
  - Port: 3000
  - Config: `hospital-management-system/.env.production`
  - API Base URL: `https://api.hospital-system.com`

- **Admin Dashboard:**
  - Port: 3001
  - Config: `admin-dashboard/.env.production`
  - API Base URL: `https://api.hospital-system.com`

#### **Development Environment (`development` branch):**
- **Backend API:**
  - Database: `hospital_dev_db`
  - Port: 3000
  - Config: `backend/.env.development`
  - AWS: Development Cognito + S3

- **Hospital Management System:**
  - Port: 3001
  - Config: `hospital-management-system/.env.development`
  - API Base URL: `http://localhost:3000`

- **Admin Dashboard:**
  - Port: 3002
  - Config: `admin-dashboard/.env.development`
  - API Base URL: `http://localhost:3000`

#### **Local Development (`feature/*` branches):**
- **Backend API:**
  - Database: `hospital_dev_db`
  - Port: 3000
  - Config: `backend/.env` (local)

- **Hospital Management System:**
  - Port: 3001
  - Config: `hospital-management-system/.env.local`

- **Admin Dashboard:**
  - Port: 3002
  - Config: `admin-dashboard/.env.local`

---

## 👥 Multi-Application Developer Collaboration

### **Developer Workflow:**

#### **1. Setup Personal Development Environment:**
```bash
# Clone repository
git clone https://github.com/your-org/hospital-management-system.git
cd hospital-management-system

# Setup backend environment
cd backend
cp .env.example .env
# Edit .env with personal settings
npm install

# Setup hospital management system
cd ../hospital-management-system
cp .env.example .env.local
# Edit .env.local with local API URLs
npm install

# Setup admin dashboard
cd ../admin-dashboard
cp .env.example .env.local
# Edit .env.local with local API URLs
npm install
```

#### **2. Start New Feature (Application-Specific):**
```bash
# Always start from latest development
git checkout development
git pull origin development

# For backend development
git checkout -b user/yourname/backend/auth-improvements

# For frontend development
git checkout -b user/yourname/frontend/patient-ui

# For admin development
git checkout -b user/yourname/admin/tenant-dashboard

# For full-stack features
git checkout -b user/yourname/fullstack/appointment-system
```

#### **3. Development Workflow:**
```bash
# Start all applications for full-stack development
cd backend && npm run dev &          # Port 3000
cd hospital-management-system && npm run dev &  # Port 3001
cd admin-dashboard && npm run dev &  # Port 3002

# Or start specific application
cd backend && npm run dev            # Backend only
cd hospital-management-system && npm run dev    # Frontend only
cd admin-dashboard && npm run dev    # Admin only
```

#### **4. Testing Workflow:**
```bash
# Test backend
cd backend
npm run test
node tests/SYSTEM_STATUS_REPORT.js

# Test frontend builds
cd hospital-management-system
npm run build
npm run lint

# Test admin dashboard
cd admin-dashboard
npm run build
npm run lint
```

#### **5. Daily Sync:**
```bash
# Sync with development regularly
git checkout development
git pull origin development
git checkout user/yourname/app/feature-name
git rebase development

# Push your changes
git push origin user/yourname/app/feature-name
```

#### **6. Submit for Review:**
```bash
# Create Pull Request on GitHub
# Target: user/yourname/app/feature-name → development
# Add reviewers and description
# Include testing instructions for all affected applications
```

---

## 🔧 Multi-Application Environment Configuration

### **Development Setup:**
```bash
# Backend API Setup
cd backend
cp .env.example .env
# Configure database, AWS Cognito, S3 settings
npm install
npm run dev  # Starts on port 3000

# Hospital Management System Setup
cd hospital-management-system
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev  # Starts on port 3001

# Admin Dashboard Setup
cd admin-dashboard
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev  # Starts on port 3002
```

### **Production Deployment:**
```bash
# Backend Production
cd backend
cp .env.example .env.production
# Configure production database, AWS settings
npm run build
npm start

# Frontend Production (Hospital System)
cd hospital-management-system
cp .env.example .env.production
# Set NEXT_PUBLIC_API_URL=https://api.yourdomain.com
npm run build
npm start

# Admin Dashboard Production
cd admin-dashboard
cp .env.example .env.production
# Set NEXT_PUBLIC_API_URL=https://api.yourdomain.com
npm run build
npm start
```

### **Docker Deployment (All Applications):**
```bash
# Development
docker-compose -f docker-compose.development.yml up -d

# Production
docker-compose -f docker-compose.production.yml up -d
```

---

## 📋 Commit Message Convention

### **Format:**
```
type(scope): description

[optional body]

[optional footer]
```

### **Types:**
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes
- **refactor:** Code refactoring
- **test:** Adding tests
- **chore:** Maintenance tasks

### **Scopes (Application-Specific):**
- **backend:** Backend API changes
- **frontend:** Hospital management system changes
- **admin:** Admin dashboard changes
- **fullstack:** Changes affecting multiple applications
- **config:** Configuration changes
- **deploy:** Deployment-related changes

### **Examples:**
```bash
# Backend changes
git commit -m "feat(backend): add patient records API endpoints"
git commit -m "fix(backend): resolve JWT token validation issue"

# Frontend changes
git commit -m "feat(frontend): add patient dashboard interface"
git commit -m "fix(frontend): resolve form validation errors"

# Admin dashboard changes
git commit -m "feat(admin): add tenant management interface"
git commit -m "fix(admin): resolve user permissions display"

# Full-stack changes
git commit -m "feat(fullstack): implement secure file upload system"
git commit -m "fix(fullstack): resolve authentication flow across apps"

# Documentation and configuration
git commit -m "docs(backend): update API documentation"
git commit -m "chore(config): update environment configuration files"
```

---

## 🚀 Quick Start Commands

### **For New Developers (Full Setup):**
```bash
# 1. Clone and setup
git clone <repository-url>
cd hospital-management-system
git checkout development

# 2. Setup all applications
./scripts/setup-dev.sh  # If available, or manual setup:

# Backend setup
cd backend
cp .env.example .env
npm install
npm run dev &  # Port 3000

# Hospital system setup
cd ../hospital-management-system
cp .env.example .env.local
npm install
npm run dev &  # Port 3001

# Admin dashboard setup
cd ../admin-dashboard
cp .env.example .env.local
npm install
npm run dev &  # Port 3002

# 3. Verify all applications
curl http://localhost:3000/health  # Backend API
curl http://localhost:3001         # Hospital system
curl http://localhost:3002         # Admin dashboard
```

### **For Backend Development:**
```bash
# 1. Start backend feature
git checkout development
git pull origin development
git checkout -b user/yourname/backend/feature-name

# 2. Develop and test
cd backend
npm run dev
npm run test
node tests/SYSTEM_STATUS_REPORT.js

# 3. Submit for review
git add backend/
git commit -m "feat(backend): description of feature"
git push origin user/yourname/backend/feature-name
```

### **For Frontend Development:**
```bash
# 1. Start frontend feature
git checkout development
git pull origin development
git checkout -b user/yourname/frontend/feature-name

# 2. Develop and test
cd hospital-management-system
npm run dev
npm run build  # Test build
npm run lint   # Check code quality

# 3. Submit for review
git add hospital-management-system/
git commit -m "feat(frontend): description of feature"
git push origin user/yourname/frontend/feature-name
```

### **For Admin Dashboard Development:**
```bash
# 1. Start admin feature
git checkout development
git pull origin development
git checkout -b user/yourname/admin/feature-name

# 2. Develop and test
cd admin-dashboard
npm run dev
npm run build
npm run lint

# 3. Submit for review
git add admin-dashboard/
git commit -m "feat(admin): description of feature"
git push origin user/yourname/admin/feature-name
```

### **For Full-Stack Development:**
```bash
# 1. Start full-stack feature
git checkout development
git pull origin development
git checkout -b user/yourname/fullstack/feature-name

# 2. Start all applications
cd backend && npm run dev &
cd hospital-management-system && npm run dev &
cd admin-dashboard && npm run dev &

# 3. Develop across applications
# Make coordinated changes across backend/, hospital-management-system/, admin-dashboard/

# 4. Test all applications
cd backend && npm run test
cd hospital-management-system && npm run build
cd admin-dashboard && npm run build

# 5. Submit for review
git add backend/ hospital-management-system/ admin-dashboard/
git commit -m "feat(fullstack): description of feature"
git push origin user/yourname/fullstack/feature-name
```

## 🎯 Application-Specific Workflows

### **Backend API Development Focus:**
- Multi-tenant architecture with schema isolation
- AWS Cognito authentication and S3 file management
- PostgreSQL database operations
- RESTful API endpoints
- Comprehensive testing with `backend/tests/`

### **Hospital Management System Focus:**
- Patient management interfaces
- Appointment scheduling
- Medical records management
- Staff workflows
- Responsive design with Tailwind CSS

### **Admin Dashboard Focus:**
- Tenant management and configuration
- System monitoring and analytics
- User management across tenants
- System-wide settings and controls
- Administrative reporting

This multi-application workflow ensures:
- ✅ **Application Isolation** - Clear separation of concerns
- ✅ **Coordinated Development** - Full-stack features work seamlessly
- ✅ **Independent Deployment** - Each app can be deployed separately
- ✅ **Scalable Architecture** - Easy to add new applications
- ✅ **Clear Responsibilities** - Developers know which app to modify
- ✅ **Comprehensive Testing** - Each application thoroughly tested