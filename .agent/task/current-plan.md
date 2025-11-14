# Day 12 Implementation Plan: Health MCP Tools

**Sprint 7, Day 12 - US-111, US-112, US-113**
**Date**: 2025-11-14
**Points**: 3 (1 point per tool)
**Status**: Ready for implementation

---

## Overview

Implement 3 MCP tools for health monitoring that enable AI agents to execute scanners, retrieve scores, and analyze trends:

1. **health.runScan** - Execute health scanners and save findings + calculate scores
2. **health.getScore** - Retrieve latest health score(s) with optional trend analysis
3. **health.getHistory** - Retrieve historical score trends with analytics

These tools complete the health monitoring system (Days 8-11 provided scanners and scoring).

---

## Architecture Context

### Existing System

**Scanners (Day 8-10)**:
- Semgrep (SECURITY), ESLint (CODE_QUALITY), axe-core (ACCESSIBILITY), Lighthouse (PERFORMANCE)
- Interface: `Scanner.scan(projectPath, options?) → Promise<ScanResult>`
- Registry: `getScanner(type: ScannerType)` returns instance

**Score Calculation (Day 11)**:
- `calculateHealthScore(findings: FindingData[]) → HealthScoreData`
- Returns: overallScore, securityScore, qualityScore, performanceScore, accessibilityScore, grade
- Formula: weighted average (40% security, 30% quality, 20% accessibility, 10% performance)

**Database Models**:
- HealthScanner: id, name, type, projectId, lastRun (unique[projectId, type])
- HealthFinding: id, scannerId, category, severity, ruleId, message, filePath, status, falsePositive
- HealthScore: id, projectId, scores (4 categories), calculatedAt (for trend tracking)

### MCP Handler Pattern (from knowledge-handler.ts)

```typescript
// 1. Define input/output interfaces
export interface ToolNameInput {
  field1: string;
  field2?: number; // optional
}

export interface ToolNameOutput {
  result: string;
  metadata: object;
}

// 2. Implement handler
export async function toolNameHandler(input: unknown): Promise<ToolNameOutput> {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      throw new MCPError('Invalid input', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }
    
    // Validate fields
    const params = input as ToolNameInput;
    if (!params.field1 || typeof params.field1 !== 'string') {
      throw new MCPError('Missing field1', JSONRPC_ERROR_CODES.INVALID_PARAMS, 400);
    }
    
    // Execute operation
    const result = await someService.doWork(params);
    
    // Return formatted response
    return {
      result: result.value,
      metadata: { duration: elapsed }
    };
  } catch (error) {
    if (error instanceof MCPError) throw error;
    console.error('[tool.name] Error:', error);
    throw new MCPError(
      `Operation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

// 3. Register in route.ts
case 'tool.name':
  result = await toolNameHandler(args);
  break;
