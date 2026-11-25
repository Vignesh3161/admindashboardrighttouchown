import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAppToast } from "components/feedback";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  useColorModeValue,
  Heading,
  Text,
  IconButton,
  Avatar,
  Badge,
  VStack,
  HStack,
  Center,
  Select,
  SimpleGrid,
  Tooltip,
} from "@chakra-ui/react";

import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import { MobileCard, MobileCardActions } from "components/common/MobileCard";
import DataTable from "components/common/DataTable";
import RefreshButton from "components/common/RefreshButton";
import StatusBadge from "components/common/StatusBadge";
import { TableSkeleton } from "components/common";
import {
  DeleteUserModal,
  UserStatsCards,
  CustomerDetailsDrawer,
} from "components/UserManagement";

import {
  FaUsers,
  FaSearch,
  FaEye,
  FaTrash,
  FaTimes,
  FaUndo,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  getAllCurrentTechJob,
} from "../utils/axiosInstance";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  isOwnerRole,
  selectRole,
  selectUser,
} from "store/slices/authSlice";
import {
  fetchUsersByRole,
  removeUserRecord,
} from "store/slices/usersSlice";
import { fetchTechnicians as fetchTechniciansShared } from "store/slices/techniciansSlice";
import {
  fetchServiceBookings,
  selectServiceBookings,
} from "store/slices/bookingsSlice";

