import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  SkeletonCircle,
  HStack,
} from "@chakra-ui/react";

/**
 * High-fidelity Skeleton for Tables.
 * Matches DataTable.js and custom tables across Admin, Products, Services, and Bookings.
 */
export default function TableSkeleton({
  rows = 6,
  columns = 6,
  hasAvatar = true,
  hasHeader = true,
  ...rest
}) {
  const staggeredWidths = ["75%", "55%", "85%", "45%", "65%", "90%"];

  return (
    <Box
      bg="white"
      borderRadius="14px"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
      boxShadow="xs"
      w="100%"
      {...rest}
    >
      <Table variant="simple" size="sm">
        {hasHeader && (
          <Thead bg="gray.50">
            <Tr>
              {Array.from({ length: columns }).map((_, i) => (
                <Th key={`th-skeleton-${i}`} py={3.5} borderColor="gray.100">
                  <Skeleton height="12px" width="60%" borderRadius="4px" />
                </Th>
              ))}
            </Tr>
          </Thead>
        )}
        <Tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <Tr key={`tr-skeleton-${rowIdx}`} borderBottom="1px solid" borderColor="gray.100">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Td key={`td-skeleton-${rowIdx}-${colIdx}`} py={3.5}>
                  {colIdx === 0 && hasAvatar ? (
                    <HStack spacing={3}>
                      <SkeletonCircle size="30px" flexShrink={0} />
                      <Box flex="1">
                        <Skeleton height="12px" width="70%" borderRadius="4px" mb={1.5} />
                        <Skeleton height="10px" width="45%" borderRadius="4px" />
                      </Box>
                    </HStack>
                  ) : colIdx === columns - 1 ? (
                    <HStack spacing={2} justify="flex-end">
                      <Skeleton height="24px" width="24px" borderRadius="6px" />
                      <Skeleton height="24px" width="24px" borderRadius="6px" />
                    </HStack>
                  ) : colIdx === columns - 2 ? (
                    <Skeleton height="20px" width="65px" borderRadius="full" mx="auto" />
                  ) : (
                    <Skeleton
                      height="12px"
                      width={staggeredWidths[(rowIdx + colIdx) % staggeredWidths.length]}
                      borderRadius="4px"
                    />
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
