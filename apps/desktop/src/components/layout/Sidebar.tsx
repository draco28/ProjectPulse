import { NavLink } from 'react-router-dom';
import { LayoutGrid, ListTodo, Milestone, Search, MessageSquare } from 'lucide-react';

const navItems = [
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/kanban', label: 'Kanban', icon: LayoutGrid },
  { to: '/tickets', label: 'Tickets', icon: ListTodo },
  { to: '/sprints', label: 'Sprints', icon: Milestone },
  { to: '/search', label: 'Search', icon: Search },
];

export function Sidebar() {
  return (
    <aside className="flex flex-col w-56 h-screen bg-surface-raised border-r border-gray-700/50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-700/50">
        <div className="w-8 h-8 rounded-lg bg-coral flex items-center justify-center">
          <span className="text-white font-bold text-sm">PP</span>
        </div>
        <span className="text-sm font-semibold text-gray-200">ProjectPulse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-coral/15 text-coral-light font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700/50">
        <p className="text-xs text-gray-500">Desktop v0.1.0</p>
      </div>
    </aside>
  );
}
