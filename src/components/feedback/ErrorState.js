import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdRefresh, MdErrorOutline } from "react-icons/md";
import { toUserError } from "errors/normalizeError";

export default function ErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  compact = false,
  icon = MdErrorOutline,
  requestId,
  action,
  ...rest
}) {
  const info = error ? toUserError(error) : null;
  const effectiveTitle = title || info?.title || "Something went wrong";
  const effectiveDescription =
    description || info?.message || "Please try again. If the issue continues, contact support.";
  const effectiveRequestId = requestId || info?.requestId;
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const iconBg = useColorModeValue("red.50", "red.900");
  const iconColor = useColorModeValue("red.600", "red.300");

  if (compact) {
    return (
      <Flex
        align="flex-start"
        gap={3}
        p={4}
        border="1px solid"
        borderColor={border}
        borderRadius="10px"
        bg={surface}
        {...rest}
      >
        <Icon as={icon} boxSize={5} color={iconColor} mt={0.5} flexShrink={0} />
        <Box flex="1" minW={0}>
          <Text fontSize="sm" fontWeight="800" color={titleColor}>
            {effectiveTitle}
          </Text>
          <Text fontSize="sm" color={bodyColor} mt={1} lineHeight="1.5">
            {effectiveDescription}
          </Text>
          {effectiveRequestId ? (
            <Text fontSize="xs" color={bodyColor} mt={1} fontFamily="mono">
              Ref: {effectiveRequestId}
            </Text>
          ) : null}
          {onRetry ? (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="teal"
              mt={2}
              ml={-2}
              leftIcon={<MdRefresh />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      px={{ base: 6, md: 10 }}
      py={{ base: 8, md: 12 }}
      minH="300px"
      border="1px solid"
      borderColor={border}
      borderRadius="18px"
      bg={surface}
      boxShadow="sm"
      {...rest}
    >
      <Flex
        w="60px"
        h="60px"
        borderRadius="16px"
        bg={iconBg}
        color={iconColor}
        align="center"
        justify="center"
        mb={4}
        boxShadow="xs"
      >
        <Icon as={icon} boxSize={8} />
      </Flex>
      <Text fontSize="lg" fontWeight="800" color={titleColor} letterSpacing="-0.2px">
        {effectiveTitle}
      </Text>
      <Text fontSize="sm" color={bodyColor} mt={2} maxW="520px" lineHeight="1.6">
        {effectiveDescription}
      </Text>
      {effectiveRequestId ? (
        <Text fontSize="xs" color="gray.500" mt={2.5} fontFamily="mono" bg="gray.100" px={2.5} py={0.5} borderRadius="md">
          Diagnostic Ref: {effectiveRequestId}
        </Text>
      ) : null}
      {onRetry || action ? (
        <Flex mt={6} gap={3} flexWrap="wrap" justify="center">
          {onRetry ? (
            <Button
              size="md"
              colorScheme="teal"
              leftIcon={<MdRefresh />}
              onClick={onRetry}
              borderRadius="10px"
              px={5}
              fontWeight="semibold"
            >
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </Flex>
      ) : null}
    </Flex>
  );
}

ErrorState.propTypes = {
  error: PropTypes.any,
  title: PropTypes.node,
  description: PropTypes.node,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  compact: PropTypes.bool,
  icon: PropTypes.elementType,
  requestId: PropTypes.string,
  action: PropTypes.node,
};
