import React from "react";
import { Box, Flex, SimpleGrid, Skeleton, SkeletonCircle, HStack } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Product & Service Catalog Grids.
 * Matches ProductManagement, ServiceManagement, and Booking cards.
 */
export default function CardGridSkeleton({
  count = 8,
  columns = { base: 1, sm: 2, md: 3, lg: 4 },
  ...rest
}) {
  return (
    <SimpleGrid columns={columns} spacing={4} w="100%" {...rest}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={`card-grid-skeleton-${i}`}
          bg="white"
          borderRadius="16px"
          border="1px solid"
          borderColor="gray.100"
          overflow="hidden"
          boxShadow="xs"
        >
          {/* Card Image Banner */}
          <Skeleton height="150px" width="100%" />

          <Box p={4}>
            <HStack justify="space-between" mb={2}>
              <Skeleton height="18px" width="70px" borderRadius="full" />
              <SkeletonCircle size="20px" />
            </HStack>

            <Skeleton height="16px" width="85%" borderRadius="4px" mb={2} />
            <Skeleton height="12px" width="55%" borderRadius="4px" mb={4} />

            <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor="gray.100">
              <Skeleton height="20px" width="80px" borderRadius="4px" />
              <Skeleton height="30px" width="75px" borderRadius="8px" />
            </Flex>
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );
}
