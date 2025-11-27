.claude/toggle-glm.sh - to switch between glm and claude code

-------------------------------

MANDATORY PROTOCOL - Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

  Current phase: Sprint 8.5 phase 2 (refer to @.agent/task/sprint-8.5-plan-phase2.md)
  Current status: Starting phase 2

  CONTEXT FILES TO READ:
  - .agent/task/sprint8.5-plan.md
  - .agent/task/3-session-onboarding-REFERENCE.md

  ENFORCE MANDATORY PROTOCOL:
  - ✅ Step 1: Initialize session (create current-session-[timestamp].md)
  - ✅ Step 2: save plan to current-plan.md and current-todos.md 
  - ✅ Step 3: Consult experts BEFORE implementing
  - ✅ Step 4: Checkpoints every 15K tokens
  - ✅ Step 4.5: Verification gate (evidence-based)
  - ✅ Step 5: Post-completion workflow

  CRITICAL REMINDERS:
  1. Mac mini: Services run on 192.168.1.15:3000
  2. Container paths ONLY: /app/... (not /Users/...)
  3. Dependencies installed: @microsoft/tsdoc@0.16.0, glob@11.0.3
  4. All tests must pass before committing

  
  Read FIRST in every conversation:
     .agent/system/infrastructure-state.md

     # Check these sections:
     1. "Current Active Environment" - What's running now?
     2. "Key Decisions for AI Agents" - Before making recommendations
     3. "Quick Decision Matrix" - User request → Correct command

---------------------------------------------

1. **Prisma Migration Strategy** : Create NEW `Ticket` table (not modify existing `Issue`) : i am ok with this strategy but then does'nt it also means that issues will be technically be seperate table
and then when we create a new ticket for issue it will have ticket schema not issue schema since we will create ticket based on what we defined in ticket schema and issue is sub set of ticket now.
let me know if your approach as drawbacks, because if you say now to do this but during testing we facing issues because of this decision then it wan'nt a goot decision to begin with.
also if you say it is during development but i already stated that we are treating sprint 10 as production ready implementation so no backlogs we can afford now, so let me know when are you planning to 
refactor issues later ?

2. **Backwards Compatibility (MCP Tools)** : this one makes sense because if client is asking their agent to create a ticket then they will specify type of ticket, so if they say issues then their agent should use tools which are renamed one.

3. **UI Terminology & Routes** : I feel like this could backfire if we will work on more routing related work in future as we will assume it as ticket in backend, let me know if i am not correct and 
your method is roburst, all i am saying that i do not want to work on refactoring later, we are not keeping backlogs in this sprint.

4. **Task Linking (Roadmap Integration)** : yes linking task id should be optional. 

For the Dashboard widgets : "Open Issues" become "Open Tickets", we are completely refactoring issue to ticket, issue is type of ticket.

Should the `/issues` route show ALL ticket kinds : i am having a bad feeling about not changing route but yes it should show all tickets.

Timeline: can we adjust if the migration proves more complex but we are completing this feature end to end because we are nearing end of development and i do not want backlogs.


/Users/draco/.factory/specs/2025-11-25-sprint-10-ticket-system-issue-ticket-migration.md




