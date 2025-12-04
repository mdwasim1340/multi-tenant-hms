# File Organization Policy

**Last Updated**: December 4, 2025  
**Status**: Mandatory for All Development  
**Enforcement**: Strict

---

## 🚨 CRITICAL RULE: NO FILES IN ROOT DIRECTORY

**NEVER create files in the project root directory** except for the following approved files:

### ✅ Allowed Root Files (Only These)
```
.gitignore              # Git ignore rules
README.md               # Project overview (if needed)
package.json            # Root workspace config (if monorepo)
docker-compose.yml      # Docker orchestration
.env.example            # Environment template
LICENSE                 # Project license
```

### ❌ FORBIDDEN in Root Directory
- Documentation files (*.md except README.md)
- Test files (*.test.*, *.spec.*)
- Script files (*.sh, *.ps1, *.js, *.ts)
- Configuration files (except approved list)
- Temporary files
- Backup files
- Log files
- Data files
- Any other files

---

## 📁 Mandatory File Organization Structure

### Documentation Files

**Rule**: ALL documentation MUST go in appropriate `/docs` directories

```
✅ CORRECT Locations:
backend/docs/                           # Backend documentation
  ├── README.md                         # Backend overview
  ├── API_GUIDE.md                      # API documentation
  ├── DEPLOYMENT_GUIDE.md               # Deployment instructions
  ├── fixes/                            # Fix documentation
  ├── database-schema/                  # Schema documentation
  └── [feature-name]/                   # Feature-specific docs

hospital-management-system/docs/        # Frontend documentation
  ├── README.md                         # Frontend overview
  ├── COMPONENT_GUIDE.md                # Component documentation
  ├── INTEGRATION_GUIDE.md              # Integration patterns
  └── [feature-name]/                   # Feature-specific docs

admin-dashboard/docs/                   # Admin dashboard documentation
  └── [similar structure]

docs/                                   # General/cross-cutting documentation
  ├── README.md                         # Documentation index
  ├── architecture/                     # Architecture docs
  ├── infrastructure/                   # Infrastructure docs
  └── [team-name]/                      # Team-specific docs

❌ WRONG Locations:
/SOME_DOCUMENTATION.md                  # Root directory
/backend/SOME_DOC.md                    # Backend root
/hospital-management-system/FIX.md      # Frontend root
```

### Test Files

**Rule**: ALL tests MUST go in `/tests` or `/__tests__` directories

```
✅ CORRECT Locations:
backend/tests/                          # Backend tests
  ├── unit/                             # Unit tests
  ├── integration/                      # Integration tests
  ├── e2e/                              # End-to-end tests
  └── fixtures/                         # Test fixtures

hospital-management-system/__tests__/   # Frontend tests (Jest convention)
  ├── components/                       # Component tests
  ├── hooks/                            # Hook tests
  └── integration/                      # Integration tests

e2e-tests/                              # Cross-application E2E tests
  ├── scenarios/                        # Test scenarios
  └── fixtures/                         # Test data

❌ WRONG Locations:
/test-something.js                      # Root directory
/backend/test-api.js                    # Backend root
/backend/src/test-service.js            # Source directory
```

### Script Files

**Rule**: ALL scripts MUST go in `/scripts` directories

```
✅ CORRECT Locations:
backend/scripts/                        # Backend scripts
  ├── setup/                            # Setup scripts
  ├── deployment/                       # Deployment scripts
  ├── database/                         # Database scripts
  ├── maintenance/                      # Maintenance scripts
  └── utils/                            # Utility scripts

hospital-management-system/scripts/     # Frontend scripts
  ├── build/                            # Build scripts
  └── utils/                            # Utility scripts

scripts/                                # Root-level scripts (if needed)
  ├── setup-all.sh                      # Multi-service setup
  └── deploy-all.sh                     # Multi-service deployment

❌ WRONG Locations:
/deploy.sh                              # Root directory
/backend/setup-something.js             # Backend root
/check-health.ps1                       # Root directory
```

### Configuration Files

**Rule**: Configuration files go in service root or `/config` directory

```
✅ CORRECT Locations:
backend/                                # Backend configs
  ├── .env                              # Environment variables
  ├── .env.example                      # Environment template
  ├── tsconfig.json                     # TypeScript config
  ├── jest.config.js                    # Jest config
  ├── .eslintrc.js                      # ESLint config
  └── config/                           # Additional configs
      ├── database.config.ts
      └── aws.config.ts

hospital-management-system/             # Frontend configs
  ├── .env.local                        # Local environment
  ├── next.config.mjs                   # Next.js config
  ├── tailwind.config.ts                # Tailwind config
  └── tsconfig.json                     # TypeScript config

❌ WRONG Locations:
/config.json                            # Root directory
/backend/.env.production                # Should be in deployment docs
```

