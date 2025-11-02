# Planning System Usage Guide

This guide explains how to use the reusable project planning system.

---

## System Overview

Your planning system consists of 3 key files:

1. **[PLANNING_PHASES_TEMPLATE.md](PLANNING_PHASES_TEMPLATE.md)** (31KB)
   - Blank template with all 10 phase structures
   - Used as the foundation for new project planning documents

2. **[.claude/agents/planning/questions.md](.claude/agents/planning/questions.md)** (18KB)
   - Comprehensive question library
   - Contains structured questions for each phase and subsection
   - Includes examples, context, and output formats

3. **[.claude/agents/planning/project-planner.md](.claude/agents/planning/project-planner.md)** (19KB)
   - Interactive planning agent
   - Guides you through all 10 phases
   - Creates and updates project-specific PLANNING_PHASES documents

---

## How to Use

### Starting a New Project

**Step 1: Invoke the Planning Agent**

In Claude Code, use one of these commands:

```
Use the project-planner agent to plan my new [project type] project
```

Or:

```
I need to plan a new project using the project-planner agent
```

**Step 2: Provide Project Context**

The agent will ask:

- Project name (for filename)
- Project type (SaaS, internal tool, mobile app, etc.)
- Timeline urgency
- Your technical level

**Step 3: Work Through Phases**

The agent will guide you through all 10 phases:

1. **Phase 1: Product Manager** (20-30 min)
   - Define user personas
   - Identify core features
   - Write MVP user stories
   - Plan post-MVP roadmap

2. **Phase 2: Strategic Planning** (30-45 min)
   - Select tech stack
   - Analyze costs
   - Create timeline
   - Assess risks

3. **Phase 3: UX/UI Design** (20-30 min)
   - Map user flows
   - Create wireframes
   - Choose component library
   - Define design tokens

4. **Phase 4: System Architecture** (45-60 min)
   - Design database schema
   - Define API endpoints
   - Plan authentication
   - Design caching strategy
   - List external integrations

5. **Phase 5: DevOps Local Setup** (15-20 min)
   - Define dev environment
   - Plan local database
   - List environment variables

6. **Phase 6: Backend Development** (20-30 min)
   - Plan API implementation order
   - Define migration strategy
   - Plan testing approach

7. **Phase 7: Frontend Development** (20-30 min)
   - Plan component structure
   - Choose state management
   - Define form handling strategy

8. **Phase 8: QA & Testing** (20-30 min)
   - Set test coverage goals
   - Choose testing tools
   - Define performance targets

9. **Phase 9: Production Deployment** (20-30 min)
   - Select hosting platforms
   - Plan deployment strategy
   - Set up monitoring

10. **Phase 10: Security Audit** (20-30 min)
    - Complete security checklist
    - Identify compliance requirements
    - Plan vulnerability prevention

**Step 4: Review and Use**

After completion, you'll have:

- A complete `PLANNING_PHASES_[project-name].md` document
- All decisions documented with rationale
- Ready-to-implement specifications

---

## Session Management

### Pausing a Session

You can pause at any time by saying:

```
Let's pause here. I'll continue later.
```

The agent will save your progress to the planning document.

### Resuming a Session

To continue a paused planning session:

```
Resume planning for [project-name] using the project-planner agent
```

The agent will:

- Load your existing `PLANNING_PHASES_[project-name].md`
- Identify the last completed phase
- Continue from where you left off

### Editing Previous Decisions

To update a completed phase:

```
Use the project-planner agent to update Phase [N] of [project-name]
```

The agent will:

- Load the specific phase
- Ask what you want to change
- Update the planning document
- Maintain consistency with other phases

---

## Tips for Best Results

### Be Specific

❌ Bad: "We'll have normal users"
✅ Good: "Freelance designers aged 25-40 who manage 3-5 client projects simultaneously"

❌ Bad: "Use standard authentication"
✅ Good: "Supabase Auth with email/password and Google OAuth"

### Document Rationale

