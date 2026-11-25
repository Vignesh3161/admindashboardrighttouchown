import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Flex,
  Text,
  Box,
  Icon,
  Kbd,
  Badge,
  Spinner,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";
import {
  MdDashboard,
  MdInventory2,
  MdHomeRepairService,
  MdPeople,
  MdLocationCity,
  MdCalendarMonth,
  MdAccountBalanceWallet,
  MdPayments,
  MdPercent,
  MdReportProblem,
  MdStar,
  MdCardGiftcard,
  MdEngineering,
  MdPerson,
  MdShield,
  MdArrowForward,
} from "react-icons/md";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  fetchTechnicians,
  selectTechnicians,
} from "store/slices/techniciansSlice";
import {
  fetchUsersByRole,
  selectUsersByRole,
} from "store/slices/usersSlice";
import {
  fetchProducts,
  fetchServices,
  selectProducts,
  selectServices,
} from "store/slices/referenceSlice";
import {
  fetchServiceBookings,
  selectServiceBookings,
} from "store/slices/bookingsSlice";
import { getAllTechnicians } from "api/technicians";

const NAVIGATION_ITEMS = [
  { label: "Dashboard", category: "Operations", path: "/owner/dashboard", icon: MdDashboard },
  { label: "Scheduling & Dispatch", category: "Operations", path: "/owner/scheduling-ops", icon: MdCalendarMonth },
  { label: "Technician Management", category: "People", path: "/owner/admin-management", icon: MdEngineering },
  { label: "User Management", category: "People", path: "/owner/user-management", icon: MdPeople },
  { label: "Product Management", category: "Catalog", path: "/owner/product-management", icon: MdInventory2 },
  { label: "Service Management", category: "Catalog", path: "/owner/service-management", icon: MdHomeRepairService },
  { label: "City Zone & Geofencing", category: "Configuration", path: "/owner/city-zones", icon: MdLocationCity },
  { label: "Finance Tracking", category: "Finance", path: "/owner/finance-tracking", icon: MdAccountBalanceWallet },
  { label: "Pay to Technician", category: "Finance", path: "/owner/technician-payouts", icon: MdPayments },
  { label: "Commission Management", category: "Finance", path: "/owner/commission-management", icon: MdPercent },
  { label: "Complaint Management", category: "Operations", path: "/owner/complaints", icon: MdReportProblem },
  { label: "Ratings & Reviews", category: "Operations", path: "/owner/reports-ratings", icon: MdStar },
  { label: "Rewards & Loyalty", category: "Configuration", path: "/owner/rewards", icon: MdCardGiftcard },
  { label: "Credentials Management", category: "Configuration", path: "/owner/credentials", icon: MdShield },
  { label: "My Profile & Security", category: "Configuration", path: "/owner/profile", icon: MdPerson },
];

// Robust technician name extractor
const getTechnicianName = (tech) => {
  if (!tech) return "";
  const name =
    tech.name ||
    tech.fullName ||
    tech.technicianName ||
    (tech.firstName ? `${tech.firstName} ${tech.lastName || ""}`.trim() : "") ||
    (tech.fname ? `${tech.fname} ${tech.lname || ""}`.trim() : "") ||
    tech.profile?.name ||
    tech.profile?.fullName ||
    (tech.profile?.firstName ? `${tech.profile.firstName} ${tech.profile.lastName || ""}`.trim() : "") ||
    tech.user?.name ||
    tech.user?.fullName ||
    tech.userId?.name ||
    tech.userId?.fullName ||
    "";
  if (name.startsWith("deleted_") || name.includes("example.invalid")) return "Deleted Technician";
  return name.trim();
};

const getTechnicianPhone = (tech) => {
  if (!tech) return "";
  return (
    tech.phone ||
    tech.mobileNumber ||
    tech.mobile ||
    tech.identifier ||
    tech.profile?.phone ||
    tech.profile?.mobileNumber ||
    tech.user?.mobileNumber ||
    tech.user?.phone ||
    tech.userId?.mobileNumber ||
    ""
  ).toString().trim();
};

