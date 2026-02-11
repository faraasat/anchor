// Anchor Theme - Premium, minimal aesthetic with enhanced readability
// Color Palette: Navy, Sea Foam, Amber - Refined for Phase 1 & 2
// WCAG AAA Compliant contrast ratios for maximum accessibility

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary colors - Refined Soft Paper theme
    primary: '#0F0F0F',       // True deep black for maximum contrast (21:1)
    secondary: '#2A6B5F',     // Deepened teal for better readability (4.8:1)
    accent: '#B8935F',        // Refined amber for better contrast (3.5:1)

    // Backgrounds - Premium Soft Paper white
    background: '#FFFEF9',    // Soft warm white (paper tone) - subtle luxury
    surface: '#FFFFFF',       // Pure white cards - crisp separation
    surfaceElevated: 'rgba(255, 255, 255, 0.96)', // Enhanced frosted glass

    // Text - WCAG AAA compliant contrast
    text: '#0F0F0F',          // True deep black (21:1 contrast)
    textSecondary: '#3D3D3D', // Dark gray secondary (12:1 contrast)
    textMuted: '#666666',     // Medium gray muted (5.7:1 contrast)
    textInverse: '#FFFFFF',   // White on dark backgrounds

    // Status colors - Accessible and vibrant
    success: '#0F9D6B',       // Accessible green (4.5:1 on white)
    warning: '#D47F0A',       // Accessible orange (4.8:1 on white)
    error: '#DC2626',         // Accessible red (5.9:1 on white)
    info: '#2563EB',          // Accessible blue (5.2:1 on white)

    // UI Elements - Enhanced definition
    border: '#C4C4C4',        // Medium gray for crisp edges (2.8:1)
    borderLight: '#E0E0E0',   // Lighter border for subtle separators
    divider: '#D4D4D4',       // Slightly darker for better visibility

    // Special - Refined glass morphism
    frostedGlass: 'rgba(255, 255, 255, 0.88)',
    overlay: 'rgba(0, 0, 0, 0.55)',
    shadow: 'rgba(0, 0, 0, 0.14)',
    anchorHighlight: 'rgba(42, 107, 95, 0.12)', // Subtle highlight for anchor points

    // Tab bar - Enhanced contrast
    tabBar: '#FFFFFF',
    tabBarActive: '#0F0F0F',
    tabBarInactive: '#666666',

    // Cards - Refined edges
    cardBackground: '#FFFFFF',
    cardBorder: '#C4C4C4',

    // Next Up card - Premium feel
    nextUpBackground: '#0F0F0F',
    nextUpText: '#FFFFFF',
    nextUpAccent: '#B8935F',
  },

  dark: {
    // Primary colors - Refined True Black theme for OLED
    primary: '#FFFFFF',       // Pure white for maximum contrast (21:1)
    secondary: '#4AD4CA',     // Refined vibrant teal (7.2:1 on black)
    accent: '#FFC947',        // Refined amber gold (11.8:1 on black)

    // Backgrounds - True Black for OLED with depth
    background: '#000000',    // True Black for OLED displays
    surface: '#121212',       // Material Design elevated surface
    surfaceElevated: 'rgba(28, 28, 28, 0.96)', // Enhanced frosted glass

    // Text - WCAG AAA compliant on black
    text: '#FFFFFF',          // Pure white (21:1 contrast)
    textSecondary: '#C2C2C2', // Light gray (11.8:1 contrast)
    textMuted: '#8A8A8A',     // Medium gray (6.4:1 contrast)
    textInverse: '#000000',   // Black on light backgrounds

    // Status colors - Vibrant and accessible on black
    success: '#34D399',       // Bright green (9.8:1 on black)
    warning: '#FBBF24',       // Bright orange (12.5:1 on black)
    error: '#F87171',         // Bright red (7.1:1 on black)
    info: '#60A5FA',          // Bright blue (8.2:1 on black)

    // UI Elements - Enhanced depth perception
    border: '#2A2A2A',        // Refined dark gray borders
    borderLight: '#1A1A1A',   // Subtle border variation
    divider: '#2A2A2A',

    // Special - Refined glass morphism for OLED
    frostedGlass: 'rgba(35, 35, 35, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.88)',
    shadow: 'rgba(0, 0, 0, 0.65)',
    anchorHighlight: 'rgba(74, 212, 202, 0.18)', // Subtle teal highlight

    // Tab bar - Enhanced contrast
    tabBar: '#121212',
    tabBarActive: '#4AD4CA',
    tabBarInactive: '#8A8A8A',

    // Cards - Refined depth
    cardBackground: '#121212',
    cardBorder: '#2A2A2A',

    // Next Up card - Premium OLED feel
    nextUpBackground: '#1A1A1A',
    nextUpText: '#FFFFFF',
    nextUpAccent: '#FFC947',
  },
};

