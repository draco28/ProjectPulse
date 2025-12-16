# CodeGuard MCP Tools Specification

## Tool Categories

1. **Scanning Tools** - Initiate and manage code scans
2. **Analysis Tools** - Deep file/symbol analysis
3. **Pattern Matching** - Rule-based detection
4. **Context Tools** - Bundle context for LLM analysis
5. **Issue Management** - Report and track issues
6. **Semantic Search** - Find similar code patterns

---

## 1. Scanning Tools

### codeguard_scan_workspace

Scan entire workspace for analysis.

```typescript
{
  name: "codeguard_scan_workspace",
  description: "Scan entire workspace/repository for code analysis. Returns a scan ID for subsequent operations.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "number",
        description: "ProjectPulse project ID"
      },
      path: {
        type: "string",
        description: "Optional: specific directory to scan (relative to project root)"
      },
      fileTypes: {
        type: "array",
        items: { type: "string" },
        description: "File extensions to include, e.g., ['ts', 'tsx', 'js']"
      },
      excludePatterns: {
        type: "array",
        items: { type: "string" },
        description: "Patterns to exclude, e.g., ['node_modules', 'dist', '*.test.ts']"
      },
      maxFiles: {
        type: "number",
        description: "Maximum files to scan (default: 1000)"
      }
    },
    required: ["projectId"]
  },
  outputSchema: {
    type: "object",
    properties: {
      scanId: { type: "string", description: "Unique scan identifier" },
      status: { type: "string", enum: ["pending", "running", "completed", "failed"] },
      filesScanned: { type: "number" },
      totalLines: { type: "number" },
      fileList: {
        type: "array",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            lines: { type: "number" },
            size: { type: "number" },
            language: { type: "string" }
          }
        }
      }
    }
  }
}
```

### codeguard_get_scan_status

Get status of a running or completed scan.

```typescript
{
  name: "codeguard_get_scan_status",
  description: "Get the current status of a code scan",
  inputSchema: {
    type: "object",
    properties: {
      scanId: { type: "string", description: "Scan ID from scan_workspace" }
    },
    required: ["scanId"]
  },
  outputSchema: {
    type: "object",
    properties: {
      scanId: { type: "string" },
      status: { type: "string" },
      progress: { type: "number", description: "0-100 percentage" },
      filesScanned: { type: "number" },
      issuesFound: { type: "number" },
      startedAt: { type: "string" },
      completedAt: { type: "string" }
    }
  }
}
```

---

## 2. Analysis Tools

### codeguard_analyze_file

Deep analysis of a specific file.

```typescript
{
  name: "codeguard_analyze_file",
  description: "Perform deep analysis of a specific file including AST, symbols, and dependencies",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      filePath: { type: "string", description: "Path relative to project root" },
      includeAST: { type: "boolean", description: "Include parsed AST (default: false)" },
      includeSymbols: { type: "boolean", description: "Include function/class symbols (default: true)" },
      includeImports: { type: "boolean", description: "Include dependency graph (default: true)" },
      includeComplexity: { type: "boolean", description: "Calculate cyclomatic complexity (default: true)" }
    },
    required: ["projectId", "filePath"]
  },
  outputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string" },
      language: { type: "string" },
      lines: { type: "number" },
      ast: { type: "object", description: "Parsed syntax tree (if requested)" },
      symbols: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["function", "class", "variable", "interface", "type", "enum"] },
            line: { type: "number" },
            exported: { type: "boolean" },
            async: { type: "boolean" },
            parameters: { type: "array" },
            returnType: { type: "string" }
          }
        }
      },
      imports: {
        type: "array",
        items: {
          type: "object",
          properties: {
            source: { type: "string" },
            specifiers: { type: "array" },
            isRelative: { type: "boolean" }
          }
        }
      },
      exports: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" }
          }
        }
      },
      complexity: {
        type: "object",
        properties: {
          cyclomatic: { type: "number" },
          cognitive: { type: "number" },
          linesOfCode: { type: "number" },
          maintainabilityIndex: { type: "number" }
        }
      }
    }
  }
}
```

### codeguard_get_symbols

Get all symbols across the project or specific files.

