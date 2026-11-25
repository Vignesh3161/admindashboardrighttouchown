// Admin.js - OWNER/ADMIN ACCESS
import {
  useDisclosure,
  Box,
} from "@chakra-ui/react";
import Sidebar, { SidebarResponsive } from "components/Sidebar/Sidebar.js";
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "routes.js";
import MainPanel from "components/Layout/MainPanel";
import { PageSkeleton } from "components/common";

import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  isPrivilegedRole,
  selectAuthInitialized,
  selectIsAuthenticated,
  selectRole,
  selectSessionVerified,
  logout,
  verifySession,
} from "store/slices/authSlice";
import { canAccessRoute as canAccessRoutePolicy } from "config/accessPolicy";
import { clearAuth } from "views/utils/axiosInstance";
import { useNotificationCoordinator } from "hooks/useNotificationCoordinator";
import { useAdminSocket } from "hooks/useAdminSocket";
import { useSessionRefresh } from "hooks/useSessionRefresh";

export default function Dashboard(props) {
  const { ...rest } = props;
  const dispatch = useAppDispatch();
  const userRole = useAppSelector(selectRole);
  const authInitialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionVerified = useAppSelector(selectSessionVerified);
  const isLoading = !authInitialized || (isAuthenticated && !sessionVerified);
  const location = useLocation();

  // Desktop sidebar collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("rt_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rt_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Global Keyboard Shortcut: Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleCollapse]);

  // Notification coordinator, websocket, and session refresh
  useNotificationCoordinator();
  useAdminSocket();
  useSessionRefresh();

  const {
    isOpen: isSidebarOpen,
    onOpen: onSidebarOpen,
    onClose: onSidebarClose,
  } = useDisclosure();

  document.documentElement.dir = "ltr";

  useEffect(() => {
    if (authInitialized && isAuthenticated && !sessionVerified) {
      dispatch(verifySession());
    }
  }, [authInitialized, isAuthenticated, sessionVerified, dispatch]);

  const canAccessRoute = useCallback(
    (route) => {
      if (!route || route.layout !== "/owner") return false;
      return canAccessRoutePolicy(userRole, route);
    },
    [userRole]
  );

  // Filter routes for sidebar - privileged dashboard routes only.
  const filteredRoutes = useMemo(() => {
    if (!userRole) return [];

    const filterRoutes = (routesArray) => {
      return routesArray
        .filter((route) => {
          if (route.collapse) return true;
          return canAccessRoute(route);
        })
        .map((route) => {
          if (route.collapse && route.views) {
            const filteredViews = filterRoutes(route.views);
            if (filteredViews.length === 0) return null;
            return { ...route, views: filteredViews };
          }
          return route;
        })
        .filter(Boolean);
    };

    return filterRoutes(routes);
  }, [canAccessRoute, userRole]);

  // Accessible dashboard routes for the current role
  const accessibleRoutes = useMemo(() => {
    if (!isPrivilegedRole(userRole)) return [];

    const extractRoutes = (routesArray) => {
      const result = [];

      routesArray.forEach((route) => {
        if (route.collapse && route.views) {
          result.push(...extractRoutes(route.views));
        } else if (route.element && route.path && canAccessRoute(route)) {
          result.push({
            path: route.path,
            element: route.element,
            key: `${route.layout}${route.path}`,
          });
        }
      });

      return result;
    };

    return extractRoutes(routes);
  }, [canAccessRoute, userRole]);

  // Render routes for the current privileged role
  const renderRoutes = () => {
    if (isLoading) return null;

    if (!isPrivilegedRole(userRole)) {
      return <Route path="*" element={<Navigate to="/auth/signin" replace />} />;
    }

    return (
      <>
        {accessibleRoutes.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={route.element}
          />
        ))}

        <Route path="*" element={<Navigate to="/access-denied" replace />} />
      </>
    );
  };

  // Memoized page brand text
  const brandText = useMemo(() => {
    const currentPath = location.pathname;

    const findRoute = (routesArray) => {
      for (const route of routesArray) {
        if (route.collapse && route.views) {
          const found = findRoute(route.views);
          if (found) return found;
        } else if (route.path && route.layout) {
          if (route.layout === "/owner") {
            const routePath = `${route.layout}${route.path}`;
            if (currentPath.includes(routePath) || currentPath === route.path) {
              return route.name || "Dashboard";
            }
          }
        }
      }
      return "Dashboard";
    };

    return findRoute(routes);
  }, [location.pathname]);

  // Redirect non-privileged sessions safely inside useEffect
  useEffect(() => {
    if (authInitialized && !isPrivilegedRole(userRole)) {
      try {
        dispatch(logout());
      } catch (e) {
        clearAuth();
      }
    }
  }, [authInitialized, userRole, dispatch]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh" bg="gray.50">
        <PageSkeleton type="dashboard" />
      </Box>
    );
  }

  if (!isPrivilegedRole(userRole)) {
    return <Navigate to="/auth/signin" replace />;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Mobile Drawer Sidebar */}
      <SidebarResponsive
        routes={filteredRoutes}
        isOpen={isSidebarOpen}
        onOpen={onSidebarOpen}
        onClose={onSidebarClose}
      />

      {/* Desktop Fixed Sidebar */}
      <Sidebar
        routes={filteredRoutes}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        {...rest}
      />

      {/* Main Content Area: Zero overlap, sticky 64px header, max-width 1440px content */}
      <MainPanel
        id="main-panel"
        ml={{ base: 0, lg: isCollapsed ? "72px" : "248px" }}
        w={{
          base: "100%",
          lg: isCollapsed ? "calc(100% - 72px)" : "calc(100% - 248px)",
        }}
        h="100vh"
        maxH="100vh"
        overflowY="auto"
        overflowX="hidden"
        bg="gray.50"
        float="none"
        transition="margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
        willChange="margin-left, width"
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
        {/* Sticky White Topbar (64px) */}
        <AdminNavbar
          onOpen={onSidebarOpen}
          brandText={brandText}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          {...rest}
        />

        {/* Content Container (24px padding, max 1440px) */}
        <Box
          as="main"
          w="100%"
          maxW="1440px"
          mx="auto"
          p={{ base: 4, md: 6 }}
          minH="calc(100vh - 64px)"
        >
          <React.Suspense
            fallback={
              <Box w="100%" py={4}>
                <PageSkeleton type="dashboard" />
              </Box>
            }
          >
            <Routes>
              {renderRoutes()}
              <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </Box>
      </MainPanel>
    </Box>
  );
}