### Data Files

**Rule**: Data files go in `/data` or service-specific data directories

```
✅ CORRECT Locations:
backend/data/                           # Backend data
  ├── seeds/                            # Database seeds
  ├── fixtures/                         # Test fixtures
  └── migrations/                       # Migration data

production-data/                        # Production data exports
  ├── backups/                          # Database backups
  └── exports/                          # Data exports

❌ WRONG Locations:
/data.json                              # Root directory
/backup.sql                             # Root directory
/export.csv                             # Root directory
```

### Temporary/Backup Files

**Rule**: Temporary files go in designated temp directories (gitignored)

```
✅ CORRECT Locations:
backend/temp/                           # Backend temp files (gitignored)
hospital-management-system/temp/        # Frontend temp files (gitignored)
temp_backup/                            # Temporary backups (gitignored)
deployment-archives/                    # Deployment archives

❌ WRONG Locations:
/temp-file.txt                          # Root directory
/backup-dec-3.tar.gz                    # Root directory
```

---

## 📋 File Creation Checklist

Before creating ANY file, ask yourself:

1. **Is this a documentation file?**
   - ✅ YES → Create in appropriate `/docs` directory
   - ❌ NO → Continue to next question

2. **Is this a test file?**
   - ✅ YES → Create in appropriate `/tests` or `/__tests__` directory
   - ❌ NO → Continue to next question

3. **Is this a script file?**
   - ✅ YES → Create in appropriate `/scripts` directory
   - ❌ NO → Continue to next question

4. **Is this a configuration file?**
   - ✅ YES → Create in service root or `/config` directory
   - ❌ NO → Continue to next question

5. **Is this a data file?**
   - ✅ YES → Create in appropriate `/data` directory
   - ❌ NO → Continue to next question

6. **Is this a temporary file?**
   - ✅ YES → Create in `/temp` directory (ensure gitignored)
   - ❌ NO → Determine appropriate location based on file type

---

## 🎯 Service-Specific Organization

### Backend (backend/)
```
backend/
├── src/                    # Source code
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── types/
│   └── utils/
├── tests/                  # All tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                # All scripts
│   ├── setup/
│   ├── deployment/
│   └── database/
├── docs/                   # All documentation
│   ├── README.md
│   ├── API_GUIDE.md
│   └── fixes/
├── migrations/             # Database migrations
├── config/                 # Configuration files
├── data/                   # Data files
├── temp/                   # Temporary files (gitignored)
├── dist/                   # Build output (gitignored)
├── node_modules/           # Dependencies (gitignored)
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── jest.config.js          # Jest config
```

### Frontend (hospital-management-system/)
```
hospital-management-system/
├── app/                    # Next.js pages
├── components/             # React components
├── hooks/                  # Custom hooks
├── lib/                    # Utilities and API clients
├── types/                  # TypeScript types
├── public/                 # Static assets
├── styles/                 # Global styles
├── __tests__/              # All tests
│   ├── components/
│   ├── hooks/
│   └── integration/
├── scripts/                # All scripts
│   └── build/
├── docs/                   # All documentation
│   ├── README.md
│   └── COMPONENT_GUIDE.md
├── .next/                  # Build output (gitignored)
├── node_modules/           # Dependencies (gitignored)
├── .env.local              # Environment variables (gitignored)
├── .env.local.example      # Environment template
├── package.json            # Dependencies
├── next.config.mjs         # Next.js config
└── tsconfig.json           # TypeScript config
```

### Admin Dashboard (admin-dashboard/)
```
admin-dashboard/
├── [similar structure to hospital-management-system]
```

---

## 🚫 Common Violations to Avoid

### ❌ VIOLATION 1: Documentation in Root
```bash
# WRONG
/FEATURE_COMPLETE.md
/FIX_SUMMARY.md
/DEPLOYMENT_GUIDE.md

# CORRECT
backend/docs/FEATURE_COMPLETE.md
backend/docs/fixes/FIX_SUMMARY.md
backend/docs/DEPLOYMENT_GUIDE.md
```

### ❌ VIOLATION 2: Test Files in Root
```bash
# WRONG
/test-api.js
/test-integration.js
backend/test-service.js

# CORRECT
backend/tests/integration/test-api.js
backend/tests/integration/test-integration.js
backend/tests/unit/test-service.js
```

### ❌ VIOLATION 3: Scripts in Root
```bash
# WRONG
/deploy.sh
/setup.js
backend/check-health.ps1

# CORRECT
backend/scripts/deployment/deploy.sh
backend/scripts/setup/setup.js
backend/scripts/monitoring/check-health.ps1
```

### ❌ VIOLATION 4: Config Files in Root
```bash
# WRONG
/config.json
/database.config.js

# CORRECT
backend/config/config.json
backend/config/database.config.js
```

