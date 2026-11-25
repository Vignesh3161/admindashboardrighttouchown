import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Image,
  Icon,
  Tooltip,
  IconButton,
  Badge,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useColorModeValue,
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdChevronLeft,
  MdChevronRight,
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
} from "react-icons/md";
import FlareLogo from "assets/img/Right_Touch.png";
import { useAdminNotificationCounts } from "hooks/useAdminNotificationCounts";

const SIDEBAR_GROUPS = [
  {
    title: "Operations",
    items: [
      { name: "Dashboard", path: "/owner/dashboard", icon: MdDashboard },
      { name: "Scheduling & Dispatch", path: "/owner/scheduling-ops", icon: MdCalendarMonth },
      { name: "Complaint Management", path: "/owner/complaints", icon: MdReportProblem, badgeKey: "customerReports" },
      { name: "Ratings & Reviews", path: "/owner/reports-ratings", icon: MdStar },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Product Management", path: "/owner/product-management", icon: MdInventory2, badgeKey: "productQuoteRequests" },
      { name: "Service Management", path: "/owner/service-management", icon: MdHomeRepairService },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Technician Management", path: "/owner/admin-management", icon: MdPeople, badgeKey: "technicianApplications" },
      { name: "User Management", path: "/owner/user-management", icon: MdPeople },
    ],
  },
  {
    title: "Configuration",
    items: [
      { name: "City Zone", path: "/owner/city-zones", icon: MdLocationCity },
      { name: "Finance Tracking", path: "/owner/finance-tracking", icon: MdAccountBalanceWallet },
      { name: "Pay to Technician", path: "/owner/technician-payouts", icon: MdPayments },
      { name: "Commission Management", path: "/owner/commission-management", icon: MdPercent },
      { name: "Rewards", path: "/owner/rewards", icon: MdCardGiftcard },
    ],
  },
];

