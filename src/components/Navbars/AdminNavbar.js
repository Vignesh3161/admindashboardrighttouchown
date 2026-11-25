import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import AdminNavbarLinks from "./AdminNavbarLinks";
import CommandPalette from "components/common/CommandPalette";

const AdminNavbar = React.memo(function AdminNavbar(props) {
  const { onOpen, brandText = "Dashboard" } = props;
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <>
      <Flex
        as="header"
        position="sticky"
        top="0"
        left="0"
        right="0"
        w="100%"
        h="64px"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6 }}
        bg="linear-gradient(90deg, #027475 0%, #006060 100%)"
        borderBottom="1px solid rgba(255, 255, 255, 0.12)"
        boxShadow="0 2px 12px rgba(0, 60, 60, 0.18)"
        zIndex="1000"
        transition="box-shadow 0.2s ease"
      >
        {/* LEFT SECTION: Mobile Hamburger (< lg) + Page Title */}
        <HStack spacing={2.5} align="center">
          {/* Mobile Drawer Trigger (< lg only) */}
          <IconButton
            aria-label="Open Navigation Drawer"
            icon={<HamburgerIcon boxSize={5} color="white" />}
            display={{ base: "flex", lg: "none" }}
            variant="ghost"
            size="sm"
            borderRadius="8px"
            bg="whiteAlpha.200"
            _hover={{ bg: "whiteAlpha.300" }}
            onClick={onOpen}
          />

          <Text
            color="white"
            fontWeight="800"
            fontSize={{ base: "sm", md: "md" }}
            letterSpacing="-0.02em"
            lineHeight="1.2"
          >
            {brandText}
          </Text>
        </HStack>

        {/* RIGHT SECTION: Notifications & Profile Menu */}
        <AdminNavbarLinks />
      </Flex>

      {/* Global Ctrl+K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
});

AdminNavbar.propTypes = {
  onOpen: PropTypes.func,
  brandText: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

export default AdminNavbar;
