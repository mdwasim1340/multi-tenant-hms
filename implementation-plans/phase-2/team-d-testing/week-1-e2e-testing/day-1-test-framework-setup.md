# Team D Week 1 Day 1: Test Framework Setup

## 🎯 Objective
Set up comprehensive end-to-end testing framework with Playwright, test data management, and CI/CD integration.

**Duration**: 8 hours | **Difficulty**: Medium

---

## 📋 Tasks Overview

### Task 1: Testing Framework Setup (2 hours)
Install and configure Playwright for E2E testing

### Task 2: Test Environment Configuration (2 hours)
Set up test databases and environment isolation

### Task 3: Test Data Management (2 hours)
Create test data fixtures and seeding scripts

### Task 4: CI/CD Integration (2 hours)
Integrate tests with GitHub Actions/CI pipeline

---

## 📝 Task 1: Testing Framework Setup (2 hours)

### Playwright Installation & Configuration

Create `e2e-tests/package.json`:

```json
{
  "name": "hospital-management-e2e-tests",
  "version": "1.0.0",
  "description": "End-to-end tests for hospital management system",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

Create `e2e-tests/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
      command: 'cd ../backend && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../admin-dashboard && npm run dev',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../hospital-management-system && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### Base Test Classes

Create `e2e-tests/tests/base/base-test.ts`:

```typescript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { PatientsPage } from '../pages/patients-page';
import { AppointmentsPage } from '../pages/appointments-page';

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  patientsPage: PatientsPage;
  appointmentsPage: AppointmentsPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  patientsPage: async ({ page }, use) => {
    await use(new PatientsPage(page));
  },
  appointmentsPage: async ({ page }, use) => {
    await use(new AppointmentsPage(page));
  },
});

export { expect };
```

### Page Object Models

Create `e2e-tests/tests/pages/login-page.ts`:

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin() {
    await this.login('admin@test.com', 'password123');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsDoctor() {
    await this.login('doctor@test.com', 'password123');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsNurse() {
    await this.login('nurse@test.com', 'password123');
    await this.page.waitForURL('/dashboard');
  }
}
```

Create `e2e-tests/tests/pages/dashboard-page.ts`:

```typescript
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly patientsCard: Locator;
  readonly appointmentsCard: Locator;
  readonly medicalRecordsCard: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.patientsCard = page.locator('[data-testid="patients-card"]');
    this.appointmentsCard = page.locator('[data-testid="appointments-card"]');
    this.medicalRecordsCard = page.locator('[data-testid="medical-records-card"]');
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]');
  }

  async navigateToPatients() {
    await this.page.click('[data-testid="nav-patients"]');
    await this.page.waitForURL('**/patients');
  }

  async navigateToAppointments() {
    await this.page.click('[data-testid="nav-appointments"]');
    await this.page.waitForURL('**/appointments');
  }

  async navigateToMedicalRecords() {
    await this.page.click('[data-testid="nav-medical-records"]');
    await this.page.waitForURL('**/medical-records');
  }

  async navigateToAnalytics() {
    await this.page.click('[data-testid="nav-analytics"]');
    await this.page.waitForURL('**/analytics');
  }
}
```

---

## 📝 Task 2: Test Environment Configuration (2 hours)

### Environment Configuration

Create `e2e-tests/.env.test`:

```env
# Test Environment Configuration
BASE_URL=http://localhost:3002
API_BASE_URL=http://localhost:3000
HOSPITAL_APP_URL=http://localhost:3001

# Test Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multitenant_db_test
DB_USER=postgres
DB_PASSWORD=postgres

# Test Tenant
TEST_TENANT_ID=test_e2e_tenant
TEST_ADMIN_EMAIL=admin@e2etest.com
TEST_ADMIN_PASSWORD=TestPassword123!

# AWS Test Configuration (use localstack or test accounts)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=test-hospital-files

# Test Users
DOCTOR_EMAIL=doctor@e2etest.com
DOCTOR_PASSWORD=TestPassword123!
NURSE_EMAIL=nurse@e2etest.com
NURSE_PASSWORD=TestPassword123!
```

### Test Database Setup

Create `e2e-tests/scripts/setup-test-db.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupTestDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up test database...');

    // Create test database if it doesn't exist
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${process.env.DB_NAME}' AND pid <> pg_backend_pid()
    `);

    await client.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);

    console.log(`Test database ${process.env.DB_NAME} created successfully`);

    // Connect to the new test database
    const testPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const testClient = await testPool.connect();

    // Run migrations on test database
    console.log('Running migrations on test database...');
    // This would run the same migrations as the main database
    // You can copy migration files or run them programmatically

    testClient.release();
    await testPool.end();

  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestDatabase()
  .then(() => {
    console.log('Test database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test database setup failed:', error);
    process.exit(1);
  });
```

