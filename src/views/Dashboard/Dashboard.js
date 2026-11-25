import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  HStack,
  Button,
} from "@chakra-ui/react";
import {
  FaBoxOpen,
  FaCalendarCheck,
  FaCheckCircle,
  FaRupeeSign,
  FaTools,
} from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { isOwnerRole, selectRole } from "store/slices/authSlice";
import {
  fetchCategories,
  fetchProducts,
  selectServiceCategories,
  selectProductCategories,
  selectProducts,
} from "store/slices/referenceSlice";
import {
  fetchServiceBookings,
  fetchProductBookings,
  selectServiceBookings,
  selectProductBookings,
} from "store/slices/bookingsSlice";
import LoadingState from "components/common/LoadingState";
import RefreshButton from "components/common/RefreshButton";
import KpiTile from "components/Dashboard/KpiTile";
import RevenueTrendCard from "components/Dashboard/RevenueTrendCard";
import RevenueMixCard from "components/Dashboard/RevenueMixCard";
import CategoryPerformancePanel from "components/Dashboard/CategoryPerformancePanel";
import RecentBookingsCard from "components/Dashboard/RecentBookingsCard";
import {
  buildDomainAnalytics,
  buildMonthlyTrend,
  formatCompactCurrency,
  formatCurrency,
  isActiveCatalogItem,
  percentChange,
} from "components/Dashboard/dashboardUtils";
import {
  fetchDashboardInsights,
  normalizeMonthlySeries,
} from "components/Dashboard/dashboardInsights";


