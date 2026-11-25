import React from "react";
import {
  SimpleGrid,
  Flex,
  Box,
  Text,
  Badge,
  Skeleton,
  Icon,
} from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import IconBox from "components/common/IconBox";
import {
  getSkeuomorphicCardStyle,
  getSkeuomorphicIconBoxStyle,
  skeuomorphicIconFilter,
} from "components/common/skeuomorphicStyles";
import {
  FaUsers,
  FaUserCheck,
  FaCalendarCheck,
  FaChartLine,
} from "react-icons/fa";

const UserStatsCards = React.memo(function UserStatsCards({
  stats,
  isLoading,
  customColor = "#008080",
  textColor,
}) {
  const isDark = false;

  const cards = [
    {
      id: "total",
      label: "Total Customers",
      subLabel: "All Registered Users",
      value: isLoading ? <Skeleton height="24px" width="40px" /> : stats?.totalUsers || 0,
      icon: FaUsers,
      iconBg: customColor,
      color: textColor || "gray.800",
    },
    {
      id: "active",
      label: "Active Accounts",
      subLabel: "Active Status",
      value: isLoading ? <Skeleton height="24px" width="40px" /> : stats?.activeUsers || 0,
      icon: FaUserCheck,
      iconBg: "green.500",
      color: "green.600",
    },
    {
      id: "withBookings",
      label: "With Bookings",
      subLabel: "Active / Completed Orders",
      value: isLoading ? <Skeleton height="24px" width="40px" /> : stats?.usersWithBookings || 0,
      icon: FaCalendarCheck,
      iconBg: "blue.500",
      color: "blue.600",
    },
    {
      id: "revenue",
      label: "Total Revenue",
      subLabel: "Platform Customer LTV",
      value: isLoading
        ? <Skeleton height="24px" width="50px" />
        : `₹${Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: FaChartLine,
      iconBg: "purple.500",
      color: "purple.600",
    },
  ];

  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 4 }}
      spacing={{ base: 3, md: 4 }}
      mb={{ base: 3, md: 4 }}
    >
      {cards.map((c) => {
        const cardStyle = getSkeuomorphicCardStyle(isDark, false, customColor);

        return (
          <Card
            key={c.id}
            minH={{ base: "90px", md: "105px" }}
            h={{ base: "auto", md: "105px" }}
            borderRadius="10px"
            p={0}
            {...cardStyle}
          >
            <CardBody
              p={{ base: 3, md: 4 }}
              display="flex"
              alignItems="center"
              h="100%"
              w="100%"
            >
              <Flex align="center" justify="space-between" w="100%">
                <Box flex="1" mr={2} overflow="hidden">
                  <Text
                    fontSize="xs"
                    color={isDark ? "gray.400" : "gray.600"}
                    fontWeight="bold"
                    noOfLines={1}
                    lineHeight="1.2"
                  >
                    {c.label}
                  </Text>
                  <Text
                    as="div"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="black"
                    color={c.color}
                    mt={0.5}
                    lineHeight="1.1"
                  >
                    {c.value}
                  </Text>
                  <Flex align="center" mt={1} minH="18px">
                    <Text fontSize="10px" color="gray.400" fontWeight="medium" lineHeight="1">
                      {c.subLabel}
                    </Text>
                  </Flex>
                </Box>
                <IconBox
                  h={{ base: "40px", md: "44px" }}
                  w={{ base: "40px", md: "44px" }}
                  flexShrink={0}
                  {...getSkeuomorphicIconBoxStyle(c.iconBg)}
                >
                  <Icon
                    as={c.icon}
                    boxSize="20px"
                    color="white"
                    sx={skeuomorphicIconFilter}
                  />
                </IconBox>
              </Flex>
            </CardBody>
          </Card>
        );
      })}
    </SimpleGrid>
  );
});

export default UserStatsCards;