```

---

## Implementation Details

### Tool 1: health.runScan

**Purpose**: Execute health scanners, store findings, calculate scores, track history

**Input Schema**:
```json
{
  "projectId": { "type": "integer", "description": "Project ID" },
  "scannerTypes": {
    "type": "array",
    "items": { "type": "string", "enum": ["SEMGREP", "ESLINT", "AXECORE", "LIGHTHOUSE"] },
    "description": "Scanner types to execute (minimum 1)"
  },
  "projectPath": {
    "type": "string",
    "description": "Absolute path to project directory"
  }
}
```

**Processing Steps**:

1. **Validation** (10-20 lines)
   - Validate projectId is number, >0
   - Validate scannerTypes is non-empty array of valid enum values
   - Validate projectPath is string, non-empty
   - Query project record (ensure it exists)

2. **Scanner Execution** (50-80 lines)
   ```typescript
   const results = [];
   for (const scannerType of scannerTypes) {
     try {
       // Get/create HealthScanner record
       const scanner = await prisma.healthScanner.upsert({
         where: { projectId_type: { projectId, type: scannerType } },
         update: { lastRun: new Date() },
         create: { projectId, type: scannerType, name: `${scannerType} Scanner` }
       });
       
       // Execute scanner
       const scanResult = await getScanner(scannerType).scan(projectPath);
       
       // Map findings and batch insert
       const findings = scanResult.findings.map(f => ({
         scannerId: scanner.id,
         category: mapScannerTypeToCategory(scannerType),
         severity: f.severity,
         ruleId: f.ruleId,
         message: f.message,
         filePath: f.filePath,
         lineNumber: f.lineNumber,
         codeSnippet: f.codeSnippet,
         scanDate: new Date()
       }));
       
       await prisma.healthFinding.createMany({ data: findings });
       
       results.push({
         type: scannerType,
         totalFindings: findings.length,
         bySeverity: scanResult.summary.bySeverity
       });
     } catch (error) {
       // Log error, continue with other scanners
       results.push({
         type: scannerType,
         error: error.message
       });
     }
   }
   ```

3. **Score Calculation** (30-50 lines)
   ```typescript
   // Fetch all findings (excluding false positives)
   const allFindings = await prisma.healthFinding.findMany({
     where: {
       scanner: { projectId },
       falsePositive: false
     }
   });
   
   // Convert to FindingData[] format expected by calculateHealthScore
   const findingData = allFindings.map(f => ({
     ruleId: f.ruleId,
     severity: f.severity,
     message: f.message,
     filePath: f.filePath,
     lineNumber: f.lineNumber,
     codeSnippet: f.codeSnippet
   }));
   
   const scoreData = calculateHealthScore(findingData);
   
   // Save score
   const savedScore = await prisma.healthScore.create({
     data: {
       projectId,
       overallScore: scoreData.score,
       securityScore: scoreData.securityScore,
       qualityScore: scoreData.qualityScore,
       performanceScore: scoreData.performanceScore,
       accessibilityScore: scoreData.accessibilityScore,
       calculatedAt: new Date()
     }
   });
   ```

**Output Schema**:
```json
{
  "projectId": 4,
  "scannersRun": [
    {
      "type": "SEMGREP",
      "totalFindings": 44,
      "bySeverity": { "critical": 9, "high": 14, "medium": 21, "low": 0 }
    },
    {
      "type": "ESLINT",
      "totalFindings": 218,
      "bySeverity": { "critical": 0, "high": 12, "medium": 206, "low": 0 }
    }
  ],
  "healthScore": {
    "overallScore": 78,
    "securityScore": 72,
    "qualityScore": 81,
    "performanceScore": 85,
    "accessibilityScore": 79,
    "grade": "C"
  },
  "duration": 87500
}
```

**Error Handling**:
- INVALID_PARAMS (400): Missing/invalid projectId, invalid scanner types, invalid projectPath
- NOT_FOUND (404): projectId doesn't exist
- INTERNAL_ERROR (500): Scanner execution timeout, database failures

---

### Tool 2: health.getScore

**Purpose**: Retrieve current/recent health scores with optional trend analysis

**Input Schema**:
```json
{
  "projectId": { "type": "integer", "description": "Project ID" },
  "limit": { "type": "integer", "minimum": 1, "maximum": 10, "default": 1, "description": "Number of scores to return" }
}
```

**Processing Steps**:

1. **Validation** (5-10 lines)
   - Validate projectId is number, >0
   - Validate limit is 1-10
   - Verify projectId exists

2. **Score Retrieval** (20-30 lines)
   ```typescript
   const scores = await prisma.healthScore.findMany({
     where: { projectId },
     orderBy: { calculatedAt: 'desc' },
     take: limit,
     select: {
       id: true,
       overallScore: true,
       securityScore: true,
       qualityScore: true,
       performanceScore: true,
       accessibilityScore: true,
       calculatedAt: true
     }
   });
   
   // Reverse to chronological order (oldest → newest)
   scores.reverse();
   ```

3. **Trend Calculation** (if limit > 1) (40-60 lines)
   ```typescript
   if (scores.length > 1) {
     const newest = scores[scores.length - 1];
     const oldest = scores[0];
     const change = newest.overallScore - oldest.overallScore;
     
     const trend = {
       direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
       change: Math.round(change),
       period: `${scores.length} scores`
     };
   }
   ```

**Output Schema**:
```json
{
  "projectId": 4,
  "scores": [
    {
      "id": 1,
      "overallScore": 78,
      "securityScore": 72,
      "qualityScore": 81,
      "performanceScore": 85,
      "accessibilityScore": 79,
      "calculatedAt": "2025-11-14T10:30:00Z"
    }
  ],
  "trend": {
    "direction": "improving",
    "change": 5,
    "period": "1 score"
  }
}
```

**Error Handling**:
- INVALID_PARAMS (400): Invalid projectId or limit
- NOT_FOUND (404): projectId doesn't exist, no scores found

---

### Tool 3: health.getHistory

**Purpose**: Analyze historical score trends over time with metrics

**Input Schema**:
```json
{
  "projectId": { "type": "integer", "description": "Project ID" },
  "days": { "type": "integer", "minimum": 1, "maximum": 90, "default": 7, "description": "Days of history" },
  "category": {
    "type": "string",
    "enum": ["overall", "SECURITY", "CODE_QUALITY", "PERFORMANCE", "ACCESSIBILITY"],
    "default": "overall",
    "description": "Category to analyze"
  }
}
```

**Processing Steps**:

1. **Validation** (10-15 lines)
   - Validate projectId, days (1-90), category enum
   - Verify projectId exists
   - Calculate date threshold: `new Date(Date.now() - days * 86400000)`

2. **History Retrieval** (20-30 lines)
   ```typescript
   const threshold = new Date(Date.now() - params.days * 86400000);
   
   const history = await prisma.healthScore.findMany({
     where: {
       projectId,
       calculatedAt: { gte: threshold }
     },
     select: {
       calculatedAt: true,
       overallScore: category === 'overall',
       securityScore: category === 'SECURITY' || category === 'overall',
       qualityScore: category === 'CODE_QUALITY' || category === 'overall',
       performanceScore: category === 'PERFORMANCE' || category === 'overall',
       accessibilityScore: category === 'ACCESSIBILITY' || category === 'overall'
     },
     orderBy: { calculatedAt: 'asc' }
   });
   ```

3. **Trend Metrics Calculation** (50-80 lines)
   ```typescript
   // Extract score values based on category
   const scores = history.map(h => 
     category === 'overall' ? h.overallScore :
     category === 'SECURITY' ? h.securityScore :
     category === 'CODE_QUALITY' ? h.qualityScore :
     category === 'PERFORMANCE' ? h.performanceScore :
     h.accessibilityScore
   );
   
   // Calculate metrics
   const average = scores.reduce((a, b) => a + b, 0) / scores.length;
   const min = Math.min(...scores);
   const max = Math.max(...scores);
   
   // Linear regression: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
   const n = scores.length;
   let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
   for (let i = 0; i < n; i++) {
     const x = i;
     const y = scores[i];
     sumX += x;
     sumY += y;
     sumXY += x * y;
     sumX2 += x * x;
   }
   const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
   
   const trend = {
     average: Math.round(average * 10) / 10,
     min,
     max,
     slope: Math.round(slope * 100) / 100,
     direction: Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'improving' : 'declining'
   };
   ```

**Output Schema**:
```json
{
  "projectId": 4,
  "category": "overall",
  "period": {
    "days": 7,
    "from": "2025-11-07T10:30:00Z",
    "to": "2025-11-14T10:30:00Z"
  },
  "history": [
    { "date": "2025-11-07T10:30:00Z", "score": 75 },
    { "date": "2025-11-08T10:30:00Z", "score": 76 },
    { "date": "2025-11-14T10:30:00Z", "score": 78 }
  ],
  "trend": {
    "average": 76.3,
    "min": 75,
    "max": 78,
    "slope": 0.43,
    "direction": "improving"
  }
}
```

**Error Handling**:
- INVALID_PARAMS (400): Invalid projectId, days, or category
- NOT_FOUND (404): projectId doesn't exist, no history in date range

---

## File Structure

### Files to Create

**`apps/web/lib/mcp/handlers/health-handler.ts`** (~450 lines)
```typescript
// Imports
import { prisma } from '@/lib/prisma';
import { getScanner, getAvailableScanners } from '@/lib/health/scanners';
import { calculateHealthScore } from '@/lib/health/scoring';
import { MCPError, JSONRPC_ERROR_CODES } from '../types';
import { ScannerType, FindingCategory, FindingSeverity } from '@prisma/client';

