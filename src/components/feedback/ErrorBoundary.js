import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  VStack,
  Icon,
  Text,
  Badge,
  Collapse,
  useColorModeValue,
  Container,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import {
  MdRefresh,
  MdSpaceDashboard,
  MdWarningAmber,
  MdContentCopy,
  MdCheck,
  MdCode,
  MdCached,
  MdShield,
  MdOpenInNew,
  MdArrowBack,
  MdHelpOutline,
} from "react-icons/md";

const BRAND = "#008080";
const BRAND_HOVER = "#006666";

const isChunkError = (error) => {
  const message = String(error?.message || "");
  return (
    error?.name === "ChunkLoadError" ||
    /loading chunk/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message)
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      isChunkError: isChunkError(error),
    };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unhandled UI error:", error, info?.componentStack);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDashboard = () => {
    window.location.hash = "#/owner/dashboard";
    this.setState({ error: null, hasError: false, isChunkError: false });
  };

  render() {
    const { hasError, error, isChunkError: chunkError } = this.state;
    if (!hasError) return this.props.children;

    return (
      <ErrorFallback
        error={error}
        isChunkError={chunkError}
        onReload={this.handleReload}
        onDashboard={this.handleDashboard}
      />
    );
  }
}

function ErrorFallback({ error, isChunkError: chunkError, onReload, onDashboard }) {
  const [copied, setCopied] = useState(false);
  const [showFullStack, setShowFullStack] = useState(false);

  const surface = useColorModeValue("white", "gray.850");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const subtitleColor = useColorModeValue("gray.600", "gray.300");
  const pageBg = useColorModeValue("#F8FAFC", "#0B0F17");
  const terminalBg = useColorModeValue("#0F172A", "#060911");

  const errorMessage =
    error?.message || (typeof error === "string" ? error : "An unexpected UI error occurred while rendering.");
  const errorStack = error?.stack || null;
  const currentPath = window.location.hash || window.location.pathname || "/";
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  const handleCopyDetails = () => {
    const report = [
      `RightTouch Operations Dashboard - Error Diagnostic Report`,
      `========================================================`,
      `Timestamp: ${now.toISOString()}`,
      `Route: ${currentPath}`,
      `Error Type: ${chunkError ? "ChunkLoadError" : error?.name || "RenderError"}`,
      `Message: ${errorMessage}`,
      ``,
      `Component / Call Stack:`,
      `${errorStack || "No stack trace available"}`,
      ``,
      `Client User-Agent:`,
      `${navigator.userAgent}`,
    ].join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleHardRefresh = () => {
    try {
      if (window.sessionStorage) window.sessionStorage.clear();
      if (window.localStorage) {
        // clear temporary session tokens/cache if needed
      }
    } catch {}
    window.location.reload();
  };

  return (
    <Flex
      minH="100vh"
      w="100%"
      direction="column"
      bg={pageBg}
      fontFamily="heading"
      position="relative"
      overflowX="hidden"
    >
      {/* Top Application Bar */}
      <Flex
        w="100%"
        px={{ base: 4, md: 8 }}
        py={3.5}
        bg="white"
        borderBottom="1px solid"
        borderColor={cardBorder}
        justify="space-between"
        align="center"
        boxShadow="xs"
      >
        <HStack spacing={3}>
          <Flex
            w="34px"
            h="34px"
            borderRadius="10px"
            bg="teal.50"
            color={BRAND}
            align="center"
            justify="center"
            fontSize="18px"
            fontWeight="bold"
          >
            <Icon as={MdShield} />
          </Flex>
          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="sm" fontWeight="bold" color="gray.900" letterSpacing="-0.2px">
                RightTouch Admin
              </Text>
              <Badge colorScheme="teal" variant="subtle" fontSize="10px" px={2} py={0.2} borderRadius="full">
                Operations Recovery
              </Badge>
            </HStack>
          </Box>
        </HStack>

        <HStack spacing={2.5}>
          <Flex align="center" gap={1.5} px={3} py={1} borderRadius="full" bg="gray.100" fontSize="xs" color="gray.600">
            <Box w="7px" h="7px" borderRadius="full" bg="green.500" />
            <Text fontWeight="600">Data Protected</Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" display={{ base: "none", md: "inline" }}>
            {dateString} {timeString}
          </Text>
        </HStack>
      </Flex>

      {/* Main View Area */}
      <Flex flex="1" align="center" justify="center" p={{ base: 4, md: 8, lg: 12 }}>
        <Container maxW="960px" p={0}>
          <Box
            bg={surface}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="24px"
            boxShadow="0 24px 60px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.6)"
            p={{ base: 6, md: 10, lg: 12 }}
            position="relative"
            overflow="hidden"
          >
            {/* Top Accent Stripe */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="5px"
              bgGradient={chunkError ? "linear(to-r, blue.400, teal.400)" : "linear(to-r, orange.400, red.400)"}
            />

            {/* Header Content */}
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "flex-start", sm: "center" }}
              gap={5}
              mb={6}
            >
              <Flex
                w={{ base: "58px", md: "72px" }}
                h={{ base: "58px", md: "72px" }}
                borderRadius="20px"
                bg={chunkError ? "blue.50" : "orange.50"}
                color={chunkError ? "blue.600" : "orange.500"}
                border="2px solid"
                borderColor={chunkError ? "blue.200" : "orange.200"}
                align="center"
                justify="center"
                fontSize={{ base: "28px", md: "36px" }}
                boxShadow="sm"
                flexShrink={0}
              >
                <Icon as={chunkError ? MdCached : MdWarningAmber} />
              </Flex>

              <Box flex="1">
                <HStack spacing={2.5} mb={1.5} flexWrap="wrap">
                  <Badge
                    colorScheme={chunkError ? "blue" : "orange"}
                    fontSize="xs"
                    px={2.5}
                    py={0.6}
                    borderRadius="full"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    {chunkError ? "Update Available" : "UI Rendering Interrupted"}
                  </Badge>
                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    Route: {currentPath}
                  </Text>
                </HStack>

                <Heading
                  fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                  fontWeight="800"
                  color={titleColor}
                  letterSpacing="-0.5px"
                  lineHeight="1.25"
                >
                  {chunkError ? "A new version of RightTouch is ready" : "This page could not be displayed"}
                </Heading>

                <Text fontSize={{ base: "sm", md: "md" }} color={subtitleColor} mt={2.5} lineHeight="1.6">
                  {chunkError
                    ? "The dashboard was updated with new components. Reload the page to load the latest release."
                    : "An unexpected client-side error prevented this view from rendering. All background data and backend systems remain safe and unchanged."}
                </Text>
              </Box>
            </Flex>

            {/* Diagnostic Console Box */}
            <Box
              mt={5}
              mb={8}
              borderRadius="16px"
              bg={terminalBg}
              border="1px solid"
              borderColor="gray.700"
              overflow="hidden"
              boxShadow="inner"
            >
              {/* Terminal Window Header */}
              <Flex
                bg="#1E293B"
                px={4}
                py={2.5}
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                <HStack spacing={2} align="center">
                  <HStack spacing={1.5}>
                    <Box w="10px" h="10px" borderRadius="full" bg="#EF4444" />
                    <Box w="10px" h="10px" borderRadius="full" bg="#F59E0B" />
                    <Box w="10px" h="10px" borderRadius="full" bg="#10B981" />
                  </HStack>
                  <Text fontSize="11px" fontWeight="bold" color="gray.400" letterSpacing="0.8px" textTransform="uppercase" ml={2}>
                    Diagnostic Exception Details
                  </Text>
                </HStack>

                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="ghost"
                    color={copied ? "green.300" : "gray.300"}
                    _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    leftIcon={copied ? <MdCheck /> : <MdContentCopy />}
                    onClick={handleCopyDetails}
                    fontWeight="semibold"
                    borderRadius="6px"
                  >
                    {copied ? "Copied Report" : "Copy Error"}
                  </Button>
                </HStack>
              </Flex>

              {/* Terminal Body */}
              <Box p={4} maxH="280px" overflowY="auto">
                <Text
                  fontSize="sm"
                  color="#F87171"
                  fontFamily="mono"
                  fontWeight="600"
                  lineHeight="1.5"
                  wordBreak="break-word"
                >
                  {errorMessage}
                </Text>

                {errorStack && (
                  <>
                    <Button
                      size="xs"
                      variant="link"
                      color="teal.300"
                      mt={3}
                      mb={2}
                      onClick={() => setShowFullStack(!showFullStack)}
                      leftIcon={<MdCode />}
                    >
                      {showFullStack ? "Hide call stack" : "View technical call stack"}
                    </Button>
                    <Collapse in={showFullStack} animateOpacity>
                      <Box
                        p={3}
                        mt={1}
                        borderRadius="8px"
                        bg="blackAlpha.600"
                        border="1px solid"
                        borderColor="gray.800"
                      >
                        <Text
                          fontSize="xs"
                          color="gray.400"
                          fontFamily="mono"
                          whiteSpace="pre-wrap"
                          wordBreak="break-word"
                          lineHeight="1.6"
                        >
                          {errorStack}
                        </Text>
                      </Box>
                    </Collapse>
                  </>
                )}
              </Box>
            </Box>

            {/* Action Buttons Bar */}
            <Flex
              direction={{ base: "column", sm: "row" }}
              align="center"
              justify="space-between"
              gap={4}
              pt={2}
            >
              <HStack spacing={3} flexWrap="wrap" w={{ base: "100%", sm: "auto" }}>
                <Button
                  size="md"
                  colorScheme="teal"
                  bg={BRAND}
                  _hover={{ bg: BRAND_HOVER }}
                  _active={{ bg: BRAND_HOVER }}
                  leftIcon={<MdRefresh fontSize="20px" />}
                  onClick={onReload}
                  px={6}
                  h="46px"
                  borderRadius="12px"
                  fontWeight="bold"
                  boxShadow="md"
                  w={{ base: "100%", sm: "auto" }}
                >
                  Reload Page
                </Button>

                <Button
                  size="md"
                  variant="outline"
                  borderColor="gray.300"
                  color="gray.700"
                  _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                  leftIcon={<MdSpaceDashboard fontSize="18px" />}
                  onClick={onDashboard}
                  px={5}
                  h="46px"
                  borderRadius="12px"
                  fontWeight="semibold"
                  w={{ base: "100%", sm: "auto" }}
                >
                  Go to Dashboard
                </Button>
              </HStack>

              <Button
                size="sm"
                variant="ghost"
                color="gray.500"
                _hover={{ color: "gray.800", bg: "gray.100" }}
                leftIcon={<MdCached />}
                onClick={handleHardRefresh}
                borderRadius="8px"
                fontSize="xs"
              >
                Clear Cache & Hard Reload
              </Button>
            </Flex>

            {/* Guidance Footer */}
            <Divider my={6} borderColor="gray.100" />
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "flex-start", md: "center" }}
              gap={3}
              fontSize="xs"
              color="gray.500"
            >
              <HStack spacing={2} align="center">
                <Icon as={MdHelpOutline} color="gray.400" />
                <Text>
                  Need assistance? Contact support with the copied diagnostic reference.
                </Text>
              </HStack>
              <Text fontSize="2xs" color="gray.400">
                RightTouch Core Governance • Platform v1.0.6
              </Text>
            </Flex>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.object,
  isChunkError: PropTypes.bool,
  onReload: PropTypes.func.isRequired,
  onDashboard: PropTypes.func.isRequired,
};

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
