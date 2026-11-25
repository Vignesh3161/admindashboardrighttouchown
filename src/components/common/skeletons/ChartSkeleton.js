import React from "react";
import { Box, Flex, HStack, Skeleton } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Analytical Charts and Visual Graphs.
 * Matches Dashboard.js revenue trends, mix charts, reports, and insights.
 */
export default function ChartSkeleton({ height = "280px", ...rest }) {
  const barHeights = ["45%", "65%", "85%", "55%", "90%", "70%", "80%", "60%", "95%", "75%", "50%", "85%"];

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="16px"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="xs"
      w="100%"
      {...rest}
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Box w="40%">
          <Skeleton height="16px" width="70%" borderRadius="4px" mb={2} />
          <Skeleton height="12px" width="90%" borderRadius="4px" />
        </Box>
        <Skeleton height="28px" width="100px" borderRadius="8px" />
      </Flex>

      {/* Simulated Chart Bars */}
      <Flex h={height} align="flex-end" justify="space-between" px={2} pt={4}>
        {barHeights.map((h, i) => (
          <Box
            key={`bar-skeleton-${i}`}
            h={h}
            w={{ base: "14px", md: "24px" }}
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
          >
            <Skeleton h="100%" w="100%" borderRadius="6px 6px 0 0" />
          </Box>
        ))}
      </Flex>

      {/* Simulated X-Axis Labels */}
      <HStack justify="space-between" mt={3} px={1}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`lbl-skeleton-${i}`} height="10px" width="28px" borderRadius="3px" />
        ))}
      </HStack>
    </Box>
  );
}
