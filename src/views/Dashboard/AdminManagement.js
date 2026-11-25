// AdminManagement.js - RightTouch Admin Technician Management & Verifications
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Heading,
  Badge,
  Text,
  IconButton,
  Spinner,
  Avatar,
  Skeleton,
  SkeletonCircle,
  HStack,
  VStack,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  SimpleGrid,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import {
  AdminStatsCards,
  TechnicianDetailsDrawer,
  DeleteTechnicianDialog,
  WorkStatusPrerequisitesModal,
  evaluateWorkStatusEligibility,
} from "components/AdminManagement";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaSearch,
  FaEye,
  FaUserSlash,
  FaUserGraduate,
  FaTrash,
  FaIdCard,
  FaUniversity,
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaWallet,
  FaLock,
  FaUnlock,
  FaMoneyBillWave,
} from "react-icons/fa";
import { freezeTechnicianPayout } from "api/wallet";
import DataTable from "components/common/DataTable";
import RefreshButton from "components/common/RefreshButton";
import StatusBadge from "components/common/StatusBadge";
import ConfirmActionModal from "components/common/ConfirmActionModal";
import { PageSkeleton, TableSkeleton } from "components/common";
import ErrorState from "components/feedback/ErrorState";
import { useAppToast } from "components/feedback";
import { API_ORIGIN, resolveApiOrigin } from "config/apiConfig";
import { MdOutlinePending } from "react-icons/md";
import {
  getKYCFullPII,
  clearAuth,
  getAllDistricts,
} from "views/utils/axiosInstance";
import {
  listOrphanedKyc,
  deleteOrphanedKyc,
  cleanupAllOrphanedKyc,
} from "api/adminKyc";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  isOwnerRole,
  isPrivilegedRole,
  selectAuthInitialized,
  selectRole,
  selectUser,
} from "store/slices/authSlice";
import {
  fetchTechnicians,
  fetchKYCRecords,
  fetchKYCDetail,
  setTrainingStatus,
  setWorkStatus,
  verifyTechnicianKYC,
  editTechnicianKYC,
  verifyTechnicianBank,
  editTechnicianBank,
  removeTechnician,
  removeKYC,
} from "store/slices/techniciansSlice";
import { useNavigate, useLocation } from "react-router-dom";

// High-performance index cache for O(1) KYC record lookups
const kycIndexCache = new WeakMap();

const getKycIndex = (kycRecords) => {
  if (!Array.isArray(kycRecords) || kycRecords.length === 0) return null;
  let index = kycIndexCache.get(kycRecords);
  if (index) return index;

  const byId = new Map();
  const byEmail = new Map();
  const byPhone = new Map();

  for (let i = 0; i < kycRecords.length; i++) {
    const k = kycRecords[i];
    if (!k) continue;

    const kTechId = String(
      k.technicianId?._id ||
      k.technicianId ||
      k.technician?._id ||
      k.technician ||
      ""
    );
    if (kTechId) byId.set(kTechId, k);

    const kUserId = String(
      k.userId?._id ||
      k.userId ||
      k.user?._id ||
      k.user ||
      ""
    );
    if (kUserId) byId.set(kUserId, k);

    const kRecId = String(k._id || k.id || "");
    if (kRecId) byId.set(kRecId, k);

    const kEmail = (k.email || k.userId?.email || k.technicianId?.email || "").toLowerCase().trim();
    if (kEmail) byEmail.set(kEmail, k);

    const kPhone = (k.phone || k.mobileNumber || k.mobile || k.personalDetails?.phone || k.technicianId?.mobileNumber || k.userId?.mobileNumber || "").toString().replace(/\D/g, "");
    if (kPhone && kPhone.length >= 8) {
      byPhone.set(kPhone.slice(-10), k);
    }
  }

  index = { byId, byEmail, byPhone };
  kycIndexCache.set(kycRecords, index);
  return index;
};

// Find matching KYC record for a technician safely with O(1) indexed lookup
const findKYCRecord = (admin, kycRecords = []) => {
  if (!admin) return null;
  const index = getKycIndex(kycRecords);
  if (!index) return null;

  const adminId = String(admin._id || admin.id || "");
  if (adminId && index.byId.has(adminId)) return index.byId.get(adminId);

  const adminUserId = String(
    admin.userId?._id ||
    (typeof admin.userId === "string" ? admin.userId : "") ||
    admin.user?._id ||
    (typeof admin.user === "string" ? admin.user : "") ||
    ""
  );
  if (adminUserId && index.byId.has(adminUserId)) return index.byId.get(adminUserId);

  const adminEmail = (admin.email || admin.userId?.email || "").toLowerCase().trim();
  if (adminEmail && index.byEmail.has(adminEmail)) return index.byEmail.get(adminEmail);

  const adminPhone = (admin.mobileNumber || admin.phone || admin.userId?.mobileNumber || admin.userId?.phone || "").toString().replace(/\D/g, "");
  if (adminPhone && adminPhone.length >= 8) {
    const p10 = adminPhone.slice(-10);
    if (index.byPhone.has(p10)) return index.byPhone.get(p10);
  }

  return null;
};

// Helper to resolve technician name safely
const getTechnicianName = (tech, kycRecords = []) => {
  if (!tech) return "Unknown";
  const isDeleted = (str) =>
    str && typeof str === "string" && (str.startsWith("deleted_") || str.includes("example.invalid"));

  // 1. Direct name properties
  if (tech.name && typeof tech.name === "string" && tech.name.trim() !== "") {
    if (isDeleted(tech.name)) return "Deleted Technician";
    return tech.name.trim();
  }
  if (tech.fullName && typeof tech.fullName === "string" && tech.fullName.trim() !== "") {
    if (isDeleted(tech.fullName)) return "Deleted Technician";
    return tech.fullName.trim();
  }
  if (tech.technicianName && typeof tech.technicianName === "string" && tech.technicianName.trim() !== "") {
    if (isDeleted(tech.technicianName)) return "Deleted Technician";
    return tech.technicianName.trim();
  }
  if (tech.firstName) {
    const fullName = `${tech.firstName} ${tech.lastName || ""}`.trim();
    if (isDeleted(fullName)) return "Deleted Technician";
    if (fullName) return fullName;
  }
  if (tech.fname) {
    const fullName = `${tech.fname} ${tech.lname || ""}`.trim();
    if (isDeleted(fullName)) return "Deleted Technician";
    if (fullName) return fullName;
  }

  // 2. Profile nested object
  if (tech.profile && typeof tech.profile === "object") {
    if (tech.profile.name && typeof tech.profile.name === "string" && tech.profile.name.trim() !== "") {
      if (isDeleted(tech.profile.name)) return "Deleted Technician";
      return tech.profile.name.trim();
    }
    if (tech.profile.fullName && typeof tech.profile.fullName === "string" && tech.profile.fullName.trim() !== "") {
      if (isDeleted(tech.profile.fullName)) return "Deleted Technician";
      return tech.profile.fullName.trim();
    }
    if (tech.profile.firstName) {
      const fullName = `${tech.profile.firstName} ${tech.profile.lastName || ""}`.trim();
      if (isDeleted(fullName)) return "Deleted Technician";
      if (fullName) return fullName;
    }
    if (tech.profile.fname) {
      const fullName = `${tech.profile.fname} ${tech.profile.lname || ""}`.trim();
      if (isDeleted(fullName)) return "Deleted Technician";
      if (fullName) return fullName;
    }
  }

  // 3. userId or user populated object
  const userObj =
    (tech.userId && typeof tech.userId === "object" ? tech.userId : null) ||
    (tech.user && typeof tech.user === "object" ? tech.user : null);
  if (userObj) {
    if (userObj.name && typeof userObj.name === "string" && userObj.name.trim() !== "") {
      if (isDeleted(userObj.name)) return "Deleted Technician";
      return userObj.name.trim();
    }
    if (userObj.fullName && typeof userObj.fullName === "string" && userObj.fullName.trim() !== "") {
      if (isDeleted(userObj.fullName)) return "Deleted Technician";
      return userObj.fullName.trim();
    }
    if (userObj.firstName) {
      const fullName = `${userObj.firstName} ${userObj.lastName || ""}`.trim();
      if (isDeleted(fullName)) return "Deleted Technician";
      if (fullName) return fullName;
    }
    if (userObj.fname) {
      const fullName = `${userObj.fname} ${userObj.lname || ""}`.trim();
      if (isDeleted(fullName)) return "Deleted Technician";
      if (fullName) return fullName;
    }
    if (userObj.username && typeof userObj.username === "string" && userObj.username.trim() !== "") {
      if (isDeleted(userObj.username)) return "Deleted Technician";
      return userObj.username.trim();
    }
  }

  // 4. Personal details object
  if (tech.personalDetails?.name) return tech.personalDetails.name.trim();
  if (tech.personalDetails?.fullName) return tech.personalDetails.fullName.trim();

  // 5. Direct bank account holder name
  if (tech.accountHolderName && typeof tech.accountHolderName === "string" && tech.accountHolderName.trim() !== "") {
    return tech.accountHolderName.trim();
  }
  if (tech.bankDetails?.accountHolderName && typeof tech.bankDetails.accountHolderName === "string" && tech.bankDetails.accountHolderName.trim() !== "") {
    return tech.bankDetails.accountHolderName.trim();
  }

  // 6. Match against KYC records (e.g. verified Bank Account Holder Name)
  if (Array.isArray(kycRecords) && kycRecords.length > 0) {
    const kycMatch = findKYCRecord(tech, kycRecords);
    if (kycMatch) {
      if (kycMatch.bankDetails?.accountHolderName && typeof kycMatch.bankDetails.accountHolderName === "string" && kycMatch.bankDetails.accountHolderName.trim() !== "") {
        return kycMatch.bankDetails.accountHolderName.trim();
      }
      if (kycMatch.fullName && typeof kycMatch.fullName === "string" && kycMatch.fullName.trim() !== "") {
        return kycMatch.fullName.trim();
      }
      if (kycMatch.name && typeof kycMatch.name === "string" && kycMatch.name.trim() !== "") {
        return kycMatch.name.trim();
      }
      if (kycMatch.personalDetails?.name) return kycMatch.personalDetails.name.trim();
      if (kycMatch.personalDetails?.fullName) return kycMatch.personalDetails.fullName.trim();
      if (kycMatch.aadhaarDetails?.name) return kycMatch.aadhaarDetails.name.trim();
      if (kycMatch.panDetails?.name) return kycMatch.panDetails.name.trim();
      if (kycMatch.technicianId && typeof kycMatch.technicianId === "object") {
        const t = kycMatch.technicianId;
        if (t.name) return t.name;
        if (t.fullName) return t.fullName;
        if (t.fname) return `${t.fname} ${t.lname || ""}`.trim();
      }
      if (kycMatch.userId && typeof kycMatch.userId === "object") {
        const u = kycMatch.userId;
        if (u.name) return u.name;
        if (u.fullName) return u.fullName;
        if (u.fname) return `${u.fname} ${u.lname || ""}`.trim();
      }
    }
  }

  // 7. Email prefix fallback
  const email = tech.email || userObj?.email || tech.profile?.email;
  if (email && typeof email === "string" && email.includes("@")) {
    const prefix = email.split("@")[0];
    if (isDeleted(prefix)) return "Deleted Technician";
    return prefix;
  }

  return "Unknown";
};

