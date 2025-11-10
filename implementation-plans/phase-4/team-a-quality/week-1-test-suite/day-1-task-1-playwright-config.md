# Day 1, Task 1: Playwright Configuration

## 🎯 Task Objective
Configure Playwright for comprehensive E2E testing across all browsers with parallel execution and detailed reporting.

## ⏱️ Estimated Time: 1.5 hours

## 📋 Prerequisites
- Phase 3 complete with all features functional
- Node.js 18+ installed
- Access to all three applications (backend, admin, hospital)

---

## 📝 Step 1: Install Playwright and Dependencies

```bash
cd backend
npm install --save-dev @playwright/test @playwright/test-reporter
npx playwright install chromium firefox webkit
```

## 📝 Step 2: Create Playwright Configuration

Create file: `backend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../hospital-management-system && npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../admin-dashboard && npm run dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
```

## 📝 Step 3: Create Test Directory Structure

```bash
mkdir -p tests/e2e/{auth,patients,appointments,medical-records,lab-tests,admin}
mkdir -p tests/e2e/fixtures
mkdir -p tests/e2e/utils
mkdir -p test-results
```

## 📝 Step 4: Create Global Setup

Create file: `backend/tests/e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Check backend health
  try {
    await page.goto('http://localhost:3000/health', { timeout: 60000 });
    console.log('✅ Backend is ready');
  } catch (error) {
    console.error('❌ Backend is not ready:', error);
    throw error;
  }
  
  // Check hospital system health
  try {
    await page.goto('http://localhost:3001', { timeout: 60000 });
    console.log('✅ Hospital system is ready');
  } catch (error) {
    console.error('❌ Hospital system is not ready:', error);
    throw error;
  }
  
  // Check admin dashboard health
  try {
    await page.goto('http://localhost:3002', { timeout: 60000 });
    console.log('✅ Admin dashboard is ready');
  } catch (error) {
    console.error('❌ Admin dashboard is not ready:', error);
    throw error;
  }
  
  await browser.close();
  console.log('✅ Global setup complete');
}

export default globalSetup;
```

## 📝 Step 5: Create Test Environment Configuration

Create file: `backend/tests/e2e/.env.test`

```env
# Test Environment Configuration
NODE_ENV=test
TEST_TENANT_ID=test_tenant_e2e
TEST_USER_EMAIL=test@e2e.com
TEST_USER_PASSWORD=TestPassword123!
TEST_ADMIN_EMAIL=admin@e2e.com
TEST_ADMIN_PASSWORD=AdminPassword123!

# Application URLs
BACKEND_URL=http://localhost:3000
HOSPITAL_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# Test Database
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=multitenant_db_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres

# Test Timeouts
DEFAULT_TIMEOUT=10000
NAVIGATION_TIMEOUT=30000
```

## 📝 Step 6: Update package.json Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",
    "test:e2e:report": "playwright show-report test-results/html"
  }
}
```

## 📝 Step 7: Create Sample Test

Create file: `backend/tests/e2e/sample.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sample E2E Test', () => {
  test('should load hospital management system', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hospital Management/);
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await expect(page).toHaveTitle(/Admin Dashboard/);
  });

  test('should have backend API responding', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
  });
});
```

## ✅ Verification

```bash
# Run sample test
cd backend
npm run test:e2e

# Expected output:
# Running 3 tests using 3 workers
# ✓ Sample E2E Test > should load hospital management system (chromium)
# ✓ Sample E2E Test > should load admin dashboard (chromium)
# ✓ Sample E2E Test > should have backend API responding (chromium)
# 3 passed (5s)

# View test report
npm run test:e2e:report
```

## 📄 Commit

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "test: Configure Playwright for E2E testing

- Add Playwright configuration for all browsers
- Set up parallel execution and reporting
- Create test directory structure
- Add global setup for service health checks
- Add test environment configuration
- Create sample tests to verify setup"
```

## 🔗 Next Task
[Day 1, Task 2: Test Utilities](day-1-task-2-test-utilities.md)

## 📚 Additional Resources
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
