# Bug Report Submission Guide

## Factory Droid MCP HTTP Compatibility Issue

**Report File**: `factory-droid-mcp-http-compatibility.md`  
**Status**: Ready for submission  
**Priority**: High  
**Estimated Fix Time**: 5 minutes (1-line code change)

---

## How to Submit

### Option 1: Factory.ai Support (Recommended)

1. **Visit**: https://app.factory.ai/support or https://docs.factory.ai/
2. **Create New Ticket**:
   - Title: "Factory Droid MCP HTTP Client - Streamable HTTP Incompatibility"
   - Priority: High
   - Category: Bug Report / MCP Integration
3. **Attach**: `factory-droid-mcp-http-compatibility.md`
4. **Reference**: Mention you have a reproducible test case

### Option 2: GitHub Issues (if available)

1. **Repository**: https://github.com/factory-ai/factory-droid (if public)
2. **Create New Issue**:
   - Use bug report template
   - Copy contents of `factory-droid-mcp-http-compatibility.md`
   - Add label: `bug`, `mcp`, `http-transport`

### Option 3: Discord/Community (for discussion)

1. **Factory Discord**: https://discord.gg/factory (if available)
2. **Channel**: #bug-reports or #mcp-support
3. **Post**: Link to GitHub issue or brief summary
4. **Mention**: Tag relevant team members

### Option 4: Email Support

**To**: support@factory.ai (if available)  
**Subject**: `[Bug Report] Factory Droid MCP HTTP - Missing Accept Headers`  
**Attach**: `factory-droid-mcp-http-compatibility.md`  
**Body**:

```
Hi Factory.ai Team,

I'm reporting a compatibility issue with Factory Droid's MCP HTTP client
when connecting to servers using the Streamable HTTP transport (MCP spec 2025-03-26).

The issue is straightforward:
- Factory Droid sends: Accept: application/json
- MCP spec requires: Accept: application/json, text/event-stream
- Result: 406 Not Acceptable error

I've prepared a comprehensive bug report (attached) with:
- Root cause analysis
- Steps to reproduce
- Complete HTTP traces
- Suggested 1-line fix
- Reproducible test case

This blocks Factory Droid from connecting to any MCP server using the
modern Streamable HTTP transport, including servers built with the
official @modelcontextprotocol/sdk.

The fix is trivial (adding text/event-stream to Accept header) and would
unblock the entire MCP ecosystem.

Available for testing/collaboration:
- [Your Name]
- [Your Email]
- [Your Project]: ProjectPulse (AI-assisted development platform)

Thank you!
```

---

## Quick Summary for Support

If you need a **brief summary** for quick communication:

**Issue**: Factory Droid's MCP HTTP client is incompatible with Streamable HTTP transport

**Symptoms**:
- Error: "Failed to connect to MCP server"
- Server returns: 406 Not Acceptable
- Logs: "The operation was aborted"

**Root Cause**:
- Factory Droid sends `Accept: application/json`
- MCP spec requires `Accept: application/json, text/event-stream`

**Fix**: Add `text/event-stream` to Accept header in HTTP MCP client

**Impact**: Blocks Factory Droid from using modern MCP servers

**Effort**: 1-line code change, ~5 minutes

---

## Additional Context to Provide

When submitting, you may want to mention:

1. **Validation**: We successfully validated the fix works with curl
2. **Other Agents**: Claude Code and Cascade work (they use SSE transport)
3. **Server Implementation**: We implemented dual transport (SSE + Streamable HTTP) as a workaround
4. **Test Case**: Reproducible test server code included in report
5. **Urgency**: SSE transport is deprecated, Streamable HTTP is the future

---

## Follow-Up Actions

After submission:

1. **Track Ticket**: Note ticket/issue number
2. **Check Status**: Monitor for Factory.ai response
3. **Test Fix**: When fix is released, test with our server
4. **Update Docs**: Update `mcp-multi-agent-setup.md` when Factory Droid works

---

## Expected Timeline

**Best Case**:
- Acknowledgment: 1-2 business days
- Fix implementation: 1-2 days
- Release: Next Factory Droid version
- Total: 1-2 weeks

**Realistic**:
- Acknowledgment: 3-5 business days
- Fix prioritization: 1-2 weeks
- Implementation: 1 week
- Release: Next minor version
- Total: 4-6 weeks

---

## Monitoring Fix Status

Check for fix in:
1. **Factory.ai Changelog**: https://docs.factory.ai/changelog
2. **GitHub Releases**: (if public repository)
3. **Discord Announcements**: (if available)
4. **Your Ticket/Issue**: Direct updates

---

## Contact for This Report

**Reporter**: ProjectPulse Development Team  
**Available for**:
- Additional testing
- Providing test environment access
- Collaborative debugging
- Patch validation

---

**Report Created**: 2025-11-19  
**Last Updated**: 2025-11-19  
**Status**: Awaiting submission
