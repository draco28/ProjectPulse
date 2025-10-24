'use client';

interface ThemePreviewProps {
  themeId: string;
  isActive: boolean;
}

/**
 * ThemePreview Component
 *
 * Shows a visual preview of each theme with representative colors
 * Used in the theme switcher dropdown
 */
export function ThemePreview({ themeId, isActive }: ThemePreviewProps) {
  const previews = {
    desert: (
      <div className="w-full h-20 rounded-lg overflow-hidden shadow-md">
        <div
          className="h-full flex items-center justify-center gap-2 p-4"
          style={{
            background: 'linear-gradient(135deg, #FAF9F6 0%, #F4F1EA 50%, #E6DAC8 100%)',
          }}
        >
          {/* Neumorphic card preview */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(250, 249, 246, 0.85)',
              boxShadow:
                '6px 6px 12px rgba(164, 141, 120, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.9)',
            }}
          >
            <div
              className="w-6 h-6 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #A48D78 0%, #8B7766 100%)',
              }}
            />
          </div>
          {/* Color swatches */}
          <div className="flex flex-col gap-1">
            <div className="w-8 h-2 rounded-full" style={{ background: '#A48D78' }} />
            <div className="w-8 h-2 rounded-full" style={{ background: '#CBB9A4' }} />
            <div className="w-8 h-2 rounded-full" style={{ background: '#E6DAC8' }} />
          </div>
        </div>
      </div>
    ),
    neon: (
      <div className="w-full h-20 rounded-lg overflow-hidden shadow-md bg-[#091221] flex items-center justify-center gap-3 p-4">
        {/* Neon glowing circles */}
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: '#fe0369',
            boxShadow: '0 0 15px rgba(254, 3, 105, 0.6)',
          }}
        />
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: '#0236a5',
            boxShadow: '0 0 15px rgba(2, 54, 165, 0.6)',
          }}
        />
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: '#0585c6',
            boxShadow: '0 0 15px rgba(5, 133, 198, 0.6)',
          }}
        />
      </div>
    ),
    earthy: (
      <div className="w-full h-20 rounded-lg overflow-hidden shadow-md bg-[#11120D] flex items-center justify-center gap-2 p-4">
        {/* Muted earth tone rectangles */}
        <div className="w-10 h-10 rounded-lg" style={{ background: '#565449' }} />
        <div className="w-10 h-10 rounded-lg" style={{ background: '#D8CFBC' }} />
        <div className="w-10 h-10 rounded-lg" style={{ background: '#6B6A5D' }} />
      </div>
    ),
    coral: (
      <div className="w-full h-20 rounded-lg overflow-hidden shadow-md bg-[#1A1A1A] flex items-center justify-center gap-3 p-4">
        {/* Coral neumorphic card */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #FF8B6A 0%, #E67759 100%)',
            boxShadow:
              '4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(60, 60, 60, 0.1)',
          }}
        >
          <div className="w-6 h-6 rounded bg-white/10" />
        </div>
        {/* Hexagon preview */}
        <div
          className="w-10 h-12 bg-[#2A2A2A]"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    ),
  };

  return (
    <div className="relative">
      {previews[themeId as keyof typeof previews] || null}
      {isActive && (
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      )}
    </div>
  );
}
