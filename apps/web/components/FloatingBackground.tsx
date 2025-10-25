/**
 * Floating Background Component
 *
 * Provides animated floating hexagons and bubbles for the Coral theme.
 * These decorative elements add visual depth to the application background.
 *
 * Features:
 * - 3 floating hexagons with staggered animations
 * - 2 floating bubbles (1 standard, 1 coral-colored)
 * - Automatic hiding on mobile devices for performance
 * - Positioned behind all content (z-index: 0)
 */

export function FloatingBackground() {
  return (
    <div className="hexagon-bg">
      {/* Hexagons */}
      <div className="hexagon hex-1" />
      <div className="hexagon hex-2" />
      <div className="hexagon hex-3" />

      {/* Bubbles */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2 bubble-coral" />
    </div>
  );
}