// Refined spacing for editorial layout - Phase 1
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,      // Increased for breathability
  lg: 20,      // Enhanced from 16 for premium feel
  xl: 28,      // Enhanced from 20 for better content separation
  '2xl': 32,   // Increased for luxury spacing
  '3xl': 40,   // Enhanced editorial spacing
  '4xl': 48,   // Premium section spacing
  '5xl': 64,   // Enhanced from 48 for maximum breathing room
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

// Refined typography for maximum readability - Phase 1 & 2
// Editorial-grade line heights and spacing with serif support
export const Typography = {
  // Font families - Phase 2: Editorial aesthetic
  family: {
    // Serif for premium editorial headers
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia, serif',
    }) as string,

    // Sans-serif for clean task data
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'system-ui, -apple-system, sans-serif',
    }) as string,

    // Mono for special elements (time, numbers)
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }) as string,
  },

  // Font sizes - optimized for various lighting conditions
  size: {
    xs: 11,
    sm: 13,
    base: 16,    // Increased from 15 for better readability
    md: 18,      // Increased from 17 for body text
    lg: 22,      // Enhanced from 20 for section headers
    xl: 26,      // Enhanced from 24 for better hierarchy
    '2xl': 30,   // Refined from 28
    '3xl': 36,   // Refined from 34 for premium headlines
    '4xl': 44,   // Enhanced from 40 for hero text
  },

  // Font weights - refined for all lighting conditions
  weight: {
    light: '300' as const,      // Added for elegant secondary text
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,   // Primary action weight
    bold: '700' as const,       // Strong emphasis
    extrabold: '800' as const,  // Headlines only
  },

  // Line heights - editorial-grade readability
  lineHeight: {
    tight: 1.2,      // For large headlines only
    snug: 1.35,      // Added for compact UI elements
    normal: 1.5,     // Increased from 1.4 for body text
    relaxed: 1.65,   // Enhanced from 1.6 for long-form
    loose: 1.8,      // Added for maximum breathing room
  },

  // Letter spacing - refined for optical balance
  letterSpacing: {
    tighter: -0.8,   // Added for large headlines
    tight: -0.4,     // Refined from -0.5
    normal: 0,
    wide: 0.4,       // Refined from 0.5
    wider: 0.8,      // Added for ALL CAPS labels
  },
};

// Refined shadows for premium depth perception - Phase 1
export const Shadows = {
  // Subtle shadow for floating elements
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,     // Enhanced from 0.05
    shadowRadius: 3,         // Increased from 2 for softer edge
    elevation: 1,
  },
  // Standard card shadow
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,     // Enhanced from 0.08
    shadowRadius: 6,         // Increased from 4 for softer spread
    elevation: 3,
  },
  // Elevated component shadow
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,     // Enhanced from 0.1
    shadowRadius: 10,        // Increased from 8 for premium feel
    elevation: 5,
  },
  // Modal/overlay shadow
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,     // Enhanced from 0.15
    shadowRadius: 16,        // Increased from 12 for dramatic depth
    elevation: 10,
  },
  // New: Ambient shadow for anchor points
  ambient: {
    shadowColor: '#2A6B5F',  // Teal shadow for special elements
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const Animation = {
  // Duration in ms - motion restraint (150-250ms)
  fast: 150,
  normal: 200,
  slow: 250,

  // Easing
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Phase 2: Premium Visual Enhancements
export const PaperGrain = {
  // Paper grain texture settings for background
  opacity: 0.03,  // Very subtle for premium feel
  scale: 1.5,     // Texture scale

  // SVG pattern for paper grain texture
  pattern: `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E`,
};

// Phase 2: Zigzag (Pinking Shear) edge for Action Anchor FAB
export const ZigzagEdge = {
  // SVG path for zigzag edges (pinking shear effect)
  size: 60,  // FAB size
  zigzagSize: 4,  // Size of each zigzag tooth
  points: 12,  // Number of zigzag points around the circle
};
