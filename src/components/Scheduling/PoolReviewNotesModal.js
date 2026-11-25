// src/components/Scheduling/PoolReviewNotesModal.js
import React, { useState, useEffect } from "react";
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
  Text,
  Badge,
  HStack,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  useColorMode,
} from "@chakra-ui/react";
import { useAppToast } from "components/feedback";
import { updateScheduledPoolReview } from "api/scheduling";

export default function PoolReviewNotesModal({
  isOpen,
  onClose,
  booking,
  onReviewSaved,
}) {
  const toast = useAppToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [reviewStatus, setReviewStatus] = useState("reviewed");
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const bookingId = booking?._id || booking?.id || "";

  useEffect(() => {
    if (isOpen && booking) {
      setReviewStatus(booking?.scheduledPool?.adminReviewStatus || "reviewed");
      setReviewNote(booking?.scheduledPool?.reviewNote || "");
    }
  }, [isOpen, booking]);

  const handleSave = async () => {
    if (!bookingId) return;

    try {
      setSaving(true);
      await updateScheduledPoolReview(bookingId, {
        adminReviewStatus: reviewStatus,
        reviewNote: reviewNote.trim(),
      });

      toast({
        title: "Review Notes Saved",
        description: "Administrative review status and notes updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onReviewSaved) onReviewSaved();
      onClose();
    } catch (err) {
      console.error("handleSave review error:", err);
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update review status.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const serviceName =
    booking?.serviceId?.serviceName ||
    booking?.serviceName ||
    "Booking";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <ModalContent
        borderRadius="16px"
        bg={isDark ? "gray.850" : "white"}
        border="1px solid"
        borderColor={isDark ? "gray.700" : "gray.200"}
      >
        <ModalHeader pb={2}>
          <HStack spacing={2} mb={1}>
            <Badge colorScheme="purple" borderRadius="md" px={2} py={0.5} fontSize="xs">
              Admin Investigation
            </Badge>
          </HStack>
          <Text fontSize="md" fontWeight="800" color={isDark ? "white" : "gray.800"}>
            Review Status &amp; Notes
          </Text>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody pt={1} pb={4}>
          <Box mb={3}>
            <Text fontSize="xs" color="gray.500">
              Booking: <strong>{serviceName}</strong> ({bookingId})
            </Text>
          </Box>

          <FormControl mb={4}>
            <FormLabel fontSize="xs" fontWeight="700">
              Investigation Status:
            </FormLabel>
            <Select
              size="sm"
              borderRadius="8px"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              bg={isDark ? "gray.800" : "white"}
            >
              <option value="open">Open (Urgent Escalation)</option>
              <option value="reviewed">Reviewed (Action in Progress)</option>
              <option value="investigating">Investigating Customer / Tech</option>
              <option value="dismissed">Dismissed / Resolved</option>
            </Select>
          </FormControl>

          <FormControl mb={2}>
            <FormLabel fontSize="xs" fontWeight="700">
              Investigation &amp; Follow-up Notes:
            </FormLabel>
            <Textarea
              placeholder="e.g. Spoke with customer; agreed to wait 15 minutes for alternate tech discovery..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              size="sm"
              borderRadius="8px"
              rows={4}
              bg={isDark ? "gray.800" : "white"}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter pt={2}>
          <Button variant="ghost" size="sm" mr={3} onClick={onClose} isDisabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="teal"
            borderRadius="8px"
            onClick={handleSave}
            isLoading={saving}
          >
            Save Review
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
