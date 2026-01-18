/**
 * WatchersSection Component
 *
 * Server Component that displays users watching this issue
 *
 * Architecture (per react-expert recommendation):
 * - Server Component (static rendering)
 * - Avatar stack design pattern
 * - Future: Connect to database when watchers table is added
 *
 * Current State:
 * - Placeholder component (watchers table not yet in schema)
 * - Shows static example watchers
 * - Includes "Add watcher" button (future functionality)
 *
 * Props:
 * - ticketId: Ticket identifier
 * - watchers: Array of user objects (future)
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

// ============================================================================
// TYPES
// ============================================================================

interface WatchersSectionProps {
  ticketId: string;
  // Future: watchers: Watcher[]
}

// Placeholder watcher type
interface PlaceholderWatcher {
  id: number;
  name: string;
  initials: string;
  color: string;
}

// ============================================================================
// PLACEHOLDER DATA
// ============================================================================

/**
 * Placeholder watchers data
 * Future: This will come from database query
 */
const PLACEHOLDER_WATCHERS: PlaceholderWatcher[] = [
  { id: 1, name: 'John Doe', initials: 'JD', color: 'bg-blue-500' },
  { id: 2, name: 'Jane Smith', initials: 'JS', color: 'bg-purple-500' },
  { id: 3, name: 'Alice Johnson', initials: 'AJ', color: 'bg-pink-500' },
  { id: 4, name: 'Bob Wilson', initials: 'BW', color: 'bg-green-500' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function WatchersSection({ ticketId: _ticketId }: WatchersSectionProps) {
  const watchers = PLACEHOLDER_WATCHERS;

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <i className="fas fa-eye text-coral" aria-hidden="true"></i>
          Watchers
          <span className="text-sm font-normal text-slate">({watchers.length})</span>
        </h3>
        <button
          className="smooth-transition hover:text-coralLight text-xs text-coral"
          aria-label="Add watcher"
          disabled
        >
          <i className="fas fa-plus" aria-hidden="true"></i>
        </button>
      </div>

      {/* Avatar Stack */}
      <div className="flex items-center gap-3">
        {/* Stacked Avatars */}
        <div className="flex -space-x-2">
          {watchers.map((watcher, index) => (
            <div
              key={watcher.id}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1A1A1A] ${watcher.color} text-sm font-semibold text-white shadow-md transition-transform hover:z-10 hover:scale-110`}
              style={{ zIndex: watchers.length - index }}
              title={watcher.name}
              aria-label={`Watcher: ${watcher.name}`}
            >
              {watcher.initials}
            </div>
          ))}
        </div>

        {/* Watcher Names */}
        <div className="flex-1">
          <p className="text-xs text-slate">
            {watchers.map((w, i) => (
              <span key={w.id}>
                {i > 0 && ', '}
                <span className="text-white">{w.name}</span>
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Watch Button */}
      <div className="mt-4 border-t border-[#2A2A2A] pt-4">
        <button
          className="smooth-transition neu-pressed w-full rounded-2xl px-4 py-2 text-sm text-slate hover:text-white"
          disabled
        >
          <i className="fas fa-bell mr-2" aria-hidden="true"></i>
          Subscribe to notifications
        </button>
      </div>

      {/* Future Enhancement Note */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#2A2A2A] p-3 text-center">
        <p className="text-xs text-slate">
          <i className="fas fa-lightbulb mr-2 text-coral" aria-hidden="true"></i>
          Database schema update required for full watchers feature
        </p>
      </div>
    </div>
  );
}
