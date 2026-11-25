import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Text,
  Skeleton,
  Icon,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaInbox, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import TablePagination from "./TablePagination";

const scrollbarStyles = {
  "&::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "transparent",
    borderRadius: "3px",
    transition: "background 0.3s ease",
  },
  "&:hover::-webkit-scrollbar-thumb": {
    background: "#cbd5e1",
  },
  "&:hover::-webkit-scrollbar-thumb:hover": {
    background: "#94a3b8",
  },
};

const TH_BASE = {
  bg: "gray.50",
  color: "gray.500",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  py: 3,
  px: 4,
  whiteSpace: "nowrap",
  borderColor: "gray.200",
  borderBottomWidth: "1px",
};

const TD_BASE = {
  py: 3.5,
  px: 4,
  fontSize: "xs",
  verticalAlign: "middle",
  borderColor: "gray.100",
  borderBottomWidth: "1px",
  lineHeight: "tall",
};

export default function DataTable({
  columns,
  rows = [],
  keyExtractor,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription,
  emptyIcon = FaInbox,
  emptyAction,
  showIndex = false,
  stickyHeader = true,
  pagination,
  maxHeight,
  tableProps,
  onRowClick,
  sortable = true,
  defaultSortField = null,
  defaultSortOrder = "asc", // "asc" | "desc"
  ...rest
}) {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const cardBg = useColorModeValue("white", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const rowHoverBg = useColorModeValue("teal.50", "rgba(15, 118, 110, 0.12)");

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortField === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [rows, sortField, sortOrder]);

  const colCount = columns.length + (showIndex ? 1 : 0);
  const skeletonRows = Math.min(5, (pagination?.rowsPerPage ?? 10) || 5);

  const thOf = (col) => {
    const shared = {
      ...TH_BASE,
      textAlign: col.align || "left",
      ...(col.width ? { w: col.width } : {}),
      ...(col.minWidth ? { minW: col.minWidth } : {}),
      ...col.thProps,
    };
    if (stickyHeader) {
      return { ...shared, position: "sticky", top: 0, zIndex: 2 };
    }
    return shared;
  };

  const cellOf = (col, row, index) => {
    if (col.cell) return col.cell(row, index, sortedRows);
    const value = row?.[col.key];
    if (value == null || value === "") return "—";
    return String(value);
  };

  const tdOf = (col) => ({
    ...TD_BASE,
    textAlign: col.align || "left",
    ...(col.truncate ? { maxW: col.width || "240px", isTruncated: true } : {}),
    ...col.tdProps,
  });

  const rowIndex = (i) => {
    if (pagination?.page && pagination?.rowsPerPage) {
      return (pagination.page - 1) * pagination.rowsPerPage + i + 1;
    }
    return i + 1;
  };

  const shouldShowPagination =
    pagination &&
    pagination.totalPages > 1 &&
    (!pagination.totalRows || pagination.totalRows > (pagination.rowsPerPage || 10));

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex={1}
      minH={0}
      borderRadius="12px"
      border="1px solid"
      borderColor={borderColor}
      bg={cardBg}
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.03)"
      overflow="hidden"
      {...rest}
    >
      <Box
        overflow="auto"
        css={scrollbarStyles}
        flex={1}
        minH={0}
        maxH={maxHeight}
      >
        <Table
          variant="simple"
          size="sm"
          position="relative"
          {...tableProps}
        >
          <Thead bg="gray.50">
            <Tr>
              {showIndex && (
                <Th {...thOf({ width: "48px" })} textAlign="center">
                  #
                </Th>
              )}
              {columns.map((col) => {
                const isCurrentSort = sortField === col.key;
                const canSort = sortable && col.sortable !== false && col.key;

                return (
                  <Th
                    key={col.key || col.label}
                    {...thOf(col)}
                    cursor={canSort ? "pointer" : "default"}
                    onClick={canSort ? () => handleSort(col.key) : undefined}
                    _hover={canSort ? { color: "#0F766E" } : undefined}
                    userSelect="none"
                  >
                    <HStack spacing={1} justify={col.align === "right" ? "flex-end" : "flex-start"}>
                      <Box as="span">{col.label}</Box>
                      {canSort && (
                        <Icon
                          as={
                            isCurrentSort
                              ? sortOrder === "asc"
                                ? FaSortUp
                                : FaSortDown
                              : FaSort
                          }
                          boxSize={2.5}
                          color={isCurrentSort ? "#0F766E" : "gray.300"}
                        />
                      )}
                    </HStack>
                  </Th>
                );
              })}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <Tr key={`skeleton-${i}`} h="56px">
                  {showIndex && (
                    <Td {...TD_BASE} textAlign="center">
                      <Skeleton height="14px" width="20px" mx="auto" />
                    </Td>
                  )}
                  {columns.map((col) => (
                    <Td key={col.key || col.label} {...tdOf(col)}>
                      <Skeleton height="14px" width={i % 2 === 0 ? "80%" : "60%"} />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : sortedRows.length === 0 ? (
              <Tr>
                <Td colSpan={colCount} p={0} border="none">
                  <Flex
                    py={12}
                    justify="center"
                    align="center"
                    direction="column"
                    color="gray.400"
                  >
                    <Icon as={emptyIcon} boxSize={8} mb={2} color="gray.300" />
                    <Text fontWeight="600" fontSize="sm" color="gray.600">
                      {emptyTitle}
                    </Text>
                    {emptyDescription && (
                      <Text fontSize="xs" mt={1} color="gray.400">
                        {emptyDescription}
                      </Text>
                    )}
                    {emptyAction && <Box mt={3}>{emptyAction}</Box>}
                  </Flex>
                </Td>
              </Tr>
            ) : (
              sortedRows.map((row, i) => (
                <Tr
                  key={keyExtractor ? keyExtractor(row, i) : i}
                  minH="56px"
                  _hover={{ bg: onRowClick ? rowHoverBg : "gray.50" }}
                  cursor={onRowClick ? "pointer" : undefined}
                  transition="background-color 0.15s ease"
                  onClick={
                    onRowClick
                      ? (e) => {
                          if (
                            e.target.closest(
                              "button, a, input, select, textarea, [role='button'], [role='menuitem'], [role='menu']"
                            )
                          ) {
                            return;
                          }
                          onRowClick(row, i);
                        }
                      : undefined
                  }
                >
                  {showIndex && (
                    <Td {...TD_BASE} textAlign="center" color="gray.400" fontSize="2xs">
                      {rowIndex(i)}
                    </Td>
                  )}
                  {columns.map((col) => (
                    <Td key={col.key || col.label} {...tdOf(col)}>
                      {cellOf(col, row, i)}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {shouldShowPagination && (
        <Box borderTop="1px solid" borderColor={borderColor}>
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalRows={pagination.totalRows}
            indexOfFirst={pagination.indexOfFirst}
            indexOfLast={pagination.indexOfLast}
            rowsPerPage={pagination.rowsPerPage}
            onPageChange={pagination.onPageChange}
            onRowsPerPageChange={pagination.onRowsPerPageChange}
            rowsPerPageOptions={pagination.rowsPerPageOptions}
            label={pagination.label}
            showRowsPerPage={pagination.showRowsPerPage}
          />
        </Box>
      )}
    </Box>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.node.isRequired,
      align: PropTypes.oneOf(["left", "center", "right"]),
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      truncate: PropTypes.bool,
      sortable: PropTypes.bool,
      cell: PropTypes.func,
      thProps: PropTypes.object,
      tdProps: PropTypes.object,
    })
  ).isRequired,
  rows: PropTypes.array,
  keyExtractor: PropTypes.func,
  isLoading: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.node,
  emptyIcon: PropTypes.oneOfType([PropTypes.object, PropTypes.func, PropTypes.elementType]),
  emptyAction: PropTypes.node,
  showIndex: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number,
    totalRows: PropTypes.number,
    indexOfFirst: PropTypes.number,
    indexOfLast: PropTypes.number,
    rowsPerPage: PropTypes.number,
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
    label: PropTypes.string,
    showRowsPerPage: PropTypes.bool,
  }),
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tableProps: PropTypes.object,
  onRowClick: PropTypes.func,
  sortable: PropTypes.bool,
  defaultSortField: PropTypes.string,
  defaultSortOrder: PropTypes.oneOf(["asc", "desc"]),
};
