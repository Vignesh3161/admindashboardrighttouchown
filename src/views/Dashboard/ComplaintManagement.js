import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Heading,
  VStack,
  HStack,
  Center,
  Spinner,
  Textarea,
  Image,
  Icon,
  Tag,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  useColorMode,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import {
  FaSearch,
  FaUser,
  FaUserTie,
  FaShieldAlt,
} from "react-icons/fa";
import {
  MdReportProblem,
  MdGavel,
  MdPriceCheck,
} from "react-icons/md";
import { useAppToast } from "components/feedback";
import RefreshButton from "components/common/RefreshButton";
import StatusBadge from "components/common/StatusBadge";
import { TableSkeleton } from "components/common";
import {
  listComplaints,
  getComplaintDetail,
  rejectComplaint,
  updateComplaintStatus,
  recommendPenaltyReversal,
  approvePenaltyReversal,
  rejectPenaltyReversal,
  listRefunds,
  approveRefund,
  retryRefund,
} from "api/refundsComplaints";
import { useAppSelector } from "store/hooks";

const BRAND = "#008080";

const formatINR = (val) => {
  const num = parseFloat(val || 0);
  if (isNaN(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
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

export default function ComplaintManagement() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const toast = useAppToast();

  const user = useAppSelector((s) => s.auth?.user);
  const isOwner = user?.role === "owner" || user?.role === "Owner";

  const [activeTab, setActiveTab] = useState(0);
  const [complaints, setComplaints] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer detail state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Action state in drawer
  const [resolutionNote, setResolutionNote] = useState("");
  const [faultParty, setFaultParty] = useState("technician");
  const [reversalAmount, setReversalAmount] = useState("");
  const [reversalNote, setReversalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence Image Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch Complaints
  const fetchComplaintsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listComplaints({ status: statusFilter, search: searchTerm });
      if (res?.data?.reports) {
        setComplaints(res.data.reports);
      } else if (Array.isArray(res?.data)) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      toast.error(err?.message || "Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  // Fetch Refunds
  const fetchRefundsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listRefunds({ status: statusFilter === "all" ? undefined : statusFilter });
      const list = res?.data?.refunds || res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      setRefunds(list);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      toast.error(err?.message || "Failed to load refunds");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    if (activeTab === 3) {
      fetchRefundsData();
    } else {
      fetchComplaintsData();
    }
  }, [activeTab, fetchComplaintsData, fetchRefundsData]);

  // Tab categorization
  const customerComplaints = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.category !== "post_completion_cancellation" &&
        c.category !== "technician_misconduct" &&
        c.penaltyStatus === "none"
    );
  }, [complaints]);

  const technicianComplaints = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.category === "technician_misconduct" ||
        c.complaint?.toLowerCase().includes("technician") ||
        c.faultParty === "customer"
    );
  }, [complaints]);

  const cancellationRequests = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.category === "post_completion_cancellation" ||
        c.complaint?.toLowerCase().includes("cancel")
    );
  }, [complaints]);

  const penaltyAppeals = useMemo(() => {
    return complaints.filter((c) => c.penaltyStatus && c.penaltyStatus !== "none");
  }, [complaints]);

  const openComplaintDrawer = async (item) => {
    try {
      setIsLoadingDetail(true);
      setIsDrawerOpen(true);
      setResolutionNote("");
      setReversalAmount("");
      setReversalNote("");

      const res = await getComplaintDetail(item._id);
      if (res?.data?.report) {
        setSelectedComplaint({
          ...res.data.report,
          booking: res.data.booking,
          reserveHolds: res.data.reserveHolds,
        });
      } else {
        setSelectedComplaint(item);
      }
    } catch (err) {
      setSelectedComplaint(item);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Reversal recommendation action (Admin / Owner)
  const handleRecommendReversal = async () => {
    if (!reversalAmount || isNaN(reversalAmount) || Number(reversalAmount) <= 0) {
      toast.error("Please enter a valid reversal amount");
      return;
    }
    if (!reversalNote.trim()) {
      toast.error("Please specify a reason or note for recommending reversal");
      return;
    }
    try {
      setIsSubmitting(true);
      const amountPaise = Math.round(Number(reversalAmount) * 100);
      await recommendPenaltyReversal(selectedComplaint._id, {
        amountPaise,
        note: reversalNote,
      });
      toast.success("Penalty reversal recommended to Owner for approval");
      setIsDrawerOpen(false);
      fetchComplaintsData();
    } catch (err) {
      toast.error(err?.message || "Failed to recommend penalty reversal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Owner Approve Reversal action
  const handleApproveReversal = async () => {
    try {
      setIsSubmitting(true);
      const amountPaise = selectedComplaint.recommendedReversalPaise || Math.round(Number(reversalAmount || 100) * 100);
      await approvePenaltyReversal(selectedComplaint._id, {
        amountPaise,
        note: reversalNote || "Owner approved penalty reversal",
      });
      toast.success("Penalty reversed and wallet credited successfully!");
      setIsDrawerOpen(false);
      fetchComplaintsData();
    } catch (err) {
      toast.error(err?.message || "Failed to approve penalty reversal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Owner Reject Reversal action
  const handleRejectReversal = async () => {
    try {
      setIsSubmitting(true);
      await rejectPenaltyReversal(selectedComplaint._id, {
        reason: reversalNote || "Owner rejected penalty reversal appeal",
      });
      toast.success("Penalty reversal appeal rejected");
      setIsDrawerOpen(false);
      fetchComplaintsData();
    } catch (err) {
      toast.error(err?.message || "Failed to reject reversal appeal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve complaint action
  const handleResolveComplaint = async (withRefund = false) => {
    try {
      setIsSubmitting(true);
      await updateComplaintStatus(selectedComplaint._id, {
        status: withRefund ? "resolved_refunded" : "resolved_no_refund",
        resolutionNote: resolutionNote || "Resolved by Admin",
        faultParty,
      });
      toast.success(`Complaint resolved ${withRefund ? "with refund" : "without refund"}`);
      setIsDrawerOpen(false);
      fetchComplaintsData();
    } catch (err) {
      toast.error(err?.message || "Failed to resolve complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject complaint action
  const handleRejectComplaint = async () => {
    try {
      setIsSubmitting(true);
      await rejectComplaint(selectedComplaint._id, {
        reason: resolutionNote || "Complaint dismissed after review",
      });
      toast.success("Complaint rejected");
      setIsDrawerOpen(false);
      fetchComplaintsData();
    } catch (err) {
      toast.error(err?.message || "Failed to reject complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper render for complaint table
  const renderComplaintTable = (list) => {
    if (isLoading) return <TableSkeleton rows={6} columns={6} />;
    if (!list || list.length === 0) {
      return (
        <Center py={12} flexDirection="column" gap={2}>
          <Icon as={MdReportProblem} boxSize={10} color="gray.300" />
          <Text fontSize="sm" color="gray.500" fontWeight="600">
            No complaints found in this category.
          </Text>
        </Center>
      );
    }

    return (
      <Box overflowX="auto" borderRadius="14px" border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
        <Table variant="simple" size="sm">
          <Thead bg={isDark ? "gray.900" : "gray.50"}>
            <Tr>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase" py={3.5}>Complaint & ID</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Customer</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Technician</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Category / Reason</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Status</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Penalty Status</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Logged At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {list.map((c) => {
              const cust = c.customerId;
              const tech = c.technicianId?.userId;
              const custName = cust ? `${cust.fname || ""} ${cust.lname || ""}`.trim() || cust.mobileNumber : "Customer";
              const techName = tech ? `${tech.fname || ""} ${tech.lname || ""}`.trim() : "Unassigned";

              return (
                <Tr
                  key={c._id}
                  cursor="pointer"
                  _hover={{ bg: isDark ? "gray.800" : "teal.50" }}
                  transition="background 0.15s ease"
                  onClick={() => openComplaintDrawer(c)}
                >
                  <Td maxW="240px">
                    <VStack align="flex-start" spacing={0.5}>
                      <Text fontSize="xs" fontWeight="700" color={isDark ? "white" : "gray.850"} noOfLines={1}>
                        {c.complaint || "Customer complaint"}
                      </Text>
                      <Text fontSize="3xs" color="gray.400" fontFamily="mono">
                        ID: #{String(c._id).slice(-8)}
                      </Text>
                    </VStack>
                  </Td>

                  <Td maxW="160px">
                    <HStack spacing={1.5}>
                      <Icon as={FaUser} boxSize={3} color="teal.500" />
                      <Text fontSize="xs" fontWeight="600" color={isDark ? "gray.200" : "gray.800"} noOfLines={1}>
                        {custName}
                      </Text>
                    </HStack>
                  </Td>

                  <Td maxW="160px">
                    <HStack spacing={1.5}>
                      <Icon as={FaUserTie} boxSize={3} color="teal.600" />
                      <Text fontSize="xs" fontWeight="600" color={isDark ? "gray.200" : "gray.800"} noOfLines={1}>
                        {techName}
                      </Text>
                    </HStack>
                  </Td>

                  <Td>
                    <Tag size="sm" colorScheme="blue" variant="subtle" borderRadius="full" fontSize="3xs">
                      {c.category?.replace(/_/g, " ") || "general"}
                    </Tag>
                  </Td>

                  <Td>
                    <StatusBadge
                      colorScheme={
                        c.status?.includes("resolved")
                          ? "green"
                          : c.status === "open"
                          ? "red"
                          : "yellow"
                      }
                      label={c.status?.replace(/_/g, " ") || "open"}
                      variant="subtle"
                    />
                  </Td>

                  <Td>
                    <Badge
                      fontSize="3xs"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      colorScheme={
                        c.penaltyStatus === "applied"
                          ? "red"
                          : c.penaltyStatus === "reversed"
                          ? "green"
                          : c.penaltyStatus?.includes("recommended")
                          ? "purple"
                          : "gray"
                      }
                    >
                      {c.penaltyStatus?.replace(/_/g, " ") || "none"}
                    </Badge>
                  </Td>

                  <Td fontSize="2xs" color="gray.500" whiteSpace="nowrap">
                    {formatDate(c.createdAt)}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    );
  };

  // Helper render for refunds table
  const renderRefundsTable = () => {
    if (isLoading) return <TableSkeleton rows={6} columns={6} />;
    if (!refunds || refunds.length === 0) {
      return (
        <Center py={12} flexDirection="column" gap={2}>
          <Icon as={MdPriceCheck} boxSize={10} color="gray.300" />
          <Text fontSize="sm" color="gray.500" fontWeight="600">
            No refund requests found.
          </Text>
        </Center>
      );
    }

    return (
      <Box overflowX="auto" borderRadius="14px" border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
        <Table variant="simple" size="sm">
          <Thead bg={isDark ? "gray.900" : "gray.50"}>
            <Tr>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase" py={3.5}>Refund ID</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Booking ID</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase" isNumeric>Amount</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Gateway / Mode</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Status</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Requested At</Th>
              <Th color="gray.500" fontSize="2xs" textTransform="uppercase">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {refunds.map((r) => {
              const isPending = r.status === "pending" || r.status === "requested";
              const isFailed = r.status === "failed";

              return (
                <Tr key={r._id} _hover={{ bg: isDark ? "gray.800" : "gray.50" }}>
                  <Td fontSize="xs" fontFamily="mono" fontWeight="700">
                    #{String(r._id).slice(-8)}
                  </Td>
                  <Td fontSize="xs" fontFamily="mono" color="gray.500">
                    {r.bookingId ? `#${String(r.bookingId).slice(-8)}` : "—"}
                  </Td>
                  <Td fontSize="xs" fontWeight="900" color="red.600" isNumeric>
                    {formatINR(r.amountPaise ? r.amountPaise / 100 : r.amount)}
                  </Td>
                  <Td fontSize="xs" textTransform="uppercase">
                    {r.provider || "Razorpay"} ({r.mode || "Online"})
                  </Td>
                  <Td>
                    <StatusBadge
                      colorScheme={r.status === "processed" || r.status === "completed" ? "green" : isFailed ? "red" : "yellow"}
                      label={r.status || "pending"}
                      variant="subtle"
                    />
                  </Td>
                  <Td fontSize="2xs" color="gray.500" whiteSpace="nowrap">
                    {formatDate(r.createdAt)}
                  </Td>
                  <Td>
                    {isOwner && isPending && (
                      <Button
                        size="xs"
                        colorScheme="teal"
                        borderRadius="md"
                        onClick={async () => {
                          try {
                            await approveRefund(r._id, user?._id);
                            toast.success("Refund approved");
                            fetchRefundsData();
                          } catch (e) {
                            toast.error(e?.message || "Failed to approve refund");
                          }
                        }}
                      >
                        Approve
                      </Button>
                    )}
                    {isOwner && isFailed && (
                      <Button
                        size="xs"
                        colorScheme="orange"
                        variant="outline"
                        borderRadius="md"
                        onClick={async () => {
                          try {
                            await retryRefund(r._id);
                            toast.success("Refund retry initiated");
                            fetchRefundsData();
                          } catch (e) {
                            toast.error(e?.message || "Failed to retry refund");
                          }
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    );
  };

  return (
    <Box pt={0} px={0} pb={10}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <HStack spacing={3}>
              <Box p={2.5} bg="teal.50" borderRadius="xl" color={BRAND}>
                <Icon as={MdReportProblem} boxSize={6} />
              </Box>
              <Box>
                <Heading size="lg" fontWeight="800" color={isDark ? "white" : "gray.800"}>
                  Complaint & Grievance Management
                </Heading>
                <Text fontSize="sm" color="gray.500" mt={0.5}>
                  Unified dispute resolution, penalty appeals, refunds and cancellation adjudication
                </Text>
              </Box>
            </HStack>
          </Box>

          <HStack spacing={3}>
            <RefreshButton
              onClick={() => {
                if (activeTab === 3) fetchRefundsData();
                else fetchComplaintsData();
              }}
              isLoading={isLoading}
            />
          </HStack>
        </Flex>

        {/* Search & Filter Bar */}
        <Flex gap={3} flexWrap="wrap" align="center" bg={isDark ? "gray.850" : "white"} p={4} borderRadius="xl" border="1px solid" borderColor={isDark ? "gray.750" : "gray.100"}>
          <InputGroup maxW={{ base: "100%", md: "320px" }} size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search complaint, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>

          <Select
            size="sm"
            maxW="180px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            borderRadius="lg"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved_refunded">Resolved (Refunded)</option>
            <option value="resolved_no_refund">Resolved (No Refund)</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </Flex>

        {/* Tabbed Navigation */}
        <Tabs
          variant="line"
          colorScheme="teal"
          index={activeTab}
          onChange={(idx) => setActiveTab(idx)}
        >
          <TabList borderBottom="2px solid" borderColor={isDark ? "gray.700" : "gray.200"} mb={4}>
            <Tab fontWeight="700" fontSize="sm">
              Customer Complaints
              <Badge ml={2} colorScheme="teal" borderRadius="full">{customerComplaints.length}</Badge>
            </Tab>
            <Tab fontWeight="700" fontSize="sm">
              Technician Grievances
              <Badge ml={2} colorScheme="purple" borderRadius="full">{technicianComplaints.length}</Badge>
            </Tab>
            <Tab fontWeight="700" fontSize="sm">
              Cancellation Requests
              <Badge ml={2} colorScheme="orange" borderRadius="full">{cancellationRequests.length}</Badge>
            </Tab>
            <Tab fontWeight="700" fontSize="sm">
              Refund Requests
              <Badge ml={2} colorScheme="red" borderRadius="full">{refunds.length}</Badge>
            </Tab>
            <Tab fontWeight="700" fontSize="sm">
              Penalty Appeals & Reversals
              <Badge ml={2} colorScheme="teal" borderRadius="full">{penaltyAppeals.length}</Badge>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Customer Complaints */}
            <TabPanel p={0}>
              {renderComplaintTable(customerComplaints)}
            </TabPanel>

            {/* Tab 2: Technician Complaints */}
            <TabPanel p={0}>
              {renderComplaintTable(technicianComplaints)}
            </TabPanel>

            {/* Tab 3: Cancellation Requests */}
            <TabPanel p={0}>
              {renderComplaintTable(cancellationRequests)}
            </TabPanel>

            {/* Tab 4: Refund Requests */}
            <TabPanel p={0}>
              {renderRefundsTable()}
            </TabPanel>

            {/* Tab 5: Penalty Appeals */}
            <TabPanel p={0}>
              {renderComplaintTable(penaltyAppeals)}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* ================= COMPLAINT DETAILS & RESOLUTION DRAWER ================= */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        size="lg"
        onClose={() => setIsDrawerOpen(false)}
      >
        <DrawerOverlay />
        <DrawerContent bg={isDark ? "gray.900" : "white"}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={isDark ? "gray.800" : "gray.100"}>
            <HStack spacing={3}>
              <Box p={2} bg="teal.50" borderRadius="lg" color={BRAND}>
                <Icon as={MdGavel} boxSize={5} />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="bold" color={isDark ? "white" : "gray.800"}>
                  Complaint Adjudication Dossier
                </Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  #{String(selectedComplaint?._id).slice(-10)}
                </Text>
              </Box>
            </HStack>
          </DrawerHeader>

          <DrawerBody py={5}>
            {isLoadingDetail ? (
              <Center py={20}>
                <Spinner color={BRAND} />
              </Center>
            ) : selectedComplaint ? (
              <VStack spacing={5} align="stretch">
                {/* Status & Category Banner */}
                <Box
                  p={4}
                  borderRadius="xl"
                  bg={isDark ? "gray.800" : "gray.50"}
                  border="1px solid"
                  borderColor={isDark ? "gray.700" : "gray.200"}
                >
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <HStack spacing={2}>
                      <Tag colorScheme="blue" borderRadius="md" fontWeight="bold">
                        {selectedComplaint.category?.replace(/_/g, " ").toUpperCase()}
                      </Tag>
                      <StatusBadge
                        colorScheme={
                          selectedComplaint.status?.includes("resolved")
                            ? "green"
                            : selectedComplaint.status === "open"
                            ? "red"
                            : "yellow"
                        }
                        label={selectedComplaint.status?.replace(/_/g, " ") || "open"}
                        variant="subtle"
                      />
                    </HStack>
                    <Text fontSize="2xs" color="gray.500">
                      Filed: {formatDate(selectedComplaint.createdAt)}
                    </Text>
                  </Flex>

                  <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"} mt={3}>
                    Complaint Description:
                  </Text>
                  <Text fontSize="xs" color={isDark ? "gray.300" : "gray.700"} mt={1} p={3} bg={isDark ? "gray.850" : "white"} borderRadius="md" border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                    {selectedComplaint.complaint || "No statement provided."}
                  </Text>
                </Box>

                {/* Evidence Attachment */}
                {selectedComplaint.image && (
                  <Box>
                    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>
                      Dispute Evidence
                    </Text>
                    <Image
                      src={selectedComplaint.image}
                      alt="Complaint Evidence"
                      maxH="200px"
                      borderRadius="lg"
                      objectFit="cover"
                      cursor="pointer"
                      onClick={() => setPreviewImage(selectedComplaint.image)}
                      border="1px solid"
                      borderColor={isDark ? "gray.700" : "gray.200"}
                    />
                  </Box>
                )}

                {/* Stakeholders Card */}
                <Box>
                  <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>
                    Associated Parties
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                    <Box p={3} borderRadius="lg" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                      <HStack spacing={1.5} mb={1}>
                        <Icon as={FaUser} boxSize={3.5} color="teal.500" />
                        <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Customer</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                        {selectedComplaint.customerId
                          ? `${selectedComplaint.customerId.fname || ""} ${selectedComplaint.customerId.lname || ""}`.trim()
                          : "Customer"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">{selectedComplaint.customerId?.mobileNumber}</Text>
                    </Box>

                    <Box p={3} borderRadius="lg" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                      <HStack spacing={1.5} mb={1}>
                        <Icon as={FaUserTie} boxSize={3.5} color="teal.600" />
                        <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Assigned Technician</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                        {selectedComplaint.technicianId?.userId
                          ? `${selectedComplaint.technicianId.userId.fname || ""} ${selectedComplaint.technicianId.userId.lname || ""}`.trim()
                          : "Unassigned"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">{selectedComplaint.technicianId?.userId?.mobileNumber}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Penalty Lifecycle & Reversal Section */}
                {selectedComplaint.penaltyStatus && selectedComplaint.penaltyStatus !== "none" && (
                  <Box p={4} borderRadius="xl" bg={isDark ? "gray.850" : "purple.50"} border="1px solid" borderColor="purple.200">
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack spacing={2}>
                        <Icon as={FaShieldAlt} color="purple.600" />
                        <Text fontSize="xs" fontWeight="800" color="purple.800" textTransform="uppercase">
                          Technician Penalty Status
                        </Text>
                      </HStack>
                      <Badge colorScheme={selectedComplaint.penaltyStatus === "applied" ? "red" : selectedComplaint.penaltyStatus === "reversed" ? "green" : "purple"}>
                        {selectedComplaint.penaltyStatus?.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </Flex>

                    <SimpleGrid columns={2} spacing={2} fontSize="xs" my={2}>
                      <Box>
                        <Text color="gray.500">Applied Penalty:</Text>
                        <Text fontWeight="800" color="red.600">
                          {formatINR((selectedComplaint.penaltyAppliedPaise || selectedComplaint.policyAmountPaise || 0) / 100)}
                        </Text>
                      </Box>
                      {selectedComplaint.reversedPenaltyPaise > 0 && (
                        <Box>
                          <Text color="gray.500">Reversed Amount:</Text>
                          <Text fontWeight="800" color="green.600">
                            {formatINR(selectedComplaint.reversedPenaltyPaise / 100)}
                          </Text>
                        </Box>
                      )}
                    </SimpleGrid>

                    {/* Reversal Recommendation / Approval Controls */}
                    {selectedComplaint.penaltyStatus === "applied" && (
                      <VStack align="stretch" spacing={3} mt={3} pt={3} borderTop="1px dashed" borderColor="purple.300">
                        <Text fontSize="xs" fontWeight="700" color="purple.900">
                          Recommend Penalty Reversal
                        </Text>
                        <Input
                          size="sm"
                          placeholder="Reversal Amount in ₹ (e.g. 100)"
                          value={reversalAmount}
                          onChange={(e) => setReversalAmount(e.target.value)}
                          borderRadius="md"
                          bg={isDark ? "gray.900" : "white"}
                        />
                        <Textarea
                          size="sm"
                          placeholder="Reversal reason or justification..."
                          value={reversalNote}
                          onChange={(e) => setReversalNote(e.target.value)}
                          borderRadius="md"
                          bg={isDark ? "gray.900" : "white"}
                        />
                        <Button
                          size="sm"
                          colorScheme="purple"
                          borderRadius="md"
                          isLoading={isSubmitting}
                          onClick={handleRecommendReversal}
                        >
                          Recommend Reversal to Owner
                        </Button>
                      </VStack>
                    )}

                    {selectedComplaint.penaltyStatus === "reversal_recommended" && isOwner && (
                      <VStack align="stretch" spacing={3} mt={3} pt={3} borderTop="1px dashed" borderColor="purple.300">
                        <Alert status="info" borderRadius="md" py={2}>
                          <AlertIcon />
                          <Text fontSize="xs">
                            Recommended reversal: <strong>{formatINR((selectedComplaint.recommendedReversalPaise || 10000) / 100)}</strong> by Admin.
                          </Text>
                        </Alert>
                        <HStack spacing={2}>
                          <Button
                            flex={1}
                            size="sm"
                            colorScheme="green"
                            borderRadius="md"
                            isLoading={isSubmitting}
                            onClick={handleApproveReversal}
                          >
                            Approve Reversal & Credit Wallet
                          </Button>
                          <Button
                            flex={1}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            borderRadius="md"
                            isLoading={isSubmitting}
                            onClick={handleRejectReversal}
                          >
                            Reject Appeal
                          </Button>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                )}

                {/* Resolution Action Area */}
                {selectedComplaint.status === "open" && (
                  <Box p={4} borderRadius="xl" bg={isDark ? "gray.800" : "gray.50"} border="1px solid" borderColor={isDark ? "gray.700" : "gray.200"}>
                    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>
                      Adjudication Decision
                    </Text>
                    <VStack spacing={3} align="stretch">
                      <Select
                        size="sm"
                        value={faultParty}
                        onChange={(e) => setFaultParty(e.target.value)}
                        borderRadius="md"
                      >
                        <option value="technician">Fault: Technician</option>
                        <option value="customer">Fault: Customer</option>
                        <option value="company">Fault: Company / System</option>
                      </Select>

                      <Textarea
                        size="sm"
                        placeholder="Resolution summary or closing remarks..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        borderRadius="md"
                        rows={2}
                      />

                      <HStack spacing={2} pt={2}>
                        <Button
                          flex={1}
                          size="sm"
                          colorScheme="teal"
                          borderRadius="md"
                          isLoading={isSubmitting}
                          onClick={() => handleResolveComplaint(false)}
                        >
                          Resolve (No Refund)
                        </Button>
                        {isOwner && (
                          <Button
                            flex={1}
                            size="sm"
                            colorScheme="green"
                            borderRadius="md"
                            isLoading={isSubmitting}
                            onClick={() => handleResolveComplaint(true)}
                          >
                            Resolve & Refund
                          </Button>
                        )}
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          borderRadius="md"
                          isLoading={isSubmitting}
                          onClick={handleRejectComplaint}
                        >
                          Dismiss / Reject
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                )}
              </VStack>
            ) : null}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={isDark ? "gray.800" : "gray.100"}>
            <Button size="sm" variant="outline" onClick={() => setIsDrawerOpen(false)} borderRadius="8px">
              Close Dossier
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ================= EVIDENCE IMAGE ZOOM MODAL ================= */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} size="2xl">
        <ModalOverlay />
        <ModalContent bg={isDark ? "gray.900" : "white"}>
          <ModalHeader>Dispute Evidence Attachment</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={4}>
            {previewImage && (
              <Image src={previewImage} alt="Enlarged Evidence" borderRadius="md" w="100%" objectFit="contain" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