Roadmap + Sprint hierarchy + Checkpoints
Phase, Sprint, Week, Day, Task, Session, Checkpoint models.
Checkpoint.sessionContext JSON is already a generic, session-level context snapshot every 15K tokens.
 regarding this feature, we have removed roadmap materialization from onboarding session, check git history once, we might have commited specifically for this, we are planning to implement this
 seperatly after onboarding session since it was getting very complicated and decoupling made sence, for now i want you to check where it is and how it is presend currently in our code since we 
 have remvoed it from onboarding session.

 2.1 Already implemented (or functionally covered) : we will ignore dog fooding and the OnboardingSession.projectContextJson is for only having context between session 1,2 and 3 of onboarding session,
 the memory bank system mentioned in project plan is actually a project feature which will be similar to our dog fooding memory bank, in our dog fooding we have memory bank so that agent working on our project can have all the context they need to resume their work from where they left off, so same functionality we are going to have in our product for client agents who will be working on user's project and will use mcp to fetch memory bank data from db to resume thier work.

 so do not get confused with onboarding session single file projectContextJson which will only be used during onboarding session and does not have any more features to act like a 5 db store based memory bank system which we are implementing, however i do think that few of the memory bank file data will be overlapping with projectContextJson that is tech-context, system-patters and project brief which even for dog fooding we do not update very often unless major refactor but other memory bank file : progress and active-context file will be updated whenever agent will work on different phase or sprint of project plan.

 so i believe your input on 2.3 Still to implement (if we keep EPIC‑010 in scope) is correct, we need these memory bank as a project feature which will be available in db for agent to access via mcp and will be also available in knowledge base page of our product for user to view.
 

 2.4 Candidates to abandon / push to Post‑MVP : as discussed above, we will have memory bank in knowledge base page so not a full blown ui page for it, just knowledge cards to view and not even update from ui, that should only be updated from mcp via their agent.

 3. Classification – Sprint 9 (EPIC‑011: Research Agent Orchestration) : 

   3.1 Already implemented / functionally covered : we have knowledge base page where we will have knowledge cards and in db we will have knowlege data which is only stored by agent via mcp for their 
   use, like if they are working on something and we did a lot of hit and trial and found a solution then agent should store that knowledge(memory) in db then whenver they are working on any similar thing they can retrieve knowledge about that using mcp and that will be done in agentic manner which should be fast and token efficient as we will be using rag and knowledge graph to make retrival of info very efficient. so yes EPIC‑011 as a product feature: Not implemented and we will plan it for implementation but let us tackle this as sprint 9.5 or maybe merge in sprint 10 because this is a big and complex feature.

   now regarding Research Agent Orchestration, ignore our dog fooding again first because it is for our internal use and now regarding implementing it as a feature i do not see any scope or way to implement it as a feature right now so deffer it to sprint 10 or maybe 11.

   so 3.3 Still to implement : we will deffer EPIC‑011 it to sprint 10 or maybe 11 but one thing to talk about it what are these agents described as in plan ? have we mentioned them to be usign llm for performing their task ? like take an example of research agent, what we planned to accomplish with it ? , if we talk about our product, we are keeping all project docs and ai agent related data which we have in .agent and .claude folder for internal dog fooding will be in db storage for user's to use for their project, most of them are created during onboarding session and few things will be already there like memory bank features but what i am trying to tell is we do not have access to user's local repo, so all coding and other things user has in their repo will be not accessible to our product, so what these sub agents and orchestration will do as a feature in our product ?

4. Classification – Sprint 10 (EPIC‑012: Memory Bank Snapshot Integration) : what you are describing as already have is roadmap ui functionality, which is created by materialization of project plan data generated during session 2 of onboarding session and it was then materialized during session 3 of onboarding but due to complexity and errors we have decoupled this feature from onboarding session and now we are planning to implement it as a seperate feature in sprint 10 or maybe 11.

so basically this memory bank snapshot integration is for ticket feature which will actually be similar to issues, where user or their agent will create a ticket for working on a specific epic or feature or a sprint, then that ticket will store memory bank snapshot like what is tech context for that work, what is the system pattern which they have to follow, a project brief to stay consistent, active context showing current code implementation to integrate easily and progress data/todos to track progress of that ticket, then few more features like assignee (where user can assign ticket to either a team member or any specific agent), priority, due date, labels, comments, knowledge base cards required for ticket, project docs snapshots from wiki page which will give more clarity from project docs like PRD, SRS, Backlog, Project Plan, Architecture, Data Model, API Spec, UI/UX. So you see this ticket system will be revolutionary for our product but big enough to work on it post mvp in a seperate sprint, better to defer it to sprint 11 or maybe 12.

I think you still didn't understand what I actually want. First of all. I am not a DB expert, so I cannot understand what is going to be with 2 db, 1 dev and one prod, so I don't want to work on this part. I want to understand why we cannot use db migration now. Can't we just have a current schema as a baseline and then whenever we have a future schema change, we could use the current status as a baseline and then use DB migration without having to DBS and we could simply use D migration and have a single.



~/.claude/plans/joyful-sauteeing-ripple.md


sprint-10-issue-integration-catalog.md


why we have two mcp architecture, one as a seperate mcp server and other is in nextjs app



i am thinking why we have to whitelist every api related to mcp, should'nt it be project aware as client agent's mcp is configured with
  project auth token so it will only be able to connect to specific project, so why we have to whitelist every mcp tool we are building ? we
  should actually have a functionality like having a list of mcp tool which client should not run so we can restrict only those mcp tools like
  admin related actions via mcp. ultrathink about it and come up with a solution 


  all other failures, categorize them, and create a systematic fix plan