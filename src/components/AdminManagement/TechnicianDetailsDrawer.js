import React, { useState, useEffect, useMemo } from "react";
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
  IconButton,
  Tooltip,
  Image,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import {
  FaUserGraduate,
  FaUniversity,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBriefcase,
  FaStar,
  FaCalendarAlt,
  FaCheck,
  FaUserSlash,
  FaCopy,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTools,
  FaWrench,
  FaLock,
  FaUnlock,
  FaEdit,
  FaExclamationTriangle,
  FaSyncAlt,
  FaClipboardList,
  FaChevronDown,
  FaWallet,
  FaMoneyBillWave,
} from "react-icons/fa";
import { getTechnicianWalletOverview, freezeTechnicianPayout } from "api/wallet";
import { MdOutlinePending, MdOutlineVerifiedUser, MdOutlineAccountBalance } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { useAppToast } from "components/feedback";
import { fetchServices } from "store/slices/referenceSlice";
import {
  fetchKYCDetail,
  verifyTechnicianKYC,
  editTechnicianKYC,
  verifyTechnicianBank,
  editTechnicianBank,
  setTrainingStatus,
  setWorkStatus,
} from "store/slices/techniciansSlice";
import { getKYCFullPII } from "views/utils/axiosInstance";
import WorkStatusPrerequisitesModal, { evaluateWorkStatusEligibility } from "./WorkStatusPrerequisitesModal";

