# Day 1, Task 1: Security Tools Setup

## 🎯 Task Objective
Install and configure comprehensive security testing tools including OWASP ZAP, vulnerability scanners, and dependency auditing tools.

## ⏱️ Estimated Time: 1.5 hours

## 📋 Prerequisites
- Backend and frontend applications running
- Docker installed (for OWASP ZAP)
- Node.js 18+ installed

---

## 📝 Step 1: Install Security Dependencies

```bash
cd backend
npm install --save-dev snyk retire helmet express-rate-limit
npm install --save helmet express-rate-limit cors
```

## 📝 Step 2: Set Up OWASP ZAP with Docker

Create file: `backend/security/docker-compose.zap.yml`

```yaml
version: '3.8'

services:
  zap:
    image: owasp/zap2docker-stable
    container_name: owasp-zap
    ports:
      - "8080:8080"
      - "8090:8090"
    command: zap-webswing.sh
    volumes:
      - ./zap-reports:/zap/wrk
    networks:
      - security-testing

networks:
  security-testing:
    driver: bridge
```

Start OWASP ZAP:

```bash
cd backend/security
docker-compose -f docker-compose.zap.yml up -d
```

## 📝 Step 3: Create Security Configuration

Create file: `backend/src/config/security.ts`

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const configureSecurityMiddleware = (app: Express) => {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Stricter rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
  });

  app.use('/auth/signin', authLimiter);
  app.use('/auth/signup', authLimiter);
  app.use('/auth/forgot-password', authLimiter);
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

## 📝 Step 4: Create Security Scanning Scripts

Create file: `backend/scripts/security-scan.sh`

```bash
#!/bin/bash

echo "🔒 Starting Security Scan..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p security-reports

# 1. NPM Audit
echo -e "\n${YELLOW}1. Running NPM Audit...${NC}"
npm audit --json > security-reports/npm-audit.json
npm audit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ No vulnerabilities found${NC}"
else
  echo -e "${RED}✗ Vulnerabilities detected${NC}"
fi

# 2. Snyk Test
echo -e "\n${YELLOW}2. Running Snyk Security Test...${NC}"
npx snyk test --json > security-reports/snyk-report.json
npx snyk test
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ No vulnerabilities found${NC}"
else
  echo -e "${RED}✗ Vulnerabilities detected${NC}"
fi

# 3. Retire.js (Check for outdated libraries)
echo -e "\n${YELLOW}3. Running Retire.js...${NC}"
npx retire --outputformat json --outputpath security-reports/retire-report.json
npx retire
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ No outdated libraries found${NC}"
else
  echo -e "${RED}✗ Outdated libraries detected${NC}"
fi

# 4. Check for secrets in code
echo -e "\n${YELLOW}4. Scanning for secrets...${NC}"
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --report-path security-reports/gitleaks-report.json
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ No secrets found${NC}"
  else
    echo -e "${RED}✗ Secrets detected${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Gitleaks not installed, skipping...${NC}"
fi

# 5. OWASP Dependency Check
echo -e "\n${YELLOW}5. Running OWASP Dependency Check...${NC}"
if command -v dependency-check &> /dev/null; then
  dependency-check --project "Hospital Management" --scan . --format JSON --out security-reports/dependency-check-report.json
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependency check complete${NC}"
  else
    echo -e "${RED}✗ Issues found${NC}"
  fi
else
  echo -e "${YELLOW}⚠ OWASP Dependency Check not installed, skipping...${NC}"
fi

echo -e "\n================================"
echo -e "${GREEN}Security scan complete!${NC}"
echo -e "Reports saved to: security-reports/"
echo "================================"
```

Make it executable:

```bash
chmod +x backend/scripts/security-scan.sh
```

## 📝 Step 5: Create OWASP ZAP Scan Script

Create file: `backend/scripts/zap-scan.sh`

