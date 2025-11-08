# Phase 3: Quick Start Guide

**For AI Agents & Human Developers**

---

## 🚀 Getting Started in 5 Minutes

### Step 1: Choose Your Team (30 seconds)

**Team A - Frontend UI** (if you like React/Next.js):
- Build hospital management interface
- Work with Radix UI and Tailwind CSS
- Connect to backend APIs

**Team B - Advanced Features** (if you like backend/Node.js):
- Implement RBAC and permissions
- Build notification system
- Create search and reporting

**Team C - Mobile App** (if you like React Native):
- Build iOS and Android app
- Implement offline sync
- Add push notifications

**Team D - Testing & Quality** (if you like testing/DevOps):
- Write E2E tests
- Optimize performance
- Ensure security

### Step 2: Read Your Team README (2 minutes)

Navigate to your team directory:
```bash
cd implementation-plans/phase-3/team-[a|b|c|d]-[name]/
cat README.md
```

### Step 3: Start Your First Task (2 minutes)

Go to Week 1, Day 1:
```bash
cd week-1-[feature]/
cat day-1-task-1-[name].md
```

### Step 4: Execute the Task (1-3 hours)

Follow the step-by-step instructions in the task file.

### Step 5: Verify & Commit (30 seconds)

Run verification commands and commit with provided message.

---

## 📋 Team A: Frontend UI - Quick Start

### Prerequisites
```bash
# Navigate to hospital management system
cd hospital-management-system

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev  # Runs on http://localhost:3001
```

### Your First Task: Patient List Page
```bash
# Read the task
cat implementation-plans/phase-3/team-a-frontend/week-1-patient-ui/day-1-task-1-patient-list.md

# Create the patient list page
# File: hospital-management-system/app/(dashboard)/patients/page.tsx

# Test it
# Visit: http://localhost:3001/patients

# Commit
git add app/(dashboard)/patients/page.tsx
git commit -m "feat(patients): Add patient list page with table and pagination"
```

### Key Files to Know
- `app/(dashboard)/patients/` - Patient pages
- `components/patients/` - Patient components
- `lib/api/patients.ts` - Patient API calls
- `types/patient.ts` - Patient TypeScript types

---

## 📋 Team B: Advanced Features - Quick Start

### Prerequisites
```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev  # Runs on http://localhost:3000
```

### Your First Task: Permission System Schema
```bash
# Read the task
cat implementation-plans/phase-3/team-b-advanced/week-1-2-rbac/day-1-task-1-permissions-schema.md

# Create migration file
# File: backend/migrations/[timestamp]-create-permissions-system.sql

# Apply migration
node scripts/apply-migration.js

# Verify
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d permissions"

# Commit
git add migrations/[timestamp]-create-permissions-system.sql
git commit -m "feat(rbac): Add permissions system database schema"
```

### Key Files to Know
- `src/services/permission.service.ts` - Permission logic
- `src/middleware/permission.middleware.ts` - Permission checking
- `src/routes/roles.routes.ts` - Role management routes
- `src/types/permission.ts` - Permission types

---

## 📋 Team C: Mobile App - Quick Start

### Prerequisites
```bash
# Install React Native CLI
npm install -g react-native-cli

# Install dependencies
npm install

# For iOS (Mac only)
cd ios && pod install && cd ..

# For Android
# Ensure Android Studio and SDK are installed
```

### Your First Task: Project Setup
```bash
# Read the task
cat implementation-plans/phase-3/team-c-mobile/week-1-2-foundation/day-1-task-1-project-setup.md

# Initialize React Native project
npx react-native init HospitalApp --template react-native-template-typescript

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Commit
git add .
git commit -m "feat(mobile): Initialize React Native project with TypeScript"
```

### Key Files to Know
- `src/navigation/` - Navigation structure
- `src/screens/` - App screens
- `src/services/api.ts` - API integration
- `src/stores/` - State management
- `src/types/` - TypeScript types

---

## 📋 Team D: Testing & Quality - Quick Start

### Prerequisites
```bash
# Navigate to backend
cd backend

# Install testing dependencies
npm install --save-dev @playwright/test k6 jest

# Install Playwright browsers
npx playwright install
```

### Your First Task: E2E Framework Setup
```bash
# Read the task
cat implementation-plans/phase-3/team-d-quality/week-1-2-testing/day-1-task-1-e2e-setup.md

# Create Playwright config
# File: backend/tests/e2e/playwright.config.ts

# Create first test
# File: backend/tests/e2e/auth.spec.ts

# Run tests
npx playwright test

# Commit
git add tests/e2e/
git commit -m "test(e2e): Set up Playwright testing framework"
```