```typescript
{
  name: "codeguard_get_symbols",
  description: "Get symbols (functions, classes, variables) across the project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      scanId: { type: "string", description: "Optional: scope to specific scan" },
      filePaths: { type: "array", items: { type: "string" }, description: "Optional: specific files" },
      symbolTypes: {
        type: "array",
        items: { type: "string", enum: ["function", "class", "variable", "interface", "type", "enum"] }
      },
      exportedOnly: { type: "boolean", description: "Only return exported symbols" }
    },
    required: ["projectId"]
  }
}
```

---

## 3. Pattern Matching Tools

### codeguard_check_patterns

Run rule-based pattern checks (no LLM needed).

```typescript
{
  name: "codeguard_check_patterns",
  description: "Run deterministic rule-based pattern checks for common issues",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      scanId: { type: "string" },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: ["security", "async", "null-safety", "types", "performance", "style", "all"]
        },
        description: "Categories to check (default: all)"
      },
      severity: {
        type: "string",
        enum: ["critical", "high", "medium", "low", "all"],
        description: "Minimum severity to report (default: all)"
      }
    },
    required: ["projectId", "scanId"]
  },
  outputSchema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rule: { type: "string", description: "Rule identifier" },
            category: { type: "string" },
            severity: { type: "string" },
            file: { type: "string" },
            line: { type: "number" },
            endLine: { type: "number" },
            message: { type: "string" },
            codeSnippet: { type: "string" },
            suggestedFix: { type: "string" }
          }
        }
      },
      summary: {
        type: "object",
        properties: {
          total: { type: "number" },
          bySeverity: { type: "object" },
          byCategory: { type: "object" }
        }
      }
    }
  }
}
```

### Pattern Categories

| Category | Patterns Detected |
|----------|-------------------|
| **security** | Hardcoded secrets, SQL injection, XSS patterns, eval usage, unsafe regex |
| **async** | Unhandled promises, missing await, race conditions, callback hell |
| **null-safety** | Missing null checks, optional chaining opportunities, nullish coalescing |
| **types** | Type assertions abuse, any usage, missing return types |
| **performance** | Unnecessary re-renders, missing keys, inefficient loops |
| **style** | Unused variables, dead code, console.log statements |

---

## 4. Context Aggregation Tools

### codeguard_get_analysis_context

Bundle context for LLM analysis (the key tool for semantic analysis).

```typescript
{
  name: "codeguard_get_analysis_context",
  description: "Get bundled code context optimized for LLM analysis. Includes target file and related context.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      targetFile: { type: "string", description: "Primary file to analyze" },
      contextDepth: {
        type: "number",
        description: "How many levels of imports to include (default: 2)"
      },
      maxTokens: {
        type: "number",
        description: "Limit context size for LLM (default: 8000)"
      },
      includeTests: {
        type: "boolean",
        description: "Include related test files (default: false)"
      },
      focusAreas: {
        type: "array",
        items: { type: "string" },
        description: "Specific functions/classes to focus on"
      }
    },
    required: ["projectId", "targetFile"]
  },
  outputSchema: {
    type: "object",
    properties: {
      targetCode: { type: "string", description: "Full content of target file" },
      relatedFiles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            relevance: { type: "number", description: "0-1 relevance score" },
            content: { type: "string", description: "Relevant portions only" },
            reason: { type: "string", description: "Why this file is included" }
          }
        }
      },
      symbols: {
        type: "array",
        description: "Cross-file symbols used in target"
      },
      suggestedFocus: {
        type: "array",
        items: { type: "string" },
        description: "Areas the LLM should pay attention to"
      },
      tokenEstimate: { type: "number" }
    }
  }
}
```

---

## 5. Issue Management Tools

### codeguard_report_issue

Report a detected issue (typically after LLM analysis).

```typescript
{
  name: "codeguard_report_issue",
  description: "Report a code issue detected by the agent. Can auto-create ProjectPulse ticket.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      scanId: { type: "string" },
      file: { type: "string" },
      line: { type: "number" },
      endLine: { type: "number" },
      category: {
        type: "string",
        enum: ["bug", "security", "performance", "style", "async", "type-safety", "null-safety"]
      },
      severity: {
        type: "string",
        enum: ["critical", "high", "medium", "low"]
      },
      title: { type: "string", description: "Short issue title" },
      description: { type: "string", description: "Detailed explanation (LLM-generated)" },
      codeSnippet: { type: "string", description: "Relevant code" },
      suggestedFix: { type: "string", description: "Proposed fix (LLM-generated)" },
      confidence: { type: "number", description: "0-1 confidence score" },
      createTicket: { type: "boolean", description: "Auto-create ProjectPulse ticket (default: true)" }
    },
    required: ["projectId", "scanId", "file", "line", "category", "severity", "title", "description"]
  },
  outputSchema: {
    type: "object",
    properties: {
      issueId: { type: "string" },
      ticketId: { type: "number", description: "ProjectPulse ticket ID if created" },
      ticketKey: { type: "string", description: "e.g., PULSE-123" }
    }
  }
}
```