// Helper to resolve technician phone number safely
const getTechnicianPhone = (tech, kycRecords = []) => {
  if (!tech) return "";
  const candidates = [
    tech.mobileNumber,
    tech.phone,
    tech.mobile,
    tech.phoneNumber,
    tech.contactNumber,
    tech.contact,
    tech.userId?.mobileNumber,
    tech.userId?.phone,
    tech.userId?.mobile,
    tech.userId?.phoneNumber,
    tech.userId?.identifier,
    tech.user?.mobileNumber,
    tech.user?.phone,
    tech.user?.mobile,
    tech.user?.phoneNumber,
    tech.profile?.mobileNumber,
    tech.profile?.phone,
    tech.profile?.mobile,
    tech.profile?.phoneNumber,
    tech.personalDetails?.phone,
    tech.personalDetails?.mobileNumber,
    tech.personalDetails?.contactNumber,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim() !== "" && c.trim().toLowerCase() !== "n/a") {
      return c.trim();
    }
    if (typeof c === "number") {
      return String(c);
    }
  }

  // Check KYC records
  if (Array.isArray(kycRecords) && kycRecords.length > 0) {
    const kycMatch = findKYCRecord(tech, kycRecords);
    if (kycMatch) {
      const kycCandidates = [
        kycMatch.mobileNumber,
        kycMatch.phone,
        kycMatch.mobile,
        kycMatch.phoneNumber,
        kycMatch.contactNumber,
        kycMatch.personalDetails?.phone,
        kycMatch.personalDetails?.mobileNumber,
        kycMatch.bankDetails?.registeredMobileNumber,
        kycMatch.bankDetails?.phone,
        kycMatch.technicianId?.mobileNumber,
        kycMatch.technicianId?.phone,
        kycMatch.userId?.mobileNumber,
        kycMatch.userId?.phone,
        kycMatch.userId?.identifier,
      ];
      for (const kc of kycCandidates) {
        if (kc && typeof kc === "string" && kc.trim() !== "" && kc.trim().toLowerCase() !== "n/a") {
          return kc.trim();
        }
        if (typeof kc === "number") {
          return String(kc);
        }
      }
    }
  }

  return "";
};

// Helper to resolve technician email safely
const getTechnicianEmail = (tech, kycRecords = []) => {
  if (!tech) return "";
  const candidates = [
    tech.email,
    tech.mail,
    tech.userEmail,
    tech.userId?.email,
    tech.userId?.mail,
    tech.user?.email,
    tech.profile?.email,
    tech.personalDetails?.email,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.includes("@") && !c.includes("example.invalid")) {
      return c.trim();
    }
  }

  if (Array.isArray(kycRecords) && kycRecords.length > 0) {
    const kycMatch = findKYCRecord(tech, kycRecords);
    if (kycMatch) {
      const kycEmailCandidates = [
        kycMatch.email,
        kycMatch.personalDetails?.email,
        kycMatch.userId?.email,
        kycMatch.technicianId?.email,
      ];
      for (const kc of kycEmailCandidates) {
        if (kc && typeof kc === "string" && kc.includes("@") && !kc.includes("example.invalid")) {
          return kc.trim();
        }
      }
    }
  }

  return "";
};

// Helper to resolve technician address safely
const getTechnicianAddress = (tech, kycRecords = []) => {
  if (!tech) return "Address not provided";

  // 1. Structured location/address parts from technician profile
  const parts = [];
  if (tech.address && typeof tech.address === "string" && tech.address.trim()) parts.push(tech.address.trim());
  if (tech.locality && typeof tech.locality === "string" && tech.locality.trim() && !parts.includes(tech.locality.trim())) parts.push(tech.locality.trim());
  if (tech.city && typeof tech.city === "string" && tech.city.trim() && !parts.includes(tech.city.trim())) parts.push(tech.city.trim());
  if (tech.state && typeof tech.state === "string" && tech.state.trim() && !parts.includes(tech.state.trim())) parts.push(tech.state.trim());
  if (tech.pincode && typeof tech.pincode === "string" && tech.pincode.trim() && !parts.includes(tech.pincode.trim())) parts.push(tech.pincode.trim());
  if (parts.length > 0) return parts.join(", ");

  // 2. Object or raw address
  const rawAddr =
    tech.address ||
    tech.locality ||
    tech.profile?.address ||
    tech.currentLocation?.address ||
    tech.userId?.address ||
    tech.user?.address ||
    "";

  if (typeof rawAddr === "string" && rawAddr.trim()) return rawAddr.trim();
  if (typeof rawAddr === "object" && rawAddr !== null) {
    const p = [
      rawAddr.line1 || rawAddr.street || rawAddr.addressLine1 || rawAddr.house,
      rawAddr.line2 || rawAddr.addressLine2 || rawAddr.area,
      rawAddr.city || rawAddr.district,
      rawAddr.pincode || rawAddr.zip || rawAddr.postalCode,
    ].filter(Boolean);
    if (p.length > 0) return p.join(", ");
  }

  // 3. Check KYC
  if (Array.isArray(kycRecords) && kycRecords.length > 0) {
    const kycMatch = findKYCRecord(tech, kycRecords);
    if (kycMatch?.address) {
      if (typeof kycMatch.address === "string" && kycMatch.address.trim()) return kycMatch.address.trim();
      if (typeof kycMatch.address === "object") {
        const kparts = [
          kycMatch.address.line1 || kycMatch.address.street,
          kycMatch.address.city,
          kycMatch.address.pincode,
        ].filter(Boolean);
        if (kparts.length > 0) return kparts.join(", ");
      }
    }
    if (kycMatch?.aadhaarAddress && typeof kycMatch.aadhaarAddress === "string" && kycMatch.aadhaarAddress.trim()) {
      return kycMatch.aadhaarAddress.trim();
    }
  }

  return "Address not provided";
};

