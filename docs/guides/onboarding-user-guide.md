# ProjectPulse Onboarding Guide

**Audience**: End users setting up new projects  
**Time**: ~2-3 hours for complete onboarding  
**Outcome**: Fully configured AI-assisted development workflow

---

## Getting Started

### Prerequisites
- ProjectPulse instance running
- Project created
- Access to dashboard

### Overview
ProjectPulse onboarding is a 3-session process:
- **Session 1**: Strategic Planning (60-90 min) - Answer 96 questions
- **Session 2**: Documentation (30-60 min) - Generate 15 documents
- **Session 3**: AI Bootstrap (15-30 min) - Create personas, skills, workflows

---

## Accessing Onboarding

From the dashboard, you'll see "Start Setup" in the Quick Actions widget:

1. Open dashboard: http://localhost:3000/dashboard
2. Look for Quick Actions widget (right column)
3. Click "Start Setup" button (coral colored)
4. Navigate to /onboarding

---

## Session 1: Strategic Planning

### What You'll Do
Answer 96 questions across 10 phases about your project.

### The 10 Phases
1. Product Manager - Foundation (11 questions)
2. Product Manager - Features & Roadmap (9 questions)
3. Designer - User Experience (10 questions)
4. Designer - UI Components (9 questions)
5. Solutions Architect - System Design (10 questions)
6. Solutions Architect - Data & Integration (9 questions)
7. DevOps Engineer - Infrastructure (9 questions)
8. DevOps Engineer - Deployment (10 questions)
9. QA Engineer - Testing Strategy (10 questions)
10. Product Owner - Success Metrics (9 questions)

### UI Walkthrough

**Step 1: Phase Navigation**
- Progress bar shows X/10 phases complete
- Click phase dots to navigate between completed phases
- Use Back/Next buttons to move through phases

**Step 2: Answering Questions**
- Each phase has multiple subsections
- Questions marked with * are required
- Fill in text areas with detailed answers
- Save automatically after each phase

**Step 3: Executive Summary Generation**

After completing all 10 phases:

**Option A: Agent Generation** (Recommended)
1. Click "Get Prompt & Generate with Agent"
2. Copy system prompt
3. Copy user prompt (contains all 96 Q&A pairs)
4. Open your AI agent (Claude Code, ChatGPT, etc.)
5. Paste system prompt, then user prompt
6. Generate summary (~500 words)
7. Copy result back to ProjectPulse
8. Paste and store

**Option B: Manual Entry**
1. Switch to "Manual Entry" tab
2. Write or paste your executive summary
3. Target: ~500 words
4. Click "Store Summary & Complete Session 1"

### Tips
- ✅ Be specific and detailed in answers
- ✅ Review answers before submitting
- ✅ Use Back button to revise previous phases
- ❌ Don't skip required fields
- ❌ Don't rush - quality matters

### Troubleshooting

**Q: I can't proceed to executive summary**  
A: Ensure all 10 phases are complete (check progress bar)

**Q: Executive summary generation failed**  
A: Try manual entry option or check your AI provider

---

## Session 2: Documentation Generation

### What You'll Get
15 industry-standard documents (~30,000 words total)

### Document Categories

**Planning (5 docs)**:
- 01-PRD.md - Product Requirements Document
- 02-SRS.md - Software Requirements Specification
- 12-Backlog.md - User Stories Backlog
- 13-Project-Plan.md - Implementation Roadmap (critical for Session 3!)
- 14-Budget-and-Timeline.md

**Architecture (3 docs)**:
- 03-Architecture.md
- 04-Data-and-Model-Spec.md
- 06-API-Specification.md

**Implementation (4 docs)**:
- 05-AgentOps-Plan.md
- 07-UI-UX.md
- 08-Security-and-Compliance.md
- 09-Testing-and-QA.md

**Operations (3 docs)**:
- 10-Observability-and-SRE.md
- 11-Infrastructure-and-Deployment.md
- 15-Success-Metrics.md

### UI Walkthrough

**Dashboard View**:
- Progress card shows X/15 documents complete
- Filter by category (Planning, Architecture, etc.)
- Each document shows status badge

**Generating Documents**:

**Option 1: Individual Generation**
1. Click "Generate" on any document card
2. Prompt dialog appears with system & user prompts
3. Copy prompts to your AI agent
4. Generate document
5. Paste result back
6. Document card shows "Complete" badge

**Option 2: Bulk Generation** (Future)
- Generate all 15 documents at once
- Requires significant AI credits

**Viewing Documents**:
1. Click "View All Documents" button
2. Sidebar navigation (grouped by category)
3. Click document to view
4. Download button for markdown file

### Tips
- ✅ Generate in order (Planning → Architecture → Implementation → Operations)
- ✅ Review generated content for accuracy
- ✅ Regenerate if quality is poor
- ✅ Ensure 13-Project-Plan.md is complete (required for Session 3)
- ❌ Don't skip documents - all 15 needed

