# Billing Integration E2E Tests

**Team Gamma - Billing & Finance Integration**

Comprehensive end-to-end tests using Playwright to verify frontend-backend integration.

---

## 🎯 Test Coverage

### 1. Authentication & Authorization
- User login flow
- Permission verification
- Billing access control

### 2. Billing Dashboard
- Dashboard loading
- Real data display
- Tab navigation
- Metrics display

### 3. Invoice List Page
- Navigation to invoice list
- Invoice display
- Search functionality
- Status filtering
- Pagination

### 4. Invoice Detail Page
- Navigation to detail
- Invoice information display
- Email button presence
- Download PDF button presence

### 5. Email Invoice Modal
- Modal opening
- Form fields presence
- Email validation
- Form submission

### 6. Manual Payment Modal
- Payment buttons for pending invoices
- Modal opening
- Form fields presence
- Payment method selection

### 7. Razorpay Payment Modal
- Modal opening
- Demo mode warning
- Payment form display

### 8. Backend API Integration
- Billing report API
- Invoices API
- Razorpay config API

### 9. Error Handling
- Network error handling
- Invalid invoice ID handling
- Graceful degradation

### 10. Performance
- Dashboard load time
- Invoice list load time
- API response times

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
cd e2e-tests
npm install
```

### 2. Install Playwright Browsers
```bash
npm run install
```

### 3. Start Backend Server
```bash
cd ../backend
npm run dev
```

### 4. Start Frontend Server
```bash
cd ../hospital-management-system
npm run dev
```

### 5. Verify Test User Exists
Ensure the test user exists in the database:
- Email: mdwasimkrm13@gmail.com
- Password: Advantur101$
- Tenant: aajmin_polyclinic
- Permissions: billing:read, billing:write, billing:admin

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Run Tests in Debug Mode
```bash
npm run test:debug
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:ui
```

### Run Specific Test File
```bash
npx playwright test billing-integration.spec.js
```

### Run Specific Test
```bash
npx playwright test -g "should login successfully"
```

---

## 📊 Test Reports

### View HTML Report
```bash
npm run test:report
```

### Test Results Location
- HTML Report: `test-results/html/index.html`
- JSON Report: `test-results/results.json`
- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in `e2e-tests/` directory:

```bash
# Frontend URL
BASE_URL=http://localhost:3001

# Backend API URL
API_URL=http://localhost:3000

# Test User Credentials
TEST_EMAIL=mdwasimkrm13@gmail.com
TEST_PASSWORD=Advantur101$
TEST_TENANT=aajmin_polyclinic
```

### Playwright Configuration

Edit `playwright.config.js` to customize:
- Timeout settings
- Browser selection
- Viewport size
- Screenshot/video settings
- Parallel execution

---

## 📝 Test Structure

### Test Organization
```
e2e-tests/
├── billing-integration.spec.js  # Main test file
├── playwright.config.js         # Playwright configuration
├── package.json                 # Dependencies
├── README.md                    # This file
└── test-results/                # Test results (generated)
    ├── html/                    # HTML report
    ├── results.json             # JSON report
    ├── screenshots/             # Failure screenshots
    └── videos/                  # Failure videos
```

### Test Sections
1. **Authentication & Authorization** - Login and permissions
2. **Billing Dashboard** - Dashboard functionality
3. **Invoice List Page** - List, search, filter
4. **Invoice Detail Page** - Detail view
5. **Email Invoice Modal** - Email functionality
6. **Manual Payment Modal** - Manual payment
7. **Razorpay Payment Modal** - Online payment
8. **Backend API Integration** - API calls
9. **Error Handling** - Error scenarios
10. **Performance** - Load times

---

## 🧪 Test Examples

### Example 1: Login Test
```javascript
test('should login successfully', async ({ page }) => {
  await page.goto('http://localhost:3001/auth/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/billing/);
  expect(page.url()).toMatch(/\/dashboard|\/billing/);
});
```

### Example 2: API Test
```javascript
test('should fetch billing report', async ({ request }) => {
  const response = await request.get('/api/billing/report', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': 'tenant_id'
    }
  });
  expect(response.ok()).toBeTruthy();
});
```

### Example 3: Modal Test
```javascript
test('should open email modal', async ({ page }) => {
  await page.goto('/billing/invoices/1');
  await page.click('button:has-text("Email")');
  await expect(page.locator('text=Email Invoice')).toBeVisible();
});
```

---

## 🐛 Troubleshooting

### Tests Failing?

**1. Check Servers Running**
```bash
# Backend should be on port 3000
curl http://localhost:3000/health

# Frontend should be on port 3001
curl http://localhost:3001
```

**2. Check Test User Exists**
```bash
cd ../backend
node scripts/verify-test-user.js
```

**3. Check Browser Installation**
```bash
npx playwright install chromium
```

**4. Run Tests in Debug Mode**
```bash
npm run test:debug
```

**5. Check Test Logs**
```bash
# View detailed logs
npx playwright test --reporter=line
```

### Common Issues

**Issue**: "Timeout waiting for page to load"
**Solution**: Increase timeout in `playwright.config.js`

**Issue**: "Element not found"
**Solution**: Check if element selectors match actual HTML

**Issue**: "Authentication failed"
**Solution**: Verify test user credentials are correct

**Issue**: "Network error"
**Solution**: Ensure backend and frontend servers are running

---

## 📊 Expected Results

### All Tests Passing
```
Running 30 tests using 1 worker

  ✓ 1. Authentication & Authorization
    ✓ should login successfully (5s)
    ✓ should have billing permissions (2s)

  ✓ 2. Billing Dashboard
    ✓ should load billing dashboard (3s)
    ✓ should display real data from backend (2s)
    ✓ should have working tabs (2s)

  ✓ 3. Invoice List Page
    ✓ should navigate to invoice list (2s)
    ✓ should display invoice list (3s)
    ✓ should have working search (2s)
    ✓ should have working status filter (2s)

  ... (more tests)

  30 passed (1m 45s)
```

### Test Report
- Open `test-results/html/index.html` in browser
- View detailed test results
- See screenshots and videos of failures
- Analyze performance metrics

---

## 🎯 Success Criteria

### Tests Pass When:
- [ ] All 30+ tests passing
- [ ] No console errors
- [ ] All pages load correctly
- [ ] All features functional
- [ ] API integration working
- [ ] Error handling working
- [ ] Performance benchmarks met

### Performance Benchmarks:
- Dashboard loads in < 5 seconds
- Invoice list loads in < 5 seconds
- API responses in < 2 seconds
- Modal opens in < 1 second

---

## 📞 Support

### Need Help?
- Check test logs: `test-results/`
- View HTML report: `npm run test:report`
- Run in debug mode: `npm run test:debug`
- Check Playwright docs: https://playwright.dev

### Test User Issues?
- Verify user exists in database
- Check user has billing permissions
- Verify tenant ID is correct
- Check password is correct

---

## 🎉 Next Steps

After tests pass:
1. Review test report
2. Fix any failing tests
3. Add more test cases if needed
4. Run tests on different browsers
5. Integrate into CI/CD pipeline

---

**Test Status**: Ready to Run  
**Coverage**: 10 test suites, 30+ tests  
**Estimated Time**: 2-3 minutes  
**Browsers**: Chromium (Chrome/Edge)

🧪 **Run tests to verify billing integration!** 🧪

