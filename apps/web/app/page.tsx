export default function HomePage() {
  return (
    <main className="min-h-screen bg-background-darkest p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="gradient-text mb-2 text-5xl font-bold">ProjectPulse</h1>
          <p className="text-xl text-text-secondary">
            Your Project&apos;s Heartbeat - AI-Powered Development Hub
          </p>
        </header>

        {/* Feature Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="card-hover rounded-xl bg-background-medium p-6">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">Issue Tracking</h3>
            <p className="text-text-secondary">
              Manage issues with priority levels, tags, and real-time activity tracking
            </p>
          </div>

          <div className="card-hover rounded-xl bg-background-medium p-6">
            <div className="mb-4 text-4xl">📚</div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">Knowledge Base</h3>
            <p className="text-text-secondary">
              Organize documentation with semantic search and AI-powered insights
            </p>
          </div>

          <div className="card-hover rounded-xl bg-background-medium p-6">
            <div className="mb-4 text-4xl">🤖</div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">AI Agents</h3>
            <p className="text-text-secondary">
              Leverage specialized AI agents for architecture, testing, and development
            </p>
          </div>
        </section>

        {/* Theme Palette Showcase */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">Color Palette</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-background-darkest"></div>
              <p className="text-sm text-text-secondary">Background Darkest</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-background-dark"></div>
              <p className="text-sm text-text-secondary">Background Dark</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-background-medium"></div>
              <p className="text-sm text-text-secondary">Background Medium</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-background-light"></div>
              <p className="text-sm text-text-secondary">Background Light</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent-primary"></div>
              <p className="text-sm text-text-secondary">Accent Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent-secondary"></div>
              <p className="text-sm text-text-secondary">Accent Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-success"></div>
              <p className="text-sm text-text-secondary">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-error"></div>
              <p className="text-sm text-text-secondary">Error</p>
            </div>
          </div>
        </section>

        {/* Status Indicator */}
        <footer className="mt-12 flex items-center gap-2 text-text-tertiary">
          <div className="pulse-indicator">
            <div className="pulse-dot"></div>
            <div className="pulse-ring"></div>
          </div>
          <span className="text-sm">Week 1.5 - Coral Theme Transformation In Progress</span>
        </footer>
      </div>
    </main>
  );
}
