/**
 * Theme Definitions for ProjectPulse
 *
 * Extracted from mockup HTML files:
 * - dashboard-desert-stone-neumorphic.html
 * - dashboard-neon-vibes-theme.html
 * - dashboard-earthy-theme.html
 * - dashboard-dark-neumorphic-coral.html
 */

export type ThemeId = 'desert' | 'neon' | 'earthy' | 'coral';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background layers (4 levels for depth)
  bg: {
    darkest: string;  // Base background
    dark: string;     // Sidebar background
    medium: string;   // Card background
    light: string;    // Hover state background
  };
  // Accent colors (brand colors)
  accent: {
    primary: string;   // Main brand color
    secondary: string; // Secondary accent
    tertiary: string;  // Tertiary accent
  };
  // Text colors (4 levels for hierarchy)
  text: {
    primary: string;   // Main text
    secondary: string; // Secondary text
    tertiary: string;  // Tertiary text
    muted: string;     // Muted/disabled text
  };
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Priority colors (for issue tracker)
  priority: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
}

export interface ThemeEffects {
  // Box shadows
  shadow: {
    neuFloat?: string;  // Neumorphic floating shadow
    neuInset?: string;  // Neumorphic pressed shadow
    neuDark?: string;   // Dark neumorphic shadow
    regular: string;    // Standard shadow
  };
  // Glow effects
  glow: {
    primary: string;
    secondary: string;
    tertiary?: string;
  };
  // Gradients
  gradient: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  mode: ThemeMode;
  colors: ThemeColors;
  effects: ThemeEffects;
}

// ============================================================================
// DESERT STONE NEUMORPHIC (DEFAULT - LIGHT THEME)
// ============================================================================

const desertTheme: ThemeDefinition = {
  id: 'desert',
  name: 'Desert Stone',
  description: 'Soft neumorphic light theme with warm sandy tones',
  mode: 'light',
  colors: {
    bg: {
      darkest: '#FAF9F6',  // Feather (lightest)
      dark: '#F4F1EA',     // Mist
      medium: '#E6DAC8',   // Oat
      light: '#CBB9A4',    // Sandstone
    },
    accent: {
      primary: '#A48D78',   // Desert
      secondary: '#8B7766', // Desert Dark
      tertiary: '#6B5D52',  // Desert Deep
    },
    text: {
      primary: '#6B5D52',   // Desert Deep (dark on light)
      secondary: '#8B7766', // Desert Dark
      tertiary: '#A48D78',  // Desert
      muted: '#CBB9A4',     // Sandstone
    },
    semantic: {
      success: '#9BA785',   // Sage green
      warning: '#B8956A',   // Bronze
      error: '#C17B5C',     // Terracotta
      info: '#8B7766',      // Desert Dark
    },
    priority: {
      critical: '#C17B5C',  // Terracotta
      high: '#B8956A',      // Bronze
      medium: '#9BA785',    // Sage
      low: '#CBB9A4',       // Sandstone
    },
  },
  effects: {
    shadow: {
      neuFloat: '12px 12px 24px rgba(164, 141, 120, 0.25), -12px -12px 24px rgba(255, 255, 255, 0.9), inset 2px 2px 4px rgba(255, 255, 255, 0.5)',
      neuInset: 'inset 4px 4px 8px rgba(164, 141, 120, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
      neuDark: '10px 10px 20px rgba(107, 93, 82, 0.4), -10px -10px 20px rgba(203, 185, 164, 0.3), inset 2px 2px 4px rgba(255, 255, 255, 0.1)',
      regular: '0 8px 32px 0 rgba(164, 141, 120, 0.2)',
    },
    glow: {
      primary: '0 0 20px rgba(164, 141, 120, 0.4)',
      secondary: '0 0 40px rgba(164, 141, 120, 0.8)',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #A48D78 0%, #8B7766 100%)',
      secondary: 'linear-gradient(135deg, #CBB9A4 0%, #E6DAC8 100%)',
      background: 'linear-gradient(135deg, #FAF9F6 0%, #F4F1EA 50%, #E6DAC8 100%)',
    },
  },
};

// ============================================================================
// NEON VIBES (DARK THEME)
// ============================================================================

const neonTheme: ThemeDefinition = {
  id: 'neon',
  name: 'Neon Vibes',
  description: 'Vibrant neon dark theme with electric colors',
  mode: 'dark',
  colors: {
    bg: {
      darkest: '#091221',   // Midnight
      dark: '#0d1929',      // Sidebar
      medium: '#14203a',    // Cards (lighter than sidebar)
      light: '#1a2a4a',     // Hover state
    },
    accent: {
      primary: '#fe0369',   // Hot Pink
      secondary: '#0236a5', // Royal Blue
      tertiary: '#0585c6',  // Cyan
    },
    text: {
      primary: '#ffffff',   // Pure white
      secondary: '#8fa8c4', // Light blue-gray
      tertiary: '#6a8cb8',  // Medium blue-gray
      muted: '#4a6c9c',     // Dark blue-gray
    },
    semantic: {
      success: '#00e676',   // Bright green
      warning: '#ffea00',   // Bright yellow
      error: '#ff1744',     // Bright red
      info: '#0585c6',      // Cyan
    },
    priority: {
      critical: '#fe0369',  // Hot Pink
      high: '#ffea00',      // Bright Yellow
      medium: '#0585c6',    // Cyan
      low: '#8fa8c4',       // Light blue-gray
    },
  },
  effects: {
    shadow: {
      regular: '0 8px 20px rgba(0, 0, 0, 0.4)',
    },
    glow: {
      primary: '0 0 20px rgba(254, 3, 105, 0.4)',
      secondary: '0 0 30px rgba(254, 3, 105, 0.6)',
      tertiary: '0 0 20px rgba(5, 133, 198, 0.4)',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #0236a5 0%, #fe0369 50%, #0585c6 100%)',
      secondary: 'linear-gradient(135deg, #fe0369 0%, #0236a5 100%)',
      background: '#091221', // Solid dark background
    },
  },
};

