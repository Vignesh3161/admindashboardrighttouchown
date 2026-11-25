import React from "react";
import { Box, Flex, SimpleGrid, Skeleton, SkeletonCircle, VStack } from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Profile, Credentials, and Settings Forms.
 * Matches Profile.js, CredentialManagement, and Edit Modals.
 */
export default function FormSkeleton({ fields = 6, hasAvatar = true, ...rest }) {
  return (
    <Box
      bg="white"
      p={{ base: 4, md: 6 }}
      borderRadius="16px"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="xs"
      w="100%"
      {...rest}
    >
      {hasAvatar && (
        <Flex align="center" gap={4} pb={6} mb={6} borderBottom="1px solid" borderColor="gray.100">
          <SkeletonCircle size="70px" />
          <Box flex="1">
            <Skeleton height="18px" width="180px" borderRadius="4px" mb={2} />
            <Skeleton height="12px" width="120px" borderRadius="4px" />
          </Box>
        </Flex>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        {Array.from({ length: fields }).map((_, i) => (
          <VStack key={`form-skeleton-field-${i}`} align="stretch" spacing={2}>
            <Skeleton height="12px" width="30%" borderRadius="4px" />
            <Skeleton height="40px" width="100%" borderRadius="8px" />
          </VStack>
        ))}
      </SimpleGrid>

      <Flex justify="flex-end" gap={3} pt={4} borderTop="1px solid" borderColor="gray.100">
        <Skeleton height="36px" width="90px" borderRadius="8px" />
        <Skeleton height="36px" width="130px" borderRadius="8px" />
      </Flex>
    </Box>
  );
}
