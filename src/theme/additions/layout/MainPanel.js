const MainPanel = {
  baseStyle: {
    float: "none",
    maxWidth: "100%",
    overflow: "auto",
    position: "relative",
    maxHeight: "100%",
    transition: "margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "margin-left, width",
  },
  variants: {
    main: () => ({
      float: "none",
    }),
    rtl: () => ({
      float: "none",
    }),
  },
  defaultProps: {
    variant: "main",
  },
};

export const MainPanelComponent = {
  components: {
    MainPanel,
  },
};
