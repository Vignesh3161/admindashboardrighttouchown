/**
 * Enhanced typography font size scale for RightTouch Admin Dashboard.
 * Lifts micro-text (previously 7px - 10px) to comfortably legible sizes (11px - 13px)
 * across the entire application without breaking layout boundaries.
 */
export const fontSizes = {
  "3xs": "0.6875rem", // 11px (up from ~7.2px, prevents eye strain on micro labels)
  "2xs": "0.75rem",   // 12px (up from 10px, clear badges, pill tags, and subtext)
  xs: "0.8125rem",    // 13px (up from 12px, crisp secondary text and table values)
  sm: "0.875rem",     // 14px (standard readable body size)
  md: "0.9375rem",    // 15px (comfortable UI text and form inputs)
  lg: "1.125rem",     // 18px (card headers and section titles)
  xl: "1.25rem",      // 20px (prominent metrics and modal headers)
  "2xl": "1.5rem",    // 24px (KPI summary values)
  "3xl": "1.875rem",  // 30px
  "4xl": "2.25rem",   // 36px
};

export default fontSizes;
