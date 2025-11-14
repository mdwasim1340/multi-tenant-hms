import { test, expect } from '@playwright/test'

const setAuthCookies = async (context: any) => {
  await context.addCookies([
    { name: 'token', value: 'test-token', domain: 'localhost', path: '/' },
    { name: 'tenant_id', value: 'tenant_test', domain: 'localhost', path: '/' },
  ])
}

test.describe('Patient Registration', () => {
  test.beforeEach(async ({ context, page }) => {
    await setAuthCookies(context)
    await page.route('**/api/subscriptions/current', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: { id: 'basic', features: {}, limits: { max_patients: 500, max_users: 5, storage_gb: 10, api_calls_per_day: 1000 } },
          usage: { patients_count: 0, users_count: 1, storage_used_gb: 0, api_calls_today: 0 },
          warnings: [],
        }),
      })
    })
  })

  test('click submit triggers workflow and navigates on success', async ({ page }) => {
    await page.route('**/api/patients', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { patient: { id: 123, first_name: 'John', last_name: 'Doe', patient_number: 'P123', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), date_of_birth: '1980-01-01', gender: 'male' } },
            message: 'Patient created successfully',
          }),
        })
        return
      }
      route.continue()
    })

    await page.goto('/patient-registration')

    await page.getByLabel('First Name *').fill('John')
    await page.getByLabel('Last Name *').fill('Doe')
    await page.getByLabel('Date of Birth *').fill('1980-01-01')

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Blood Type').click()
    await page.getByRole('option', { name: 'O+' }).click()

    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByRole('button', { name: 'Submit Registration' }).click()

    await expect(page).toHaveURL(/\/patient-management\/123$/)
  })

  test('validation prevents invalid inputs', async ({ page }) => {
    await page.goto('/patient-registration')

    await page.getByLabel('First Name *').fill('A')
    await page.getByLabel('Last Name *').fill('B')
    await page.getByLabel('Date of Birth *').fill('2999-01-01')

    await page.getByRole('button', { name: 'Next' }).click()

    const toastError = page.getByText('Validation Error')
    await expect(toastError).toBeVisible()
  })

  test('handles backend validation error gracefully', async ({ page }) => {
    await page.route('**/api/patients', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: [{ field: 'blood_type', message: 'Invalid option' }],
          }),
        })
        return
      }
      route.continue()
    })

    await page.goto('/patient-registration')

    await page.getByLabel('First Name *').fill('John')
    await page.getByLabel('Last Name *').fill('Doe')
    await page.getByLabel('Date of Birth *').fill('1980-01-01')

    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByRole('button', { name: 'Submit Registration' }).click()

    const toastError = page.getByText('Registration Failed')
    await expect(toastError).toBeVisible()
  })
})
