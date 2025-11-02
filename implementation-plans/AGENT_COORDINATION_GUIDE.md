# AI Agent Coordination Guide

## Purpose
This guide helps AI agents work together efficiently on the multi-tenant hospital management system without conflicts or duplicated effort.

## Core Principles

### 1. Self-Contained Work
Each implementation plan is designed to be self-contained with:
- Clear objectives and success criteria
- Explicit dependencies listed upfront
- Validation checkpoints throughout
- Comprehensive testing requirements

### 2. Dependency Management
Before starting any task:
- ✅ Verify all dependencies are complete
- ✅ Check current system state
- ✅ Confirm no other agent is working on conflicting features
- ✅ Review related documentation

### 3. Communication Protocol
- **Daily Updates:** Update your plan file with progress markers
- **Blocking Issues:** Document immediately in plan file with `[!]` marker
- **Completion:** Mark tasks complete with `[✓]` and run validation tests
- **Questions:** Use `[?]` marker and document in plan file

## Work Assignment Strategy

### Phase 1 (Weeks 1-4) - Foundation

#### Week 1: Independent Tracks
**No dependencies - can start immediately**

| Agent | Task | File | Status |
|-------|------|------|--------|
| A1 | Subscription Tier System | phase-1-foundation/backend/A1-subscription-tier-system.md | [ ] |
| A3 | Backup System | phase-1-foundation/backend/A3-backup-system.md | [ ] |
| C1 | Real-time Infrastructure | phase-1-foundation/backend/C1-realtime-infrastructure.md | [ ] |

**Coordination:** These agents can work completely independently.

#### Week 2: Dependent Tracks
**Requires A1 complete**

| Agent | Task | Dependencies | File | Status |
|-------|------|--------------|------|--------|
| A2 | Usage Tracking | A1 | phase-1-foundation/backend/A2-usage-tracking.md | [ ] |
| B1 | Custom Fields Engine | A1 | phase-1-foundation/shared/B1-custom-fields-engine.md | [ ] |
| D1 | Tenant Management UI | A1 | phase-1-foundation/admin-dashboard/D1-tenant-management.md | [ ] |

**Coordination:** Wait for A1 to mark complete and pass validation tests.

#### Week 3: UI and Analytics
**Requires various dependencies**

| Agent | Task | Dependencies | File | Status |
|-------|------|--------------|------|--------|
| B2 | Custom Fields UI | B1 | phase-1-foundation/shared/B2-custom-fields-ui.md | [ ] |
| C2 | Analytics Dashboard | C1, A2 | phase-1-foundation/admin-dashboard/C2-analytics-dashboard.md | [ ] |
| D2 | Billing Interface | A2 | phase-1-foundation/admin-dashboard/D2-billing-interface.md | [ ] |
| H1 | Tier Restrictions | A1 | phase-1-foundation/hospital-system/H1-tier-restrictions.md | [ ] |

**Coordination:** Multiple agents working on different apps - minimal conflicts.

#### Week 4: Integration and Testing
**Requires most Phase 1 features complete**

| Agent | Task | Dependencies | File | Status |
|-------|------|--------------|------|--------|
| H2 | Custom Fields Integration | B1, B2 | phase-1-foundation/hospital-system/H2-custom-fields-integration.md | [ ] |
| INT1 | Phase 1 Integration Testing | All Phase 1 | phase-1-foundation/testing/integration-tests.md | [ ] |

## Conflict Prevention

### Database Changes
**Rule:** Only one agent should modify database schema at a time.

**Process:**
1. Agent announces database changes in coordination channel
2. Other agents pause database-related work
3. Agent completes changes and validates
4. Agent announces completion
5. Other agents can resume

**Example:**
```
Agent A1: "🔒 Starting database changes for subscription_tiers table"
[Other agents wait]
Agent A1: "✅ Database changes complete and validated"
[Other agents resume]
```

### Shared Files
**Rule:** Avoid modifying the same files simultaneously.

**Files with High Conflict Risk:**
- `backend/src/index.ts` (main app file)
- `backend/src/types/*.ts` (shared types)
- `backend/src/middleware/*.ts` (shared middleware)

**Process:**
1. Check if file is being modified by another agent
2. If yes, coordinate timing or work on different sections
3. Use clear comments to mark your changes
4. Test thoroughly after integration

### API Routes
**Rule:** Each agent owns their routes completely.

**Route Ownership:**
- `/api/subscriptions` → Agent A1
- `/api/usage` → Agent A2
- `/api/custom-fields` → Agent B1
- `/api/analytics` → Agent C2
- `/api/tenants` → Agent D1

**No conflicts expected** - each agent has separate route files.

## Progress Tracking

### Status Markers
Use these in your implementation plan files:

- `[ ]` Not started
- `[→]` In progress (add your agent ID: `[→ A1]`)
- `[✓]` Completed and validated
- `[!]` Blocked (explain why in notes)
- `[?]` Needs clarification (document question)

