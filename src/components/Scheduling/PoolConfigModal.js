// src/components/Scheduling/PoolConfigModal.js
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
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Skeleton,
  Alert,
  AlertIcon,
  useColorMode,
} from "@chakra-ui/react";
import { useAppToast } from "components/feedback";
import { getScheduledPoolConfig, updateScheduledPoolConfig } from "api/scheduling";

export default function PoolConfigModal({ isOpen, onClose, onConfigSaved }) {
  const toast = useAppToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [escalationLeadMinutes, setEscalationLeadMinutes] = useState(120);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getScheduledPoolConfig();
        const cfg = res?.result || res || {};
        if (typeof cfg.enabled === "boolean") setEnabled(cfg.enabled);
        if (typeof cfg.escalationLeadMinutes === "number") {
          setEscalationLeadMinutes(cfg.escalationLeadMinutes);
        }
      } catch (err) {
        console.error("fetchConfig error:", err);
        setError(err?.message || "Failed to load pool configuration.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateScheduledPoolConfig({
        enabled,
        escalationLeadMinutes: Number(escalationLeadMinutes) || 120,
      });

      toast({
        title: "Pool Configuration Saved",
        description: "Scheduled job pool runtime settings successfully updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onConfigSaved) onConfigSaved();
      onClose();
    } catch (err) {
      console.error("handleSave config error:", err);
      toast({
        title: "Save Failed",
        description: err?.message || "Could not update pool configuration.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const hours = Math.floor(escalationLeadMinutes / 60);
  const mins = escalationLeadMinutes % 60;
  const timeDisplay = `${hours ? `${hours} hr ` : ""}${mins ? `${mins} min` : ""}`.trim() || "0 min";

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
            <Badge colorScheme="teal" borderRadius="md" px={2} py={0.5} fontSize="xs">
              Runtime Governance
            </Badge>
          </HStack>
          <Text fontSize="md" fontWeight="800" color={isDark ? "white" : "gray.800"}>
            Scheduled Pool Settings
          </Text>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody pt={1} pb={4}>
          {error && (
            <Alert status="error" borderRadius="8px" mb={3} fontSize="xs">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {loading ? (
            <Skeleton h="120px" borderRadius="10px" />
          ) : (
            <Box>
              <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Box pr={3}>
                  <FormLabel fontSize="sm" fontWeight="700" mb={0}>
                    Enable Scheduled Job Pool
                  </FormLabel>
                  <FormHelperText fontSize="2xs" color="gray.500" mt={0.5}>
                    When active, newly booked forward-dated appointments enter the technician pool immediately.
                  </FormHelperText>
                </Box>
                <Switch
                  colorScheme="teal"
                  size="md"
                  isChecked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              </FormControl>

              <FormControl mb={2}>
                <FormLabel fontSize="sm" fontWeight="700" mb={1}>
                  Escalation Lead Time (Minutes):
                </FormLabel>
                <NumberInput
                  size="sm"
                  min={15}
                  max={720}
                  step={15}
                  value={escalationLeadMinutes}
                  onChange={(_, val) => setEscalationLeadMinutes(val)}
                  borderRadius="8px"
                >
                  <NumberInputField bg={isDark ? "gray.800" : "white"} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText fontSize="2xs" color="teal.600" fontWeight="600" mt={1}>
                  Unclaimed jobs automatically escalate to Admin Review {timeDisplay} before appointment.
                </FormHelperText>
              </FormControl>
            </Box>
          )}
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
            isDisabled={loading}
          >
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
