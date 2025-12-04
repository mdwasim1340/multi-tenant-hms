# Development Rules & Best Practices

**Consolidates**: Global_Rules.md, anti-duplication-guidelines.md, testing.md

## 🚨 CRITICAL: File Organization Policy

**BEFORE creating ANY file, read**: [FILE_ORGANIZATION_POLICY.md](FILE_ORGANIZATION_POLICY.md)

### Golden Rules:
- ❌ **NEVER** create files in root directory (except approved list)
- ✅ Documentation → `backend/docs/` or `hospital-management-system/docs/`
- ✅ Tests → `backend/tests/` or `hospital-management-system/__tests__/`
- ✅ Scripts → `backend/scripts/` or `hospital-management-system/scripts/`
- ✅ Configs → service root or `/config` directory

**Violation of file organization policy will result in immediate rejection.**

---

## 🚨 CRITICAL: Anti-Duplication Rules

### Before Creating ANYTHING
```bash
# 1. Search for existing implementations
find . -name "*component-name*" -type f
grep -r "function-name" --include="*.ts" --include="*.tsx"

# 2. Check legacy cleanup summaries
cat backend/docs/LEGACY_CLEANUP_SUMMARY.md

# 3. Verify no duplicates in different directories
ls -la admin-dashboard/components/
ls -la hospital-management-system/components/
ls -la backend/src/routes/
```

### Single Source of Truth Principle
- Each feature has EXACTLY ONE implementation
- If replacement needed: Remove old → Create new → Update references
- Document all removals in cleanup summaries
- Update all imports and references

### Recent Issues Fixed (Nov 14, 2025)
1. **Duplicate Imports** ✅ - Same middleware imported twice
2. **CSV Export Headers** ✅ - Using both `res.write()` and `res.send()`
3. **Type Compatibility** ✅ - Zod allows `null` but TypeScript doesn't
4. **Type Inference** ✅ - Missing explicit type annotations

## Code Quality Standards

### TypeScript Rules
```typescript
// ✅ CORRECT: Strict mode, no 'any'
interface User {
  id: number;
  name: string;
  email?: string | null;  // Match Zod schema exactly
}

// ❌ WRONG: Using 'any'
const data: any = response.data;

// ✅ CORRECT: Proper typing
const data: ApiResponse = response.data;
```

### Nullable Field Handling
```typescript
// Zod schema
const schema = z.object({
  field: z.string().optional().nullable()  // string | undefined | null
});

// TypeScript interface (MUST match)
interface Data {
  field?: string | null;  // Not just string | undefined
}
```

### Safe Property Access
```typescript
// ❌ DANGEROUS
{role.permissions.map(p => <div>{p}</div>)}

// ✅ SAFE
{(role.permissions || []).map(p => <div>{p}</div>)}

// ✅ EVEN BETTER
const permissions = role.permissions || getDefaultPermissions(role.name);
{permissions.map(p => <div>{p}</div>)}
```

### Response Method Conflicts
```typescript
// ❌ WRONG: Multiple response methods
res.write('\uFEFF');
res.send(csv);  // Error: headers already sent

// ✅ CORRECT: Single response
res.send('\uFEFF' + csv);
```

## File Placement Rules

### Backend
```
backend/src/
├── middleware/     # Auth, tenant, error handlers
├── routes/         # API endpoints (thin controllers)
├── services/       # Business logic
├── types/          # TypeScript definitions
└── validation/     # Zod schemas
```

### Frontend
```
hospital-management-system/
├── app/            # Next.js pages
├── components/     # React components
├── hooks/          # Custom hooks
└── lib/            # API clients, utilities
```

### Naming Conventions
- **Backend files**: `kebab-case.ts`
- **Frontend components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`
- **Types**: `PascalCase` interfaces
- **Constants**: `UPPER_SNAKE_CASE`

## Testing Strategy

### Test Organization
```
backend/tests/
├── SYSTEM_STATUS_REPORT.js          # Overall health (90% success)
├── test-final-complete.js           # Full integration
├── test-cognito-direct.js           # Auth testing
├── test-s3-direct.js                # S3 testing
├── test-forgot-password-complete.js # Email testing
└── test-*.js                        # Component tests
```

### Running Tests
```bash
# System health check
cd backend && node tests/SYSTEM_STATUS_REPORT.js

# Full integration test
node tests/test-final-complete.js