// Input/Output Interfaces (120 lines)
export interface HealthRunScanInput { ... }
export interface HealthRunScanOutput { ... }
export interface HealthGetScoreInput { ... }
export interface HealthGetScoreOutput { ... }
export interface HealthGetHistoryInput { ... }
export interface HealthGetHistoryOutput { ... }

// Handler Functions (300 lines)
export async function healthRunScanHandler(input: unknown): Promise<HealthRunScanOutput> { ... }
export async function healthGetScoreHandler(input: unknown): Promise<HealthGetScoreOutput> { ... }
export async function healthGetHistoryHandler(input: unknown): Promise<HealthGetHistoryOutput> { ... }

// Helper Functions (30 lines)
function mapScannerTypeToCategory(type: ScannerType): FindingCategory { ... }
function calculateTrendMetrics(scores: number[]): TrendMetrics { ... }
```

**`apps/web/lib/mcp/handlers/__tests__/health-handler.test.ts`** (~300 lines)
```typescript
// Unit tests
describe('healthRunScanHandler', () => {
  test('validates required fields', () => { ... });
  test('executes scanners and saves findings', () => { ... });
  test('calculates health score after scan', () => { ... });
  test('handles scanner execution failure gracefully', () => { ... });
});

describe('healthGetScoreHandler', () => {
  test('retrieves latest score', () => { ... });
  test('calculates trend for multiple scores', () => { ... });
  test('returns empty array when no scores exist', () => { ... });
});

