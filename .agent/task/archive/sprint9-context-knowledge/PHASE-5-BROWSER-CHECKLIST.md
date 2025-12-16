# Sprint 9 Phase 5: Browser/UI Manual Testing Checklist

**Environment:** Mac mini Docker (`http://192.168.1.15:3000`)  
**Test Credentials:**
- Email: `dev@projectpulse.local`
- Password: `dev123456`

---

## Pre-Test Setup

1. Ensure Mac mini Docker services are running:
   ```bash
   docker compose -f docker-compose.cloud.yml ps
   ```
   
2. Verify web app health:
   ```bash
   curl http://192.168.1.15:3000/api/health
   # Should return: {"status":"healthy","database":"connected",...}
   ```

---

## Test Case 1: Login & Authentication

**Steps:**
1. Open browser: `http://192.168.1.15:3000`
2. If not logged in, should redirect to `/login`
3. Enter credentials:
   - Email: `dev@projectpulse.local`
   - Password: `dev123456`
4. Click "Sign In"

**Expected Results:**
- ✅ Login succeeds without errors
- ✅ Redirects to dashboard or project home
- ✅ User session established (cookies set)

**Actual Results:**
- [passed ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 2: Knowledge Base Page Load

**Steps:**
1. Navigate to `http://192.168.1.15:3000/knowledge`
2. Observe page load and UI elements

**Expected Results:**
- ✅ Page loads without redirect to login
- ✅ Header shows "Knowledge Base" title
- ✅ Subtitle shows: "{count} items • Hybrid search enabled • Agent-managed repository"
- ✅ Inline help text visible: "💡 Knowledge items are created and updated by AI agents via MCP tools"
- ✅ "Agent-Only" button present (disabled, grayed out)
- ✅ Button tooltip: "Knowledge items are managed by AI agents. Use MCP tools: projectpulse_knowledge_create"

**Actual Results:**
- [ passed but we still do not have anything in knowledge base, did'nt we add all memory banks files in all the existing projects ?] Pass
- [ ] Fail (details: ________________)

---

## Test Case 3: Agent-First UI Semantics

**Steps:**
1. On `/knowledge` page, inspect the "Agent-Only" button
2. Try to click the button
3. Check if there's any "Add Knowledge" manual form

**Expected Results:**
- ✅ "Agent-Only" button is disabled (not clickable)
- ✅ Button has `opacity-50` and `cursor-not-allowed` styles
- ✅ NO manual "Add Knowledge" form exists
- ✅ UI clearly communicates that agents manage knowledge items

**Actual Results:**
- [passed ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 4: Search Mode Toggles

**Steps:**
1. On `/knowledge` page, locate search mode buttons
2. Click each mode: "Hybrid Search", "Full-Text Only", "Semantic Only"
3. Observe URL changes

**Expected Results:**
- ✅ Three search mode buttons visible
- ✅ Buttons have icons: Brain (Hybrid), Type (Full-Text), Wand2 (Semantic)
- ✅ Clicking changes URL query param: `?mode=hybrid`, `?mode=fulltext`, `?mode=semantic`
- ✅ Active mode shows coral gradient background
- ✅ Inactive modes show neu-raised style

**Actual Results:**
- [ passed ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 5: Project Scoping (Active Project)

**Steps:**
1. Check browser session for active project
2. If project selector exists, note current project ID
3. Enter search query (e.g., "test")
4. Observe results

**Expected Results:**
- ✅ Page shows knowledge items ONLY from active project
- ✅ No knowledge items from other projects visible
- ✅ Search results filtered by `projectId` (verified via `getActiveProjectForUser`)

**Actual Results:**
- Active ProjectId: ___
- [ passed but cannot confirm until there are knowledge items and memory banks should have been populated as default ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 6: Search Functionality

**Steps:**
1. Enter search query: "database schema"
2. Click search or press Enter
3. Observe URL and results

**Expected Results:**
- ✅ URL updates with `?search=database+schema`
- ✅ Search results appear (or "No articles found" message)
- ✅ Results show title, excerpt, category, tags
- ✅ Results remain project-scoped

**Actual Results:**
- [ cannot confirm until there are knowledge items and memory banks should have been populated as default ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 7: Tag Filtering

**Steps:**
1. If tags exist, click a tag filter
2. Observe URL and results

**Expected Results:**
- ✅ URL updates with `?tag={tagName}`
- ✅ Results filtered by tag
- ✅ Results remain project-scoped

**Actual Results:**
- [ cannot confirm until there are knowledge items and memory banks should have been populated as default ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 8: No Cross-Project Data Leakage (Multi-User)

**Prerequisites:** Access to two different user accounts with different projects

**Steps:**
1. Login as user 1, note project ID
2. Navigate to `/knowledge`, note items visible
3. Logout, login as user 2 with different project
4. Navigate to `/knowledge`, note items visible

**Expected Results:**
- ✅ User 1 sees ONLY items from their project
- ✅ User 2 sees ONLY items from their project
- ✅ NO overlap between user 1 and user 2 knowledge items

**Actual Results:**
- [ cannot confirm until there are knowledge items and memory banks should have been populated as default ] Pass
- [ ] Fail (details: ________________)

---

## Test Case 9: Browser Console (No Errors)

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to `/knowledge`
3. Perform search and filtering actions
4. Check Console tab for errors

**Expected Results:**
- ✅ NO JavaScript errors in console
- ✅ NO React hydration errors
- ✅ NO 4xx/5xx API errors in Network tab

**Actual Results:**
- [ passed] Pass
- [ ] Fail (details: ________________)

---

## Test Case 10: Accessibility (Basic Checks)

**Steps:**
1. On `/knowledge` page, use Tab key to navigate
2. Use screen reader if available
3. Check ARIA labels

**Expected Results:**
- ✅ All interactive elements keyboard-accessible
- ✅ Focus indicators visible
- ✅ ARIA labels present on buttons ("Add knowledge base item (agent-only)")
- ✅ Semantic HTML structure (header, main, etc.)

**Actual Results:**
- [ passed ] Pass
- [ ] Fail (details: ________________)

---

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Login & Authentication | [ ] | |
| 2. Knowledge Base Page Load | [ ] | |
| 3. Agent-First UI Semantics | [ ] | |
| 4. Search Mode Toggles | [ ] | |
| 5. Project Scoping | [ ] | |
| 6. Search Functionality | [ ] | |
| 7. Tag Filtering | [ ] | |
| 8. No Cross-Project Leakage | [ ] | |
| 9. Browser Console | [ ] | |
| 10. Accessibility | [ ] | |

**Overall Result:** ___/10 passed

---

## Recommendations

If any tests fail:
1. Document exact error messages/screenshots
2. Check browser console for details
3. Verify Docker services are running
4. Check `getActiveProjectForUser` returns correct projectId
5. Test with different browsers (Chrome, Firefox, Safari)

---

## Next Steps

After manual testing:
1. Document results in `PHASE-5-TEST-RESULTS.md`
2. Update `SPRINT9-TESTING-AND-VALIDATION.md`
3. Create automated Playwright tests (future enhancement)
