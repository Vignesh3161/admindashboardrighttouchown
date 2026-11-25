import React from "react";
import { Box, Flex, HStack, Skeleton, SkeletonCircle, VStack } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Slide-Over Drawers (Technician 360, Booking Details).
 * Matches TechnicianDetailsDrawer and BookingDetailDrawer.
 */
export default function DrawerSkeleton({ ...rest }) {
  return (
    <VStack spacing={4} align="stretch" w="100%" p={4} {...rest}>
      {/* Header Profile Card Skeleton */}
      <Box p={4} bg="gray.50" borderRadius="16px" border="1px solid" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={3}>
            <SkeletonCircle size="52px" />
            <Box>
              <Skeleton height="18px" width="160px" borderRadius="4px" mb={2} />
              <Skeleton height="12px" width="100px" borderRadius="4px" />
            </Box>
          </HStack>
          <Skeleton height="24px" width="70px" borderRadius="full" />
        </Flex>
        <HStack spacing={2} flexWrap="wrap">
          <Skeleton height="22px" width="110px" borderRadius="full" />
          <Skeleton height="22px" width="110px" borderRadius="full" />
          <Skeleton height="22px" width="110px" borderRadius="full" />
        </HStack>
      </Box>

      {/* Tabs Header Skeleton */}
      <HStack spacing={2} pb={2} borderBottom="2px solid" borderColor="gray.100">
        <Skeleton height="32px" width="130px" borderRadius="8px" />
        <Skeleton height="32px" width="140px" borderRadius="8px" />
        <Skeleton height="32px" width="140px" borderRadius="8px" />
      </HStack>

      {/* Section 1 Card Skeleton */}
      <Box p={4} bg="white" borderRadius="14px" border="1px solid" borderColor="gray.100">
        <Skeleton height="16px" width="40%" borderRadius="4px" mb={3} />
        <VStack spacing={3} align="stretch">
          <Skeleton height="14px" width="90%" borderRadius="4px" />
          <Skeleton height="14px" width="75%" borderRadius="4px" />
          <Skeleton height="14px" width="60%" borderRadius="4px" />
        </VStack>
      </Box>

      {/* Section 2 Card Skeleton */}
      <Box p={4} bg="white" borderRadius="14px" border="1px solid" borderColor="gray.100">
        <Skeleton height="16px" width="50%" borderRadius="4px" mb={3} />
        <VStack spacing={3} align="stretch">
          <Skeleton height="14px" width="85%" borderRadius="4px" />
          <Skeleton height="14px" width="70%" borderRadius="4px" />
        </VStack>
      </Box>
    </VStack>
  );
}
