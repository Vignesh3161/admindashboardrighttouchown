import React from "react";
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
  Text,
  Badge,
  HStack,
  VStack,
  Progress,
  Avatar,
} from "@chakra-ui/react";
import {
  FaGraduationCap,
  FaIdCard,
  FaUniversity,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaCheck,
  FaClock,
  FaArrowRight,
  FaShieldAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/**
 * Evaluates whether a technician meets all four required prerequisites
 * before their Work Status can be set to "Approved".
 */
export const evaluateWorkStatusEligibility = (
  tech,
  allKycRecords = [],
  masterDistricts = [],
  isTechnicianKYCVerifiedFn,
  isTechnicianBankVerifiedFn,
  getTechnicianApprovedDistrictsFn
) => {
  if (!tech) {
    return {
      isEligible: false,
      completedCount: 0,
      totalCount: 4,
      gates: {
        training: { passed: false, label: "Training Completion", note: "Pending" },
        kyc: { passed: false, label: "Identity & KYC Verification", note: "Pending" },
        bank: { passed: false, label: "Bank & Payout Verification", note: "Pending" },
        coverage: { passed: false, label: "Operational District Coverage", note: "Pending" },
      },
      approvedDistricts: [],
    };
  }

  const isGate1Complete = Boolean(tech.trainingCompleted);

  const isGate2Complete = isTechnicianKYCVerifiedFn
    ? isTechnicianKYCVerifiedFn(tech, allKycRecords)
    : false;

  const isGate3Complete = isTechnicianBankVerifiedFn
    ? isTechnicianBankVerifiedFn(tech, allKycRecords)
    : false;

  const approvedDistricts = getTechnicianApprovedDistrictsFn
    ? getTechnicianApprovedDistrictsFn(tech, masterDistricts)
    : [];
  const hasDistrictCoverage = approvedDistricts.length > 0;

  const completedCount = [
    isGate1Complete,
    isGate2Complete,
    isGate3Complete,
    hasDistrictCoverage,
  ].filter(Boolean).length;

  const isEligible = completedCount === 4;

  return {
    isEligible,
    completedCount,
    totalCount: 4,
    gates: {
      training: {
        passed: isGate1Complete,
        label: "Gate 1: Training Completion",
        note: isGate1Complete
          ? "Training verified and completed"
          : "Required training must be completed before activation",
      },
      kyc: {
        passed: isGate2Complete,
        label: "Gate 2: Identity & KYC Documents",
        note: isGate2Complete
          ? "Government identity (Aadhaar / PAN) verified"
          : "Aadhaar and PAN verification pending review",
      },
      bank: {
        passed: isGate3Complete,
        label: "Gate 3: Bank Account & Payouts",
        note: isGate3Complete
          ? "Bank account verified for settlement payouts"
          : "Bank account details pending verification",
      },
      coverage: {
        passed: hasDistrictCoverage,
        label: "Gate 4: Operational District Coverage",
        note: hasDistrictCoverage
          ? `${approvedDistricts.length} operational district(s) actively assigned`
          : "At least one operational district must be assigned",
      },
    },
    approvedDistricts,
  };
};

const WorkStatusPrerequisitesModal = ({
  isOpen,
  onClose,
  technician,
  technicianName: propTechName,
  technicianPhone: propTechPhone,
  technicianImage: propTechImage,
  technicianSpecialization: propTechSpec,
  evaluation,
  onCompleteTraining,
  onOpenDrawerTab,
  onApproveWorkStatus,
}) => {
  const navigate = useNavigate();

  if (!technician || !evaluation) return null;

  const { isEligible, gates, approvedDistricts, completedCount = 0 } = evaluation;

  // Resilient resolution of technician attributes
  const techName = (() => {
    if (propTechName && propTechName !== "Technician" && propTechName !== "Unknown") {
      return propTechName;
    }
    const candidates = [
      technician.name,
      technician.fullName,
      technician.technicianName,
      technician.firstName ? `${technician.firstName} ${technician.lastName || ""}`.trim() : null,
      technician.fname ? `${technician.fname} ${technician.lname || ""}`.trim() : null,
      technician.profile?.name,
      technician.profile?.fullName,
      technician.profile?.firstName ? `${technician.profile.firstName} ${technician.profile.lastName || ""}`.trim() : null,
      technician.userId?.name,
      technician.userId?.fullName,
      technician.user?.name,
      technician.user?.fullName,
      propTechName,
    ];
    for (const c of candidates) {
      if (c && typeof c === "string" && c.trim() && c.trim() !== "Unknown" && !c.startsWith("deleted_")) {
        return c.trim();
      }
    }
    return "Technician";
  })();

  const techPhone = (() => {
    if (propTechPhone && propTechPhone !== "No phone provided") {
      return propTechPhone;
    }
    const candidates = [
      technician.mobileNumber,
      technician.phone,
      technician.mobile,
      technician.phoneNumber,
      technician.contactNumber,
      technician.userId?.mobileNumber,
      technician.userId?.phone,
      technician.userId?.mobile,
      technician.user?.mobileNumber,
      technician.user?.phone,
      technician.profile?.mobileNumber,
      technician.profile?.phone,
      technician.personalDetails?.phone,
      technician.personalDetails?.mobileNumber,
      propTechPhone,
    ];
    for (const p of candidates) {
      if (p && typeof p === "string" && p.trim()) {
        return p.trim();
      }
    }
    return null;
  })();

  const techImage =
    propTechImage ||
    technician.profileImage ||
    technician.image ||
    technician.avatar ||
    (technician.userId && (technician.userId.profileImage || technician.userId.image)) ||
    (technician.user && (technician.user.profileImage || technician.user.image)) ||
    null;

  const techSpec =
    (propTechSpec && propTechSpec !== "General" ? propTechSpec : null) ||
    technician.specialization ||
    technician.serviceCategory ||
    technician.category ||
    (Array.isArray(technician.skills) && (
      technician.skills[0]?.serviceId?.serviceName ||
      technician.skills[0]?.serviceId?.name ||
      technician.skills[0]?.serviceName ||
      technician.skills[0]?.skillName ||
      technician.skills[0]?.name ||
      technician.skills[0]
    )) ||
    propTechSpec ||
    null;

  const techId = technician._id || technician.id || technician.technicianId || null;

  const handleNavigateToCityZones = () => {
    onClose();
    navigate("/owner/city-zones");
  };

  const progressPercentage = Math.round((completedCount / 4) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
      <ModalContent
        borderRadius="20px"
        overflow="hidden"
        boxShadow="0 24px 60px -12px rgba(0, 0, 0, 0.35)"
        border="1px solid"
        borderColor="gray.100"
        maxW={{ base: "92vw", md: "540px" }}
      >
        {/* ================= MODAL HEADER ================= */}
        <ModalHeader
          bg="white"
          pt={6}
          pb={4}
          px={6}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <Flex align="flex-start" justify="space-between" pr={6}>
            <HStack spacing={3.5} align="center">
              <Flex
                w="44px"
                h="44px"
                borderRadius="12px"
                bg={isEligible ? "green.50" : "teal.50"}
                color={isEligible ? "green.600" : "teal.600"}
                align="center"
                justify="center"
                fontSize="20px"
                boxShadow="inner"
                flexShrink={0}
              >
                {isEligible ? <FaCheckCircle /> : <FaShieldAlt />}
              </Flex>
              <Box>
                <Text fontSize="md" fontWeight="bold" color="gray.900" lineHeight="1.2">
                  Work Status Prerequisites
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Approval checklist for live booking dispatches
                </Text>
              </Box>
            </HStack>
          </Flex>
          <ModalCloseButton top={5} right={5} borderRadius="full" />

          {/* Technician Identity Chip */}
          <Flex
            mt={4}
            p={3}
            px={3.5}
            borderRadius="14px"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            align="center"
            justify="space-between"
          >
            <HStack spacing={3}>
              <Avatar
                w="38px"
                h="38px"
                name={techName}
                src={techImage}
                bg="teal.600"
                color="white"
                fontWeight="bold"
                fontSize="xs"
                borderRadius="10px"
              />
              <Box>
                <HStack spacing={2} align="center">
                  <Text fontSize="xs" fontWeight="bold" color="gray.900" lineHeight="short">
                    {techName}
                  </Text>
                  {techSpec && (
                    <Badge colorScheme="teal" variant="subtle" fontSize="9px" px={1.5} py={0.2} borderRadius="md">
                      {techSpec}
                    </Badge>
                  )}
                </HStack>
                <HStack spacing={2.5} color="gray.600" fontSize="2xs" mt={0.5} align="center">
                  <HStack spacing={1}>
                    <FaPhoneAlt fontSize="10px" />
                    <Text>{techPhone || "No phone provided"}</Text>
                  </HStack>
                  {techId && (
                    <Text color="gray.500">
                      ID: #{String(techId).slice(-6)}
                    </Text>
                  )}
                </HStack>
              </Box>
            </HStack>

            <Badge
              colorScheme={isEligible ? "green" : "orange"}
              fontSize="2xs"
              px={2.5}
              py={0.8}
              borderRadius="full"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {isEligible ? "Eligible" : "Pending Review"}
            </Badge>
          </Flex>
        </ModalHeader>

        {/* ================= MODAL BODY ================= */}
        <ModalBody py={5} px={6} bg="gray.50">
          {/* Progress Overview Card */}
          <Box
            p={4}
            mb={4}
            borderRadius="14px"
            bg="white"
            border="1px solid"
            borderColor={isEligible ? "green.200" : "gray.200"}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={2}>
              <HStack spacing={2}>
                <Text fontSize="xs" fontWeight="bold" color="gray.800">
                  Prerequisites Progress
                </Text>
                <Badge
                  colorScheme={isEligible ? "green" : completedCount > 0 ? "teal" : "gray"}
                  fontSize="11px"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontWeight="bold"
                >
                  {completedCount} of 4 Complete
                </Badge>
              </HStack>
              <Text fontSize="xs" fontWeight="black" color={isEligible ? "green.600" : "teal.600"}>
                {progressPercentage}%
              </Text>
            </Flex>

            <Progress
              value={progressPercentage}
              size="xs"
              borderRadius="full"
              colorScheme={isEligible ? "green" : "teal"}
              bg="gray.100"
              mb={2}
            />

            <Text fontSize="2xs" color="gray.500" lineHeight="tall">
              {isEligible
                ? "All verification gates cleared. This technician is fully verified and ready to be approved for live customer dispatch."
                : "All 4 operational gates must be approved before this technician can accept dispatches."}
            </Text>
          </Box>

          {/* The 4 Prerequisite Gates */}
          <VStack spacing={3} align="stretch">
            {/* Gate 1: Training */}
            <Flex
              p={3.5}
              borderRadius="14px"
              border="1px solid"
              borderColor={gates.training.passed ? "green.200" : "gray.200"}
              bg="white"
              boxShadow="2xs"
              justify="space-between"
              align="center"
              transition="all 0.2s ease"
              _hover={{ borderColor: gates.training.passed ? "green.300" : "teal.200", transform: "translateY(-1px)" }}
            >
              <HStack spacing={3.5}>
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="10px"
                  bg={gates.training.passed ? "green.50" : "gray.100"}
                  color={gates.training.passed ? "green.600" : "gray.500"}
                  align="center"
                  justify="center"
                  fontSize="17px"
                  flexShrink={0}
                >
                  <FaGraduationCap />
                </Flex>
                <Box>
                  <HStack spacing={2} align="center">
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                      Gate 1: Training
                    </Text>
                    <Badge
                      colorScheme={gates.training.passed ? "green" : "orange"}
                      fontSize="2xs"
                      px={2}
                      py={0.4}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      {gates.training.passed ? "Completed" : "Pending"}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.500" mt={0.5}>
                    {gates.training.note}
                  </Text>
                </Box>
              </HStack>

              {gates.training.passed ? (
                <Text color="green.600" fontSize="2xs" fontWeight="bold" px={2}>
                  Done
                </Text>
              ) : (
                onCompleteTraining && (
                  <Button
                    size="xs"
                    colorScheme="teal"
                    variant="solid"
                    onClick={onCompleteTraining}
                    borderRadius="8px"
                    px={3}
                    fontWeight="semibold"
                    boxShadow="sm"
                  >
                    Mark Complete
                  </Button>
                )
              )}
            </Flex>

            {/* Gate 2: Identity & KYC */}
            <Flex
              p={3.5}
              borderRadius="14px"
              border="1px solid"
              borderColor={gates.kyc.passed ? "green.200" : "gray.200"}
              bg="white"
              boxShadow="2xs"
              justify="space-between"
              align="center"
              transition="all 0.2s ease"
              _hover={{ borderColor: gates.kyc.passed ? "green.300" : "purple.200", transform: "translateY(-1px)" }}
            >
              <HStack spacing={3.5}>
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="10px"
                  bg={gates.kyc.passed ? "green.50" : "purple.50"}
                  color={gates.kyc.passed ? "green.600" : "purple.600"}
                  align="center"
                  justify="center"
                  fontSize="17px"
                  flexShrink={0}
                >
                  <FaIdCard />
                </Flex>
                <Box>
                  <HStack spacing={2} align="center">
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                      Gate 2: Identity & KYC
                    </Text>
                    <Badge
                      colorScheme={gates.kyc.passed ? "green" : "purple"}
                      fontSize="2xs"
                      px={2}
                      py={0.4}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      {gates.kyc.passed ? "Verified" : "Under Review"}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.500" mt={0.5}>
                    {gates.kyc.note}
                  </Text>
                </Box>
              </HStack>

              {gates.kyc.passed ? (
                <HStack spacing={1} color="green.600" fontSize="xs" fontWeight="bold" px={2}>
                  <FaCheck fontSize="11px" />
                  <Text fontSize="2xs">Done</Text>
                </HStack>
              ) : (
                onOpenDrawerTab && (
                  <Button
                    size="xs"
                    colorScheme="purple"
                    variant="outline"
                    onClick={() => onOpenDrawerTab("kyc")}
                    borderRadius="8px"
                    px={3}
                    fontWeight="semibold"
                    rightIcon={<FaArrowRight fontSize="10px" />}
                  >
                    Review KYC
                  </Button>
                )
              )}
            </Flex>

            {/* Gate 3: Bank & Payout */}
            <Flex
              p={3.5}
              borderRadius="14px"
              border="1px solid"
              borderColor={gates.bank.passed ? "green.200" : "gray.200"}
              bg="white"
              boxShadow="2xs"
              justify="space-between"
              align="center"
              transition="all 0.2s ease"
              _hover={{ borderColor: gates.bank.passed ? "green.300" : "blue.200", transform: "translateY(-1px)" }}
            >
              <HStack spacing={3.5}>
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="10px"
                  bg={gates.bank.passed ? "green.50" : "blue.50"}
                  color={gates.bank.passed ? "green.600" : "blue.600"}
                  align="center"
                  justify="center"
                  fontSize="17px"
                  flexShrink={0}
                >
                  <FaUniversity />
                </Flex>
                <Box>
                  <HStack spacing={2} align="center">
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                      Gate 3: Bank & Payout
                    </Text>
                    <Badge
                      colorScheme={gates.bank.passed ? "green" : "orange"}
                      fontSize="2xs"
                      px={2}
                      py={0.4}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      {gates.bank.passed ? "Verified" : "Pending"}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.500" mt={0.5}>
                    {gates.bank.note}
                  </Text>
                </Box>
              </HStack>

              {gates.bank.passed ? (
                <HStack spacing={1} color="green.600" fontSize="xs" fontWeight="bold" px={2}>
                  <FaCheck fontSize="11px" />
                  <Text fontSize="2xs">Done</Text>
                </HStack>
              ) : (
                onOpenDrawerTab && (
                  <Button
                    size="xs"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => onOpenDrawerTab("bank")}
                    borderRadius="8px"
                    px={3}
                    fontWeight="semibold"
                    rightIcon={<FaArrowRight fontSize="10px" />}
                  >
                    Review Bank
                  </Button>
                )
              )}
            </Flex>

            {/* Gate 4: Operational District Coverage */}
            <Flex
              p={3.5}
              borderRadius="14px"
              border="1px solid"
              borderColor={gates.coverage.passed ? "green.200" : "red.200"}
              bg="white"
              boxShadow="2xs"
              justify="space-between"
              align="center"
              transition="all 0.2s ease"
              _hover={{ borderColor: gates.coverage.passed ? "green.300" : "teal.300", transform: "translateY(-1px)" }}
            >
              <HStack spacing={3.5}>
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="10px"
                  bg={gates.coverage.passed ? "green.50" : "red.50"}
                  color={gates.coverage.passed ? "green.600" : "red.500"}
                  align="center"
                  justify="center"
                  fontSize="17px"
                  flexShrink={0}
                >
                  <FaMapMarkedAlt />
                </Flex>
                <Box>
                  <HStack spacing={2} align="center">
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                      Gate 4: District Coverage
                    </Text>
                    <Badge
                      colorScheme={gates.coverage.passed ? "green" : "red"}
                      fontSize="2xs"
                      px={2}
                      py={0.4}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      {gates.coverage.passed
                        ? `${approvedDistricts.length} District${approvedDistricts.length > 1 ? "s" : ""}`
                        : "Coverage Missing"}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.500" mt={0.5}>
                    {gates.coverage.note}
                  </Text>
                </Box>
              </HStack>

              {gates.coverage.passed ? (
                <HStack spacing={1} color="green.600" fontSize="xs" fontWeight="bold" px={2}>
                  <FaCheck fontSize="11px" />
                  <Text fontSize="2xs">Done</Text>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleNavigateToCityZones}
                  borderRadius="8px"
                  px={3}
                  fontWeight="semibold"
                  rightIcon={<FaArrowRight fontSize="10px" />}
                >
                  Assign District
                </Button>
              )}
            </Flex>
          </VStack>
        </ModalBody>

        {/* ================= MODAL FOOTER ================= */}
        <ModalFooter
          bg="white"
          borderTop="1px solid"
          borderColor="gray.100"
          py={4}
          px={6}
        >
          <Flex justify="space-between" align="center" w="full">
            <Box>
              {!isEligible && (
                <HStack spacing={1.5} color="gray.400" fontSize="2xs">
                  <FaClock fontSize="10px" />
                  <Text>Complete all 4 gates to approve technician</Text>
                </HStack>
              )}
            </Box>

            <HStack spacing={3}>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                borderRadius="10px"
                fontWeight="medium"
                color="gray.600"
                _hover={{ bg: "gray.100" }}
              >
                Close
              </Button>

              {isEligible && onApproveWorkStatus && (
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => {
                    onClose();
                    onApproveWorkStatus();
                  }}
                  borderRadius="10px"
                  leftIcon={<FaCheckCircle />}
                  fontWeight="bold"
                  px={5}
                  boxShadow="md"
                  _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                >
                  Approve Work Status
                </Button>
              )}
            </HStack>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WorkStatusPrerequisitesModal;
