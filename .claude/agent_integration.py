"""
Agent Integration for Moksha DevHub
Bridges the orchestrator with .claude/agents markdown files
"""

import os
import re
from pathlib import Path
from typing import Dict, Optional, List
from dataclasses import dataclass


@dataclass
class AgentConfig:
    """Agent configuration parsed from markdown frontmatter"""
    name: str
    description: str
    model: str
    color: str
    system_prompt: str
    filepath: str


class AgentIntegration:
    """Manages agent loading and invocation"""

    def __init__(self, agents_dir: str = '.claude/agents'):
        self.agents_dir = Path(agents_dir)
        self.agents: Dict[str, AgentConfig] = {}
        self._load_agents()

    def _load_agents(self) -> None:
        """Load all agent configurations from markdown files"""
        if not self.agents_dir.exists():
            print(f"⚠️  Agents directory not found: {self.agents_dir}")
            return

        for agent_file in self.agents_dir.glob('*.md'):
            try:
                config = self._parse_agent_file(agent_file)
                self.agents[config.name] = config
            except Exception as e:
                print(f"⚠️  Error loading agent {agent_file.name}: {e}")

    def _parse_agent_file(self, filepath: Path) -> AgentConfig:
        """Parse agent markdown file with frontmatter"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract frontmatter (YAML between --- markers)
        frontmatter_match = re.search(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)

        if not frontmatter_match:
            raise ValueError(f"No frontmatter found in {filepath.name}")

        frontmatter_text, system_prompt = frontmatter_match.groups()

        # Parse frontmatter
        frontmatter = {}
        for line in frontmatter_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip()

        return AgentConfig(
            name=frontmatter.get('name', filepath.stem),
            description=frontmatter.get('description', ''),
            model=frontmatter.get('model', 'sonnet'),
            color=frontmatter.get('color', 'default'),
            system_prompt=system_prompt.strip(),
            filepath=str(filepath)
        )

    def get_agent(self, agent_name: str) -> Optional[AgentConfig]:
        """Get agent configuration by name"""
        return self.agents.get(agent_name)

    def list_agents(self) -> List[Dict]:
        """List all available agents"""
        return [
            {
                'name': config.name,
                'description': config.description[:100] + '...' if len(config.description) > 100 else config.description,
                'model': config.model,
                'color': config.color,
            }
            for config in self.agents.values()
        ]

    def invoke_agent(
        self,
        agent_name: str,
        user_message: str,
        context: Optional[Dict] = None
    ) -> str:
        """
        Invoke an agent (simulation for now, can be replaced with actual API call)

        Args:
            agent_name: Name of agent to invoke
            user_message: User's request
            context: Optional context (files, session state, etc.)

        Returns:
            Agent's response (simulated)
        """
        agent = self.get_agent(agent_name)

        if not agent:
            return f"❌ Agent not found: {agent_name}"

        # Simulate agent invocation
        # In production, this would call Claude API with agent's system prompt
        response = self._execute_agent_simulation(agent, user_message, context)

        return response

    def _execute_agent_simulation(
        self,
        agent: AgentConfig,
        user_message: str,
        context: Optional[Dict]
    ) -> str:
        """
        Simulate agent execution

        In production, replace with:
        - Load agent system prompt
        - Add context to prompt
        - Call Claude API
        - Return response
        """
        context_str = ""
        if context:
            context_str = f"\nContext:\n{json.dumps(context, indent=2)}\n"

        return f"""
🤖 {agent.name} (simulated response)

{context_str}
📝 Processing: {user_message}

This is a simulated response. In production, this would:
1. Load system prompt from: {agent.filepath}
2. Inject context about current session
3. Call Claude API with model: {agent.model}
4. Return actual AI-generated response

To enable real agent execution:
- Integrate with Claude API
- Update _execute_agent_simulation() in agent_integration.py
- Add error handling and retries
"""

    def validate_agent_setup(self) -> Dict[str, bool]:
        """Validate that agent system is properly configured"""
        results = {
            'agents_directory_exists': self.agents_dir.exists(),
            'agents_loaded': len(self.agents) > 0,
            'all_agents_valid': True,
        }

        # Check each agent has required fields
        for agent_name, agent_config in self.agents.items():
            if not agent_config.name or not agent_config.system_prompt:
                results['all_agents_valid'] = False
                results[f'{agent_name}_invalid'] = True

        results['agents_count'] = len(self.agents)

        return results

    def get_agent_capabilities(self, agent_name: str) -> Optional[Dict]:
        """Get detailed capabilities for an agent"""
        agent = self.get_agent(agent_name)

        if not agent:
            return None

        # Extract capabilities from description
        return {
            'name': agent.name,
            'description': agent.description,
            'model': agent.model,
            'system_prompt_length': len(agent.system_prompt),
            'filepath': agent.filepath,
        }


# Create singleton instance
integration = AgentIntegration()


# Utility function for handoff messages
def format_handoff_message(
    from_agent: str,
    to_agent: str,
    context_summary: str,
    reason: str
) -> str:
    """Format a handoff message for agent transitions"""
    return f"""
🔄 **Agent Handoff**

**From:** {from_agent}
**To:** {to_agent}
**Reason:** {reason}

**Context Summary:**
{context_summary}

**Next Steps:**
The {to_agent} agent will now continue from here.
"""


if __name__ == '__main__':
    # Test agent integration
    import json

    print("🧪 Testing Agent Integration\n")

    # Validate setup
    print("✅ Validating agent setup...")
    validation = integration.validate_agent_setup()
    print(f"   Agents directory: {'✓' if validation['agents_directory_exists'] else '✗'}")
    print(f"   Agents loaded: {validation['agents_count']}")
    print(f"   All valid: {'✓' if validation['all_agents_valid'] else '✗'}")
    print()

    # List agents
    print("📋 Available Agents:")
    for agent_info in integration.list_agents():
        print(f"   • {agent_info['name']} ({agent_info['model']})")
        print(f"     {agent_info['description'][:80]}...")
    print()

    # Test agent invocation
    if integration.agents:
        test_agent = list(integration.agents.keys())[0]
        print(f"🧪 Testing agent invocation: {test_agent}")
        response = integration.invoke_agent(
            test_agent,
            "Design the database schema for issue filtering",
            context={'current_phase': 'design', 'files': []}
        )
        print(response)