### Test Environment Utilities

Create `e2e-tests/tests/utils/test-environment.ts`:

```typescript
import { Pool } from 'pg';

export class TestEnvironment {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  async setupTestTenant() {
    const client = await this.pool.connect();
    
    try {
      // Create test tenant
      await client.query(`
        INSERT INTO tenants (id, name, status, subscription_tier)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          subscription_tier = EXCLUDED.subscription_tier
      `, [
        process.env.TEST_TENANT_ID,
        'E2E Test Hospital',
        'active',
        'enterprise'
      ]);

      // Create tenant schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${process.env.TEST_TENANT_ID}"`);

      // Create test users
      await this.createTestUsers(client);

      console.log('Test tenant setup completed');
    } finally {
      client.release();
    }
  }

  private async createTestUsers(client: any) {
    const users = [
      {
        email: process.env.TEST_ADMIN_EMAIL,
        name: 'Test Admin',
        role: 'Admin',
        password: process.env.TEST_ADMIN_PASSWORD
      },
      {
        email: process.env.DOCTOR_EMAIL,
        name: 'Test Doctor',
        role: 'Doctor',
        password: process.env.DOCTOR_PASSWORD
      },
      {
        email: process.env.NURSE_EMAIL,
        name: 'Test Nurse',
        role: 'Nurse',
        password: process.env.NURSE_PASSWORD
      }
    ];

    for (const user of users) {
      // Create user (this would integrate with your actual user creation logic)
      await client.query(`
        INSERT INTO users (email, name, tenant_id, password_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          tenant_id = EXCLUDED.tenant_id
      `, [
        user.email,
        user.name,
        process.env.TEST_TENANT_ID,
        'hashed_password' // In real implementation, hash the password
      ]);
    }
  }

  async cleanupTestData() {
    const client = await this.pool.connect();
    
    try {
      // Clean up test data
      await client.query(`DELETE FROM users WHERE tenant_id = $1`, [process.env.TEST_TENANT_ID]);
      await client.query(`DROP SCHEMA IF EXISTS "${process.env.TEST_TENANT_ID}" CASCADE`);
      await client.query(`DELETE FROM tenants WHERE id = $1`, [process.env.TEST_TENANT_ID]);
      
      console.log('Test data cleanup completed');
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
```

---

## 📝 Task 3: Test Data Management (2 hours)

### Test Data Fixtures

Create `e2e-tests/tests/fixtures/test-data.ts`:

```typescript
export const testPatients = [
  {
    patient_number: 'E2E001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@test.com',
    phone: '555-0101',
    date_of_birth: '1985-01-15',
    gender: 'male',
    address: '123 Test Street, Test City, TC 12345'
  },
  {
    patient_number: 'E2E002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@test.com',
    phone: '555-0102',
    date_of_birth: '1990-05-20',
    gender: 'female',
    address: '456 Test Avenue, Test City, TC 12345'
  },
  {
    patient_number: 'E2E003',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@test.com',
    phone: '555-0103',
    date_of_birth: '1975-12-10',
    gender: 'male',
    address: '789 Test Boulevard, Test City, TC 12345'
  }
];

export const testAppointments = [
  {
    patient_number: 'E2E001',
    doctor_email: 'doctor@e2etest.com',
    appointment_date: '2024-12-15T10:00:00Z',
    duration_minutes: 30,
    appointment_type: 'consultation',
    notes: 'Regular checkup'
  },
  {
    patient_number: 'E2E002',
    doctor_email: 'doctor@e2etest.com',
    appointment_date: '2024-12-15T14:00:00Z',
    duration_minutes: 45,
    appointment_type: 'follow-up',
    notes: 'Follow-up appointment'
  }
];

export const testMedicalRecords = [
  {
    patient_number: 'E2E001',
    doctor_email: 'doctor@e2etest.com',
    visit_date: '2024-12-01T10:00:00Z',
    chief_complaint: 'Routine checkup',
    vital_signs: {
      temperature: '98.6',
      blood_pressure_systolic: '120',
      blood_pressure_diastolic: '80',
      heart_rate: '72'
    },
    assessment: 'Patient appears healthy',
    plan: 'Continue current medications'
  }
];

export const testLabTests = [
  {
    patient_number: 'E2E001',
    test_name: 'Complete Blood Count',
    test_type: 'blood',
    ordered_date: '2024-12-01T10:00:00Z',
    status: 'pending'
  },
  {
    patient_number: 'E2E002',
    test_name: 'Lipid Panel',
    test_type: 'blood',
    ordered_date: '2024-12-01T14:00:00Z',
    status: 'completed',
    results: {
      cholesterol: '180',
      hdl: '45',
      ldl: '110',
      triglycerides: '125'
    }
  }
];
```

### Data Seeding Service

Create `e2e-tests/tests/utils/data-seeder.ts`:

```typescript
import { Pool } from 'pg';
import { testPatients, testAppointments, testMedicalRecords, testLabTests } from '../fixtures/test-data';

export class DataSeeder {
  private pool: Pool;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  async seedTestData() {
    const client = await this.pool.connect();
    
    try {
      // Set tenant context
      await client.query(`SET search_path TO "${this.tenantId}"`);

      // Seed patients
      await this.seedPatients(client);
      
      // Seed appointments
      await this.seedAppointments(client);
      
      // Seed medical records
      await this.seedMedicalRecords(client);
      
      // Seed lab tests
      await this.seedLabTests(client);

      console.log('Test data seeding completed');
    } finally {
      client.release();
    }
  }

  private async seedPatients(client: any) {
    for (const patient of testPatients) {
      await client.query(`
        INSERT INTO patients (
          patient_number, first_name, last_name, email, phone,
          date_of_birth, gender, address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (patient_number) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email
      `, [
        patient.patient_number,
        patient.first_name,
        patient.last_name,
        patient.email,
        patient.phone,
        patient.date_of_birth,
        patient.gender,
        patient.address
      ]);
    }
  }

  private async seedAppointments(client: any) {
    for (const appointment of testAppointments) {
      // Get patient ID
      const patientResult = await client.query(
        'SELECT id FROM patients WHERE patient_number = $1',
        [appointment.patient_number]
      );
      
      // Get doctor ID from public schema
      const doctorResult = await client.query(
        'SELECT id FROM public.users WHERE email = $1',
        [appointment.doctor_email]
      );

      if (patientResult.rows.length > 0 && doctorResult.rows.length > 0) {
        await client.query(`
          INSERT INTO appointments (
            patient_id, doctor_id, appointment_date, duration_minutes,
            appointment_type, notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          patientResult.rows[0].id,
          doctorResult.rows[0].id,
          appointment.appointment_date,
          appointment.duration_minutes,
          appointment.appointment_type,
          appointment.notes
        ]);
      }
    }
  }

  private async seedMedicalRecords(client: any) {
    for (const record of testMedicalRecords) {
      // Get patient and doctor IDs
      const patientResult = await client.query(
        'SELECT id FROM patients WHERE patient_number = $1',
        [record.patient_number]
      );
      
      const doctorResult = await client.query(
        'SELECT id FROM public.users WHERE email = $1',
        [record.doctor_email]
      );

      if (patientResult.rows.length > 0 && doctorResult.rows.length > 0) {
        await client.query(`
          INSERT INTO medical_records (
            patient_id, doctor_id, visit_date, chief_complaint,
            vital_signs, assessment, plan
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          patientResult.rows[0].id,
          doctorResult.rows[0].id,
          record.visit_date,
          record.chief_complaint,
          JSON.stringify(record.vital_signs),
          record.assessment,
          record.plan
        ]);
      }
    }
  }

  private async seedLabTests(client: any) {
    for (const test of testLabTests) {
      const patientResult = await client.query(
        'SELECT id FROM patients WHERE patient_number = $1',
        [test.patient_number]
      );

      if (patientResult.rows.length > 0) {
        await client.query(`
          INSERT INTO lab_tests (
            patient_id, test_name, test_type, ordered_date, status, results
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          patientResult.rows[0].id,
          test.test_name,
          test.test_type,
          test.ordered_date,
          test.status,
          test.results ? JSON.stringify(test.results) : null
        ]);
      }
    }
  }

  async cleanupTestData() {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO "${this.tenantId}"`);
      
      // Clean up in reverse order due to foreign key constraints
      await client.query('DELETE FROM lab_tests');
      await client.query('DELETE FROM medical_records');
      await client.query('DELETE FROM appointments');
      await client.query('DELETE FROM patients');
      
      console.log('Test data cleanup completed');
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
```

---

## 📝 Task 4: CI/CD Integration (2 hours)

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: multitenant_db_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Install frontend dependencies
      run: |
        cd admin-dashboard
        npm ci
        cd ../hospital-management-system
        npm ci
    
    - name: Install E2E test dependencies
      run: |
        cd e2e-tests
        npm ci
    
    - name: Install Playwright Browsers
      run: |
        cd e2e-tests
        npx playwright install --with-deps
    
    - name: Setup test database
      run: |
        cd e2e-tests
        npm run setup:db
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: multitenant_db_test
        DB_USER: postgres
        DB_PASSWORD: postgres
    
    - name: Run E2E tests
      run: |
        cd e2e-tests
        npm run test
      env:
        BASE_URL: http://localhost:3002
        API_BASE_URL: http://localhost:3000
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: multitenant_db_test
        DB_USER: postgres
        DB_PASSWORD: postgres
        TEST_TENANT_ID: test_e2e_tenant
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: e2e-tests/playwright-report/
        retention-days: 30
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: e2e-tests/test-results/
        retention-days: 30
```

### Test Scripts

Update `e2e-tests/package.json` scripts:

```json
{
  "scripts": {
    "setup:db": "node scripts/setup-test-db.js",
    "seed:data": "node scripts/seed-test-data.js",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "test:report": "playwright show-report",
    "test:ci": "npm run setup:db && npm run seed:data && npm run test",
    "cleanup": "node scripts/cleanup-test-data.js"
  }
}
```

### Test Setup and Teardown

Create `e2e-tests/tests/setup/global-setup.ts`:

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { TestEnvironment } from '../utils/test-environment';
import { DataSeeder } from '../utils/data-seeder';

async function globalSetup(config: FullConfig) {
  console.log('Setting up E2E test environment...');
  
  const testEnv = new TestEnvironment();
  const dataSeeder = new DataSeeder(process.env.TEST_TENANT_ID!);
  
  try {
    // Setup test tenant and users
    await testEnv.setupTestTenant();
    
    // Seed test data
    await dataSeeder.seedTestData();
    
    console.log('E2E test environment setup completed');
  } catch (error) {
    console.error('E2E test environment setup failed:', error);
    throw error;
  } finally {
    await testEnv.close();
    await dataSeeder.close();
  }
}

export default globalSetup;
```

Create `e2e-tests/tests/setup/global-teardown.ts`:

```typescript
import { FullConfig } from '@playwright/test';
import { TestEnvironment } from '../utils/test-environment';
import { DataSeeder } from '../utils/data-seeder';

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up E2E test environment...');
  
  const testEnv = new TestEnvironment();
  const dataSeeder = new DataSeeder(process.env.TEST_TENANT_ID!);
  
  try {
    // Cleanup test data
    await dataSeeder.cleanupTestData();
    
    // Cleanup test environment
    await testEnv.cleanupTestData();
    
    console.log('E2E test environment cleanup completed');
  } catch (error) {
    console.error('E2E test environment cleanup failed:', error);
  } finally {
    await testEnv.close();
    await dataSeeder.close();
  }
}

export default globalTeardown;
```

---

## ✅ Completion Checklist

- [ ] Playwright framework installed and configured
- [ ] Test environment setup with isolated database
- [ ] Test data fixtures and seeding scripts created
- [ ] Page Object Models implemented
- [ ] CI/CD integration with GitHub Actions
- [ ] Global setup and teardown procedures
- [ ] Cross-browser testing configuration
- [ ] Test reporting and artifact collection

---

## 🎯 Success Criteria

- ✅ E2E testing framework operational
- ✅ Test environment isolated and reproducible
- ✅ Test data management automated
- ✅ CI/CD pipeline integrated
- ✅ Cross-browser testing enabled
- ✅ Test reporting configured
- ✅ Ready for comprehensive workflow testing

**Day 1 Complete!** Ready for Day 2: Patient Workflow Tests.

---

**Next**: [Day 2: Patient Workflow Tests](day-2-patient-workflow-tests.md)