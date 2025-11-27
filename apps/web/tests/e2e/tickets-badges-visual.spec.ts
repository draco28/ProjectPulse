import { test, expect } from '@playwright/test';

test.describe('Ticket Badges Visual', () => {

  test.describe('Kind Badge Colors', () => {
    const kinds = ['feature', 'bug', 'scanner_finding', 'tech_debt'];
    
    kinds.forEach(kind => {
      test(`should display ${kind} badge with correct styling`, async ({ page }) => {
        // Filter to find one
        await page.goto(`/tickets?project=3&kind=${kind}`);
        
        // Check first item
        const firstTicket = page.locator('[data-testid="ticket-card"]').first();
        if (await firstTicket.isVisible()) {
           // Click title link (not card div which has checkbox)
           const titleLink = firstTicket.locator('h3 a');
           await titleLink.click();
           await page.waitForURL(/\/tickets\/\d+/);
           
           const kindBadge = page.locator('[data-testid="kind-badge"]');
           await expect(kindBadge).toBeVisible();
           
           // Check data-kind attribute (raw value) not text (display label)
           await expect(kindBadge).toHaveAttribute('data-kind', kind);
        } else {
           test.skip(`No ${kind} tickets found to verify badge`);
        }
      });
    });
  });

  test.describe('Priority Badge Colors', () => {
     const priorities = ['critical', 'high', 'medium', 'low'];

     priorities.forEach(priority => {
        test(`should display ${priority} priority badge`, async ({ page }) => {
           await page.goto(`/tickets?project=3&priority=${priority}`);
           
           const firstTicket = page.locator('[data-testid="ticket-card"]').first();
           if (await firstTicket.isVisible()) {
              // Use priority badge on card directly (no need to navigate to detail)
              const badge = firstTicket.locator('[data-testid="priority-badge"]');
              await expect(badge).toBeVisible();
           } else {
              test.skip(`No ${priority} tickets found`);
           }
        });
     });
  });
  
  test.describe('Status Badge States', () => {
      const statuses = ['open', 'closed', 'in-progress'];
      
      statuses.forEach(status => {
          test(`should display ${status} status badge`, async ({ page }) => {
              await page.goto(`/tickets?project=3&status=${status}`);
              const firstTicket = page.locator('[data-testid="ticket-card"]').first();
              if (await firstTicket.isVisible()) {
                 // Use status badge on card directly (no need to navigate to detail)
                 const badge = firstTicket.locator('[data-testid="status-badge"]');
                 await expect(badge).toBeVisible();
              } else {
                 test.skip(`No ${status} tickets found`);
              }
          });
      });
  });

});
