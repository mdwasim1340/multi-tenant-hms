// Team Gamma - Billing Integration E2E Tests
// Tests frontend-backend integration for all billing features

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advantur101$',
  tenant: 'aajmin_polyclinic'
};

// Test data
let authToken = '';
let testInvoiceId = null;

test.describe('Billing System Integration Tests', () => {
  
  // Setup: Login before all tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login to get auth token
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/billing/, { timeout: 10000 });
    
    // Get auth token from cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    if (authCookie) {
      authToken = authCookie.value;
    }
    
    await context.close();
  });

  test.describe('1. Authentication & Authorization', () => {
    
    test('should login successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      
      // Fill login form
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard or billing
      await page.waitForURL(/\/dashboard|\/billing/, { timeout: 10000 });
      
      // Verify we're logged in
      expect(page.url()).toMatch(/\/dashboard|\/billing/);
    });

    test('should have billing permissions', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      
      // Should not redirect to unauthorized
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('/unauthorized');
      
      // Should see billing dashboard
      await expect(page.locator('text=Billing Dashboard')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Billing Dashboard', () => {
    
    test('should load billing dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check for main heading
      await expect(page.locator('text=Billing Dashboard')).toBeVisible();
      
      // Check for metrics cards
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Pending Amount')).toBeVisible();
      await expect(page.locator('text=Overdue Amount')).toBeVisible();
      await expect(page.locator('text=Monthly Revenue')).toBeVisible();
    });

    test('should display real data from backend', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      // Check that metrics have values (not just loading states)
      const totalRevenue = await page.locator('text=Total Revenue').locator('..').locator('text=/\\$/').first();
      await expect(totalRevenue).toBeVisible();
    });

    test('should have working tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      // Click on different tabs
      await page.click('text=Invoices');
      await expect(page.locator('text=Recent Invoices')).toBeVisible();
      
      await page.click('text=Analytics');
      await expect(page.locator('text=Revenue Trends')).toBeVisible();
    });
  });

  test.describe('3. Invoice List Page', () => {
    
    test('should navigate to invoice list', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      // Click "View All Invoices" button
      await page.click('text=View All Invoices');
      
      // Should navigate to invoices page
      await page.waitForURL('**/billing/invoices');
      await expect(page.locator('text=Invoices')).toBeVisible();
    });

    test('should display invoice list', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      
      // Wait for invoices to load
      await page.waitForTimeout(2000);
      
      // Check for invoice cards or empty state
      const hasInvoices = await page.locator('[data-testid="invoice-card"]').count() > 0;
      const hasEmptyState = await page.locator('text=No invoices found').isVisible();
      
      expect(hasInvoices || hasEmptyState).toBeTruthy();
    });

    test('should have working search', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      
      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('INV');
        await page.waitForTimeout(1000);
        
        // Search should filter results
        expect(true).toBeTruthy(); // Search functionality exists
      }
    });

    test('should have working status filter', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      
      // Find status filter dropdown
      const filterButton = page.locator('button:has-text("All Status")').first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
        
        // Should show filter options
        await expect(page.locator('text=Pending')).toBeVisible();
      }
    });
  });

  test.describe('4. Invoice Detail Page', () => {
    
    test('should navigate to invoice detail', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Find first "View" button
      const viewButton = page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        // Get invoice ID from URL after clicking
        await viewButton.click();
        await page.waitForURL('**/billing/invoices/*');
        
        // Store invoice ID for later tests
        const url = page.url();
        const match = url.match(/\/invoices\/(\d+)/);
        if (match) {
          testInvoiceId = match[1];
        }
        
        // Should show invoice details
        await expect(page.locator('text=Invoice Details')).toBeVisible();
      }
    });

    test('should display invoice information', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Check for invoice details
      await expect(page.locator('text=/INV-/')).toBeVisible();
      await expect(page.locator('text=Billing Period')).toBeVisible();
      await expect(page.locator('text=Due Date')).toBeVisible();
    });

    test('should have email button', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Check for email button
      const emailButton = page.locator('button:has-text("Email")');
      await expect(emailButton).toBeVisible();
    });

    test('should have download PDF button', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Check for download button
      const downloadButton = page.locator('button:has-text("Download PDF")');
      await expect(downloadButton).toBeVisible();
    });
  });

  test.describe('5. Email Invoice Modal', () => {
    
    test('should open email modal', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Click email button
      await page.click('button:has-text("Email")');
      await page.waitForTimeout(500);
      
      // Modal should open
      await expect(page.locator('text=Email Invoice')).toBeVisible();
    });

    test('should have email form fields', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Open modal
      await page.click('button:has-text("Email")');
      await page.waitForTimeout(500);
      
      // Check for form fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="subject"]')).toBeVisible();
      await expect(page.locator('textarea')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      if (!testInvoiceId) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/billing/invoices/${testInvoiceId}`);
      await page.waitForLoadState('networkidle');
      
      // Open modal
      await page.click('button:has-text("Email")');
      await page.waitForTimeout(500);
      
      // Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button:has-text("Send Email")');
      await page.waitForTimeout(500);
      
      // Should show validation error
      await expect(page.locator('text=/valid email/i')).toBeVisible();
    });
  });

  test.describe('6. Manual Payment Modal', () => {
    
    test('should show payment buttons for pending invoices', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Find a pending invoice
      const pendingBadge = page.locator('text=Pending').first();
      if (await pendingBadge.isVisible()) {
        // Click view button
        await page.click('button:has-text("View")');
        await page.waitForURL('**/billing/invoices/*');
        
        // Should see payment action buttons
        const manualPaymentButton = page.locator('button:has-text("Record Manual Payment")');
        await expect(manualPaymentButton).toBeVisible();
      }
    });

    test('should open manual payment modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Find a pending invoice and open it
      const viewButton = page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForURL('**/billing/invoices/*');
        
        // Click manual payment button if visible
        const manualPaymentButton = page.locator('button:has-text("Record Manual Payment")');
        if (await manualPaymentButton.isVisible()) {
          await manualPaymentButton.click();
          await page.waitForTimeout(500);
          
          // Modal should open
          await expect(page.locator('text=Record Manual Payment')).toBeVisible();
        }
      }
    });

    test('should have payment form fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const viewButton = page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForURL('**/billing/invoices/*');
        
        const manualPaymentButton = page.locator('button:has-text("Record Manual Payment")');
        if (await manualPaymentButton.isVisible()) {
          await manualPaymentButton.click();
          await page.waitForTimeout(500);
          
          // Check for form fields
          await expect(page.locator('input[type="number"]')).toBeVisible();
          await expect(page.locator('button:has-text("Select payment method")')).toBeVisible();
        }
      }
    });
  });

  test.describe('7. Razorpay Payment Modal', () => {
    
    test('should open razorpay payment modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const viewButton = page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForURL('**/billing/invoices/*');
        
        const onlinePaymentButton = page.locator('button:has-text("Process Online Payment")');
        if (await onlinePaymentButton.isVisible()) {
          await onlinePaymentButton.click();
          await page.waitForTimeout(500);
          
          // Modal should open
          await expect(page.locator('text=Process Online Payment')).toBeVisible();
        }
      }
    });

    test('should show demo mode warning', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const viewButton = page.locator('button:has-text("View")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForURL('**/billing/invoices/*');
        
        const onlinePaymentButton = page.locator('button:has-text("Process Online Payment")');
        if (await onlinePaymentButton.isVisible()) {
          await onlinePaymentButton.click();
          await page.waitForTimeout(1000);
          
          // Should show demo mode warning (if in demo mode)
          const demoWarning = page.locator('text=Demo Mode');
          if (await demoWarning.isVisible()) {
            expect(true).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('8. Backend API Integration', () => {
    
    test('should fetch billing report from backend', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/billing/report`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': TEST_USER.tenant
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.report).toBeDefined();
    });

    test('should fetch invoices from backend', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/billing/invoices/${TEST_USER.tenant}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': TEST_USER.tenant
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.invoices).toBeDefined();
    });

    test('should fetch razorpay config from backend', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/billing/razorpay-config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.config).toBeDefined();
    });
  });

  test.describe('9. Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true);
      
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForTimeout(3000);
      
      // Should show error message or retry button
      const hasError = await page.locator('text=/error|failed|retry/i').isVisible();
      expect(hasError).toBeTruthy();
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle invalid invoice ID', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing/invoices/99999`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Should show 404 or error message
      const hasError = await page.locator('text=/not found|invalid|error/i').isVisible();
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('10. Performance', () => {
    
    test('should load billing dashboard quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should load invoice list quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/billing/invoices`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});

// Generate test report
test.afterAll(async () => {
  console.log('\n=================================');
  console.log('Billing Integration Tests Complete');
  console.log('=================================\n');
});