### Troubleshooting

**Q: Document generation is slow**  
A: Normal - each document is ~2000 words. Takes 1-2 minutes per document.

**Q: Can I regenerate a document?**  
A: Yes - click "Regenerate" on document card

**Q: Why is 13-Project-Plan.md important?**  
A: Session 3 parses this document to create your roadmap

---

## Session 3: AI Workflow Bootstrap

### What You'll Get

**Agent Personas** (3-5):
- Expert AI assistants for your tech stack
- Examples: React Expert, Next.js Expert, Prisma Expert

**Skills Library** (5-10):
- Coding patterns and best practices
- Framework-specific guidance

**Workflows** (3):
- Feature Development
- Bug Fix
- Code Review

**SOPs** (5):
- Git Workflow
- Security Checklist
- API Development
- Testing Workflow
- Deployment

**Roadmap**:
- Complete project roadmap from 13-Project-Plan.md
- Phase → Sprint → Week → Day hierarchy

**Repository Files**:
- CLAUDE.md - Claude Code integration guide
- AGENTS.md - Agent personas reference

### UI Walkthrough

**Step 1: Pre-Bootstrap Info**
- Review what will be created
- Understand time investment (~30 seconds)

**Step 2: Repository Path**
1. Enter absolute path to your repository  
   Example: `/Users/yourname/projects/myproject`
2. Validate path exists and is writable
3. Files will be written: CLAUDE.md, AGENTS.md

**Step 3: Start Bootstrap**
1. Click "Start Bootstrap" button
2. Wait ~30 seconds (loading indicator)
3. Process creates all entities in database

**Step 4: Success Dashboard**
- View entity creation stats
- See roadmap statistics
- Confirm files written
- Navigate to next steps

### Next Steps After Bootstrap

1. **View Agent Personas** → `/agents`
   - See all created expert agents
   - Toggle active/inactive
   - View skills and expertise

2. **Explore Roadmap** → `/roadmap`
   - Navigate Phase → Sprint → Week → Day
   - View tasks and milestones
   - Track current position

3. **Read CLAUDE.md**
   - Open in your repository
   - Understand Claude Code integration
   - Follow 5-step protocol

4. **Start Development**
   - Your first todos are ready
   - Agent personas available
   - Complete documentation generated

### Tips
- ✅ Use absolute repository paths
- ✅ Verify path before clicking bootstrap
- ✅ Wait for completion (don't refresh)
- ✅ Check CLAUDE.md was written
- ❌ Don't interrupt bootstrap process

### Troubleshooting

**Q: Bootstrap failed**  
A: Check repository path permissions. Ensure directory exists and is writable.

**Q: CLAUDE.md not written**  
A: Verify path is correct. Check file system permissions. Try again with different path.

**Q: No agent personas created**  
A: Check Session 2 is complete. Ensure 13-Project-Plan.md exists.

---

## After Onboarding

### What Changes

**Dashboard**:
- "Start Setup" → "Setup Complete" (green badge)
- Can review onboarding summary anytime

**New Features Unlocked**:
- Agent Personas page functional
- Roadmap fully materialized
- Skills library available
- Workflows and SOPs accessible

**Your Repository**:
- CLAUDE.md - Integration guide
- AGENTS.md - Persona reference

### Reviewing Your Setup

Access `/onboarding` anytime to:
- View session completion status
- Review executive summary
- Browse generated documents
- Check bootstrap statistics

### Modifying Setup (Future)

Currently, onboarding is one-time setup. To modify:
- Manually edit database records
- Re-run bootstrap with different path (creates duplicates)
- Contact support for reset

---

## FAQ

**Q: How long does onboarding take?**  
A: 2-3 hours total. Session 1 (60-90 min), Session 2 (30-60 min), Session 3 (15-30 min)

**Q: Can I pause and resume?**  
A: Yes! Progress saved after each phase/document. Return anytime via dashboard.

**Q: Do I need my own AI provider?**  
A: Yes. ProjectPulse uses agent-side AI (your AI, your privacy, zero cost on server).

**Q: What AI providers work?**  
A: Claude Code, ChatGPT, Gemini, any AI that accepts text prompts.

**Q: Can multiple users onboard together?**  
A: Currently single-user workflow. Multi-user coming in future.

**Q: What if I make a mistake?**  
A: Use Back button in Session 1. Regenerate documents in Session 2. Session 3 cannot be undone.

**Q: Why agent-side AI generation?**  
A: Privacy (your data never leaves your AI) + Cost (zero server API costs)

---

## Support

**Issues**:
- Check `/health` for system status
- Review error messages carefully
- Contact support with screenshots

**Documentation**:
- API Reference: `/docs/features/api-reference.md`
- MCP Tools Guide: `/docs/features/mcp-tools-guide.md`

---

**Ready to start?** Access dashboard and click "Start Setup"!