export default function TechnicianDetailsDrawer({
  isOpen,
  onClose,
  selectedTechnician,
  setSelectedTechnician,
  initialTab = 0,
  allKycRecords = [],
  masterDistricts = [],
  isOwner = false,
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
  getImageUrl,
  onDataChanged,
}) {
  const dispatch = useAppDispatch();
  const toast = useAppToast();

  const [copiedId, setCopiedId] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 0);
  const [refreshing, setRefreshing] = useState(false);

  const servicesList = useAppSelector((state) => state.reference?.services?.data || []);

  useEffect(() => {
    if (isOpen && (!servicesList || servicesList.length === 0)) {
      dispatch(fetchServices());
    }
  }, [isOpen, servicesList, dispatch]);

  const [walletOverview, setWalletOverview] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 0);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !selectedTechnician?._id) {
      setWalletOverview(null);
      return;
    }
    let isMounted = true;
    const loadWallet = async () => {
      try {
        setWalletLoading(true);
        const { data, error } = await getTechnicianWalletOverview(selectedTechnician._id);
        if (!error && data && isMounted) {
          setWalletOverview(data?.result || data);
        }
      } catch {
        // Soft fail
      } finally {
        if (isMounted) setWalletLoading(false);
      }
    };
    loadWallet();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTechnician?._id]);

  const handleToggleFreezeDrawer = async () => {
    if (!isOwner || !selectedTechnician?._id) return;
    const currentlyBlocked = walletOverview?.payoutStatus?.payoutBlocked ?? selectedTechnician?.payoutBlocked ?? false;
    const action = currentlyBlocked ? "unfreeze" : "freeze";
    setFreezeLoading(true);
    try {
      const { data, error } = await freezeTechnicianPayout(selectedTechnician._id, {
        freeze: !currentlyBlocked,
        reason: currentlyBlocked ? "Unfrozen by administrator" : "Administrative hold via Technician Details Drawer",
      });
      if (error) throw new Error(error);
      toast({
        title: currentlyBlocked ? "Payouts Unfrozen" : "Payouts Frozen",
        description: `Successfully ${action}d technician payouts.`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      const refreshRes = await getTechnicianWalletOverview(selectedTechnician._id);
      if (refreshRes?.data) setWalletOverview(refreshRes.data.result || refreshRes.data);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      toast.error(err, {
        title: "Payout Hold Failed",
        description: err.message || `Failed to ${action} payouts.`,
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setFreezeLoading(false);
    }
  };

  // KYC Verification state inside drawer
  const [kycData, setKYCData] = useState(null);
  const [kycLoading, setKYcLoading] = useState(false);
  const [isUnmaskedPII, setIsUnmaskedPII] = useState(false);
  const [showKycRejection, setShowKycRejection] = useState(false);
  const [kycRejectionReason, setKycRejectionReason] = useState("");
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [kycEditForm, setKycEditForm] = useState({ aadhaarNumber: "", panNumber: "", drivingLicenseNumber: "" });
  const [savingKycEdit, setSavingKycEdit] = useState(false);

  // Bank Verification state inside drawer
  const [showBankRejection, setShowBankRejection] = useState(false);
  const [bankRejectionReason, setBankRejectionReason] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankEditForm, setBankEditForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
  });
  const [savingBankEdit, setSavingBankEdit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
  const [prereqEvaluation, setPrereqEvaluation] = useState(null);

  // Fetch / Sync KYC details when selectedTechnician changes
  // Defer full document fetch by 120ms to allow drawer CSS slide animation to complete at 60fps
  useEffect(() => {
    if (isOpen && selectedTechnician?._id) {
      syncBankForm();
      setShowKycRejection(false);
      setKycRejectionReason("");
      setIsEditingKyc(false);
      setShowBankRejection(false);
      setBankRejectionReason("");
      setIsEditingBank(false);
      setIsUnmaskedPII(false);

      const timer = setTimeout(() => {
        loadKycDetails(selectedTechnician._id);
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedTechnician?._id]);

  const loadKycDetails = async (techId) => {
    if (!techId) return;
    setKYcLoading(true);
    try {
      const { detail } = await dispatch(fetchKYCDetail(techId)).unwrap();
      setKYCData(detail);
      const rec = Array.isArray(detail)
        ? detail.find((d) => (d.technicianId?._id || d.technicianId) === techId) || detail[0]
        : detail;
      if (rec) {
        setKycEditForm({
          aadhaarNumber: rec.aadhaarNumber || "",
          panNumber: rec.panNumber || "",
          drivingLicenseNumber: rec.drivingLicenseNumber || "",
        });
      }
    } catch (e) {
      console.warn("Could not load KYC detail:", e);
      setKYCData(null);
    } finally {
      setKYcLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedTechnician?._id) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadKycDetails(selectedTechnician._id),
        onDataChanged ? Promise.resolve(onDataChanged()) : Promise.resolve(),
      ]);
      toast({
        title: "Profile Refreshed",
        description: "Technician details & verification gates refreshed.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (e) {
      // refresh error suppressed
    } finally {
      setRefreshing(false);
    }
  };

  const syncBankForm = () => {
    if (!selectedTechnician) return;
    const kycMatch = findKYCRecord ? findKYCRecord(selectedTechnician, allKycRecords) : null;
    const b = kycMatch?.bankDetails || selectedTechnician.bankDetails || selectedTechnician.profile?.bankDetails || selectedTechnician.bankAccount || {};
    setBankEditForm({
      accountHolderName: b.accountHolderName || "",
      bankName: b.bankName || "",
      accountNumber: b.accountNumber || "",
      ifscCode: b.ifscCode || "",
      branchName: b.branchName || "",
      upiId: b.upiId || "",
    });
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const approvedDistricts = useMemo(
    () => (getTechnicianApprovedDistricts && selectedTechnician ? getTechnicianApprovedDistricts(selectedTechnician) : []),
    [getTechnicianApprovedDistricts, selectedTechnician]
  );

  const kycMatch = useMemo(
    () => (findKYCRecord && selectedTechnician ? findKYCRecord(selectedTechnician, allKycRecords) : null),
    [findKYCRecord, selectedTechnician, allKycRecords]
  );

  const isKycApproved = useMemo(
    () => (isTechnicianKYCVerified && selectedTechnician ? isTechnicianKYCVerified(selectedTechnician, allKycRecords) : false),
    [isTechnicianKYCVerified, selectedTechnician, allKycRecords]
  );

  const isBankApproved = useMemo(
    () => (isTechnicianBankVerified && selectedTechnician ? isTechnicianBankVerified(selectedTechnician, allKycRecords) : false),
    [isTechnicianBankVerified, selectedTechnician, allKycRecords]
  );

  const activeKycRec = useMemo(() => {
    if (kycData) {
      return Array.isArray(kycData)
        ? kycData.find((d) => (d.technicianId?._id || d.technicianId) === selectedTechnician?._id) || kycData[0]
        : kycData;
    }
    return kycMatch;
  }, [kycData, selectedTechnician?._id, kycMatch]);

  const bankDetails = useMemo(() => {
    return (
      activeKycRec?.bankDetails ||
      kycMatch?.bankDetails ||
      selectedTechnician?.bankDetails ||
      selectedTechnician?.profile?.bankDetails ||
      selectedTechnician?.bankAccount ||
      {}
    );
  }, [activeKycRec, kycMatch, selectedTechnician]);

  const techId = String(selectedTechnician?._id || selectedTechnician?.id || "");
  const techName = useMemo(
    () => (getTechnicianName && selectedTechnician ? getTechnicianName(selectedTechnician, allKycRecords) : selectedTechnician?.name || "Technician"),
    [getTechnicianName, selectedTechnician, allKycRecords]
  );
  const techImage = useMemo(
    () => (getTechnicianImage && selectedTechnician ? getTechnicianImage(selectedTechnician, allKycRecords) : null),
    [getTechnicianImage, selectedTechnician, allKycRecords]
  );
  const techPhone = useMemo(
    () => (getTechnicianPhone && selectedTechnician ? getTechnicianPhone(selectedTechnician, allKycRecords) : selectedTechnician?.phone || ""),
    [getTechnicianPhone, selectedTechnician, allKycRecords]
  );
  const techEmail = useMemo(
    () => (getTechnicianEmail && selectedTechnician ? getTechnicianEmail(selectedTechnician, allKycRecords) : selectedTechnician?.email || ""),
    [getTechnicianEmail, selectedTechnician, allKycRecords]
  );
  const techDistrict = useMemo(
    () => (getTechnicianDistrict && selectedTechnician ? getTechnicianDistrict(selectedTechnician) : selectedTechnician?.district || ""),
    [getTechnicianDistrict, selectedTechnician]
  );
  const techAddress = useMemo(
    () => (getTechnicianAddress && selectedTechnician ? getTechnicianAddress(selectedTechnician, allKycRecords) : selectedTechnician?.address || "Not provided"),
    [getTechnicianAddress, selectedTechnician, allKycRecords]
  );
  const techSpecialization = useMemo(
    () => (getTechnicianSpecialization && selectedTechnician ? getTechnicianSpecialization(selectedTechnician) : "General"),
    [getTechnicianSpecialization, selectedTechnician]
  );
  const expYears = selectedTechnician?.experienceYears || selectedTechnician?.profile?.experienceYears || selectedTechnician?.experience || 0;

  const workStatus = (selectedTechnician?.workStatus || "pending").toLowerCase();
  const isOnline = Boolean(selectedTechnician?.availability?.isOnline);

  if (!isOpen || !selectedTechnician) return null;

  // --- Inline Gate 1 Training Handler ---
  const handleToggleTrainingAction = async () => {
    const nextStatus = !selectedTechnician.trainingCompleted;
    try {
      setActionLoading(true);
      await dispatch(setTrainingStatus({ id: selectedTechnician._id, completed: nextStatus })).unwrap();
      toast({
        title: nextStatus ? "Training Approved" : "Training Incomplete",
        description: `Gate 1 training marked as ${nextStatus ? "Completed" : "Pending"}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      if (setSelectedTechnician) {
        setSelectedTechnician((prev) => ({ ...prev, trainingCompleted: nextStatus }));
      }
      onDataChanged?.();
    } catch (err) {
      toast.error(err, { title: "Training Update Error", description: "Failed to update training status.", duration: 3000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Inline Work Status Handler ---
  const handleSetWorkStatusAction = async (newStatus) => {
    if (!isOwner) {
      toast({
        title: "Owner access required",
        description: "Only Owner accounts can change technician work status.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newStatus === "approved") {
      const evaluation = evaluateWorkStatusEligibility(
        selectedTechnician,
        allKycRecords,
        masterDistricts,
        isTechnicianKYCVerified,
        isTechnicianBankVerified,
        getTechnicianApprovedDistricts
      );
      if (!evaluation.isEligible) {
        setPrereqEvaluation(evaluation);
        setIsPrereqModalOpen(true);
        return;
      }
    }

    try {
      setActionLoading(true);
      await dispatch(setWorkStatus({
        technicianId: selectedTechnician._id,
        id: selectedTechnician._id,
        workStatus: newStatus,
        status: newStatus === "approved" ? "Active" : "Inactive",
        trainingCompleted: selectedTechnician.trainingCompleted ?? true,
      })).unwrap();
      toast({
        title: "Work Status Updated",
        description: `Technician status set to ${newStatus}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      if (setSelectedTechnician) {
        setSelectedTechnician((prev) => ({ ...prev, workStatus: newStatus, status: newStatus === "approved" ? "Active" : "Inactive" }));
      }
      onDataChanged?.();
    } catch (err) {
      toast.error(err, { title: "Status Update Error", description: "Failed to update work status.", duration: 3000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Inline KYC Handlers ---
  const handleToggleUnmaskedPII = async () => {
    if (isUnmaskedPII) {
      loadKycDetails(selectedTechnician._id);
      setIsUnmaskedPII(false);
      return;
    }
    setKYcLoading(true);
    try {
      const response = await getKYCFullPII(selectedTechnician._id);
      const fetched = response?.result ?? response?.data ?? response;
      setKYCData(fetched);
      setIsUnmaskedPII(true);
      toast({
        title: "Unmasked PII Loaded",
        description: "Full identity numbers are now visible. Access has been logged.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      toast.error(e, { title: "Audit Error", description: "Failed to retrieve unmasked KYC details.", duration: 3000, isClosable: true });
    } finally {
      setKYcLoading(false);
    }
  };

  const handleSaveKycNumbers = async () => {
    setSavingKycEdit(true);
    try {
      await dispatch(editTechnicianKYC({ id: selectedTechnician._id, body: kycEditForm })).unwrap();
      toast({
        title: "KYC Details Saved",
        description: "Technician identity document numbers updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditingKyc(false);
      await loadKycDetails(selectedTechnician._id);
      onDataChanged?.();
    } catch (e) {
      toast.error(e, { title: "Save Error", description: "Failed to update KYC numbers.", duration: 3000, isClosable: true });
    } finally {
      setSavingKycEdit(false);
    }
  };

  const handleVerifyKycDecision = async (status) => {
    if (status === "rejected" && (!kycRejectionReason || kycRejectionReason.trim() === "")) {
      return toast({
        title: "Rejection Reason Required",
        description: "Please specify why this KYC identity is being rejected.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    if (status === "approved") {
      const docs = activeKycRec?.documents || {};
      const hasDocs = Boolean(docs.aadhaarUrl || docs.panUrl || docs.dlUrl || docs.idUrl || docs.profileUrl);

      if (!hasDocs && !isKycApproved) {
        return toast({
          title: "Cannot Approve KYC",
          description: "Missing required identity documents. Technician must upload Aadhaar, PAN, or Driving License before approval.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
    }

    try {
      setKYcLoading(true);
      await dispatch(verifyTechnicianKYC({
        technicianId: selectedTechnician._id,
        status: status,
        rejectionReason: status === "rejected" ? kycRejectionReason : null,
      })).unwrap();
      toast({
        title: status === "approved" ? "KYC Approved" : "KYC Rejected",
        description: `Technician identity verification marked as ${status}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowKycRejection(false);
      setKycRejectionReason("");
      await loadKycDetails(selectedTechnician._id);
      onDataChanged?.();
    } catch (e) {
      const serverReason =
        (typeof e === "string"
          ? e
          : e?.message || e?.data?.message || e?.response?.data?.message || e?.error || "")
          .replace(/^Error:\s*/i, "")
          .trim();
      toast({
        title: "Verification Error",
        description: serverReason || "Failed to submit KYC verification.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setKYcLoading(false);
    }
  };

  // --- Inline Bank Handlers ---
  const handleSaveBankNumbers = async () => {
    setSavingBankEdit(true);
    try {
      await dispatch(editTechnicianBank({ id: selectedTechnician._id, body: bankEditForm })).unwrap();
      toast({
        title: "Bank Details Updated",
        description: "Technician payout bank details updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditingBank(false);
      onDataChanged?.();
    } catch (e) {
      toast.error(e, { title: "Save Error", description: "Failed to update bank details.", duration: 3000, isClosable: true });
    } finally {
      setSavingBankEdit(false);
    }
  };

  const handleVerifyBankDecision = async (verified) => {
    if (!verified && (!bankRejectionReason || bankRejectionReason.trim() === "")) {
      return toast({
        title: "Rejection Reason Required",
        description: "Please specify why the bank account is being rejected.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    try {
      setActionLoading(true);
      await dispatch(verifyTechnicianBank({
        technicianId: selectedTechnician._id,
        verified: verified,
        bankRejectionReason: !verified ? bankRejectionReason : null,
      })).unwrap();
      toast({
        title: verified ? "Bank Verified" : "Bank Rejected",
        description: verified
          ? "Technician bank verified for settlement."
          : "Bank verification rejected.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowBankRejection(false);
      setBankRejectionReason("");
      onDataChanged?.();
    } catch (e) {
      const serverReason =
        (typeof e === "string" ? e : e?.message || e?.data?.message || "")
          .replace(/^Error:\s*/i, "")
          .trim();
      toast({
        title: "Bank Verification Error",
        description: serverReason || "Failed to update bank verification status.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const docs = activeKycRec?.documents || {};
  const hasIdentityDocs = Boolean(docs.aadhaarUrl || docs.panUrl || docs.dlUrl || docs.idUrl || docs.profileUrl);

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
      <DrawerOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
      <DrawerContent
        minW={{ base: "100%", md: "720px", lg: "840px" }}
        maxW={{ base: "100%", md: "920px" }}
        bg="white"
        display="flex"
        flexDirection="column"
        h="100vh"
        boxShadow="2xl"
      >
        {/* STICKY 360° DRAWER HEADER */}
        <DrawerHeader
          borderBottomWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          py={3.5}
          px={{ base: 4, md: 6 }}
        >
          <Flex justify="space-between" align="center" pr={8} gap={3}>
            <HStack spacing={3} minW={0}>
              <Flex
                w="42px"
                h="42px"
                borderRadius="12px"
                bg={customColor}
                color="white"
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="md"
              >
                <FaUserTie size="20px" />
              </Flex>
              <Box minW={0}>
                <HStack spacing={2} align="center">
                  <Text fontSize="md" fontWeight="800" color="gray.800" noOfLines={1}>
                    Technician 360° Profile
                  </Text>
                  <Badge
                    colorScheme={isOnline ? "green" : "gray"}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontSize="3xs"
                    fontWeight="bold"
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Box w="5px" h="5px" borderRadius="full" bg={isOnline ? "green.500" : "gray.400"} />
                    {isOnline ? "Online Now" : "Offline"}
                  </Badge>
                </HStack>
                <HStack spacing={1} mt={0.5}>
                  <Text fontSize="2xs" color="gray.500" fontFamily="mono" isTruncated>
                    ID: #{techId.slice(-10)}
                  </Text>
                  <Tooltip label={copiedId ? "Copied!" : "Copy technician ID"} hasArrow>
                    <IconButton
                      size="2xs"
                      icon={copiedId ? <FaCheck size="9px" color="#16a34a" /> : <FaCopy size="9px" />}
                      variant="ghost"
                      colorScheme={copiedId ? "green" : "gray"}
                      onClick={() => handleCopy(techId, "id")}
                      aria-label="Copy technician ID"
                    />
                  </Tooltip>
                </HStack>
              </Box>
            </HStack>

            <Tooltip label="Refresh profile and verification" hasArrow>
              <IconButton
                size="sm"
                variant="ghost"
                colorScheme="teal"
                icon={<Icon as={FaSyncAlt} boxSize={3.5} />}
                isLoading={refreshing}
                onClick={handleRefresh}
                aria-label="Refresh profile and verification"
              />
            </Tooltip>
          </Flex>
          <DrawerCloseButton top={3.5} right={4} />
        </DrawerHeader>

        {/* DRAWER BODY */}
        <DrawerBody p={{ base: 4, md: 6 }} overflowY="auto">
          <VStack spacing={4} align="stretch">
            {/* HERO PROFILE CARD */}
            <Box
              p={{ base: 4, md: 5 }}
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
                    w="15px"
                    h="15px"
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
                      <HStack spacing={2} mt={1} flexWrap="wrap">
                        <Badge colorScheme="teal" px={2.5} py={0.5} borderRadius="md" fontWeight="bold" fontSize="xs">
                          {techSpecialization}
                        </Badge>
                        <Badge colorScheme="blue" variant="subtle" px={2} py={0.5} borderRadius="md" fontSize="xs">
                          {expYears} Years Exp
                        </Badge>
                        <HStack spacing={1} color="gray.700" fontSize="xs" fontWeight="semibold" ml={1}>
                          <FaStar color="#f59e0b" size="11px" />
                          <Text>
                            {selectedTechnician.rating?.avg ? Number(selectedTechnician.rating.avg).toFixed(1) : "0.0"}
                          </Text>
                          <Text color="gray.400" fontSize="2xs">
                            ({selectedTechnician.rating?.count || 0})
                          </Text>
                        </HStack>
                      </HStack>
                    </Box>
                  </Flex>

                  {/* Contact Info Row */}
                  <HStack spacing={4} mt={3} flexWrap="wrap" fontSize="xs">
                    {techPhone ? (
                      <Link
                        href={`tel:${techPhone}`}
                        color="teal.700"
                        fontWeight="semibold"
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        _hover={{ textDecoration: "underline", color: "teal.800" }}
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
                        _hover={{ textDecoration: "underline", color: "teal.800" }}
                      >
                        <FaEnvelope size="10px" />
                        {techEmail}
                      </Link>
                    )}

                    {techDistrict && (
                      <Text color="gray.600" display="flex" alignItems="center" gap={1.5} fontWeight="medium">
                        <FaMapMarkerAlt size="10px" color="#008080" />
                        {techDistrict}
                      </Text>
                    )}
                  </HStack>
                </Box>
              </Flex>

              {/* 4-GATE GOVERNANCE PIPELINE */}
              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2.5} mt={4} pt={3.5} borderTop="1px solid" borderColor="gray.200">
                {/* Gate 1 */}
                <Box
                  p={2.5}
                  borderRadius="8px"
                  bg={selectedTechnician.trainingCompleted ? "green.50" : "orange.50"}
                  border="1px solid"
                  borderColor={selectedTechnician.trainingCompleted ? "green.200" : "orange.200"}
                  cursor="pointer"
                  onClick={() => setActiveTab(0)}
                  _hover={{ shadow: "xs" }}
                >
                  <Text fontSize="2xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="0.3px">
                    Gate 1: Training
                  </Text>
                  <HStack spacing={1.5} mt={1}>
                    {selectedTechnician.trainingCompleted ? (
                      <FaCheckCircle color="#16a34a" size="12px" />
                    ) : (
                      <FaClock color="#ea580c" size="12px" />
                    )}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={selectedTechnician.trainingCompleted ? "green.700" : "orange.700"}
                    >
                      {selectedTechnician.trainingCompleted ? "Completed" : "Pending"}
                    </Text>
                  </HStack>
                </Box>

                {/* Gate 2 */}
                <Box
                  p={2.5}
                  borderRadius="8px"
                  bg={isKycApproved ? "green.50" : "purple.50"}
                  border="1px solid"
                  borderColor={isKycApproved ? "green.200" : "purple.200"}
                  cursor="pointer"
                  onClick={() => setActiveTab(1)}
                  _hover={{ shadow: "xs" }}
                >
                  <Text fontSize="2xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="0.3px">
                    Gate 2: KYC
                  </Text>
                  <HStack spacing={1.5} mt={1}>
                    {isKycApproved ? (
                      <FaCheckCircle color="#16a34a" size="12px" />
                    ) : (
                      <FaClock color="#9333ea" size="12px" />
                    )}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={isKycApproved ? "green.700" : "purple.700"}
                    >
                      {isKycApproved ? "Approved" : "Under Review"}
                    </Text>
                  </HStack>
                </Box>

                {/* Gate 3 */}
                <Box
                  p={2.5}
                  borderRadius="8px"
                  bg={isBankApproved ? "teal.50" : "orange.50"}
                  border="1px solid"
                  borderColor={isBankApproved ? "teal.200" : "orange.200"}
                  cursor="pointer"
                  onClick={() => setActiveTab(2)}
                  _hover={{ shadow: "xs" }}
                >
                  <Text fontSize="2xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="0.3px">
                    Gate 3: Bank
                  </Text>
                  <HStack spacing={1.5} mt={1}>
                    {isBankApproved ? (
                      <FaCheckCircle color="#008080" size="12px" />
                    ) : (
                      <FaClock color="#ea580c" size="12px" />
                    )}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={isBankApproved ? "teal.700" : "orange.700"}
                    >
                      {isBankApproved ? "Verified" : "Pending"}
                    </Text>
                  </HStack>
                </Box>

                {/* Work Status */}
                <Box
                  p={2.5}
                  borderRadius="8px"
                  bg={workStatus === "approved" ? "green.50" : workStatus === "suspended" ? "red.50" : "orange.50"}
                  border="1px solid"
                  borderColor={workStatus === "approved" ? "green.200" : workStatus === "suspended" ? "red.200" : "orange.200"}
                  cursor="pointer"
                  onClick={() => setActiveTab(0)}
                  _hover={{ shadow: "xs" }}
                >
                  <Text fontSize="2xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="0.3px">
                    Work Status
                  </Text>
                  <HStack spacing={1.5} mt={1}>
                    {workStatus === "approved" ? (
                      <FaCheckCircle color="#16a34a" size="12px" />
                    ) : workStatus === "suspended" ? (
                      <FaUserSlash color="#dc2626" size="12px" />
                    ) : (
                      <FaClock color="#ea580c" size="12px" />
                    )}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={workStatus === "approved" ? "green.700" : workStatus === "suspended" ? "red.700" : "orange.700"}
                      textTransform="capitalize"
                    >
                      {workStatus}
                    </Text>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>

            {/* GOVERNANCE & VERIFICATION PIPELINE TRACKER */}
            <Box
              p={4}
              borderRadius="14px"
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              boxShadow="xs"
            >
              <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={1}>
                <HStack spacing={2}>
                  <Icon as={FaClipboardList} color="teal.500" boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="800" color="gray.700" textTransform="uppercase" letterSpacing="wider">
                    Verification & Dispatch Pipeline
                  </Text>
                </HStack>
                <Text fontSize="2xs" color="gray.500">
                  {workStatus === "approved" ? "All gates cleared • Ready for dispatch" : "Pending prerequisites before field dispatch"}
                </Text>
              </Flex>

              <Flex align="center" justify="space-between" position="relative" px={{ base: 1, sm: 2 }}>
                {[
                  { key: "registered", label: "Registered", isDone: true, icon: FaCheckCircle, tabIndex: 0 },
                  { key: "training", label: "Gate 1: Training", isDone: Boolean(selectedTechnician.trainingCompleted), icon: FaUserGraduate, tabIndex: 0 },
                  { key: "kyc", label: "Gate 2: KYC", isDone: isKycApproved, icon: MdOutlineVerifiedUser, tabIndex: 1 },
                  { key: "bank", label: "Gate 3: Bank", isDone: isBankApproved, icon: FaUniversity, tabIndex: 2 },
                  { key: "workStatus", label: "Work Approved", isDone: workStatus === "approved", icon: FaBriefcase, tabIndex: 0 },
                ].map((step, idx, arr) => {
                  const isDone = step.isDone;
                  const isCurrent = !isDone && (idx === 0 || arr[idx - 1].isDone);
                  return (
                    <React.Fragment key={step.key}>
                      <VStack
                        spacing={1.5}
                        align="center"
                        zIndex={1}
                        cursor="pointer"
                        onClick={() => setActiveTab(step.tabIndex)}
                        minW="55px"
                      >
                        <Flex
                          w="30px"
                          h="30px"
                          borderRadius="full"
                          bg={isDone ? "teal.500" : isCurrent ? "orange.500" : "gray.200"}
                          color="white"
                          align="center"
                          justify="center"
                          boxShadow={isDone ? "0 0 0 3px rgba(0,128,128,0.15)" : isCurrent ? "0 0 0 3px rgba(249,115,22,0.15)" : "none"}
                          transition="all 0.2s"
                        >
                          <Icon as={isDone ? FaCheck : step.icon} boxSize={isDone ? 2.5 : 3} />
                        </Flex>
                        <Text
                          fontSize="3xs"
                          fontWeight={isDone || isCurrent ? "800" : "600"}
                          color={isDone ? "teal.700" : isCurrent ? "orange.700" : "gray.500"}
                          textAlign="center"
                          lineHeight="short"
                        >
                          {step.label}
                        </Text>
                      </VStack>
                      {idx < arr.length - 1 && (
                        <Box
                          flex="1"
                          minW="16px"
                          h="2px"
                          mt="-18px"
                          bg={isDone && arr[idx + 1].isDone ? "teal.500" : "gray.200"}
                          transition="background-color 0.2s"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Flex>
            </Box>

            {/* STRUCTURED DETAILS & INLINE VERIFICATION TABS */}
            <Tabs isLazy lazyBehavior="keepMounted" index={activeTab} onChange={(idx) => setActiveTab(idx)} variant="enclosed" colorScheme="teal" size="sm">
              <TabList borderBottom="2px solid" borderColor="gray.100">
                <Tab fontWeight="semibold">
                  <HStack spacing={1.5}>
                    <FaBriefcase size="12px" />
                    <Text>Skills & Operations</Text>
                  </HStack>
                </Tab>
                <Tab fontWeight="semibold">
                  <HStack spacing={1.5}>
                    <MdOutlineVerifiedUser size="14px" />
                    <Text>Gate 2: KYC Identity</Text>
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
                    <Text>Gate 3: Bank & Payouts</Text>
                    {!isBankApproved && (
                      <Badge colorScheme="orange" fontSize="3xs" borderRadius="full" px={1.5}>
                        Action
                      </Badge>
                    )}
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* ==================== TAB 1: SKILLS & OPERATIONS ==================== */}
                <TabPanel px={0} pt={3}>
                  <VStack spacing={3.5} align="stretch">
                    {/* Gate 1 & Work Status Inline Quick Action Bar */}
                    <Box p={3.5} borderRadius="10px" bg="teal.50" border="1px solid" borderColor="teal.100">
                      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase">
                            ⚡ Gate 1 & Work Status Controls
                          </Text>
                          <Text fontSize="2xs" color="gray.600">
                            Immediate training approval and technician field dispatch status.
                          </Text>
                        </Box>

                        <HStack spacing={2} flexWrap="wrap">
                          {!selectedTechnician.trainingCompleted && (
                            <Button
                              size="sm"
                              colorScheme="teal"
                              variant="solid"
                              leftIcon={<FaUserGraduate />}
                              onClick={handleToggleTrainingAction}
                              isLoading={actionLoading}
                            >
                              Approve Gate 1 Training
                            </Button>
                          )}

                          {isOwner && (
                            <Menu>
                              <MenuButton
                                as={Button}
                                size="sm"
                                bg="white"
                                border="1.5px solid"
                                borderColor="teal.500"
                                color="teal.800"
                                fontWeight="bold"
                                px={3.5}
                                py={2}
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
                                    w="8px"
                                    h="8px"
                                    borderRadius="full"
                                    bg={
                                      workStatus === "approved"
                                        ? "green.500"
                                        : workStatus === "suspended"
                                        ? "red.500"
                                        : "orange.400"
                                    }
                                    display="inline-block"
                                  />
                                }
                                rightIcon={<FaChevronDown fontSize="10px" />}
                              >
                                Change Status: {workStatus}
                              </MenuButton>
                              <MenuList fontSize="xs" zIndex={20} boxShadow="lg" borderRadius="10px">
                                <MenuItem
                                  icon={<FaCheck color="green" />}
                                  onClick={() => handleSetWorkStatusAction("approved")}
                                  fontWeight={workStatus === "approved" ? "bold" : "normal"}
                                >
                                  Approve Work Status
                                </MenuItem>
                                <MenuItem
                                  icon={<MdOutlinePending color="orange" />}
                                  onClick={() => handleSetWorkStatusAction("pending")}
                                  fontWeight={workStatus === "pending" ? "bold" : "normal"}
                                >
                                  Set Pending Status
                                </MenuItem>
                                <MenuItem
                                  icon={<FaUserSlash color="red" />}
                                  onClick={() => handleSetWorkStatusAction("suspended")}
                                  fontWeight={workStatus === "suspended" ? "bold" : "normal"}
                                >
                                  Suspend Technician
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </HStack>
                      </Flex>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {/* Professional Metrics Card */}
                      <Box p={4} border="1px solid #e2e8f0" borderRadius="10px" bg="white" boxShadow="xs">
                        <Flex align="center" gap={1.5} mb={3}>
                          <FaTools size="12px" color="#008080" />
                          <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider">
                            PROFESSIONAL METRICS & SKILLS
                          </Text>
                        </Flex>
                        <VStack align="stretch" spacing={2.5} fontSize="xs">
                          <Flex justify="space-between" align="center">
                            <Text color="gray.600" fontWeight="medium">Specialization:</Text>
                            <Badge colorScheme="teal" px={2.5} py={0.5} borderRadius="md" fontWeight="bold">
                              {techSpecialization}
                            </Badge>
                          </Flex>

                          <Flex justify="space-between" align="center">
                            <Text color="gray.600" fontWeight="medium">Experience in Trade:</Text>
                            <Text fontWeight="bold" color="gray.800">
                              {expYears} Years
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
                              <Text>
                                {selectedTechnician.rating?.avg ? Number(selectedTechnician.rating.avg).toFixed(1) : "0.0"}
                              </Text>
                              <Text color="gray.400" fontSize="2xs">
                                ({selectedTechnician.rating?.count || 0} reviews)
                              </Text>
                            </HStack>
                          </Flex>

                          {/* Verified Capabilities & Skills */}
                          {(() => {
                            const rawSkills = Array.isArray(selectedTechnician.skills) ? selectedTechnician.skills : [];
                            const parsedSkills = rawSkills
                              .map((s) => {
                                if (!s) return null;
                                if (typeof s === "string") {
                                  const str = s.trim();
                                  if (!str || str.toLowerCase() === "skill") return null;
                                  return { name: str, experience: "" };
                                }

                                let serviceName = "";
                                if (s.serviceId && typeof s.serviceId === "object") {
                                  serviceName = s.serviceId.serviceName || s.serviceId.name || "";
                                }

                                if (!serviceName) {
                                  serviceName = s.serviceName || s.skillName || "";
                                }

                                // Lookup by ID in servicesList
                                if (!serviceName) {
                                  const idToFind = String(
                                    (typeof s.serviceId === "object" ? s.serviceId?._id || s.serviceId?.id : s.serviceId) ||
                                    s.id ||
                                    s._id ||
                                    ""
                                  );
                                  if (idToFind && Array.isArray(servicesList) && servicesList.length > 0) {
                                    const match = servicesList.find((svc) => String(svc._id || svc.id) === idToFind);
                                    if (match) {
                                      serviceName = match.serviceName || match.name || "";
                                    }
                                  }
                                }

                                // Check other candidate fields, but ignore literal "SKILL"
                                if (!serviceName) {
                                  const candidate = s.name || s.skill || s.title || s.categoryName || "";
                                  if (candidate && candidate.toLowerCase() !== "skill") {
                                    serviceName = candidate;
                                  }
                                }

                                if (!serviceName || serviceName.toLowerCase() === "skill") return null;

                                const exp =
                                  typeof s.experienceYears === "number" && s.experienceYears > 0
                                    ? `${s.experienceYears} ${s.experienceYears === 1 ? "yr" : "yrs"}`
                                    : typeof s.experience === "string"
                                    ? s.experience
                                    : "";
                                return { name: serviceName.trim(), experience: exp };
                              })
                              .filter(Boolean);

                            const displaySkills =
                              parsedSkills.length > 0
                                ? parsedSkills
                                : selectedTechnician.specialization && selectedTechnician.specialization !== "General"
                                ? [{ name: selectedTechnician.specialization, experience: selectedTechnician.experience || "" }]
                                : [];

                            if (displaySkills.length === 0) {
                              return (
                                <Box pt={2} borderTop="1px dashed" borderColor="gray.100">
                                  <Text color="gray.600" fontWeight="medium" mb={1}>
                                    Verified Capabilities:
                                  </Text>
                                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                    No verified service skills mapped
                                  </Text>
                                </Box>
                              );
                            }

                            return (
                              <Box pt={2} borderTop="1px dashed" borderColor="gray.100">
                                <Text color="gray.600" fontWeight="medium" mb={1.5}>
                                  Verified Capabilities:
                                </Text>
                                <Flex wrap="wrap" gap={2} align="center">
                                  {displaySkills.map((s, idx) => (
                                    <Badge
                                      key={idx}
                                      colorScheme="teal"
                                      variant="subtle"
                                      px={2.5}
                                      py={1}
                                      borderRadius="md"
                                      display="inline-flex"
                                      alignItems="center"
                                      gap={1.5}
                                      fontSize="xs"
                                      fontWeight="700"
                                      m="0 !important"
                                    >
                                      <Icon as={FaWrench} color="teal.600" boxSize={2.5} />
                                      <Text as="span">{s.name}</Text>
                                      {s.experience && (
                                        <Text as="span" color="gray.500" fontSize="2xs" fontWeight="500">
                                          • {s.experience}
                                        </Text>
                                      )}
                                    </Badge>
                                  ))}
                                </Flex>
                              </Box>
                            );
                          })()}

                          {selectedTechnician.createdAt && (
                            <Flex justify="space-between" align="center" pt={2} borderTop="1px dashed" borderColor="gray.100">
                              <Text color="gray.600" fontWeight="medium">Registration Date:</Text>
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
                      <Box p={4} border="1px solid #e2e8f0" borderRadius="10px" bg="white" boxShadow="xs">
                        <Flex align="center" gap={1.5} mb={3}>
                          <FaMapMarkerAlt size="12px" color="#008080" />
                          <Text fontSize="xs" fontWeight="bold" color="gray.700" letterSpacing="wider">
                            OPERATIONAL COVERAGE & BASE
                          </Text>
                        </Flex>
                        <VStack align="stretch" spacing={2.5} fontSize="xs">
                          <Box>
                            <Text color="gray.600" fontWeight="medium" mb={2}>
                              Approved Operational Range:
                            </Text>
                            {approvedDistricts.length > 0 ? (
                              <VStack align="flex-start" spacing={2} w="100%">
                                {approvedDistricts.map((district) => {
                                  const rawName = district.name || "";
                                  const cleanBase = rawName.replace(/\s+Operational\s+Range$/i, "").trim();
                                  const displayLabel = cleanBase ? `${cleanBase} Operational Range` : rawName;
                                  return (
                                    <Badge
                                      key={district.id || district.name}
                                      colorScheme="teal"
                                      variant="subtle"
                                      px={3}
                                      py={1.5}
                                      borderRadius="md"
                                      display="inline-flex"
                                      alignItems="center"
                                      gap={1.5}
                                      fontSize="xs"
                                      fontWeight="700"
                                      maxW="100%"
                                      m="0 !important"
                                      alignSelf="flex-start"
                                      title={district.name}
                                    >
                                      <Text as="span" flexShrink={0}>📍</Text>
                                      <Text as="span" isTruncated maxW="280px">{displayLabel}</Text>
                                    </Badge>
                                  );
                                })}
                              </VStack>
                            ) : (
                              <Badge colorScheme="orange" px={2.5} py={1} borderRadius="md" m="0 !important">
                                Coverage Pending
                              </Badge>
                            )}
                            <Text fontSize="2xs" color="gray.500" mt={2}>
                              Coverage districts authorize dispatch assignment in the booking scheduler.
                            </Text>
                          </Box>

                          <Box pt={2} borderTop="1px dashed" borderColor="gray.100">
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
                  </VStack>
                </TabPanel>

                {/* ==================== TAB 2: INLINE GATE 2: KYC IDENTITY VERIFICATION ==================== */}
                <TabPanel px={0} pt={3}>
                  <Box p={{ base: 3.5, md: 4 }} border="1px solid #e2e8f0" borderRadius="12px" bg="white" boxShadow="xs">
                    {/* Header bar with Status & Unmask / Edit actions */}
                    <Flex justify="space-between" align="center" mb={3.5} pb={2.5} borderBottom="1px solid" borderColor="gray.100" flexWrap="wrap" gap={2}>
                      <Box>
                        <Flex align="center" gap={2}>
                          <Icon
                            as={isKycApproved ? FaCheckCircle : activeKycRec?.verificationStatus === "rejected" ? FaTimesCircle : MdOutlinePending}
                            color={isKycApproved ? "green.600" : activeKycRec?.verificationStatus === "rejected" ? "red.600" : "purple.600"}
                            boxSize="18px"
                          />
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            {isKycApproved ? "Already Verified (KYC Approved)" : activeKycRec?.verificationStatus === "rejected" ? "KYC Rejected" : "KYC Pending Verification"}
                          </Text>
                        </Flex>
                        {activeKycRec?.verifiedAt && (
                          <Text fontSize="2xs" color="gray.500" mt={0.5}>
                            Verified Date: {new Date(activeKycRec.verifiedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Box>

                      <HStack spacing={2}>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={isUnmaskedPII ? <FaLock /> : <FaUnlock />}
                          colorScheme={isUnmaskedPII ? "purple" : "gray"}
                          onClick={handleToggleUnmaskedPII}
                          isLoading={kycLoading}
                        >
                          {isUnmaskedPII ? "Mask PII" : "Unmask Full PII"}
                        </Button>

                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="teal"
                          leftIcon={<FaEdit />}
                          onClick={() => setIsEditingKyc(!isEditingKyc)}
                        >
                          {isEditingKyc ? "Cancel Edit" : "Edit Numbers"}
                        </Button>
                      </HStack>
                    </Flex>

                    {activeKycRec?.rejectionReason && (
                      <Box p={3} mb={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="8px">
                        <Text fontSize="xs" fontWeight="bold" color="red.700">
                          Rejection Reason:
                        </Text>
                        <Text fontSize="xs" color="red.600" mt={0.5}>
                          {activeKycRec.rejectionReason}
                        </Text>
                      </Box>
                    )}

                    {/* Missing Documents Alert */}
                    {!hasIdentityDocs && !isKycApproved && (
                      <Flex p={3} mb={3.5} bg="orange.50" border="1px solid" borderColor="orange.300" borderRadius="8px" align="center" gap={2}>
                        <Icon as={FaExclamationTriangle} color="orange.500" boxSize="18px" flexShrink={0} />
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="orange.800">
                            Missing Identity Documents
                          </Text>
                          <Text fontSize="xs" color="orange.700">
                            Technician has not uploaded required identity documents. Document uploads are required before verification approval.
                          </Text>
                        </Box>
                      </Flex>
                    )}

                    {/* Inline Edit Form for KYC Numbers */}
                    {isEditingKyc ? (
                      <Box p={3.5} mb={3.5} bg="teal.50" borderRadius="10px" border="1px solid" borderColor="teal.200">
                        <Text fontSize="xs" fontWeight="bold" color="teal.900" mb={2}>
                          Edit Government Document Numbers:
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Aadhaar Number</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={kycEditForm.aadhaarNumber}
                              onChange={(e) => setKycEditForm({ ...kycEditForm, aadhaarNumber: e.target.value })}
                              placeholder="12 digit Aadhaar"
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">PAN Number</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={kycEditForm.panNumber}
                              onChange={(e) => setKycEditForm({ ...kycEditForm, panNumber: e.target.value.toUpperCase() })}
                              placeholder="10 char PAN"
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Driving License</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={kycEditForm.drivingLicenseNumber}
                              onChange={(e) => setKycEditForm({ ...kycEditForm, drivingLicenseNumber: e.target.value })}
                              placeholder="DL Number"
                            />
                          </FormControl>
                        </SimpleGrid>
                        <HStack spacing={2} justify="flex-end" mt={3}>
                          <Button size="xs" variant="ghost" onClick={() => setIsEditingKyc(false)}>
                            Cancel
                          </Button>
                          <Button size="xs" colorScheme="teal" onClick={handleSaveKycNumbers} isLoading={savingKycEdit}>
                            Save Numbers
                          </Button>
                        </HStack>
                      </Box>
                    ) : (
                      /* Document Preview Cards Grid */
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={4}>
                        {/* Aadhaar */}
                        <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="10px">
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1.5}>
                            AADHAAR CARD
                          </Text>
                          {docs.aadhaarUrl ? (
                            <Box borderRadius="6px" overflow="hidden" border="1px solid #eee">
                              <Image
                                src={getImageUrl ? getImageUrl(docs.aadhaarUrl) : docs.aadhaarUrl}
                                alt="Aadhaar"
                                w="100%"
                                h="120px"
                                objectFit="cover"
                                cursor="pointer"
                                fallback={
                                  <Flex h="120px" bg="gray.100" align="center" justify="center" p={2} textAlign="center">
                                    <Text fontSize="2xs" color="gray.500">Image file not on server</Text>
                                  </Flex>
                                }
                                onClick={() => window.open(getImageUrl ? getImageUrl(docs.aadhaarUrl) : docs.aadhaarUrl, "_blank")}
                              />
                              <Button
                                size="xs"
                                w="100%"
                                variant="ghost"
                                colorScheme="purple"
                                as="a"
                                href={getImageUrl ? getImageUrl(docs.aadhaarUrl) : docs.aadhaarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Full Size
                              </Button>
                            </Box>
                          ) : (
                            <Flex h="120px" bg="gray.50" align="center" justify="center" border="1px dashed #cbd5e1" borderRadius="6px">
                              <Text fontSize="xs" color="gray.400">Not Uploaded</Text>
                            </Flex>
                          )}
                          <Text fontSize="2xs" color="gray.400" mt={2} textTransform="uppercase">
                            Aadhaar Number
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" fontFamily="monospace">
                            {activeKycRec?.aadhaarNumber ? (
                              isUnmaskedPII
                                ? activeKycRec.aadhaarNumber
                                : `•••• •••• ${String(activeKycRec.aadhaarNumber).slice(-4)}`
                            ) : "N/A"}
                          </Text>
                        </Box>

                        {/* PAN */}
                        <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="10px">
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1.5}>
                            PAN CARD
                          </Text>
                          {docs.panUrl ? (
                            <Box borderRadius="6px" overflow="hidden" border="1px solid #eee">
                              <Image
                                src={getImageUrl ? getImageUrl(docs.panUrl) : docs.panUrl}
                                alt="PAN"
                                w="100%"
                                h="120px"
                                objectFit="cover"
                                cursor="pointer"
                                fallback={
                                  <Flex h="120px" bg="gray.100" align="center" justify="center" p={2} textAlign="center">
                                    <Text fontSize="2xs" color="gray.500">Image file not on server</Text>
                                  </Flex>
                                }
                                onClick={() => window.open(getImageUrl ? getImageUrl(docs.panUrl) : docs.panUrl, "_blank")}
                              />
                              <Button
                                size="xs"
                                w="100%"
                                variant="ghost"
                                colorScheme="purple"
                                as="a"
                                href={getImageUrl ? getImageUrl(docs.panUrl) : docs.panUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Full Size
                              </Button>
                            </Box>
                          ) : (
                            <Flex h="120px" bg="gray.50" align="center" justify="center" border="1px dashed #cbd5e1" borderRadius="6px">
                              <Text fontSize="xs" color="gray.400">Not Uploaded</Text>
                            </Flex>
                          )}
                          <Text fontSize="2xs" color="gray.400" mt={2} textTransform="uppercase">
                            PAN Number
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" fontFamily="monospace">
                            {activeKycRec?.panNumber ? (
                              isUnmaskedPII
                                ? activeKycRec.panNumber
                                : `${String(activeKycRec.panNumber).slice(0, 5)}••••${String(activeKycRec.panNumber).slice(-1)}`
                            ) : "N/A"}
                          </Text>
                        </Box>

                        {/* DL */}
                        <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="10px">
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1.5}>
                            DRIVING LICENSE
                          </Text>
                          {docs.dlUrl ? (
                            <Box borderRadius="6px" overflow="hidden" border="1px solid #eee">
                              <Image
                                src={getImageUrl ? getImageUrl(docs.dlUrl) : docs.dlUrl}
                                alt="Driving License"
                                w="100%"
                                h="120px"
                                objectFit="cover"
                                cursor="pointer"
                                fallback={
                                  <Flex h="120px" bg="gray.100" align="center" justify="center" p={2} textAlign="center">
                                    <Text fontSize="2xs" color="gray.500">Image file not on server</Text>
                                  </Flex>
                                }
                                onClick={() => window.open(getImageUrl ? getImageUrl(docs.dlUrl) : docs.dlUrl, "_blank")}
                              />
                              <Button
                                size="xs"
                                w="100%"
                                variant="ghost"
                                colorScheme="purple"
                                as="a"
                                href={getImageUrl ? getImageUrl(docs.dlUrl) : docs.dlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Full Size
                              </Button>
                            </Box>
                          ) : (
                            <Flex h="120px" bg="gray.50" align="center" justify="center" border="1px dashed #cbd5e1" borderRadius="6px">
                              <Text fontSize="xs" color="gray.400">Not Uploaded</Text>
                            </Flex>
                          )}
                          <Text fontSize="2xs" color="gray.400" mt={2} textTransform="uppercase">
                            DL Number
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" fontFamily="monospace">
                            {activeKycRec?.drivingLicenseNumber || "N/A"}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    )}

                    {/* KYC Decision Toolbar */}
                    <Box pt={3} borderTop="1px solid" borderColor="gray.100">
                      {showKycRejection ? (
                        <Box p={3} bg="red.50" borderRadius="8px" border="1px solid" borderColor="red.200">
                          <Text fontSize="xs" fontWeight="bold" color="red.800" mb={1.5}>
                            Reason for KYC Rejection:
                          </Text>
                          <Textarea
                            size="sm"
                            bg="white"
                            placeholder="Specify why documents are rejected (e.g. Blurry photo, mismatched name...)"
                            value={kycRejectionReason}
                            onChange={(e) => setKycRejectionReason(e.target.value)}
                            mb={2}
                          />
                          <HStack justify="flex-end" spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setShowKycRejection(false);
                                setKycRejectionReason("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="red"
                              onClick={() => handleVerifyKycDecision("rejected")}
                              isLoading={kycLoading}
                            >
                              Confirm Rejection
                            </Button>
                          </HStack>
                        </Box>
                      ) : (
                        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => setShowKycRejection(true)}
                          >
                            Reject KYC
                          </Button>

                          <Tooltip
                            label={
                              !hasIdentityDocs && !isKycApproved
                                ? "Cannot approve: Missing required identity documents"
                                : ""
                            }
                            hasArrow
                            isDisabled={hasIdentityDocs || isKycApproved}
                          >
                            <Button
                              size="sm"
                              colorScheme={isKycApproved ? "teal" : "green"}
                              leftIcon={<FaCheckCircle />}
                              isDisabled={!hasIdentityDocs && !isKycApproved}
                              onClick={() => handleVerifyKycDecision("approved")}
                              isLoading={kycLoading}
                            >
                              {isKycApproved ? "Already Verified ✓" : "Approve (Verify Identity)"}
                            </Button>
                          </Tooltip>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </TabPanel>

                {/* ==================== TAB 3: INLINE GATE 3: BANK & PAYOUT VERIFICATION ==================== */}
                <TabPanel px={0} pt={3}>
                  {/* 1. LIVE WALLET BALANCES & GOVERNANCE */}
                  <Box p={{ base: 3.5, md: 4 }} mb={4} border="1px solid #e2e8f0" borderRadius="12px" bg="white" boxShadow="xs">
                    <Flex justify="space-between" align="center" mb={3} pb={2} borderBottom="1px solid" borderColor="gray.100" flexWrap="wrap" gap={2}>
                      <HStack spacing={2}>
                        <Icon as={FaWallet} color="purple.600" boxSize="18px" />
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            Technician Wallet & Balance Overview
                          </Text>
                          <Text fontSize="2xs" color="gray.500">
                            Real-time ledger balances, reserves, and payout governance
                          </Text>
                        </Box>
                      </HStack>

                      <HStack spacing={2}>
                        {isOwner && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme={walletOverview?.payoutStatus?.payoutBlocked ? "green" : "orange"}
                            leftIcon={walletOverview?.payoutStatus?.payoutBlocked ? <FaUnlock /> : <FaLock />}
                            onClick={handleToggleFreezeDrawer}
                            isLoading={freezeLoading}
                          >
                            {walletOverview?.payoutStatus?.payoutBlocked ? "Unfreeze Payouts" : "Freeze Payouts (Hold)"}
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="purple"
                          leftIcon={<FaMoneyBillWave />}
                          onClick={() => window.open("#/owner/technician-payouts", "_blank")}
                        >
                          Payouts Console
                        </Button>
                      </HStack>
                    </Flex>

                    {/* 4-Stat Metric Grid */}
                    <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={3}>
                      <Box p={3} bg="teal.50" borderRadius="10px" border="1px solid" borderColor="teal.100">
                        <Text fontSize="3xs" fontWeight="bold" color="teal.800" textTransform="uppercase">
                          Available Balance
                        </Text>
                        <Text fontSize="lg" fontWeight="black" color="teal.900" mt={0.5}>
                          {walletLoading ? (
                            <Spinner size="xs" />
                          ) : (
                            `₹${Number(
                              walletOverview?.balances?.availableBalance != null
                                ? walletOverview.balances.availableBalance
                                : (((Number(selectedTechnician?.availableBalancePaise) || ((Number(selectedTechnician?.walletBalance) || 0) * 100)) / 100) || 0)
                            ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          )}
                        </Text>
                        <Text fontSize="3xs" color="teal.700" mt={0.5}>Ready for Payout</Text>
                      </Box>

                      <Box p={3} bg="blue.50" borderRadius="10px" border="1px solid" borderColor="blue.100">
                        <Text fontSize="3xs" fontWeight="bold" color="blue.800" textTransform="uppercase">
                          In-Flight / Reserved
                        </Text>
                        <Text fontSize="lg" fontWeight="black" color="blue.900" mt={0.5}>
                          {walletLoading ? (
                            <Spinner size="xs" />
                          ) : (
                            `₹${((Number(walletOverview?.balances?.reservedBalancePaise || selectedTechnician?.reservedBalancePaise || 0)) / 100).toFixed(2)}`
                          )}
                        </Text>
                        <Text fontSize="3xs" color="blue.700" mt={0.5}>Pending Requests</Text>
                      </Box>

                      <Box p={3} bg="purple.50" borderRadius="10px" border="1px solid" borderColor="purple.100">
                        <Text fontSize="3xs" fontWeight="bold" color="purple.800" textTransform="uppercase">
                          Retention Reserve
                        </Text>
                        <Text fontSize="lg" fontWeight="black" color="purple.900" mt={0.5}>
                          {walletLoading ? (
                            <Spinner size="xs" />
                          ) : (
                            `₹${((Number(walletOverview?.balances?.reserveBalancePaise || selectedTechnician?.reserveBalancePaise || 0)) / 100).toFixed(2)}`
                          )}
                        </Text>
                        <Text fontSize="3xs" color="purple.700" mt={0.5}>Quality Guarantee</Text>
                      </Box>

                      <Box p={3} bg="orange.50" borderRadius="10px" border="1px solid" borderColor="orange.100">
                        <Text fontSize="3xs" fontWeight="bold" color="orange.800" textTransform="uppercase">
                          Outstanding Dues
                        </Text>
                        <Text fontSize="lg" fontWeight="black" color="orange.900" mt={0.5}>
                          {walletLoading ? (
                            <Spinner size="xs" />
                          ) : (
                            `₹${((Number(walletOverview?.balances?.outstandingDuesPaise || selectedTechnician?.outstandingDuesPaise || 0)) / 100).toFixed(2)}`
                          )}
                        </Text>
                        <Text fontSize="3xs" color="orange.700" mt={0.5}>Clawbacks / Penalties</Text>
                      </Box>
                    </SimpleGrid>

                    {/* Dues Origin Explanation if dues exist */}
                    {Number(walletOverview?.balances?.outstandingDuesPaise || selectedTechnician?.outstandingDuesPaise || 0) > 0 && (
                      <Box p={2.5} mb={3} bg="orange.50" borderRadius="8px" border="1px solid" borderColor="orange.200">
                        <Text fontSize="2xs" fontWeight="bold" color="orange.900">
                          Origin of Outstanding Dues:
                        </Text>
                        <Text fontSize="2xs" color="orange.800" mt={0.5}>
                          Dues accrue from technician cancellation fees (₹200) or post-completion customer dispute penalties (₹100) when available wallet balance was insufficient. Dues are automatically deducted as new booking payouts settle.
                        </Text>
                      </Box>
                    )}

                    {/* Payout Freeze Alert Banner if Frozen */}
                    {walletOverview?.payoutStatus?.payoutBlocked && (
                      <Box p={2.5} mb={3} bg="red.50" borderRadius="8px" border="1px solid" borderColor="red.200">
                        <Flex align="center" gap={2}>
                          <Icon as={FaLock} color="red.600" boxSize="14px" />
                          <Text fontSize="xs" fontWeight="bold" color="red.800">
                            Payouts are currently frozen for this technician.
                          </Text>
                        </Flex>
                        {walletOverview?.payoutStatus?.payoutBlockedReason && (
                          <Text fontSize="2xs" color="red.700" mt={0.5} pl={5}>
                            Reason: {walletOverview.payoutStatus.payoutBlockedReason}
                          </Text>
                        )}
                      </Box>
                    )}

                    {/* Lifetime Financial Summary */}
                    <Flex justify="space-between" align="center" bg="gray.50" px={3} py={2} borderRadius="8px" fontSize="2xs" color="gray.600">
                      <Text>
                        Lifetime Earned: <strong style={{ color: "#008080" }}>₹{((Number(walletOverview?.balances?.lifetimeEarnedPaise || selectedTechnician?.lifetimeEarnedPaise || 0)) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </Text>
                      <Text>
                        Lifetime Withdrawn: <strong>₹{((Number(walletOverview?.balances?.lifetimeWithdrawnPaise || selectedTechnician?.lifetimeWithdrawnPaise || 0)) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </Text>
                    </Flex>

                    {/* Mini Transaction History */}
                    {walletOverview?.recentTransactions && walletOverview.recentTransactions.length > 0 && (
                      <Box mt={3} pt={2} borderTop="1px dashed" borderColor="gray.200">
                        <Text fontSize="2xs" fontWeight="bold" color="gray.600" mb={1.5} textTransform="uppercase">
                          Recent Wallet Transactions:
                        </Text>
                        <VStack spacing={1} align="stretch">
                          {walletOverview.recentTransactions.slice(0, 5).map((txn) => {
                            const isCredit = txn.type === "credit";
                            return (
                              <Flex key={txn._id} justify="space-between" align="center" py={1} px={2} bg="gray.50" borderRadius="6px" fontSize="2xs">
                                <HStack spacing={1.5}>
                                  <Badge colorScheme={isCredit ? "green" : "red"} fontSize="3xs" px={1}>
                                    {txn.type.toUpperCase()}
                                  </Badge>
                                  <Text color="gray.700" fontWeight="medium">
                                    {txn.source ? txn.source.toUpperCase() : "TRANSACTION"}
                                  </Text>
                                </HStack>
                                <HStack spacing={2}>
                                  <Text fontWeight="bold" color={isCredit ? "green.600" : "red.600"}>
                                    {isCredit ? "+" : "-"}₹{(Number(txn.amountPaise || txn.amount * 100 || 0) / 100).toFixed(2)}
                                  </Text>
                                  <Text color="gray.400" fontSize="3xs">
                                    {new Date(txn.createdAt).toLocaleDateString()}
                                  </Text>
                                </HStack>
                              </Flex>
                            );
                          })}
                        </VStack>
                      </Box>
                    )}
                  </Box>

                  {/* 2. VERIFIED BANK DETAILS & INLINE EDIT */}
                  <Box p={{ base: 3.5, md: 4 }} border="1px solid #e2e8f0" borderRadius="12px" bg="white" boxShadow="xs">
                    {/* Header bar with Status & Edit action */}
                    <Flex justify="space-between" align="center" mb={3.5} pb={2.5} borderBottom="1px solid" borderColor="gray.100" flexWrap="wrap" gap={2}>
                      <Box>
                        <Flex align="center" gap={2}>
                          <Icon
                            as={isBankApproved ? FaCheckCircle : FaUniversity}
                            color={isBankApproved ? "green.600" : "orange.500"}
                            boxSize="18px"
                          />
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            {isBankApproved ? "Bank Account Verified" : "Pending Verification"}
                          </Text>
                        </Flex>
                        <Text fontSize="2xs" color="gray.500" mt={0.5}>
                          {isBankApproved ? "Bank credentials verified for settlement" : "Bank credentials require administrative verification"}
                        </Text>
                      </Box>

                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        leftIcon={<FaEdit />}
                        onClick={() => setIsEditingBank(!isEditingBank)}
                      >
                        {isEditingBank ? "Cancel Edit" : "Edit Bank Details"}
                      </Button>
                    </Flex>

                    {/* Inline Edit Form for Bank Details */}
                    {isEditingBank ? (
                      <Box p={3.5} mb={3.5} bg="orange.50" borderRadius="10px" border="1px solid" borderColor="orange.200">
                        <Text fontSize="xs" fontWeight="bold" color="orange.900" mb={2}>
                          Edit Technician Bank & Payout Details:
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Account Holder Name</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.accountHolderName}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, accountHolderName: e.target.value })}
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Bank Name</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.bankName}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, bankName: e.target.value })}
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Account Number</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.accountNumber}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, accountNumber: e.target.value })}
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">IFSC Code</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.ifscCode}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, ifscCode: e.target.value.toUpperCase() })}
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">Branch Name</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.branchName}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, branchName: e.target.value })}
                            />
                          </FormControl>
                          <FormControl size="sm">
                            <FormLabel fontSize="2xs" color="gray.600">UPI ID (VPA)</FormLabel>
                            <Input
                              size="sm"
                              bg="white"
                              value={bankEditForm.upiId}
                              onChange={(e) => setBankEditForm({ ...bankEditForm, upiId: e.target.value })}
                            />
                          </FormControl>
                        </SimpleGrid>
                        <HStack spacing={2} justify="flex-end" mt={3}>
                          <Button size="xs" variant="ghost" onClick={() => setIsEditingBank(false)}>
                            Cancel
                          </Button>
                          <Button size="xs" colorScheme="orange" onClick={handleSaveBankNumbers} isLoading={savingBankEdit}>
                            Save Bank Details
                          </Button>
                        </HStack>
                      </Box>
                    ) : (
                      /* Display Bank Details Grid */
                      (bankDetails && (bankDetails.accountHolderName || bankDetails.accountNumber || bankDetails.bankName || bankDetails.upiId)) ? (
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mb={4} fontSize="xs">
                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontWeight="medium">Account Holder</Text>
                            <Text fontWeight="bold" color="gray.800" mt={0.5}>{bankDetails.accountHolderName || "N/A"}</Text>
                          </Box>

                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontWeight="medium">Bank Name</Text>
                            <Text fontWeight="bold" color="gray.800" mt={0.5}>{bankDetails.bankName || "N/A"}</Text>
                          </Box>

                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontWeight="medium">Account Number</Text>
                            <Text fontWeight="bold" fontFamily="monospace" color="gray.800" mt={0.5}>
                              {bankDetails.accountNumber ? (
                                isUnmaskedPII
                                  ? bankDetails.accountNumber
                                  : `••••••••${String(bankDetails.accountNumber).slice(-4)}`
                              ) : "N/A"}
                            </Text>
                          </Box>

                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontWeight="medium">IFSC Code</Text>
                            <Text fontWeight="bold" fontFamily="monospace" color="gray.800" mt={0.5}>
                              {bankDetails.ifscCode || "N/A"}
                            </Text>
                          </Box>

                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontWeight="medium">Branch</Text>
                            <Text fontWeight="bold" color="gray.800" mt={0.5}>
                              {bankDetails.branchName || "N/A"}
                            </Text>
                          </Box>

                          <Box p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                            <Flex justify="space-between" align="center">
                              <Text color="gray.500" fontWeight="medium">UPI ID (VPA)</Text>
                              {bankDetails.upiId && (
                                <Tooltip label={copiedUpi ? "Copied!" : "Copy UPI"} hasArrow>
                                  <IconButton
                                    size="2xs"
                                    icon={copiedUpi ? <FaCheck size="9px" color="#16a34a" /> : <FaCopy size="9px" />}
                                    variant="ghost"
                                    colorScheme={copiedUpi ? "green" : "gray"}
                                    onClick={() => handleCopy(bankDetails.upiId, "upi")}
                                    aria-label="Copy UPI"
                                  />
                                </Tooltip>
                              )}
                            </Flex>
                            <Text fontWeight="bold" color="gray.800" wordBreak="break-all" mt={0.5}>
                              {bankDetails.upiId || "N/A"}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      ) : (
                        <Box p={4} textAlign="center" bg="gray.50" borderRadius="8px" mb={4}>
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            No bank details configured for this technician.
                          </Text>
                        </Box>
                      )
                    )}

                    {/* Bank Decision Toolbar */}
                    <Box pt={3} borderTop="1px solid" borderColor="gray.100">
                      {showBankRejection ? (
                        <Box p={3} bg="red.50" borderRadius="8px" border="1px solid" borderColor="red.200">
                          <Text fontSize="xs" fontWeight="bold" color="red.800" mb={1.5}>
                            Reason for Bank Rejection:
                          </Text>
                          <Textarea
                            size="sm"
                            bg="white"
                            placeholder="Specify why bank details are rejected (e.g. Invalid account number, name mismatch...)"
                            value={bankRejectionReason}
                            onChange={(e) => setBankRejectionReason(e.target.value)}
                            mb={2}
                          />
                          <HStack justify="flex-end" spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setShowBankRejection(false);
                                setBankRejectionReason("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="red"
                              onClick={() => handleVerifyBankDecision(false)}
                              isLoading={actionLoading}
                            >
                              Confirm Rejection
                            </Button>
                          </HStack>
                        </Box>
                      ) : (
                        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => setShowBankRejection(true)}
                          >
                            Reject Bank
                          </Button>

                          <Button
                            size="sm"
                            colorScheme={isBankApproved ? "teal" : "green"}
                            leftIcon={<FaCheckCircle />}
                            onClick={() => handleVerifyBankDecision(true)}
                            isLoading={actionLoading}
                          >
                            {isBankApproved ? "Already Verified ✓" : "Verify Bank Account"}
                          </Button>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </DrawerBody>

        {/* STICKY FOOTER */}
        <DrawerFooter borderTopWidth="1px" borderColor="gray.200" bg="gray.50" py={3} px={{ base: 4, md: 6 }}>
          <Flex w="100%" justify="space-between" align="center">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              Work Status:{" "}
              <Badge
                colorScheme={workStatus === "approved" ? "green" : workStatus === "suspended" ? "red" : "orange"}
                textTransform="capitalize"
                px={2}
                py={0.5}
                borderRadius="md"
              >
                {workStatus}
              </Badge>
            </Text>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <WorkStatusPrerequisitesModal
      isOpen={isPrereqModalOpen}
      onClose={() => setIsPrereqModalOpen(false)}
      technician={selectedTechnician}
      technicianName={techName}
      technicianPhone={techPhone}
      technicianImage={techImage}
      technicianSpecialization={techSpecialization}
      evaluation={prereqEvaluation}
      onCompleteTraining={handleToggleTrainingAction}
      onOpenDrawerTab={(tabKey) => {
        setIsPrereqModalOpen(false);
        setActiveTab(tabKey === "kyc" ? 1 : tabKey === "bank" ? 2 : 0);
      }}
      onApproveWorkStatus={() => handleSetWorkStatusAction("approved")}
    />
  </>
  );
}
