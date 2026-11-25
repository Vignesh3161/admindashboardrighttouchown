export const globalStyles = {
  colors: {
    gray: {
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
    brand: {
      50: "#F0FDFA",
      100: "#CCFBF1",
      200: "#99F6E4",
      300: "#5EEAD4",
      400: "#2DD4BF",
      500: "#0F766E", // Premium Primary Teal
      600: "#0D9488",
      700: "#115E59",
      800: "#134E4A",
      900: "#042F2E",
    },
    brandAlpha: {
      5: "rgba(15, 118, 110, 0.05)",
      10: "rgba(15, 118, 110, 0.10)",
      20: "rgba(15, 118, 110, 0.18)",
      30: "rgba(15, 118, 110, 0.28)",
      40: "rgba(15, 118, 110, 0.38)",
      50: "rgba(15, 118, 110, 0.48)",
    },
    navy: {
      50: "#d0dcfb",
      100: "#aac0fe",
      200: "#a3b9f8",
      300: "#728fea",
      400: "#3652ba",
      500: "#1b3bbb",
      600: "#24388a",
      700: "#1b254b",
      800: "#111c44",
      900: "#0b1437",
    },
  },
  styles: {
    global: (props) => ({
      html: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
        fontFeatureSettings: "'cv02', 'cv03', 'cv04', 'cv11', 'tnum'",
      },
      body: {
        overflowX: "hidden",
        bg: props.colorMode === "dark" ? "#0F172A" : "#F8FAFC",
        color: props.colorMode === "dark" ? "#F8FAFC" : "#0F172A",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
        fontFeatureSettings: "'cv02', 'cv03', 'cv04', 'cv11', 'tnum'",
        letterSpacing: "-0.01em",
      },
      ":focus-visible": {
        outline: "2px solid #0F766E",
        outlineOffset: "2px",
      },
      "table tr, table tbody tr, .chakra-table tr, .chakra-table tbody tr": {
        transition: "background 0.15s ease",
      },
      // Bespoke Capsule Scrollbar (Overall Application)
      "*": {
        scrollbarWidth: "thin",
        scrollbarColor: "#FE2934 #F1F5F9",
      },
      "*::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "*::-webkit-scrollbar-track": {
        background: props.colorMode === "dark" ? "#1E293B" : "#F1F5F9",
        borderRadius: "9999px",
        margin: "6px 0",
      },
      "*::-webkit-scrollbar-thumb": {
        background: "linear-gradient(180deg, #FE2934 0%, #FF5252 60%, rgba(254, 41, 52, 0.25) 100%)",
        borderRadius: "9999px",
        border: "2px solid transparent",
        backgroundClip: "content-box",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      "*::-webkit-scrollbar-thumb:hover": {
        background: "linear-gradient(180deg, #E02424 0%, #FE2934 70%, rgba(224, 36, 36, 0.45) 100%)",
        border: "2px solid transparent",
        backgroundClip: "content-box",
        boxShadow: "0 0 10px rgba(254, 41, 52, 0.5)",
      },
    }),
  },
};
