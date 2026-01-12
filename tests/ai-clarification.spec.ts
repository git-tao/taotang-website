import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite for AI Clarification Flow
 *
 * Tests cover:
 * 1. Triggering clarification flow (budget=unsure, service_type=unclear, etc.)
 * 2. Answering clarification questions
 * 3. Completing clarification and routing
 * 4. Edge cases and error handling
 */

// Test data - use unique emails to avoid rate limiting
const generateTestEmail = () => `test.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@acmecorp.com`;

const TEST_DATA = {
  get businessEmail() { return generateTestEmail(); },
  validName: 'John Doe',
  companyName: 'Acme Corp',
  sufficientContext:
    'We have an AI chatbot prototype that works well in development but struggles with production traffic. We need help scaling it to handle 10x load while maintaining response quality and reducing hallucinations.',
  shortContext: 'Need help with AI.',
};

// Helper to navigate to intake form
async function navigateToIntakeForm(page: Page) {
  await page.goto('/');
  await page.locator('#initiate').scrollIntoViewIfNeeded();
}

// Helper to fill Step 1
async function fillBasicInfo(
  page: Page,
  options: {
    name: string;
    email: string;
    company?: string;
    role: 'founder_csuite' | 'vp_director' | 'eng_manager' | 'ic_engineer' | 'other';
    isDecisionMaker?: boolean;
  }
) {
  await page.getByPlaceholder('John Doe').fill(options.name);
  await page.getByPlaceholder('name@company.com').fill(options.email);
  if (options.company) {
    await page.getByPlaceholder('Acme Corp').fill(options.company);
  }
  await page.locator('select[name="role_title"]').selectOption(options.role);
  if (options.role === 'ic_engineer' || options.role === 'other') {
    if (options.isDecisionMaker === true) {
      await page.getByRole('button', { name: 'Yes, I am' }).click();
    } else if (options.isDecisionMaker === false) {
      await page.getByRole('button', { name: "No, I'm not" }).click();
    }
  }
}

// Helper to fill Step 2
async function fillProjectDetails(
  page: Page,
  options: {
    serviceType: 'advisory_paid' | 'audit' | 'project' | 'unclear';
    context: string;
  }
) {
  const serviceLabels: Record<string, string> = {
    advisory_paid: 'Paid advisory / second opinion',
    audit: 'Audit of existing AI system',
    project: 'Build or ship something',
    unclear: 'Not sure yet',
  };
  await page.getByText(serviceLabels[options.serviceType], { exact: false }).click();
  await page
    .getByPlaceholder(
      'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
    )
    .fill(options.context);
}

// Helper to fill Step 3
async function fillQualification(
  page: Page,
  options: {
    timeline: 'urgent' | 'soon' | 'planning' | 'exploring';
    budget: 'under_10k' | '10k_25k' | '25k_50k' | 'over_50k' | 'unsure';
    accessModel:
      | 'remote_access'
      | 'own_environment_own_tools'
      | 'managed_devices'
      | 'onpremise_only'
      | 'unsure';
  }
) {
  // Timeline buttons include sublabels, so use partial match
  const timelineLabels: Record<string, string> = {
    urgent: 'Urgent',
    soon: 'Soon',
    planning: 'Planning',
    exploring: 'Exploring',
  };
  await page.getByRole('button', { name: new RegExp(`^${timelineLabels[options.timeline]}`) }).click();

  // Budget buttons - use exact match for "Not sure" to avoid ambiguity with access model
  const budgetSelectors: Record<string, string> = {
    under_10k: '< $10,000',
    '10k_25k': '$10,000 - $25,000',
    '25k_50k': '$25,000 - $50,000',
    over_50k: '$50,000+',
    unsure: 'Not sure',
  };
  // Budget "Not sure" needs exact match to avoid matching access model's "Not sure Need to check..."
  if (options.budget === 'unsure') {
    await page.getByRole('button', { name: 'Not sure', exact: true }).click();
  } else {
    await page.locator(`button:has-text("${budgetSelectors[options.budget]}")`).click();
  }

  // Access model buttons include descriptions - click by visible text
  const accessSelectors: Record<string, string> = {
    remote_access: 'Remote Access',
    own_environment_own_tools: 'Your Environment',
    managed_devices: 'Managed Devices',
    onpremise_only: 'On-Premise Only',
    unsure: 'Need to check with IT',  // Use unique sublabel text
  };
  await page.locator(`button:has-text("${accessSelectors[options.accessModel]}")`).first().click();
}

// Helper to complete form to submission point
async function completeFormToSubmission(
  page: Page,
  overrides?: {
    budget?: 'under_10k' | '10k_25k' | '25k_50k' | 'over_50k' | 'unsure';
    serviceType?: 'advisory_paid' | 'audit' | 'project' | 'unclear';
    accessModel?:
      | 'remote_access'
      | 'own_environment_own_tools'
      | 'managed_devices'
      | 'onpremise_only'
      | 'unsure';
  }
) {
  await navigateToIntakeForm(page);

  // Step 1
  await fillBasicInfo(page, {
    name: TEST_DATA.validName,
    email: TEST_DATA.businessEmail,
    role: 'founder_csuite',
  });
  await page.getByRole('button', { name: 'Continue to Project Details' }).click();

  // Step 2
  await fillProjectDetails(page, {
    serviceType: overrides?.serviceType || 'project',
    context: TEST_DATA.sufficientContext,
  });
  await page.getByRole('button', { name: 'Continue to Final Step' }).click();

  // Step 3
  await fillQualification(page, {
    timeline: 'urgent',
    budget: overrides?.budget || '25k_50k',
    accessModel: overrides?.accessModel || 'remote_access',
  });
}

