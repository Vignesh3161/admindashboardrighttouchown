import React from "react";
import { Box, Flex, SimpleGrid, Skeleton, SkeletonCircle } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for top-level KPI Stats Cards.
 * Mirrors the geometry and layout of AdminStatsCards, KpiTile, and Summary metrics.
 */
export default function StatsGridSkeleton({
  count = 4,
  columns = { base: 1, sm: 2, lg: 4, xl: 4 },
  ...rest
}) {
  return (
    <SimpleGrid columns={columns} spacing={{ base: 3, md: 4 }} w="100%" {...rest}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={`stat-skeleton-${i}`}
          p={4}
          bg="white"
          borderRadius="16px"
          border="1px solid"
          borderColor="gray.100"
          boxShadow="xs"
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Skeleton height="14px" width="50%" borderRadius="4px" />
            <SkeletonCircle size="34px" />
          </Flex>
          <Skeleton height="28px" width="65%" borderRadius="6px" mb={2} />
          <Skeleton height="12px" width="80%" borderRadius="4px" />
        </Box>
      ))}
    </SimpleGrid>
  );
}