// ============================================================================
// EARTHY (DARK THEME)
// ============================================================================

const earthyTheme: ThemeDefinition = {
  id: 'earthy',
  name: 'Earthy',
  description: 'Muted earth tones with natural, grounded aesthetic',
  mode: 'dark',
  colors: {
    bg: {
      darkest: '#11120D',   // Smoky
      dark: '#1A1B15',      // Sidebar (slightly lighter)
      medium: '#26271F',    // Cards
      light: '#3E3D35',     // Olive Dark (hover)
    },
    accent: {
      primary: '#D8CFBC',   // Bone
      secondary: '#6B6A5D', // Olive Light
      tertiary: '#565449',  // Olive
    },
    text: {
      primary: '#FFFBF4',   // Floral (brightest)
      secondary: '#D8CFBC', // Bone
      tertiary: '#6B6A5D',  // Olive Light
      muted: '#565449',     // Olive
    },
    semantic: {
      success: '#8B9775',   // Sage green
      warning: '#B8956A',   // Bronze
      error: '#C17B5C',     // Terracotta
      info: '#6B6A5D',      // Olive Light
    },
    priority: {
      critical: '#C17B5C',  // Terracotta
      high: '#B8956A',      // Bronze (yellow-600)
      medium: '#8B9775',    // Sage
      low: '#6B6A5D',       // Olive Light
    },
  },
  effects: {
    shadow: {
      regular: '0 8px 20px rgba(0, 0, 0, 0.4)',
    },
    glow: {
      primary: '0 0 10px rgba(216, 207, 188, 0.3)',
      secondary: '0 0 25px rgba(216, 207, 188, 0.5)',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #565449 0%, #6B6A5D 50%, #D8CFBC 100%)',
      secondary: 'linear-gradient(135deg, #D8CFBC 0%, #FFFBF4 100%)',
      background: '#11120D', // Solid dark background
    },
  },
};

// ============================================================================
// DARK NEUMORPHIC CORAL (DARK THEME)
// ============================================================================

const coralTheme: ThemeDefinition = {
  id: 'coral',
  name: 'Dark Neumorphic Coral',
  description: 'Modern dark theme with coral accent and geometric elements',
  mode: 'dark',
  colors: {
    bg: {
      darkest: '#1A1A1A',   // Dark
      dark: '#242424',      // Dark Lighter (sidebar)
      medium: '#2A2A2A',    // Dark Card
      light: '#303030',     // Hover state
    },
    accent: {
      primary: '#FF8B6A',   // Coral
      secondary: '#FFB299', // Coral Light
      tertiary: '#E67759',  // Coral Dark
    },
    text: {
      primary: '#E5E5E5',   // Light gray
      secondary: '#A5A5A5', // Slate Light
      tertiary: '#8B8B8B',  // Slate
      muted: '#6B6B6B',     // Dark Slate
    },
    semantic: {
      success: '#4CAF50',   // Green
      warning: '#FFC107',   // Amber
      error: '#F44336',     // Red
      info: '#2196F3',      // Blue
    },
    priority: {
      critical: '#FF8B6A',  // Coral
      high: '#FFC107',      // Amber
      medium: '#2196F3',    // Blue
      low: '#8B8B8B',       // Slate
    },
  },
  effects: {
    shadow: {
      neuFloat: '8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(60, 60, 60, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      neuInset: 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 6px rgba(60, 60, 60, 0.1)',
      neuDark: '12px 12px 24px rgba(0, 0, 0, 0.7), -12px -12px 24px rgba(60, 60, 60, 0.15)',
      regular: '0 8px 20px rgba(0, 0, 0, 0.4)',
    },
    glow: {
      primary: '0 0 30px rgba(255, 139, 106, 0.4)',
      secondary: '0 8px 20px rgba(255, 139, 106, 0.3)',
      tertiary: '0 12px 30px rgba(255, 139, 106, 0.5)',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #FF8B6A 0%, #E67759 100%)',
      secondary: 'linear-gradient(135deg, #FFB299 0%, #FF8B6A 100%)',
      background: '#1A1A1A', // Solid dark background
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const themeDefinitions: Record<ThemeId, ThemeDefinition> = {
  desert: desertTheme,
  neon: neonTheme,
  earthy: earthyTheme,
  coral: coralTheme,
};

export const defaultTheme: ThemeId = 'desert';

// Helper function to get theme by ID
export function getTheme(id: ThemeId): ThemeDefinition {
  return themeDefinitions[id];
}

// Helper function to get all theme IDs
export function getAllThemeIds(): ThemeId[] {
  return Object.keys(themeDefinitions) as ThemeId[];
}

// Helper function to get all themes as array
export function getAllThemes(): ThemeDefinition[] {
  return Object.values(themeDefinitions);
}
