import React from "react";
import AppModal from "components/common/AppModal";
import {
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
  Link,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import {
  FaUserGraduate,
  FaIdCard,
  FaUniversity,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBriefcase,
  FaStar,
  FaCalendarAlt,
  FaCheck,
  FaUserSlash,
  FaEllipsisV,
  FaChevronDown,
} from "react-icons/fa";
import { MdOutlinePending, MdOutlineVerifiedUser, MdOutlineAccountBalance } from "react-icons/md";

export default function AdminDetailsModal({
  isOpen,
  onClose,
  selectedTechnician,
  allKycRecords = [],
  onToggleTraining,
  onOpenKYCModal,
  onOpenBankModal,
  onUpdateWorkStatus,
  isOwner = false,
  loading = false,
  customColor = "#008080",
  getTechnicianName,
  getTechnicianImage,
  isTechnicianKYCVerified,
  isTechnicianBankVerified,
  findKYCRecord,
  getTechnicianPhone,
  getTechnicianEmail,
  getTechnicianDistrict,
  getTechnicianApprovedDistricts,
  getTechnicianAddress,
  getTechnicianSpecialization,
}) {
  if (!selectedTechnician) return null;

  const approvedDistricts = getTechnicianApprovedDistricts?.(selectedTechnician) || [];
  const kycMatch = findKYCRecord ? findKYCRecord(selectedTechnician, allKycRecords) : null;
  const isKycApproved = isTechnicianKYCVerified ? isTechnicianKYCVerified(selectedTechnician, allKycRecords) : false;
  const isBankApproved = isTechnicianBankVerified ? isTechnicianBankVerified(selectedTechnician, allKycRecords) : false;
  const bankDetails =
    kycMatch?.bankDetails ||
    selectedTechnician.bankDetails ||
    selectedTechnician.profile?.bankDetails ||
    selectedTechnician.bankAccount ||
    {};

  const techName = getTechnicianName ? getTechnicianName(selectedTechnician, allKycRecords) : selectedTechnician.name || "Technician";
  const techImage = getTechnicianImage ? getTechnicianImage(selectedTechnician, allKycRecords) : null;
  const techPhone = getTechnicianPhone ? getTechnicianPhone(selectedTechnician, allKycRecords) : selectedTechnician.phone || "";
  const techEmail = getTechnicianEmail ? getTechnicianEmail(selectedTechnician, allKycRecords) : selectedTechnician.email || "";
  const techDistrict = getTechnicianDistrict ? getTechnicianDistrict(selectedTechnician) : selectedTechnician.district || "";
  const techAddress = getTechnicianAddress ? getTechnicianAddress(selectedTechnician, allKycRecords) : selectedTechnician.address || "Not provided";
  const techSpecialization = getTechnicianSpecialization ? getTechnicianSpecialization(selectedTechnician) : "General";

  const workStatus = (selectedTechnician.workStatus || "pending").toLowerCase();
  const isOnline = Boolean(selectedTechnician.availability?.isOnline);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      title="Technician Profile & Governance"
      subtitle="Complete profile, gate verifications, coverage areas, and quick actions"
      footer={
        <Flex w="100%" justify="flex-end" align="center">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Flex>
      }
    >
      <VStack spacing={4} align="stretch">
        {/* HERO CARD */}
        <Box
          p={4}
          borderRadius="14px"
          bg="linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="sm"
        >
          <Flex direction={{ base: "column", sm: "row" }} align={{ base: "flex-start", sm: "center" }} gap={4}>
            <Box position="relative">
              <Avatar
                size="xl"
                name={techName}
                src={techImage}
                border="3px solid"
                borderColor={customColor}
                boxShadow="md"
              />
              <Box
                position="absolute"
                bottom="2px"
                right="2px"
                w="14px"
                h="14px"
                borderRadius="full"
                bg={isOnline ? "green.500" : "gray.400"}
                border="2px solid white"
                title={isOnline ? "Online Now" : "Offline"}
              />
            </Box>

            <Box flex="1" w="100%">
              <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
                <Box>
                  <Heading size="md" color="gray.800" fontWeight="bold">
                    {techName}
                  </Heading>
                  <Text fontSize="xs" color="gray.500" fontWeight="medium" mt={0.5}>
                    Specialization: <Badge colorScheme="teal" variant="subtle">{techSpecialization}</Badge>
                  </Text>
                </Box>

                <HStack spacing={2}>
                  <Badge
                    colorScheme={isOnline ? "green" : "gray"}
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Box w="6px" h="6px" borderRadius="full" bg={isOnline ? "green.500" : "gray.400"} />
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </HStack>
              </Flex>

              {/* Contact Chips */}
              <HStack spacing={3} mt={2.5} flexWrap="wrap" fontSize="xs">
                {techPhone ? (
                  <Link
                    href={`tel:${techPhone}`}
                    color="teal.700"
                    fontWeight="semibold"
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    _hover={{ textDecoration: "underline" }}
                  >
                    <FaPhoneAlt size="10px" />
                    {techPhone}
                  </Link>
                ) : (
                  <Text color="gray.400" fontStyle="italic">No Phone</Text>
                )}

                {techEmail && (
                  <Link
                    href={`mailto:${techEmail}`}
                    color="teal.700"
                    fontWeight="medium"
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    _hover={{ textDecoration: "underline" }}
                  >
                    <FaEnvelope size="10px" />
                    {techEmail}
                  </Link>
                )}

                {techDistrict && (
                  <Text color="gray.600" display="flex" alignItems="center" gap={1}>
                    <FaMapMarkerAlt size="10px" color="#008080" />
                    {techDistrict}
                  </Text>
                )}
              </HStack>

              {/* 4-Gate Status Badges */}
              <Flex gap={2} mt={3} flexWrap="wrap">
                <Badge
                  colorScheme={workStatus === "approved" ? "green" : workStatus === "suspended" ? "red" : "orange"}
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Work: {workStatus}
                </Badge>

                <Badge
                  colorScheme={selectedTechnician.trainingCompleted ? "green" : "orange"}
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Gate 1 Training: {selectedTechnician.trainingCompleted ? "Completed" : "Pending"}
                </Badge>

                <Badge
                  colorScheme={isKycApproved ? "green" : "purple"}
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Gate 2 KYC: {isKycApproved ? "Approved" : "Pending"}
                </Badge>

                <Badge
                  colorScheme={isBankApproved ? "teal" : "orange"}
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Gate 3 Bank: {isBankApproved ? "Verified" : "Pending"}
                </Badge>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* QUICK ACTIONS SECTION */}
        <Box
          p={3.5}
          borderRadius="12px"
          bg="teal.50"
          border="1px solid"
          borderColor="teal.100"
        >
          <Flex justify="space-between" align="center" mb={2.5} flexWrap="wrap" gap={2}>
            <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
              ⚡ Quick Actions & Gate Governance
            </Text>
            {isOwner && onUpdateWorkStatus && (
              <Menu>
                <MenuButton
                  as={Button}
                  size="xs"
                  bg="white"
                  border="1.5px solid"
                  borderColor="teal.500"
                  color="teal.800"
                  fontWeight="bold"
                  px={3}
                  py={1.5}
                  boxShadow="sm"
                  _hover={{
                    bg: "teal.600",
                    color: "white",
                    borderColor: "teal.600",
                    boxShadow: "md",
                    transform: "translateY(-1px)",
                  }}
                  _active={{
                    bg: "teal.700",
                    color: "white",
                  }}
                  leftIcon={
                    <Box
                      w="7px"
                      h="7px"
                      borderRadius="full"
                      bg={
                        selectedTechnician?.workStatus === "approved"
                          ? "green.500"
                          : selectedTechnician?.workStatus === "suspended"
                          ? "red.500"
                          : "orange.400"
                      }
                      display="inline-block"
                    />
                  }
                  rightIcon={<FaChevronDown fontSize="9px" />}
                >
                  Change Status: {selectedTechnician?.workStatus || "pending"}
                </MenuButton>
                <MenuList fontSize="xs" zIndex={20} boxShadow="lg" borderRadius="10px">
                  <MenuItem
                    icon={<FaCheck color="green" />}
                    onClick={() => onUpdateWorkStatus(selectedTechnician, "approved")}
                    fontWeight={selectedTechnician?.workStatus === "approved" ? "bold" : "normal"}
                  >
                    Approve Work Status
                  </MenuItem>
                  <MenuItem
                    icon={<MdOutlinePending color="orange" />}
                    onClick={() => onUpdateWorkStatus(selectedTechnician, "pending")}
                    fontWeight={selectedTechnician?.workStatus === "pending" ? "bold" : "normal"}
                  >
                    Set Pending Status
                  </MenuItem>
                  <MenuItem
                    icon={<FaUserSlash color="red" />}
                    onClick={() => onUpdateWorkStatus(selectedTechnician, "suspended")}
                    fontWeight={selectedTechnician?.workStatus === "suspended" ? "bold" : "normal"}
                  >
                    Suspend Technician
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>

          <Flex gap={2} flexWrap="wrap" align="center">
            {onToggleTraining && !selectedTechnician.trainingCompleted && (
              <Button
                size="sm"
                colorScheme="teal"
                variant="solid"
                leftIcon={<FaUserGraduate />}
                onClick={() => onToggleTraining(selectedTechnician, true)}
                isLoading={loading}
              >
                Approve Gate 1 Training
              </Button>
            )}

            {onOpenKYCModal && (
              <Button
                size="sm"
                colorScheme="purple"
                variant={isKycApproved ? "outline" : "solid"}
                leftIcon={<FaIdCard />}
                onClick={() => {
                  onClose();
                  onOpenKYCModal(selectedTechnician);
                }}
              >
                {isKycApproved ? "View KYC Documents" : "Review & Verify KYC"}
              </Button>
            )}

            {onOpenBankModal && (
              <Button
                size="sm"
                colorScheme="orange"
                variant={isBankApproved ? "outline" : "solid"}
                leftIcon={<FaUniversity />}
                onClick={() => {
                  onClose();
                  onOpenBankModal(selectedTechnician);
                }}
              >
                {isBankApproved ? "View Bank Payouts" : "Review & Verify Bank"}
              </Button>
            )}
          </Flex>
        </Box>

        {/* TABBED DETAILS VIEW */}
        <Tabs variant="enclosed" colorScheme="teal" size="sm">
          <TabList borderBottom="2px solid" borderColor="gray.100">
            <Tab fontWeight="semibold">
              <HStack spacing={1.5}>
                <FaBriefcase size="12px" />
                <Text>Overview & Coverage</Text>
              </HStack>
            </Tab>
            <Tab fontWeight="semibold">
              <HStack spacing={1.5}>
                <MdOutlineVerifiedUser size="14px" />
                <Text>Identity & KYC Gate</Text>
                {!isKycApproved && (
                  <Badge colorScheme="purple" fontSize="3xs" borderRadius="full" px={1.5}>
                    Action
                  </Badge>
                )}
              </HStack>
            </Tab>
            <Tab fontWeight="semibold">
              <HStack spacing={1.5}>
                <MdOutlineAccountBalance size="14px" />
                <Text>Bank & Payouts</Text>
                {!isBankApproved && (
                  <Badge colorScheme="orange" fontSize="3xs" borderRadius="full" px={1.5}>
                    Action
                  </Badge>
                )}
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1: OVERVIEW & COVERAGE */}
            <TabPanel px={0} pt={3}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {/* Professional Metrics Card */}
                <Box p={3.5} border="1px solid #e2e8f0" borderRadius="10px" bg="white">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2.5} letterSpacing="wider">
                    PROFESSIONAL METRICS
                  </Text>
                  <VStack align="stretch" spacing={2.5} fontSize="xs">
                    <Flex justify="space-between" align="center">
                      <Text color="gray.600" fontWeight="medium">Specialization:</Text>
                      <Badge colorScheme="blue" px={2} py={0.5} borderRadius="md">
                        {techSpecialization}
                      </Badge>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Text color="gray.600" fontWeight="medium">Experience:</Text>
                      <Text fontWeight="semibold" color="gray.800">
                        {selectedTechnician.experienceYears || selectedTechnician.profile?.experienceYears || 0} Years
                      </Text>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Text color="gray.600" fontWeight="medium">Completed Jobs:</Text>
                      <Text fontWeight="bold" color="gray.800">
                        {selectedTechnician.totalJobsCompleted || selectedTechnician.jobStats?.completed || 0}
                      </Text>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Text color="gray.600" fontWeight="medium">Rating & Feedback:</Text>
                      <HStack spacing={1} color="gray.800" fontWeight="semibold">
                        <FaStar color="#f59e0b" size="12px" />
                        <Text>{selectedTechnician.rating?.avg ? Number(selectedTechnician.rating.avg).toFixed(1) : "0.0"}</Text>
                        <Text color="gray.400" fontSize="2xs">({selectedTechnician.rating?.count || 0} reviews)</Text>
                      </HStack>
                    </Flex>

                    {selectedTechnician.createdAt && (
                      <Flex justify="space-between" align="center" pt={1.5} borderTop="1px dashed" borderColor="gray.100">
                        <Text color="gray.600" fontWeight="medium">Registered Date:</Text>
                        <HStack spacing={1} color="gray.700">
                          <FaCalendarAlt size="11px" color="#94a3b8" />
                          <Text>
                            {new Date(selectedTechnician.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </HStack>
                      </Flex>
                    )}
                  </VStack>
                </Box>

                {/* Geographic Coverage Card */}
                <Box p={3.5} border="1px solid #e2e8f0" borderRadius="10px" bg="white">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2.5} letterSpacing="wider">
                    OPERATIONAL COVERAGE & BASE
                  </Text>
                  <VStack align="stretch" spacing={2.5} fontSize="xs">
                    <Flex justify="space-between" align="center">
                      <Text color="gray.600" fontWeight="medium">Primary District:</Text>
                      {techDistrict ? (
                        <Badge colorScheme="teal" px={2} py={0.5} borderRadius="md" fontWeight="bold">
                          📍 {techDistrict}
                        </Badge>
                      ) : (
                        <Badge colorScheme="gray" px={2} py={0.5} borderRadius="md">
                          Not assigned
                        </Badge>
                      )}
                    </Flex>

                    <Box pt={1.5} borderTop="1px dashed" borderColor="gray.100">
                      <Text color="gray.600" fontWeight="medium" mb={1.5}>
                        Approved Dispatch Coverage:
                      </Text>
                      {approvedDistricts.length > 0 ? (
                        <HStack spacing={1.5} flexWrap="wrap">
                          {approvedDistricts.map((district) => (
                            <Badge
                              key={district.id || district.name}
                              colorScheme="teal"
                              variant="subtle"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                            >
                              📍 {district.name}
                            </Badge>
                          ))}
                        </HStack>
                      ) : (
                        <Badge colorScheme="orange" px={2} py={0.5} borderRadius="md">
                          Coverage Pending
                        </Badge>
                      )}
                      <Text fontSize="2xs" color="gray.500" mt={1}>
                        Coverage districts authorize dispatch assignment in the booking scheduler.
                      </Text>
                    </Box>

                    <Box pt={1.5} borderTop="1px dashed" borderColor="gray.100">
                      <Text color="gray.600" fontWeight="medium" mb={0.5}>
                        Residential / Service Address:
                      </Text>
                      <Text color="gray.700" lineHeight="short">
                        {techAddress}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </SimpleGrid>
            </TabPanel>

            {/* TAB 2: IDENTITY & KYC GATE */}
            <TabPanel px={0} pt={3}>
              <Box p={4} border="1px solid #e2e8f0" borderRadius="10px" bg="white">
                <Flex justify="space-between" align="center" mb={3} pb={2} borderBottom="1px solid" borderColor="gray.100">
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider">
                      GOVERNMENT IDENTITY DOCUMENTS
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                      Verified government identification documents for compliance and background safety.
                    </Text>
                  </Box>
                  <Badge colorScheme={isKycApproved ? "green" : "purple"} px={2.5} py={1} borderRadius="md">
                    {isKycApproved ? "KYC Approved" : "KYC Pending Verification"}
                  </Badge>
                </Flex>

                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} fontSize="xs" mb={3}>
                  <Box p={3} bg="gray.50" borderRadius="8px">
                    <Text color="gray.500" fontWeight="medium">Aadhaar Card</Text>
                    <Text fontWeight="bold" fontFamily="monospace" fontSize="sm" mt={1}>
                      {kycMatch?.aadhaarNumber ? (
                        isKycApproved
                          ? kycMatch.aadhaarNumber
                          : `•••• •••• ${String(kycMatch.aadhaarNumber).slice(-4)}`
                      ) : (
                        <Text as="span" color="gray.400" fontStyle="italic" fontSize="xs">Not Uploaded</Text>
                      )}
                    </Text>
                  </Box>

                  <Box p={3} bg="gray.50" borderRadius="8px">
                    <Text color="gray.500" fontWeight="medium">PAN Card</Text>
                    <Text fontWeight="bold" fontFamily="monospace" fontSize="sm" mt={1}>
                      {kycMatch?.panNumber || (
                        <Text as="span" color="gray.400" fontStyle="italic" fontSize="xs">Not Uploaded</Text>
                      )}
                    </Text>
                  </Box>

                  <Box p={3} bg="gray.50" borderRadius="8px">
                    <Text color="gray.500" fontWeight="medium">Driving License</Text>
                    <Text fontWeight="bold" fontFamily="monospace" fontSize="sm" mt={1}>
                      {kycMatch?.drivingLicenseNumber || (
                        <Text as="span" color="gray.400" fontStyle="italic" fontSize="xs">Not Uploaded</Text>
                      )}
                    </Text>
                  </Box>
                </SimpleGrid>

                {onOpenKYCModal && (
                  <Flex justify="flex-end" pt={2}>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      leftIcon={<FaIdCard />}
                      onClick={() => {
                        onClose();
                        onOpenKYCModal(selectedTechnician);
                      }}
                    >
                      {isKycApproved ? "View KYC Documents & Photos" : "Review & Verify KYC Documents"}
                    </Button>
                  </Flex>
                )}
              </Box>
            </TabPanel>

            {/* TAB 3: BANK & PAYOUTS */}
            <TabPanel px={0} pt={3}>
              <Box p={4} border="1px solid #e2e8f0" borderRadius="10px" bg="white">
                <Flex justify="space-between" align="center" mb={3} pb={2} borderBottom="1px solid" borderColor="gray.100">
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider">
                      PAYOUT BANK ACCOUNT & UPI
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                      Configured banking credentials for commission settlement and instant payouts.
                    </Text>
                  </Box>
                  <Badge colorScheme={isBankApproved ? "teal" : "orange"} px={2.5} py={1} borderRadius="md">
                    {isBankApproved ? "Payouts Enabled" : "Pending Verification"}
                  </Badge>
                </Flex>

                {bankDetails && (bankDetails.accountHolderName || bankDetails.accountNumber || bankDetails.bankName || bankDetails.upiId) ? (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} fontSize="xs" mb={3}>
                    <Box p={3} bg="gray.50" borderRadius="8px">
                      <Text color="gray.500" fontWeight="medium">Account Holder</Text>
                      <Text fontWeight="bold" color="gray.800" mt={0.5}>{bankDetails.accountHolderName || "N/A"}</Text>
                    </Box>

                    <Box p={3} bg="gray.50" borderRadius="8px">
                      <Text color="gray.500" fontWeight="medium">Bank Name</Text>
                      <Text fontWeight="bold" color="gray.800" mt={0.5}>{bankDetails.bankName || "N/A"}</Text>
                    </Box>

                    <Box p={3} bg="gray.50" borderRadius="8px">
                      <Text color="gray.500" fontWeight="medium">Account Number</Text>
                      <Text fontWeight="bold" fontFamily="monospace" color="gray.800" mt={0.5}>
                        {bankDetails.accountNumber || "N/A"}
                      </Text>
                    </Box>

                    <Box p={3} bg="gray.50" borderRadius="8px">
                      <Text color="gray.500" fontWeight="medium">IFSC Code</Text>
                      <Text fontWeight="bold" fontFamily="monospace" color="gray.800" mt={0.5}>
                        {bankDetails.ifscCode || "N/A"}
                      </Text>
                    </Box>

                    <Box p={3} bg="gray.50" borderRadius="8px" gridColumn={{ base: "span 1", sm: "span 2" }}>
                      <Text color="gray.500" fontWeight="medium">UPI ID (VPA)</Text>
                      <Text fontWeight="bold" color="gray.800" wordBreak="break-all" mt={0.5}>
                        {bankDetails.upiId || "N/A"}
                      </Text>
                    </Box>
                  </SimpleGrid>
                ) : (
                  <Box p={4} textAlign="center" bg="gray.50" borderRadius="8px" mb={3}>
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">
                      No bank details configured for this technician.
                    </Text>
                  </Box>
                )}

                {onOpenBankModal && (
                  <Flex justify="flex-end" pt={2}>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      leftIcon={<FaUniversity />}
                      onClick={() => {
                        onClose();
                        onOpenBankModal(selectedTechnician);
                      }}
                    >
                      {isBankApproved ? "View Bank Details" : "Review & Verify Bank"}
                    </Button>
                  </Flex>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </AppModal>
  );
}