```bash
#!/bin/bash

echo "🔒 Starting OWASP ZAP Scan..."
echo "================================"

# Configuration
TARGET_URL="http://localhost:3000"
ZAP_PORT=8080
REPORT_DIR="security-reports/zap"

mkdir -p $REPORT_DIR

# Start ZAP if not running
if ! docker ps | grep -q owasp-zap; then
  echo "Starting OWASP ZAP container..."
  cd security
  docker-compose -f docker-compose.zap.yml up -d
  cd ..
  sleep 10
fi

# Run baseline scan
echo "Running baseline scan..."
docker exec owasp-zap zap-baseline.py \
  -t $TARGET_URL \
  -r $REPORT_DIR/baseline-report.html \
  -J $REPORT_DIR/baseline-report.json

# Run full scan (takes longer)
echo "Running full scan..."
docker exec owasp-zap zap-full-scan.py \
  -t $TARGET_URL \
  -r $REPORT_DIR/full-report.html \
  -J $REPORT_DIR/full-report.json

echo "================================"
echo "ZAP scan complete!"
echo "Reports saved to: $REPORT_DIR/"
echo "================================"
```

Make it executable:

```bash
chmod +x backend/scripts/zap-scan.sh
```

## 📝 Step 6: Create Security Checklist

Create file: `backend/security/SECURITY_CHECKLIST.md`

```markdown
# Security Checklist

## Authentication & Authorization
- [ ] JWT tokens properly validated
- [ ] Password hashing with bcrypt (10+ rounds)
- [ ] Session management secure
- [ ] Multi-factor authentication (if applicable)
- [ ] Password reset flow secure
- [ ] Account lockout after failed attempts
- [ ] RBAC properly implemented

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS/SSL for data in transit
- [ ] Database credentials secured
- [ ] API keys not in source code
- [ ] Environment variables properly managed
- [ ] PII data properly handled
- [ ] HIPAA compliance verified

## Input Validation
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection enabled
- [ ] File upload validation
- [ ] Request size limits enforced

## API Security
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers set (Helmet)
- [ ] API authentication required
- [ ] Tenant isolation enforced
- [ ] Error messages don't leak info

## Infrastructure
- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] Secrets management (AWS Secrets Manager)
- [ ] Logging and monitoring enabled
- [ ] Backup encryption enabled
- [ ] Disaster recovery plan tested

## Dependencies
- [ ] All dependencies up to date
- [ ] No known vulnerabilities (npm audit)
- [ ] License compliance verified
- [ ] Dependency scanning automated

## Code Security
- [ ] No hardcoded secrets
- [ ] Secure coding practices followed
- [ ] Code review completed
- [ ] Static analysis passed
- [ ] Security testing completed

## Compliance
- [ ] HIPAA compliance verified
- [ ] GDPR compliance verified
- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed
- [ ] Data retention policy defined
```

## 📝 Step 7: Update package.json Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "security:scan": "./scripts/security-scan.sh",
    "security:zap": "./scripts/zap-scan.sh",
    "security:audit": "npm audit && npx snyk test",
    "security:fix": "npm audit fix && npx snyk wizard",
    "security:check": "npm run security:audit && npm run security:scan"
  }
}
```

## ✅ Verification

```bash
# Run security scan
cd backend
npm run security:scan

# Expected output:
# 🔒 Starting Security Scan...
# ================================
# 1. Running NPM Audit...
# ✓ No vulnerabilities found
# 2. Running Snyk Security Test...
# ✓ No vulnerabilities found
# ...
# ================================

# Check OWASP ZAP is running
docker ps | grep owasp-zap

# Expected output:
# owasp-zap   owasp/zap2docker-stable   ...   Up   0.0.0.0:8080->8080/tcp

# Access ZAP UI
# Open browser: http://localhost:8080

# Run ZAP scan (takes 5-10 minutes)
npm run security:zap

# Check reports
ls -la security-reports/
# Should see: npm-audit.json, snyk-report.json, retire-report.json, zap/
```

## 📄 Commit

```bash
git add src/config/security.ts scripts/security-scan.sh scripts/zap-scan.sh security/ package.json
git commit -m "security: Set up comprehensive security testing tools

- Install security dependencies (helmet, rate-limit, snyk)
- Configure OWASP ZAP with Docker
- Create security middleware configuration
- Add security scanning scripts
- Create ZAP scanning automation
- Add security checklist
- Configure npm scripts for security testing"
```

## 🔗 Next Task
[Day 1, Task 2: Dependency Audit](day-1-task-2-dependency-audit.md)

## 📚 Additional Resources
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Snyk Security Platform](https://snyk.io/docs/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
