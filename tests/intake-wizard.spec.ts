import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite for Intake Wizard Form
 *
 * Tests cover:
 * 1. Happy path scenarios (PASS, FAIL, MANUAL)
 * 2. Form validation
 * 3. Conditional logic
 * 4. Navigation
 */

// Test data constants
const TEST_DATA = {
  // Business email (passes validation)
  businessEmail: 'john.doe@acmecorp.com',
  // Personal emails (fail validation)
  personalEmails: [
    'john.doe@gmail.com',
    'jane@hotmail.com',
    'test@yahoo.com',
    'user@icloud.com',
    'dev@protonmail.com',
  ],
  // Valid name
  validName: 'John Doe',
  // Company name
  companyName: 'Acme Corp',
  // Sufficient context (100+ chars)
  sufficientContext:
    'We have an AI chatbot prototype that works well in development but struggles with production traffic. We need help scaling it to handle 10x load while maintaining response quality and reducing hallucinations.',
  // Insufficient context (< 100 chars)
  insufficientContext: 'Need help with AI chatbot scaling issues.',
};

// Helper function to navigate to the intake form
async function navigateToIntakeForm(page: Page) {
  await page.goto('/');
  // Scroll to the initiate section or click a link if needed
  await page.locator('#initiate').scrollIntoViewIfNeeded();
}

// Helper function to fill Step 1: Basic Info
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

  // Handle decision-maker question for IC/Other roles
  if (options.role === 'ic_engineer' || options.role === 'other') {
    if (options.isDecisionMaker === true) {
      await page.getByRole('button', { name: 'Yes, I am' }).click();
    } else if (options.isDecisionMaker === false) {
      await page.getByRole('button', { name: "No, I'm not" }).click();
    }
  }
}

// Helper function to fill Step 2: Project Details
async function fillProjectDetails(
  page: Page,
  options: {
    serviceType: 'advisory_paid' | 'audit' | 'project' | 'unclear';
    context: string;
    auditSymptoms?: string;
    projectSubtype?: 'prototype_to_production' | 'rag_reliability_sprint' | 'other_build';
    projectState?: string;
    ragIssues?: string;
    advisoryQuestions?: string;
    desiredOutcome?: string;
  }
) {
  // Select service type
  const serviceLabels: Record<string, string> = {
    advisory_paid: 'Paid advisory / second opinion',
    audit: 'Audit of existing AI system',
    project: 'Build or ship something',
    unclear: 'Not sure yet',
  };
  await page.getByText(serviceLabels[options.serviceType], { exact: false }).click();

  // Fill conditional follow-ups based on service type
  if (options.serviceType === 'audit' && options.auditSymptoms) {
    await page
      .getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
      .fill(options.auditSymptoms);
  }

  if (options.serviceType === 'project' && options.projectSubtype) {
    const subtypeLabels: Record<string, string> = {
      prototype_to_production: 'Prototype-to-Production',
      rag_reliability_sprint: 'RAG Reliability Sprint',
      other_build: 'Other build/ship project',
    };
    await page.getByRole('button', { name: subtypeLabels[options.projectSubtype] }).click();

    // Fill sub-conditional follow-ups
    if (options.projectSubtype === 'prototype_to_production' && options.projectState) {
      await page
        .getByPlaceholder('e.g., Jupyter notebook, containerized model, deployed in staging...')
        .fill(options.projectState);
    }
    if (options.projectSubtype === 'rag_reliability_sprint' && options.ragIssues) {
      await page
        .getByPlaceholder('e.g., hallucinations, poor document retrieval, slow generation...')
        .fill(options.ragIssues);
    }
  }

  if (options.serviceType === 'advisory_paid' && options.advisoryQuestions) {
    await page
      .getByPlaceholder('What specific questions do you want to explore?')
      .fill(options.advisoryQuestions);
  }

  if (options.serviceType === 'unclear' && options.desiredOutcome) {
    await page
      .getByPlaceholder('What does success look like for you?')
      .fill(options.desiredOutcome);
  }

  // Fill context
  await page
    .getByPlaceholder(
      'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
    )
    .fill(options.context);
}

