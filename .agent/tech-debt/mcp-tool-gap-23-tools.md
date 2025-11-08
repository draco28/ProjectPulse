# Technical Debt: MCP Tool Gap (23 Tools)

**Created**: 2025-11-07  
**Status**: Documented - Deferred to Sprint 9+  
**Impact**: Low (MVP unaffected)  
**Type**: Scope Reduction

---

## Summary

During Sprint 1 Day 5 planning, the MCP tool roadmap was reduced from **65 tools** (Sprint 1-13 full scope) to **42 tools** (Sprint 1-8 MVP scope).

**Gap**: 23 tools deferred to Sprint 9+ (Post-MVP epics)

**Decision Rationale**:
- 42 tools sufficient for Sprint 1-8 MVP functionality
- 23 additional tools are enhancements, not blockers
- Focus on core CRUD + search functionality first
- Additional tools add value but aren't critical path

**Risk Assessment**: **LOW**
- MVP delivery unaffected (all core features covered)
- No architectural impact (additive changes only)
- Clear implementation path for future sprints

---

## Tool Breakdown

### Sprint 1-8 MVP (42 Tools) ✅

**Implemented/Planned**:

1. **Sprint Hierarchy (9 tools)** - EPIC-001
   - phase.create, phase.update, phase.delete, phase.list
   - week.create, week.update, week.delete, week.list
   - day.create, day.update, day.delete, day.list
   - task.create, task.update, task.delete, task.list, task.getCurrentTask
   - session.create, session.update, session.end, session.list

2. **Progress Tracking (4 tools)** - EPIC-002
   - progress.update, progress.rollup, progress.report, progress.history

3. **AI Agent Integration (5 tools)** - EPIC-003
   - agent.listPersonas, agent.activatePersona, agent.getContext, agent.updateMemory, agent.queryKnowledge

4. **Context Management (4 tools)** - EPIC-004
   - context.save, context.load, context.search, context.delete

5. **Issue Tracking (6 tools)** - EPIC-005
   - issue.create, issue.update, issue.list, issue.search, issue.comment, issue.close

6. **Knowledge Base (5 tools)** - EPIC-006
   - knowledge.store, knowledge.search, knowledge.retrieve, knowledge.tag, knowledge.link

7. **Hybrid Search (3 tools)** - EPIC-007
   - search.hybrid, search.semantic, search.fulltext

8. **Health & Monitoring (3 tools)** - EPIC-008
   - health.check, health.metrics, health.logs

9. **Documentation (3 tools)** - EPIC-009
   - docs.generate, docs.update, docs.search

**Total**: 42 tools (Sprint 1-8 MVP)

---

### Sprint 9+ Enhancements (23 Tools) 🔄

**Deferred Tools by Epic**:

#### EPIC-010: Advanced Analytics (8 tools)

1. **analytics.dashboardMetrics** - Real-time dashboard data aggregation
2. **analytics.velocityTrends** - Sprint velocity analysis over time
3. **analytics.burndown** - Burndown chart data generation
4. **analytics.timeTracking** - Detailed time tracking reports
5. **analytics.predictCompletion** - ML-based completion prediction
6. **analytics.bottleneckDetection** - Identify workflow bottlenecks
7. **analytics.exportReport** - Export analytics to CSV/PDF
8. **analytics.customQuery** - Custom SQL query builder for analytics

**Business Value**: Enhanced reporting and insights (nice-to-have)  
**Technical Complexity**: Medium (requires data aggregation pipelines)  
**Estimated Sprint Points**: 13 points (2 sprints)

---

#### EPIC-011: Collaboration Tools (5 tools)

1. **collab.mention** - Mention users in comments (@username)
2. **collab.notify** - Send notifications to users/teams
3. **collab.share** - Share tasks/issues via link
4. **collab.watch** - Subscribe to task/issue updates
5. **collab.assign** - Assign tasks to team members

**Business Value**: Multi-user collaboration (future feature)  
**Technical Complexity**: Medium (requires user management system)  
**Estimated Sprint Points**: 8 points (1 sprint)  
**Dependency**: User authentication system (not in Sprint 1-8)

---

#### EPIC-012: Template System (5 tools)

1. **template.createTask** - Create task templates
2. **template.createPhase** - Create phase templates
3. **template.apply** - Apply template to new entity
4. **template.list** - List available templates
5. **template.delete** - Delete template

**Business Value**: Accelerate repetitive task creation  
**Technical Complexity**: Low (CRUD operations)  
**Estimated Sprint Points**: 5 points (0.5 sprint)

---

#### EPIC-013: Integration Hooks (5 tools)

1. **webhook.register** - Register webhook for events
2. **webhook.list** - List active webhooks
3. **webhook.test** - Test webhook delivery
4. **webhook.delete** - Delete webhook
5. **api.generateKey** - Generate API keys for external integrations

