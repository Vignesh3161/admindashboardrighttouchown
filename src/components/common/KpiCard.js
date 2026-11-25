import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Flex,
  Text,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

/**
 * Standard KpiCard Component
 * Displays a non-navigational metric: full label, big value, delta/footnote line, and an icon chip.
 */
export default function KpiCard({
  title,
  value,
  delta,
  deltaType = "increase", // "increase" | "decrease" | "neutral"
  footnote,
  icon,
  iconBg,
  iconColor,
  isLoading = false,
  ...rest
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "white");
  const footnoteColor = useColorModeValue("gray.500", "gray.400");

  const defaultIconBg = useColorModeValue("teal.50", "rgba(15, 118, 110, 0.2)");
  const defaultIconColor = useColorModeValue("#0F766E", "#2DD4BF");

  const isPositive = deltaType === "increase";
  const isNegative = deltaType === "decrease";

  return (
    <Box
      bg={cardBg}
      p={5}
      borderRadius="12px"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.04)"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      _hover={{ borderColor: useColorModeValue("gray.300", "gray.600") }}
      minH="124px"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      {...rest}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex="1" minW="0">
          <Text
            fontSize="xs"
            fontWeight="500"
            color={titleColor}
            textTransform="none"
            letterSpacing="normal"
            lineHeight="short"
          >
            {title}
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="700"
            color={valueColor}
            letterSpacing="-0.03em"
            lineHeight="shorter"
            mt={1.5}
          >
            {value}
          </Text>
        </Box>

        {icon && (
          <Flex
            w="40px"
            h="40px"
            borderRadius="10px"
            bg={iconBg || defaultIconBg}
            color={iconColor || defaultIconColor}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={icon} boxSize={5} />
          </Flex>
        )}
      </Flex>

      {(delta !== undefined || footnote) && (
        <HStack spacing={2} mt={3} fontSize="xs">
          {delta !== undefined && (
            <HStack
              spacing={1}
              color={
                isPositive
                  ? "green.600"
                  : isNegative
                  ? "red.600"
                  : footnoteColor
              }
              fontWeight="600"
            >
              {isPositive && <Icon as={FaArrowUp} boxSize={2.5} />}
              {isNegative && <Icon as={FaArrowDown} boxSize={2.5} />}
              <Text>{delta}</Text>
            </HStack>
          )}
          {footnote && (
            <Text color={footnoteColor} noOfLines={1}>
              {footnote}
            </Text>
          )}
        </HStack>
      )}
    </Box>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.string,
  deltaType: PropTypes.oneOf(["increase", "decrease", "neutral"]),
  footnote: PropTypes.string,
  icon: PropTypes.elementType,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
  isLoading: PropTypes.bool,
};