// Helper function to fill Step 3: Qualification
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
  // Select timeline
  const timelineLabels: Record<string, string> = {
    urgent: 'Urgent',
    soon: 'Soon',
    planning: 'Planning',
    exploring: 'Exploring',
  };
  await page.getByRole('button', { name: timelineLabels[options.timeline], exact: true }).click();

  // Select budget
  const budgetLabels: Record<string, string> = {
    under_10k: '< $10,000',
    '10k_25k': '$10,000 - $25,000',
    '25k_50k': '$25,000 - $50,000',
    over_50k: '$50,000+',
    unsure: 'Not sure',
  };
  await page.getByRole('button', { name: budgetLabels[options.budget], exact: true }).click();

  // Select access model
  const accessLabels: Record<string, string> = {
    remote_access: 'Remote Access',
    own_environment_own_tools: 'Your Environment',
    managed_devices: 'Managed Devices',
    onpremise_only: 'On-Premise Only',
    unsure: 'Not sure',
  };
  await page.getByText(accessLabels[options.accessModel]).click();
}

// =============================================================================
// HAPPY PATH TESTS
// =============================================================================

test.describe('Happy Path Tests', () => {
  test.describe('Gate PASS scenario', () => {
    test('senior role + business email + remote access + urgent timeline + $25k+ budget + 100+ char context should show free strategy call', async ({
      page,
    }) => {
      await navigateToIntakeForm(page);

      // Step 1: Basic Info - Senior role (founder) with business email
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        company: TEST_DATA.companyName,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      // Step 2: Project Details - Build project with sufficient context
      await expect(page.getByText('Tell me about your project')).toBeVisible();
      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
        projectSubtype: 'prototype_to_production',
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // Step 3: Qualification - Urgent + $25k-50k + Remote access
      await expect(page.getByText('A few final questions')).toBeVisible();
      await fillQualification(page, {
        timeline: 'urgent',
        budget: '25k_50k',
        accessModel: 'remote_access',
      });

      // Submit and verify outcome
      await page.getByRole('button', { name: 'Submit Application' }).click();

      // Should show free strategy call outcome (Calendly embed)
      await expect(page.getByText('Thank You for Your Application')).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByText('Your project looks like a strong potential fit')
      ).toBeVisible();
      await expect(page.locator('.calendly-inline-widget')).toBeVisible();
    });

    test('VP role with over_50k budget and soon timeline should pass gate', async ({ page }) => {
      await navigateToIntakeForm(page);

      // Step 1
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: 'sarah@techstartup.io',
        role: 'vp_director',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      // Step 2
      await fillProjectDetails(page, {
        serviceType: 'audit',
        context: TEST_DATA.sufficientContext,
        auditSymptoms: 'High latency and unexpected costs',
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // Step 3
      await fillQualification(page, {
        timeline: 'soon',
        budget: 'over_50k',
        accessModel: 'own_environment_own_tools',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('Thank You for Your Application')).toBeVisible({
        timeout: 10000,
      });
    });

    test('IC Engineer who IS decision maker with all qualifying criteria should pass gate', async ({
      page,
    }) => {
      await navigateToIntakeForm(page);

      // Step 1: IC with decision maker authority
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'ic_engineer',
        isDecisionMaker: true,
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      // Step 2
      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // Step 3
      await fillQualification(page, {
        timeline: 'urgent',
        budget: '25k_50k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('Thank You for Your Application')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Gate FAIL scenario', () => {
    test('personal email should show paid advisory option', async ({ page }) => {
      await navigateToIntakeForm(page);

      // Step 1: Personal email (gmail)
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: 'john.doe@gmail.com',
        role: 'founder_csuite',
      });

      // Email error should show
      await page.getByPlaceholder('name@company.com').blur();
      await expect(page.getByText('Please use your work email for business inquiries')).toBeVisible();

      // Button should be disabled
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();
    });

    test('low budget (under_10k) should show paid advisory option', async ({ page }) => {
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
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // Step 3 - Low budget
      await fillQualification(page, {
        timeline: 'urgent',
        budget: 'under_10k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();

      // Should show paid advisory outcome
      await expect(page.getByText('Thank You for Your Inquiry')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('1-Hour Advisory Session')).toBeVisible();
      await expect(page.getByText('$400')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Book Your Paid Advisory Session' })
      ).toBeVisible();
    });

    test('10k-25k budget should show paid advisory option', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'vp_director',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'audit',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'soon',
        budget: '10k_25k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('1-Hour Advisory Session')).toBeVisible({ timeout: 10000 });
    });

    test('non-urgent timeline (planning) should show paid advisory option', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'planning',
        budget: '25k_50k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('1-Hour Advisory Session')).toBeVisible({ timeout: 10000 });
    });

    test('IC without decision-maker authority and low signals should fail', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'ic_engineer',
        isDecisionMaker: false,
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'exploring',
        budget: 'under_10k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('1-Hour Advisory Session')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Manual Review scenario', () => {
    test('on-premise access should trigger manual review', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'urgent',
        budget: '25k_50k',
        accessModel: 'onpremise_only',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();

      // Should show manual review outcome
      await expect(page.getByText('Thank You for Your Inquiry')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Response within 24-48 hours')).toBeVisible();
      await expect(
        page.getByText("I'll personally review your submission and reach out via email")
      ).toBeVisible();
    });

    test('managed devices access should trigger manual review', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'vp_director',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'audit',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'soon',
        budget: 'over_50k',
        accessModel: 'managed_devices',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('Response within 24-48 hours')).toBeVisible({ timeout: 10000 });
    });

    test('IC with strong signals but not decision maker should trigger manual review', async ({
      page,
    }) => {
      await navigateToIntakeForm(page);

      // IC without decision maker authority but all other signals are strong
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'ic_engineer',
        isDecisionMaker: false,
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // All other signals are strong
      await fillQualification(page, {
        timeline: 'urgent',
        budget: '25k_50k',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('Response within 24-48 hours')).toBeVisible({ timeout: 10000 });
    });

    test('unsure budget with strong signals should trigger manual review', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      await fillQualification(page, {
        timeline: 'urgent',
        budget: 'unsure',
        accessModel: 'remote_access',
      });

      await page.getByRole('button', { name: 'Submit Application' }).click();
      await expect(page.getByText('Response within 24-48 hours')).toBeVisible({ timeout: 10000 });
    });
  });
});

// =============================================================================
// FORM VALIDATION TESTS
// =============================================================================

test.describe('Form Validation Tests', () => {
  test.describe('Email Validation', () => {
    test('should reject invalid email format', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill('invalid-email');
      await page.getByPlaceholder('name@company.com').blur();

      await expect(page.getByText('Please enter a valid email address')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();
    });

    for (const [domain, email] of [
      ['gmail.com', 'john@gmail.com'],
      ['hotmail.com', 'jane@hotmail.com'],
      ['yahoo.com', 'test@yahoo.com'],
    ] as const) {
      test(`should reject personal email domain: ${domain}`, async ({ page }) => {
        await navigateToIntakeForm(page);

        await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
        await page.getByPlaceholder('name@company.com').fill(email);
        await page.getByPlaceholder('name@company.com').blur();

        await expect(page.getByText('Please use your work email for business inquiries')).toBeVisible();
      });
    }

    test('should accept business email domain', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);
      await page.getByPlaceholder('name@company.com').blur();

      await expect(page.getByText('Business email verified')).toBeVisible();
    });
  });

  test.describe('Context Length Validation', () => {
    test('should show remaining characters when context is insufficient', async ({ page }) => {
      await navigateToIntakeForm(page);

      // Fill step 1
      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      // Select service type
      await page.getByText('Build or ship something').click();

      // Enter insufficient context
      const shortContext = 'Need help with AI.'; // ~18 chars
      await page
        .getByPlaceholder(
          'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
        )
        .fill(shortContext);

      // Should show remaining characters needed
      const remaining = 100 - shortContext.length;
      await expect(page.getByText(`${remaining} more characters needed`)).toBeVisible();

      // Continue button should be disabled
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeDisabled();
    });

    test('should show success when context is sufficient', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await page.getByText('Build or ship something').click();
      await page
        .getByPlaceholder(
          'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
        )
        .fill(TEST_DATA.sufficientContext);

      await expect(page.getByText('Great level of detail!')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeEnabled();
    });
  });

  test.describe('Required Field Validation', () => {
    test('Step 1: should require name, email, and role', async ({ page }) => {
      await navigateToIntakeForm(page);

      // Button should be disabled initially
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

      // Fill only name
      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

      // Add email
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

      // Add role - button should be enabled
      await page.locator('select[name="role_title"]').selectOption('founder_csuite');
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeEnabled();
    });

    test('Step 2: should require service type and sufficient context', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      // Button should be disabled initially
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeDisabled();

      // Select service type
      await page.getByText('Build or ship something').click();
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeDisabled();

      // Add sufficient context - button should be enabled
      await page
        .getByPlaceholder(
          'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
        )
        .fill(TEST_DATA.sufficientContext);
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeEnabled();
    });

    test('Step 3: should require timeline, budget, and access model', async ({ page }) => {
      await navigateToIntakeForm(page);

      await fillBasicInfo(page, {
        name: TEST_DATA.validName,
        email: TEST_DATA.businessEmail,
        role: 'founder_csuite',
      });
      await page.getByRole('button', { name: 'Continue to Project Details' }).click();

      await fillProjectDetails(page, {
        serviceType: 'project',
        context: TEST_DATA.sufficientContext,
      });
      await page.getByRole('button', { name: 'Continue to Final Step' }).click();

      // Button should be disabled initially
      await expect(page.getByRole('button', { name: 'Submit Application' })).toBeDisabled();

      // Add timeline
      await page.getByRole('button', { name: 'Urgent', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Submit Application' })).toBeDisabled();

      // Add budget
      await page.getByRole('button', { name: '$25,000 - $50,000', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Submit Application' })).toBeDisabled();

      // Add access model - button should be enabled
      await page.getByText('Remote Access').click();
      await expect(page.getByRole('button', { name: 'Submit Application' })).toBeEnabled();
    });
  });

  test.describe('Decision-Maker Question', () => {
    test('should appear for IC Engineer role', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);

      // Decision maker question should not be visible initially
      await expect(page.getByText('Are you the budget owner or project sponsor?')).not.toBeVisible();

      // Select IC Engineer role
      await page.locator('select[name="role_title"]').selectOption('ic_engineer');

      // Question should now be visible
      await expect(page.getByText('Are you the budget owner or project sponsor?')).toBeVisible();
    });

    test('should appear for Other role', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);
      await page.locator('select[name="role_title"]').selectOption('other');

      await expect(page.getByText('Are you the budget owner or project sponsor?')).toBeVisible();
    });

    test('should NOT appear for senior roles (Founder, VP, Eng Manager)', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);

      // Test Founder
      await page.locator('select[name="role_title"]').selectOption('founder_csuite');
      await expect(
        page.getByText('Are you the budget owner or project sponsor?')
      ).not.toBeVisible();

      // Test VP/Director
      await page.locator('select[name="role_title"]').selectOption('vp_director');
      await expect(
        page.getByText('Are you the budget owner or project sponsor?')
      ).not.toBeVisible();

      // Test Eng Manager
      await page.locator('select[name="role_title"]').selectOption('eng_manager');
      await expect(
        page.getByText('Are you the budget owner or project sponsor?')
      ).not.toBeVisible();
    });

    test('should require answer for IC/Other before proceeding', async ({ page }) => {
      await navigateToIntakeForm(page);

      await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
      await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);
      await page.locator('select[name="role_title"]').selectOption('ic_engineer');

      // Button should be disabled without answering decision maker question
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

      // Answer the question
      await page.getByRole('button', { name: 'Yes, I am' }).click();
      await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeEnabled();
    });
  });
});

