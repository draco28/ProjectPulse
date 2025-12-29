# ProjectPulse LinkedIn Launch Posts

Ready-to-use posts for LinkedIn showcase. Copy, paste, and customize as needed.

---

## Post 1: Product Announcement (Hero Post)

**Best time to post**: Tuesday-Thursday, 8-10 AM

```
I built a project management platform for AI agents.

After months of using Claude Code daily, I realized something:

JIRA, Linear, GitHub Issues — none of them were designed for AI-assisted development.

Here's what I kept running into:
→ Context loss between sessions (AI forgets everything)
→ Token waste loading framework docs (thousands of tokens gone)
→ Manual tracking (I became the glue between AI and project state)
→ No integration (AI couldn't create tickets or update progress)

So I built ProjectPulse.

It's an agent-first platform where 95% of interactions happen via MCP tools, not clicking through UIs.

The numbers:
• 86+ production-ready MCP tools
• 98% token reduction via lazy-loading skills
• 15 documents auto-generated during onboarding
• 5-level progress hierarchy that cascades automatically

Your AI assistant can now:
✅ Create and search tickets programmatically
✅ Track work across conversation boundaries
✅ Access knowledge base with semantic search
✅ Update progress that rolls up automatically

It's open source (MIT), self-hosted, and built with Next.js 14 + PostgreSQL + pgvector.

Link in comments 👇

#AI #DeveloperTools #OpenSource #ClaudeCode #ProjectManagement
```

**Attach**: Hero banner image (`assets/hero-banner.png`)

---

## Post 2: Technical Deep Dive

**Best time to post**: 2-3 days after Post 1

```
How I reduced token usage by 98% in Claude Code.

The problem:

Every time I asked Claude Code to help with React, it would load the entire React documentation into context.

50,000+ tokens. Gone. Every. Single. Time.

Multiply that across Next.js, Prisma, TypeScript patterns...

I was burning through context windows just loading docs.

The solution: Lazy-loading skills.

Instead of dumping entire framework documentation, ProjectPulse stores coding patterns as "skills" — small, focused snippets (300-500 tokens each).

When the AI needs React patterns, it loads just that skill.
When it needs Prisma queries, it loads just that skill.

The result:
• Before: 50,000 tokens per framework
• After: 500 tokens per skill
• Reduction: 98%

But it gets better.

The knowledge base uses hybrid search (PostgreSQL tsvector + pgvector) to find the RIGHT skill automatically.

Ask "how do we handle form validation?" and it finds your project's specific validation patterns — not generic Stack Overflow answers.

92% context reduction for knowledge retrieval.

This is how AI-native tools should work: token-efficient by design.

Full implementation details in the repo (link in comments).

#AI #DeveloperProductivity #TokenOptimization #ClaudeCode #TechDeepDive
```

**Attach**: Architecture diagram or knowledge base screenshot (`assets/knowledge-base.png`)

---

## Post 3: Open Source Announcement

**Best time to post**: 2-3 days after Post 2

```
86 MCP tools that automate project management.

Today I'm open-sourcing ProjectPulse — the platform I've been building for AI-assisted development.

Here's what's inside:

𝗖𝗼𝗻𝘁𝗲𝘅𝘁 𝗠𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁
• context_load — Load all memory banks in one call
• context_lookup — Query specific knowledge
• context_update — Persist learnings

𝗔𝗴𝗲𝗻𝘁 𝗦𝗲𝘀𝘀𝗶𝗼𝗻𝘀
• session_start — Begin tracking work
• session_update — Checkpoint progress
• session_resume — Recover from context loss

𝗧𝗶𝗰𝗸𝗲𝘁 𝗠𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁
• ticket_create — Features, tasks, bugs
• ticket_search — Find with filters
• ticket_getHierarchy — Parent-child relationships

𝗞𝗻𝗼𝘄𝗹𝗲𝗱𝗴𝗲 𝗕𝗮𝘀𝗲
• knowledge_search — Hybrid semantic search
• skill_get — Load coding patterns
• sop_get — Standard operating procedures

𝗥𝗼𝗮𝗱𝗺𝗮𝗽 & 𝗣𝗿𝗼𝗴𝗿𝗲𝘀𝘀
• roadmap_materialize — Create phase hierarchy
• sprint_getCurrentPosition — Know where you are
• Progress cascades automatically

Plus: Guided onboarding that generates 15 planning documents from 96 questions.

Tech stack:
• Next.js 14 (App Router)
• PostgreSQL 16 + pgvector
• Prisma ORM
• Tailwind CSS + shadcn/ui
• MCP SDK

MIT Licensed. Self-hosted. No vendor lock-in.

Star the repo if this is useful → [link in comments]

What MCP tools would you add? 👇

#OpenSource #AI #MCP #DeveloperTools #ProjectManagement
```

**Attach**: Sprint Kanban or Agent Sessions screenshot (`assets/sprint-kanban.png` or `assets/agent-sessions.png`)

---

## Post 4: Behind the Scenes (Optional)

**Best time to post**: 1 week after launch

```
I built ProjectPulse using ProjectPulse.

Yes, really. Here's what that looks like:

Every morning, I start with:
→ projectpulse_context_load(projectId: 6)

This loads my memory banks:
• What we're building (project brief)
• How we build it (patterns)
• What's done (progress)
• What's next (active context)

Then I check for paused sessions:
→ projectpulse_agent_session_resume(sessionId)

Full context recovery. The plan I was working on. The todos. Where I left off.

When I find a bug:
→ projectpulse_ticket_create({ kind: "bug", ... })

When I complete a task:
→ Progress cascades up automatically

When I need to remember something:
→ projectpulse_knowledge_create({ ... })

The meta part?

Every feature I build makes building the next feature easier.

• Added the skills system → Used it to load Prisma patterns
• Added ticket hierarchies → Used it to track feature → task breakdowns
• Added session checkpointing → Used it to survive context compaction

This is what "eating your own dog food" looks like in 2024.

What tools do you build that you also use daily?

#BuildInPublic #DeveloperLife #AI #Productivity
```

**Attach**: Dashboard screenshot (`assets/hero-banner.png`)

---

## Posting Tips

1. **Timing**: Tuesday-Thursday, 8-10 AM in your target audience's timezone
2. **First comment**: Add the GitHub link immediately after posting
3. **Engagement**: Reply to every comment in the first hour
4. **Hashtags**: 3-5 relevant hashtags at the end
5. **Images**: Always include a visual — posts with images get 2x engagement

## GitHub Link Comment Template

```
🔗 GitHub: https://github.com/ProjectPulse/ProjectPulse

⭐ Star if you find it useful!

📚 Docs: Check the README for quick start guide
```

---

## Metrics to Track

- GitHub stars (before/after each post)
- Profile views
- Post impressions
- Repository traffic (GitHub Insights)
- New followers
- Comments and DMs
