# Phase 2: AI-Agent Execution Guide

## 🎯 Overview

Phase 2 implements hospital operations features through **250+ small, executable tasks** designed specifically for AI agents. Each task takes 1-3 hours and includes complete code examples, verification steps, and commit messages.

## 📋 Task Structure

### Master Task Index
**Location**: `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`

This file contains the complete index of all Phase 2 tasks organized by:
- Team (A: Backend, B: Frontend, C: Advanced, D: Testing)
- Week (1-4)
- Day (1-5)
- Task (1-4 per day)

### Task File Format
Each task file includes:
1. **Objective**: What to build
2. **Estimated Time**: 1-3 hours
3. **Prerequisites**: What must be done first
4. **Step-by-Step Instructions**: Detailed implementation guide
5. **Complete Code**: Full file contents (not snippets)
6. **Verification**: Commands to test your work
7. **Commit Message**: What to commit

## 🤖 AI-Agent Workflow

### Step 1: Select Task
```bash
# Read the master index
cat implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md

# Choose a task based on:
# - Your team assignment (A, B, C, or D)
# - Current week and day
# - Prerequisites completed
# - No blocking dependencies
```

### Step 2: Read Task File
```bash
# Example: Team A, Week 1, Day 2, Task 1
cat implementation-plans/phase-2/team-a-backend/week-1-patient-management/day-2-task-1-typescript-models.md
```

### Step 3: Execute Task
Follow the step-by-step instructions:
1. Create files in specified locations
2. Copy provided code (complete, not snippets)
3. Run verification commands
4. Fix any errors
5. Verify success

### Step 4: Commit Changes
```bash
# Use the provided commit message
git add [files]
git commit -m "[provided message]"
git push
```

### Step 5: Mark Complete
Update the task tracking document or notify coordinator.

### Step 6: Next Task
Move to the next task in sequence or pick another independent task.

## 👥 Team Organization

### Team A: Backend Development
**Focus**: Hospital management APIs
**Weeks**:
- Week 1: Patient Management (database, API, tests)
- Week 2: Appointment Management (scheduling, calendar)
- Week 3: Medical Records (clinical documentation)
- Week 4: Lab Tests & Clinical Data

**Task Location**: `implementation-plans/phase-2/team-a-backend/`

### Team B: Frontend Development
**Focus**: Hospital management UIs
**Weeks**:
- Week 1: Patient UI (forms, list, details)
- Week 2: Appointment UI (calendar, scheduling)
- Week 3: Medical Records UI (documentation, history)
- Week 4: Integration & Polish

**Task Location**: `implementation-plans/phase-2/team-b-frontend/`

### Team C: Advanced Features
**Focus**: RBAC, analytics, notifications, search
**Weeks**:
- Week 1: RBAC System (permissions, audit logging)
- Week 2: Analytics (reporting, dashboards)
- Week 3: Notifications (email, SMS, in-app)
- Week 4: Search (full-text, filtering)

**Task Location**: `implementation-plans/phase-2/team-c-advanced/`

### Team D: Testing & Quality
**Focus**: Comprehensive testing
**Weeks**:
- Week 1: E2E Testing Framework
- Week 2: Performance Testing
- Week 3: Security Testing
- Week 4: UAT & Production Readiness

**Task Location**: `implementation-plans/phase-2/team-d-testing/`

## 🔄 Coordination Points

### Daily Coordination
- **Morning**: Announce which tasks you're starting
- **During**: Commit changes with provided messages
- **Evening**: Report completed tasks and any blockers

### Integration Points
Some tasks require coordination between teams:

**Backend → Frontend Integration**:
- Team A completes API endpoints
- Team B implements UI consuming those APIs
- Coordinate on data contracts and error handling

**Advanced Features Integration**:
- Team C builds on Team A's APIs
- Team C provides features for Team B's UIs
- Coordinate on permissions and data access

**Testing Integration**:
- Team D tests all teams' work
- Coordinate on test data and scenarios
- Report bugs back to respective teams

## 📊 Progress Tracking

### Task Status
- **Not Started**: Task file exists but not begun
- **In Progress**: AI agent currently working on it
- **Blocked**: Waiting for dependency or issue resolution
- **Complete**: Verified and committed
- **Reviewed**: Code reviewed and approved