export default function Dashboard() {
  const dispatch = useAppDispatch();
  const userRole = useAppSelector(selectRole);
  const isOwner = isOwnerRole(userRole);
  const serviceBookings = useAppSelector(selectServiceBookings);
  const productBookings = useAppSelector(selectProductBookings);
  const serviceCategories = useAppSelector(selectServiceCategories);
  const productCategories = useAppSelector(selectProductCategories);
  const products = useAppSelector(selectProducts);

  const hasExistingData =
    (serviceBookings && serviceBookings.length > 0) ||
    (productBookings && productBookings.length > 0);
  const [loading, setLoading] = useState(!hasExistingData);
  const [insights, setInsights] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState("all");

  const TIMEFRAME_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
    { label: "All", value: "all" },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [, insightData] = await Promise.all([
        dispatchDashboardData(true),
        isOwner ? fetchDashboardInsights(true) : Promise.resolve(null),
      ]);
      setInsights(insightData);
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const textColor = "gray.800";
  const subTextColor = "gray.500";

  const dispatchDashboardData = useCallback(
    (force = false) => {
      const requests = [
        dispatch(fetchServiceBookings({ force }))
          .unwrap()
          .catch((error) => {
            console.warn("Service bookings fetch warning:", error);
          }),
        dispatch(fetchCategories({ categoryType: "service", force }))
          .unwrap()
          .catch((error) => {
            console.warn("Service categories fetch warning:", error);
          }),
      ];

      if (isOwner) {
        requests.push(
          dispatch(fetchProductBookings({ force }))
            .unwrap()
            .catch((error) => {
              console.warn("Product bookings fetch warning:", error);
            }),
          dispatch(fetchCategories({ categoryType: "product", force }))
            .unwrap()
            .catch((error) => {
              console.warn("Product categories fetch warning:", error);
            }),
          dispatch(fetchProducts({ force }))
            .unwrap()
            .catch((error) => {
              console.warn("Products fetch warning:", error);
            })
        );
      }

      return Promise.all(requests);
    },
    [dispatch, isOwner]
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!hasExistingData) {
        setLoading(true);
      }
      try {
        const [, insightData] = await Promise.all([
          dispatchDashboardData(false),
          isOwner ? fetchDashboardInsights(false) : Promise.resolve(null),
        ]);
        if (isMounted) {
          setInsights(insightData);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [dispatchDashboardData, hasExistingData, isOwner]);

  const serviceAnalytics = useMemo(
    () => buildDomainAnalytics(serviceBookings, serviceCategories, "service"),
    [serviceBookings, serviceCategories]
  );

  const productAnalytics = useMemo(
    () => buildDomainAnalytics(productBookings, productCategories, "product"),
    [productBookings, productCategories]
  );

  const catalog = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return {
      total: list.length,
      active: list.filter(isActiveCatalogItem).length,
    };
  }, [products]);

  const monthlyTrend = useMemo(() => {
    const base = buildMonthlyTrend(serviceBookings, productBookings, 6);
    if (!insights) return base;

    const serviceSeries = normalizeMonthlySeries(
      insights.serviceEarnings,
      base
    );
    const productSeries = normalizeMonthlySeries(insights.salesRows, base);

    return base.map((month, index) => {
      const apiService = serviceSeries?.[index];
      const apiProduct = productSeries?.[index];
      const serviceRevenue = apiService?.revenue ?? month.serviceRevenue;
      const productRevenue = apiProduct?.revenue ?? month.productRevenue;
      const serviceBookingsForMonth =
        month.serviceBookings || apiService?.bookings || 0;
      const productBookingsForMonth =
        month.productBookings || apiProduct?.bookings || 0;

      return {
        ...month,
        serviceRevenue,
        productRevenue,
        serviceBookings: serviceBookingsForMonth,
        productBookings: productBookingsForMonth,
        totalRevenue: serviceRevenue + productRevenue,
        totalBookings: serviceBookingsForMonth + productBookingsForMonth,
      };
    });
  }, [serviceBookings, productBookings, insights]);

  const displayedTrend = useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) return [];
    if (timeframe === "today") return monthlyTrend.slice(-1);
    if (timeframe === "7d") return monthlyTrend.slice(-1);
    if (timeframe === "30d") return monthlyTrend.slice(-2);
    if (timeframe === "90d") return monthlyTrend.slice(-3);
    return monthlyTrend;
  }, [monthlyTrend, timeframe]);

  const kpiData = useMemo(() => {
    const apiServiceRevenue = insights?.finance?.revenue || 0;
    const apiProductRevenue = insights?.product?.revenue || 0;
    const apiServicePaid = insights?.finance?.paidCount || 0;
    const apiProductPaid = insights?.product?.paidCount || 0;

    // Revenue and paid counts must come from the same source, otherwise a
    // pending order can be shown as revenue with zero successful payments.
    const useApiServiceNumbers = apiServiceRevenue > 0 && apiServicePaid > 0;
    const useApiProductNumbers = apiProductRevenue > 0 && apiProductPaid > 0;

    const serviceRevenue = useApiServiceNumbers
      ? apiServiceRevenue
      : serviceAnalytics.revenue;
    const productRevenue = useApiProductNumbers
      ? apiProductRevenue
      : productAnalytics.revenue;

    const apiServiceBookings = insights?.finance?.bookings || 0;
    const apiProductBookings = insights?.product?.bookings || 0;
    const serviceBookingsCount =
      apiServiceBookings > 0
        ? apiServiceBookings
        : serviceAnalytics.totalBookings;
    const productBookingsCount =
      apiProductBookings > 0
        ? apiProductBookings
        : productAnalytics.totalBookings;

    const servicePaid = useApiServiceNumbers
      ? apiServicePaid
      : serviceAnalytics.successPayments;
    const productPaid = useApiProductNumbers
      ? apiProductPaid
      : productAnalytics.successPayments;

    const totalBookings = serviceBookingsCount + productBookingsCount;
    const successPayments = servicePaid + productPaid;
    const totalRevenue = serviceRevenue + productRevenue;
    const successRate =
      totalBookings > 0 ? (successPayments / totalBookings) * 100 : 0;

    const currentMonth = monthlyTrend[monthlyTrend.length - 1] || {};
    const previousMonth = monthlyTrend[monthlyTrend.length - 2] || {};

    return {
      totalBookings,
      successPayments,
      totalRevenue,
      successRate,
      serviceBookings: serviceBookingsCount,
      productBookings: productBookingsCount,
      serviceRevenue,
      productRevenue,
      servicePaid,
      productPaid,
      serviceCategories: serviceAnalytics.categoryCount,
      activeProducts:
        insights?.product?.products > 0
          ? insights.product.products
          : catalog.active,
      revenueTrend: percentChange(
        currentMonth.totalRevenue,
        previousMonth.totalRevenue
      ),
      bookingsTrend: percentChange(
        currentMonth.totalBookings,
        previousMonth.totalBookings
      ),
      successTrend: percentChange(
        currentMonth.totalSuccess,
        previousMonth.totalSuccess
      ),
    };
  }, [serviceAnalytics, productAnalytics, monthlyTrend, insights, catalog]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...(Array.isArray(serviceBookings)
        ? serviceBookings.map((booking) => ({ booking, kind: "service" }))
        : []),
      ...(isOwner && Array.isArray(productBookings)
        ? productBookings.map((booking) => ({ booking, kind: "product" }))
        : []),
    ];

    return combined
      .sort((a, b) => {
        const dateA = new Date(
          a.booking?.createdAt || a.booking?.scheduledAt || 0
        ).getTime();
        const dateB = new Date(
          b.booking?.createdAt || b.booking?.scheduledAt || 0
        ).getTime();
        return (dateB || 0) - (dateA || 0);
      })
      .slice(0, 8);
  }, [serviceBookings, productBookings, isOwner]);

  if (loading) {
    return <LoadingState label="Loading Dashboard..." />;
  }

  return (
    <Box
      pt={0}
      pb={{ base: 6, md: 8 }}
      px={0}
    >
      <Stack spacing={{ base: 5, md: 6 }} maxW="1600px" mx="auto">
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          position={{ base: "static", md: "sticky" }}
          top={{ base: "0", md: "64px" }}
          zIndex="900"
          bg="gray.50"
          pt={{ base: 1, md: 2 }}
          pb={{ base: 2, md: 3 }}
        >
          <Box>
            <HStack spacing={2.5} align="center">
              <Heading size="md" color={textColor} fontWeight="800" letterSpacing="-0.02em">
                {isOwner ? "Dashboard Overview" : "Operations Overview"}
              </Heading>
              <HStack
                spacing={1.5}
                px={2}
                py={0.5}
                borderRadius="full"
                bg="teal.50"
                border="1px solid"
                borderColor="teal.200"
              >
                <Box boxSize="6px" borderRadius="full" bg="#10B981" />
                <Text fontSize="2xs" fontWeight="700" color="#0F766E">
                  Live
                </Text>
              </HStack>
            </HStack>
            <Text fontSize="xs" color={subTextColor} mt={0.5}>
              Live dispatch metrics, real-time demand, and revenue health
            </Text>
          </Box>

          <HStack spacing={2.5} align="center" wrap="wrap">
            {/* Timeframe Segmented Control (Wider, Spacious, Modern) */}
            <HStack
              bg="gray.100"
              p={1}
              borderRadius="10px"
              spacing={1}
              border="1px solid"
              borderColor="gray.200"
              boxShadow="xs"
            >
              {TIMEFRAME_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="xs"
                  h="30px"
                  px={{ base: 3, md: 4 }}
                  minW={{ base: "48px", md: "52px" }}
                  borderRadius="8px"
                  variant="unstyled"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={timeframe === opt.value ? "white" : "transparent"}
                  color={timeframe === opt.value ? "#0F766E" : "gray.600"}
                  fontWeight={timeframe === opt.value ? "800" : "600"}
                  fontSize="xs"
                  boxShadow={timeframe === opt.value ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none"}
                  onClick={() => setTimeframe(opt.value)}
                  _hover={{
                    color: timeframe === opt.value ? "#0F766E" : "gray.900",
                    bg: timeframe === opt.value ? "white" : "whiteAlpha.600",
                  }}
                  transition="all 0.15s ease"
                >
                  {opt.label}
                </Button>
              ))}
            </HStack>

            <RefreshButton
              isLoading={isRefreshing}
              onClick={handleRefresh}
              label="Refresh"
              aria-label="Refresh dashboard"
            />
          </HStack>
        </Flex>

        {isOwner ? (
          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 3, xl: 5 }}
            spacing={{ base: 3, md: 4 }}
          >
            <KpiTile
              label="Total Revenue"
              value={formatCurrency(kpiData.totalRevenue)}
              icon={FaRupeeSign}
              subValue={`Svc ${formatCompactCurrency(
                kpiData.serviceRevenue
              )} · Prod ${formatCompactCurrency(kpiData.productRevenue)}`}
              trend={kpiData.revenueTrend}
            />
            <KpiTile
              label="Total Bookings"
              value={kpiData.totalBookings.toLocaleString("en-IN")}
              icon={FaCalendarCheck}
              subValue={`${kpiData.serviceBookings} services · ${kpiData.productBookings} products`}
              trend={kpiData.bookingsTrend}
            />
            <KpiTile
              label="Paid Bookings"
              value={kpiData.successPayments.toLocaleString("en-IN")}
              icon={FaCheckCircle}
              subValue={`${kpiData.successRate.toFixed(1)}% success rate`}
              trend={kpiData.successTrend}
            />
            <KpiTile
              label="Service Categories"
              value={kpiData.serviceCategories.toLocaleString("en-IN")}
              icon={FaTools}
              subValue={`${kpiData.serviceBookings} service bookings`}
            />
            <KpiTile
              label="Active Products"
              value={kpiData.activeProducts.toLocaleString("en-IN")}
              icon={FaBoxOpen}
              subValue={`${catalog.total} total in catalogue`}
            />
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 3, md: 4 }}>
            <KpiTile
              label="Service Bookings"
              value={kpiData.serviceBookings.toLocaleString("en-IN")}
              icon={FaCalendarCheck}
              subValue={`${kpiData.serviceCategories} service categories`}
            />
            <KpiTile
              label="Recent Activity"
              value={recentActivity.length.toLocaleString("en-IN")}
              icon={FaTools}
              subValue="Latest service operations"
            />
          </SimpleGrid>
        )}

        {isOwner && (
          <>
            <SimpleGrid
              columns={{ base: 1, xl: 3 }}
              spacing={{ base: 4, md: 5 }}
              alignItems="stretch"
            >
              <RevenueTrendCard
                months={displayedTrend}
                gridColumn={{ xl: "span 2" }}
              />
              <RevenueMixCard
                serviceRevenue={kpiData.serviceRevenue}
                productRevenue={kpiData.productRevenue}
              />
            </SimpleGrid>

            <Box>
              <Flex
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap={2}
                mb={3}
              >
                <Box>
                  <Heading
                    size="sm"
                    fontSize={{ base: "md", md: "lg" }}
                    fontWeight="800"
                    color={textColor}
                    letterSpacing="-0.02em"
                  >
                    Category Performance
                  </Heading>
                </Box>
                <Text
                  fontSize="2xs"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color={subTextColor}
                >
                  All time
                </Text>
              </Flex>

              <SimpleGrid
                columns={{ base: 1, xl: 2 }}
                spacing={{ base: 4, md: 5 }}
                alignItems="stretch"
              >
                <CategoryPerformancePanel
                  kind="service"
                  title="Service Performance"
                  icon={FaTools}
                  analytics={serviceAnalytics}
                  revenue={kpiData.serviceRevenue}
                  successPayments={kpiData.servicePaid}
                  totalRevenue={kpiData.totalRevenue}
                />
                <CategoryPerformancePanel
                  kind="product"
                  title="Product Performance"
                  icon={FaBoxOpen}
                  analytics={productAnalytics}
                  revenue={kpiData.productRevenue}
                  successPayments={kpiData.productPaid}
                  totalRevenue={kpiData.totalRevenue}
                  catalog={catalog}
                />
              </SimpleGrid>
            </Box>
          </>
        )}

        <RecentBookingsCard items={recentActivity} />
      </Stack>
    </Box>
  );
}