export default function Sidebar({ isCollapsed = false, onToggleCollapse }) {
  const location = useLocation();
  const { counts } = useAdminNotificationCounts();

  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("#E2E8F0", "gray.800");

  const sidebarWidth = isCollapsed ? "72px" : "248px";

  const renderNavGroup = (group) => (
    <Box key={group.title} mb={isCollapsed ? 3 : 4}>
      {/* Group Header in Expanded Mode */}
      <Box
        overflow="hidden"
        maxH={isCollapsed ? "0px" : "24px"}
        opacity={isCollapsed ? 0 : 1}
        transform={isCollapsed ? "translateX(-6px)" : "translateX(0)"}
        transition="max-height 0.22s ease, opacity 0.18s ease, transform 0.22s ease"
        pointerEvents={isCollapsed ? "none" : "auto"}
      >
        <Text
          fontSize="11px"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.06em"
          color="gray.400"
          px={3.5}
          mb={1.5}
          whiteSpace="nowrap"
        >
          {group.title}
        </Text>
      </Box>

      {/* Subtle Group Divider in Collapsed Mode */}
      {isCollapsed && (
        <Box h="1px" bg="gray.100" my={2} mx={2} opacity={0.8} />
      )}

      <VStack spacing={1.5} align="stretch">
        {group.items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/owner/dashboard" && location.pathname.startsWith(item.path));
          const badgeCount = item.badgeKey ? counts[item.badgeKey] || 0 : 0;

          const content = (
            <Flex
              as={NavLink}
              to={item.path}
              align="center"
              justify={isCollapsed ? "center" : "flex-start"}
              px={isCollapsed ? 2 : 3}
              py={2}
              borderRadius="12px"
              bg={isActive ? "linear-gradient(135deg, #028A86 0%, #007A78 100%)" : "transparent"}
              color={isActive ? "white" : "gray.700"}
              boxShadow={isActive ? "0 4px 14px rgba(0, 128, 128, 0.28)" : "none"}
              transition="all 0.18s ease"
              position="relative"
              _hover={
                isActive
                  ? { bg: "linear-gradient(135deg, #008080 0%, #006666 100%)" }
                  : { bg: "teal.50", color: "#008080" }
              }
            >
              {/* Icon Container with active white container or inactive soft teal background */}
              <Flex
                boxSize="28px"
                borderRadius="8px"
                bg={isActive ? "whiteAlpha.250" : "teal.50"}
                color={isActive ? "white" : "#008080"}
                align="center"
                justify="center"
                flexShrink={0}
                transition="all 0.18s ease"
                position="relative"
              >
                <Icon as={item.icon} boxSize={4} />

                {/* Collapsed Mode Notification Pip */}
                {isCollapsed && badgeCount > 0 && (
                  <Box
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    boxSize="8px"
                    borderRadius="full"
                    bg="#EF4444"
                    border="1.5px solid"
                    borderColor={isActive ? "#007A78" : "white"}
                  />
                )}
              </Flex>

              {/* Animated Label Text Container */}
              <Box
                flex="1"
                ml={3}
                minW="150px"
                maxW="180px"
                opacity={isCollapsed ? 0 : 1}
                transform={isCollapsed ? "translateX(-10px)" : "translateX(0)"}
                overflow="hidden"
                whiteSpace="nowrap"
                pointerEvents={isCollapsed ? "none" : "auto"}
                transition="opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)"
                willChange="opacity, transform"
              >
                <Text
                  noOfLines={1}
                  fontSize="13px"
                  fontWeight={isActive ? "700" : "600"}
                >
                  {item.name}
                </Text>
              </Box>

              {/* Expanded Mode Badge */}
              <Box
                maxW="60px"
                opacity={isCollapsed ? 0 : 1}
                transform={isCollapsed ? "translateX(-6px)" : "translateX(0)"}
                overflow="hidden"
                transition="opacity 0.2s ease, transform 0.24s ease"
                pointerEvents={isCollapsed ? "none" : "auto"}
                willChange="opacity, transform"
              >
                {badgeCount > 0 && (
                  <Badge
                    bg={isActive ? "whiteAlpha.300" : "teal.500"}
                    color="white"
                    borderRadius="full"
                    px={1.5}
                    fontSize="2xs"
                    fontWeight="700"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </Box>
            </Flex>
          );

          if (isCollapsed) {
            const tooltipLabel = badgeCount > 0 ? `${item.name} (${badgeCount} new)` : item.name;
            return (
              <Tooltip
                key={item.path}
                label={tooltipLabel}
                placement="right"
                hasArrow
                openDelay={100}
                borderRadius="8px"
                px={2.5}
                py={1}
                fontSize="xs"
                fontWeight="600"
                bg="gray.800"
                color="white"
                boxShadow="md"
              >
                {content}
              </Tooltip>
            );
          }

          return <Box key={item.path}>{content}</Box>;
        })}
      </VStack>
    </Box>
  );

  return (
    <Box
      as="aside"
      position="fixed"
      left="0"
      top="0"
      bottom="0"
      w={sidebarWidth}
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      zIndex="110"
      transition="width 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      willChange="width"
      display={{ base: "none", lg: "flex" }}
      flexDirection="column"
      boxShadow="0 2px 14px rgba(0, 0, 0, 0.04)"
    >
      {/* Top Header Logo & Inset Toggle */}
      <Flex
        h="64px"
        align="center"
        justify="center"
        position="relative"
        px={isCollapsed ? 2 : 4}
        borderBottom="1px solid"
        borderColor={borderColor}
        flexShrink={0}
      >
        {/* Expanded Mode: Full Brand Logo with Smooth Transition */}
        <Flex
          align="center"
          justify="flex-start"
          pl={2}
          pr={isCollapsed ? 0 : 10}
          flex="1"
          overflow="hidden"
          opacity={isCollapsed ? 0 : 1}
          maxW={isCollapsed ? "0px" : "155px"}
          pointerEvents={isCollapsed ? "none" : "auto"}
          transition="max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease"
        >
          <Image
            src={FlareLogo}
            alt="Right Touch Logo"
            h="40px"
            maxW="145px"
            w="auto"
            objectFit="contain"
          />
        </Flex>

        {/* Collapsed Mode: Modern RT Monogram Badge with Smooth Transition */}
        <Flex
          align="center"
          justify="center"
          overflow="hidden"
          opacity={isCollapsed ? 1 : 0}
          maxW={isCollapsed ? "42px" : "0px"}
          pointerEvents={isCollapsed ? "auto" : "none"}
          transition="max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease"
        >
          <Tooltip label="RightTouch Console" placement="right" hasArrow>
            <Flex
              boxSize="38px"
              borderRadius="10px"
              bg="linear-gradient(135deg, #028A86 0%, #006060 100%)"
              color="white"
              align="center"
              justify="center"
              boxShadow="0 2px 8px rgba(0, 128, 128, 0.3)"
              cursor="default"
            >
              <Text fontWeight="900" fontSize="sm" letterSpacing="-0.03em">
                RT
              </Text>
            </Flex>
          </Tooltip>
        </Flex>

        {/* Expanded Mode Inset Collapse Button */}
        {onToggleCollapse && (
          <Tooltip label="Collapse sidebar (Ctrl+B)" placement="bottom" hasArrow>
            <IconButton
              aria-label="Collapse sidebar"
              icon={<Icon as={MdChevronLeft} boxSize="18px" />}
              position="absolute"
              right="12px"
              top="50%"
              transform="translateY(-50%)"
              opacity={isCollapsed ? 0 : 1}
              pointerEvents={isCollapsed ? "none" : "auto"}
              boxSize="28px"
              minW="28px"
              h="28px"
              borderRadius="full"
              bg="gray.50"
              color="gray.600"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.08)"
              cursor="pointer"
              onClick={onToggleCollapse}
              _hover={{
                bg: "#0F766E",
                color: "white",
                borderColor: "#0F766E",
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.3)",
              }}
              _active={{
                transform: "translateY(-50%) scale(0.95)",
              }}
              transition="all 0.2s cubic-bezier(0.2, 0, 0, 1)"
            />
          </Tooltip>
        )}
      </Flex>

      {/* Collapsed Mode Expand Button Trigger */}
      {onToggleCollapse && (
        <Flex
          justify="center"
          align="center"
          maxH={isCollapsed ? "46px" : "0px"}
          opacity={isCollapsed ? 1 : 0}
          overflow="hidden"
          pointerEvents={isCollapsed ? "auto" : "none"}
          py={isCollapsed ? 2 : 0}
          borderBottom={isCollapsed ? "1px solid" : "none"}
          borderColor={borderColor}
          flexShrink={0}
          transition="max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, padding 0.35s ease"
        >
          <Tooltip label="Expand sidebar (Ctrl+B)" placement="right" hasArrow>
            <IconButton
              aria-label="Expand sidebar"
              icon={
                <Icon
                  as={MdChevronLeft}
                  boxSize="18px"
                  transform="rotate(180deg)"
                />
              }
              boxSize="30px"
              minW="30px"
              h="30px"
              borderRadius="full"
              bg="gray.50"
              color="gray.600"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.08)"
              cursor="pointer"
              onClick={onToggleCollapse}
              _hover={{
                bg: "#0F766E",
                color: "white",
                borderColor: "#0F766E",
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.3)",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
              transition="all 0.2s cubic-bezier(0.2, 0, 0, 1)"
            />
          </Tooltip>
        </Flex>
      )}

      {/* Navigation Groups Container with Bespoke Capsule Scrollbar */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        px={isCollapsed ? 2 : 3}
        py={3.5}
        css={{
          scrollbarWidth: "thin",
          scrollbarColor: "#FE2934 #F1F5F9",
          scrollbarGutter: "stable",
          "&::-webkit-scrollbar": {
            width: "7px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#F1F5F9",
            borderRadius: "9999px",
            margin: "4px 0",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(180deg, #FE2934 0%, #FF5252 60%, rgba(254, 41, 52, 0.25) 100%)",
            borderRadius: "9999px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "linear-gradient(180deg, #E02424 0%, #FE2934 70%, rgba(224, 36, 36, 0.45) 100%)",
            border: "2px solid transparent",
            backgroundClip: "content-box",
            boxShadow: "0 0 8px rgba(254, 41, 52, 0.45)",
          },
        }}
      >
        {SIDEBAR_GROUPS.map(renderNavGroup)}
      </Box>

      {/* Footer Muted Credit Line */}
      <Box
        p={3}
        borderTop="1px solid"
        borderColor={borderColor}
        textAlign="center"
        flexShrink={0}
      >
        {!isCollapsed ? (
          <Text fontSize="12px" color="gray.400" fontWeight="400" noOfLines={1}>
            Made by FlareMinds Tech PVT LTD
          </Text>
        ) : (
          <Tooltip label="FlareMinds Tech PVT LTD" placement="right" hasArrow>
            <Text fontSize="10px" color="gray.400" fontWeight="700" cursor="default">
              FM
            </Text>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

/**
 * Mobile Sidebar Drawer Component
 */
export function SidebarResponsive({ isOpen, onClose }) {
  const location = useLocation();
  const { counts } = useAdminNotificationCounts();
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("#E2E8F0", "gray.800");

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
      <DrawerContent bg={bg}>
        <DrawerCloseButton />
        <Box
          h="64px"
          px={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <Image
            src={FlareLogo}
            alt="Right Touch Logo"
            h="44px"
            maxW="170px"
            w="auto"
            objectFit="contain"
          />
        </Box>
        <DrawerBody p={3}>
          {SIDEBAR_GROUPS.map((group) => (
            <Box key={group.title} mb={4}>
              <Text fontSize="11px" fontWeight="700" textTransform="uppercase" letterSpacing="0.06em" color="gray.400" px={3} mb={1.5}>
                {group.title}
              </Text>
              <VStack spacing={1.5} align="stretch">
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/owner/dashboard" && location.pathname.startsWith(item.path));
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] || 0 : 0;

                  return (
                    <Flex
                      key={item.path}
                      as={NavLink}
                      to={item.path}
                      onClick={onClose}
                      align="center"
                      px={3}
                      py={2}
                      borderRadius="12px"
                      bg={isActive ? "linear-gradient(135deg, #028A86 0%, #007A78 100%)" : "transparent"}
                      color={isActive ? "white" : "gray.700"}
                      fontWeight={isActive ? "700" : "600"}
                      fontSize="13px"
                      boxShadow={isActive ? "0 4px 14px rgba(0, 128, 128, 0.28)" : "none"}
                    >
                      <Flex
                        boxSize="28px"
                        borderRadius="8px"
                        bg={isActive ? "whiteAlpha.250" : "teal.50"}
                        color={isActive ? "white" : "#008080"}
                        align="center"
                        justify="center"
                        mr={3}
                        flexShrink={0}
                      >
                        <Icon as={item.icon} boxSize={4} />
                      </Flex>
                      <Text flex="1">{item.name}</Text>
                      {badgeCount > 0 && (
                        <Badge
                          bg={isActive ? "whiteAlpha.300" : "teal.500"}
                          color="white"
                          borderRadius="full"
                          px={1.5}
                          fontSize="2xs"
                        >
                          {badgeCount}
                        </Badge>
                      )}
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          ))}
          <Box mt={6} pt={3} borderTop="1px solid" borderColor={borderColor} textAlign="center">
            <Text fontSize="12px" color="gray.400">
              Made by FlareMinds Tech PVT LTD
            </Text>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

SidebarResponsive.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