### Tracking Methods
1. **Git Commits**: Each task has specific commit message
2. **Task Files**: Mark status in task file header
3. **Tracking Document**: Central progress tracker
4. **Daily Standups**: Report progress to coordinator

## ✅ Verification Standards

### Every Task Must Include
- [ ] Code compiles without errors
- [ ] All verification commands pass
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Tests pass (if tests included)
- [ ] Changes committed with provided message

### Additional Checks
- [ ] Code follows project conventions
- [ ] No hardcoded values (use environment variables)
- [ ] Proper error handling implemented
- [ ] Multi-tenant isolation maintained
- [ ] Security best practices followed

## 🚨 Common Issues & Solutions

### Issue: Task Dependencies Not Met
**Solution**: Check prerequisites section, complete required tasks first

### Issue: Verification Commands Fail
**Solution**: Review code carefully, check for typos, ensure all files created

### Issue: TypeScript Errors
**Solution**: Verify all imports, check type definitions, ensure interfaces match

### Issue: Database Connection Errors
**Solution**: Check `.env` file, verify PostgreSQL running, test connection

### Issue: API Integration Errors
**Solution**: Verify backend running, check API endpoints, test with curl

### Issue: Merge Conflicts
**Solution**: Pull latest changes, resolve conflicts, re-run verification

## 📖 Example Task Execution

### Example: Day 2, Task 1 - TypeScript Models

**1. Read Task File**
```bash
cat implementation-plans/phase-2/team-a-backend/week-1-patient-management/day-2-task-1-typescript-models.md
```

**2. Create File**
```bash
# Create: backend/src/types/patient.ts
# Copy complete code from task file (100+ lines)
```

**3. Verify**
```bash
cd backend
npx tsc --noEmit  # Should show no errors
```

**4. Commit**
```bash
git add src/types/patient.ts
git commit -m "feat(patient): Add TypeScript interfaces and types"
git push
```

**5. Mark Complete**
Update tracking document: Day 2, Task 1 ✅ Complete

**6. Next Task**
Move to Day 2, Task 2 (Zod Validation)

## 🎯 Success Metrics

### Individual Task Success
- Task completed in estimated time (1-3 hours)
- All verification checks pass
- Code committed with provided message
- No blocking issues for other tasks

### Daily Success
- 4 tasks completed (6-8 hours total)
- All daily objectives met
- Integration points coordinated
- Progress documented

### Weekly Success
- All week's tasks completed
- Feature fully functional
- Tests passing
- Documentation updated

### Phase 2 Success
- All 250+ tasks completed
- All features operational
- All tests passing
- System ready for production

## 📚 Additional Resources

### Quick Reference
- **Master Index**: `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`
- **Quick Start**: `implementation-plans/phase-2/QUICK_START_GUIDE.md`
- **Coordination**: `implementation-plans/phase-2/TEAM_COORDINATION.md`

### Team Directories
- **Team A**: `implementation-plans/phase-2/team-a-backend/`
- **Team B**: `implementation-plans/phase-2/team-b-frontend/`
- **Team C**: `implementation-plans/phase-2/team-c-advanced/`
- **Team D**: `implementation-plans/phase-2/team-d-testing/`

### Support
- **Steering Files**: `.kiro/steering/` (this directory)
- **Database Docs**: `backend/docs/database-schema/`
- **API Docs**: `backend/docs/`
- **Test Scripts**: `backend/tests/`

## 🎉 Getting Started

### For AI Agents
1. Read this guide completely
2. Review the master task index
3. Choose your team assignment
4. Start with Week 1, Day 1, Task 1
5. Follow the workflow above
6. Coordinate with other agents

### For Human Coordinators
1. Assign teams to AI agents
2. Monitor progress through commits
3. Review completed work
4. Coordinate integration points
5. Resolve blocking issues
6. Track overall progress

---

**Phase 2 Status**: Ready for AI Agent Execution
**Total Tasks**: 250+ (organized by team, week, day)
**Task Size**: 1-3 hours each
**Execution Model**: Independent, parallel, coordinated
**Success Rate Target**: >95% task completion