### Daily Update Format
Add to your plan file:

```markdown
## Progress Log

### 2025-11-03 (Agent A1)
- [✓] Step 1: Database schema created
- [→] Step 2: TypeScript types (50% complete)
- [ ] Step 3: Service layer

**Blockers:** None
**Notes:** Database validation passed all tests
```

## Validation Requirements

### Before Marking Complete
Every agent must:

1. **Run All Tests**
   ```bash
   # Your specific test file
   node backend/tests/test-your-feature.js
   
   # Integration tests if applicable
   node backend/tests/test-integration.js
   ```

2. **Verify Database State**
   ```bash
   # Check tables exist
   docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
   
   # Verify data integrity
   docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM your_table LIMIT 5;"
   ```

3. **Test API Endpoints**
   ```bash
   # Test with curl or Postman
   curl -X GET http://localhost:3000/api/your-endpoint \
     -H "Authorization: Bearer token" \
     -H "X-Tenant-ID: tenant_id"
   ```

4. **Check Multi-Tenant Isolation**
   ```bash
   # Test with different tenant IDs
   # Verify no cross-tenant data leakage
   ```

5. **Update Documentation**
   - Update your implementation plan with completion notes
   - Document any deviations from original plan
   - Add any important learnings or gotchas

## Integration Testing

### Phase Completion Checkpoints

#### Phase 1 Checkpoint (Week 4)
**All agents participate in integration testing**

**Test Scenarios:**
1. Create new tenant with subscription tier
2. Track usage across multiple features
3. Create custom fields and use them
4. View real-time analytics
5. Test backup and restore
6. Verify tier restrictions work

**Success Criteria:**
- All features work together seamlessly
- No cross-tenant data leakage
- Performance meets requirements
- All tests pass

### Integration Test Coordination

**Process:**
1. All Phase 1 agents mark their work complete
2. Integration test agent (INT1) begins testing
3. If issues found, relevant agent fixes
4. Re-test until all pass
5. Phase 1 officially complete

## Communication Channels

### Implementation Plan Files
**Primary communication method**
- Update your plan file with progress
- Other agents check plan files for status
- Clear, asynchronous communication

### Coordination Notes
**For cross-agent communication**
- Add notes in `implementation-plans/coordination-notes.md`
- Tag relevant agents
- Document decisions and agreements

### Blocking Issues
**For urgent problems**
- Mark task as `[!]` in plan file
- Document issue clearly
- Tag dependent agents
- Propose solution if possible

## Best Practices

### 1. Start with Verification
Always verify current state before starting:
```bash
# Check what exists
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"

# Check current code
cat backend/src/index.ts

# Run existing tests
node backend/tests/test-existing-feature.js
```

### 2. Work Incrementally
- Complete one step fully before moving to next
- Test after each step
- Commit working code frequently
- Don't leave broken code

### 3. Document as You Go
- Update plan file after each step
- Add comments to complex code
- Document any deviations from plan
- Note any issues for future agents

### 4. Test Thoroughly
- Unit test your code
- Integration test with existing features
- Test with multiple tenants
- Test error scenarios
- Test edge cases

### 5. Clean Up
- Remove debug code
- Remove unused imports
- Format code consistently
- Remove temporary files

## Troubleshooting

### "My dependency isn't complete"
1. Check the dependency's plan file for status
2. If marked complete, verify by running their tests
3. If not complete, work on something else or help them
4. Don't start until dependency is truly ready

### "Another agent is modifying my file"
1. Check coordination notes
2. Communicate with other agent
3. Work on different section or different file
4. Merge changes carefully when both done

### "Tests are failing"
1. Check if your changes broke existing functionality
2. Review recent changes by other agents
3. Verify database state is correct
4. Check for environment issues
5. Ask for help if stuck

### "I found a bug in another agent's work"
1. Document the bug clearly
2. Add note to their plan file
3. If blocking you, mark your task as `[!]`
4. Propose a fix if possible
5. Coordinate on resolution

## Success Metrics

### Individual Agent Success
- All tasks marked `[✓]`
- All tests passing
- No blocking issues
- Documentation complete
- Code reviewed and clean

### Team Success
- All phase tasks complete
- Integration tests passing
- No cross-agent conflicts
- Good communication maintained
- Timeline met or explained

## Quick Reference

### Starting a New Task
1. ✅ Read implementation plan thoroughly
2. ✅ Verify dependencies complete
3. ✅ Check current system state
4. ✅ Mark task as `[→ YourID]`
5. ✅ Begin work incrementally

### Completing a Task
1. ✅ Run all tests
2. ✅ Verify database state
3. ✅ Test API endpoints
4. ✅ Update documentation
5. ✅ Mark task as `[✓]`
6. ✅ Announce completion

### Daily Routine
1. Update your plan file with progress
2. Check dependent agents' progress
3. Review coordination notes
4. Test your work
5. Document any issues

This coordination guide ensures smooth collaboration between AI agents working on different parts of the system simultaneously.