### ❌ VIOLATION 5: Temporary Files in Root
```bash
# WRONG
/temp-data.json
/backup-dec-3.tar.gz
/test-output.log

# CORRECT
backend/temp/temp-data.json
deployment-archives/backup-dec-3.tar.gz
backend/temp/test-output.log
```

---

## 🔧 Cleanup Procedure

If you find files in wrong locations:

### Step 1: Identify File Type
Determine what type of file it is (documentation, test, script, etc.)

### Step 2: Determine Correct Location
Use the organization structure above to find the correct location

### Step 3: Move File
```bash
# Example: Moving documentation
mv /SOME_DOC.md backend/docs/SOME_DOC.md

# Example: Moving test
mv /test-api.js backend/tests/integration/test-api.js

# Example: Moving script
mv /deploy.sh backend/scripts/deployment/deploy.sh
```

### Step 4: Update References
Search for any references to the old path and update them:
```bash
# Search for references
grep -r "SOME_DOC.md" .
grep -r "test-api.js" .

# Update import/require statements
# Update documentation links
# Update script paths
```

### Step 5: Commit Changes
```bash
git add .
git commit -m "refactor: move [file] to proper location"
```

---

## 📊 Organization Benefits

### For Developers
✅ Easy to find files  
✅ Clear project structure  
✅ Reduced cognitive load  
✅ Faster navigation  
✅ Better IDE support  

### For AI Agents
✅ Predictable file locations  
✅ Easier context building  
✅ Reduced search time  
✅ Clear organization patterns  
✅ Better task execution  

### For Project Maintenance
✅ Cleaner git history  
✅ Easier code reviews  
✅ Better scalability  
✅ Reduced clutter  
✅ Professional appearance  

---

## 🎓 Examples of Proper Organization

### Example 1: Adding New Feature Documentation
```bash
# Task: Document new appointment feature

# ❌ WRONG
touch /APPOINTMENT_FEATURE.md

# ✅ CORRECT
touch backend/docs/APPOINTMENT_FEATURE.md
# or
touch hospital-management-system/docs/APPOINTMENT_FEATURE.md
```

### Example 2: Adding New Test
```bash
# Task: Add integration test for patients API

# ❌ WRONG
touch /test-patients-api.js
touch backend/test-patients.js

# ✅ CORRECT
touch backend/tests/integration/patients-api.test.js
```

### Example 3: Adding Deployment Script
```bash
# Task: Create deployment script

# ❌ WRONG
touch /deploy-backend.sh

# ✅ CORRECT
touch backend/scripts/deployment/deploy-backend.sh
```

### Example 4: Adding Configuration
```bash
# Task: Add AWS configuration

# ❌ WRONG
touch /aws-config.js

# ✅ CORRECT
touch backend/config/aws.config.ts
```

---

## 🚨 Enforcement

### Pre-commit Checks
Consider adding pre-commit hooks to prevent root directory pollution:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for unauthorized files in root
UNAUTHORIZED_FILES=$(git diff --cached --name-only --diff-filter=A | grep -E '^[^/]+\.(md|js|ts|sh|ps1|json|sql)$' | grep -v -E '^(README\.md|package\.json|docker-compose\.yml|\.gitignore|\.env\.example|LICENSE)$')

if [ ! -z "$UNAUTHORIZED_FILES" ]; then
    echo "❌ ERROR: Files in root directory detected:"
    echo "$UNAUTHORIZED_FILES"
    echo ""
    echo "Please move files to appropriate directories:"
    echo "  - Documentation: backend/docs/ or hospital-management-system/docs/"
    echo "  - Tests: backend/tests/ or hospital-management-system/__tests__/"
    echo "  - Scripts: backend/scripts/ or hospital-management-system/scripts/"
    echo ""
    exit 1
fi
```

### Code Review Checklist
- [ ] No new files in root directory (except approved list)
- [ ] All documentation in `/docs` directories
- [ ] All tests in `/tests` or `/__tests__` directories
- [ ] All scripts in `/scripts` directories
- [ ] All configs in service root or `/config` directories

---

## 📞 Questions?

If you're unsure where to place a file:

1. Check this policy first
2. Look at similar existing files
3. Follow the service-specific organization structure
4. When in doubt, ask before creating

---

## ✅ Summary

**Golden Rule**: Keep the root directory clean!

**Remember**:
- Documentation → `/docs`
- Tests → `/tests` or `/__tests__`
- Scripts → `/scripts`
- Configs → service root or `/config`
- Data → `/data`
- Temp → `/temp` (gitignored)

**Never**:
- Create files in root directory (except approved list)
- Scatter files across random locations
- Mix file types in same directory

---

**Policy Effective**: December 4, 2025  
**Mandatory Compliance**: All new development  
**Enforcement**: Strict