export const getUserDisplayName = (user) => {
  if (!user) return "Unknown User";

  if (user.fname || user.lname) {
    const name = `${user.fname || "" } ${user.lname || ""}`.trim();
    if (name) return name;
  }
  if (user.profile?.fname || user.profile?.lname) {
    const name = `${user.profile.fname || ""} ${user.profile.lname || ""}`.trim();
    if (name) return name;
  }
  if (user.firstName || user.lastName) {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (name) return name;
  }
  if (user.profile?.firstName || user.profile?.lastName) {
    const name = `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim();
    if (name) return name;
  }
  if (typeof user.name === "string" && user.name.trim()) return user.name.trim();
  if (typeof user.fullName === "string" && user.fullName.trim()) return user.fullName.trim();
  if (typeof user.userName === "string" && user.userName.trim()) return user.userName.trim();
  if (typeof user.username === "string" && user.username.trim()) return user.username.trim();

  if (user.bookings && Array.isArray(user.bookings) && user.bookings.length > 0) {
    const b = user.bookings[0];
    const bName = b.customerName || b.customerId?.fname || b.customerId?.name;
    if (typeof bName === "string" && bName.trim()) return bName.trim();
  }

  const phone =
    user.mobileNumber ||
    user.phone ||
    user.mobile ||
    user.phoneNumber ||
    user.contact ||
    user.profile?.mobileNumber;
  if (phone) return `Customer (${phone})`;

  const id = user._id || user.id;
  if (id) return `Customer #${String(id).slice(-6).toUpperCase()}`;

  return "Unknown User";
};

export const getUserDisplayEmail = (user) => {
  if (!user) return "No email registered";
  if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
  if (typeof user.emailId === "string" && user.emailId.trim()) return user.emailId.trim();
  if (typeof user.profile?.email === "string" && user.profile.email.trim()) return user.profile.email.trim();

  if (user.bookings && Array.isArray(user.bookings) && user.bookings.length > 0) {
    const b = user.bookings[0];
    if (typeof b.customerEmail === "string" && b.customerEmail.trim()) return b.customerEmail.trim();
  }

  return "No email registered";
};

export const getUserDisplayPhone = (user) => {
  if (!user) return "-";
  return (
    user.mobileNumber ||
    user.phone ||
    user.mobile ||
    user.phoneNumber ||
    user.contact ||
    user.profile?.mobileNumber ||
    user.profile?.phone ||
    "-"
  );
};

const UserMobileCard = React.memo(({
  user,
  index,
  customColor,
  onViewDetails,
  onDelete,
  canDelete,
}) => {
  const userName = getUserDisplayName(user);
  const userEmail = getUserDisplayEmail(user);
  const userPhone = getUserDisplayPhone(user);

  return (
    <MobileCard onClick={() => onViewDetails(user)} cursor="pointer">
      <Flex justify="space-between" align="center" mb={2}>
        <HStack spacing={2} minW={0} flex="1">
          <Avatar size="xs" name={userName} src={user.profileImage} bg="teal.600" />
          <Box minW={0}>
            <Text fontWeight="bold" color={customColor} fontSize="sm" noOfLines={1}>
              #{index} {userName}
            </Text>
            <Text fontSize="2xs" color="gray.500" noOfLines={1}>
              {userEmail}
            </Text>
          </Box>
        </HStack>
        <StatusBadge
          colorScheme={user.status?.toLowerCase() === "active" ? "green" : "red"}
          label={user.status || "Active"}
          variant="subtle"
          showDot
        />
      </Flex>

      <HStack spacing={2} mb={2.5} fontSize="2xs" color="gray.600" flexWrap="wrap">
        <Text fontFamily="mono" fontWeight="medium">📞 {userPhone}</Text>
        {user.primaryCity && (
          <Badge colorScheme="teal" variant="subtle" fontSize="3xs" px={1.5} py={0.2} borderRadius="md">
            📍 {user.primaryCity}
          </Badge>
        )}
      </HStack>

      <Flex justify="space-between" align="center" mb={3} p={2} bg="gray.50" borderRadius="md">
        <HStack spacing={2}>
          <Badge colorScheme="blue" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="md">
            {user.bookingCount} {user.bookingCount === 1 ? "Booking" : "Bookings"}
          </Badge>
          {user.hasActiveJob && (
            <Badge colorScheme="purple" fontSize="3xs" px={1.5} py={0.2} borderRadius="full">
              ⚡ Active
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" fontWeight="extrabold" color="teal.700">
          ₹{Number(user.totalSpent || 0).toLocaleString("en-IN")}
        </Text>
      </Flex>

      <MobileCardActions
        actions={[
          { label: "View Customer 360°", icon: <FaEye />, colorScheme: "teal", onClick: () => onViewDetails(user) },
          ...(canDelete
            ? [{ label: "Delete account", icon: <FaTrash />, colorScheme: "red", onClick: () => onDelete(user) }]
            : []),
        ]}
      />
    </MobileCard>
  );
});

export default function UserManagement() {
  const textColor = useColorModeValue("gray.700", "white");
  const toast = useAppToast();
  const dispatch = useAppDispatch();
  const allBookings = useAppSelector(selectServiceBookings);

  // Custom color theme
  const customColor = "#008080";

  // State hooks
  const currentUser = useAppSelector(selectUser);
  const userRole = useAppSelector(selectRole);
  const isOwner = isOwnerRole(userRole);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  // Granular Filter States
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
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [activityFilter, setActivityFilter] = useState("all"); // 'all' | 'active_jobs' | 'completed' | 'no_bookings'
  const [techFilter, setTechFilter] = useState("all"); // 'all' | 'assigned' | 'unassigned'
  const [cityFilter, setCityFilter] = useState("all"); // 'all' | city string
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'name_asc' | 'bookings_desc' | 'spend_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals & Drawer State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const cancelRef = useRef();

  // Global scrollbar styles
  const globalScrollbarStyles = {
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "transparent",
      borderRadius: "3px",
      transition: "background 0.3s ease",
    },
    "&:hover::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
    },
    "&:hover::-webkit-scrollbar-thumb:hover": {
      background: "#94a3b8",
    },
  };

  // Derive available cities from user addresses and bookings
  const availableCities = useMemo(() => {
    const map = new Map();
    (userData || []).forEach((u) => {
      const city = u.primaryCity;
      if (city && typeof city === "string" && city.trim()) {
        const clean = city.trim();
        const key = clean.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([key, count]) => {
        const orig = (userData || []).find((u) => (u.primaryCity || "").toLowerCase() === key)?.primaryCity || key;
        return { key, name: orig, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [userData]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    activityFilter !== "all" ||
    techFilter !== "all" ||
    cityFilter !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setActivityFilter("all");
    setTechFilter("all");
    setCityFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Calculate user statistics
  const stats = useMemo(() => {
    const totalUsers = userData.length;
    let activeUsers = 0;
    let usersWithBookings = 0;
    let totalRevenue = 0;

    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      if (user.status?.toLowerCase() === "active") activeUsers++;
      if ((user.bookingCount || 0) > 0) usersWithBookings++;
      totalRevenue += (user.totalSpent || 0);
    }

    return {
      totalUsers,
      activeUsers,
      usersWithBookings,
      totalRevenue,
    };
  }, [userData]);

  // Memoized filtered and sorted data
  const filteredData = useMemo(() => {
    let list = [...userData];

    // Status Filter
    if (statusFilter === "active") {
      list = list.filter((user) => user.status?.toLowerCase() === "active");
    } else if (statusFilter === "inactive") {
      list = list.filter((user) => user.status?.toLowerCase() !== "active");
    }

    // Activity Filter
    if (activityFilter === "active_jobs") {
      list = list.filter((user) => user.hasActiveJob);
    } else if (activityFilter === "completed") {
      list = list.filter((user) => user.hasCompletedJob);
    } else if (activityFilter === "no_bookings") {
      list = list.filter((user) => (user.bookingCount || 0) === 0);
    }

    // Technician Allocation Filter
    if (techFilter === "assigned") {
      list = list.filter((user) => user.allocatedTechnician !== "None");
    } else if (techFilter === "unassigned") {
      list = list.filter((user) => user.allocatedTechnician === "None");
    }

    // City Filter
    if (cityFilter !== "all") {
      const targetCity = cityFilter.toLowerCase();
      list = list.filter((user) => (user.primaryCity || "").toLowerCase() === targetCity);
    }

    // Omni-Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((user) => {
        const userName = getUserDisplayName(user).toLowerCase();
        const userEmail = getUserDisplayEmail(user).toLowerCase();
        const userPhone = getUserDisplayPhone(user).toLowerCase();
        const rawId = String(user._id || user.id || "").toLowerCase();
        const shortId = rawId.slice(-6);
        const city = (user.primaryCity || "").toLowerCase();

        return (
          userName.includes(term) ||
          userEmail.includes(term) ||
          userPhone.includes(term) ||
          rawId.includes(term) ||
          shortId.includes(term) ||
          city.includes(term)
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name_asc") {
        return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
      }
      if (sortBy === "bookings_desc") {
        return (b.bookingCount || 0) - (a.bookingCount || 0);
      }
      if (sortBy === "spend_desc") {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      // Default: 'newest'
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [userData, statusFilter, activityFilter, techFilter, cityFilter, searchTerm, sortBy]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [usersResult, bookingsResult, techJobsResponse, techniciansResult] = await Promise.all([
        dispatch(fetchUsersByRole({ role: "Customer" })).unwrap().then((r) => r.list),
        dispatch(fetchServiceBookings()).unwrap().then((r) => r.list),
        getAllCurrentTechJob().catch(() => []),
        dispatch(fetchTechniciansShared()).unwrap().then((r) => r.list).catch(() => []),
      ]);

      if (!isMountedRef.current) return;

      const users = Array.isArray(usersResult) ? usersResult : [];
      const bookings = Array.isArray(bookingsResult) ? bookingsResult : [];
      const techJobs = Array.isArray(techJobsResponse.result || techJobsResponse.data || techJobsResponse)
        ? (techJobsResponse.result || techJobsResponse.data || techJobsResponse)
        : [];
      const techList = Array.isArray(techniciansResult) ? techniciansResult : [];

      // Pre-index bookings by customerId
      const bookingsByCustomerId = new Map();
      bookings.forEach((booking) => {
        const customerId = booking.customerId?._id || booking.customerId;
        if (customerId) {
          const list = bookingsByCustomerId.get(customerId) || [];
          list.push(booking);
          bookingsByCustomerId.set(customerId, list);
        }
      });

      // Pre-index technician current jobs by customerId
      const jobByCustomerId = new Map();
      techJobs.forEach((job) => {
        const jobCustId = job.customer?._id || job.customer;
        if (jobCustId && !jobByCustomerId.has(jobCustId)) {
          jobByCustomerId.set(jobCustId, job);
        }
      });

      // Pre-index technicians by _id and userId
      const techById = new Map();
      techList.forEach((tech) => {
        if (tech._id) techById.set(tech._id, tech);
        if (tech.userId) techById.set(tech.userId, tech);
      });

      // Enrich users with indexed lookups
      const usersWithDetails = users.map((user) => {
        const userBookings = bookingsByCustomerId.get(user._id) || [];
        const userJob = jobByCustomerId.get(user._id);

        let technicianName = "None";
        if (userJob) {
          const techId = typeof userJob.technician === "object" ? userJob.technician?._id : userJob.technician;
          const matchedTech = techById.get(techId);
          technicianName =
            matchedTech?.name ||
            (matchedTech?.firstName ? `${matchedTech.firstName} ${matchedTech.lastName || ""}`.trim() : null) ||
            userJob.technicianName ||
            "Allocated";
        }

        // Calculate total spend and job flags
        let totalSpent = 0;
        let hasActiveJob = false;
        let hasCompletedJob = false;
        userBookings.forEach((b) => {
          if (b.paymentStatus === "paid" || b.paymentStatus === "success") {
            totalSpent += (parseFloat(b.paidAmount || b.totalAmount) || 0);
          }
          if (b.status === "pending" || b.status === "confirmed" || b.status === "in-progress") {
            hasActiveJob = true;
          }
          if (b.status === "completed") {
            hasCompletedJob = true;
          }
        });

        // Determine primary city
        let primaryCity = "";
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
          const defAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
          primaryCity = defAddr?.city || defAddr?.state || "";
        }
        if (!primaryCity && userBookings.length > 0) {
          const firstWithCity = userBookings.find((b) => b.address?.city);
          primaryCity = firstWithCity?.address?.city || "";
        }

        return {
          ...user,
          bookingCount: user.jobStats?.service?.total ?? userBookings.length,
          allocatedTechnician: technicianName,
          bookings: userBookings,
          totalSpent,
          primaryCity: primaryCity.trim(),
          hasActiveJob,
          hasCompletedJob,
        };
      });

      setUserData(usersWithDetails);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Fetch error:", err);
      toast.error(err, { title: "Fetch Error", description: "Failed to load user data.", duration: 3000, isClosable: true });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentUser, dispatch, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Drawer / Modal handlers
  const handleOpenUserDrawer = (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (user) => {
    if (!isOwner) return;
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (!isOwner) {
      toast({
        title: "Owner access required",
        description: "Only Owner accounts can delete users.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      closeDeleteModal();
      return;
    }

    setDeleteLoading(true);
    try {
      await dispatch(
        removeUserRecord({ id: userToDelete._id, role: userToDelete.role || "Customer" })
      ).unwrap();

      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchData();
      closeDeleteModal();
    } catch (err) {
      toast.error(err, { title: "Delete Error", description: "Failed to delete user.", duration: 3000, isClosable: true });
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
    setDeleteLoading(false);
  };

  if (!currentUser) return null;

  return (
    <Flex
      flexDirection="column"
      pt={0}
      minH="100%"
      w="100%"
      css={globalScrollbarStyles}
    >
      {/* 1. Metric Overview Cards (Decoupled from filters) */}
      <Box
        position={{ base: "static", md: "sticky" }}
        top={{ base: "0", md: "64px" }}
        zIndex="900"
        bg="gray.50"
        flexShrink={0}
        p={{ base: 1, md: 4 }}
        pt={{ base: 1, md: 2 }}
        pb={{ base: 2, md: 3 }}
      >
        <UserStatsCards
          stats={stats}
          isLoading={isLoading}
          customColor={customColor}
          textColor={textColor}
        />
      </Box>

      {/* 2. Customer Data Table & Multi-Dimensional Filter Toolbar */}
      <Box display="flex" flexDirection="column" p={4} pt={0} flex="1" overflow="hidden">
        <Card
          shadow="lg"
          bg="white"
          display="flex"
          flexDirection="column"
          maxH="100%"
          overflow="hidden"
        >
          {/* Header & Comprehensive Filter Grid */}
          <CardHeader
            p="12px 16px"
            pb="10px"
            bg="white"
            flexShrink={0}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Flex
              justify="space-between"
              align={{ base: "flex-start", md: "center" }}
              mb={2.5}
              flexWrap="wrap"
              gap={2}
            >
              <HStack spacing={2}>
                <Heading size="sm" color="gray.800">
                  👥 Customer Accounts
                </Heading>
                <Badge colorScheme="teal" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="full">
                  {filteredData.length} {filteredData.length === 1 ? "Customer" : "Customers"}
                  {filteredData.length !== userData.length ? ` (of ${userData.length})` : ""}
                </Badge>
              </HStack>

              <HStack spacing={2}>
                {hasActiveFilters && (
                  <Button
                    size="xs"
                    leftIcon={<FaUndo />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={handleResetFilters}
                    fontSize="xs"
                  >
                    Reset Filters
                  </Button>
                )}
                <RefreshButton
                  iconOnly
                  size="sm"
                  isLoading={isLoading}
                  onClick={fetchData}
                  aria-label="Refresh users and bookings"
                  color={customColor}
                  borderColor={`${customColor}50`}
                  _hover={{ bg: `${customColor}10`, borderColor: customColor }}
                />
              </HStack>
            </Flex>

            {/* Granular Filter Toolbar Grid */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={2.5} w="100%">
              {/* 1. Omni-Search */}
              <Box position="relative">
                <Input
                  placeholder="Search name, phone, email, #ID, city..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  size="sm"
                  h="34px"
                  pr={searchTerm ? "55px" : "28px"}
                  fontSize="xs"
                  borderRadius="8px"
                  borderColor={searchTerm ? customColor : "gray.200"}
                  bg={searchTerm ? `${customColor}08` : "white"}
                  _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                />
                <Icon as={FaSearch} color="gray.400" boxSize={3} position="absolute" right={3} top="11px" />
                {searchTerm && (
                  <IconButton
                    size="xs"
                    icon={<FaTimes />}
                    aria-label="Clear search"
                    position="absolute"
                    right="26px"
                    top="6px"
                    h="22px"
                    minW="22px"
                    variant="ghost"
                    onClick={handleClearSearch}
                  />
                )}
              </Box>

              {/* 2. Account Status */}
              <Select
                size="sm"
                h="34px"
                fontSize="xs"
                borderRadius="8px"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderColor={statusFilter !== "all" ? customColor : "gray.200"}
                bg={statusFilter !== "all" ? `${customColor}10` : "white"}
                fontWeight={statusFilter !== "all" ? "bold" : "normal"}
                color={statusFilter !== "all" ? customColor : "gray.700"}
              >
                <option value="all">⚡ Status: All</option>
                <option value="active">✅ Active Accounts</option>
                <option value="inactive">🚫 Inactive / Suspended</option>
              </Select>

              {/* 3. Service Activity */}
              <Select
                size="sm"
                h="34px"
                fontSize="xs"
                borderRadius="8px"
                value={activityFilter}
                onChange={(e) => {
                  setActivityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderColor={activityFilter !== "all" ? customColor : "gray.200"}
                bg={activityFilter !== "all" ? `${customColor}10` : "white"}
                fontWeight={activityFilter !== "all" ? "bold" : "normal"}
                color={activityFilter !== "all" ? customColor : "gray.700"}
              >
                <option value="all">📅 Orders: All</option>
                <option value="active_jobs">⚡ Has Active Orders</option>
                <option value="completed">✅ Completed Orders</option>
                <option value="no_bookings">⚪ Zero Bookings</option>
              </Select>

              {/* 4. Technician Allocation */}
              <Select
                size="sm"
                h="34px"
                fontSize="xs"
                borderRadius="8px"
                value={techFilter}
                onChange={(e) => {
                  setTechFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderColor={techFilter !== "all" ? customColor : "gray.200"}
                bg={techFilter !== "all" ? `${customColor}10` : "white"}
                fontWeight={techFilter !== "all" ? "bold" : "normal"}
                color={techFilter !== "all" ? customColor : "gray.700"}
              >
                <option value="all">🛠️ Tech: All</option>
                <option value="assigned">👤 Tech Assigned</option>
                <option value="unassigned">⚪ Unassigned / Pool</option>
              </Select>

              {/* 5. City Filter */}
              <Select
                size="sm"
                h="34px"
                fontSize="xs"
                borderRadius="8px"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderColor={cityFilter !== "all" ? customColor : "gray.200"}
                bg={cityFilter !== "all" ? `${customColor}10` : "white"}
                fontWeight={cityFilter !== "all" ? "bold" : "normal"}
                color={cityFilter !== "all" ? customColor : "gray.700"}
              >
                <option value="all">📍 City: All ({availableCities.length})</option>
                {availableCities.map((c) => (
                  <option key={c.key} value={c.name}>
                    📍 {c.name} ({c.count})
                  </option>
                ))}
              </Select>

              {/* 6. Sorting Filter */}
              <Select
                size="sm"
                h="34px"
                fontSize="xs"
                borderRadius="8px"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                borderColor={sortBy !== "newest" ? customColor : "gray.200"}
                bg={sortBy !== "newest" ? `${customColor}10` : "white"}
                fontWeight={sortBy !== "newest" ? "bold" : "normal"}
                color={sortBy !== "newest" ? customColor : "gray.700"}
              >
                <option value="newest">↕️ Sort: Newest First</option>
                <option value="name_asc">↕️ Name (A to Z)</option>
                <option value="bookings_desc">↕️ Most Bookings</option>
                <option value="spend_desc">↕️ Highest Spend (LTV)</option>
              </Select>
            </SimpleGrid>
          </CardHeader>

          {/* Table Body Area */}
          <CardBody bg="white" display="flex" flexDirection="column" p={0} overflow="hidden">
            {isLoading ? (
              <Box p={4} flex="1">
                <TableSkeleton rows={8} columns={7} />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" overflow="hidden">
                {/* Desktop Data Table */}
                <Box display={{ base: "none", md: "block" }} flex={1} minH={0}>
                  <DataTable
                    showIndex
                    keyExtractor={(user, i) => user._id || `user-${i}`}
                    rows={currentItems}
                    onRowClick={(user) => handleOpenUserDrawer(user)}
                    emptyTitle={userData.length === 0 ? "No customers registered" : "No customers match the selected filters"}
                    emptyDescription="Try adjusting your search query, city, or status filter."
                    pagination={
                      filteredData.length > 0
                        ? {
                            page: currentPage,
                            totalPages: totalPages || 1,
                            totalRows: filteredData.length,
                            rowsPerPage: itemsPerPage,
                            onPageChange: setCurrentPage,
                            showRowsPerPage: true,
                            rowsPerPageOptions: [10, 25, 50],
                            onRowsPerPageChange: (newLimit) => {
                              setItemsPerPage(newLimit);
                              setCurrentPage(1);
                            },
                            label: "customers",
                          }
                        : undefined
                    }
                    columns={[
                      {
                        key: "user",
                        label: "Customer",
                        minWidth: "220px",
                        cell: (user) => {
                          const shortId = user._id ? String(user._id).slice(-6).toUpperCase() : "";
                          return (
                            <Flex align="center" gap={2.5}>
                              <Avatar size="sm" name={getUserDisplayName(user)} src={user.profileImage} bg="teal.600" />
                              <Box minW={0}>
                                <HStack spacing={1.5} align="center">
                                  <Text fontWeight="bold" color="gray.800" fontSize="xs" isTruncated maxW="150px">
                                    {getUserDisplayName(user)}
                                  </Text>
                                  {shortId && (
                                    <Badge fontFamily="mono" fontSize="3xs" px={1} py={0.2} borderRadius="sm" colorScheme="gray">
                                      #{shortId}
                                    </Badge>
                                  )}
                                </HStack>
                                <Text fontSize="2xs" color="gray.500" isTruncated maxW="180px">
                                  {getUserDisplayEmail(user)}
                                </Text>
                              </Box>
                            </Flex>
                          );
                        },
                      },
                      {
                        key: "contact",
                        label: "Contact & City",
                        minWidth: "170px",
                        cell: (user) => {
                          const phone = getUserDisplayPhone(user);
                          const city = user.primaryCity;
                          return (
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color="gray.800" fontFamily="mono">
                                {phone}
                              </Text>
                              {city ? (
                                <Badge colorScheme="teal" variant="subtle" fontSize="3xs" px={1.5} py={0.2} borderRadius="md" mt={0.5}>
                                  📍 {city}
                                </Badge>
                              ) : (
                                <Text fontSize="3xs" color="gray.400" mt={0.5}>
                                  No city registered
                                </Text>
                              )}
                            </Box>
                          );
                        },
                      },
                      {
                        key: "status",
                        label: "Status",
                        align: "center",
                        width: "110px",
                        cell: (user) => (
                          <StatusBadge
                            colorScheme={user.status?.toLowerCase() === "active" ? "green" : "red"}
                            label={user.status || "Active"}
                            variant="subtle"
                            showDot
                          />
                        ),
                      },
                      {
                        key: "bookingCount",
                        label: "Orders / Bookings",
                        align: "center",
                        minWidth: "140px",
                        cell: (user) => (
                          <VStack spacing={0.5} align="center">
                            <Badge colorScheme="blue" variant="subtle" fontSize="xs" fontWeight="bold" px={2} py={0.5} borderRadius="md">
                              {user.bookingCount || 0} {user.bookingCount === 1 ? "Booking" : "Bookings"}
                            </Badge>
                            {user.hasActiveJob && (
                              <Badge colorScheme="purple" fontSize="3xs" px={1.5} py={0.2} borderRadius="full">
                                ⚡ Active Order
                              </Badge>
                            )}
                          </VStack>
                        ),
                      },
                      {
                        key: "totalSpent",
                        label: "Lifetime Spend",
                        align: "right",
                        minWidth: "130px",
                        cell: (user) => (
                          <Text fontWeight="extrabold" fontSize="xs" color="teal.700">
                            ₹{Number(user.totalSpent || 0).toLocaleString("en-IN")}
                          </Text>
                        ),
                      },
                      {
                        key: "createdAt",
                        label: "Member Since",
                        minWidth: "120px",
                        cell: (user) => (
                          <HStack spacing={1} fontSize="xs" color="gray.600">
                            <FaCalendarAlt size="10px" color="#94a3b8" />
                            <Text>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </Text>
                          </HStack>
                        ),
                      },
                      {
                        key: "actions",
                        label: "Actions",
                        align: "right",
                        width: "110px",
                        thProps: { pr: 4 },
                        cell: (user) => (
                          <Flex gap={1.5} justify="flex-end" align="center">
                            <Tooltip label="View Customer 360° Dossier" fontSize="2xs">
                              <IconButton
                                aria-label="View 360 profile"
                                icon={<FaEye />}
                                size="xs"
                                colorScheme="teal"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenUserDrawer(user);
                                }}
                              />
                            </Tooltip>
                            {isOwner && (
                              <Tooltip label="Delete Customer Account" fontSize="2xs">
                                <IconButton
                                  aria-label="Delete user"
                                  icon={<FaTrash />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(user);
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Flex>
                        ),
                      },
                    ]}
                  />
                </Box>

                {/* Mobile Card View */}
                <Box
                  display={{ base: "block", md: "none" }}
                  overflow="auto"
                  px={3}
                  py={1.5}
                  css={globalScrollbarStyles}
                >
                  {currentItems.length > 0 ? (
                    currentItems.map((user, idx) => (
                      <UserMobileCard
                        key={user._id || idx}
                        user={user}
                        index={indexOfFirstItem + idx + 1}
                        customColor={customColor}
                        onViewDetails={handleOpenUserDrawer}
                        onDelete={handleDeleteClick}
                        canDelete={isOwner}
                      />
                    ))
                  ) : (
                    <Center py={10}>
                      <VStack spacing={2}>
                        <Icon as={FaUsers} color="gray.300" boxSize={10} />
                        <Text fontSize="sm" color="gray.500">No customers match your search</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* Unified Customer 360° Dossier Slide-Over Drawer */}
      <CustomerDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedUser={selectedUser}
        allBookings={allBookings}
        isOwner={isOwner}
        onDeleteClick={handleDeleteClick}
        customColor={customColor}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserModal
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteModal}
        userToDelete={userToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        cancelRef={cancelRef}
        customColor={customColor}
      />
    </Flex>
  );
}