# Specific component
node tests/test-s3-direct.js
node tests/test-cognito-direct.js
```

### Test Coverage Requirements
- Unit tests for services
- Integration tests for APIs
- Frontend component tests
- Multi-tenant isolation tests
- E2E tests for critical flows

### Success Indicators
- ✅ Green checkmarks = working functionality
- ⚠️ Yellow warnings = configuration needed
- ❌ Red X marks = failing functionality
- 🎉 System ready when all core tests pass

## Error Handling Patterns

### Backend
```typescript
// ✅ CORRECT: Consistent error format
try {
  const result = await service.doSomething();
  res.json({ data: result });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Failed to process request',
    code: 'OPERATION_FAILED',
    timestamp: new Date().toISOString()
  });
}
```

### Frontend
```typescript
// ✅ CORRECT: User-friendly error handling
try {
  const response = await api.get('/api/data');
  setData(response.data);
} catch (error) {
  console.error('API Error:', error);
  toast.error('Failed to load data. Please try again.');
  setData([]);  // Fallback to empty state
}
```

## Input Validation

### Backend (Zod)
```typescript
import { z } from 'zod';

const PatientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Validate request
const validated = PatientSchema.parse(req.body);
```

### Frontend (React Hook Form + Zod)
```typescript
const form = useForm({
  resolver: zodResolver(PatientSchema),
  defaultValues: {
    first_name: '',
    last_name: '',
    email: null  // Match backend nullable fields
  }
});
```

## Security Best Practices

### SQL Injection Prevention
```typescript
// ❌ WRONG: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRECT: Parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

### XSS Prevention
```typescript
// ✅ React automatically escapes
<div>{userInput}</div>

// ⚠️ Dangerous (only if absolutely necessary)
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

### Environment Variables
```typescript
// ❌ NEVER commit .env files
// ✅ Use .env.example as template
// ✅ Validate required vars on startup

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

## Code Style

### Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Import Organization
```typescript
// 1. External libraries
import express from 'express';
import { z } from 'zod';

// 2. Internal services
import { authService } from './services/auth';

// 3. Types
import type { User } from './types';

// 4. Relative imports
import { helper } from './utils';
```

## Common Pitfalls to Avoid

### 1. Assumption-Based Development
```typescript
// ❌ WRONG: Assuming API structure
interface Role {
  permissions: string[];  // Assumed this exists
}

// ✅ CORRECT: Test API first, then create interface
interface Role {
  id: number;
  name: string;
  description: string;
  // permissions not in API response
}
```

### 2. Unsafe Property Access
```typescript
// ❌ WRONG
data.users.map(user => user.profile.avatar.url)

// ✅ CORRECT
data.users?.map(user => user.profile?.avatar?.url || '/default.png')
```

### 3. Mixed HTTP Client Patterns
```typescript
// ❌ WRONG: Mixing fetch and axios
const response = await axios.get('/api/data');
if (response.ok) { ... }  // axios doesn't have 'ok'

// ✅ CORRECT: Use axios patterns
if (response.status === 200 && response.data) { ... }
```

### 4. Hardcoded Values
```typescript
// ❌ WRONG
const tenantId = 'tenant_123';

// ✅ CORRECT
const tenantId = Cookies.get('tenant_id');
```

## Development Workflow

### Before Making Changes
1. Run system health check
2. Check current documentation
3. Understand tenant isolation requirements
4. Search for existing implementations

### After Making Changes
1. Test affected components
2. Run integration tests
3. Update documentation
4. Verify multi-tenant isolation
5. Check TypeScript compilation
6. Run linter

### Commit Messages
```bash
# Format: type(scope): description

feat(patients): Add CSV export with UTF-8 BOM
fix(auth): Resolve duplicate import error
docs(steering): Update development guidelines
refactor(api): Consolidate duplicate endpoints
test(patients): Add filtering test cases
```

## Performance Guidelines

### Database Queries
- Use indexes on foreign keys
- Limit result sets with pagination
- Use connection pooling
- Avoid N+1 queries

### Frontend
- Lazy load components
- Implement virtual scrolling for large lists
- Debounce search inputs
- Cache API responses when appropriate

### API
- Implement rate limiting
- Use compression for responses
- Return only necessary fields
- Implement proper caching headers

## Debugging Procedures

### When Frontend Shows Errors
1. Check browser console
2. Verify API response structure
3. Check network tab for failed requests
4. Verify authentication headers
5. Test API endpoint directly with curl

### When Backend Shows Errors
1. Check backend terminal logs
2. Verify database connection
3. Check tenant context
4. Verify middleware chain
5. Test with Postman/curl

### When Tests Fail
1. Read error message carefully
2. Check recent code changes
3. Verify environment variables
4. Check database state
5. Run tests in isolation

## Success Checklist

Before marking work complete:
- [ ] No duplicate implementations
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Multi-tenant isolation verified
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Changes committed with clear message

---

**For security rules**: See `multi-tenant-security.md`  
**For API patterns**: See `api-integration.md`  
**For team tasks**: See `team-missions.md`