describe('healthGetHistoryHandler', () => {
  test('filters history by days', () => { ... });
  test('calculates trend metrics correctly', () => { ... });
  test('supports category filtering', () => { ... });
});
```

### Files to Modify

**`apps/web/app/api/mcp/route.ts`**

1. Add imports (after line 54):
```typescript
import {
  healthRunScanHandler,
  healthGetScoreHandler,
  healthGetHistoryHandler,
} from '@/lib/mcp/handlers/health-handler';
```

2. Add switch cases (in tools/call section, after skill tools):
```typescript
case 'health.runScan':
  result = await healthRunScanHandler(args);
  break;
case 'health.getScore':
  result = await healthGetScoreHandler(args);
  break;
case 'health.getHistory':
  result = await healthGetHistoryHandler(args);
  break;
```

3. Add tool definitions (in tools/list response, after skill tools):
```typescript
{
  name: 'health.runScan',
  description: 'Execute health scanners and calculate health scores',
  inputSchema: { ... }
},
{
  name: 'health.getScore',
  description: 'Retrieve current health scores with trend analysis',
  inputSchema: { ... }
},
{
  name: 'health.getHistory',
  description: 'Retrieve historical score trends and analytics',
  inputSchema: { ... }
}
```

4. Update error message (line 259) to include new tools in availableTools list

---

## Testing Strategy

### Unit Tests (50% coverage, required)
- Input validation for all required/optional fields
- Type coercion and boundary conditions (days: 1, 90, 91)
- Enum validation (scannerTypes, category)

### Integration Tests (50% coverage, required)
- End-to-end scan workflow (select → execute → save → score)
- Multiple scanner execution (2+ scanners in single call)
- Trend calculation with sample historical data
- Partial failure handling (1 scanner fails, others succeed)

### Test Fixtures
- Mock ScanResult with realistic finding counts (44 Semgrep, 218 ESLint)
- Sample HealthScore records for trend (7, 14, 30-day windows)
- Edge cases: empty findings, single score, all critical, all low

### Manual Testing (Post-Implementation)
1. Execute via MCP Inspector: curl POST /api/mcp with JSON-RPC request
2. Verify database: SELECT * FROM health_findings, health_scores
3. Performance: Measure latency for each tool
4. Error scenarios: invalid projectId, nonexistent scanners, etc.

---

## Success Criteria

### Functional Requirements
- [x] health.runScan executes 1+ scanners and stores findings
- [x] health.runScan calculates score after findings saved
- [x] health.runScan returns execution summary with counts
- [x] health.getScore returns latest score(s) with timestamps
- [x] health.getScore calculates trend when limit > 1
- [x] health.getHistory returns time-series data (oldest → newest)
- [x] health.getHistory includes trend metrics (average, min, max, slope, direction)
- [x] All 3 tools registered in /api/mcp route
- [x] All 3 tools listed in tools/list response with inputSchema

### Data Integrity
- [x] HealthScanner records created/updated with lastRun timestamp
- [x] HealthFinding records include all required fields (category, severity, etc.)
- [x] HealthScore records save all 4 category scores + overall
- [x] False positives excluded from score calculation (WHERE falsePositive = false)
- [x] Foreign key relationships maintained (scanner → finding → project)

### Error Handling
- [x] INVALID_PARAMS for missing/invalid projectId
- [x] INVALID_PARAMS for empty scannerTypes array
- [x] INVALID_PARAMS for invalid enum values (scanner types, category)
- [x] INVALID_PARAMS for days out of range
- [x] NOT_FOUND for nonexistent projectId
- [x] NOT_FOUND for no scores in history range
- [x] INTERNAL_ERROR for scanner execution failures
- [x] Graceful degradation (partial success if 1 of N scanners fails)

### Performance
- [x] health.runScan: <5 seconds (dominated by scanner execution time)
- [x] health.getScore: <50ms (simple database query)
- [x] health.getHistory: <100ms (aggregate query with 30-90 day window)
- [x] Batch insert findings (not N individual inserts)
- [x] Index usage verified for projectId queries (EXPLAIN ANALYZE)

### Code Quality
- [x] TypeScript: 0 errors (strict mode)
- [x] ESLint: All rules passing
- [x] Input/Output interfaces documented with JSDoc
- [x] Following knowledge-handler pattern (input validation, error handling)
- [x] Consistent naming (health.X convention)

### Documentation
- [x] Tool descriptions match actual behavior
- [x] JSON Schema inputSchema matches handler validation
- [x] Example usage in handler comments
- [x] Updated .agent/system/api-catalog.md (3 health endpoints)
- [x] Updated .agent/system/mcp-tools-guide.md (3 health tools)

---

## Deliverables

### Code
1. `apps/web/lib/mcp/handlers/health-handler.ts` - 3 tool handlers + types
2. `apps/web/lib/mcp/handlers/__tests__/health-handler.test.ts` - test suite
3. `apps/web/app/api/mcp/route.ts` - route registration (modified)

### Documentation
1. Updated .agent/system/api-catalog.md (3 endpoints documented)
2. Updated .agent/system/mcp-tools-guide.md (3 tools documented)
3. Handler JSDoc comments with examples

### Testing
1. 14+ unit tests (input validation, error handling)
2. 6+ integration tests (end-to-end workflows)
3. Manual E2E test via MCP Inspector (curl + JSON-RPC)

### Quality Gates
- TypeScript: 0 errors
- ESLint: All critical rules passing
- Tests: 20+/20 passing
- Build: Production build succeeds

---

## Key Implementation Notes

### Database Queries
- Use `prisma.healthFinding.createMany()` for batch inserts (not loops)
- Filter with `falsePositive: false` in score calculation queries
- Use `select` to fetch only needed fields
- Index on (projectId, calculatedAt) for trend queries

### Finding Mapping
Semgrep + ESLint findings → code-related categories (SECURITY, CODE_QUALITY)
axe-core + Lighthouse findings → ACCESSIBILITY + PERFORMANCE categories

Map using scanner type and finding message content if needed:
```typescript
function mapScannerTypeToCategory(type: ScannerType): FindingCategory {
  switch (type) {
    case ScannerType.SEMGREP: return FindingCategory.SECURITY;
    case ScannerType.ESLINT: return FindingCategory.CODE_QUALITY;
    case ScannerType.AXECORE: return FindingCategory.ACCESSIBILITY;
    case ScannerType.LIGHTHOUSE: return FindingCategory.PERFORMANCE;
  }
}
```

### Score Calculation
- Collect all findings for project (excluding false positives)
- Convert to FindingData[] format: { ruleId, severity, message, filePath, lineNumber, codeSnippet }
- Call calculateHealthScore(findings) → HealthScoreData
- Save to database with timestamp

### Error Recovery
If scanner execution fails:
- Catch ScannerError
- Log error with scanner type
- Include error in response
- Continue with other scanners (partial success)
- Still calculate score with findings from successful scanners

---

## Blockers & Dependencies

None - all dependencies already implemented:
- ✅ Scanner registry (getScanner, ScannerType)
- ✅ Score calculation (calculateHealthScore)
- ✅ Database models (HealthScanner, HealthFinding, HealthScore)
- ✅ MCP handler pattern (knowledge-handler.ts example)
- ✅ Route infrastructure (app/api/mcp/route.ts)

---

## Estimated Effort

- **File Creation**: 1-2 hours (health-handler.ts, tests)
- **Route Integration**: 15-30 minutes (imports, switch cases, tool defs)
- **Testing & Verification**: 1-2 hours (unit tests, E2E manual tests)
- **Documentation**: 30-45 minutes (handler comments, api-catalog update)

**Total**: 3-5 hours (fits in 1 day sprint: ideal for Day 12)

---

## Success Definition

When Day 12 is complete:
1. 3 health tools are callable via /api/mcp (tools/call)
2. 3 health tools appear in tools/list response
3. Tools execute correctly with real scanner data
4. Database stores findings and scores properly
5. All 3 tools pass unit + integration tests
6. Zero TypeScript errors
7. Documentation updated in system docs

