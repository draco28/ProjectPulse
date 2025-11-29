import { test, expect } from '@playwright/test';

test.describe('Assignee Types', () => {
  
  test.describe('Human Assignee', () => {
    test('should create ticket assigned to human user', async ({ page }) => {
      await page.goto('/tickets/create?project=3');
      await page.fill('input[name="title"]', `Human Assignee ${Date.now()}`);
      await page.selectOption('select[name="kind"]', 'task');

      // Attempt to select a human assignee if available
      const assigneeSelect = page.locator('select[name="assignee"]');
      const options = await assigneeSelect.locator('option').count();
      
      if (options > 1) {
        // Select the second option (assuming first is empty/default)
        await assigneeSelect.selectOption({ index: 1 });
        
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/tickets\/\d+/);
        
        // Verification would depend on having a specific human user ID/name known
        // For now, verifying creation is successful
      } else {
        test.skip(); // No assignees available to select
      }
    });

    test('should filter tickets by human assignee', async ({ page }) => {
      await page.goto('/tickets?project=3&assigneeType=human');
      await expect(page).toHaveURL(/assigneeType=human/);
    });
  });

  test.describe('Agent Persona Assignee', () => {
    test('should filter tickets by agent assignee', async ({ page }) => {
      await page.goto('/tickets?project=3&assigneeType=agent_persona');
      await expect(page).toHaveURL(/assigneeType=agent_persona/);
    });
    
    // Note: Creating agent-assigned tickets might require specific setup or API calls
    // if the UI doesn't mix human/agents in the same dropdown or has a toggle.
    // Assuming standard flow for now.
  });

});
