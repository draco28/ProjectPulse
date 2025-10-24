"""
DevHub Orchestrator - Main Interface
Coordinates all agents and provides unified user experience for Moksha DevHub development
"""

import sys
from typing import Optional
from agent_dispatcher import dispatcher, RoutingDecision
from agent_state_manager import state_manager, SessionState
from agent_integration import integration, format_handoff_message


class DevHubOrchestrator:
    """Main orchestrator for multi-agent workflow"""

    def __init__(self):
        self.dispatcher = dispatcher
        self.state_manager = state_manager
        self.integration = integration
        self.current_session: Optional[SessionState] = None

    def start_session(self, objective: str) -> None:
        """Start a new development session"""
        self.current_session = self.state_manager.create_session(objective)
        print(f"✨ Started new session: {self.current_session.session_id}")
        print(f"🎯 Objective: {objective}\n")

    def process_request(self, user_message: str) -> None:
        """Process a user request and route to appropriate agent"""
        if not self.current_session:
            print("⚠️  No active session. Starting new session...")
            self.start_session("General development session")

        # Get routing decision
        context = self.state_manager.get_agent_context(self.current_session)
        decision = self.dispatcher.route_request(user_message, context)

        # Display routing decision
        self._display_routing(decision)

        # Record handoff if switching agents
        if self.current_session.current_agent and self.current_session.current_agent != decision.agent:
            self.state_manager.record_handoff(
                self.current_session,
                from_agent=self.current_session.current_agent,
                to_agent=decision.agent,
                reason=decision.reasoning,
                context=user_message
            )
            print(format_handoff_message(
                self.current_session.current_agent,
                decision.agent,
                user_message,
                decision.reasoning
            ))
        else:
            self.current_session.current_agent = decision.agent
            self.state_manager.update_session(self.current_session)

        # Invoke agent
        response = self.integration.invoke_agent(
            decision.agent,
            user_message,
            context
        )

        print(response)

        # Suggest next step
        if decision.suggested_next:
            print(f"\n💡 Suggested next: {decision.suggested_next}")
            print(f"   Type 'continue' to proceed with {decision.suggested_next}")

    def continue_workflow(self) -> None:
        """Continue to next agent in workflow"""
        if not self.current_session:
            print("⚠️  No active session")
            return

        if not self.current_session.current_agent:
            print("⚠️  No current agent to continue from")
            return

        # Get last routing decision to find suggested_next
        context = self.state_manager.get_agent_context(self.current_session)
        decision = self.dispatcher.route_request(
            "continue workflow",
            context
        )

        if decision.suggested_next:
            print(f"🔄 Continuing workflow: {self.current_session.current_agent} → {decision.suggested_next}")
            self.current_session.current_agent = decision.suggested_next
            self.state_manager.update_session(self.current_session)
            print(f"✅ Now working with: {decision.suggested_next}")
        else:
            print("ℹ️  No next step suggested. Workflow may be complete.")

    def show_status(self) -> None:
        """Display current session status"""
        if not self.current_session:
            print("ℹ️  No active session")
            return

        summary = self.state_manager.get_session_summary(self.current_session)
        print(summary)

    def list_sessions(self) -> None:
        """List recent sessions"""
        sessions = self.state_manager.list_sessions()

        if not sessions:
            print("ℹ️  No previous sessions found")
            return

        print("📚 Recent Sessions:")
        for session in sessions:
            print(f"\n   ID: {session['session_id']}")
            print(f"   Objective: {session['objective']}")
            print(f"   Created: {session['created_at']}")
            print(f"   Files: {session['files_modified']} | Artifacts: {session['artifacts']}")

    def show_agents(self) -> None:
        """Show available agents"""
        agents = self.integration.list_agents()

        print("🤖 Available Agents:\n")
        for agent in agents:
            print(f"   {agent['name']} ({agent['color']})")
            print(f"   {agent['description'][:100]}...")
            print()

    def show_help(self) -> None:
        """Display help information"""
        help_text = """
🔧 DevHub Orchestrator - Available Commands

Basic Commands:
  help                 Show this help message
  status               Show current session status
  continue             Continue to next workflow step
  agents               List all available agents
  sessions             List recent sessions
  exit / quit          Exit orchestrator

Usage Examples:
  "Design the database schema for agent personas"
  "Implement the POST /api/issues endpoint"
  "Write tests for the search API"
  "Review this code for security issues"

How It Works:
1. Type your request naturally
2. Orchestrator routes to appropriate agent
3. Agent provides specialized guidance
4. Type 'continue' to proceed to next step
5. Type 'status' to see progress

Agent Specializations:
  • devhub-architect     - Architecture & design decisions
  • devhub-fullstack     - Implementation & coding
  • devhub-testing       - Testing & QA
  • devhub-auditor       - Code review & quality
  • devhub-mcp-specialist - MCP integration

Workflows:
  Feature Development: architect → fullstack → testing → auditor
  Bug Fixing: fullstack → testing → auditor
  MCP Tools: mcp-specialist → fullstack → testing
"""
        print(help_text)

    def _display_routing(self, decision: RoutingDecision) -> None:
        """Display routing decision"""
        confidence_emoji = "🎯" if decision.confidence > 0.7 else "🤔" if decision.confidence > 0.4 else "❓"

        print(f"\n{confidence_emoji} Routing Decision:")
        print(f"   Agent: {decision.agent}")
        print(f"   Confidence: {decision.confidence:.0%}")
        print(f"   Reasoning: {decision.reasoning}\n")

    def run_interactive(self) -> None:
        """Run in interactive mode"""
        print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🚀 Moksha DevHub Orchestrator v1.0              ║
