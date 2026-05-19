import { MD3LightTheme, configureFonts, type MD3Theme } from "react-native-paper";
import { Platform } from "react-native";

// --- COLORS ---
const colors = {
  primary: "#263F69", // Travie Primary Blue
  onPrimary: "#FFFFFF",
  primaryContainer: "#D1E4FF",
  onPrimaryContainer: "#001D36",

  secondary: "#059669", // Emerald Green
  onSecondary: "#FFFFFF",
  secondaryContainer: "#A7F3D0",
  onSecondaryContainer: "#064E3B",

  tertiary: "#F59E0B", // Amber / Accent
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FEF3C7",
  onTertiaryContainer: "#451A03",

  error: "#DC2626",
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2",
  onErrorContainer: "#7F1D1D",

  background: "#F8FAFC", // Slate 50
  onBackground: "#0F172A", // Slate 900
  
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceVariant: "#E2E8F0", // Slate 200
  onSurfaceVariant: "#475569", // Slate 600

  outline: "#CBD5E1", // Slate 300
  outlineVariant: "#F1F5F9", // Slate 100

  elevation: {
    level0: "transparent",
    level1: "#F1F5F9",
    level2: "#E2E8F0",
    level3: "#CBD5E1",
    level4: "#94A3B8",
    level5: "#64748B",
  },
};

// --- TYPOGRAPHY ---
// Using default system fonts but strictly structured for a professional look.
const fontConfig = {
  displayLarge: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "700" as const,
    lineHeight: 64,
    fontSize: 57,
  },
  displayMedium: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "700" as const,
    lineHeight: 52,
    fontSize: 45,
  },
  displaySmall: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "700" as const,
    lineHeight: 44,
    fontSize: 36,
  },
  headlineLarge: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "700" as const,
    lineHeight: 40,
    fontSize: 32,
  },
  headlineMedium: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "600" as const,
    lineHeight: 36,
    fontSize: 28,
  },
  headlineSmall: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "600" as const,
    lineHeight: 32,
    fontSize: 24,
  },
  titleLarge: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0,
    fontWeight: "600" as const,
    lineHeight: 28,
    fontSize: 22,
  },
  titleMedium: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.15,
    fontWeight: "600" as const,
    lineHeight: 24,
    fontSize: 16,
  },
  titleSmall: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.1,
    fontWeight: "600" as const,
    lineHeight: 20,
    fontSize: 14,
  },
  labelLarge: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.1,
    fontWeight: "600" as const,
    lineHeight: 20,
    fontSize: 14,
  },
  labelMedium: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.5,
    fontWeight: "600" as const,
    lineHeight: 16,
    fontSize: 12,
  },
  labelSmall: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.5,
    fontWeight: "600" as const,
    lineHeight: 16,
    fontSize: 11,
  },
  bodyLarge: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.15,
    fontWeight: "400" as const,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.25,
    fontWeight: "400" as const,
    lineHeight: 20,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
    letterSpacing: 0.4,
    fontWeight: "400" as const,
    lineHeight: 16,
    fontSize: 12,
  },
};

// --- SPACING & SHADOWS ---
// Cross-platform compatible shadows
export const shadows = {
  light: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2, // Android
  },
  medium: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4, // Android
  },
  strong: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8, // Android
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
};

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 2, // Controls base roundness of Paper components
};

// Exporting DesignSystem for easy access to non-paper specific tokens
export const DesignSystem = {
  colors,
  shadows,
  spacing,
  borderRadius,
  typography: fontConfig,
};