**Business Value**: Third-party integrations (future)  
**Technical Complexity**: Medium (requires webhook infrastructure)  
**Estimated Sprint Points**: 8 points (1 sprint)

---

## Implementation Timeline

### Sprint 9 (Week 9-10) - Analytics Foundation
- Implement EPIC-010: 8 analytics tools
- Build data aggregation pipeline
- Create analytics API endpoints
- Estimated: 13 points

### Sprint 10 (Week 11-12) - Templates + Collaboration Prep
- Implement EPIC-012: 5 template tools
- Design collaboration architecture (prep for EPIC-011)
- Estimated: 5 points (sprint 10), 8 points (sprint 11 for EPIC-011)

### Sprint 11 (Week 13-14) - Collaboration Tools
- Implement EPIC-011: 5 collaboration tools
- Add user management foundation
- Estimated: 8 points

### Sprint 12 (Week 15-16) - Integration Hooks
- Implement EPIC-013: 5 webhook tools
- Build webhook delivery system
- Estimated: 8 points

**Total Additional Effort**: 42 points (~4 sprints)

---

## Mitigation Strategy

**Immediate Actions** (Sprint 1-8):
1. ✅ Document gap (this file)
2. ✅ Verify 42-tool baseline covers all MVP requirements
3. ✅ Update tech-context.md to clarify tool count
4. ✅ Communicate scope to stakeholders

**Post-MVP Actions** (Sprint 9+):
1. Prioritize enhancements based on user feedback
2. Implement incrementally (1 epic per sprint)
3. Maintain backward compatibility
4. Add new tools without breaking existing integrations

---

## Risk Analysis

### Low Risk ✅

**Why this is low risk**:
- MVP functionality complete with 42 tools
- All Sprint 1-8 requirements met
- No architectural blockers
- Additive changes only (no rewrites needed)

**Validation**:
- ✅ Phase/Week/Day/Task CRUD covered (EPIC-001)
- ✅ Progress tracking operational (EPIC-002)
- ✅ AI agent integration complete (EPIC-003)
- ✅ Context management functional (EPIC-004)
- ✅ Issue tracking available (EPIC-005)
- ✅ Knowledge base search working (EPIC-006)
- ✅ Hybrid search implemented (EPIC-007)
- ✅ Health monitoring active (EPIC-008)

**Missing features are enhancements, not requirements**:
- Analytics: Manual queries work, dashboards not critical
- Collaboration: Single-user mode sufficient for MVP
- Templates: Manual creation acceptable initially
- Webhooks: Not needed for local-first architecture

---

## Acceptance Criteria for Resolution

This technical debt item can be marked **RESOLVED** when:

- [ ] All 8 analytics tools implemented (EPIC-010)
- [ ] All 5 collaboration tools implemented (EPIC-011)
- [ ] All 5 template tools implemented (EPIC-012)
- [ ] All 5 webhook tools implemented (EPIC-013)
- [ ] Tool count reaches 65 total
- [ ] All epics tested and integrated
- [ ] Documentation updated

**Target Date**: Sprint 12 completion (Week 16)

---

## References

### Source Documents

- **COMPLETE_ARCHITECTURE_UPDATE_SPEC.md** - Original 65-tool specification
- **docs/13-Project-Plan.md** - Sprint 1-8 roadmap (42-tool baseline)
- **.agent/tech-context.md** - Technical context (updated with clarification)
- **.agent/task/day-6-7-tool-plan.md** - First two tool implementations

### Related ADRs

- **ADR-006** (if created): Scope reduction rationale
- **ADR-007** (if created): Phased tool rollout strategy

### Sprint Plans

- **Sprint 1-8**: 42 tools (MVP)
- **Sprint 9**: EPIC-010 (analytics)
- **Sprint 10**: EPIC-012 (templates)
- **Sprint 11**: EPIC-011 (collaboration)
- **Sprint 12**: EPIC-013 (webhooks)
- **Sprint 13**: Buffer/polish

---

## Communication

**Status**: ✅ Documented  
**Stakeholders Notified**: Pending (update after Day 5 completion)  
**Impact on Delivery**: None (MVP unaffected)

**Key Message**:
> "Sprint 1-8 MVP delivers 42 tools covering all core functionality. 23 additional enhancement tools will be added in Sprint 9+ based on user feedback. No impact to MVP delivery timeline or architecture."

---

## Review History

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| 2025-11-07 | Claude (Session 2) | Created | Initial documentation |
| TBD | Product Owner | Pending | Approval for phased approach |
| TBD | Tech Lead | Pending | Architecture validation |

---

**Last Updated**: 2025-11-07  
**Next Review**: Sprint 8 End (before Sprint 9 planning)  
**Owner**: MCP Integration Team
