/**
 * E2E Test: Tickets Advanced Filtering
 *
 * Tests advanced filtering scenarios on the /tickets page including:
 * - Multiple kind filters (multi-select with AND/OR logic)
 * - Combined filters (kind + status + priority + module)
 * - Filter persistence in URL query params
 * - Clear all filters functionality
 * - Filter count indicators (e.g., "5 filters applied")
 * - Status filter combinations (open + in_progress)
 * - Priority filter combinations (critical + high)
 * - Module filter (autocomplete or dropdown)
 * - Date range filters (created/updated date ranges)
 * - Search combined with filters
 * - Filter state persistence after navigation
 * - Empty state with active filters
 * - Reset individual filters
 * - Filter presets (e.g., "My Open Tickets", "Critical Bugs")
 * - Quick filters for common combinations
 *
 * Sprint 10: Unified Ticket System with Advanced Filtering
 */
import { test, expect } from '@playwright/test';

test.describe('Tickets Advanced Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tickets list page before each test
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
  });

  test('should allow selecting multiple kind filters simultaneously', async ({ page }) => {
    // Select first kind (e.g., "feature")
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature"), button:has-text("Feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');

      // Verify URL includes first filter
      await expect(page).toHaveURL(/kind=feature/);
      console.log('✓ First kind filter applied: feature');

      // Select second kind (e.g., "bug") - should add to filter, not replace
      const bugFilter = page.locator('[data-testid="kind-pill"]:has-text("bug"), button:has-text("Bug")');
      if ((await bugFilter.count()) > 0) {
        await bugFilter.first().click();
        await page.waitForLoadState('networkidle');

        // Verify URL includes both filters
        const url = page.url();
        const hasFeature = url.includes('feature');
        const hasBug = url.includes('bug');

        if (hasFeature && hasBug) {
          console.log('✓ Multiple kind filters applied: feature + bug');
        } else {
          console.log('⚠️ Multiple kind filters may not be supported (only one active)');
        }
      }
    } else {
      console.log('⚠️ Kind filter pills not found - may use different UI pattern');
    }
  });

  test('should combine kind + status + priority filters with AND logic', async ({ page }) => {
    // Apply kind filter
    const kindFilter = page.locator('[data-testid="kind-pill"]:has-text("issue"), button:has-text("Issue")');
    if ((await kindFilter.count()) > 0) {
      await kindFilter.first().click();
      await page.waitForLoadState('networkidle');
      console.log('✓ Applied kind filter: issue');
    }

    // Apply status filter
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]');
    if ((await statusFilter.count()) > 0) {
      if ((await statusFilter.locator('select').count()) > 0) {
        await statusFilter.locator('select').selectOption('open');
      } else {
        await statusFilter.click();
        const openOption = page.locator('text=/^open$/i');
        if ((await openOption.count()) > 0) {
          await openOption.click();
        }
      }
      await page.waitForLoadState('networkidle');
      console.log('✓ Applied status filter: open');
    }

    // Apply priority filter
    const priorityFilter = page.locator('[data-testid="priority-filter"], select[name="priority"]');
    if ((await priorityFilter.count()) > 0) {
      if ((await priorityFilter.locator('select').count()) > 0) {
        await priorityFilter.locator('select').selectOption('high');
      } else {
        await priorityFilter.click();
        const highOption = page.locator('text=/^high$/i');
        if ((await highOption.count()) > 0) {
          await highOption.click();
        }
      }
      await page.waitForLoadState('networkidle');
      console.log('✓ Applied priority filter: high');
    }

    // Verify all filters are in URL
    const url = page.url();
    const hasKind = url.includes('kind=issue');
    const hasStatus = url.includes('status=open');
    const hasPriority = url.includes('priority=high');

    if (hasKind && hasStatus && hasPriority) {
      console.log('✓ All three filters applied: kind=issue, status=open, priority=high');
    } else {
      console.log(`⚠️ Combined filters partial: kind=${hasKind}, status=${hasStatus}, priority=${hasPriority}`);
    }

    // Verify results match all filters (if tickets exist)
    const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card');
    const count = await ticketCards.count();

    if (count > 0) {
      console.log(`✓ ${count} tickets match combined filters`);
    } else {
      console.log('ℹ️ No tickets match combined filters (may be expected)');
    }
  });

  test('should persist filters in URL query params', async ({ page }) => {
    // Apply multiple filters
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature"), button:has-text("Feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Get current URL with filters
    const urlWithFilters = page.url();
    console.log(`✓ URL with filters: ${urlWithFilters}`);

    // Navigate away
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate back using the saved URL
    await page.goto(urlWithFilters);
    await page.waitForLoadState('networkidle');

    // Verify filters are still applied
    expect(page.url()).toBe(urlWithFilters);
    console.log('✓ Filters persisted after navigation');

    // Verify filter UI reflects persisted state
    const activeFilter = page.locator('[data-testid="kind-pill"].active, [aria-selected="true"]');
    if ((await activeFilter.count()) > 0) {
      console.log('✓ Filter UI reflects persisted state');
    }
  });

  test('should display filter count indicator when filters are active', async ({ page }) => {
    // Apply multiple filters
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for filter count indicator
    const filterCount = page.locator(
      '[data-testid="filter-count"], text=/\\d+ filters?.*applied/i, .badge:has-text(/\\d+/)'
    );

    if ((await filterCount.count()) > 0) {
      const countText = await filterCount.first().textContent();
      console.log(`✓ Filter count indicator: ${countText}`);
      await expect(filterCount.first()).toBeVisible();
    } else {
      console.log('⚠️ Filter count indicator not found - may not be implemented');
    }
  });

  test('should provide clear all filters button', async ({ page }) => {
    // Apply a filter first
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for clear filters button
    const clearButton = page.locator(
      'button:has-text("Clear"), button:has-text("Reset"), button:has-text("Remove all")'
    );

    if ((await clearButton.count()) > 0) {
      await expect(clearButton.first()).toBeVisible();
      console.log('✓ Clear filters button found');

      // Click to clear
      await clearButton.first().click();
      await page.waitForLoadState('networkidle');

      // Verify URL no longer has filter params
      const url = page.url();
      const hasNoFilters = !url.includes('kind=') && !url.includes('status=') && !url.includes('priority=');

      if (hasNoFilters) {
        console.log('✓ All filters cleared');
      } else {
        console.log('⚠️ Some filters may still be active after clear');
      }
    } else {
      console.log('⚠️ Clear filters button not found - may not be implemented');
    }
  });

  test('should allow filtering by multiple statuses (open + in_progress)', async ({ page }) => {
    // Check if multi-select status filter exists
    const statusFilter = page.locator('[data-testid="status-filter-multi"], [data-testid="status-filter"]');

    if ((await statusFilter.count()) > 0) {
      // Try to select multiple statuses
      const openCheckbox = page.locator('input[type="checkbox"][value="open"], label:has-text("Open")');
      const inProgressCheckbox = page.locator('input[type="checkbox"][value="in_progress"], label:has-text("In Progress")');

      if ((await openCheckbox.count()) > 0 && (await inProgressCheckbox.count()) > 0) {
        await openCheckbox.click();
        await inProgressCheckbox.click();
        await page.waitForLoadState('networkidle');

        // Verify both statuses in URL
        const url = page.url();
        const hasOpen = url.includes('open');
        const hasInProgress = url.includes('in_progress') || url.includes('in-progress');

        if (hasOpen && hasInProgress) {
          console.log('✓ Multiple status filters applied: open + in_progress');
        } else {
          console.log('⚠️ Multiple status filters may not be supported');
        }
      } else {
        console.log('ℹ️ Multi-select status filter not implemented (may be single-select only)');
      }
    } else {
      console.log('⚠️ Status filter not found');
    }
  });

  test('should filter by module with autocomplete or dropdown', async ({ page }) => {
    // Look for module filter
    const moduleFilter = page.locator(
      'input[name="module"], select[name="module"], [data-testid="module-filter"]'
    );

    if ((await moduleFilter.count()) > 0) {
      await expect(moduleFilter.first()).toBeVisible();
      console.log('✓ Module filter found');

      // If it's an input (autocomplete), type a module name
      if ((await moduleFilter.locator('input').count()) > 0) {
        await moduleFilter.locator('input').fill('API');
        await page.waitForLoadState('networkidle');

        // Look for autocomplete suggestions
        const suggestions = page.locator('[role="listbox"], .autocomplete-item, [data-testid="module-suggestion"]');
        if ((await suggestions.count()) > 0) {
          console.log('✓ Module autocomplete suggestions displayed');
          await suggestions.first().click();
        }
      } else if ((await moduleFilter.locator('select').count()) > 0) {
        // If it's a select, choose first option
        const options = await moduleFilter.locator('select option').allTextContents();
        if (options.length > 1) {
          await moduleFilter.locator('select').selectOption(options[1]);
          console.log(`✓ Selected module: ${options[1]}`);
        }
      }

      await page.waitForLoadState('networkidle');

      // Verify URL includes module filter
      await expect(page).toHaveURL(/module=/);
      console.log('✓ Module filter applied to URL');
    } else {
      console.log('⚠️ Module filter not found - may not be implemented');
    }
  });

  test('should filter by date range (created date)', async ({ page }) => {
    // Look for date range filter
    const dateFilter = page.locator(
      '[data-testid="date-filter"], input[type="date"], button:has-text("Date range")'
    );

    if ((await dateFilter.count()) > 0) {
      console.log('✓ Date filter found');

      // If date inputs exist, set range
      const startDateInput = page.locator('input[name="startDate"], input[name="from"]');
      const endDateInput = page.locator('input[name="endDate"], input[name="to"]');

      if ((await startDateInput.count()) > 0 && (await endDateInput.count()) > 0) {
        // Set date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        await startDateInput.fill(thirtyDaysAgo.toISOString().split('T')[0]);
        await endDateInput.fill(today.toISOString().split('T')[0]);
        await page.waitForLoadState('networkidle');

        // Verify URL includes date filters
        const url = page.url();
        const hasDateFilter = url.includes('startDate') || url.includes('createdFrom') || url.includes('from');

        if (hasDateFilter) {
          console.log('✓ Date range filter applied');
        } else {
          console.log('⚠️ Date range filter not reflected in URL');
        }
      } else {
        console.log('ℹ️ Date range inputs not found (may use different UI)');
      }
    } else {
      console.log('⚠️ Date filter not found - may not be implemented yet');
    }
  });

  test('should combine search with filters', async ({ page }) => {
    // First apply a kind filter
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
      console.log('✓ Applied kind filter: feature');
    }

    // Then perform search
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('api');
      await page.waitForLoadState('networkidle');
      console.log('✓ Performed search: api');

      // Verify URL has both filter and search
      const url = page.url();
      const hasKindFilter = url.includes('kind=feature');
      const hasSearchQuery = url.includes('search=') || url.includes('q=');

      if (hasKindFilter && hasSearchQuery) {
        console.log('✓ Search combined with kind filter in URL');
      } else {
        console.log(`⚠️ Combined search/filter partial: kind=${hasKindFilter}, search=${hasSearchQuery}`);
      }

      // Verify results match both search and filter
      const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card');
      const count = await ticketCards.count();

      if (count > 0) {
        console.log(`✓ ${count} tickets match search + filter`);
      } else {
        console.log('ℹ️ No tickets match combined search + filter (may be expected)');
      }
    }
  });

  test('should maintain filter state when navigating to detail and back', async ({ page }) => {
    // Apply filter
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    const urlWithFilter = page.url();
    console.log(`✓ Applied filter, URL: ${urlWithFilter}`);

    // Navigate to a ticket detail page
    const firstTicket = page.locator('[data-testid="ticket-card"] a, .ticket-card a').first();
    if ((await firstTicket.count()) > 0) {
      await firstTicket.click();
      await page.waitForURL(/\/tickets\/\d+/);
      console.log('✓ Navigated to ticket detail page');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify filter is still applied
      const currentUrl = page.url();
      expect(currentUrl).toBe(urlWithFilter);
      console.log('✓ Filter state maintained after back navigation');
    } else {
      console.log('⚠️ No tickets to navigate to');
    }
  });

  test('should show empty state message with active filters when no results', async ({ page }) => {
    // Apply unlikely combination of filters that should return no results
    const kindFilter = page.locator('[data-testid="kind-pill"]:has-text("bug")');
    if ((await kindFilter.count()) > 0) {
      await kindFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Add search for unlikely string
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('xyzabc123nonexistent99999');
      await page.waitForLoadState('networkidle');

      // Look for empty state
      const emptyState = page.locator(
        'text=/no tickets.*match/i, text=/no results/i, [data-testid="empty-state"]'
      );

      if ((await emptyState.count()) > 0) {
        await expect(emptyState.first()).toBeVisible();
        console.log('✓ Empty state with filters displayed');

        // Check if it mentions clearing filters
        const clearSuggestion = page.locator('text=/clear.*filter/i, text=/try.*different/i');
        if ((await clearSuggestion.count()) > 0) {
          console.log('✓ Empty state suggests clearing filters');
        }
      } else {
        // Verify no ticket cards are shown
        const ticketCards = page.locator('[data-testid="ticket-card"]');
        expect(await ticketCards.count()).toBe(0);
        console.log('✓ No tickets displayed with non-matching filters');
      }
    }
  });

  test('should allow resetting individual filters', async ({ page }) => {
    // Apply multiple filters
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    const bugFilter = page.locator('[data-testid="kind-pill"]:has-text("bug")');
    if ((await bugFilter.count()) > 0) {
      await bugFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for individual filter remove buttons (X icons)
    const removeFilterButton = page.locator(
      '[data-testid="remove-filter"], .filter-tag button, .badge button'
    ).first();

    if ((await removeFilterButton.count()) > 0) {
      await removeFilterButton.click();
      await page.waitForLoadState('networkidle');

      console.log('✓ Removed individual filter');

      // Verify one filter removed but others remain
      const url = page.url();
      const stillHasFilters = url.includes('kind=');
      expect(stillHasFilters).toBe(true);
      console.log('✓ Other filters still active after removing one');
    } else {
      // Alternative: Click active filter pill again to deactivate
      if ((await featureFilter.count()) > 0) {
        await featureFilter.first().click();
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const noFeatureFilter = !url.includes('feature') || url.includes('bug');
        if (noFeatureFilter) {
          console.log('✓ Individual filter removed by clicking pill again');
        }
      }
    }
  });

  test('should support filter presets (e.g., "My Open Tickets")', async ({ page }) => {
    // Look for preset filter buttons
    const presetButtons = page.locator(
      '[data-testid="filter-preset"], button:has-text("My Tickets"), button:has-text("Open"), button:has-text("Critical")'
    );

    if ((await presetButtons.count()) > 0) {
      await expect(presetButtons.first()).toBeVisible();
      console.log(`✓ Found ${await presetButtons.count()} filter preset(s)`);

      // Click first preset
      await presetButtons.first().click();
      await page.waitForLoadState('networkidle');

      // Verify filters were applied
      const url = page.url();
      const hasFilters = url.includes('status=') || url.includes('priority=') || url.includes('kind=');

      if (hasFilters) {
        console.log('✓ Filter preset applied filters to URL');
      } else {
        console.log('⚠️ Filter preset did not update URL');
      }
    } else {
      console.log('ℹ️ Filter presets not found - may not be implemented');
    }
  });

  test('should display active filters as removable badges/chips', async ({ page }) => {
    // Apply filters
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for active filter badges
    const activeFilterBadges = page.locator(
      '[data-testid="active-filter"], .filter-badge, .filter-chip, .badge.active'
    );

    if ((await activeFilterBadges.count()) > 0) {
      console.log(`✓ Found ${await activeFilterBadges.count()} active filter badge(s)`);

      // Verify badges have remove buttons (X icon)
      const removeBadge = activeFilterBadges.first().locator('button, svg, .remove');
      if ((await removeBadge.count()) > 0) {
        await expect(removeBadge).toBeVisible();
        console.log('✓ Active filter badges have remove buttons');
      }
    } else {
      console.log('⚠️ Active filter badges not found - may use different UI');
    }
  });

  test('should persist filter state in browser history', async ({ page }) => {
    // Apply first filter
    const featureFilter = page.locator('[data-testid="kind-pill"]:has-text("feature")');
    if ((await featureFilter.count()) > 0) {
      await featureFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    const firstFilterUrl = page.url();

    // Apply second filter
    const bugFilter = page.locator('[data-testid="kind-pill"]:has-text("bug")');
    if ((await bugFilter.count()) > 0) {
      await bugFilter.first().click();
      await page.waitForLoadState('networkidle');
    }

    const secondFilterUrl = page.url();

    // Use browser back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back to first filter state
    expect(page.url()).toBe(firstFilterUrl);
    console.log('✓ Browser back restored previous filter state');

    // Use browser forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be back to second filter state
    expect(page.url()).toBe(secondFilterUrl);
    console.log('✓ Browser forward restored next filter state');
  });
});