### codeguard_get_issues

Get reported issues for a project/scan.

```typescript
{
  name: "codeguard_get_issues",
  description: "Get code issues for a project or scan",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      scanId: { type: "string" },
      status: { type: "string", enum: ["open", "fixed", "wontfix", "false-positive", "all"] },
      severity: { type: "string" },
      category: { type: "string" },
      file: { type: "string", description: "Filter by file path" }
    },
    required: ["projectId"]
  }
}
```

### codeguard_update_issue

Update issue status.

```typescript
{
  name: "codeguard_update_issue",
  description: "Update the status of a code issue",
  inputSchema: {
    type: "object",
    properties: {
      issueId: { type: "string" },
      status: { type: "string", enum: ["open", "fixed", "wontfix", "false-positive"] },
      resolution: { type: "string", description: "How it was resolved" }
    },
    required: ["issueId", "status"]
  }
}
```

---

## 6. Semantic Search Tools

### codeguard_find_similar_code

Find similar code patterns using embeddings (Ollama).

```typescript
{
  name: "codeguard_find_similar_code",
  description: "Find similar code patterns using semantic search",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      codeSnippet: { type: "string", description: "Code to find similar patterns to" },
      limit: { type: "number", description: "Max results (default: 10)" },
      minSimilarity: { type: "number", description: "Minimum similarity 0-1 (default: 0.7)" }
    },
    required: ["projectId", "codeSnippet"]
  },
  outputSchema: {
    type: "object",
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string" },
            lineStart: { type: "number" },
            lineEnd: { type: "number" },
            code: { type: "string" },
            similarity: { type: "number" }
          }
        }
      }
    }
  }
}
```

---

## 7. Fix Application Tools (Phase 3)

### codeguard_validate_fix

Validate a proposed fix before applying.

```typescript
{
  name: "codeguard_validate_fix",
  description: "Validate a proposed code fix (syntax check, type check)",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      file: { type: "string" },
      patch: { type: "string", description: "Unified diff format" }
    },
    required: ["projectId", "file", "patch"]
  },
  outputSchema: {
    type: "object",
    properties: {
      valid: { type: "boolean" },
      syntaxErrors: { type: "array" },
      typeErrors: { type: "array" },
      warnings: { type: "array" }
    }
  }
}
```

### codeguard_apply_fix

Apply a validated fix.

```typescript
{
  name: "codeguard_apply_fix",
  description: "Apply a validated code fix",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "number" },
      issueId: { type: "string" },
      patch: { type: "string" },
      createBackup: { type: "boolean", description: "Create backup before applying (default: true)" }
    },
    required: ["projectId", "issueId", "patch"]
  },
  outputSchema: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      backupPath: { type: "string" },
      issueStatus: { type: "string" }
    }
  }
}
```

---

## Example Agent Workflow

```
User: "Scan my codebase for potential bugs"

Agent (Claude Code):

1. Initiate scan
   → codeguard_scan_workspace({ projectId: 8, fileTypes: ['ts', 'tsx'] })
   ← { scanId: "scan-123", filesScanned: 47, ... }

2. Run pattern checks (deterministic)
   → codeguard_check_patterns({ scanId: "scan-123", categories: ["all"] })
   ← 12 pattern-based findings

3. For complex files, get analysis context
   → codeguard_get_analysis_context({ targetFile: "src/api/issues.ts" })
   ← Bundled code context with related files

4. LLM REASONING (Agent's intelligence)
   Claude reads the context and identifies:
   "This function claims to validate input but line 45 allows empty strings"

5. Report findings
   → codeguard_report_issue({
       title: "Input validation allows empty strings",
       description: "The validateEmail function on line 45...",
       suggestedFix: "Change regex to: /^[^@]+@[^@]+\\.[^@]+$/",
       createTicket: true
     })
   ← { issueId: "issue-456", ticketKey: "PULSE-789" }

6. Report to user
   "Found 15 issues: 12 from pattern matching, 3 from semantic analysis.
    Created tickets in ProjectPulse for tracking."
```
