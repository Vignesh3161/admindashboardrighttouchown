import React from "react";
import { Flex, Skeleton } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Page Toolbars, Search Bars, and Filter Dropdowns.
 * Matches AdminManagement, ServiceManagement, CityZones, and UserManagement filter layouts.
 */
export default function FilterBarSkeleton({
  filterCount = 3,
  hasSearch = true,
  hasAction = true,
  ...rest
}) {
  return (
    <Flex
      bg="white"
      p={3.5}
      borderRadius="14px"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="xs"
      gap={3}
      flexWrap="wrap"
      align="center"
      w="100%"
      {...rest}
    >
      {hasSearch && (
        <Skeleton height="36px" flex="1" minW={{ base: "100%", md: "240px" }} borderRadius="8px" />
      )}
      {Array.from({ length: filterCount }).map((_, i) => (
        <Skeleton
          key={`filter-skeleton-${i}`}
          height="36px"
          w={{ base: "48%", sm: "140px" }}
          borderRadius="8px"
        />
      ))}
      {hasAction && (
        <Skeleton height="36px" width={{ base: "100%", sm: "110px" }} borderRadius="8px" ml="auto" />
      )}
    </Flex>
  );
}
