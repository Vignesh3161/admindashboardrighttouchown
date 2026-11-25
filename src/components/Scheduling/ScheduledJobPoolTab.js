// src/components/Scheduling/ScheduledJobPoolTab.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Skeleton,
  Alert,
  AlertIcon,
  Tag,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorMode,
} from "@chakra-ui/react";
import { FaTruckFast } from "react-icons/fa6";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaEllipsisV,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaMapMarkerAlt,
  FaRedoAlt,
  FaSearch,
  FaTools,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaWrench,
  FaCog,
} from "react-icons/fa";
import Card from "components/Card/Card.js";
import { useAppToast } from "components/feedback";
import TablePagination from "components/common/TablePagination";
import RefreshButton from "components/common/RefreshButton";
import {
  getScheduledPoolBookings,
  reopenScheduledPoolJob,
} from "api/scheduling";
import { ADMIN_SCHEDULED_POOL_EVENT } from "hooks/useAdminSocket";
import {
  formatFriendlyDateTime,
  formatFriendlyCurrency,
  formatFriendlyAddress,
} from "./schedulingFormatters";

import EligibleTechniciansDiscoveryModal from "./EligibleTechniciansDiscoveryModal";
import EmergencyReassignModal from "./EmergencyReassignModal";
import PoolReviewNotesModal from "./PoolReviewNotesModal";
import PoolConfigModal from "./PoolConfigModal";

