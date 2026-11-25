import React, { useState } from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Flex,
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Avatar,
  SimpleGrid,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  Icon,
  Divider,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheck,
  FaCopy,
  FaCalendarCheck,
  FaWallet,
  FaTools,
  FaClock,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import StatusBadge from "components/common/StatusBadge";
import {
  getUserDisplayName,
  getUserDisplayEmail,
  getUserDisplayPhone,
} from "views/Dashboard/UserManagement";

export default function CustomerDetailsDrawer({
  isOpen,
  onClose,
  selectedUser,
  allBookings = [],
  isOwner = false,
  onDeleteClick,
  customColor = "#008080",
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  if (!selectedUser) return null;

  const userName = getUserDisplayName(selectedUser);
  const userEmail = getUserDisplayEmail(selectedUser);
  const userPhone = getUserDisplayPhone(selectedUser);
  const userId = selectedUser._id || selectedUser.id || "";
  const shortId = userId ? String(userId).slice(-8).toUpperCase() : "UNKNOWN";

  // Match all bookings for this customer
  const userBookings = (allBookings || []).filter((b) => {
    const custId = b.customerId?._id || b.customerId;
    return String(custId) === String(userId);
  });

  // Calculate customer financial metrics
  const successfulBookings = userBookings.filter(
    (b) => b.paymentStatus === "paid" || b.paymentStatus === "success"
  );
  const totalPaidAmount = successfulBookings.reduce((sum, b) => {
    const amount = parseFloat(b.paidAmount || b.totalAmount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const completedCount = userBookings.filter((b) => b.status === "completed").length;
  const activeCount = userBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed" || b.status === "in-progress"
  ).length;
  const cancelledCount = userBookings.filter((b) => b.status === "cancelled").length;

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === "phone") {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  // Addresses
  const savedAddresses = Array.isArray(selectedUser.addresses) ? selectedUser.addresses : [];

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
      <DrawerContent maxW={{ base: "100%", md: "640px", lg: "700px" }} bg="gray.50">
        <DrawerCloseButton zIndex="10" color="white" top={4} right={4} />

        {/* ==================== DRAWER HEADER ==================== */}
        <DrawerHeader p={0} bg="gray.900" color="white" borderBottom="1px solid" borderColor="gray.800">
          <Box p={6} pb={5}>
            <Flex justify="space-between" align="flex-start" gap={4}>
              <Flex gap={4} align="center" flex="1" minW={0}>
                <Avatar
                  size="xl"
                  name={userName}
                  src={selectedUser.profileImage}
                  border="3px solid"
                  borderColor={customColor}
                  shadow="lg"
                  bg="teal.600"
                />
                <Box minW={0} flex="1">
                  <HStack spacing={2} align="center" flexWrap="wrap">
                    <Heading size="md" color="white" isTruncated maxW="320px">
                      {userName}
                    </Heading>
                    <StatusBadge
                      colorScheme={selectedUser.status?.toLowerCase() === "active" ? "green" : "red"}
                      label={selectedUser.status || "Active"}
                      variant="subtle"
                      showDot
                    />
                  </HStack>

                  <HStack spacing={3} mt={1.5} fontSize="xs" color="gray.300" flexWrap="wrap">
                    <Flex align="center" gap={1}>
                      <FaPhoneAlt size="11px" color="#38bdf8" />
                      <Text fontFamily="mono">{userPhone}</Text>
                      {userPhone !== "-" && (
                        <Tooltip label={copiedPhone ? "Copied!" : "Copy mobile number"} fontSize="2xs">
                          <IconButton
                            aria-label="Copy phone"
                            icon={copiedPhone ? <FaCheck /> : <FaCopy />}
                            size="xs"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "white" }}
                            h="18px"
                            minW="18px"
                            onClick={() => handleCopy(userPhone, "phone")}
                          />
                        </Tooltip>
                      )}
                    </Flex>
                    <Text color="gray.600">•</Text>
                    <Flex align="center" gap={1}>
                      <FaEnvelope size="11px" color="#fbbf24" />
                      <Text isTruncated maxW="190px">{userEmail}</Text>
                    </Flex>
                  </HStack>

                  <HStack spacing={2} mt={2.5}>
                    <Tooltip label={copiedId ? "Copied!" : "Copy full user ID"} fontSize="2xs">
                      <Badge
                        fontFamily="mono"
                        fontSize="2xs"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        bg="gray.800"
                        color="teal.300"
                        cursor="pointer"
                        border="1px solid"
                        borderColor="teal.500"
                        onClick={() => handleCopy(userId, "id")}
                        display="inline-flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Text as="span">ID: #{shortId}</Text>
                        <Icon as={copiedId ? FaCheck : FaCopy} boxSize={2.5} />
                      </Badge>
                    </Tooltip>
                    <Badge colorScheme="blue" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                      {selectedUser.role || "Customer"}
                    </Badge>
                  </HStack>
                </Box>
              </Flex>
            </Flex>
          </Box>
        </DrawerHeader>

        {/* ==================== DRAWER BODY & TABS ==================== */}
        <DrawerBody p={0} overflowY="auto">
          <Tabs
            colorScheme="teal"
            index={activeTab}
            onChange={(idx) => setActiveTab(idx)}
            isLazy
          >
            <TabList
              bg="white"
              px={6}
              borderBottom="1px solid"
              borderColor="gray.200"
              position="sticky"
              top={0}
              zIndex={5}
            >
              <Tab fontWeight="bold" fontSize="xs" py={3}>
                <HStack spacing={1.5}>
                  <FaUsers size="13px" />
                  <Text>Profile & Addresses</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs" py={3}>
                <HStack spacing={1.5}>
                  <FaCalendarCheck size="13px" />
                  <Text>Bookings ({userBookings.length})</Text>
                </HStack>
              </Tab>
              <Tab fontWeight="bold" fontSize="xs" py={3}>
                <HStack spacing={1.5}>
                  <FaWallet size="13px" />
                  <Text>Financials & LTV</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels p={5}>
              {/* ==================== TAB 1: PROFILE & ADDRESSES ==================== */}
              <TabPanel p={0}>
                <VStack spacing={4} align="stretch">
                  {/* Account Overview Card */}
                  <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider" textTransform="uppercase" mb={3}>
                      Customer Account Dossier
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} fontSize="xs">
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Full Name</Text>
                        <Text fontWeight="semibold" color="gray.800" fontSize="sm">{userName}</Text>
                      </Box>
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Mobile Phone</Text>
                        <Text fontWeight="semibold" color="gray.800" fontSize="sm">{userPhone}</Text>
                      </Box>
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Email Address</Text>
                        <Text fontWeight="semibold" color="gray.800" fontSize="sm">{userEmail}</Text>
                      </Box>
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Gender</Text>
                        <Text fontWeight="semibold" color="gray.800" fontSize="sm" textTransform="capitalize">
                          {selectedUser.gender || selectedUser.profile?.gender || "Not specified"}
                        </Text>
                      </Box>
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Registration Date</Text>
                        <HStack spacing={1} color="gray.800" fontWeight="semibold" fontSize="sm" mt={0.5}>
                          <FaCalendarAlt size="11px" color="#94a3b8" />
                          <Text>
                            {selectedUser.createdAt
                              ? new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </Text>
                        </HStack>
                      </Box>
                      <Box p={2.5} bg="gray.50" borderRadius="lg">
                        <Text color="gray.500" fontSize="2xs">Last Login</Text>
                        <HStack spacing={1} color="gray.800" fontWeight="semibold" fontSize="sm" mt={0.5}>
                          <FaClock size="11px" color="#94a3b8" />
                          <Text>
                            {selectedUser.lastLoginAt
                              ? new Date(selectedUser.lastLoginAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "No record"}
                          </Text>
                        </HStack>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {/* Customer Addresses Card */}
                  <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex align="center" gap={1.5}>
                        <FaMapMarkerAlt size="12px" color="#008080" />
                        <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider" textTransform="uppercase">
                          Customer Saved Addresses ({savedAddresses.length})
                        </Text>
                      </Flex>
                    </Flex>

                    {savedAddresses.length > 0 ? (
                      <VStack spacing={2.5} align="stretch">
                        {savedAddresses.map((addr, idx) => (
                          <Box
                            key={addr._id || idx}
                            p={3}
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="lg"
                            bg="gray.50"
                          >
                            <Flex justify="space-between" align="center" mb={1.5}>
                              <HStack spacing={2}>
                                <Badge colorScheme="teal" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                                  {addr.label || `Address #${idx + 1}`}
                                </Badge>
                                {addr.isDefault && (
                                  <Badge colorScheme="green" fontSize="2xs" px={1.5} py={0.5} borderRadius="md">
                                    Default
                                  </Badge>
                                )}
                              </HStack>
                              {(addr.city || addr.state) && (
                                <Text fontSize="2xs" fontWeight="bold" color="gray.600">
                                  📍 {addr.city ? `${addr.city}, ` : ""}{addr.state || ""}
                                </Text>
                              )}
                            </Flex>
                            <Text fontSize="xs" color="gray.700" lineHeight="short">
                              {addr.addressLine || addr.street || addr.address || "No address line"}
                            </Text>
                            <HStack spacing={3} mt={2} fontSize="2xs" color="gray.500">
                              {addr.pincode && <Text>PIN: {addr.pincode}</Text>}
                              {addr.phone && <Text>Alt Contact: {addr.phone}</Text>}
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Box p={4} bg="gray.50" borderRadius="lg" textAlign="center">
                        <Text fontSize="xs" color="gray.500">
                          No saved addresses on file. Address snapshots from service bookings will be used for dispatches.
                        </Text>
                      </Box>
                    )}
                  </Box>
                </VStack>
              </TabPanel>

              {/* ==================== TAB 2: BOOKINGS & DISPATCHES ==================== */}
              <TabPanel p={0}>
                <VStack spacing={4} align="stretch">
                  {/* Summary Metric Ribbon */}
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2.5}>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" textAlign="center">
                      <Text fontSize="2xs" color="gray.500" fontWeight="bold">TOTAL</Text>
                      <Text fontSize="xl" fontWeight="black" color="gray.800">{userBookings.length}</Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" textAlign="center">
                      <Text fontSize="2xs" color="blue.500" fontWeight="bold">ACTIVE</Text>
                      <Text fontSize="xl" fontWeight="black" color="blue.600">{activeCount}</Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" textAlign="center">
                      <Text fontSize="2xs" color="green.500" fontWeight="bold">COMPLETED</Text>
                      <Text fontSize="xl" fontWeight="black" color="green.600">{completedCount}</Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" textAlign="center">
                      <Text fontSize="2xs" color="red.500" fontWeight="bold">CANCELLED</Text>
                      <Text fontSize="xl" fontWeight="black" color="red.600">{cancelledCount}</Text>
                    </Box>
                  </SimpleGrid>

                  {/* Booking Item Cards */}
                  {userBookings.length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      {userBookings.map((booking, idx) => {
                        const bId = booking._id || booking.id || `booking-${idx}`;
                        const serviceName =
                          booking.serviceName ||
                          booking.serviceId?.serviceName ||
                          booking.serviceId?.name ||
                          "Field Service";
                        const scheduledDate = booking.scheduledDate || booking.date;
                        const slot = booking.timeSlot || booking.slot || "Regular Slot";
                        const status = booking.status || "pending";

                        // Technician allocation details
                        const techObj =
                          typeof booking.technicianId === "object" && booking.technicianId
                            ? booking.technicianId.userId || booking.technicianId
                            : null;
                        const techName = techObj
                          ? `${techObj.fname || techObj.firstName || ""} ${techObj.lname || techObj.lastName || ""}`.trim() || techObj.name
                          : booking.technicianName || null;
                        const techPhone = techObj?.mobileNumber || techObj?.phone || booking.technicianPhone || null;

                        return (
                          <Box
                            key={bId}
                            p={4}
                            bg="white"
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="gray.200"
                            shadow="xs"
                          >
                            <Flex justify="space-between" align="flex-start" mb={2}>
                              <Box>
                                <HStack spacing={2}>
                                  <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                    {serviceName}
                                  </Text>
                                  <Badge fontFamily="mono" fontSize="3xs" px={1.5} py={0.5} borderRadius="md" colorScheme="gray">
                                    #{String(bId).slice(-6).toUpperCase()}
                                  </Badge>
                                </HStack>
                                <HStack spacing={2} fontSize="2xs" color="gray.500" mt={1}>
                                  <FaCalendarAlt size="10px" />
                                  <Text>
                                    {scheduledDate
                                      ? new Date(scheduledDate).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Date not specified"}{" "}
                                    • {slot}
                                  </Text>
                                </HStack>
                              </Box>
                              <StatusBadge
                                colorScheme={
                                  status === "completed"
                                    ? "green"
                                    : status === "cancelled"
                                    ? "red"
                                    : status === "in-progress"
                                    ? "purple"
                                    : "orange"
                                }
                                label={status}
                                variant="subtle"
                              />
                            </Flex>

                            <Divider my={2.5} borderColor="gray.100" />

                            {/* Assigned Technician Subcard */}
                            <Box p={2.5} bg="gray.50" borderRadius="lg" fontSize="xs">
                              <Flex justify="space-between" align="center">
                                <Flex align="center" gap={2}>
                                  <Icon as={FaTools} color={techName ? "teal.500" : "gray.400"} boxSize={3} />
                                  <Text fontWeight="semibold" color={techName ? "gray.800" : "gray.500"}>
                                    {techName ? `Tech: ${techName}` : "Technician: Unassigned / Pool"}
                                  </Text>
                                </Flex>
                                {techPhone && (
                                  <Text fontSize="2xs" color="gray.600" fontFamily="mono">
                                    📞 {techPhone}
                                  </Text>
                                )}
                              </Flex>
                            </Box>

                            {/* Booking Price & Address Snapshot */}
                            <Flex justify="space-between" align="center" mt={2.5} fontSize="2xs" color="gray.600">
                              <Text isTruncated maxW="280px">
                                📍 {booking.address?.addressLine || booking.address?.city || "Customer Service Location"}
                              </Text>
                              <Text fontWeight="bold" fontSize="xs" color="teal.700">
                                ₹{Number(booking.paidAmount || booking.totalAmount || 0).toLocaleString("en-IN")}
                              </Text>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Box p={8} bg="white" borderRadius="xl" textAlign="center" border="1px dashed" borderColor="gray.300">
                      <Icon as={FaCalendarAlt} color="gray.300" boxSize={8} mb={2} />
                      <Text fontSize="sm" fontWeight="bold" color="gray.600">No Service Bookings</Text>
                      <Text fontSize="xs" color="gray.400">This customer has not placed any service orders yet.</Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* ==================== TAB 3: FINANCIALS & LTV ==================== */}
              <TabPanel p={0}>
                <VStack spacing={4} align="stretch">
                  {/* Financial KPI Banner */}
                  <Box p={4} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color="teal.700" textTransform="uppercase">
                          Customer Lifetime Value (LTV)
                        </Text>
                        <Text fontSize="2xl" fontWeight="black" color="teal.800" mt={0.5}>
                          ₹{Number(totalPaidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </Text>
                      </Box>
                      <Box textAlign="right">
                        <Text fontSize="2xs" color="teal.600" fontWeight="medium">
                          {successfulBookings.length} of {userBookings.length} orders paid
                        </Text>
                        <Badge colorScheme="teal" fontSize="2xs" px={2} py={0.5} borderRadius="md" mt={1}>
                          Verified Customer
                        </Badge>
                      </Box>
                    </Flex>
                  </Box>

                  {/* Payment History List */}
                  <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider" textTransform="uppercase" mb={3}>
                      Payment & Invoice Records
                    </Text>

                    {userBookings.length > 0 ? (
                      <VStack spacing={2.5} align="stretch">
                        {userBookings.map((b, idx) => {
                          const isPaid = b.paymentStatus === "paid" || b.paymentStatus === "success";
                          const bId = b._id || b.id || idx;
                          const amount = b.paidAmount || b.totalAmount || 0;
                          const method = b.paymentMethod || b.paymentMode || "Online / UPI";

                          return (
                            <Flex
                              key={bId}
                              p={3}
                              justify="space-between"
                              align="center"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="lg"
                              bg="gray.50"
                            >
                              <Box>
                                <HStack spacing={2}>
                                  <Text fontWeight="bold" fontSize="xs" color="gray.800">
                                    {b.serviceName || b.serviceId?.serviceName || "Service Payment"}
                                  </Text>
                                  <Badge fontFamily="mono" fontSize="3xs" px={1.5} py={0.5} borderRadius="md">
                                    #{String(bId).slice(-6).toUpperCase()}
                                  </Badge>
                                </HStack>
                                <HStack spacing={2} fontSize="2xs" color="gray.500" mt={1}>
                                  <Text>Mode: {method}</Text>
                                  <Text>•</Text>
                                  <Text>
                                    {b.createdAt
                                      ? new Date(b.createdAt).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Date unavailable"}
                                  </Text>
                                </HStack>
                              </Box>

                              <Box textAlign="right">
                                <Text fontWeight="extrabold" fontSize="sm" color={isPaid ? "green.600" : "orange.500"}>
                                  ₹{Number(amount).toLocaleString("en-IN")}
                                </Text>
                                <StatusBadge
                                  colorScheme={isPaid ? "green" : "orange"}
                                  label={isPaid ? "Paid" : b.paymentStatus || "Pending"}
                                  variant="subtle"
                                />
                              </Box>
                            </Flex>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Box p={6} bg="gray.50" borderRadius="lg" textAlign="center">
                        <Text fontSize="xs" color="gray.500">No payment transactions recorded for this customer.</Text>
                      </Box>
                    )}
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>

        {/* ==================== DRAWER FOOTER ==================== */}
        <DrawerFooter bg="white" borderTop="1px solid" borderColor="gray.200" px={6} py={3}>
          <Flex justify="space-between" align="center" w="100%">
            {isOwner ? (
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                leftIcon={<FaTrash />}
                onClick={() => {
                  onClose();
                  if (onDeleteClick) onDeleteClick(selectedUser);
                }}
              >
                Delete Account
              </Button>
            ) : (
              <Box />
            )}
            <Button size="sm" onClick={onClose} px={6} colorScheme="teal">
              Done
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
