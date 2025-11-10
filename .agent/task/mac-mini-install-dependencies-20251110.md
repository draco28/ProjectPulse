# Mac Mini: Install Dependencies for Day 3 Features

**Date**: 2025-11-10
**Reason**: Dependencies added for Wiki Editor (TipTap, marked, @hookform/resolvers)
**Status**: Pending execution on Mac mini

## Issue

After pushing Day 3 code, Mac mini shows HTTP 500 errors:
```
Module not found: Can't resolve '@hookform/resolvers/zod'
```

## Root Cause

Dependencies were added to package.json on Windows but not installed on Mac mini yet:
- @tiptap/react@2.26.4
- @tiptap/starter-kit@2.26.4
- @tiptap/pm@2.26.4
- @tiptap/html@3.10.5
- marked@17.0.0
- @hookform/resolvers@5.2.2

## Fix (Run on Mac mini)

```bash
cd /app
pnpm install
```

## Verification

After running pnpm install, test the routes:

```bash
# Should return HTTP 200
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/wiki
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/wiki/new
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/wiki/getting-started/edit
```

All three should return `HTTP 200`.

## Alternative (if Mac mini not accessible)

Pull changes and run from Windows (not recommended, but works):
```bash
cd F:\Web_Projects\AI_HUB
git pull origin master
pnpm install
pnpm dev
# Access at http://localhost:3000
```

---

**Waiting for**: Mac mini to run `pnpm install`
**Next step after fix**: Continue testing (see test plan in current session)