### Key Files to Know
- `tests/e2e/` - End-to-end tests
- `tests/integration/` - Integration tests
- `tests/performance/` - Performance tests
- `tests/security/` - Security tests
- `tests/helpers/` - Test utilities

---

## 🔧 Common Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm test            # Run tests
npx tsc --noEmit    # Check TypeScript errors
```

### Frontend Development
```bash
cd hospital-management-system
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm test           # Run tests
```

### Mobile Development
```bash
cd mobile-app
npm start          # Start Metro bundler
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm test          # Run tests
```

### Testing
```bash
cd backend
npx playwright test              # Run E2E tests
npx jest                        # Run unit tests
k6 run tests/performance/load.js # Run load tests
```

---

## 📊 Daily Workflow

### Morning (Start of Day)
1. Pull latest changes: `git pull origin main`
2. Review your task for the day
3. Set up your development environment
4. Read task instructions thoroughly

### During Development (1-3 hours per task)
1. Follow step-by-step instructions
2. Write code incrementally
3. Test as you go
4. Ask for help if blocked

### End of Task (30 minutes)
1. Run verification commands
2. Test thoroughly
3. Commit with provided message
4. Push to repository
5. Mark task as complete

### End of Day
1. Review what you accomplished
2. Note any blockers or questions
3. Plan next day's tasks
4. Update progress tracking

---

## 🆘 Getting Help

### If You're Stuck
1. **Re-read the task instructions** - Often the answer is there
2. **Check the backend docs** - `backend/docs/` has API documentation
3. **Review similar code** - Look at existing implementations
4. **Check steering guidelines** - `.kiro/steering/` has best practices
5. **Ask for help** - Document your blocker and ask coordinator

### Common Issues

**Issue**: TypeScript errors
**Solution**: Run `npx tsc --noEmit` to see all errors, fix one by one

**Issue**: API not responding
**Solution**: Check backend is running on port 3000, check network tab

**Issue**: Database connection error
**Solution**: Ensure PostgreSQL is running, check `.env` file

**Issue**: Tests failing
**Solution**: Read test output carefully, check test data setup

**Issue**: Mobile app not building
**Solution**: Clear cache (`npm start -- --reset-cache`), reinstall pods (iOS)

---

## ✅ Success Checklist

### Before Starting
- [ ] Development environment set up
- [ ] Backend running (if needed)
- [ ] Frontend running (if needed)
- [ ] Task instructions read
- [ ] Dependencies installed

### During Development
- [ ] Following task instructions
- [ ] Testing incrementally
- [ ] Code compiling without errors
- [ ] No console errors
- [ ] Following code style guidelines

### Before Committing
- [ ] All verification commands pass
- [ ] Code tested manually
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Commit message matches provided message

### After Committing
- [ ] Changes pushed to repository
- [ ] Task marked as complete
- [ ] Next task identified
- [ ] Any blockers documented

---

## 🎯 Tips for Success

### For AI Agents
1. **Read carefully** - Task instructions are detailed and complete
2. **Follow exactly** - Don't skip steps or improvise
3. **Test thoroughly** - Run all verification commands
4. **Commit properly** - Use exact commit messages provided
5. **Move sequentially** - Complete tasks in order

### For Human Developers
1. **Understand the context** - Review Phase 1 and 2 completion
2. **Follow patterns** - Look at existing code for examples
3. **Test early and often** - Don't wait until the end
4. **Ask questions** - Better to ask than to guess
5. **Document issues** - Help improve the process

### For Everyone
1. **Quality over speed** - Better to do it right than fast
2. **Test everything** - Assume nothing works until tested
3. **Communicate blockers** - Don't stay stuck
4. **Learn from others** - Review other teams' work
5. **Celebrate progress** - Acknowledge completed tasks

---

## 📈 Progress Tracking

### Daily
- Tasks completed: __/4
- Tests passing: __/%
- Blockers: __

### Weekly
- Week __/8 complete
- Team milestones achieved: __/%
- Integration points coordinated: __

### Phase 3
- Overall progress: __/160 tasks
- Quality metrics: __/%
- On track for completion: Yes/No

---

## 🎉 You're Ready!

You now have everything you need to start Phase 3 development. Pick your team, read your first task, and start building!

**Remember**: 
- Take it one task at a time
- Test thoroughly
- Ask for help when needed
- Celebrate your progress

**Good luck! Let's build something amazing! 🚀**

---

**Quick Links**:
- [Phase 3 Overview](./PHASE3_OVERVIEW.md)
- [Daily Task Breakdown](./DAILY_TASK_BREAKDOWN.md)
- [Team Coordination](./TEAM_COORDINATION.md)
- [Backend API Docs](../../backend/docs/)