export default function ScheduledJobPoolTab({
  onOpenDrawer,
  districts = [],
  onUrgentCountChange,
}) {
  const toast = useAppToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [statusFilter, setStatusFilter] = useState("in_review");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [bookings, setBookings] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reopeningId, setReopeningId] = useState(null);

  // Pool KPI state
  const [counts, setCounts] = useState({
    in_review: 0,
    unassigned: 0,
    assigned: 0,
    overdue: 0,
    all: 0,
  });

  // Modals state
  const [selectedDiscoveryBooking, setSelectedDiscoveryBooking] = useState(null);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

  const [selectedReassignBooking, setSelectedReassignBooking] = useState(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Fetch pool bookings
  const fetchPoolData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {
        status: statusFilter,
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (districtFilter !== "ALL") params.districtId = districtFilter;

      const res = await getScheduledPoolBookings(params);
      const data = res?.result || res || {};
      const docs = Array.isArray(data.docs) ? data.docs : Array.isArray(data) ? data : [];

      setBookings(docs);
      setTotalDocs(data.totalDocs || docs.length || 0);
      setTotalPages(data.totalPages || 1);

      // Update counts if returned
      if (data.counts) {
        setCounts(data.counts);
        if (onUrgentCountChange) {
          onUrgentCountChange(data.counts.in_review || 0);
        }
      } else {
        // Derive count if counts object not provided
        const urgent = docs.filter(
          (b) => b?.scheduledPool?.adminReviewStatus === "open"
        ).length;
        if (onUrgentCountChange) {
          onUrgentCountChange(urgent);
        }
      }
    } catch (err) {
      console.error("fetchPoolData error:", err);
      toast({
        title: "Pool Load Error",
        description: err?.message || "Failed to load scheduled pool bookings.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page, limit, search, districtFilter, toast, onUrgentCountChange]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  // Real-time Socket.IO Listener
  useEffect(() => {
    const handlePoolSocketEvent = (e) => {
      const { event, payload } = e?.detail || {};
      console.log("ScheduledPoolTab received live socket event:", event, payload);

      if (event === "scheduled_pool_escalated") {
        toast({
          title: "Urgent Escalation Alert",
          description: `Booking #${String(payload?.bookingId || "").slice(-6)} has escalated to Admin Review!`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (event === "scheduled_pool_overdue") {
        toast({
          title: "Booking Overdue",
          description: `Booking #${String(payload?.bookingId || "").slice(-6)} passed scheduled time.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else if (event === "scheduled_pool_claimed") {
        toast({
          title: "Job Claimed",
          description: `Booking #${String(payload?.bookingId || "").slice(-6)} claimed by a technician.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else if (event === "scheduled_pool_reopened") {
        toast({
          title: "Job Reopened to Pool",
          description: `Booking #${String(payload?.bookingId || "").slice(-6)} reopened for technician claims.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      // Live refresh data silently
      fetchPoolData(true);
    };

    window.addEventListener(ADMIN_SCHEDULED_POOL_EVENT, handlePoolSocketEvent);
    return () => {
      window.removeEventListener(ADMIN_SCHEDULED_POOL_EVENT, handlePoolSocketEvent);
    };
  }, [fetchPoolData, toast]);

  // Reopen Action
  const handleReopen = async (booking) => {
    const bookingId = booking?._id || booking?.id;
    if (!bookingId) return;

    try {
      setReopeningId(bookingId);
      await reopenScheduledPoolJob(bookingId);
      toast({
        title: "Job Reopened to Pool",
        description: "Booking is now available in technician pool feeds.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchPoolData(true);
    } catch (err) {
      console.error("handleReopen error:", err);
      toast({
        title: "Reopen Failed",
        description: err?.message || "Could not reopen booking.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setReopeningId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text).trim());
    toast({
      title: "Copied to clipboard",
      description: `${label}: ${text}`,
      status: "info",
      duration: 1500,
    });
  };

  // Helper for appointment countdown
  const getAppointmentCountdown = (scheduledAt) => {
    if (!scheduledAt) return null;
    const now = Date.now();
    const apptTime = new Date(scheduledAt).getTime();
    const diffMs = apptTime - now;

    if (diffMs < 0) {
      const overdueMins = Math.floor(Math.abs(diffMs) / 60000);
      return {
        label: `Overdue by ${overdueMins > 60 ? `${Math.floor(overdueMins / 60)}h` : `${overdueMins}m`}`,
        isOverdue: true,
      };
    }
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return {
      label: `In ${hrs ? `${hrs}h ` : ""}${remainingMins}m`,
      isOverdue: false,
      isUrgent: mins <= 120,
    };
  };

  return (
    <Box>
      {/* 1. TOP LIVE KPI METRICS CARDS */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        {/* KPI 1: URGENT IN-REVIEW */}
        <Card
          p={3.5}
          borderRadius="12px"
          border="1px solid"
          borderColor={counts.in_review > 0 ? "red.400" : isDark ? "gray.700" : "gray.200"}
          bg={counts.in_review > 0 ? (isDark ? "red.900" : "red.50") : isDark ? "gray.800" : "white"}
          cursor="pointer"
          onClick={() => {
            setStatusFilter("in_review");
            setPage(1);
          }}
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                Urgent In-Review
              </Text>
              <HStack spacing={2} align="baseline" mt={1}>
                <Text fontSize="2xl" fontWeight="800" color={counts.in_review > 0 ? "red.600" : isDark ? "white" : "gray.800"}>
                  {counts.in_review}
                </Text>
                {counts.in_review > 0 && (
                  <Badge colorScheme="red" variant="solid" borderRadius="full" fontSize="2xs" px={1.5}>
                    Action Required
                  </Badge>
                )}
              </HStack>
            </Box>
            <Flex
              w="36px"
              h="36px"
              borderRadius="10px"
              bg={counts.in_review > 0 ? "red.100" : "gray.100"}
              color={counts.in_review > 0 ? "red.600" : "gray.500"}
              align="center"
              justify="center"
            >
              <Icon as={FaExclamationTriangle} boxSize={4} />
            </Flex>
          </Flex>
        </Card>

        {/* KPI 2: OPEN IN POOL */}
        <Card
          p={3.5}
          borderRadius="12px"
          border="1px solid"
          borderColor={isDark ? "gray.700" : "gray.200"}
          bg={isDark ? "gray.800" : "white"}
          cursor="pointer"
          onClick={() => {
            setStatusFilter("unassigned");
            setPage(1);
          }}
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                Open in Pool
              </Text>
              <Text fontSize="2xl" fontWeight="800" color="teal.600" mt={1}>
                {counts.unassigned}
              </Text>
            </Box>
            <Flex
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="teal.50"
              color="teal.600"
              align="center"
              justify="center"
            >
              <Icon as={FaBullhorn} boxSize={4} />
            </Flex>
          </Flex>
        </Card>

        {/* KPI 3: ASSIGNED */}
        <Card
          p={3.5}
          borderRadius="12px"
          border="1px solid"
          borderColor={isDark ? "gray.700" : "gray.200"}
          bg={isDark ? "gray.800" : "white"}
          cursor="pointer"
          onClick={() => {
            setStatusFilter("assigned");
            setPage(1);
          }}
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                Assigned / Confirmed
              </Text>
              <Text fontSize="2xl" fontWeight="800" color="green.600" mt={1}>
                {counts.assigned}
              </Text>
            </Box>
            <Flex
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="green.50"
              color="green.600"
              align="center"
              justify="center"
            >
              <Icon as={FaUserCheck} boxSize={4} />
            </Flex>
          </Flex>
        </Card>

        {/* KPI 4: OVERDUE */}
        <Card
          p={3.5}
          borderRadius="12px"
          border="1px solid"
          borderColor={isDark ? "gray.700" : "gray.200"}
          bg={isDark ? "gray.800" : "white"}
          cursor="pointer"
          onClick={() => {
            setStatusFilter("overdue");
            setPage(1);
          }}
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                Overdue Appointments
              </Text>
              <Text fontSize="2xl" fontWeight="800" color={counts.overdue > 0 ? "orange.600" : "gray.600"} mt={1}>
                {counts.overdue}
              </Text>
            </Box>
            <Flex
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="orange.50"
              color="orange.600"
              align="center"
              justify="center"
            >
              <Icon as={FaClock} boxSize={4} />
            </Flex>
          </Flex>
        </Card>
      </SimpleGrid>

      {/* 2. URGENT ESCALATION ALERT BANNER */}
      {counts.in_review > 0 && statusFilter !== "in_review" && (
        <Alert
          status="error"
          borderRadius="12px"
          mb={4}
          p={3}
          border="1px solid"
          borderColor="red.300"
        >
          <AlertIcon />
          <Box flex="1">
            <Text fontSize="xs" fontWeight="700">
              {counts.in_review} Scheduled Booking{counts.in_review > 1 ? "s" : ""} in Urgent Admin Review!
            </Text>
            <Text fontSize="2xs" color="gray.600">
              Unclaimed bookings have hit the 2-hour window or technician cancelled &lt; 2h before appointment.
            </Text>
          </Box>
          <Button
            size="xs"
            colorScheme="red"
            borderRadius="6px"
            onClick={() => {
              setStatusFilter("in_review");
              setPage(1);
            }}
          >
            Review Escalations
          </Button>
        </Alert>
      )}

      {/* 3. FILTER TOOLBAR & ACTIONS */}
      <Card p={3} mb={3} borderRadius="12px">
        <Flex
          direction={{ base: "column", lg: "row" }}
          justify="space-between"
          align={{ base: "stretch", lg: "center" }}
          gap={3}
        >
          {/* Status Sub-Tabs */}
          <HStack spacing={1.5} overflowX="auto" pb={{ base: 2, lg: 0 }}>
            {[
              { key: "in_review", label: "In Review", count: counts.in_review, color: "red" },
              { key: "unassigned", label: "Open in Pool", count: counts.unassigned, color: "teal" },
              { key: "assigned", label: "Assigned", count: counts.assigned, color: "green" },
              { key: "overdue", label: "Overdue", count: counts.overdue, color: "orange" },
              { key: "all", label: "All Bookings", count: totalDocs, color: "gray" },
            ].map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <Button
                  key={tab.key}
                  size="xs"
                  borderRadius="full"
                  variant={isSelected ? "solid" : "ghost"}
                  colorScheme={tab.color}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  fontWeight={isSelected ? "800" : "600"}
                  px={3}
                  h="28px"
                >
                  <HStack spacing={1.5}>
                    <Text>{tab.label}</Text>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <Badge
                        colorScheme={isSelected ? "whiteAlpha" : tab.color}
                        variant={isSelected ? "solid" : "subtle"}
                        borderRadius="full"
                        fontSize="2xs"
                        px={1.5}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </HStack>
                </Button>
              );
            })}
          </HStack>

          {/* Search, District Filter, and Controls */}
          <HStack spacing={2} flexWrap="wrap">
            <InputGroup size="xs" maxW="220px">
              <Input
                placeholder="Search booking, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                borderRadius="6px"
                bg={isDark ? "gray.800" : "white"}
              />
              <InputRightElement>
                <Icon as={FaSearch} color="gray.400" />
              </InputRightElement>
            </InputGroup>

            <Select
              size="xs"
              maxW="180px"
              borderRadius="6px"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              bg={isDark ? "gray.800" : "white"}
            >
              <option value="ALL">All Districts ({districts.length})</option>
              {districts.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name || d.districtName}
                </option>
              ))}
            </Select>

            <RefreshButton
              onClick={() => fetchPoolData()}
              isLoading={loading || refreshing}
              size="xs"
            />

            <Tooltip label="Runtime Pool Settings (Toggle master flag, lead time)">
              <IconButton
                size="xs"
                variant="outline"
                icon={<FaCog />}
                onClick={() => setIsConfigOpen(true)}
                aria-label="Pool Settings"
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Card>

      {/* 4. POOL BOOKINGS TABLE */}
      <Card p={0} borderRadius="12px" overflow="hidden">
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead bg={isDark ? "gray.800" : "gray.50"}>
              <Tr>
                <Th fontSize="2xs" py={3}>Booking / Customer</Th>
                <Th fontSize="2xs" py={3}>Service Details</Th>
                <Th fontSize="2xs" py={3}>Appointment Window</Th>
                <Th fontSize="2xs" py={3}>Pool Status</Th>
                <Th fontSize="2xs" py={3}>Assigned Tech</Th>
                <Th fontSize="2xs" py={3} textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <Tr key={idx}>
                    <Td colSpan={6} py={4}>
                      <Skeleton h="24px" />
                    </Td>
                  </Tr>
                ))
              ) : bookings.length === 0 ? (
                <Tr>
                  <Td colSpan={6} py={10} textAlign="center">
                    <Icon as={FaCalendarAlt} boxSize={8} color="gray.400" mb={2} />
                    <Text fontSize="sm" fontWeight="700" color="gray.600">
                      No Scheduled Bookings Found
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      There are currently no bookings matching the selected status and filters.
                    </Text>
                  </Td>
                </Tr>
              ) : (
                bookings.map((booking) => {
                  const bId = booking._id || booking.id || "";
                  const shortId = bId ? bId.slice(-6).toUpperCase() : "—";
                  const pool = booking.scheduledPool || {};
                  const isEscalated = pool.adminReviewStatus === "open";
                  const isAssigned = Boolean(booking.technicianId || booking.assignedTechnician);
                  const isReopening = reopeningId === bId;

                  const customerName =
                    booking.customerId?.fname || booking.customerId?.name
                      ? `${booking.customerId?.fname || ""} ${booking.customerId?.lname || ""}`.trim()
                      : booking.customerName || "Customer";

                  const customerPhone =
                    booking.customerId?.mobileNumber ||
                    booking.customerId?.mobile ||
                    booking.customerPhone ||
                    "";

                  const serviceName =
                    booking.serviceId?.serviceName ||
                    booking.serviceName ||
                    "Service";

                  const slotLabel = booking.slotLabel || "Slot";
                  const countdown = getAppointmentCountdown(booking.scheduledAt);
                  const address = formatFriendlyAddress(booking.address || booking.addressSnapshot);

                  // Assigned tech details
                  const tech = booking.technicianId || booking.assignedTechnician;
                  const techName = typeof tech === "object" ? tech?.fname || tech?.name : null;

                  return (
                    <Tr
                      key={bId}
                      bg={isEscalated ? (isDark ? "red.900" : "red.50") : undefined}
                      _hover={{ bg: isDark ? "gray.750" : "gray.50" }}
                    >
                      {/* Booking / Customer */}
                      <Td py={3}>
                        <VStack align="flex-start" spacing={0.5}>
                          <HStack spacing={1.5}>
                            <Badge colorScheme="purple" fontSize="2xs" px={1.5} borderRadius="sm">
                              #{shortId}
                            </Badge>
                            <Tooltip label="Copy Booking ID">
                              <IconButton
                                size="2xs"
                                variant="ghost"
                                icon={<FaCopy />}
                                onClick={() => copyToClipboard(bId, "Booking ID")}
                                aria-label="Copy ID"
                              />
                            </Tooltip>
                          </HStack>
                          <Text fontWeight="700" fontSize="xs">
                            {customerName}
                          </Text>
                          {customerPhone && (
                            <Text fontSize="2xs" color="gray.500">
                              {customerPhone}
                            </Text>
                          )}
                          <Text fontSize="2xs" color="gray.400" noOfLines={1} maxW="200px" title={address}>
                            {address}
                          </Text>
                        </VStack>
                      </Td>

                      {/* Service */}
                      <Td py={3}>
                        <VStack align="flex-start" spacing={0.5}>
                          <Text fontWeight="700" fontSize="xs">
                            {serviceName}
                          </Text>
                          {typeof booking.totalAmount === "number" && (
                            <Text fontSize="2xs" color="teal.600" fontWeight="600">
                              {formatFriendlyCurrency(booking.totalAmount)}
                            </Text>
                          )}
                        </VStack>
                      </Td>

                      {/* Appointment Window */}
                      <Td py={3}>
                        <VStack align="flex-start" spacing={0.5}>
                          <HStack spacing={1}>
                            <Icon as={FaCalendarAlt} color="purple.500" boxSize={3} />
                            <Text fontWeight="700" fontSize="xs">
                              {slotLabel}
                            </Text>
                          </HStack>
                          {booking.scheduledAt && (
                            <Text fontSize="2xs" color="gray.500">
                              {formatFriendlyDateTime(booking.scheduledAt)}
                            </Text>
                          )}
                          {countdown && (
                            <Badge
                              colorScheme={countdown.isOverdue ? "red" : countdown.isUrgent ? "orange" : "teal"}
                              fontSize="2xs"
                              px={1.5}
                              borderRadius="full"
                            >
                              {countdown.label}
                            </Badge>
                          )}
                        </VStack>
                      </Td>

                      {/* Pool Status */}
                      <Td py={3}>
                        <VStack align="flex-start" spacing={1}>
                          {isEscalated ? (
                            <Badge colorScheme="red" variant="solid" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                              Urgent Escalation
                            </Badge>
                          ) : isAssigned ? (
                            <Badge colorScheme="green" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                              Assigned
                            </Badge>
                          ) : (
                            <Badge colorScheme="teal" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                              Open in Pool
                            </Badge>
                          )}

                          {pool.adminEscalationReason && (
                            <Text fontSize="2xs" color="red.500" fontWeight="600">
                              Reason: {pool.adminEscalationReason.replaceAll("_", " ")}
                            </Text>
                          )}

                          {pool.reviewNote && (
                            <Text fontSize="2xs" color="gray.500" noOfLines={1} maxW="180px" title={pool.reviewNote}>
                              Note: {pool.reviewNote}
                            </Text>
                          )}
                        </VStack>
                      </Td>

                      {/* Assigned Tech */}
                      <Td py={3}>
                        {techName ? (
                          <HStack spacing={2}>
                            <Icon as={FaUserCheck} color="green.500" />
                            <Box>
                              <Text fontWeight="700" fontSize="xs">
                                {techName}
                              </Text>
                              {tech.mobile && (
                                <Text fontSize="2xs" color="gray.500">
                                  {tech.mobile}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            Unassigned
                          </Text>
                        )}
                      </Td>

                      {/* Actions */}
                      <Td py={3} textAlign="right">
                        <HStack spacing={1.5} justify="flex-end">
                          {/* 1. If Unassigned or Escalated: Direct Find Tech Button */}
                          {!isAssigned && (
                            <Button
                              size="xs"
                              colorScheme="teal"
                              borderRadius="6px"
                              fontWeight="700"
                              onClick={() => {
                                setSelectedDiscoveryBooking(booking);
                                setIsDiscoveryOpen(true);
                              }}
                            >
                              Find Tech
                            </Button>
                          )}

                          {/* 2. If Assigned: Emergency Reassign Button */}
                          {isAssigned && (
                            <Button
                              size="xs"
                              colorScheme="orange"
                              variant="outline"
                              borderRadius="6px"
                              fontWeight="700"
                              onClick={() => {
                                setSelectedReassignBooking(booking);
                                setIsReassignOpen(true);
                              }}
                            >
                              Reassign
                            </Button>
                          )}

                          {/* 3. Action Menu */}
                          <Menu isLazy>
                            <MenuButton
                              as={IconButton}
                              size="xs"
                              variant="ghost"
                              icon={<FaEllipsisV />}
                              aria-label="More actions"
                            />
                            <MenuList fontSize="xs">
                              {onOpenDrawer && (
                                <MenuItem
                                  icon={<FaEye />}
                                  onClick={() => onOpenDrawer(bId)}
                                >
                                  View Full Booking Details
                                </MenuItem>
                              )}

                              <MenuItem
                                icon={<FaTools />}
                                onClick={() => {
                                  setSelectedDiscoveryBooking(booking);
                                  setIsDiscoveryOpen(true);
                                }}
                              >
                                Discover Candidate Technicians
                              </MenuItem>

                              {isEscalated && (
                                <MenuItem
                                  icon={<FaBullhorn />}
                                  onClick={() => handleReopen(booking)}
                                  isDisabled={isReopening}
                                >
                                  Reopen to Pool
                                </MenuItem>
                              )}

                              {isAssigned && (
                                <MenuItem
                                  icon={<FaUserTimes />}
                                  onClick={() => {
                                    setSelectedReassignBooking(booking);
                                    setIsReassignOpen(true);
                                  }}
                                >
                                  Emergency Reassign (Swap)
                                </MenuItem>
                              )}

                              <MenuDivider />

                              <MenuItem
                                icon={<FaCalendarAlt />}
                                onClick={() => {
                                  setSelectedReviewBooking(booking);
                                  setIsReviewOpen(true);
                                }}
                              >
                                Review Status &amp; Notes
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        {totalDocs > 0 && (
          <Box p={3} borderTop="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
            <TablePagination
              page={page}
              limit={limit}
              totalDocs={totalDocs}
              totalPages={totalPages}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </Box>
        )}
      </Card>

      {/* 5. MODALS */}
      {/* Discovery Modal */}
      {selectedDiscoveryBooking && (
        <EligibleTechniciansDiscoveryModal
          isOpen={isDiscoveryOpen}
          onClose={() => {
            setIsDiscoveryOpen(false);
            setSelectedDiscoveryBooking(null);
          }}
          booking={selectedDiscoveryBooking}
          onAssignSuccess={() => fetchPoolData(true)}
        />
      )}

      {/* Emergency Reassign Modal */}
      {selectedReassignBooking && (
        <EmergencyReassignModal
          isOpen={isReassignOpen}
          onClose={() => {
            setIsReassignOpen(false);
            setSelectedReassignBooking(null);
          }}
          booking={selectedReassignBooking}
          onReassignSuccess={() => fetchPoolData(true)}
        />
      )}

      {/* Review Notes Modal */}
      {selectedReviewBooking && (
        <PoolReviewNotesModal
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setSelectedReviewBooking(null);
          }}
          booking={selectedReviewBooking}
          onReviewSaved={() => fetchPoolData(true)}
        />
      )}

      {/* Runtime Configuration Modal */}
      <PoolConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => fetchPoolData(true)}
      />
    </Box>
  );
}
