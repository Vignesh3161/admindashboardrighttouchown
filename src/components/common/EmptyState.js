import React from "react";
import { Flex, Text, Icon, Button, VStack, useColorModeValue } from "@chakra-ui/react";
import PropTypes from "prop-types";

/**
 * Shared Empty State Component following modern web & accessibility design guidelines.
 * Backwards compatible with legacy variant="text" and variant="icon" while supporting
 * rich title, description, custom icons, and optional action buttons.
 */
export default function EmptyState(props) {
  const {
    variant,
    message,
    title,
    description,
    icon,
    height,
    actionLabel,
    onAction,
    dark,
    ...rest
  } = props;

  const resolvedTitle = title || message || "No records found";
  const defaultTitleColor = useColorModeValue("gray.700", "gray.200");
  const defaultDescColor = useColorModeValue("gray.500", "gray.400");
  const titleColor = dark ? "gray.200" : defaultTitleColor;
  const descColor = dark ? "gray.400" : defaultDescColor;

  if (variant === "text") {
    return (
      <Text color={descColor} textAlign="center" py={4} fontSize="sm" {...rest}>
        {message || title}
      </Text>
    );
  }

  return (
    <Flex
      h={height || "280px"}
      minH="200px"
      w="100%"
      justify="center"
      align="center"
      direction="column"
      p={6}
      textAlign="center"
      {...rest}
    >
      <VStack spacing={3} maxW="420px">
        {icon && (
          <Flex
            w="56px"
            h="56px"
            borderRadius="full"
            bg={dark ? "whiteAlpha.100" : "gray.50"}
            border="1px solid"
            borderColor={dark ? "whiteAlpha.200" : "gray.200"}
            align="center"
            justify="center"
            mb={1}
            boxShadow="sm"
          >
            <Icon as={icon} boxSize={6} color={dark ? "teal.300" : "teal.600"} />
          </Flex>
        )}
        <Text fontSize="md" fontWeight="700" color={titleColor} letterSpacing="-0.01em">
          {resolvedTitle}
        </Text>
        {description && (
          <Text fontSize="xs" color={descColor} lineHeight="tall">
            {description}
          </Text>
        )}
        {actionLabel && onAction && (
          <Button
            size="sm"
            colorScheme="teal"
            variant="outline"
            mt={2}
            borderRadius="8px"
            onClick={onAction}
            fontSize="xs"
            fontWeight="600"
          >
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Flex>
  );
}

EmptyState.propTypes = {
  variant: PropTypes.string,
  message: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  height: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  dark: PropTypes.bool,
};
