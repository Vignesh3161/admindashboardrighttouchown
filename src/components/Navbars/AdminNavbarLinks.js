import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  IconButton,
  Badge,
  VStack,
  HStack,
  Skeleton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
} from "@chakra-ui/react";
import { useAppToast } from "components/feedback";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaBell } from "react-icons/fa";
import { MdPerson, MdLogout, MdShield, MdPhone } from "react-icons/md";
import ConfirmActionModal from "components/common/ConfirmActionModal";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  logoutSession,
  selectUser,
  selectRole,
} from "store/slices/authSlice";
import { isAdminRole, isOwnerRole, normalizeRole } from "config/accessPolicy";
import {
  fetchInboxList,
  markInboxRead as markInboxReadThunk,
  markAllInboxRead as markAllInboxReadThunk,
  selectInbox,
  selectInboxUnreadCount,
  selectInboxLoading,
} from "store/slices/notificationsSlice";

const BRAND_TEAL = "#0F766E";

export default function AdminNavbarLinks() {
  const toast = useAppToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const normalizedRole = normalizeRole(role || user?.role);
  const isOwner = isOwnerRole(normalizedRole);
  const roleLabel = isOwner ? "Owner" : isAdminRole(normalizedRole) ? "Admin" : "Account";

  const unreadCount = useAppSelector(selectInboxUnreadCount);
  const notifications = useAppSelector(selectInbox);
  const isLoading = useAppSelector(selectInboxLoading);

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const fetchNotificationsList = () => {
    dispatch(fetchInboxList());
  };

  const handleMarkRead = async (id) => {
    try {
      await dispatch(markInboxReadThunk(id)).unwrap();
    } catch (err) {
      toast.error(err, { title: "Error", description: "Failed to mark notification read", duration: 2000 });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllInboxReadThunk()).unwrap();
      toast({
        title: "All caught up",
        description: "All notifications marked as read.",
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      toast.error(err, { title: "Error", description: "Failed to mark all as read", duration: 2000 });
    }
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await dispatch(logoutSession());
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        status: "info",
        duration: 2000,
      });
      navigate("/auth/signin", { replace: true });
    } catch (err) {
      toast.error(err, { title: "Logout Error", description: "Failed to cleanly revoke session.", duration: 2500 });
      navigate("/auth/signin", { replace: true });
    } finally {
      setLogoutLoading(false);
      setIsLogoutOpen(false);
    }
  };

  // Safe Name Resolution: NEVER show raw phone numbers as display name if name exists
  const rawName =
    user?.fname && user?.lname
      ? `${user.fname} ${user.lname}`
      : user?.name || "";
  const isPhoneIdentifier = /^\+?[0-9]{7,15}$/.test(user?.identifier || "");
  const displayName = rawName || (!isPhoneIdentifier ? user?.identifier : null) || roleLabel;

  // Safe Initials: NEVER digits!
  const getInitials = (name, fallbackRole) => {
    if (!name) return fallbackRole?.slice(0, 2).toUpperCase() || "RT";
    const lettersOnly = name.replace(/[^a-zA-Z\s]/g, "").trim();
    if (!lettersOnly) return fallbackRole?.slice(0, 2).toUpperCase() || "RT";
    const parts = lettersOnly.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return lettersOnly.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName, roleLabel);
  const phoneNumber = user?.mobileNumber || user?.identifier || "Not registered";

  const btnBg = "whiteAlpha.200";
  const btnBorder = "whiteAlpha.300";
  const hoverBg = "whiteAlpha.300";

  return (
    <Flex alignItems="center" gap={3} flexShrink={0}>
      {/* 0. Console Brand Badge */}
      <HStack
        display={{ base: "none", sm: "flex" }}
        bg="whiteAlpha.200"
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="full"
        px={3}
        py={1}
        spacing={1.5}
      >
        <Text as="span" color="#FFD700" fontWeight="900" fontSize="xs">
          ✦
        </Text>
        <Text fontSize="11px" fontWeight="800" color="white" letterSpacing="0.05em">
          {isOwner ? "OWNER CONSOLE" : "ADMIN CONSOLE"}
        </Text>
      </HStack>

      {/* 1. Notifications Hub */}
      <Popover placement="bottom-end" onOpen={fetchNotificationsList}>
        <PopoverTrigger>
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<Icon as={FaBell} boxSize="18px" color="white" />}
              variant="outline"
              size="sm"
              w="38px"
              h="38px"
              borderRadius="10px"
              bg={btnBg}
              borderColor={btnBorder}
              _hover={{ bg: hoverBg, borderColor: "whiteAlpha.400" }}
              _active={{ bg: "whiteAlpha.400" }}
              transition="all 0.15s ease"
            />
            {unreadCount > 0 && (
              <Badge
                bg="#EF4444"
                color="white"
                borderRadius="full"
                position="absolute"
                top="-4px"
                right="-4px"
                fontSize="3xs"
                px={1.5}
                py={0.2}
                boxShadow="0 0 0 2px #007474"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Box>
        </PopoverTrigger>

        <PopoverContent
          borderRadius="12px"
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          backgroundColor="#ffffff !important"
          w="340px"
          zIndex={1500}
        >
          <PopoverHeader borderBottom="1px solid" borderColor="gray.100" py={3} px={4}>
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Text fontWeight="700" fontSize="xs" color="gray.800">
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <Badge colorScheme="teal" borderRadius="full" fontSize="3xs" px={2}>
                    {unreadCount} new
                  </Badge>
                )}
              </HStack>
              {unreadCount > 0 && (
                <Button size="xs" colorScheme="teal" variant="ghost" fontSize="3xs" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
            </Flex>
          </PopoverHeader>

          <PopoverBody maxH="320px" overflowY="auto" p={2}>
            {isLoading ? (
              <VStack spacing={2} p={1}>
                <Skeleton height="36px" width="100%" borderRadius="8px" />
                <Skeleton height="36px" width="100%" borderRadius="8px" />
                <Skeleton height="36px" width="100%" borderRadius="8px" />
              </VStack>
            ) : notifications.length > 0 ? (
              <VStack align="stretch" spacing={2}>
                {notifications.map((item) => {
                  const id = item._id || item.id;
                  const isRead = item.isRead || item.read;
                  return (
                    <Box
                      key={id}
                      p={3}
                      bg={isRead ? "gray.50" : "teal.50"}
                      borderRadius="8px"
                      borderLeft="3px solid"
                      borderLeftColor={isRead ? "gray.300" : BRAND_TEAL}
                      cursor="pointer"
                      onClick={() => !isRead && handleMarkRead(id)}
                      _hover={{ bg: isRead ? "gray.100" : "teal.100" }}
                      transition="background 0.15s"
                    >
                      <Flex justify="space-between" align="start" mb={1}>
                        <Text fontWeight={isRead ? "500" : "700"} fontSize="xs" color="gray.800" noOfLines={1}>
                          {item.title || "Notification"}
                        </Text>
                        <Text fontSize="3xs" color="gray.400" flexShrink={0} ml={2}>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </Text>
                      </Flex>
                      <Text fontSize="2xs" color="gray.500" noOfLines={2}>
                        {item.message || item.body || item.content || ""}
                      </Text>
                    </Box>
                  );
                })}
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text fontSize="xs" color="gray.400">
                  All caught up! No new notifications.
                </Text>
              </Box>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {/* 2. User Profile Capsule */}
      <Menu placement="bottom-end">
        <MenuButton
          as={Button}
          variant="outline"
          px={2.5}
          py={1}
          h="36px"
          borderRadius="8px"
          bg={btnBg}
          borderColor={btnBorder}
          _hover={{ bg: hoverBg, borderColor: "whiteAlpha.400" }}
          _active={{ bg: "whiteAlpha.400" }}
          transition="all 0.15s ease"
        >
          <HStack spacing={2.5}>
            {/* Initials Avatar Chip (White circular chip with teal initials) */}
            <Flex
              w="26px"
              h="26px"
              borderRadius="full"
              bg="white"
              color="#007474"
              align="center"
              justify="center"
              fontWeight="800"
              fontSize="11px"
              flexShrink={0}
              boxShadow="sm"
            >
              {initials}
            </Flex>

            {/* Name + Role */}
            <Box textAlign="left" display={{ base: "none", md: "block" }}>
              <Text fontSize="xs" fontWeight="700" color="white" lineHeight="1.2" noOfLines={1} maxW="120px">
                {displayName}
              </Text>
              <Text fontSize="10px" fontWeight="600" color="whiteAlpha.800" lineHeight="1">
                {roleLabel}
              </Text>
            </Box>

            <ChevronDownIcon color="whiteAlpha.800" boxSize={3.5} />
          </HStack>
        </MenuButton>

        <MenuList
          borderRadius="14px"
          boxShadow="0 12px 35px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)"
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          backgroundColor="#ffffff !important"
          p={2}
          minW="240px"
          zIndex={2000}
        >
          {/* Identity Header Card with Phone Number */}
          <Box p={3} bg="gray.50" borderRadius="10px" border="1px solid" borderColor="gray.150" mb={1.5}>
            <Text fontSize="xs" fontWeight="700" color="gray.800" noOfLines={1}>
              {displayName}
            </Text>
            <HStack spacing={1.5} mt={1} color="gray.500" fontSize="11px">
              <MdPhone size={12} />
              <Text fontFamily="mono">{phoneNumber}</Text>
            </HStack>
            <Badge colorScheme="teal" borderRadius="full" px={2} fontSize="3xs" mt={1.5}>
              {roleLabel} Access
            </Badge>
          </Box>

          <MenuItem
            as={NavLink}
            to="/owner/profile"
            icon={<MdPerson size={16} color={BRAND_TEAL} />}
            borderRadius="8px"
            fontSize="xs"
            fontWeight="500"
            color="gray.700"
            _hover={{ bg: "teal.50", color: "#008080" }}
            py={2.5}
          >
            My Profile &amp; Security
          </MenuItem>

          {isOwner && (
            <MenuItem
              as={NavLink}
              to="/owner/credentials"
              icon={<MdShield size={16} color={BRAND_TEAL} />}
              borderRadius="8px"
              fontSize="xs"
              fontWeight="500"
              color="gray.700"
              _hover={{ bg: "teal.50", color: "#008080" }}
              py={2.5}
            >
              Credentials Management
            </MenuItem>
          )}

          <MenuDivider my={1.5} borderColor="gray.100" />

          <MenuItem
            icon={<MdLogout size={16} color="#ef4444" />}
            borderRadius="8px"
            fontSize="xs"
            fontWeight="600"
            color="red.600"
            _hover={{ bg: "red.50", color: "red.700" }}
            py={2.5}
            onClick={() => setIsLogoutOpen(true)}
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Logout Confirmation Modal */}
      <ConfirmActionModal
        isOpen={isLogoutOpen}
        onClose={() => !logoutLoading && setIsLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={logoutLoading}
        title="Sign Out Confirmation"
        description="Are you sure you want to sign out of the RightTouch Owner Console?"
        confirmLabel="Sign Out"
        confirmColorScheme="red"
      />
    </Flex>
  );
}