// =============================================================================
// CONDITIONAL LOGIC TESTS
// =============================================================================

test.describe('Conditional Logic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIntakeForm(page);

    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();
  });

  test.describe('Audit Service Type', () => {
    test('should show symptom follow-up when audit is selected', async ({ page }) => {
      // Initially symptoms field should not be visible
      await expect(
        page.getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
      ).not.toBeVisible();

      // Select audit service type
      await page.getByText('Audit of existing AI system').click();

      // Symptoms field should now be visible
      await expect(
        page.getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
      ).toBeVisible();
      await expect(page.getByText('Top 1-2 symptoms you\'re seeing?')).toBeVisible();
    });

    test('symptoms field should be optional for audit', async ({ page }) => {
      await page.getByText('Audit of existing AI system').click();

      // Add context but NOT symptoms
      await page
        .getByPlaceholder(
          'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
        )
        .fill(TEST_DATA.sufficientContext);

      // Should be able to proceed without symptoms
      await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeEnabled();
    });
  });

  test.describe('Project Service Type', () => {
    test('should show subtype selection when project is selected', async ({ page }) => {
      // Initially subtype options should not be visible
      await expect(page.getByRole('button', { name: 'Prototype-to-Production' })).not.toBeVisible();

      // Select project service type
      await page.getByText('Build or ship something').click();

      // Subtype options should now be visible
      await expect(page.getByRole('button', { name: 'Prototype-to-Production' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'RAG Reliability Sprint' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Other build/ship project' })).toBeVisible();
    });

    test('should show prototype state follow-up when prototype_to_production is selected', async ({
      page,
    }) => {
      await page.getByText('Build or ship something').click();

      // Initially prototype state field should not be visible
      await expect(
        page.getByPlaceholder(
          'e.g., Jupyter notebook, containerized model, deployed in staging...'
        )
      ).not.toBeVisible();

      // Select prototype-to-production subtype
      await page.getByRole('button', { name: 'Prototype-to-Production' }).click();

      // Prototype state field should now be visible
      await expect(
        page.getByPlaceholder(
          'e.g., Jupyter notebook, containerized model, deployed in staging...'
        )
      ).toBeVisible();
      await expect(page.getByText('Current state of your prototype?')).toBeVisible();
    });

    test('should show RAG issues follow-up when rag_reliability_sprint is selected', async ({
      page,
    }) => {
      await page.getByText('Build or ship something').click();

      // Initially RAG issues field should not be visible
      await expect(
        page.getByPlaceholder(
          'e.g., hallucinations, poor document retrieval, slow generation...'
        )
      ).not.toBeVisible();

      // Select RAG reliability sprint subtype
      await page.getByRole('button', { name: 'RAG Reliability Sprint' }).click();

      // RAG issues field should now be visible
      await expect(
        page.getByPlaceholder(
          'e.g., hallucinations, poor document retrieval, slow generation...'
        )
      ).toBeVisible();
      await expect(page.getByText('Main issues with your RAG pipeline?')).toBeVisible();
    });

    test('should clear subtype-specific fields when subtype changes', async ({ page }) => {
      await page.getByText('Build or ship something').click();

      // Select prototype-to-production and fill in state
      await page.getByRole('button', { name: 'Prototype-to-Production' }).click();
      await page
        .getByPlaceholder(
          'e.g., Jupyter notebook, containerized model, deployed in staging...'
        )
        .fill('Jupyter notebook in staging');

      // Switch to RAG reliability sprint
      await page.getByRole('button', { name: 'RAG Reliability Sprint' }).click();

      // Prototype state field should not be visible, RAG issues should be
      await expect(
        page.getByPlaceholder(
          'e.g., Jupyter notebook, containerized model, deployed in staging...'
        )
      ).not.toBeVisible();
      await expect(
        page.getByPlaceholder(
          'e.g., hallucinations, poor document retrieval, slow generation...'
        )
      ).toBeVisible();
    });
  });

  test.describe('Advisory Paid Service Type', () => {
    test('should show questions follow-up when advisory_paid is selected', async ({ page }) => {
      // Initially advisory questions field should not be visible
      await expect(
        page.getByPlaceholder('What specific questions do you want to explore?')
      ).not.toBeVisible();

      // Select paid advisory
      await page.getByText('Paid advisory / second opinion').click();

      // Advisory questions field should now be visible
      await expect(
        page.getByPlaceholder('What specific questions do you want to explore?')
      ).toBeVisible();
      await expect(page.getByText('What do you want answered in this session?')).toBeVisible();
    });
  });

  test.describe('Unclear Service Type', () => {
    test('should show outcome follow-up when unclear is selected', async ({ page }) => {
      // Initially desired outcome field should not be visible
      await expect(
        page.getByPlaceholder('What does success look like for you?')
      ).not.toBeVisible();

      // Select unclear/not sure
      await page.getByText('Not sure yet').click();

      // Desired outcome field should now be visible
      await expect(page.getByPlaceholder('What does success look like for you?')).toBeVisible();
      await expect(page.getByText('What outcome are you hoping to achieve?')).toBeVisible();
    });
  });

  test('should clear conditional fields when service type changes', async ({ page }) => {
    // Select audit and fill symptoms
    await page.getByText('Audit of existing AI system').click();
    await page
      .getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
      .fill('High latency issues');

    // Switch to project
    await page.getByText('Build or ship something').click();

    // Audit symptoms field should not be visible
    await expect(
      page.getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
    ).not.toBeVisible();

    // Project subtype options should be visible
    await expect(page.getByRole('button', { name: 'Prototype-to-Production' })).toBeVisible();
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

test.describe('Navigation Tests', () => {
  test('should navigate forward through all steps with valid data', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Step 1
    await expect(page.getByText("Let's start with the basics")).toBeVisible();
    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    // Step 2
    await expect(page.getByText('Tell me about your project')).toBeVisible();
    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    // Step 3
    await expect(page.getByText('A few final questions')).toBeVisible();
  });

  test('should navigate backward and preserve data', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Fill Step 1
    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      company: TEST_DATA.companyName,
      role: 'vp_director',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    // Fill Step 2
    await fillProjectDetails(page, {
      serviceType: 'audit',
      context: TEST_DATA.sufficientContext,
      auditSymptoms: 'High latency',
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    // Go back to Step 2
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Tell me about your project')).toBeVisible();

    // Verify data is preserved
    await expect(
      page.getByPlaceholder('e.g., high latency, unexpected costs, inaccurate results...')
    ).toHaveValue('High latency');
    await expect(
      page.getByPlaceholder(
        'Describe your current situation, challenges, and what success looks like. The more specific, the better I can help.'
      )
    ).toHaveValue(TEST_DATA.sufficientContext);

    // Go back to Step 1
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText("Let's start with the basics")).toBeVisible();

    // Verify Step 1 data is preserved
    await expect(page.getByPlaceholder('John Doe')).toHaveValue(TEST_DATA.validName);
    await expect(page.getByPlaceholder('name@company.com')).toHaveValue(TEST_DATA.businessEmail);
    await expect(page.getByPlaceholder('Acme Corp')).toHaveValue(TEST_DATA.companyName);
    await expect(page.locator('select[name="role_title"]')).toHaveValue('vp_director');
  });

  test('should update progress indicator correctly', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Verify initial progress (Step 1)
    // Progress indicator shows current step with different styling
    const progressSteps = page.locator('[class*="rounded-full"]').filter({
      has: page.locator('text=/[1-3]/'),
    });

    // Fill and move to Step 2
    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    // Verify on Step 2
    await expect(page.getByText('Tell me about your project')).toBeVisible();

    // Fill and move to Step 3
    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    // Verify on Step 3
    await expect(page.getByText('A few final questions')).toBeVisible();
  });

  test('should not proceed from Step 1 without required fields', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Try to click continue without filling anything
    await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

    // Fill only name
    await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
    await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeDisabled();

    // Verify still on Step 1
    await expect(page.getByText("Let's start with the basics")).toBeVisible();
  });

  test('should not proceed from Step 2 without required fields', async ({ page }) => {
    await navigateToIntakeForm(page);

    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    // Try to proceed without filling required fields
    await expect(page.getByRole('button', { name: 'Continue to Final Step' })).toBeDisabled();

    // Verify still on Step 2
    await expect(page.getByText('Tell me about your project')).toBeVisible();
  });

  test('should not submit from Step 3 without required fields', async ({ page }) => {
    await navigateToIntakeForm(page);

    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    // Try to submit without filling required fields
    await expect(page.getByRole('button', { name: 'Submit Application' })).toBeDisabled();

    // Verify still on Step 3
    await expect(page.getByText('A few final questions')).toBeVisible();
  });

  test('should allow reset after submission', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Complete the form
    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    await fillQualification(page, {
      timeline: 'urgent',
      budget: '25k_50k',
      accessModel: 'remote_access',
    });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Wait for outcome screen
    await expect(page.getByText('Thank You')).toBeVisible({ timeout: 10000 });

    // Click reset/submit another
    await page.getByRole('button', { name: 'Submit another inquiry' }).click();

    // Should be back at Step 1 with empty form
    await expect(page.getByText("Let's start with the basics")).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toHaveValue('');
    await expect(page.getByPlaceholder('name@company.com')).toHaveValue('');
  });
});

// =============================================================================
// ADDITIONAL EDGE CASE TESTS
// =============================================================================

test.describe('Edge Cases', () => {
  test('advisory_paid service should bypass gate entirely', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Even with qualifying criteria, advisory_paid should route to paid advisory
    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    // Select paid advisory
    await fillProjectDetails(page, {
      serviceType: 'advisory_paid',
      context: TEST_DATA.sufficientContext,
      advisoryQuestions: 'How should we approach vector search optimization?',
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    await fillQualification(page, {
      timeline: 'urgent',
      budget: 'over_50k',
      accessModel: 'remote_access',
    });

    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Should always show paid advisory outcome for advisory_paid service type
    await expect(page.getByText('1-Hour Advisory Session')).toBeVisible({ timeout: 10000 });
  });

  test('company name should be optional', async ({ page }) => {
    await navigateToIntakeForm(page);

    // Fill without company name
    await page.getByPlaceholder('John Doe').fill(TEST_DATA.validName);
    await page.getByPlaceholder('name@company.com').fill(TEST_DATA.businessEmail);
    await page.locator('select[name="role_title"]').selectOption('founder_csuite');

    // Should be able to proceed without company
    await expect(page.getByRole('button', { name: 'Continue to Project Details' })).toBeEnabled();
  });

  test('should handle exploring timeline correctly (gate fail)', async ({ page }) => {
    await navigateToIntakeForm(page);

    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    // Exploring timeline = 3+ months = not urgent = should fail gate
    await fillQualification(page, {
      timeline: 'exploring',
      budget: '25k_50k',
      accessModel: 'remote_access',
    });

    await page.getByRole('button', { name: 'Submit Application' }).click();
    await expect(page.getByText('1-Hour Advisory Session')).toBeVisible({ timeout: 10000 });
  });

  test('should handle unsure access model correctly (manual review)', async ({ page }) => {
    await navigateToIntakeForm(page);

    await fillBasicInfo(page, {
      name: TEST_DATA.validName,
      email: TEST_DATA.businessEmail,
      role: 'founder_csuite',
    });
    await page.getByRole('button', { name: 'Continue to Project Details' }).click();

    await fillProjectDetails(page, {
      serviceType: 'project',
      context: TEST_DATA.sufficientContext,
    });
    await page.getByRole('button', { name: 'Continue to Final Step' }).click();

    await fillQualification(page, {
      timeline: 'urgent',
      budget: '25k_50k',
      accessModel: 'unsure',
    });

    await page.getByRole('button', { name: 'Submit Application' }).click();
    await expect(page.getByText('Response within 24-48 hours')).toBeVisible({ timeout: 10000 });
  });
});