Always explain WHY you made each decision:

```markdown
**Choice**: Next.js 15
**Rationale**:

- Team has React expertise
- Server Components reduce bundle size by 40%
- Vercel deployment is free for MVP
  **Alternatives Considered**:
- Remix (rejected: smaller ecosystem)
- Astro (rejected: need more interactivity)
```

### Consider Trade-offs

For every decision, think about:

- What you're gaining
- What you're sacrificing
- What constraints influenced this choice

### Define Boundaries

Be clear about what you WON'T do:

```markdown
### Out of Scope for MVP

- ❌ Mobile app (web-only for MVP)
- ❌ Real-time collaboration (async only)
- ❌ Advanced analytics (basic metrics only)
```

### Use the Full Process

Don't skip phases, even if they seem less relevant:

- UX/UI design informs API structure
- Security planning prevents costly refactoring
- DevOps setup avoids deployment surprises

---

## Example Planning Documents

### Sample Output Structure

After using the planning agent, your `PLANNING_PHASES_[project-name].md` will look like:

```markdown
# Project Planning: TaskMaster

**Created**: 2025-11-01
**Last Updated**: 2025-11-01
**Planning Status**: Phase 10/10 - Security Audit
**Overall Progress**: 100% Complete

## Quick Status

- ✅ Phase 1: Product Manager Phase - COMPLETE
- ✅ Phase 2: Strategic Planning - COMPLETE
- ✅ Phase 3: UX/UI Design Phase - COMPLETE
- ✅ Phase 4: System Architecture Phase - COMPLETE
- ✅ Phase 5: DevOps Local Setup - COMPLETE
- ✅ Phase 6: Backend Development - COMPLETE
- ✅ Phase 7: Frontend Development - COMPLETE
- ✅ Phase 8: QA & Testing - COMPLETE
- ✅ Phase 9: Production Deployment - COMPLETE
- ✅ Phase 10: Security Audit - COMPLETE

## Session Log

- 2025-11-01 09:00 - Started Phase 1
- 2025-11-01 09:28 - Completed Phase 1 (28 minutes)
- 2025-11-01 09:30 - Started Phase 2
- 2025-11-01 10:12 - Completed Phase 2 (42 minutes)
  [... etc ...]

---

# Phase 1: Product Manager Phase

**Status**: ✅ COMPLETE

## 1.1 User Personas

### Persona 1: "Busy Freelancer"

- **Demographics**: 25-40 years old, freelance designers/developers
- **Current skill**: Intermediate with tech, comfortable with web apps
- **Goals**: Manage 3-5 concurrent client projects efficiently
- **Pain points**:
  - Losing track of tasks across projects
  - Missing deadlines due to poor organization
  - Time wasted switching between tools
- **Daily context**: Works from home, uses laptop primarily, checks tasks 10-15 times/day

[... complete detailed documentation ...]
```

---

## Advanced Usage

### Customizing for Project Types

The planning agent adapts based on project type. When asked, specify:

- **SaaS Product**: Agent emphasizes monetization, costs, security
- **Internal Tool**: Agent focuses on workflow, integration, less on UX
- **Mobile App**: Agent covers app stores, offline capabilities
- **API/Service**: Agent emphasizes API design, versioning, documentation

### Creating Project-Specific Templates

You can create specialized templates for recurring project types:

1. Complete planning for one project of that type
2. Save the completed `PLANNING_PHASES_[project].md`
3. Create `PLANNING_PHASES_TEMPLATE_[type].md` by removing specific details
4. Modify `project-planner.md` agent to offer this template for similar projects

Example:

- `PLANNING_PHASES_TEMPLATE_SAAS.md`
- `PLANNING_PHASES_TEMPLATE_MOBILE.md`
- `PLANNING_PHASES_TEMPLATE_INTERNAL_TOOL.md`

### Integration with Development

Use your planning document throughout development:

**Before Starting Phase 5 (Local Setup)**:

- Read Phase 5 of your planning document
- Follow the dev environment setup you planned

**Before Implementing Features**:

- Reference Phase 1 (user stories) to understand requirements
- Reference Phase 4 (architecture) to follow technical decisions
- Reference Phase 8 (testing) to write appropriate tests

**Before Deployment**:

- Review Phase 9 (deployment plan)
- Follow the deployment strategy you documented

**Throughout Development**:

- Update the planning document when you learn new information
- Treat it as a living document that evolves

---

## Troubleshooting

### "Agent asks too many questions"

If you're experienced and the questions feel excessive:

```
I'm an experienced developer. Please adapt questions to be higher-level and skip basics.
```

The agent will adjust its questioning depth.

### "I don't know how to answer a question"

If you're unsure about an answer:

```
I'm not sure about [topic]. Can you provide examples or suggest best practices?
```

The agent will offer 2-3 options with trade-offs explained.

### "I want to change a previous decision"

Anytime you want to revise:

```
Actually, let's go back to Phase [N]. I want to reconsider [specific decision].
```

The agent will update that section and check for impacts on later phases.

### "Planning is taking too long"

If you need a faster MVP-focused planning session:

```
I need to keep this lightweight. Focus only on MVP essentials and skip detailed post-MVP planning.
```

The agent will streamline questions and focus on launch-critical decisions.

---

## What You Get

After completing the planning process, you'll have:

✅ **Clear Product Vision**

- Defined target users with specific personas
- Validated problem-solution fit
- Prioritized feature list

✅ **Technical Blueprint**

- Complete database schema
- API endpoint specifications
- Authentication/authorization strategy
- Caching and performance plan

✅ **Realistic Timeline**

- Phase-by-phase development schedule
- Risk mitigation strategies
- Resource allocation plan

✅ **Cost Analysis**

- Development budget estimate
- Monthly operational costs
- Cost optimization strategies

✅ **Implementation Roadmap**

- Step-by-step development order
- Testing strategy
- Deployment plan

✅ **Security Foundation**

- Security checklist completed
- Vulnerability prevention plan
- Compliance requirements documented

---

## Next Steps After Planning

1. **Review the Complete Document**
   - Read through your entire `PLANNING_PHASES_[project-name].md`
   - Verify all decisions make sense together
   - Check for any inconsistencies

2. **Share with Stakeholders** (if applicable)
   - Get feedback on product vision
   - Validate timeline and budget
   - Confirm technical approach

3. **Set Up Development Environment**
   - Follow Phase 5 (DevOps Local Setup) instructions
   - Install required tools
   - Configure environment variables

4. **Start Implementation**
   - Begin with backend (Phase 6 plan)
   - Reference architecture decisions from Phase 4
   - Follow testing strategy from Phase 8

5. **Maintain the Document**
   - Update as you learn and iterate
   - Document why you deviate from the plan
   - Use it as reference throughout development

---

## System Files Reference

| File                                         | Size   | Purpose                                                |
| -------------------------------------------- | ------ | ------------------------------------------------------ |
| `PLANNING_PHASES_TEMPLATE.md`                | 31KB   | Blank template structure                               |
| `.claude/agents/planning/project-planner.md` | 19KB   | Interactive planning agent                             |
| `.claude/agents/planning/questions.md`       | 18KB   | Question library                                       |
| `PLANNING_PHASES_[project].md`               | Varies | Your project-specific documentation (created by agent) |

---

## Support

If you encounter issues or have questions about the planning system:

1. **Check the Template**: Review `PLANNING_PHASES_TEMPLATE.md` for structure examples
2. **Review Questions Library**: See `.claude/agents/planning/questions.md` for question details
3. **Read Agent Documentation**: Check `.claude/agents/planning/project-planner.md` for agent capabilities
4. **Consult This Guide**: Review this usage guide for common patterns

---

## Version

**Planning System Version**: 1.0
**Created**: 2025-11-01
**Last Updated**: 2025-11-01

---

Happy Planning! 🚀
