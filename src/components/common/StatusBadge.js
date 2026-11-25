import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { Box, HStack } from "@chakra-ui/react";

export const STATUS_BADGE_PROPS = {
  px: 2.5,
  py: 1,
  fontSize: "2xs",
  fontWeight: "700",
  borderRadius: "8px",
  lineHeight: "1.2",
};

export const paymentStatusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "paid" || s === "completed" || s === "approved" || s === "active" || s === "operational")
    return "success";
  if (s === "pending" || s === "requested" || s === "under_review" || s === "in_progress")
    return "warning";
  if (s === "failed" || s === "rejected" || s === "cancelled" || s === "expired" || s === "disabled")
    return "danger";
  return "neutral";
};

export const reportStatusMeta = (status) => {
  const st = (status || "").toLowerCase();
  if (st === "resolved_refunded")
    return { colorScheme: "success", label: "Resolved (refunded)" };
  if (st === "resolved_no_refund")
    return { colorScheme: "neutral", label: "Resolved (no refund)" };
  if (st === "resolved") return { colorScheme: "success", label: "Resolved" };
  if (st === "under_review")
    return { colorScheme: "warning", label: "Under review" };
  if (st === "withdrawn")
    return { colorScheme: "neutral", label: "Withdrawn" };
  if (st === "expired") return { colorScheme: "danger", label: "Expired" };
  return { colorScheme: "warning", label: "Open" };
};

const SEMANTIC_THEMES = {
  success: {
    bg: "#ECFDF5",
    text: "#065F46",
    dot: "#10B981",
    border: "#A7F3D0",
  },
  warning: {
    bg: "#FFFBEB",
    text: "#92400E",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  danger: {
    bg: "#FEF2F2",
    text: "#991B1B",
    dot: "#EF4444",
    border: "#FECACA",
  },
  info: {
    bg: "#F0F9FF",
    text: "#075985",
    dot: "#0EA5E9",
    border: "#BAE6FD",
  },
  teal: {
    bg: "#F0FDFA",
    text: "#0F766E",
    dot: "#0D9488",
    border: "#99F6E4",
  },
  neutral: {
    bg: "#F8FAFC",
    text: "#334155",
    dot: "#64748B",
    border: "#E2E8F0",
  },
};

const COLOR_SCHEME_MAP = {
  green: "success",
  yellow: "warning",
  orange: "warning",
  red: "danger",
  blue: "info",
  cyan: "info",
  purple: "neutral",
  gray: "neutral",
  teal: "teal",
};

// Sentence case formatter
const toSentenceCase = (str) => {
  if (!str || typeof str !== "string") return str;
  const cleaned = str.replace(/_/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

const StatusBadge = forwardRef(function StatusBadge(props, ref) {
  const {
    preset,
    status,
    colorScheme,
    map,
    label,
    children,
    showDot = true,
    ...rest
  } = props;

  let resolvedScheme = colorScheme;
  let resolvedLabel = label !== undefined ? label : children;

  if (preset === "payment") {
    resolvedScheme = resolvedScheme || paymentStatusColor(status);
    if (resolvedLabel === undefined) resolvedLabel = status;
  } else if (preset === "report") {
    const meta = reportStatusMeta(status);
    resolvedScheme = resolvedScheme || meta.colorScheme;
    if (resolvedLabel === undefined) resolvedLabel = meta.label;
  } else if (typeof map === "function") {
    resolvedScheme = resolvedScheme || map(status);
    if (resolvedLabel === undefined) resolvedLabel = status;
  } else if (!resolvedScheme && status) {
    resolvedScheme = paymentStatusColor(status);
    if (resolvedLabel === undefined) resolvedLabel = status;
  }

  const normalizedScheme =
    COLOR_SCHEME_MAP[resolvedScheme] || resolvedScheme || "neutral";
  const theme = SEMANTIC_THEMES[normalizedScheme] || SEMANTIC_THEMES.neutral;
  const formattedText = toSentenceCase(resolvedLabel || "Unknown");

  return (
    <Box
      ref={ref}
      as="span"
      display="inline-flex"
      alignItems="center"
      px={2.5}
      py={0.5}
      borderRadius="9999px"
      bg={theme.bg}
      color={theme.text}
      border="1px solid"
      borderColor={theme.border}
      fontSize="11px"
      fontWeight="600"
      lineHeight="1.4"
      whiteSpace="nowrap"
      {...rest}
    >
      <HStack spacing={1.5} align="center">
        {showDot && (
          <Box
            as="span"
            boxSize="5px"
            borderRadius="full"
            bg={theme.dot}
            flexShrink={0}
          />
        )}
        <Box as="span">{formattedText}</Box>
      </HStack>
    </Box>
  );
});

StatusBadge.propTypes = {
  preset: PropTypes.oneOf(["payment", "report"]),
  status: PropTypes.string,
  colorScheme: PropTypes.string,
  map: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  showDot: PropTypes.bool,
};

export default StatusBadge;
