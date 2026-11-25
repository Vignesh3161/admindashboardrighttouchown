// src/components/Scheduling/EligibleTechniciansDiscoveryModal.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  SimpleGrid,
  Alert,
  AlertIcon,
  useColorMode,
} from "@chakra-ui/react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaRoute,
  FaPhoneAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaUserClock,
} from "react-icons/fa";
import { useAppToast } from "components/feedback";
import { getEligibleTechnicians, assignScheduledPoolJob } from "api/scheduling";
import {
  formatFriendlyDateTime,
  formatFriendlyAddress,
} from "./schedulingFormatters";

const REASON_COLORS = {
  SLOT_CONFLICT: "red",
  TECHNICIAN_NOT_VERIFIED: "orange",
  ACTIVE_JOB_IN_PROGRESS: "purple",
  OUT_OF_RANGE: "gray",
  TECHNICIAN_OFFLINE: "yellow",
};

export default function EligibleTechniciansDiscoveryModal({
  isOpen,
  onClose,
  booking,
  onAssignSuccess,
}) {
  const toast = useAppToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [discoveryData, setDiscoveryData] = useState({ eligible: [], ineligible: [] });
  const [error, setError] = useState("");

  const bookingId = booking?._id || booking?.id || "";

  const fetchCandidates = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError("");
      const res = await getEligibleTechnicians(bookingId);
      if (res && res.success) {
        setDiscoveryData(res.result || { eligible: [], ineligible: [] });
      } else {
        setDiscoveryData({
          eligible: res?.eligible || [],
          ineligible: res?.ineligible || [],
        });
      }
    } catch (err) {
      console.error("fetchCandidates error:", err);
      setError(err?.message || "Failed to discover candidate technicians.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchCandidates();
    } else {
      setDiscoveryData({ eligible: [], ineligible: [] });
      setError("");
      setAssigningId(null);
    }
  }, [isOpen, bookingId, fetchCandidates]);

  const handleAssign = async (tech) => {
    const techId = tech.technicianId || tech._id || tech.id;
    if (!bookingId || !techId) return;

    try {
      setAssigningId(techId);
      await assignScheduledPoolJob(bookingId, {
        technicianProfileId: techId,
      });

      toast({
        title: "Technician Assigned Successfully",
        description: `${tech.name || "Technician"} has been assigned to this scheduled booking.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });

      if (onAssignSuccess) onAssignSuccess(tech);
      onClose();
    } catch (err) {
      console.error("handleAssign error:", err);
      toast({
        title: "Assignment Failed",
        description: err?.message || "Could not assign technician to this booking.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setAssigningId(null);
    }
  };

  const serviceName =
    booking?.serviceId?.serviceName ||
    booking?.serviceName ||
    booking?.serviceSnapshot?.serviceName ||
    "Scheduled Service";

  const customerName =
    booking?.customerId?.fname || booking?.customerId?.name
      ? `${booking?.customerId?.fname || ""} ${booking?.customerId?.lname || ""}`.trim()
      : booking?.customerName || "Customer";

  const customerPhone =
    booking?.customerId?.mobileNumber ||
    booking?.customerId?.mobile ||
    booking?.customerPhone ||
    "No phone";

  const slotLabel = booking?.slotLabel || "Appointment Slot";
  const scheduledDate = booking?.scheduledAt
    ? formatFriendlyDateTime(booking.scheduledAt)
    : "";

  const address = formatFriendlyAddress(booking?.address || booking?.addressSnapshot);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <ModalContent
        borderRadius="16px"
        bg={isDark ? "gray.850" : "white"}
        border="1px solid"
        borderColor={isDark ? "gray.700" : "gray.200"}
        shadow="2xl"
      >
        <ModalHeader pb={2}>
          <Flex justify="space-between" align="flex-start" pr={6}>
            <Box>
              <HStack spacing={2} mb={1}>
                <Badge colorScheme="purple" borderRadius="md" px={2} py={0.5} fontSize="xs" fontWeight="700">
                  Technician Discovery
                </Badge>
                <Badge colorScheme="teal" borderRadius="md" px={2} py={0.5} fontSize="xs">
                  {slotLabel}
                </Badge>
              </HStack>
              <Text fontSize="lg" fontWeight="800" color={isDark ? "white" : "gray.800"}>
                {serviceName}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody pt={1} pb={4}>
          {/* Booking Context Banner */}
          <Box
            p={3}
            mb={4}
            borderRadius="10px"
            bg={isDark ? "gray.800" : "gray.50"}
            border="1px solid"
            borderColor={isDark ? "gray.700" : "gray.200"}
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} fontSize="xs">
              <HStack align="flex-start" spacing={2}>
                <Icon as={FaCalendarAlt} color="purple.500" mt={0.5} />
                <Box>
                  <Text fontWeight="700" color={isDark ? "gray.300" : "gray.700"}>
                    {slotLabel}
                  </Text>
                  <Text color="gray.500">{scheduledDate}</Text>
                </Box>
              </HStack>
              <HStack align="flex-start" spacing={2}>
                <Icon as={FaMapMarkerAlt} color="teal.500" mt={0.5} />
                <Box>
                  <Text fontWeight="700" color={isDark ? "gray.300" : "gray.700"}>
                    {customerName} • {customerPhone}
                  </Text>
                  <Text color="gray.500" noOfLines={1} title={address}>
                    {address || "Address unavailable"}
                  </Text>
                </Box>
              </HStack>
            </SimpleGrid>
          </Box>

          {error && (
            <Alert status="error" borderRadius="8px" mb={4} fontSize="xs">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Discovery Tabs */}
          <Tabs colorScheme="teal" variant="soft-rounded" size="sm">
            <TabList mb={3}>
              <Tab fontWeight="700">
                <HStack spacing={1.5}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text>Eligible Technicians</Text>
                  <Badge colorScheme="green" borderRadius="full" px={2} fontSize="2xs">
                    {loading ? "..." : discoveryData.eligible?.length || 0}
                  </Badge>
                </HStack>
              </Tab>
              <Tab fontWeight="700">
                <HStack spacing={1.5}>
                  <Icon as={FaTimesCircle} color="red.500" />
                  <Text>Ineligible / Disqualified</Text>
                  <Badge colorScheme="gray" borderRadius="full" px={2} fontSize="2xs">
                    {loading ? "..." : discoveryData.ineligible?.length || 0}
                  </Badge>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* TAB 1: ELIGIBLE TECHNICIANS */}
              <TabPanel p={0}>
                {loading ? (
                  <VStack spacing={3} align="stretch">
                    <Skeleton h="64px" borderRadius="10px" />
                    <Skeleton h="64px" borderRadius="10px" />
                    <Skeleton h="64px" borderRadius="10px" />
                  </VStack>
                ) : discoveryData.eligible?.length === 0 ? (
                  <Box
                    py={8}
                    textAlign="center"
                    borderRadius="12px"
                    border="1px dashed"
                    borderColor={isDark ? "gray.700" : "gray.300"}
                  >
                    <Icon as={FaExclamationTriangle} color="orange.400" boxSize={8} mb={2} />
                    <Text fontWeight="700" fontSize="sm" color={isDark ? "white" : "gray.800"}>
                      No Eligible Technicians Available
                    </Text>
                    <Text fontSize="xs" color="gray.500" maxW="400px" mx="auto" mt={1}>
                      No technicians in this district currently meet all verification, proximity, and slot availability prerequisites.
                    </Text>
                  </Box>
                ) : (
                  <VStack spacing={2.5} align="stretch">
                    {discoveryData.eligible.map((tech) => {
                      const techId = tech.technicianId || tech._id || tech.id;
                      const isAssigning = assigningId === techId;

                      return (
                        <Flex
                          key={techId}
                          p={3}
                          borderRadius="10px"
                          border="1px solid"
                          borderColor={isDark ? "gray.700" : "gray.200"}
                          bg={isDark ? "gray.800" : "white"}
                          _hover={{ borderColor: "teal.400", shadow: "sm" }}
                          align="center"
                          justify="space-between"
                          gap={3}
                        >
                          <HStack spacing={3} flex="1">
                            <Box position="relative">
                              <Avatar size="sm" name={tech.name || "Technician"} />
                              <Box
                                position="absolute"
                                bottom={0}
                                right={0}
                                w="8px"
                                h="8px"
                                borderRadius="full"
                                bg={tech.isOnline ? "green.400" : "gray.400"}
                                border="1px solid white"
                              />
                            </Box>
                            <Box>
                              <HStack spacing={2}>
                                <Text fontWeight="700" fontSize="sm" color={isDark ? "white" : "gray.800"}>
                                  {tech.name || "Technician"}
                                </Text>
                                <Badge colorScheme="green" fontSize="2xs" px={1.5} borderRadius="sm">
                                  Approved
                                </Badge>
                              </HStack>
                              <HStack spacing={3} mt={0.5} fontSize="xs" color="gray.500">
                                {tech.mobile && (
                                  <HStack spacing={1}>
                                    <Icon as={FaPhoneAlt} boxSize={2.5} />
                                    <Text>{tech.mobile}</Text>
                                  </HStack>
                                )}
                                {typeof tech.distanceKm === "number" && (
                                  <HStack spacing={1} color="teal.600" fontWeight="600">
                                    <Icon as={FaRoute} boxSize={2.5} />
                                    <Text>{tech.distanceKm.toFixed(1)} km away</Text>
                                  </HStack>
                                )}
                                {typeof tech.committedJobsCount === "number" && (
                                  <HStack spacing={1}>
                                    <Icon as={FaUserClock} boxSize={2.5} />
                                    <Text>{tech.committedJobsCount} jobs committed</Text>
                                  </HStack>
                                )}
                              </HStack>
                            </Box>
                          </HStack>

                          <Button
                            size="sm"
                            colorScheme="teal"
                            borderRadius="8px"
                            fontWeight="700"
                            onClick={() => handleAssign(tech)}
                            isLoading={isAssigning}
                            px={4}
                          >
                            Assign
                          </Button>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </TabPanel>

              {/* TAB 2: INELIGIBLE TECHNICIANS */}
              <TabPanel p={0}>
                {loading ? (
                  <VStack spacing={3} align="stretch">
                    <Skeleton h="64px" borderRadius="10px" />
                    <Skeleton h="64px" borderRadius="10px" />
                  </VStack>
                ) : discoveryData.ineligible?.length === 0 ? (
                  <Box py={8} textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      No disqualified technicians recorded for this slot.
                    </Text>
                  </Box>
                ) : (
                  <VStack spacing={2.5} align="stretch">
                    {discoveryData.ineligible.map((tech, idx) => {
                      const techId = tech.technicianId || tech._id || tech.id || idx;
                      const reasons = Array.isArray(tech.reasons) ? tech.reasons : [];

                      return (
                        <Box
                          key={techId}
                          p={3}
                          borderRadius="10px"
                          border="1px solid"
                          borderColor={isDark ? "gray.700" : "gray.200"}
                          bg={isDark ? "gray.800" : "gray.50"}
                          opacity={0.88}
                        >
                          <Flex justify="space-between" align="flex-start" mb={1.5}>
                            <HStack spacing={2.5}>
                              <Avatar size="xs" name={tech.name || "Tech"} />
                              <Text fontWeight="700" fontSize="xs" color={isDark ? "gray.300" : "gray.800"}>
                                {tech.name || "Technician"}
                              </Text>
                              {tech.mobile && (
                                <Text fontSize="2xs" color="gray.500">
                                  ({tech.mobile})
                                </Text>
                              )}
                            </HStack>
                            <HStack spacing={1} flexWrap="wrap">
                              {reasons.map((r) => (
                                <Badge
                                  key={r}
                                  colorScheme={REASON_COLORS[r] || "gray"}
                                  fontSize="2xs"
                                  borderRadius="sm"
                                  px={1.5}
                                >
                                  {r.replaceAll("_", " ")}
                                </Badge>
                              ))}
                            </HStack>
                          </Flex>
                          {tech.details && (
                            <Text fontSize="2xs" color={isDark ? "gray.400" : "gray.600"} pl={7}>
                              {tech.details}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter pt={2}>
          <Button variant="ghost" size="sm" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="teal"
            onClick={fetchCandidates}
            isLoading={loading}
          >
            Refresh Candidates
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
