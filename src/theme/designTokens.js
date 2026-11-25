// src/theme/designTokens.js — Single Source of Truth for RightTouch Design Tokens
export const designTokens = {
  colors: {
    brand: {
      50: "#F0FDFA",
      100: "#CCFBF1",
      200: "#99F6E4",
      300: "#5EEAD4",
      400: "#2DD4BF",
      500: "#0F766E", // Primary Brand Teal
      600: "#0D9488",
      700: "#115E59",
      800: "#134E4A",
      900: "#042F2E",
    },
    slate: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    semantic: {
      success: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", dot: "#10B981" },
      warning: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", dot: "#F59E0B" },
      danger: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", dot: "#EF4444" },
      info: { bg: "#F0F9FF", text: "#075985", border: "#BAE6FD", dot: "#0EA5E9" },
      neutral: { bg: "#F8FAFC", text: "#334155", border: "#E2E8F0", dot: "#64748B" },
    },
  },
  typography: {
    fonts: {
      heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
    },
    fontSizes: {
      micro: "11px",
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "20px",
      xl: "28px",
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radii: {
    card: "12px",
    control: "8px",
    pill: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
    popover: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
  },
  borders: {
    subtle: "1px solid #E2E8F0",
    focus: "2px solid #0F766E",
  },
  layout: {
    sidebarWidth: "248px",
    sidebarCollapsedWidth: "72px",
    topbarHeight: "64px",
    maxContentWidth: "1440px",
  },
};
