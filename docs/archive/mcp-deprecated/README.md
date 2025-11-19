# Deprecated MCP Documentation Archive

**Archived**: 2025-11-20  
**Reason**: Sprint 8.7 architecture changes

---

## Why These Documents Were Archived

During Sprint 8.7, the ProjectPulse MCP server underwent a major architectural transformation:

**Old Architecture** (Sprint 8.5-8.6):
- Multiple transports: SSE, Streamable HTTP, JSON-RPC shim
- Next.js route at `http://192.168.1.15:3000/api/mcp`
- Session management with SSE
- Complex routing logic (302 lines)

**New Architecture** (Sprint 8.7):
- Single HTTP endpoint at `http://192.168.1.15:3001/mcp`
- Stateless HTTP streaming only
- No SSE, no JSON-RPC shim
- Simplified code (175 lines)
- 42% code reduction

---

## Archived Files

### MCP_QUICK_START_port3000.md (372 lines)
**Original**: `docs/MCP_QUICK_START.md`  
**Why Archived**: References Next.js route at port 3000 which is no longer used  
**Replacement**: `docs/MCP_QUICK_START_v2.md`  
**Last Valid**: Sprint 8.6 (Nov 2024)

**Key Outdated Information**:
- Server URL: `http://192.168.1.15:3000/api/mcp` (changed to `http://192.168.1.15:3001/mcp`)
- Transport: SSE and HTTP (now HTTP only)
- Tool count: ~21 tools (now 40 tools)
- Session management documented (now stateless)

---

### MCP_API_REFERENCE_nextjs.md (1207 lines)
**Original**: `docs/MCP_API_REFERENCE.md`  
**Why Archived**: Extensive documentation of Next.js MCP route API that's deprecated  
**Replacement**: Tool schemas in `docs/features/mcp-tools-guide.md` and architecture in `docs/MCP_ARCHITECTURE.md`  
**Last Valid**: Sprint 8.6 (Nov 2024)

**Key Outdated Information**:
- JSON-RPC 2.0 over Next.js route (now direct SDK communication)
- Session management via `Mcp-Session-Id` header (now stateless)
- Resource-based context injection (not implemented in Sprint 8.7)
- Tool schemas for old 21-tool system (now 40 tools)

---

## Current Documentation

For current MCP server documentation, see:

1. **Entry Point**: [`docs/MCP_README.md`](../../MCP_README.md)
2. **Quick Start**: [`docs/MCP_QUICK_START_v2.md`](../../MCP_QUICK_START_v2.md)
3. **Architecture**: [`docs/MCP_ARCHITECTURE.md`](../../MCP_ARCHITECTURE.md) (v2.0.0)
4. **Tools Guide**: [`docs/features/mcp-tools-guide.md`](../../features/mcp-tools-guide.md)
5. **Multi-Agent Setup**: [`docs/features/mcp-multi-agent-setup.md`](../../features/mcp-multi-agent-setup.md)
6. **Sprint 8.7 Summary**: [`docs/SPRINT_8.7_COMPLETION_SUMMARY.md`](../../SPRINT_8.7_COMPLETION_SUMMARY.md)

---

## Migration Notes

If you're using documentation from this archive:

### From MCP_QUICK_START_port3000.md
- ✅ **Update server URL**: `3000/api/mcp` → `3001/mcp`
- ✅ **Remove SSE config**: HTTP only now
- ✅ **Update tool count**: 21 → 40 tools
- ✅ **See**: `MCP_QUICK_START_v2.md`

### From MCP_API_REFERENCE_nextjs.md
- ✅ **Tool schemas**: Now in `mcp-tools-guide.md`
- ✅ **Architecture**: Now in `MCP_ARCHITECTURE.md` v2.0.0
- ✅ **No session management**: Stateless mode
- ✅ **Direct SDK communication**: No custom API layer

---

## Historical Context

### Sprint 8.5 (Nov 2024)
- Implemented SSE transport for multi-agent support
- Created Next.js MCP route at port 3000
- Registered 21 MCP tools

### Sprint 8.6 (Nov 2024)
- Added dual transport support (SSE + Streamable HTTP)
- Implemented JSON-RPC shim for Factory Droid compatibility
- Documented hybrid architecture
- Added E2E test suite

### Sprint 8.7 (Nov 19-20, 2024)
- **Removed SSE transport completely**
- **Removed JSON-RPC shim endpoint**
- **Moved to standalone server on port 3001**
- **Stateless HTTP streaming only**
- **Fixed HTTP 406 with rawHeaders middleware**
- **Consolidated to 40 tools**
- **42% code reduction**

---

## Why Not Just Update?

These documents were archived rather than updated because:

1. **Fundamental architecture change**: SSE → HTTP only
2. **Different server location**: Next.js route → Standalone server
3. **Different port**: 3000 → 3001
4. **Session management removed**: Stateful → Stateless
5. **Tool consolidation**: 21 → 40 tools
6. **Too many changes**: Easier to write fresh docs than update

---

## Restoration

If you need to reference these documents:

```bash
# View archived docs
cd docs/archive/mcp-deprecated
cat MCP_QUICK_START_port3000.md
cat MCP_API_REFERENCE_nextjs.md
```

**Warning**: Do not use these for current development. They describe deprecated architecture.

---

**Archive Date**: 2025-11-20  
**Archived By**: Sprint 8.7 Documentation Cleanup  
**Status**: Historical Reference Only  
**Next Review**: Sprint 9 (if architecture changes again)
