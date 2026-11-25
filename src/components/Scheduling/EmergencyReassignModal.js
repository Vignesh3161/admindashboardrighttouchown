// src/components/Scheduling/EmergencyReassignModal.js
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
  Textarea,
  Radio,
  RadioGroup,
  Skeleton,
  Alert,
  AlertIcon,
  useColorMode,
} from "@chakra-ui/react";
import {
  FaUserTimes,
  FaUserCheck,
  FaExclamationTriangle,
  FaRoute,
  FaPhoneAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { useAppToast } from "components/feedback";
import { getEligibleTechnicians, reassignScheduledPoolJob } from "api/scheduling";
import { formatFriendlyDateTime } from "./schedulingFormatters";

export default function EmergencyReassignModal({
  isOpen,
  onClose,
  booking,
  onReassignSuccess,
}) {
  const toast = useAppToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bookingId = booking?._id || booking?.id || "";

  const fetchCandidates = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoadingCandidates(true);
      setError("");
      const res = await getEligibleTechnicians(bookingId);
      const eligible = res?.result?.eligible || res?.eligible || [];
      setCandidates(eligible);
      if (eligible.length > 0 && !selectedTechId) {
        setSelectedTechId(eligible[0].technicianId || eligible[0]._id || eligible[0].id || "");
      }
    } catch (err) {
      console.error("fetchCandidates error:", err);
      setError(err?.message || "Failed to load replacement technicians.");
    } finally {
      setLoadingCandidates(false);
    }
  }, [bookingId, selectedTechId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchCandidates();
      setReason("");
    } else {
      setCandidates([]);
      setSelectedTechId("");
      setReason("");
      setError("");
    }
  }, [isOpen, bookingId, fetchCandidates]);

  const handleExecuteSwap = async () => {
    if (!bookingId) return;
    if (!selectedTechId) {
      return toast({
        title: "Selection Required",
        description: "Please select a replacement technician.",
        status: "warning",
      });
    }
    if (!reason.trim()) {
      return toast({
        title: "Reason Required",
        description: "Please provide the reason for this emergency reassignment.",
        status: "warning",
      });
    }

    try {
      setSubmitting(true);
      await reassignScheduledPoolJob(bookingId, {
        toTechnicianId: selectedTechId,
        reason: reason.trim(),
      });

      toast({
        title: "Technician Swap Completed",
        description: "Replacement technician assigned and previous slot cleanly released.",
        status: "success",
        duration: 3500,
        isClosable: true,
      });

      if (onReassignSuccess) onReassignSuccess();
      onClose();
    } catch (err) {
      console.error("handleExecuteSwap error:", err);
      toast({
        title: "Reassignment Failed",
        description: err?.message || "Could not reassign this booking.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentTech =
    booking?.technicianId ||
    booking?.assignedTechnician ||
    booking?.technician ||
    null;

  const currentTechName =
    typeof currentTech === "object"
      ? `${currentTech?.fname || currentTech?.name || "Assigned Tech"}`
      : "Current Technician";

  const slotLabel = booking?.slotLabel || "Appointment Slot";
  const scheduledDate = booking?.scheduledAt
    ? formatFriendlyDateTime(booking.scheduledAt)
    : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <ModalContent
        borderRadius="16px"
        bg={isDark ? "gray.850" : "white"}
        border="1px solid"
        borderColor={isDark ? "gray.700" : "gray.200"}
      >
        <ModalHeader pb={2}>
          <HStack spacing={2} mb={1}>
            <Badge colorScheme="red" borderRadius="md" px={2} py={0.5} fontSize="xs">
              Emergency Swap
            </Badge>
            <Badge colorScheme="teal" borderRadius="md" px={2} py={0.5} fontSize="xs">
              {slotLabel}
            </Badge>
          </HStack>
          <Text fontSize="md" fontWeight="800" color={isDark ? "white" : "gray.800"}>
            Reassign Scheduled Technician
          </Text>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody pt={1} pb={4}>
          {/* Current Tech Card */}
          <Box
            p={3}
            mb={4}
            borderRadius="10px"
            bg={isDark ? "red.900" : "red.50"}
            border="1px solid"
            borderColor={isDark ? "red.700" : "red.200"}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={2.5}>
                <Icon as={FaUserTimes} color="red.500" boxSize={4} />
                <Box>
                  <Text fontSize="xs" fontWeight="700" color={isDark ? "red.200" : "red.900"}>
                    Current Assigned Technician:
                  </Text>
                  <Text fontSize="sm" fontWeight="800" color={isDark ? "white" : "red.800"}>
                    {currentTechName}
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme="red" fontSize="2xs">
                To Be Released
              </Badge>
            </Flex>
          </Box>

          {error && (
            <Alert status="error" borderRadius="8px" mb={3} fontSize="xs">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Select Replacement Tech */}
          <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.700"} mb={2}>
            Select Replacement Technician:
          </Text>

          {loadingCandidates ? (
            <VStack spacing={2} align="stretch" mb={4}>
              <Skeleton h="48px" borderRadius="8px" />
              <Skeleton h="48px" borderRadius="8px" />
            </VStack>
          ) : candidates.length === 0 ? (
            <Box
              p={4}
              mb={4}
              textAlign="center"
              borderRadius="10px"
              border="1px dashed"
              borderColor="gray.300"
            >
              <Icon as={FaExclamationTriangle} color="orange.400" mb={1} />
              <Text fontSize="xs" fontWeight="700">
                No Eligible Replacement Technicians Available
              </Text>
              <Text fontSize="2xs" color="gray.500">
                No other verified technicians have an open slot at {slotLabel}.
              </Text>
            </Box>
          ) : (
            <RadioGroup value={selectedTechId} onChange={setSelectedTechId} mb={4}>
              <VStack spacing={2} align="stretch" maxH="220px" overflowY="auto">
                {candidates.map((tech) => {
                  const techId = tech.technicianId || tech._id || tech.id;
                  const isSelected = selectedTechId === techId;

                  return (
                    <Flex
                      key={techId}
                      p={2.5}
                      borderRadius="8px"
                      border="1px solid"
                      borderColor={isSelected ? "teal.400" : isDark ? "gray.700" : "gray.200"}
                      bg={isSelected ? (isDark ? "teal.900" : "teal.50") : isDark ? "gray.800" : "white"}
                      align="center"
                      justify="space-between"
                      cursor="pointer"
                      onClick={() => setSelectedTechId(techId)}
                    >
                      <HStack spacing={3}>
                        <Radio value={techId} colorScheme="teal" />
                        <Avatar size="xs" name={tech.name || "Tech"} />
                        <Box>
                          <Text fontSize="xs" fontWeight="700">
                            {tech.name || "Technician"}
                          </Text>
                          <HStack spacing={2} fontSize="2xs" color="gray.500">
                            {tech.mobile && <Text>{tech.mobile}</Text>}
                            {typeof tech.distanceKm === "number" && (
                              <Text color="teal.600">{tech.distanceKm.toFixed(1)} km away</Text>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                      <Badge colorScheme="green" fontSize="2xs">
                        Available
                      </Badge>
                    </Flex>
                  );
                })}
              </VStack>
            </RadioGroup>
          )}

          {/* Reassignment Reason */}
          <Box mb={2}>
            <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.700"} mb={1}>
              Reason for Emergency Reassignment (Audit Log):
            </Text>
            <Textarea
              placeholder="e.g. Original technician reported vehicle breakdown on highway..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              size="sm"
              borderRadius="8px"
              rows={3}
              bg={isDark ? "gray.800" : "white"}
            />
          </Box>
        </ModalBody>

        <ModalFooter pt={2}>
          <Button variant="ghost" size="sm" mr={3} onClick={onClose} isDisabled={submitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="red"
            borderRadius="8px"
            onClick={handleExecuteSwap}
            isLoading={submitting}
            isDisabled={!selectedTechId || !reason.trim() || candidates.length === 0}
          >
            Confirm Swap
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
