import React from "react";
import PropTypes from "prop-types";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Flex,
  Icon,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaExclamationTriangle } from "react-icons/fa";

/**
 * Standard ConfirmDialog Component for Destructive or High-Impact Actions
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  impactStatement,
  confirmLabel = "Confirm",
  confirmColorScheme = "red",
  cancelLabel = "Cancel",
  isLoading = false,
}) {
  const bg = useColorModeValue("white", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const descColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent bg={bg} borderRadius="16px" overflow="hidden" boxShadow="2xl">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
          <HStack spacing={2.5}>
            <Flex boxSize="32px" borderRadius="8px" bg="red.50" color="red.600" align="center" justify="center">
              <Icon as={FaExclamationTriangle} boxSize={4} />
            </Flex>
            <Text fontSize="md" fontWeight="700">
              {title}
            </Text>
          </HStack>
        </ModalHeader>

        <ModalBody py={4}>
          <VStack spacing={3} align="stretch">
            {description && (
              <Text fontSize="sm" color={descColor}>
                {description}
              </Text>
            )}

            {impactStatement && (
              <Box p={3} borderRadius="8px" bg="orange.50" border="1px solid" borderColor="orange.200">
                <Text fontSize="xs" fontWeight="600" color="orange.800">
                  Impact statement:
                </Text>
                <Text fontSize="xs" color="orange.700" mt={0.5}>
                  {impactStatement}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={3}>
          <Button size="sm" variant="outline" mr={3} onClick={onClose} borderRadius="8px" isDisabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            colorScheme={confirmColorScheme}
            onClick={onConfirm}
            isLoading={isLoading}
            borderRadius="8px"
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  impactStatement: PropTypes.string,
  confirmLabel: PropTypes.string,
  confirmColorScheme: PropTypes.string,
  cancelLabel: PropTypes.string,
  isLoading: PropTypes.bool,
};