// Helper to resolve technician specialization formatted cleanly
const getTechnicianSpecialization = (tech) => {
  if (!tech) return "General";
  const spec = tech.specialization || tech.profile?.specialization || "General";
  if (typeof spec !== "string") return "General";
  const trimmed = spec.trim();
  if (trimmed.toLowerCase() === "ac") return "AC Service";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const getDistrictRefId = (ref) =>
  String(
    typeof ref === "object"
      ? ref?._id || ref?.id || ""
      : ref || ""
  );

const getTechnicianApprovedDistricts = (tech, masterDistricts = []) => {
  if (!tech) return [];
  const refs = [
    ...(Array.isArray(tech.enabledDistrictIds) ? tech.enabledDistrictIds : []),
    ...(Array.isArray(tech.allowedCityIds) ? tech.allowedCityIds : []),
    ...(Array.isArray(tech.districts) ? tech.districts : []),
    ...(Array.isArray(tech.serviceDistricts) ? tech.serviceDistricts : []),
    ...(tech.primaryDistrictId ? [tech.primaryDistrictId] : []),
    ...(tech.primaryCityId ? [tech.primaryCityId] : []),
    ...(tech.districtId ? [tech.districtId] : []),
    ...(tech.district ? [tech.district] : []),
    ...(tech.operationalCityId ? [tech.operationalCityId] : []),
    ...(tech.profile?.district ? [tech.profile.district] : []),
    ...(tech.address?.district ? [tech.address.district] : []),
  ];
  const map = new Map();

  refs.forEach((ref) => {
    if (!ref) return;
    const id = getDistrictRefId(ref);
    if (!id || map.has(id)) return;

    const masterMatch = (masterDistricts || []).find(
      (district) =>
        String(district?._id || district?.id || "") === id ||
        String(district?.name || district?.districtName || district?.city || "").toLowerCase() === id.toLowerCase() ||
        (typeof ref === "object" &&
          String(district?.name || district?.districtName || district?.city || "").toLowerCase() ===
            String(ref?.name || ref?.districtName || ref?.city || "").toLowerCase())
    );

    const name =
      (typeof ref === "object" && (ref.name || ref.districtName || ref.city)) ||
      masterMatch?.name ||
      masterMatch?.districtName ||
      masterMatch?.city ||
      id;

    map.set(id, {
      id,
      name: String(name).trim(),
      city: typeof ref === "object" ? ref.city || masterMatch?.city || "" : masterMatch?.city || "",
    });
  });

  return Array.from(map.values());
};

const getTechnicianApprovedDistrictNames = (tech, masterDistricts = []) =>
  getTechnicianApprovedDistricts(tech, masterDistricts).map((district) => district.name);

const hasApprovedDistrictCoverage = (tech, masterDistricts = []) =>
  getTechnicianApprovedDistricts(tech, masterDistricts).length > 0;

// Helper to resolve technician registration district safely. This is location
// metadata only and never grants dispatch coverage.
const getTechnicianDistrict = (tech, masterDistricts = []) => {
  if (!tech) return "";
  const d =
    tech.district ||
    tech.profile?.district ||
    tech.address?.district ||
    tech.districtName ||
    tech.district_name ||
    tech.districtId ||
    tech.primaryCityId ||
    tech.operationalCityId ||
    tech.city ||
    tech.profile?.city ||
    tech.locality ||
    "";
  if (typeof d === "string") {
    const trimmed = d.trim();
    if (Array.isArray(masterDistricts) && masterDistricts.length > 0) {
      const match = masterDistricts.find(
        (m) =>
          String(m._id || m.id) === trimmed ||
          String(m.name || m.districtName || m.city || "").toLowerCase() === trimmed.toLowerCase()
      );
      if (match) return (match.name || match.districtName || match.city || trimmed).trim();
    }
    return trimmed;
  }
  if (d && typeof d === "object") return (d.name || d.districtName || d.city || "").trim();
  return "";
};

const getImageUrl = (urlData) => {
  if (!urlData) return "";
  const url = Array.isArray(urlData) ? urlData[0] : urlData;
  if (typeof url !== "string") return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${resolveApiOrigin()}/${url.replace(/^\/+/, "")}`;
};

const getTechnicianImage = (tech, kycRecords = []) => {
  if (!tech) return "";
  const direct =
    tech?.profileImage ||
    tech?.profile?.profileImage ||
    tech?.avatar ||
    tech?.photo ||
    (typeof tech?.userId === "object" ? (tech?.userId?.profileImage || tech?.userId?.photo) : "") ||
    "";
  if (direct) return getImageUrl(direct);
  if (Array.isArray(kycRecords) && kycRecords.length > 0) {
    const kycMatch = findKYCRecord(tech, kycRecords);
    if (kycMatch?.profileImage) return getImageUrl(kycMatch.profileImage);
    if (kycMatch?.documents?.profileUrl) return getImageUrl(kycMatch.documents.profileUrl);
    if (kycMatch?.photo) return getImageUrl(kycMatch.photo);
  }
  return "";
};

const isTechnicianKYCVerified = (admin, kycRecords = []) => {
  if (!admin) return false;
  const kycMatch = findKYCRecord(admin, kycRecords);
  const status = (
    kycMatch?.status ||
    kycMatch?.verificationStatus ||
    admin?.kycStatus ||
    admin?.kycDetails?.status ||
    admin?.kyc?.status ||
    admin?.kyc?.verificationStatus ||
    ""
  ).toLowerCase();

  return (
    status === "approved" ||
    status === "verified" ||
    admin?.kycVerified === true ||
    admin?.isKycVerified === true ||
    admin?.kyc?.isVerified === true ||
    admin?.kycDetails?.verified === true
  );
};

const isTechnicianBankVerified = (admin, kycRecords = []) => {
  if (!admin) return false;
  const kycMatch = findKYCRecord(admin, kycRecords);
  const bankStatus = (
    kycMatch?.bankDetails?.verificationStatus ||
    kycMatch?.bankDetails?.status ||
    admin?.bankDetails?.verificationStatus ||
    admin?.bankDetails?.status ||
    admin?.bankVerificationStatus ||
    admin?.kyc?.bankDetails?.status ||
    ""
  ).toLowerCase();

  return Boolean(
    kycMatch?.bankDetails?.verified === true ||
    kycMatch?.bankVerified === true ||
    bankStatus === "approved" ||
    bankStatus === "verified" ||
    admin?.bankVerified === true ||
    admin?.isBankVerified === true ||
    admin?.bankDetails?.verified === true ||
    admin?.kyc?.bankDetails?.verified === true
  );
};

const isNewTechnician = (admin, kycRecords = []) => {
  if (!admin) return false;
  const isKycVer = isTechnicianKYCVerified(admin, kycRecords);
  const workStatus = admin.workStatus?.toLowerCase() || admin.status?.toLowerCase();
  // New if workStatus is pending/new or training is not completed or not yet approved
  return (
    workStatus === "pending" ||
    workStatus === "new" ||
    (!admin.trainingCompleted && !isKycVer) ||
    (!isKycVer && workStatus !== "approved" && workStatus !== "active" && workStatus !== "inactive" && workStatus !== "suspended")
  );
};

const isActiveTechnician = (admin, kycRecords = []) => {
  if (!admin) return false;
  const workStatus = admin.workStatus?.toLowerCase() || admin.status?.toLowerCase();
  const isKycVer = isTechnicianKYCVerified(admin, kycRecords);
  if (workStatus === "inactive" || workStatus === "suspended") return false;
  return workStatus === "approved" || workStatus === "active" || (admin.trainingCompleted && isKycVer);
};

function AdminManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const customColor = "#008080";
  const customHoverColor = "#006666";
  const customBorderColor = "gray.200";

  const toast = useAppToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authInitialized = useAppSelector(selectAuthInitialized);
  const authUser = useAppSelector(selectUser);
  const userRole = useAppSelector(selectRole);
  const isOwner = isOwnerRole(userRole);

  // Primary data states
  const [adminData, setAdminData] = useState([]);
  const [allKycRecords, setAllKycRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Granular Filter states
  const [bankFilter, setBankFilter] = useState("all"); // 'all' | 'verified' | 'unverified' | 'rejected'
  const [kycFilter, setKycFilter] = useState("all"); // 'all' | 'verified' | 'pending' | 'rejected'
  const [trainingFilter, setTrainingFilter] = useState("all"); // 'all' | 'completed' | 'pending'
  const [workStatusFilter, setWorkStatusFilter] = useState("all"); // 'all' | 'approved' | 'pending' | 'suspended'
  const [districtCategory, setDistrictCategory] = useState("all"); // 'all' | 'created' | 'non_created'
  const location = useLocation();
  const [districtFilter, setDistrictFilter] = useState("all"); // specific district name or 'all'
  const [masterDistricts, setMasterDistricts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => {
    const q = new URLSearchParams(location.search).get("search");
    return q ? decodeURIComponent(q) : "";
  });

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search");
    if (q !== null && q !== undefined) {
      setSearchTerm(decodeURIComponent(q));
      setCurrentPage(1);
    }
  }, [location.search]);

  const hasActiveFilters =
    bankFilter !== "all" ||
    kycFilter !== "all" ||
    trainingFilter !== "all" ||
    workStatusFilter !== "all" ||
    districtCategory !== "all" ||
    districtFilter !== "all" ||
    searchTerm.trim() !== "";

  const handleResetFilters = () => {
    setBankFilter("all");
    setKycFilter("all");
    setTrainingFilter("all");
    setWorkStatusFilter("all");
    setDistrictCategory("all");
    setDistrictFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View state: 'list' | 'add' | 'edit'
  const [currentView, setCurrentView] = useState("list");
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Modals state
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [kycData, setKYCData] = useState(null);
  const [kycLoading, setKYcLoading] = useState(false);
  const [selectedTechForKYC, setSelectedTechForKYC] = useState(null);
  const [rejectionInput, setRejectionInput] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isUnmaskedPII, setIsUnmaskedPII] = useState(false);
  const [isEditKYCOpen, setIsEditKYCOpen] = useState(false);
  const [kycEditForm, setKycEditForm] = useState({ aadhaarNumber: "", panNumber: "", drivingLicenseNumber: "" });
  const [savingKycEdit, setSavingKycEdit] = useState(false);

  // Bank Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedTechForBank, setSelectedTechForBank] = useState(null);
  const [bankRejectionReason, setBankRejectionReason] = useState("");
  const [showBankRejection, setShowBankRejection] = useState(false);
  const [isEditBankOpen, setIsEditBankOpen] = useState(false);
  const [bankEditForm, setBankEditForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
  });
  const [savingBankEdit, setSavingBankEdit] = useState(false);

  // Technician Details Profile Drawer
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState(0);

  const handleOpenTechnicianDrawer = (tech, tab = 0) => {
    setSelectedTechnician(tech);
    setDrawerInitialTab(tab);
    setIsDetailsModalOpen(true);
  };

  // Work Status Prerequisites Modal
  const [isWorkStatusPrereqModalOpen, setIsWorkStatusPrereqModalOpen] = useState(false);
  const [workStatusPrereqTech, setWorkStatusPrereqTech] = useState(null);
  const [workStatusPrereqEvaluation, setWorkStatusPrereqEvaluation] = useState(null);

  // Delete Alert
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isKycDeleteConfirmOpen, setIsKycDeleteConfirmOpen] = useState(false);
  const [isDeletingKyc, setIsDeletingKyc] = useState(false);
  const [kycDeleteError, setKycDeleteError] = useState(null);
  const cancelRef = useRef();

  // Orphaned KYC maintenance (KYC docs with no linked technician)
  // GET/DELETE /admin/kyc/orphaned/*
  const [orphanedKyc, setOrphanedKyc] = useState([]);
  const [orphanedOpen, setOrphanedOpen] = useState(false);
  const [orphanedLoading, setOrphanedLoading] = useState(false);

  const fetchOrphanedKyc = async () => {
    setOrphanedLoading(true);
    try {
      const { data, error } = await listOrphanedKyc();
      if (error) throw new Error(error);
      const list = data?.result ?? data?.data ?? data ?? [];
      setOrphanedKyc(Array.isArray(list) ? list : list?.records ?? []);
    } catch (e) {
      toast.error(e, { title: "Orphaned KYC Error", description: "Failed to load orphaned KYC records.", duration: 3000, isClosable: true });
    } finally {
      setOrphanedLoading(false);
    }
  };

  const handleDeleteOrphanedKyc = async (kycId) => {
    try {
      const { error } = await deleteOrphanedKyc(kycId);
      if (error) throw new Error(error);
      toast({ title: "Orphaned KYC Deleted", status: "success", duration: 2500, isClosable: true });
      fetchOrphanedKyc();
    } catch (e) {
      toast.error(e, { title: "Delete Error", duration: 3000, isClosable: true });
    }
  };

  const handleConfirmKycDelete = async () => {
    if (!selectedTechForKYC?._id) return false;
    setIsDeletingKyc(true);
    setKycDeleteError(null);
    try {
      await dispatch(removeKYC({ id: selectedTechForKYC._id })).unwrap();
      setIsKycDeleteConfirmOpen(false);
      setIsKYCModalOpen(false);
      toast({ title: "KYC record deleted", status: "success", duration: 2500, isClosable: true });
      await fetchData();
      return true;
    } catch (e) {
      const failure = e || new Error("Failed to delete KYC record.");
      setKycDeleteError(failure);
      toast({
        title: "KYC delete failed",
        description: failure?.message || "Failed to delete KYC record.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      throw failure;
    } finally {
      setIsDeletingKyc(false);
    }
  };

  const handleCleanupAllOrphanedKyc = async () => {
    try {
      const { error } = await cleanupAllOrphanedKyc();
      if (error) throw new Error(error);
      toast({ title: "Orphaned KYC Cleaned Up", status: "success", duration: 2500, isClosable: true });
      fetchOrphanedKyc();
    } catch (e) {
      toast.error(e, { title: "Cleanup Error", duration: 3000, isClosable: true });
    }
  };
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: "",
    role: "admin",
    status: "Active",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Check privileged authorization
  useEffect(() => {
    if (!authInitialized) return;
    if (!isPrivilegedRole(userRole)) {
      toast({
        title: "Access Denied",
        description: "Please sign in with an Owner or Admin account.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/auth/signin");
      return;
    }
    if (isMountedRef.current) {
      setCurrentUser(authUser || { role: userRole });
    }
  }, [authInitialized, authUser, userRole, toast, navigate]);

  // 2. Fetch Technicians and KYC Data (CRUD page: force fresh reads via
  // shared thunks; parsing/sorting/guards below are unchanged)
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setTableLoading(true);
    setError("");
    try {
      const [adminsResult, kycResult, distResult] = await Promise.allSettled([
        dispatch(fetchTechnicians({ force: true })).unwrap().then((r) => r.list),
        dispatch(fetchKYCRecords({ force: true })).unwrap().then((r) => r.list),
        getAllDistricts(),
      ]);

      if (!isMountedRef.current) return;

      const adminsResponse = adminsResult.status === "fulfilled" ? adminsResult.value : {};
      const kycResponse = kycResult.status === "fulfilled" ? kycResult.value : {};
      const distResponse = distResult.status === "fulfilled" ? distResult.value : {};

      const admins =
        adminsResponse.result ||
        adminsResponse.data?.admins ||
        adminsResponse.data ||
        adminsResponse?.admins ||
        adminsResponse ||
        [];
      const kycRecords = kycResponse.result || kycResponse.data || kycResponse || [];
      const distList = distResponse.result || distResponse.data || distResponse.districts || (Array.isArray(distResponse) ? distResponse : []);

      if (Array.isArray(distList) && isMountedRef.current) {
        setMasterDistricts(distList);
      }
      if (Array.isArray(kycRecords) && isMountedRef.current) {
        setAllKycRecords(kycRecords);
      }
      if (Array.isArray(admins) && isMountedRef.current) {
        const sortedAdmins = [...admins].sort(
          (a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
        );
        setAdminData(sortedAdmins);
      }
      if (isMountedRef.current) {
        setDataLoaded(true);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error fetching data:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load technician list.";
      if (
        errorMessage.includes("token not found") ||
        errorMessage.includes("Session expired") ||
        errorMessage.includes("401")
      ) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        clearAuth();
        navigate("/auth/signin");
        return;
      }
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setTableLoading(false);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Stats calculation - Single O(N) pass with O(1) indexed KYC lookups
  const totalCount = adminData.length;
  const {
    newTechCount,
    newUnverifiedCount,
    activeTechCount,
    kycVerifiedCount,
    kycUnverifiedCount,
    bankVerifiedCount,
    bankUnverifiedCount,
  } = useMemo(() => {
    let newTech = 0;
    let newUnverified = 0;
    let activeTech = 0;
    let kycVerified = 0;
    let kycUnverified = 0;
    let bankVerified = 0;
    let bankUnverified = 0;

    for (let i = 0; i < adminData.length; i++) {
      const a = adminData[i];
      const isNew = isNewTechnician(a, allKycRecords);
      const isKYCVer = isTechnicianKYCVerified(a, allKycRecords);
      const isBankVer = isTechnicianBankVerified(a, allKycRecords);
      const isActive = isActiveTechnician(a, allKycRecords);

      if (isNew) {
        newTech++;
        if (!isKYCVer || !isBankVer) newUnverified++;
      }
      if (isActive) activeTech++;
      if (isKYCVer) kycVerified++; else kycUnverified++;
      if (isBankVer) bankVerified++; else bankUnverified++;
    }

    return {
      newTechCount: newTech,
      newUnverifiedCount: newUnverified,
      activeTechCount: activeTech,
      kycVerifiedCount: kycVerified,
      kycUnverifiedCount: kycUnverified,
      bankVerifiedCount: bankVerified,
      bankUnverifiedCount: bankUnverified,
    };
  }, [adminData, allKycRecords]);

  // 1. Approved Coverage District List (from explicit district permission arrays)
  const createdDistrictsList = useMemo(() => {
    const map = new Map();
    (masterDistricts || []).forEach((d) => {
      const rawName = typeof d === "string" ? d : (d.name || d.districtName || d.title || d.city);
      const id = typeof d === "object" ? String(d._id || d.id || "") : "";
      if (rawName && typeof rawName === "string" && rawName.trim()) {
        const name = rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1);
        const key = id || name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { id, name, count: 0 });
        }
      }
    });

    (adminData || []).forEach((tech) => {
      getTechnicianApprovedDistricts(tech, masterDistricts).forEach((district) => {
        let key = district.id;
        if (!map.has(key)) {
          const nameKey = String(district.name || "").toLowerCase();
          const match = Array.from(map.entries()).find(
            ([, value]) => value.name.toLowerCase() === nameKey
          );
          if (match) key = match[0];
        }
        if (map.has(key)) {
          map.get(key).count += 1;
        } else {
          map.set(key, { id: district.id, name: district.name, count: 1 });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [masterDistricts, adminData]);

  // Technician counts per coverage category
  const createdDistrictTechCount = useMemo(() => {
    return (adminData || []).filter((tech) =>
      hasApprovedDistrictCoverage(tech, masterDistricts)
    ).length;
  }, [adminData, masterDistricts]);

  const nonCreatedDistrictTechCount = useMemo(() => {
    return (adminData || []).length - createdDistrictTechCount;
  }, [adminData, createdDistrictTechCount]);

  // Filtered dataset computation across all 6 granular filters + search
  const filteredData = useMemo(() => {
    let list = [...adminData];

    // 1. Bank Verification Filter
    if (bankFilter !== "all") {
      list = list.filter((a) => {
        const isVerified = isTechnicianBankVerified(a, allKycRecords);
        if (bankFilter === "verified") return isVerified;
        if (bankFilter === "unverified") return !isVerified;
        if (bankFilter === "rejected") {
          const kycMatch = findKYCRecord(a, allKycRecords);
          const b = kycMatch?.bankDetails || a.bankDetails || a.profile?.bankDetails || a.bankAccount;
          return (
            b?.verificationStatus?.toLowerCase() === "rejected" ||
            b?.status?.toLowerCase() === "rejected"
          );
        }
        return true;
      });
    }

    // 2. KYC Status Filter
    if (kycFilter !== "all") {
      list = list.filter((a) => {
        const isKyc = isTechnicianKYCVerified(a, allKycRecords);
        const kycMatch = findKYCRecord(a, allKycRecords);
        const kycStatus = (kycMatch?.status || kycMatch?.verificationStatus || "").toLowerCase();
        if (kycFilter === "verified") return isKyc;
        if (kycFilter === "pending") return !isKyc && kycStatus !== "rejected";
        if (kycFilter === "rejected") return kycStatus === "rejected";
        return true;
      });
    }

    // 3. Training Status Filter
    if (trainingFilter !== "all") {
      list = list.filter((a) => {
        if (trainingFilter === "completed") return Boolean(a.trainingCompleted);
        if (trainingFilter === "pending") return !a.trainingCompleted;
        return true;
      });
    }

    // 4. Work Status Filter
    if (workStatusFilter !== "all") {
      list = list.filter((a) => {
        const w = (a.workStatus || "pending").toLowerCase();
        if (workStatusFilter === "approved") return w === "approved";
        if (workStatusFilter === "pending") return w === "pending";
        if (workStatusFilter === "suspended") return w === "suspended" || a.status === "Inactive";
        return true;
      });
    }

    // 5. Coverage Area Filter
    if (districtCategory === "created") {
      list = list.filter((admin) => {
        const approved = getTechnicianApprovedDistricts(admin, masterDistricts);
        if (approved.length === 0) return false;
        if (districtFilter !== "all" && districtFilter.trim() !== "") {
          const target = districtFilter.toLowerCase();
          return approved.some((district) => district.name.toLowerCase() === target);
        }
        return true;
      });
    } else if (districtCategory === "non_created") {
      list = list.filter((admin) => !hasApprovedDistrictCoverage(admin, masterDistricts));
    } else if (districtFilter !== "all" && districtFilter.trim() !== "") {
      const target = districtFilter.toLowerCase();
      list = list.filter((admin) => {
        const approvedMatches = getTechnicianApprovedDistricts(admin, masterDistricts).some(
          (district) => district.name.toLowerCase() === target
        );
        const primaryMatches = (getTechnicianDistrict(admin, masterDistricts) || "").toLowerCase() === target;
        return approvedMatches || primaryMatches;
      });
    }

    // 6. Search Filter (Name, Email, Specialization, Approved Districts, Registration District, Phone, Aadhaar, PAN, Bank Details)
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase().trim();
      const qClean = q.replace(/[\s-]/g, "");
      list = list.filter((admin) => {
        const fullName = getTechnicianName(admin, allKycRecords).toLowerCase();
        const email = (getTechnicianEmail(admin, allKycRecords) || "").toLowerCase();
        const spec = (getTechnicianSpecialization(admin) || "").toLowerCase();
        const approvedDistrictText = getTechnicianApprovedDistrictNames(admin, masterDistricts)
          .join(" ")
          .toLowerCase();
        const registrationDistrict = getTechnicianDistrict(admin, masterDistricts).toLowerCase();
        const phone = (getTechnicianPhone(admin, allKycRecords) || "").toString().replace(/[\s-]/g, "");
        const kycMatch = findKYCRecord(admin, allKycRecords);
        const aadhaar = (kycMatch?.aadhaarNumber || "").toString().replace(/[\s-]/g, "");
        const pan = (kycMatch?.panNumber || "").toLowerCase();
        
        // Comprehensive Bank Account Matching
        const bankDetails = kycMatch?.bankDetails || admin.bankDetails || admin.profile?.bankDetails || admin.bankAccount || {};
        const accNo = (bankDetails.accountNumber || admin.bankAccountNumber || admin.accountNumber || "").toString().replace(/[\s-]/g, "");
        const ifsc = (bankDetails.ifscCode || admin.ifscCode || "").toString().toLowerCase();
        const bankName = (bankDetails.bankName || admin.bankName || "").toString().toLowerCase();
        const accHolder = (bankDetails.accountHolderName || "").toString().toLowerCase();
        const upi = (bankDetails.upiId || admin.upiId || "").toString().toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          spec.includes(q) ||
          approvedDistrictText.includes(q) ||
          registrationDistrict.includes(q) ||
          phone.includes(qClean) ||
          aadhaar.includes(qClean) ||
          pan.includes(q) ||
          accNo.includes(qClean) ||
          ifsc.includes(q) ||
          bankName.includes(q) ||
          accHolder.includes(q) ||
          upi.includes(q)
        );
      });
    }

    return list;
  }, [
    adminData,
    allKycRecords,
    bankFilter,
    kycFilter,
    trainingFilter,
    workStatusFilter,
    districtCategory,
    districtFilter,
    searchTerm,
    masterDistricts,
  ]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Training Status Toggle (Gate 1)
  const handleToggleTraining = async (tech, nextStatus) => {
    try {
      setLoading(true);
      await dispatch(setTrainingStatus({ id: tech._id, completed: nextStatus })).unwrap();
      toast({
        title: nextStatus ? "Training Approved" : "Training Incomplete",
        description: `Technician ${getTechnicianName(tech, allKycRecords)} marked as ${nextStatus ? "Training Completed" : "Training Incomplete"}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
      if (selectedTechnician && selectedTechnician._id === tech._id) {
        setSelectedTechnician((prev) => ({ ...prev, trainingCompleted: nextStatus }));
      }
    } catch (err) {
      toast.error(err, { title: "Training Update Error", description: "Failed to update training status.", duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  // Work Status Toggle
  const handleUpdateWorkStatus = async (tech, workStatus) => {
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

    if (workStatus === "approved") {
      const evaluation = evaluateWorkStatusEligibility(
        tech,
        allKycRecords,
        masterDistricts,
        isTechnicianKYCVerified,
        isTechnicianBankVerified,
        getTechnicianApprovedDistricts
      );
      if (!evaluation.isEligible) {
        setWorkStatusPrereqTech(tech);
        setWorkStatusPrereqEvaluation(evaluation);
        setIsWorkStatusPrereqModalOpen(true);
        return;
      }
    }

    try {
      setLoading(true);
      await dispatch(setWorkStatus({
        technicianId: tech._id,
        id: tech._id,
        workStatus: workStatus,
        status: workStatus === "approved" ? "Active" : "Inactive",
        trainingCompleted: tech.trainingCompleted ?? true,
      })).unwrap();
      toast({
        title: "Work Status Updated",
        description: `Technician status set to ${workStatus}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
      if (selectedTechnician && selectedTechnician._id === tech._id) {
        setSelectedTechnician((prev) => ({ ...prev, workStatus: workStatus, status: workStatus === "approved" ? "Active" : "Inactive" }));
      }
    } catch (err) {
      toast.error(err, { title: "Status Update Error", description: "Failed to update work status.", duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  // KYC Review Modal Handlers
  const handleOpenKYCModal = async (tech) => {
    setSelectedTechForKYC(tech);
    setIsKYCModalOpen(true);
    setKYCData(null);
    setKYcLoading(true);
    setIsUnmaskedPII(false);
    setShowRejectionInput(false);
    setRejectionInput("");
    try {
      const { detail } = await dispatch(fetchKYCDetail(tech._id)).unwrap();
      setKYCData(detail);
    } catch (e) {
      console.error("KYC fetch error:", e);
      toast({
        title: "Notice",
        description: "No uploaded KYC documents found for this technician.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      setKYCData(null);
    } finally {
      setKYcLoading(false);
    }
  };

  const handleToggleUnmaskedPII = async () => {
    if (!selectedTechForKYC) return;
    if (isUnmaskedPII) {
      // Re-fetch masked
      handleOpenKYCModal(selectedTechForKYC);
      return;
    }
    setKYcLoading(true);
    try {
      const response = await getKYCFullPII(selectedTechForKYC._id);
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

  const handleVerifyKYCAction = async (status) => {
    if (!selectedTechForKYC) return;
    if (status === "rejected" && (!rejectionInput || rejectionInput.trim() === "")) {
      return toast({
        title: "Rejection Reason Required",
        description: "Please specify why this KYC identity is being rejected.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    if (status === "approved") {
      let rec = Array.isArray(kycData)
        ? kycData.find((d) => (d.technicianId?._id || d.technicianId) === selectedTechForKYC?._id) || kycData[0]
        : kycData;
      const docs = rec?.documents || {};
      const hasDocs = Boolean(docs.aadhaarUrl || docs.panUrl || docs.dlUrl || docs.idUrl || docs.profileUrl);

      if (!hasDocs) {
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
        technicianId: selectedTechForKYC._id,
        status: status,
        rejectionReason: status === "rejected" ? rejectionInput : null,
      })).unwrap();
      toast({
        title: status === "approved" ? "KYC Approved" : "KYC Rejected",
        description: `Technician identity verification marked as ${status}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsKYCModalOpen(false);
      await fetchData();
    } catch (e) {
      const serverReason =
        (typeof e === "string"
          ? e
          : e?.message || e?.data?.message || e?.response?.data?.message || e?.error || "")
          .replace(/^Error:\s*/i, "")
          .trim();
      const description = serverReason || "Failed to submit KYC verification.";

      toast({
        title: "Verification Error",
        description: description,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setKYcLoading(false);
    }
  };

  const handleOpenEditKYC = (kycRecord) => {
    setKycEditForm({
      aadhaarNumber: kycRecord?.aadhaarNumber || "",
      panNumber: kycRecord?.panNumber || "",
      drivingLicenseNumber: kycRecord?.drivingLicenseNumber || "",
    });
    setIsEditKYCOpen(true);
  };

  const handleSaveKYCEdit = async () => {
    if (!selectedTechForKYC) return;
    setSavingKycEdit(true);
    try {
      await dispatch(editTechnicianKYC({ id: selectedTechForKYC._id, body: kycEditForm })).unwrap();
      toast({
        title: "KYC Details Saved",
        description: "Technician identity document numbers updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditKYCOpen(false);
      await handleOpenKYCModal(selectedTechForKYC);
      await fetchData();
    } catch (e) {
      toast.error(e, { title: "Save Error", description: "Failed to update KYC numbers.", duration: 3000, isClosable: true });
    } finally {
      setSavingKycEdit(false);
    }
  };

  // Bank Review Modal Handlers
  const handleOpenBankModal = (tech) => {
    setSelectedTechForBank(tech);
    const kycMatch = findKYCRecord(tech, allKycRecords);
    const bankDetails = kycMatch?.bankDetails || {};
    setBankEditForm({
      accountHolderName: bankDetails.accountHolderName || "",
      bankName: bankDetails.bankName || "",
      accountNumber: bankDetails.accountNumber || "",
      ifscCode: bankDetails.ifscCode || "",
      branchName: bankDetails.branchName || "",
      upiId: bankDetails.upiId || "",
    });
    setShowBankRejection(false);
    setBankRejectionReason("");
    setIsBankModalOpen(true);
  };

  const handleVerifyBankAction = async (verified) => {
    if (!selectedTechForBank) return;
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
      setLoading(true);
      await dispatch(verifyTechnicianBank({
        technicianId: selectedTechForBank._id,
        verified: verified,
        bankRejectionReason: !verified ? bankRejectionReason : null,
      })).unwrap();
      toast({
        title: verified ? "Bank Verified (Payouts Enabled)" : "Bank Rejected",
        description: verified
          ? "Technician bank verified. Payouts and withdrawals are enabled."
          : "Bank verification rejected.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsBankModalOpen(false);
      await fetchData();
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
      setLoading(false);
    }
  };

  const handleSaveBankEdit = async () => {
    if (!selectedTechForBank) return;
    setSavingBankEdit(true);
    try {
      await dispatch(editTechnicianBank({ id: selectedTechForBank._id, body: bankEditForm })).unwrap();
      toast({
        title: "Bank Details Updated",
        description: "Technician payout bank details updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditBankOpen(false);
      await fetchData();
    } catch (e) {
      toast.error(e, { title: "Save Error", description: "Failed to update bank details.", duration: 3000, isClosable: true });
    } finally {
      setSavingBankEdit(false);
    }
  };

  // Toggle Technician Payout Freeze (Owner only)
  const handleTogglePayoutFreeze = async (tech) => {
    if (!isOwner) {
      toast({
        title: "Owner access required",
        description: "Only Owners can freeze or unfreeze payouts.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const currentlyFrozen = tech.payoutBlocked === true;
    const actionText = currentlyFrozen ? "unfreeze" : "freeze";
    try {
      const { data, error } = await freezeTechnicianPayout(tech._id, {
        freeze: !currentlyFrozen,
        reason: currentlyFrozen ? "Unfrozen by administrator" : "Administrative hold via Technician Management",
      });
      if (error) throw new Error(error);
      toast({
        title: currentlyFrozen ? "Payouts Unfrozen" : "Payouts Frozen",
        description: `Successfully ${actionText}d payouts for ${getTechnicianName(tech, allKycRecords)}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchData();
    } catch (e) {
      toast.error(e, {
        title: "Freeze Toggle Failed",
        description: e.message || `Could not ${actionText} payouts.`,
        duration: 3500,
        isClosable: true,
      });
    }
  };

  // Delete Technician
  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;
    if (!isOwner) {
      toast({
        title: "Owner access required",
        description: "Only Owner accounts can delete technicians.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
      return;
    }

    const balancePaise = Number(adminToDelete.availableBalancePaise) || ((Number(adminToDelete.walletBalance) || 0) * 100);
    const hasActiveBalance = balancePaise > 0 || (Number(adminToDelete.reservedBalancePaise) || 0) > 0 || (Number(adminToDelete.outstandingDuesPaise) || 0) > 0;
    if (hasActiveBalance) {
      toast({
        title: "Deletion Blocked",
        description: `Cannot delete technician with active wallet balance of ₹${(balancePaise / 100).toFixed(2)}. Settle all funds first.`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await dispatch(removeTechnician({ id: adminToDelete._id })).unwrap();
      toast({
        title: "Technician Deleted",
        description: `${getTechnicianName(adminToDelete, allKycRecords)} has been removed.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
      await fetchData();
    } catch (e) {
      toast.error(e, { title: "Delete Error", description: "Failed to delete technician.", duration: 3000, isClosable: true });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentUser) {
    return <PageSkeleton type="table" statsCount={5} columns={7} rows={8} />;
  }

  return (
    <Flex
      flexDirection="column"
      pt={0}
      w="100%"
      minH="100%"
    >
      {/* 5 TOP SUMMARY CARDS (KPIs ONLY, NON-FILTERING) */}
      <Box
        position={{ base: "static", md: "sticky" }}
        top={{ base: "0", md: "64px" }}
        zIndex="900"
        bg="gray.50"
        pt={{ base: 1, md: 2 }}
        pb={{ base: 2, md: 3 }}
      >
        <AdminStatsCards
          loading={loading}
          counts={{
            totalCount,
            newTechCount,
            newUnverifiedCount,
            activeTechCount,
            kycVerifiedCount,
            kycUnverifiedCount,
            bankVerifiedCount,
            bankUnverifiedCount,
          }}
          customColor={customColor}
          customBorderColor={customBorderColor}
          textColor={textColor}
        />
      </Box>

      {/* TABLE SECTION CONTAINER */}
      <Box flex="1" px={{ base: 2, md: 4 }} pb={4} display="flex" flexDirection="column">
        <Card
          bg="white"
          shadow="lg"
          borderRadius="16px"
          border="1px solid"
          borderColor={customBorderColor}
          display="flex"
          flexDirection="column"
          flex="1"
          overflow="hidden"
        >
          {/* Header Controls Bar */}
          <CardHeader p="16px" pb="14px" borderBottom="1px solid" borderColor="gray.100">
            <Flex direction="column" gap={3}>
              {/* Row 1: Search, Results Count, Reset Filters, Refresh */}
              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap={3}
              >
                <HStack spacing={3} flex="1" maxW={{ base: "100%", md: "460px" }}>
                  <InputGroup size="sm">
                    <Input
                      placeholder="Search name, phone, bank account, IFSC..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      borderRadius="8px"
                      borderColor={`${customColor}40`}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                    />
                    <InputRightElement>
                      {searchTerm ? (
                        <IconButton
                          size="xs"
                          aria-label="Clear search"
                          icon={<FaTimes />}
                          variant="ghost"
                          onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                          }}
                        />
                      ) : (
                        <Icon as={FaSearch} color="gray.400" />
                      )}
                    </InputRightElement>
                  </InputGroup>
                </HStack>

                <HStack spacing={2.5} justify={{ base: "flex-end", sm: "flex-end" }} flexWrap="wrap">
                  {hasActiveFilters && (
                    <Button
                      size="sm"
                      variant="solid"
                      colorScheme="red"
                      leftIcon={<Icon as={FaTimes} />}
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </Button>
                  )}

                  <RefreshButton
                    iconOnly
                    isLoading={loading}
                    onClick={fetchData}
                    aria-label="Refresh technicians and verifications"
                    color={customColor}
                    borderColor={`${customColor}50`}
                    _hover={{ bg: `${customColor}10`, borderColor: customColor }}
                    _active={{ bg: `${customColor}20`, borderColor: customColor }}
                  />
                </HStack>
              </Flex>

              {/* Row 2: 6 Granular Filter Dropdowns Grid */}
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={2.5} w="100%">
                {/* 1. Bank Verification Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={bankFilter}
                  onChange={(e) => {
                    setBankFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={bankFilter !== "all" ? customColor : `${customColor}50`}
                  bg={bankFilter !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={bankFilter !== "all" ? "bold" : "normal"}
                  color={bankFilter !== "all" ? customColor : "gray.700"}
                  title={bankFilter !== "all" ? `Bank: ${bankFilter}` : "Filter by Bank Verification"}
                >
                  <option value="all">🏦 Bank: All</option>
                  <option value="verified">✅ Bank Verified</option>
                  <option value="unverified">⏳ Bank Pending</option>
                  <option value="rejected">❌ Bank Rejected</option>
                </Select>

                {/* 2. KYC Status Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={kycFilter}
                  onChange={(e) => {
                    setKycFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={kycFilter !== "all" ? customColor : `${customColor}50`}
                  bg={kycFilter !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={kycFilter !== "all" ? "bold" : "normal"}
                  color={kycFilter !== "all" ? customColor : "gray.700"}
                  title={kycFilter !== "all" ? `KYC: ${kycFilter}` : "Filter by KYC Verification"}
                >
                  <option value="all">🪪 KYC: All</option>
                  <option value="verified">✅ KYC Verified</option>
                  <option value="pending">⏳ KYC Pending</option>
                  <option value="rejected">❌ KYC Rejected</option>
                </Select>

                {/* 3. Training Status Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={trainingFilter}
                  onChange={(e) => {
                    setTrainingFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={trainingFilter !== "all" ? customColor : `${customColor}50`}
                  bg={trainingFilter !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={trainingFilter !== "all" ? "bold" : "normal"}
                  color={trainingFilter !== "all" ? customColor : "gray.700"}
                  title={trainingFilter !== "all" ? `Training: ${trainingFilter}` : "Filter by Gate 1 Training"}
                >
                  <option value="all">🎓 Training: All</option>
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                </Select>

                {/* 4. Work Status Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={workStatusFilter}
                  onChange={(e) => {
                    setWorkStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={workStatusFilter !== "all" ? customColor : `${customColor}50`}
                  bg={workStatusFilter !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={workStatusFilter !== "all" ? "bold" : "normal"}
                  color={workStatusFilter !== "all" ? customColor : "gray.700"}
                  title={workStatusFilter !== "all" ? `Work Status: ${workStatusFilter}` : "Filter by Work Status"}
                >
                  <option value="all">⚡ Work: All</option>
                  <option value="approved">✅ Approved</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="suspended">🚫 Suspended</option>
                </Select>

                {/* 5. Coverage Area Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={districtCategory}
                  onChange={(e) => {
                    setDistrictCategory(e.target.value);
                    setDistrictFilter("all");
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={districtCategory !== "all" ? customColor : `${customColor}50`}
                  bg={districtCategory !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={districtCategory !== "all" ? "bold" : "normal"}
                  color={districtCategory !== "all" ? customColor : "gray.700"}
                  title={districtCategory !== "all" ? `Coverage: ${districtCategory}` : "Filter by Coverage Area"}
                >
                  <option value="all">📍 Coverage: All</option>
                  <option value="created">✅ Approved ({createdDistrictTechCount})</option>
                  <option value="non_created">⚠️ Pending ({nonCreatedDistrictTechCount})</option>
                </Select>

                {/* 6. District-Wise Technicians Filter */}
                <Select
                  size="sm"
                  h="34px"
                  w="100%"
                  minW="0"
                  fontSize="xs"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  cursor="pointer"
                  pr="28px"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="8px"
                  borderColor={districtFilter !== "all" ? customColor : `${customColor}50`}
                  bg={districtFilter !== "all" ? `${customColor}12` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                  fontWeight={districtFilter !== "all" ? "bold" : "normal"}
                  color={districtFilter !== "all" ? customColor : "gray.700"}
                  title={districtFilter !== "all" ? `District: ${districtFilter}` : "Filter by Specific District"}
                >
                  <option value="all">🏙️ District: All</option>
                  {createdDistrictsList.map((d) => {
                    const cleanName = (d.name || "").replace(/\s+Operational\s+Range$/i, "");
                    return (
                      <option key={d.id || d.name} value={d.name} title={d.name}>
                        📍 {cleanName} {d.count > 0 ? `(${d.count})` : ""}
                      </option>
                    );
                  })}
                </Select>
              </SimpleGrid>
            </Flex>
          </CardHeader>

          {/* Table Body */}
          <CardBody p={0} flex="1" display="flex" flexDirection="column" overflow="hidden">
            {error ? (
              <Box p={4}>
                <ErrorState
                  compact
                  error={error}
                  title="Could not load technicians"
                  onRetry={fetchData}
                />
              </Box>
            ) : null}
            <DataTable
              keyExtractor={(tech) => tech._id}
              rows={currentItems}
              isLoading={tableLoading}
              onRowClick={(tech) => {
                setSelectedTechnician(tech);
                setIsDetailsModalOpen(true);
              }}
              emptyIcon={FaSearch}
              emptyTitle="No technicians match the selected filters"
              emptyDescription="Try clearing the search query or resetting filters."
              emptyAction={
                hasActiveFilters ? (
                  <Button
                    size="sm"
                    mt={4}
                    colorScheme="teal"
                    onClick={handleResetFilters}
                  >
                    Reset All Filters
                  </Button>
                ) : undefined
              }
              pagination={
                tableLoading || currentItems.length === 0
                  ? undefined
                  : {
                      page: currentPage,
                      totalPages: totalPages || 1,
                      totalRows: filteredData.length,
                      indexOfFirst: indexOfFirstItem,
                      indexOfLast: Math.min(indexOfLastItem, filteredData.length),
                      rowsPerPage: itemsPerPage,
                      onPageChange: setCurrentPage,
                      showRowsPerPage: false,
                      label: "technicians",
                    }
              }
              onRowClick={(tech) => handleOpenTechnicianDrawer(tech, 0)}
              columns={[
                {
                  key: "technicianProfile",
                  label: "Technician Profile",
                  minWidth: "190px",
                  cell: (tech) => (
                    <Flex
                      align="center"
                      cursor="pointer"
                      onClick={() => handleOpenTechnicianDrawer(tech, 0)}
                    >
                      <Avatar
                        size="sm"
                        name={getTechnicianName(tech, allKycRecords)}
                        src={getTechnicianImage(tech, allKycRecords)}
                        mr={3}
                        border="1px solid"
                        borderColor={customColor}
                      />
                      <Box maxW="150px">
                        <Text fontWeight="bold" color="gray.800" fontSize="sm" isTruncated title={getTechnicianName(tech, allKycRecords)}>
                          {getTechnicianName(tech, allKycRecords)}
                        </Text>
                        <Flex align="center" gap={1} mt={0.5}>
                          <Text fontSize="xs" color="gray.500" isTruncated maxW="110px">
                            {getTechnicianPhone(tech, allKycRecords) || getTechnicianEmail(tech, allKycRecords) || "No contact"}
                          </Text>
                          {tech.availability?.isOnline && (
                            <StatusBadge
                              colorScheme="green"
                              label="Online"
                              variant="subtle"
                              flexShrink={0}
                              showDot
                            />
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  ),
                },
                {
                  key: "district",
                  label: "Approved Coverage",
                  minWidth: "170px",
                  cell: (tech) => {
                    const approved = getTechnicianApprovedDistricts(tech, masterDistricts);
                    const registrationDistrict = getTechnicianDistrict(tech, masterDistricts);

                    if (approved.length === 0) {
                      return (
                        <Box>
                          <StatusBadge
                            colorScheme="orange"
                            label="Coverage Pending"
                            title="An Admin/Owner must grant a district with an active zone"
                          />
                          <Text fontSize="2xs" color="gray.500" mt={1} isTruncated maxW="160px">
                            Registration: {registrationDistrict || "Not set"}
                          </Text>
                        </Box>
                      );
                    }

                    return (
                      <Box>
                        <VStack align="flex-start" spacing={1.5} w="100%">
                          {approved.slice(0, 2).map((district) => {
                            const cleanName = (district.name || "").replace(/\s+Operational\s+Range$/i, "");
                            return (
                              <Badge
                                key={district.id}
                                colorScheme="teal"
                                px={2.5}
                                py={1}
                                borderRadius="md"
                                textTransform="capitalize"
                                fontWeight="bold"
                                fontSize="2xs"
                                title={`Approved Coverage: ${district.name}`}
                                display="inline-flex"
                                alignItems="center"
                                gap={1.5}
                                maxW="100%"
                                m="0 !important"
                                alignSelf="flex-start"
                                lineHeight="normal"
                              >
                                <Text as="span" flexShrink={0}>📍</Text>
                                <Text as="span" isTruncated maxW="160px">
                                  {cleanName || district.name}
                                </Text>
                              </Badge>
                            );
                          })}
                          {approved.length > 2 && (
                            <Badge
                              colorScheme="teal"
                              variant="subtle"
                              fontSize="2xs"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              m="0 !important"
                              alignSelf="flex-start"
                            >
                              +{approved.length - 2} more
                            </Badge>
                          )}
                          <Text fontSize="2xs" color="gray.500" mt={0.5} m="0 !important">
                            Admin/Owner approved
                          </Text>
                        </VStack>
                      </Box>
                    );
                  },
                },
                {
                  key: "training",
                  label: "Gate 1: Training",
                  align: "center",
                  minWidth: "150px",
                  cell: (tech) => (
                    <Flex align="center" justify="center" gap={1.5}>
                      <StatusBadge
                        colorScheme={tech.trainingCompleted ? "green" : "orange"}
                        label={tech.trainingCompleted ? "Completed" : "Pending"}
                        variant={tech.trainingCompleted ? "subtle" : "solid"}
                        cursor="pointer"
                        onClick={() => handleOpenTechnicianDrawer(tech, 0)}
                      />
                      {!tech.trainingCompleted && (
                        <Tooltip label="Approve Gate 1 training completion">
                          <IconButton
                            size="xs"
                            h="26px"
                            w="26px"
                            aria-label="Approve Gate 1 Training"
                            icon={<FaUserGraduate />}
                            colorScheme="teal"
                            variant="solid"
                            onClick={() => handleToggleTraining(tech, true)}
                          />
                        </Tooltip>
                      )}
                    </Flex>
                  ),
                },
                {
                  key: "kyc",
                  label: "Gate 2: KYC",
                  align: "center",
                  minWidth: "140px",
                  cell: (tech) => {
                    const kycRecord = findKYCRecord(tech, allKycRecords);
                    const isKycVer = isTechnicianKYCVerified(tech, allKycRecords);
                    const kycStatus =
                      kycRecord?.status?.toLowerCase() ||
                      kycRecord?.verificationStatus?.toLowerCase() ||
                      "pending";
                    return (
                      <Flex justify="center" align="center">
                        <StatusBadge
                          colorScheme={
                            isKycVer
                              ? "green"
                              : kycStatus === "rejected"
                              ? "red"
                              : kycRecord
                              ? "purple"
                              : "gray"
                          }
                          label={
                            isKycVer
                              ? "Verified"
                              : kycStatus === "rejected"
                              ? "Rejected"
                              : kycRecord
                              ? "Under Review"
                              : "Not Uploaded"
                          }
                          variant={isKycVer ? "subtle" : "solid"}
                          cursor="pointer"
                          onClick={() => handleOpenTechnicianDrawer(tech, 1)}
                        />
                      </Flex>
                    );
                  },
                },
                {
                  key: "bank",
                  label: "Gate 3: Bank Payout",
                  align: "center",
                  minWidth: "140px",
                  cell: (tech) => {
                    const kycRecord = findKYCRecord(tech, allKycRecords);
                    const isBankVer = isTechnicianBankVerified(tech, allKycRecords);
                    return (
                      <Flex justify="center" align="center">
                        <StatusBadge
                          colorScheme={isBankVer ? "green" : kycRecord?.bankDetails ? "orange" : "gray"}
                          label={
                            isBankVer
                              ? "Verified"
                              : kycRecord?.bankDetails
                              ? "Pending"
                              : "Not Added"
                          }
                          variant={isBankVer ? "subtle" : "solid"}
                          cursor="pointer"
                          onClick={() => handleOpenTechnicianDrawer(tech, 2)}
                        />
                      </Flex>
                    );
                  },
                },
                {
                  key: "walletBalance",
                  label: "Wallet & Balance",
                  align: "center",
                  minWidth: "140px",
                  cell: (tech) => {
                    const balancePaise = tech.availableBalancePaise != null ? Number(tech.availableBalancePaise) : ((Number(tech.walletBalance) || 0) * 100);
                    const formatted = `₹${(balancePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    const hasDues = (Number(tech.outstandingDuesPaise) || 0) > 0;
                    const isFrozen = tech.payoutBlocked === true;

                    return (
                      <VStack spacing={0.5} align="center" cursor="pointer" onClick={() => handleOpenTechnicianDrawer(tech, 2)}>
                        <HStack spacing={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={balancePaise > 0 ? "teal.700" : "gray.600"}
                          >
                            {formatted}
                          </Text>
                          {isFrozen && (
                            <Tooltip label={`Payouts Frozen: ${tech.payoutBlockedReason || "Administrative hold"}`}>
                              <Badge colorScheme="red" variant="solid" fontSize="3xs" px={1} borderRadius="sm">
                                🔒
                              </Badge>
                            </Tooltip>
                          )}
                        </HStack>
                        {hasDues ? (
                          <Badge colorScheme="orange" fontSize="3xs" px={1.5} borderRadius="full">
                            Dues: ₹{(tech.outstandingDuesPaise / 100).toFixed(0)}
                          </Badge>
                        ) : (
                          <Text fontSize="3xs" color="gray.400">
                            Available
                          </Text>
                        )}
                      </VStack>
                    );
                  },
                },
                {
                  key: "workStatus",
                  label: "Work Status",
                  align: "center",
                  minWidth: "130px",
                  cell: (tech) => (
                    <Flex justify="center" align="center">
                      <StatusBadge
                        colorScheme={
                          tech.workStatus === "approved" || tech.status === "Active"
                            ? "green"
                            : tech.workStatus === "suspended" || tech.status === "Inactive"
                            ? "red"
                            : "yellow"
                        }
                        label={tech.workStatus || tech.status || "Pending"}
                        variant={
                          tech.workStatus === "approved" || tech.status === "Active"
                            ? "subtle"
                            : "solid"
                        }
                      />
                    </Flex>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  minWidth: "115px",
                  thProps: { pr: 6 },
                  cell: (tech) => {
                    const balancePaise = tech.availableBalancePaise != null ? Number(tech.availableBalancePaise) : ((Number(tech.walletBalance) || 0) * 100);
                    const hasActiveBalance = balancePaise > 0 || (Number(tech.reservedBalancePaise) || 0) > 0 || (Number(tech.outstandingDuesPaise) || 0) > 0;

                    return (
                      <HStack spacing={1} justify="flex-end" align="center">
                        <Tooltip label="View Full Profile & Governance">
                          <IconButton
                            size="xs"
                            h="28px"
                            w="28px"
                            aria-label="View Details"
                            icon={<FaEye />}
                            variant="outline"
                            colorScheme="teal"
                            onClick={() => handleOpenTechnicianDrawer(tech, 0)}
                          />
                        </Tooltip>

                        <Tooltip label="View Wallet & Financials">
                          <IconButton
                            size="xs"
                            h="28px"
                            w="28px"
                            aria-label="View Wallet"
                            icon={<FaWallet />}
                            variant="ghost"
                            colorScheme="purple"
                            onClick={() => handleOpenTechnicianDrawer(tech, 2)}
                          />
                        </Tooltip>

                        <Menu>
                          <MenuButton
                            as={IconButton}
                            size="xs"
                            h="28px"
                            w="28px"
                            aria-label="More Options"
                            icon={<FaEllipsisV />}
                            variant="ghost"
                          />
                          <MenuList fontSize="sm">
                            <MenuItem
                              icon={<FaEye color="teal" />}
                              onClick={() => handleOpenTechnicianDrawer(tech, 0)}
                            >
                              View Profile & Governance
                            </MenuItem>
                            <MenuItem
                              icon={<FaWallet color="purple" />}
                              onClick={() => handleOpenTechnicianDrawer(tech, 2)}
                            >
                              View Financials & Payouts
                            </MenuItem>
                            {isOwner && (
                              <>
                                <MenuItem
                                  icon={<FaMoneyBillWave color="green" />}
                                  onClick={() => navigate("/owner/technician-payouts")}
                                >
                                  Go to Payouts Console
                                </MenuItem>
                                <MenuItem
                                  icon={tech.payoutBlocked ? <FaUnlock color="green" /> : <FaLock color="orange" />}
                                  onClick={() => handleTogglePayoutFreeze(tech)}
                                >
                                  {tech.payoutBlocked ? "Unfreeze Payouts" : "Freeze Payouts (Hold)"}
                                </MenuItem>
                                <Divider />
                                <MenuItem
                                  icon={<FaCheck color="green" />}
                                  onClick={() => handleUpdateWorkStatus(tech, "approved")}
                                >
                                  Set Status: Approved
                                </MenuItem>
                                <MenuItem
                                  icon={<MdOutlinePending color="orange" />}
                                  onClick={() => handleUpdateWorkStatus(tech, "pending")}
                                >
                                  Set Status: Pending
                                </MenuItem>
                                <MenuItem
                                  icon={<FaUserSlash color="red" />}
                                  onClick={() => handleUpdateWorkStatus(tech, "suspended")}
                                >
                                  Set Status: Suspended
                                </MenuItem>
                                <Divider />
                                <Tooltip
                                  isDisabled={!hasActiveBalance}
                                  label={`Cannot delete: Technician has active wallet balance (₹${(balancePaise / 100).toFixed(2)})`}
                                >
                                  <Box>
                                    <MenuItem
                                      icon={<FaTrash color="red" />}
                                      color="red.600"
                                      isDisabled={hasActiveBalance}
                                      onClick={() => {
                                        if (hasActiveBalance) {
                                          toast({
                                            title: "Deletion Blocked",
                                            description: `Cannot delete technician with active wallet balance of ₹${(balancePaise / 100).toFixed(2)}. Settle all funds first.`,
                                            status: "error",
                                            duration: 4000,
                                            isClosable: true,
                                          });
                                          return;
                                        }
                                        setAdminToDelete(tech);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      Delete Technician
                                    </MenuItem>
                                  </Box>
                                </Tooltip>
                              </>
                            )}
                          </MenuList>
                        </Menu>
                      </HStack>
                    );
                  },
                },
              ]}
            />
          </CardBody>
        </Card>
      </Box>

      {/* ORPHANED KYC MAINTENANCE (KYC docs with no linked technician) */}
      <Box px={{ base: 2, md: 4 }} pb={4}>
        <Card bg="white" shadow="lg" borderRadius="16px" border="1px solid" borderColor={customBorderColor}>
          <CardHeader p="16px" pb="8px">
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <Box>
                <Heading size="sm" color="gray.800">
                  🧹 Orphaned KYC Records
                </Heading>
              </Box>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="teal"
                  onClick={() => {
                    setOrphanedOpen((v) => !v);
                    if (!orphanedOpen) fetchOrphanedKyc();
                  }}
                >
                  {orphanedOpen ? "Hide" : "Review Orphans"}
                </Button>
                {orphanedOpen && orphanedKyc.length > 0 && (
                  <Button size="xs" colorScheme="red" variant="outline" onClick={handleCleanupAllOrphanedKyc}>
                    Cleanup All
                  </Button>
                )}
              </HStack>
            </Flex>
          </CardHeader>
          {orphanedOpen && (
            <CardBody pt={0}>
              {orphanedLoading ? (
                <Box py={4}>
                  <TableSkeleton rows={3} columns={4} />
                </Box>
              ) : orphanedKyc.length === 0 ? (
                <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                  No orphaned KYC records. Storage is clean.
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>KYC ID</Th>
                        <Th>Name / Identifier</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orphanedKyc.map((k) => (
                        <Tr key={k._id || k.kycId || k.id}>
                          <Td fontSize="xs" fontFamily="mono">{k._id || k.kycId || k.id || "—"}</Td>
                          <Td fontSize="sm">{k.name || k.aadhaarNumber || k.phone || "—"}</Td>
                          <Td fontSize="xs">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}</Td>
                          <Td>
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              leftIcon={<FaTrash />}
                              onClick={() => handleDeleteOrphanedKyc(k._id || k.kycId || k.id)}
                            >
                              Delete
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          )}
        </Card>
      </Box>

      {/* TECHNICIAN 360° PROFILE & ALL-IN-ONE VERIFICATION SLIDE-OVER DRAWER */}
      <TechnicianDetailsDrawer
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        selectedTechnician={selectedTechnician}
        setSelectedTechnician={setSelectedTechnician}
        initialTab={drawerInitialTab}
        allKycRecords={allKycRecords}
        masterDistricts={masterDistricts}
        isOwner={isOwner}
        customColor={customColor}
        getTechnicianName={getTechnicianName}
        getTechnicianImage={getTechnicianImage}
        isTechnicianKYCVerified={isTechnicianKYCVerified}
        isTechnicianBankVerified={isTechnicianBankVerified}
        findKYCRecord={findKYCRecord}
        getTechnicianPhone={getTechnicianPhone}
        getTechnicianEmail={getTechnicianEmail}
        getTechnicianDistrict={getTechnicianDistrict}
        getTechnicianApprovedDistricts={(tech) => getTechnicianApprovedDistricts(tech, masterDistricts)}
        getTechnicianAddress={getTechnicianAddress}
        getTechnicianSpecialization={getTechnicianSpecialization}
        getImageUrl={getImageUrl}
        onDataChanged={fetchData}
      />

      <ConfirmActionModal
        isOpen={isKycDeleteConfirmOpen}
        onClose={() => {
          if (isDeletingKyc) return;
          setIsKycDeleteConfirmOpen(false);
          setKycDeleteError(null);
        }}
        onConfirm={handleConfirmKycDelete}
        title="Delete KYC record"
        description={`This permanently deletes the KYC record for ${getTechnicianName(selectedTechForKYC)}. This action cannot be undone.`}
        confirmText="Delete KYC record"
        confirmColorScheme="red"
        isLoading={isDeletingKyc}
        error={kycDeleteError}
      />

      {/* DELETE CONFIRMATION ALERT */}
      <DeleteTechnicianDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        cancelRef={cancelRef}
        adminToDelete={adminToDelete}
        allKycRecords={allKycRecords}
        getTechnicianName={getTechnicianName}
        onConfirmDelete={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* WORK STATUS PREREQUISITES MODAL */}
      <WorkStatusPrerequisitesModal
        isOpen={isWorkStatusPrereqModalOpen}
        onClose={() => setIsWorkStatusPrereqModalOpen(false)}
        technician={workStatusPrereqTech}
        technicianName={workStatusPrereqTech ? getTechnicianName(workStatusPrereqTech, allKycRecords) : undefined}
        technicianPhone={workStatusPrereqTech ? getTechnicianPhone(workStatusPrereqTech, allKycRecords) : undefined}
        technicianImage={workStatusPrereqTech ? getTechnicianImage(workStatusPrereqTech, allKycRecords) : undefined}
        technicianSpecialization={workStatusPrereqTech ? getTechnicianSpecialization(workStatusPrereqTech) : undefined}
        evaluation={workStatusPrereqEvaluation}
        onCompleteTraining={workStatusPrereqTech ? () => handleToggleTraining(workStatusPrereqTech) : undefined}
        onOpenDrawerTab={(tabKey) => {
          setIsWorkStatusPrereqModalOpen(false);
          if (workStatusPrereqTech) {
            setSelectedTechnician(workStatusPrereqTech);
            setIsDetailsModalOpen(true);
          }
        }}
        onApproveWorkStatus={workStatusPrereqTech ? () => handleUpdateWorkStatus(workStatusPrereqTech, "approved") : undefined}
      />
    </Flex>
  );
}

export default AdminManagement;