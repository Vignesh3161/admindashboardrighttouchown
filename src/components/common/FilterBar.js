import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Button,
  Text,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaSearch, FaTimes, FaFilter } from "react-icons/fa";

/**
 * Standard FilterBar Component for RightTouch Admin
 * Provides labelled filter chips, full search input, overflow "More filters" popover,
 * live result count, and "Clear all" action.
 */
export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  chips = [], // Array of { id, label, value, options, onChange }
  overflowFilters = null, // Extra filters to put into "More filters" popover
  activeFiltersCount = 0,
  onClearAll,
  totalResults = null,
  actions = null,
  ...rest
}) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const inputBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bg}
      p={3.5}
      borderRadius="12px"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.03)"
      mb={4}
      {...rest}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        justify="space-between"
        align={{ base: "stretch", lg: "center" }}
        gap={3}
      >
        {/* Left: Search input & Filter Chips */}
        <Flex
          flex="1"
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          gap={3}
          wrap="wrap"
        >
          {onSearchChange && (
            <InputGroup size="sm" maxW={{ base: "100%", md: "280px" }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" boxSize={3.5} />
              </InputLeftElement>
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                borderRadius="8px"
                fontSize="xs"
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{
                  borderColor: "#0F766E",
                  boxShadow: "0 0 0 1px #0F766E",
                }}
              />
            </InputGroup>
          )}

          {/* Labelled Filter Chips */}
          <HStack spacing={2} wrap="wrap">
            {chips.map((chip) => (
              <Box key={chip.id} position="relative">
                <HStack
                  as="label"
                  spacing={1.5}
                  px={2.5}
                  py={1}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={chip.value && chip.value !== "all" ? "#0F766E" : borderColor}
                  bg={chip.value && chip.value !== "all" ? "teal.50" : "transparent"}
                  fontSize="xs"
                  cursor="pointer"
                >
                  <Text fontWeight="500" color="gray.500" whiteSpace="nowrap">
                    {chip.label}:
                  </Text>
                  <select
                    value={chip.value}
                    onChange={(e) => chip.onChange(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "12px",
                      fontWeight: chip.value && chip.value !== "all" ? "600" : "400",
                      color: chip.value && chip.value !== "all" ? "#0F766E" : "inherit",
                      cursor: "pointer",
                      paddingRight: "4px",
                    }}
                  >
                    {chip.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </HStack>
              </Box>
            ))}

            {/* Overflow "More filters" Popover */}
            {overflowFilters && (
              <Popover placement="bottom-start">
                <PopoverTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    borderRadius="8px"
                    leftIcon={<Icon as={FaFilter} boxSize={3} />}
                    fontSize="xs"
                    fontWeight="500"
                    color={activeFiltersCount > 0 ? "#0F766E" : textColor}
                    borderColor={activeFiltersCount > 0 ? "#0F766E" : borderColor}
                  >
                    More filters
                    {activeFiltersCount > 0 && (
                      <Badge ml={1.5} colorScheme="teal" borderRadius="full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent w="320px" p={2} borderRadius="12px" boxShadow="lg">
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader fontWeight="600" fontSize="xs" border="none">
                    Additional filters
                  </PopoverHeader>
                  <PopoverBody>
                    <VStack spacing={3} align="stretch">
                      {overflowFilters}
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            )}

            {/* Clear All Action */}
            {activeFiltersCount > 0 && onClearAll && (
              <Button
                size="sm"
                variant="ghost"
                color="red.600"
                fontSize="xs"
                fontWeight="500"
                leftIcon={<Icon as={FaTimes} boxSize={2.5} />}
                onClick={onClearAll}
                h="32px"
              >
                Clear all
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Right: Live Result Count & Extra Actions */}
        <HStack spacing={3} justify={{ base: "space-between", lg: "flex-end" }}>
          {totalResults !== null && (
            <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
              Showing <strong>{totalResults}</strong> result{totalResults === 1 ? "" : "s"}
            </Text>
          )}
          {actions}
        </HStack>
      </Flex>
    </Box>
  );
}

FilterBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  chips: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.any,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.any.isRequired,
        })
      ).isRequired,
      onChange: PropTypes.func.isRequired,
    })
  ),
  overflowFilters: PropTypes.node,
  activeFiltersCount: PropTypes.number,
  onClearAll: PropTypes.func,
  totalResults: PropTypes.number,
  actions: PropTypes.node,
};
