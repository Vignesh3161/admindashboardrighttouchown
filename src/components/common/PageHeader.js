import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * Universal PageHeader Component for RightTouch Admin
 * Provides consistent hierarchy: Title, one-line subtitle, right-aligned action buttons.
 */
export default function PageHeader({
  title,
  subtitle,
  children,
  badge,
  breadcrumbs,
  actions,
  ...rest
}) {
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");

  return (
    <Box mb={6} {...rest}>
      {breadcrumbs && <Box mb={2}>{breadcrumbs}</Box>}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        gap={4}
      >
        <Box>
          <HStack spacing={3} align="center">
            <Heading
              as="h1"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="700"
              color={headingColor}
              letterSpacing="-0.02em"
            >
              {title}
            </Heading>
            {badge}
          </HStack>
          {subtitle && (
            <Text
              fontSize="sm"
              color={subtitleColor}
              mt={1}
              fontWeight="400"
              lineHeight="tall"
            >
              {subtitle}
            </Text>
          )}
        </Box>

        {(actions || children) && (
          <HStack spacing={3} align="center" flexWrap="wrap">
            {actions}
            {children}
          </HStack>
        )}
      </Flex>
    </Box>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  badge: PropTypes.node,
  breadcrumbs: PropTypes.node,
  actions: PropTypes.node,
};
