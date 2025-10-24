"""
Agent Dispatcher for Moksha DevHub
Routes user requests to appropriate specialized agents based on intent analysis
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class RoutingDecision:
    """Result of routing analysis"""
    agent: str
    confidence: float
    reasoning: str
    suggested_next: Optional[str] = None


class AgentDispatcher:
    """Intelligently routes user requests to specialized agents"""

    def __init__(self):
        self.agents = {
            'devhub-architect': {
                'keywords': [
                    'architecture', 'design', 'schema', 'database', 'structure',
                    'pattern', 'organize', 'should i', 'how should', 'best way',
                    'mcp', 'api design', 'data model', 'module', 'monorepo'
                ],
                'patterns': [
                    r'\b(should|would|could)\s+(i|we)\b',
                    r'\b(how\s+to|how\s+should)\b',
                    r'\b(design|architect|structure|organize)\b',
                    r'\b(schema|model|relationship)\b',
                ],
                'description': 'Architecture & design decisions'
            },
            'devhub-fullstack': {
                'keywords': [
                    'implement', 'create', 'build', 'add', 'code', 'write',
                    'component', 'api route', 'endpoint', 'query', 'mutation',
                    'prisma', 'nextjs', 'react', 'typescript', 'function'
                ],
                'patterns': [
                    r'\b(implement|create|build|write|add)\b',
                    r'\b(component|api|endpoint|route|action)\b',
                    r'\b(prisma|nextjs|react|typescript)\b',
                ],
                'description': 'Implementation & coding'
            },
            'devhub-testing': {
                'keywords': [
                    'test', 'testing', 'jest', 'playwright', 'e2e', 'unit test',
                    'integration', 'coverage', 'mock', 'assert', 'expect',
                    'test case', 'regression', 'bug test', 'verify'
                ],
                'patterns': [
                    r'\b(test|testing|jest|playwright)\b',
                    r'\b(unit\s+test|integration\s+test|e2e)\b',
                    r'\b(coverage|assert|expect|mock)\b',
                ],
                'description': 'Testing & QA'
            },
            'devhub-auditor': {
                'keywords': [
                    'review', 'audit', 'check', 'security', 'performance',
                    'accessibility', 'quality', 'validate', 'verify', 'analyze',
                    'best practices', 'code review', 'optimize', 'improve'
                ],
                'patterns': [
                    r'\b(review|audit|check|analyze)\b',
                    r'\b(security|performance|accessibility)\b',
                    r'\b(optimize|improve|quality)\b',
                ],
                'description': 'Code review & quality'
            },
            'devhub-mcp-specialist': {
                'keywords': [
                    'mcp', 'model context protocol', 'tool', 'resource', 'prompt',
                    'claude code', 'mcp server', 'stdio', 'mcp tool', 'context injection'
                ],
                'patterns': [
                    r'\bmcp\b',
                    r'\b(tool|resource|prompt)\b.*\b(mcp|claude)\b',
                    r'\bclaude\s+code\b',
                ],
                'description': 'MCP integration'
            }
        }

        self.workflow_patterns = {
            'feature_development': [
                'devhub-architect',
                'devhub-fullstack',
                'devhub-testing',
                'devhub-auditor'
            ],
            'bug_fixing': [
                'devhub-fullstack',
                'devhub-testing',
                'devhub-auditor'
            ],
            'mcp_tool_creation': [
                'devhub-mcp-specialist',
                'devhub-fullstack',
                'devhub-testing'
            ],
            'architecture_refactor': [
                'devhub-architect',
                'devhub-auditor',
                'devhub-fullstack',
                'devhub-testing'
            ]
        }

    def route_request(self, user_message: str, context: Optional[Dict] = None) -> RoutingDecision:
        """
        Analyze user message and route to appropriate agent

        Args:
            user_message: The user's request
            context: Optional context (current agent, recent files, etc.)

        Returns:
            RoutingDecision with agent selection and reasoning
        """
        scores = self._score_agents(user_message)
        agent, confidence = max(scores.items(), key=lambda x: x[1])

        # Adjust based on context
        if context:
            agent, confidence = self._adjust_for_context(
                agent, confidence, context, scores
            )

        # Determine reasoning
        reasoning = self._build_reasoning(user_message, agent, confidence)

        # Suggest next agent in workflow
        suggested_next = self._suggest_next_agent(agent, user_message, context)

        return RoutingDecision(
            agent=agent,
            confidence=confidence,
            reasoning=reasoning,
            suggested_next=suggested_next
        )

    def _score_agents(self, message: str) -> Dict[str, float]:
        """Score each agent based on message content"""
        message_lower = message.lower()
        scores = {}

        for agent_name, agent_config in self.agents.items():
            score = 0.0

            # Keyword matching
            for keyword in agent_config['keywords']:
                if keyword in message_lower:
                    score += 1.0

            # Pattern matching
            for pattern in agent_config['patterns']:
                if re.search(pattern, message_lower):
                    score += 2.0

            # Normalize score
            max_possible = len(agent_config['keywords']) + len(agent_config['patterns']) * 2
            scores[agent_name] = score / max_possible if max_possible > 0 else 0.0

        return scores

    def _adjust_for_context(
        self,
        agent: str,
        confidence: float,
        context: Dict,
        scores: Dict[str, float]
    ) -> Tuple[str, float]:
        """Adjust agent selection based on context"""
        current_agent = context.get('current_agent')
        recent_files = context.get('recent_files', [])

        # If currently in a workflow, suggest continuing
        if current_agent and confidence < 0.5:
            # User might be continuing conversation with current agent
            return current_agent, 0.6

        # If files are test files, prefer testing agent
        if any('.test.' in f or '.spec.' in f for f in recent_files):
            if 'devhub-testing' in scores and scores['devhub-testing'] > 0.1:
                return 'devhub-testing', max(confidence, 0.7)

        # If files are in api/ directory, might be API work
        if any('/api/' in f for f in recent_files):
            if confidence < 0.5:
                return 'devhub-fullstack', 0.6

        return agent, confidence

    def _build_reasoning(self, message: str, agent: str, confidence: float) -> str:
        """Build explanation for routing decision"""
        agent_desc = self.agents[agent]['description']

        if confidence > 0.7:
            return f"High confidence: Request clearly relates to {agent_desc}"
        elif confidence > 0.4:
            return f"Moderate confidence: Request appears to involve {agent_desc}"
        else:
            return f"Low confidence: Best match is {agent_desc}, but consider clarifying your request"

    def _suggest_next_agent(
        self,
        current_agent: str,
        message: str,
        context: Optional[Dict]
    ) -> Optional[str]:
        """Suggest next agent in typical workflow"""
        # Identify workflow pattern
        workflow = None

        if current_agent == 'devhub-architect':
            workflow = 'feature_development'
        elif current_agent == 'devhub-mcp-specialist':
            workflow = 'mcp_tool_creation'
        elif 'refactor' in message.lower():
            workflow = 'architecture_refactor'
        elif 'bug' in message.lower() or 'fix' in message.lower():
            workflow = 'bug_fixing'

        if not workflow:
            return None

        # Find current position in workflow
        workflow_steps = self.workflow_patterns.get(workflow, [])
        try:
            current_index = workflow_steps.index(current_agent)
            if current_index < len(workflow_steps) - 1:
                return workflow_steps[current_index + 1]
        except ValueError:
            pass

        return None

    def get_agent_info(self, agent_name: str) -> Dict:
        """Get information about a specific agent"""
        if agent_name not in self.agents:
            raise ValueError(f"Unknown agent: {agent_name}")

        config = self.agents[agent_name]
        return {
            'name': agent_name,
            'description': config['description'],
            'keywords': config['keywords'],
            'patterns': [p.pattern for p in [re.compile(p) for p in config['patterns']]]
        }

    def list_agents(self) -> List[Dict]:
        """List all available agents"""
        return [
            {
                'name': name,
                'description': config['description']
            }
            for name, config in self.agents.items()
        ]


# Create singleton instance
dispatcher = AgentDispatcher()


if __name__ == '__main__':
    # Test routing
    test_cases = [
        "How should I structure the MCP tools for DevHub?",
        "Implement the POST /api/issues endpoint",
        "Write tests for the issue creation API",
        "Review this code for security issues",
        "Design the database schema for agent personas",
    ]

    print("🧪 Testing Agent Dispatcher\n")

    for test_message in test_cases:
        decision = dispatcher.route_request(test_message)
        print(f"📝 Message: {test_message}")
        print(f"   → Agent: {decision.agent}")
        print(f"   → Confidence: {decision.confidence:.2f}")
        print(f"   → Reasoning: {decision.reasoning}")
        if decision.suggested_next:
            print(f"   → Next: {decision.suggested_next}")
        print()
