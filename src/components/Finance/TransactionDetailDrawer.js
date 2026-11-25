import React from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Flex,
  Icon,
  Divider,
  SimpleGrid,
  useColorMode,
  IconButton,
} from "@chakra-ui/react";
import {
  FaReceipt,
  FaUser,
  FaUserTie,
  FaCopy,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import StatusBadge from "components/common/StatusBadge";
import { useAppToast } from "components/feedback";

const BRAND = "#008080";

const formatINR = (value) => {
  const num = parseFloat(value || 0);
  if (isNaN(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export default function TransactionDetailDrawer({ isOpen, onClose, data, source = "breakdown" }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const toast = useAppToast();

  if (!data) return null;

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    toast.success(`${label} copied to clipboard`);
  };

  const bookingId = data.bookingId || data._id;
  const paymentId = data.paymentId || data.providerPaymentId || data._id;
  const isPaid = data.paymentStatus === "paid" || data.status === "success";
  const isSettled = data.settlementStatus === "settled";

  const totalAmount = data.totalAmount || (data.serviceAmount + (data.gstAmount || 0) + (data.tipAmount || 0)) || 0;
  const serviceAmount = data.serviceAmount || 0;
  const gstAmount = data.gstAmount || 0;
  const tipAmount = data.tipAmount || 0;
  const commissionAmount = data.commissionAmount || 0;
  const technicianAmount = data.technicianAmount || (serviceAmount - commissionAmount + tipAmount) || 0;

  return (
    <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={isDark ? "gray.900" : "white"}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={isDark ? "gray.800" : "gray.100"} pb={3}>
          <HStack spacing={3}>
            <Box p={2} bg="teal.50" borderRadius="lg" color={BRAND}>
              <Icon as={FaReceipt} boxSize={5} />
            </Box>
            <Box>
              <Text fontSize="md" fontWeight="bold" color={isDark ? "white" : "gray.800"}>
                Financial Transaction Breakdown
              </Text>
              <HStack spacing={2} mt={0.5}>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  {bookingId ? `Booking #${String(bookingId).slice(-8)}` : `Payment #${String(paymentId).slice(-8)}`}
                </Text>
                {bookingId && (
                  <IconButton
                    aria-label="Copy ID"
                    icon={<FaCopy size={10} />}
                    size="xs"
                    variant="ghost"
                    h="18px"
                    w="18px"
                    minW="18px"
                    color="gray.400"
                    _hover={{ color: BRAND }}
                    onClick={() => copyToClipboard(bookingId, "Booking ID")}
                  />
                )}
              </HStack>
            </Box>
          </HStack>
        </DrawerHeader>

        <DrawerBody py={5}>
          <VStack spacing={5} align="stretch">
            {/* Payment & Settlement Summary Card */}
            <Box
              p={4}
              borderRadius="xl"
              bg={isDark ? "gray.800" : "gray.50"}
              border="1px solid"
              borderColor={isDark ? "gray.700" : "gray.200"}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                  Total Customer Charge
                </Text>
                <HStack spacing={2}>
                  <StatusBadge
                    colorScheme={isPaid ? "green" : "yellow"}
                    label={data.paymentStatus || data.status || "Pending"}
                    variant="subtle"
                  />
                  <StatusBadge
                    colorScheme={isSettled ? "teal" : "gray"}
                    label={data.settlementStatus ? `Settlement: ${data.settlementStatus}` : "Settlement: Pending"}
                    variant="subtle"
                  />
                </HStack>
              </Flex>
              <Text fontSize="2xl" fontWeight="900" color={BRAND}>
                {formatINR(totalAmount)}
              </Text>
              <HStack spacing={4} mt={2} fontSize="xs" color="gray.500">
                <HStack spacing={1}>
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>{formatDate(data.createdAt || data.paidAt)}</Text>
                </HStack>
                {data.paymentMode && (
                  <HStack spacing={1}>
                    <Icon as={MdPayment} boxSize={3} />
                    <Text textTransform="uppercase">{data.paymentMode} ({data.paymentProvider || "Online"})</Text>
                  </HStack>
                )}
              </HStack>
            </Box>

            {/* Financial Component Breakdown */}
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={3} letterSpacing="0.5px">
                Line-Item Revenue Split
              </Text>
              <VStack
                spacing={0}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? "gray.700" : "gray.200"}
                overflow="hidden"
                divider={<Divider borderColor={isDark ? "gray.750" : "gray.100"} />}
              >
                <Flex justify="space-between" align="center" w="100%" px={4} py={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color={isDark ? "gray.200" : "gray.800"}>
                      Base Service Fee
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                      Core service value without taxes
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.850"}>
                    {formatINR(serviceAmount)}
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center" w="100%" px={4} py={3}>
                  <Box>
                    <HStack spacing={1.5}>
                      <Text fontSize="sm" fontWeight="600" color={isDark ? "gray.200" : "gray.800"}>
                        GST Component
                      </Text>
                      {data.gstPercentage ? (
                        <Text fontSize="2xs" px={1.5} py={0.5} bg="orange.50" color="orange.700" borderRadius="md" fontWeight="bold">
                          {data.gstPercentage}%
                        </Text>
                      ) : null}
                    </HStack>
                    <Text fontSize="2xs" color="gray.500">
                      Government tax on service
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color="orange.600">
                    {formatINR(gstAmount)}
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center" w="100%" px={4} py={3}>
                  <Box>
                    <HStack spacing={1.5}>
                      <Text fontSize="sm" fontWeight="600" color={isDark ? "gray.200" : "gray.800"}>
                        Customer Tip
                      </Text>
                      <Text fontSize="2xs" px={1.5} py={0.5} bg="purple.50" color="purple.700" borderRadius="md" fontWeight="bold">
                        100% to Tech
                      </Text>
                    </HStack>
                    <Text fontSize="2xs" color="gray.500">
                      Zero platform deduction on tips
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color="purple.600">
                    {formatINR(tipAmount)}
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center" w="100%" px={4} py={3} bg={isDark ? "gray.850" : "purple.50"}>
                  <Box>
                    <HStack spacing={1.5}>
                      <Text fontSize="sm" fontWeight="700" color="purple.700">
                        Platform Commission
                      </Text>
                      {data.commissionPercentage ? (
                        <Text fontSize="2xs" px={1.5} py={0.5} bg="purple.100" color="purple.800" borderRadius="md" fontWeight="bold">
                          {data.commissionPercentage}%
                        </Text>
                      ) : null}
                    </HStack>
                    <Text fontSize="2xs" color="purple.600">
                      RightTouch revenue share
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="800" color="purple.700">
                    {formatINR(commissionAmount)}
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center" w="100%" px={4} py={3} bg={isDark ? "gray.800" : "green.50"}>
                  <Box>
                    <Text fontSize="sm" fontWeight="800" color="green.700">
                      Technician Net Payout
                    </Text>
                    <Text fontSize="2xs" color="green.600">
                      (Base Fee − Commission) + 100% Tip
                    </Text>
                  </Box>
                  <Text fontSize="md" fontWeight="900" color="green.700">
                    {formatINR(technicianAmount)}
                  </Text>
                </Flex>
              </VStack>
            </Box>

            {/* Stakeholder Details */}
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={3} letterSpacing="0.5px">
                Stakeholders & Service Details
              </Text>
              <SimpleGrid columns={1} spacing={3}>
                {/* Service Info */}
                <Box p={3} borderRadius="lg" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                  <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                    Service Rendered
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"} mt={0.5}>
                    {data.service || data.serviceName || data.itemType || "On-demand Service"}
                  </Text>
                  {data.serviceType && (
                    <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                      Type: {data.serviceType}
                    </Text>
                  )}
                </Box>

                {/* Customer Info */}
                <Box p={3} borderRadius="lg" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                  <HStack spacing={2} mb={1}>
                    <Icon as={FaUser} boxSize={3.5} color="teal.500" />
                    <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Customer
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                    {data.customer?.name || "Customer Registered"}
                  </Text>
                  <HStack spacing={3} mt={1} fontSize="xs" color="gray.500">
                    {data.customer?.mobile && (
                      <HStack spacing={1}>
                        <Text>Phone: {data.customer.mobile}</Text>
                        <IconButton
                          aria-label="Copy phone"
                          icon={<FaCopy size={9} />}
                          size="xs"
                          h="16px"
                          w="16px"
                          minW="16px"
                          variant="ghost"
                          onClick={() => copyToClipboard(data.customer.mobile, "Customer Phone")}
                        />
                      </HStack>
                    )}
                    {data.customer?.email && (
                      <Text>Email: {data.customer.email}</Text>
                    )}
                  </HStack>
                </Box>

                {/* Technician Info */}
                <Box p={3} borderRadius="lg" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                  <HStack spacing={2} mb={1}>
                    <Icon as={FaUserTie} boxSize={3.5} color="teal.600" />
                    <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Assigned Technician
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                    {data.technician || data.technicianDetails?.name || "Unassigned"}
                  </Text>
                  {data.technicianDetails?.mobile && (
                    <HStack spacing={1} mt={1} fontSize="xs" color="gray.500">
                      <Text>Phone: {data.technicianDetails.mobile}</Text>
                      <IconButton
                        aria-label="Copy tech phone"
                        icon={<FaCopy size={9} />}
                        size="xs"
                        h="16px"
                        w="16px"
                        minW="16px"
                        variant="ghost"
                        onClick={() => copyToClipboard(data.technicianDetails.mobile, "Technician Phone")}
                      />
                    </HStack>
                  )}
                </Box>
              </SimpleGrid>
            </Box>

            {/* Gateway & Payment References */}
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={3} letterSpacing="0.5px">
                Payment Gateway & Audit Trail
              </Text>
              <VStack spacing={2} align="stretch" fontSize="xs">
                {data.providerOrderId && (
                  <Flex justify="space-between" align="center" p={2} bg={isDark ? "gray.800" : "gray.50"} borderRadius="md">
                    <Text color="gray.500">Gateway Order ID</Text>
                    <HStack spacing={1}>
                      <Text fontFamily="mono" fontWeight="bold">{data.providerOrderId}</Text>
                      <IconButton
                        aria-label="Copy order id"
                        icon={<FaCopy size={9} />}
                        size="xs"
                        variant="ghost"
                        h="16px"
                        w="16px"
                        minW="16px"
                        onClick={() => copyToClipboard(data.providerOrderId, "Order ID")}
                      />
                    </HStack>
                  </Flex>
                )}

                {(data.paymentReference || data.providerPaymentId) && (
                  <Flex justify="space-between" align="center" p={2} bg={isDark ? "gray.800" : "gray.50"} borderRadius="md">
                    <Text color="gray.500">Payment Reference / UTR</Text>
                    <HStack spacing={1}>
                      <Text fontFamily="mono" fontWeight="bold">{data.paymentReference || data.providerPaymentId}</Text>
                      <IconButton
                        aria-label="Copy payment ref"
                        icon={<FaCopy size={9} />}
                        size="xs"
                        variant="ghost"
                        h="16px"
                        w="16px"
                        minW="16px"
                        onClick={() => copyToClipboard(data.paymentReference || data.providerPaymentId, "Payment Reference")}
                      />
                    </HStack>
                  </Flex>
                )}

                {data.settledAt && (
                  <Flex justify="space-between" align="center" p={2} bg={isDark ? "gray.800" : "gray.50"} borderRadius="md">
                    <Text color="gray.500">Settled At</Text>
                    <Text fontWeight="600">{formatDate(data.settledAt)}</Text>
                  </Flex>
                )}

                {data.paymentDetailsSummary && (
                  <Box p={2.5} bg={isDark ? "gray.800" : "teal.50"} borderRadius="md" border="1px dashed" borderColor="teal.300">
                    <Text fontSize="2xs" fontWeight="bold" color="teal.700" textTransform="uppercase">Payment Details Summary</Text>
                    <Text fontSize="xs" color={isDark ? "gray.300" : "gray.700"} mt={0.5}>
                      {data.paymentDetailsSummary}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor={isDark ? "gray.800" : "gray.100"}>
          <Button variant="outline" mr={3} onClick={onClose} borderRadius="lg" size="sm">
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
