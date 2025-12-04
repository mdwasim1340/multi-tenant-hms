# Quick Reference: File Organization

**🚨 READ THIS BEFORE CREATING ANY FILE 🚨**

---

## ❌ NEVER Create Files Here

```
/ (root directory)
```

**Exception**: Only these files allowed in root:
- `.gitignore`
- `README.md`
- `package.json` (if monorepo)
- `docker-compose.yml`
- `.env.example`
- `LICENSE`

---

## ✅ ALWAYS Create Files Here

### 📄 Documentation Files (*.md)
```
backend/docs/                    # Backend documentation
hospital-management-system/docs/ # Frontend documentation
admin-dashboard/docs/            # Admin dashboard documentation
docs/                            # General documentation
```

### 🧪 Test Files (*.test.*, *.spec.*)
```
backend/tests/                   # Backend tests
hospital-management-system/__tests__/ # Frontend tests
e2e-tests/                       # E2E tests
```

### 📜 Script Files (*.sh, *.ps1, *.js, *.ts)
```
backend/scripts/                 # Backend scripts
hospital-management-system/scripts/ # Frontend scripts
```

### ⚙️ Config Files
```
backend/                         # Backend configs (in service root)
hospital-management-system/      # Frontend configs (in service root)
backend/config/                  # Additional backend configs
```

### 📊 Data Files
```
backend/data/                    # Backend data
production-data/                 # Production data
```

### 🗑️ Temporary Files
```
backend/temp/                    # Backend temp (gitignored)
hospital-management-system/temp/ # Frontend temp (gitignored)
temp_backup/                     # Backups (gitignored)
```

---

## 🎯 Quick Decision Tree

```
Creating a file?
    ↓
Is it documentation? → backend/docs/ or hospital-management-system/docs/
    ↓
Is it a test? → backend/tests/ or hospital-management-system/__tests__/
    ↓
Is it a script? → backend/scripts/ or hospital-management-system/scripts/
    ↓
Is it config? → service root or /config
    ↓
Is it data? → backend/data/ or production-data/
    ↓
Is it temporary? → backend/temp/ or hospital-management-system/temp/
    ↓
Still unsure? → Check FILE_ORGANIZATION_POLICY.md
```

---

## 🚫 Common Mistakes

### ❌ WRONG
```bash
/FEATURE_COMPLETE.md              # Documentation in root
/test-api.js                      # Test in root
/deploy.sh                        # Script in root
backend/test-something.js         # Test in backend root
backend/SOME_DOC.md               # Doc in backend root
```

### ✅ CORRECT
```bash
backend/docs/FEATURE_COMPLETE.md  # Documentation in docs/
backend/tests/integration/test-api.js # Test in tests/
backend/scripts/deployment/deploy.sh  # Script in scripts/
backend/tests/unit/test-something.js  # Test in tests/
backend/docs/SOME_DOC.md          # Doc in docs/
```

---

## 📚 Full Policy

See: [FILE_ORGANIZATION_POLICY.md](FILE_ORGANIZATION_POLICY.md)

---

**Remember**: Keep the root directory clean! 🧹

