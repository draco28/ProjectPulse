What type of agent are we building for? : Any agent via MCP (open platform for various AI agents) like claude code, codex, cursor ai, cascade etc.

What is the agent's "skill level" with the system? : i am not sure about this, i mean i want agent to manage my complete project while connecting to our app for everything related to our project so maybe need to "learn" the system over time

What specific goals does the agent want to achieve? : all of them you mentioned but actually if you see our current ai workflow setup we need to do more, like we have 5 step mandatory which ai must follow, so if i take that as example then for a task i give prompt to agent then first agent checks the status and sprint plan in our app then agent creates a plan then when i approve the plan then first it goes to our app then save the plan then it created todo list as well our app and then agent switch to a specific branch and start implementing the plan, then in between implementation phase it also creates checkpoints and update the todo list and current plan status in our app then after completion of implementation phase it then goes to our app and it marks current plan and todo list as completed(moves to task completed section) and i also update our status and sprint plan in our app.
this is just one workflow example, you can check claude.md to fine more workflow like Documentation System, Recovery Workflow etc, all those are being done in local project repo, that needs to be done in our app so that we can have a visual representation of our project progress.

Please describe the agent's daily workflow for each feature:
Issues: [Agent's typical use case] = we will run mandatory audits or we will perform testing phase or we will simply find issues while implementing, all those scenarios will give us issues which will be then created and documented inside issues.
Knowledge: [Agent's typical use case] = we will see that agents required various skills like react, nextjs, prisma etc, so agents will create knowledge docs basically it is more specific for claude code as only claude code utilizes skills feature but this is something which should not be in knowledge page, it should be in a seperate skills page, now for actual use of knowledge page is to have RAG plus knowledge graph hybrid system to have a better context of our project which agents should utilise to improve and enhance their performance by optimising their context consumption as the knowledge/memory should be consumed in a way like agents should get related knowledge based on their need instead of recursively traversing the knowledge base. refer to https://ref.tools/mcp for similar feature.

Wiki: [Agent's typical use case] : this is basically our docs folder in project root, this should contain all our project documents like architecture, system design, userstory, prd etc. agent should create these documents specific to our project and update it or refer to it for context.

Security: [Agent's typical use case] : This is basically to list all the security issues with our project but it can be better transformed into something which shows security, gaps, violation, technical depts etc whenever we find them during testing,implementing or during audits.

Personas: [Agent's typical use case] : This is basically to list all the personas (sub agents for claude code specifically) for our project, agents can create sub agents during intial planning phase of project and also add new or edit current during the project development phase.

What pain points does the agent currently experience? : all mentioned by you and things like gaps in documentation, progress not tracked in phase or sprint manner.

How motivated is this agent? : very motivated as it uses this app for every bit of things required to perform its tasks for the project.

What type of human developer? : Solo developer (you) managing personal projects but can be small teams

What specific goals does the human want to achieve? all of the mentioned and things like adding things manually as well like adding issues, knowledge, wiki, security, personas etc.

What pain points does the human experience? : all mentioned by you.

Q1: Skills vs Knowledge Split : for skills understanding please check current project's .claude/skills folder and for knowledge, please do a comprehensive review of this site https://docs.ref.tools/ and try to implement the same in our app.

Q2: Workflow Orchestration : it could be a dedicated "Workflows" feature (7th feature) or a Global workflow tracker (independent of features), you please do a analysis of our current claude.md for it because there are more functions than just 5-step protocol, more like rules or workflow which we/agents can see and modify in our app.

Q3: Sprint/Phase Tracking : Now this is something we need to understand properly, currently we have status.md, development_plan.md, current-todos.md, current-plan.md, current-session-[timestamp].md. ALl these to manage our progress which is a big problem as agent never update all the docs and we always face inconsistency, so need a seperate feature/page having our complete sprint/phase tracking system, flow chats, or any more visual indicators showing progress, having hierarchy based structure like phase 1 -> week 1 -> day 1 -> task 1 -> subtask 1 -> session 1 etc.
and should have nodes/file for status.md, development_plan.md, current-todos.md, current-plan.md, current-session-[timestamp].md and they are updated everytime there is a need to update them.

Q4: Visual Representation Priority : yes all visual representation is for human but it is as important as others.

1. Sprint/Phase Tracking Models : let's go with 5-level hierarchy, Phase → Week → Day → Task → Session because tasks can be easliy fit in a single context conversation of an agent so subtask not required to be tracked on app.

2. Knowledge Graph Models : as informed earlier i do not have much experties in this area but if it is fullfilling my requirement then i will go with your recommendation.

3. Workflow Orchestration Models : Yes all 12 workflows from CLAUDE.md tracked this way.

4. Markdown Sync Table : add git hook to prevent manual edits to these files as i want only agent to edit them and that too after proper approval like a pr request we have in git setup.

5. Safety Models : acceptable level of safety considering we see ai hilucination now and then.

4.2 MCP Tools - 38 Tools Across 8 Features : 38 tools sufficient but one thing to note which you might miss that we also have dashboard page so make sure you are consedering it as well, and i need one clarification that these mcp tools, will they have to installed in agents ? or there will be a single mcp tool installed in agent to connect to our app and perform multiple operations using these 38 tools ?

4.3 Knowledge Graph - Token-Efficient Retrieval : perfect hybrid approach (semantic + full-text + limited graph traversal), this is eaxctly what i wanted and it is our best feature overall.

Phase 10 Review: Security & Autonomy : perfect 3 autonomy levels, i approve.

10.2 Safety Mechanisms - 5 Systems : mentioned safety approach acceptable and perfect for our app.

---
