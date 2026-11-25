import React from "react";
import { Box, Flex, HStack, Skeleton, VStack } from "@chakra-ui/react";
import StatsGridSkeleton from "./StatsGridSkeleton";
import FilterBarSkeleton from "./FilterBarSkeleton";
import TableSkeleton from "./TableSkeleton";
import CardGridSkeleton from "./CardGridSkeleton";
import ChartSkeleton from "./ChartSkeleton";
import FormSkeleton from "./FormSkeleton";

/**
 * Universal Page Skeleton.
 * Provides instant, layout-accurate skeleton states for any admin view.
 *
 * Types:
 * - 'table': Stats + Filter Bar + Table (AdminManagement, UserManagement, Finance, etc.)
 * - 'cards': Stats + Filter Bar + Card Grid (ProductManagement, ServiceManagement)
 * - 'dashboard': Top Stats + Charts Grid + Recent Activity (Dashboard, Insights, Reports)
 * - 'form': Profile Banner + 2-Column Form Fields (Profile, Credentials)
 * - 'tabs': Tab Bar + Content Skeleton (CityZones, Multi-tab Views)
 */
export default function PageSkeleton({
  type = "table",
  hasStats = true,
  statsCount = 4,
  hasFilter = true,
  filterCount = 3,
  columns = 6,
  rows = 6,
  cardCount = 8,
  pt = { base: "120px", md: "85px" },
  px = { base: 4, md: 6 },
  ...rest
}) {
  return (
    <Box pt={pt} px={px} pb={8} w="100%" maxW="100%" aria-busy="true" aria-label="Loading page content" {...rest}>
      <VStack spacing={5} align="stretch" w="100%">
        {/* Optional Page Title Placeholder */}
        <Flex justify="space-between" align="center" mb={1}>
          <Box>
            <Skeleton height="24px" width={{ base: "160px", md: "220px" }} borderRadius="6px" mb={2} />
            <Skeleton height="14px" width={{ base: "110px", md: "160px" }} borderRadius="4px" />
          </Box>
          <HStack spacing={3}>
            <Skeleton height="36px" width="36px" borderRadius="8px" />
            <Skeleton height="36px" width="100px" borderRadius="8px" />
          </HStack>
        </Flex>

        {/* Top Stats Cards */}
        {hasStats && type !== "form" && (
          <StatsGridSkeleton count={statsCount} />
        )}

        {/* Tab Navigation Placeholder if type === 'tabs' */}
        {type === "tabs" && (
          <HStack spacing={2} pb={2} borderBottom="2px solid" borderColor="gray.100" overflowX="auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`tab-skel-${i}`} height="36px" width="130px" borderRadius="8px" flexShrink={0} />
            ))}
          </HStack>
        )}

        {/* Filter Toolbar */}
        {hasFilter && (type === "table" || type === "cards" || type === "tabs") && (
          <FilterBarSkeleton filterCount={filterCount} />
        )}

        {/* Content Body Based on Type */}
        {type === "table" && (
          <TableSkeleton rows={rows} columns={columns} />
        )}

        {type === "cards" && (
          <CardGridSkeleton count={cardCount} />
        )}

        {type === "dashboard" && (
          <VStack spacing={5} align="stretch">
            <Flex gap={5} direction={{ base: "column", xl: "row" }}>
              <Box flex={{ base: "1", xl: "2" }}>
                <ChartSkeleton height="260px" />
              </Box>
              <Box flex="1">
                <ChartSkeleton height="260px" />
              </Box>
            </Flex>
            <TableSkeleton rows={5} columns={5} />
          </VStack>
        )}

        {type === "form" && (
          <FormSkeleton fields={6} hasAvatar={true} />
        )}

        {type === "tabs" && (
          <TableSkeleton rows={rows} columns={columns} />
        )}
      </VStack>
    </Box>
  );
}