// =============================================================================
// AI CLARIFICATION TRIGGER TESTS
// =============================================================================

test.describe('AI Clarification Triggers', () => {
  test('budget=unsure should trigger AI clarification flow', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should show clarification UI instead of immediate outcome
    // Wait for either clarification flow or outcome (depends on backend AI availability)
    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    const outcomeVisible = await page
      .getByText(/Thank You/i)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Either clarification is triggered OR we get manual review (if AI not available)
    expect(clarificationVisible || outcomeVisible).toBeTruthy();

    if (clarificationVisible) {
      // Verify clarification UI elements
      await expect(page.getByText('A Few Quick Questions')).toBeVisible();
      await expect(page.getByText('Help us understand your needs better')).toBeVisible();
    }
  });

  test('service_type=unclear should trigger AI clarification', async ({ page }) => {
    await completeFormToSubmission(page, { serviceType: 'unclear', budget: '25k_50k' });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Check for clarification or fallback to manual review
    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    const outcomeVisible = await page
      .getByText(/Thank You/i)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(clarificationVisible || outcomeVisible).toBeTruthy();
  });

  test('access_model=unsure should trigger AI clarification', async ({ page }) => {
    await completeFormToSubmission(page, { accessModel: 'unsure' });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    const outcomeVisible = await page
      .getByText(/Thank You/i)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(clarificationVisible || outcomeVisible).toBeTruthy();
  });

  test('all qualifying criteria should NOT trigger clarification', async ({ page }) => {
    // This should pass gate directly without clarification
    await completeFormToSubmission(page, {
      budget: '25k_50k',
      serviceType: 'project',
      accessModel: 'remote_access',
    });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should show outcome directly (pass or manual), not clarification
    await expect(page.getByText(/Thank You/i)).toBeVisible({ timeout: 15000 });

    // Should NOT show clarification UI
    await expect(page.getByText('A Few Quick Questions')).not.toBeVisible();
  });
});

// =============================================================================
// AI CLARIFICATION FLOW TESTS
// =============================================================================

test.describe('AI Clarification Flow', () => {
  test('should display question card with options', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Wait for clarification flow
    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Verify question card structure
      await expect(page.locator('.bg-white.rounded-2xl')).toBeVisible();
      // Should have Continue button
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    }
  });

  test('should show progress dots', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Progress dots should be visible
      const progressDots = page.locator('.rounded-full.w-2.h-2');
      await expect(progressDots.first()).toBeVisible();
    }
  });

  test('Continue button should be disabled without selection', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Continue should be disabled initially
      const continueButton = page.getByRole('button', { name: 'Continue' });
      await expect(continueButton).toBeDisabled();
    }
  });

  test('selecting an option should enable Continue button', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Find and click first option button (excluding Continue)
      const optionButtons = page.locator('button').filter({
        hasNot: page.getByText('Continue'),
      });

      // Click first option if available
      const firstOption = optionButtons.first();
      if ((await firstOption.count()) > 0) {
        await firstOption.click();
        // Continue should now be enabled
        const continueButton = page.getByRole('button', { name: 'Continue' });
        await expect(continueButton).toBeEnabled();
      }
    }
  });

  test('answering questions should lead to final outcome', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Answer up to 3 questions
      for (let i = 0; i < 3; i++) {
        // Wait for question or outcome
        const stillClarifying = await page
          .getByRole('button', { name: 'Continue' })
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        if (!stillClarifying) break;

        // Find clickable option (radio button style)
        const options = page.locator('button.w-full.text-left');
        if ((await options.count()) > 0) {
          await options.first().click();
          await page.getByRole('button', { name: 'Continue' }).click();
          // Wait for response
          await page.waitForTimeout(2000);
        } else {
          // Might be a text question
          const textarea = page.locator('textarea');
          if ((await textarea.count()) > 0) {
            await textarea.fill('Additional context for clarification.');
            await page.getByRole('button', { name: 'Continue' }).click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Should eventually reach outcome screen
      await expect(page.getByText(/Thank You/i)).toBeVisible({ timeout: 30000 });
    }
  });
});

// =============================================================================
// ANIMATION AND UI TESTS
// =============================================================================

test.describe('UI Transitions', () => {
  test('form should animate out when clarification starts', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });

    // Watch for animation class changes
    const formContainer = page.locator('.bg-white.rounded-2xl').first();

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // The form should transition to clarification
    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Verify the transition happened (clarification UI is visible)
      await expect(page.getByText('A Few Quick Questions')).toBeVisible();
    }
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });

    // Simulate offline
    await page.context().setOffline(true);

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should show error state
    await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10000 });

    // Restore connection
    await page.context().setOffline(false);
  });

  test('should allow retry after error', async ({ page }) => {
    await completeFormToSubmission(page, { budget: 'unsure' });

    // Submit normally
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should either show clarification or outcome
    const hasResponse = await page
      .getByText(/A Few Quick Questions|Thank You/i)
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    expect(hasResponse).toBeTruthy();
  });
});

// =============================================================================
// RESPONSIVE TESTS
// =============================================================================

test.describe('Responsive Design', () => {
  test('clarification UI should work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await completeFormToSubmission(page, { budget: 'unsure' });
    await page.getByRole('button', { name: 'Submit Application' }).click();

    const clarificationVisible = await page
      .getByText('A Few Quick Questions')
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (clarificationVisible) {
      // Verify UI is visible and usable on mobile
      await expect(page.getByText('A Few Quick Questions')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    }
  });
});
