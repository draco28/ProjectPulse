"""
Agent State Manager for Moksha DevHub
Manages session state, context, and handoffs between agents
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class AgentHandoff:
    """Record of agent handoff"""
    from_agent: str
    to_agent: str
    timestamp: str
    context: str
    reason: str


@dataclass
class SessionState:
    """Complete session state"""
    session_id: str
    created_at: str
    updated_at: str
    objective: str
    current_agent: Optional[str]
    handoff_history: List[Dict]
    files_modified: List[str]
    artifacts_created: List[Dict]
    progress: Dict[str, Any]
    context: Dict[str, Any]


class AgentStateManager:
    """Manages persistent state across agent interactions"""

    def __init__(self, state_dir: str = '.claude/state'):
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.current_session_file = self.state_dir / 'current_session.json'
        self.session_history_dir = self.state_dir / 'history'
        self.session_history_dir.mkdir(exist_ok=True)

    def create_session(self, objective: str, session_id: Optional[str] = None) -> SessionState:
        """Create a new session"""
        if session_id is None:
            session_id = datetime.now().strftime('%Y%m%d_%H%M%S')

        session = SessionState(
            session_id=session_id,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            objective=objective,
            current_agent=None,
            handoff_history=[],
            files_modified=[],
            artifacts_created=[],
            progress={},
            context={}
        )

        self._save_session(session)
        return session

    def load_current_session(self) -> Optional[SessionState]:
        """Load the current active session"""
        if not self.current_session_file.exists():
            return None

        try:
            with open(self.current_session_file, 'r') as f:
                data = json.load(f)
                return SessionState(**data)
        except Exception as e:
            print(f"⚠️  Error loading session: {e}")
            return None

    def update_session(self, session: SessionState) -> None:
        """Update session state"""
        session.updated_at = datetime.now().isoformat()
        self._save_session(session)

    def record_handoff(
        self,
        session: SessionState,
        from_agent: str,
        to_agent: str,
        reason: str,
        context: str = ""
    ) -> None:
        """Record an agent handoff"""
        handoff = AgentHandoff(
            from_agent=from_agent,
            to_agent=to_agent,
            timestamp=datetime.now().isoformat(),
            context=context,
            reason=reason
        )

        session.handoff_history.append(asdict(handoff))
        session.current_agent = to_agent
        self.update_session(session)

    def add_modified_file(self, session: SessionState, filepath: str) -> None:
        """Track a modified file"""
        if filepath not in session.files_modified:
            session.files_modified.append(filepath)
            self.update_session(session)

    def add_artifact(
        self,
        session: SessionState,
        artifact_type: str,
        name: str,
        description: str,
        metadata: Optional[Dict] = None
    ) -> None:
        """Track a created artifact"""
        artifact = {
            'type': artifact_type,
            'name': name,
            'description': description,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }

        session.artifacts_created.append(artifact)
        self.update_session(session)

    def update_progress(self, session: SessionState, key: str, value: Any) -> None:
        """Update progress tracking"""
        session.progress[key] = value
        self.update_session(session)

    def add_context(self, session: SessionState, key: str, value: Any) -> None:
        """Add contextual information"""
        session.context[key] = value
        self.update_session(session)

    def get_context(self, session: SessionState, key: str, default: Any = None) -> Any:
        """Get contextual information"""
        return session.context.get(key, default)

    def archive_session(self, session: SessionState) -> None:
        """Archive completed session"""
        archive_file = self.session_history_dir / f"{session.session_id}.json"

        with open(archive_file, 'w') as f:
            json.dump(asdict(session), f, indent=2)

        # Clear current session
        if self.current_session_file.exists():
            self.current_session_file.unlink()

    def list_sessions(self, limit: int = 10) -> List[Dict]:
        """List recent sessions"""
        sessions = []

        for session_file in sorted(
            self.session_history_dir.glob('*.json'),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )[:limit]:
            try:
                with open(session_file, 'r') as f:
                    data = json.load(f)
                    sessions.append({
                        'session_id': data['session_id'],
                        'objective': data['objective'],
                        'created_at': data['created_at'],
                        'files_modified': len(data['files_modified']),
                        'artifacts': len(data['artifacts_created']),
                    })
            except Exception as e:
                print(f"⚠️  Error reading {session_file}: {e}")

        return sessions

    def get_session_summary(self, session: SessionState) -> str:
        """Generate a human-readable session summary"""
        summary_lines = [
            f"📋 Session: {session.session_id}",
            f"🎯 Objective: {session.objective}",
            f"⏰ Created: {session.created_at}",
            f"👤 Current Agent: {session.current_agent or 'None'}",
            f"📝 Files Modified: {len(session.files_modified)}",
            f"🎨 Artifacts Created: {len(session.artifacts_created)}",
        ]

        if session.handoff_history:
            summary_lines.append(f"\n🔄 Handoff History ({len(session.handoff_history)} handoffs):")
            for handoff in session.handoff_history[-3:]:  # Last 3
                summary_lines.append(
                    f"   {handoff['from_agent']} → {handoff['to_agent']}: {handoff['reason']}"
                )

        if session.progress:
            summary_lines.append(f"\n📊 Progress:")
            for key, value in session.progress.items():
                summary_lines.append(f"   {key}: {value}")

        return '\n'.join(summary_lines)

    def get_agent_context(self, session: SessionState) -> Dict:
        """Build context for agent invocation"""
        return {
            'objective': session.objective,
            'current_agent': session.current_agent,
            'files_modified': session.files_modified,
            'recent_handoffs': session.handoff_history[-3:] if session.handoff_history else [],
            'artifacts': session.artifacts_created,
            'progress': session.progress,
            'context': session.context,
        }

    def _save_session(self, session: SessionState) -> None:
        """Save session to file"""
        with open(self.current_session_file, 'w') as f:
            json.dump(asdict(session), f, indent=2)


# Create singleton instance
state_manager = AgentStateManager()


if __name__ == '__main__':
    # Test state management
    print("🧪 Testing Agent State Manager\n")

    # Create session
    session = state_manager.create_session(
        objective="Implement issue filtering feature"
    )
    print("✅ Created session")
    print(state_manager.get_session_summary(session))
    print()

    # Record handoff
    state_manager.record_handoff(
        session,
        from_agent='devhub-architect',
        to_agent='devhub-fullstack',
        reason='Design complete, ready for implementation',
        context='Designed API endpoint and database schema'
    )
    print("✅ Recorded handoff")

    # Track file modifications
    state_manager.add_modified_file(session, 'app/api/issues/route.ts')
    state_manager.add_modified_file(session, 'components/IssueFilter.tsx')
    print("✅ Tracked modified files")

    # Track artifacts
    state_manager.add_artifact(
        session,
        artifact_type='component',
        name='IssueFilter',
        description='Filter component for issues',
        metadata={'path': 'components/IssueFilter.tsx'}
    )
    print("✅ Tracked artifact")

    # Update progress
    state_manager.update_progress(session, 'api_implemented', True)
    state_manager.update_progress(session, 'ui_implemented', True)
    state_manager.update_progress(session, 'tests_written', False)
    print("✅ Updated progress")

    # Show final summary
    print(f"\n{state_manager.get_session_summary(session)}")

    # Load session
    print("\n✅ Testing session persistence...")
    loaded = state_manager.load_current_session()
    if loaded:
        print(f"✅ Loaded session: {loaded.session_id}")
        print(f"   Files: {len(loaded.files_modified)}")
        print(f"   Handoffs: {len(loaded.handoff_history)}")