const getTechnicianDistrict = (tech) => {
  if (!tech) return "";
  if (tech.district && typeof tech.district === "string") return tech.district;
  if (tech.districtName && typeof tech.districtName === "string") return tech.districtName;
  if (tech.city && typeof tech.city === "string") return tech.city;
  if (Array.isArray(tech.approvedDistricts) && tech.approvedDistricts.length > 0) {
    const first = tech.approvedDistricts[0];
    return typeof first === "string" ? first : first.name || "";
  }
  return "";
};

const getCustomerName = (cust) => {
  if (!cust) return "";
  const name =
    cust.name ||
    cust.fullName ||
    (cust.fname ? `${cust.fname} ${cust.lname || ""}`.trim() : "") ||
    cust.identifier ||
    "";
  return name.trim();
};

const getCustomerPhone = (cust) => {
  if (!cust) return "";
  return (
    cust.mobileNumber ||
    cust.phone ||
    cust.identifier ||
    ""
  ).toString().trim();
};

const getCustomerCity = (cust) => {
  if (!cust) return "";
  return cust.primaryCity || cust.city || cust.address?.city || "";
};

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [fallbackTechs, setFallbackTechs] = useState([]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const listRef = useRef(null);

  // Redux data selectors
  const reduxTechs = useAppSelector(selectTechnicians) || [];
  const customers = useAppSelector(selectUsersByRole("Customer")) || [];
  const products = useAppSelector(selectProducts) || [];
  const services = useAppSelector(selectServices) || [];
  const bookings = useAppSelector(selectServiceBookings) || [];

  // Effective technicians combining Redux and direct API fallback
  const technicians = useMemo(() => {
    return reduxTechs.length > 0 ? reduxTechs : fallbackTechs;
  }, [reduxTechs, fallbackTechs]);

  // Load all system entity data when the palette is opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);

      const loadData = async () => {
        setIsDataLoading(true);
        try {
          await Promise.allSettled([
            dispatch(fetchTechnicians()).unwrap().catch(async () => {
              // Direct fallback if Redux action encounters issues
              const res = await getAllTechnicians();
              const list = res?.data?.admins || res?.data?.technicians || res?.data || res?.result || [];
              if (Array.isArray(list) && list.length > 0) setFallbackTechs(list);
            }),
            dispatch(fetchUsersByRole({ role: "Customer" })),
            dispatch(fetchProducts()),
            dispatch(fetchServices()),
            dispatch(fetchServiceBookings()),
          ]);
        } finally {
          setIsDataLoading(false);
        }
      };

      loadData();
    }
  }, [isOpen, dispatch]);

  const bg = useColorModeValue("white", "#1E293B");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("teal.50", "rgba(15, 118, 110, 0.2)");
  const itemTextColor = useColorModeValue("gray.800", "white");
  const footerBg = useColorModeValue("gray.50", "#0F172A");

  // Filter & Search Engine across all entities
  const groupedResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. If empty query: return frequent navigation pages
    if (!q) {
      const topPages = NAVIGATION_ITEMS.slice(0, 8).map((item) => ({
        id: `page-${item.path}`,
        title: item.label,
        subtitle: `${item.category} Module`,
        category: "Navigation",
        badge: "Page",
        badgeColor: "gray",
        icon: item.icon,
        path: item.path,
      }));
      return [{ category: "Quick Navigation", items: topPages }];
    }

    const sections = [];

    // 2. Technicians Match (Searching Name, Phone, Email, Location)
    const matchedTechs = technicians
      .filter((tech) => {
        const name = getTechnicianName(tech).toLowerCase();
        const phone = getTechnicianPhone(tech).toLowerCase();
        const dist = getTechnicianDistrict(tech).toLowerCase();
        const email = (tech.email || tech.profile?.email || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          dist.includes(q) ||
          email.includes(q)
        );
      })
      .slice(0, 6)
      .map((tech) => {
        const name = getTechnicianName(tech);
        const phone = getTechnicianPhone(tech);
        const dist = getTechnicianDistrict(tech);
        const details = [
          phone ? `Phone: ${phone}` : "",
          dist ? `Location: ${dist}` : "",
          tech.isVerified ? "Verified" : "",
        ]
          .filter(Boolean)
          .join(" • ");

        return {
          id: `tech-${tech._id || name}`,
          title: name,
          subtitle: details || "Technician Profile",
          category: "Technicians",
          badge: "Technician",
          badgeColor: "teal",
          icon: MdEngineering,
          path: `/owner/admin-management?search=${encodeURIComponent(name || phone)}`,
        };
      });

    if (matchedTechs.length > 0) {
      sections.push({ category: "Technicians", items: matchedTechs });
    }

    // 3. Customers Match (Searching Name, Phone, Email, City)
    const matchedCustomers = customers
      .filter((cust) => {
        const name = getCustomerName(cust).toLowerCase();
        const phone = getCustomerPhone(cust).toLowerCase();
        const email = (cust.email || "").toLowerCase();
        const city = getCustomerCity(cust).toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          city.includes(q)
        );
      })
      .slice(0, 5)
      .map((cust) => {
        const name = getCustomerName(cust);
        const phone = getCustomerPhone(cust);
        const city = getCustomerCity(cust);
        const details = [
          phone ? `Phone: ${phone}` : "",
          city ? `City: ${city}` : "",
          cust.email || "",
        ]
          .filter(Boolean)
          .join(" • ");

        return {
          id: `cust-${cust._id || name}`,
          title: name,
          subtitle: details || "Customer Account",
          category: "Customers",
          badge: "Customer",
          badgeColor: "blue",
          icon: MdPeople,
          path: `/owner/user-management?search=${encodeURIComponent(name || phone)}`,
        };
      });

    if (matchedCustomers.length > 0) {
      sections.push({ category: "Customers", items: matchedCustomers });
    }

    // 4. Products & Services Match
    const matchedProducts = products
      .filter((prod) => {
        const name = (prod.name || prod.title || "").toLowerCase();
        const cat = (prod.category || "").toLowerCase();
        const brand = (prod.brand || "").toLowerCase();
        return name.includes(q) || cat.includes(q) || brand.includes(q);
      })
      .slice(0, 4)
      .map((prod) => {
        const name = prod.name || prod.title || "Product";
        const price = prod.discountedPrice || prod.price;
        return {
          id: `prod-${prod._id || name}`,
          title: name,
          subtitle: [
            prod.category ? `Category: ${prod.category}` : "",
            price ? `Price: ₹${price}` : "",
          ]
            .filter(Boolean)
            .join(" • "),
          category: "Products",
          badge: "Product",
          badgeColor: "purple",
          icon: MdInventory2,
          path: `/owner/product-management?search=${encodeURIComponent(name)}`,
        };
      });

    const matchedServices = services
      .filter((svc) => {
        const name = (svc.name || svc.serviceName || svc.title || "").toLowerCase();
        const cat = (svc.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .slice(0, 4)
      .map((svc) => {
        const name = svc.name || svc.serviceName || svc.title || "Service";
        return {
          id: `svc-${svc._id || name}`,
          title: name,
          subtitle: [
            svc.category ? `Category: ${svc.category}` : "",
            svc.price ? `₹${svc.price}` : "",
          ]
            .filter(Boolean)
            .join(" • "),
          category: "Services",
          badge: "Service",
          badgeColor: "cyan",
          icon: MdHomeRepairService,
          path: `/owner/service-management?search=${encodeURIComponent(name)}`,
        };
      });

    const catalogItems = [...matchedProducts, ...matchedServices];
    if (catalogItems.length > 0) {
      sections.push({ category: "Catalog & Services", items: catalogItems });
    }

    // 5. Bookings Match
    const matchedBookings = bookings
      .filter((b) => {
        const bId = (b.bookingId || b.id || b._id || "").toString().toLowerCase();
        const cName = (b.customer?.name || b.customerName || "").toLowerCase();
        const sName = (b.service?.name || b.serviceName || "").toLowerCase();
        return bId.includes(q) || cName.includes(q) || sName.includes(q);
      })
      .slice(0, 4)
      .map((b) => {
        const bId = b.bookingId || b.id || b._id?.slice(-6) || "Booking";
        return {
          id: `book-${b._id || bId}`,
          title: `Booking #${bId}`,
          subtitle: [
            b.customerName || b.customer?.name || "",
            b.serviceName || b.service?.name || "",
            b.status || "",
          ]
            .filter(Boolean)
            .join(" • "),
          category: "Bookings",
          badge: "Booking",
          badgeColor: "green",
          icon: MdCalendarMonth,
          path: `/owner/scheduling-ops?search=${encodeURIComponent(bId)}`,
        };
      });

    if (matchedBookings.length > 0) {
      sections.push({ category: "Bookings", items: matchedBookings });
    }

    // 6. Navigation Pages Match
    const matchedPages = NAVIGATION_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).map((item) => ({
      id: `page-${item.path}`,
      title: item.label,
      subtitle: `${item.category} Module`,
      category: "Pages",
      badge: "Page",
      badgeColor: "gray",
      icon: item.icon,
      path: item.path,
    }));

    if (matchedPages.length > 0) {
      sections.push({ category: "Navigation", items: matchedPages });
    }

    // 7. Quick Filter Actions (Always offered for dynamic direct jump)
    const quickActions = [
      {
        id: `act-tech-${q}`,
        title: `Search "${query}" in Technician Management`,
        subtitle: "Jump to Technician Management filtered to this query",
        category: "Quick Actions",
        badge: "Filter",
        badgeColor: "teal",
        icon: FaSearch,
        path: `/owner/admin-management?search=${encodeURIComponent(query)}`,
      },
      {
        id: `act-cust-${q}`,
        title: `Search "${query}" in Customer Accounts`,
        subtitle: "Jump to User Management filtered to this query",
        category: "Quick Actions",
        badge: "Filter",
        badgeColor: "blue",
        icon: FaSearch,
        path: `/owner/user-management?search=${encodeURIComponent(query)}`,
      },
      {
        id: `act-catalog-${q}`,
        title: `Search "${query}" in Product Catalog`,
        subtitle: "Jump to Product Management filtered to this query",
        category: "Quick Actions",
        badge: "Filter",
        badgeColor: "purple",
        icon: FaSearch,
        path: `/owner/product-management?search=${encodeURIComponent(query)}`,
      },
      {
        id: `act-booking-${q}`,
        title: `Search "${query}" in Scheduling & Dispatch`,
        subtitle: "Jump to Scheduling Ops filtered to this query",
        category: "Quick Actions",
        badge: "Filter",
        badgeColor: "green",
        icon: FaSearch,
        path: `/owner/scheduling-ops?search=${encodeURIComponent(query)}`,
      },
    ];

    sections.push({ category: "Quick Actions", items: quickActions });

    return sections;
  }, [query, technicians, customers, products, services, bookings]);

  // Flattened list for keyboard traversal
  const flattenedItems = useMemo(() => {
    return groupedResults.reduce((acc, section) => acc.concat(section.items), []);
  }, [groupedResults]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        flattenedItems.length > 0 ? (prev + 1) % flattenedItems.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        flattenedItems.length > 0
          ? (prev - 1 + flattenedItems.length) % flattenedItems.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flattenedItems[selectedIndex]) {
        handleSelect(flattenedItems[selectedIndex].path);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let globalItemIndex = -1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent
        bg={bg}
        borderRadius="16px"
        overflow="hidden"
        boxShadow="0 20px 45px rgba(0, 0, 0, 0.25)"
        mt="12vh"
        maxW="680px"
      >
        <ModalBody p={0}>
          {/* Top Search Bar */}
          <Box p={3.5} borderBottom="1px solid" borderColor={borderColor}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="#0F766E" boxSize={4} />
              </InputLeftElement>
              <Input
                autoFocus
                variant="unstyled"
                placeholder="Search technicians, customers, products, bookings, or pages..."
                fontSize="sm"
                fontWeight="500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                pr="70px"
              />
              <InputRightElement width="70px">
                <HStack spacing={1.5}>
                  {isDataLoading && <Spinner size="xs" color="teal.500" />}
                  {query && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<FaTimes />}
                      aria-label="Clear query"
                      onClick={() => setQuery("")}
                    />
                  )}
                  <Kbd fontSize="2xs" px={1.5} py={0.5}>
                    ESC
                  </Kbd>
                </HStack>
              </InputRightElement>
            </InputGroup>
          </Box>

          {/* Results List */}
          <Box maxH="420px" overflowY="auto" p={3} ref={listRef}>
            {groupedResults.length === 0 || flattenedItems.length === 0 ? (
              <Box py={10} textAlign="center">
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  No matching results for "{query}"
                </Text>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Try searching by full name, phone number, city, or product title.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={3}>
                {groupedResults.map((section) => (
                  <Box key={section.category}>
                    <Flex align="center" justify="space-between" px={2} mb={1}>
                      <Text
                        fontSize="2xs"
                        fontWeight="800"
                        color="gray.400"
                        letterSpacing="0.06em"
                        textTransform="uppercase"
                      >
                        {section.category}
                      </Text>
                      <Badge
                        fontSize="3xs"
                        borderRadius="full"
                        px={1.5}
                        py={0.2}
                        colorScheme="gray"
                      >
                        {section.items.length}
                      </Badge>
                    </Flex>

                    <VStack align="stretch" spacing={1}>
                      {section.items.map((item) => {
                        globalItemIndex += 1;
                        const currentIndex = globalItemIndex;
                        const isSelected = currentIndex === selectedIndex;

                        return (
                          <Flex
                            key={item.id}
                            align="center"
                            justify="space-between"
                            px={3}
                            py={2.5}
                            borderRadius="10px"
                            cursor="pointer"
                            bg={isSelected ? hoverBg : "transparent"}
                            border="1px solid"
                            borderColor={isSelected ? "teal.200" : "transparent"}
                            onClick={() => handleSelect(item.path)}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            transition="all 0.1s ease"
                          >
                            <HStack spacing={3} maxW="80%">
                              <Flex
                                boxSize="34px"
                                borderRadius="9px"
                                bg={isSelected ? "teal.500" : "teal.50"}
                                color={isSelected ? "white" : "#0F766E"}
                                align="center"
                                justify="center"
                                flexShrink={0}
                                transition="all 0.15s ease"
                              >
                                <Icon as={item.icon} boxSize={4} />
                              </Flex>
                              <Box overflow="hidden">
                                <Text
                                  fontSize="xs"
                                  fontWeight={isSelected ? "800" : "700"}
                                  color={itemTextColor}
                                  noOfLines={1}
                                >
                                  {item.title}
                                </Text>
                                <Text fontSize="2xs" color="gray.500" noOfLines={1} mt={0.5}>
                                  {item.subtitle}
                                </Text>
                              </Box>
                            </HStack>

                            <HStack spacing={2} flexShrink={0}>
                              <Badge
                                colorScheme={item.badgeColor || "gray"}
                                fontSize="3xs"
                                px={2}
                                py={0.5}
                                borderRadius="full"
                              >
                                {item.badge}
                              </Badge>

                              {isSelected ? (
                                <HStack spacing={1}>
                                  <Kbd fontSize="3xs" bg="teal.100" color="teal.800" border="none">
                                    ↵ Enter
                                  </Kbd>
                                </HStack>
                              ) : (
                                <Icon as={MdArrowForward} color="gray.300" boxSize={3.5} />
                              )}
                            </HStack>
                          </Flex>
                        );
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Dynamic Footer with Live Key Hints and Counter */}
          <Flex
            px={4}
            py={2.5}
            bg={footerBg}
            borderTop="1px solid"
            borderColor={borderColor}
            justify="space-between"
            align="center"
            fontSize="2xs"
            color="gray.500"
          >
            <HStack spacing={3}>
              <HStack spacing={1}>
                <Kbd fontSize="3xs">↑</Kbd>
                <Kbd fontSize="3xs">↓</Kbd>
                <Text>navigate</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd fontSize="3xs">↵</Kbd>
                <Text>select</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd fontSize="3xs">ESC</Kbd>
                <Text>close</Text>
              </HStack>
            </HStack>

            <HStack spacing={2}>
              {query && (
                <Text color="teal.600" fontWeight="700">
                  {flattenedItems.length} {flattenedItems.length === 1 ? "result" : "results"}
                </Text>
              )}
              {!query && (
                <Text color="gray.400">
                  Search technicians, customers, catalog & bookings
                </Text>
              )}
            </HStack>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