║                                                            ║
║        Intelligent Multi-Agent Development Assistant      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Type 'help' for available commands or describe what you need.
""")

        # Validate setup
        validation = self.integration.validate_agent_setup()
        if not validation['agents_directory_exists'] or validation['agents_count'] == 0:
            print("⚠️  Warning: Agent system not properly configured")
            print("   Run setup to create agent configurations\n")

        # Load existing session if available
        existing_session = self.state_manager.load_current_session()
        if existing_session:
            print(f"📋 Resuming session: {existing_session.session_id}")
            print(f"   Objective: {existing_session.objective}")
            print(f"   Current agent: {existing_session.current_agent or 'None'}\n")
            self.current_session = existing_session
        else:
            objective = input("🎯 What are you working on today? ")
            if objective.strip():
                self.start_session(objective)
            print()

        # Main loop
        while True:
            try:
                user_input = input("💬 You: ").strip()

                if not user_input:
                    continue

                # Handle commands
                if user_input.lower() in ['exit', 'quit', 'q']:
                    if self.current_session:
                        archive = input("Archive current session? (y/n): ")
                        if archive.lower() == 'y':
                            self.state_manager.archive_session(self.current_session)
                            print("✅ Session archived")
                    print("👋 Goodbye!")
                    break

                elif user_input.lower() == 'help':
                    self.show_help()

                elif user_input.lower() == 'status':
                    self.show_status()

                elif user_input.lower() == 'continue':
                    self.continue_workflow()

                elif user_input.lower() == 'agents':
                    self.show_agents()

                elif user_input.lower() == 'sessions':
                    self.list_sessions()

                else:
                    # Process as regular request
                    self.process_request(user_input)

                print()

            except KeyboardInterrupt:
                print("\n\n👋 Interrupted. Type 'exit' to quit.")
                continue
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
                continue


def main():
    """Main entry point"""
    orchestrator = DevHubOrchestrator()

    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'agents':
            orchestrator.show_agents()
        elif command == 'sessions':
            orchestrator.list_sessions()
        elif command == 'status':
            orchestrator.show_status()
        elif command == 'help':
            orchestrator.show_help()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: agents, sessions, status, help")
    else:
        # Run interactive mode
        orchestrator.run_interactive()


if __name__ == '__main__':
    main()
