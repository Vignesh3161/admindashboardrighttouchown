import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Heading,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  Switch,
  Badge,
  Icon,
  useToast,
  Grid,
} from "@chakra-ui/react";
import {
  MdApartment,
  MdArrowBack,
  MdCheckCircle,
  MdWarning,
  MdErrorOutline,
  MdClear,
} from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ZoneMap from "components/Map/ZoneMap";
import {
  TAMIL_NADU_DISTRICTS,
  findTnDistrict,
  getTnDistrictBoundary,
} from "data/tamilNaduLocations";
import {
  createDistrict,
  updateDistrict,
  getDistrictById,
  getAllDistricts,
} from "views/utils/axiosInstance";

const BRAND = "#008080";
const BRAND_HOVER = "#006666";

export default function CreateDistrictPage({ isEditing: isEditingProp }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const isEditing = Boolean(isEditingProp || routeId);
  const districtId = routeId || searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [existingDistricts, setExistingDistricts] = useState([]);

  // Form State
  const [districtTnName, setDistrictTnName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    code: "",
    state: "Tamil Nadu",
    country: "India",
    active: true,
    polygonCoordinates: "",
  });

  // Load existing districts for conflict / map overlay checks
  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      try {
        const res = await getAllDistricts();
        const list = Array.isArray(res) ? res : res?.data || res?.result || [];
        if (isMounted) setExistingDistricts(list);
      } catch {
        // Soft fail
      }
    };
    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load district details if in editing mode
  useEffect(() => {
    if (!isEditing || !districtId) return;

    let isMounted = true;
    const loadDistrict = async () => {
      try {
        setIsLoading(true);
        const res = await getDistrictById(districtId);
        const d = res?.data || res?.result || res;
        if (!d || !isMounted) return;

        const tn = findTnDistrict(d.name || d.city || "");
        setDistrictTnName(tn?.name || d.name || "");
        setFormData({
          name: d.name || "",
          city: d.city || "",
          code: d.code || d.displayCode || "",
          state: d.state || "Tamil Nadu",
          country: d.country || "India",
          active: d.active !== false && d.isActive !== false,
          polygonCoordinates: d.polygon
            ? JSON.stringify(d.polygon, null, 2)
            : d.officialBoundary
            ? JSON.stringify(d.officialBoundary, null, 2)
            : "",
        });
      } catch (err) {
        toast({
          title: "Failed to load district",
          description: err.message || "Could not retrieve district data.",
          status: "error",
          duration: 3500,
          isClosable: true,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDistrict();
    return () => {
      isMounted = false;
    };
  }, [isEditing, districtId, toast]);

  // Handle district selection from dropdown or map click
  const handleSelectTnDistrict = (tnName) => {
    if (!tnName) {
      setDistrictTnName("");
      return;
    }
    const tn = findTnDistrict(tnName);
    if (!tn) return;

    setDistrictTnName(tn.name);
    const boundary = getTnDistrictBoundary(tn.name);
    const polyStr = boundary ? JSON.stringify(boundary, null, 2) : "";

    setErrorMessage("");
    setFormData((prev) => ({
      ...prev,
      name: prev.name && isEditing ? prev.name : `${tn.name} Operational Range`,
      city: prev.city && isEditing ? prev.city : tn.capital || tn.name,
      code: prev.code && isEditing ? prev.code : tn.code || tn.name.slice(0, 3).toUpperCase(),
      polygonCoordinates: polyStr,
    }));
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Please enter an Operational District Name.");
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage("Please enter a Default City or Hub for this district.");
      return;
    }

    let parsedPolygon = null;
    if (formData.polygonCoordinates) {
      try {
        parsedPolygon = JSON.parse(formData.polygonCoordinates);
      } catch {
        setErrorMessage("Invalid polygon coordinates format.");
        return;
      }
    } else if (districtTnName) {
      parsedPolygon = getTnDistrictBoundary(districtTnName);
    }

    const payload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      state: formData.state.trim() || "Tamil Nadu",
      country: formData.country.trim() || "India",
      code: (formData.code.trim() || formData.name.slice(0, 3)).toUpperCase(),
      active: formData.active !== false,
      isActive: formData.active !== false,
      status: formData.active !== false ? "ACTIVE" : "INACTIVE",
      isRegistrationEnabled: true,
      isJobEnabled: true,
      polygon: parsedPolygon,
      officialBoundary: parsedPolygon,
    };

    try {
      setIsSubmitting(true);
      if (isEditing && districtId) {
        await updateDistrict(districtId, payload);
        toast({
          title: "District Updated",
          description: `"${payload.name}" updated successfully.`,
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      } else {
        await createDistrict(payload);
        toast({
          title: "District Created",
          description: `"${payload.name}" created successfully.`,
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      }
      navigate("/owner/city-zones");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save district. Please verify fields and try again.");
      toast({
        title: "Save Failed",
        description: err.message || "An error occurred while saving.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      pt={0}
      px={{ base: 3, md: 5, lg: 6 }}
      pb={{ base: 6, md: 8 }}
      maxW="100%"
      w="100%"
      mx="auto"
      minH="calc(100vh - 60px)"
    >
      {/* Top Navigation & Action Header */}
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        pb={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        flexWrap="wrap"
        gap={3}
      >
        <HStack spacing={3}>
          <Button
            leftIcon={<MdArrowBack />}
            variant="ghost"
            size="sm"
            borderRadius="8px"
            onClick={() => navigate("/owner/city-zones")}
            color="gray.600"
            _hover={{ bg: "gray.100" }}
          >
            Back to City Zone Governance
          </Button>
          <Box h="20px" w="1px" bg="gray.300" />
          <HStack spacing={2.5}>
            <Flex
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="teal.50"
              color={BRAND}
              align="center"
              justify="center"
              fontSize="20px"
            >
              <MdApartment />
            </Flex>
            <Box>
              <Heading size="md" color="gray.800" fontWeight="800">
                {isEditing ? "Edit Operational District" : "Add Operational District"}
              </Heading>
              <Text fontSize="xs" color="gray.500">
                Configure Survey of India boundary geofence and service activation
              </Text>
            </Box>
          </HStack>
        </HStack>

        <HStack spacing={3}>
          <Button
            variant="outline"
            size="sm"
            borderRadius="8px"
            onClick={() => navigate("/owner/city-zones")}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            bg={BRAND}
            color="white"
            _hover={{ bg: BRAND_HOVER }}
            borderRadius="8px"
            leftIcon={<MdCheckCircle />}
            onClick={handleSubmit}
            isLoading={isSubmitting || isLoading}
            fontWeight="bold"
            px={5}
          >
            {isEditing ? "Save Changes" : "Create Operational District"}
          </Button>
        </HStack>
      </Flex>

      {/* Error Banner */}
      {errorMessage && (
        <Flex
          align="center"
          bg="red.50"
          border="1px solid"
          borderColor="red.300"
          color="red.800"
          px={4}
          py={3}
          borderRadius="12px"
          mb={4}
          justify="space-between"
          boxShadow="xs"
        >
          <HStack spacing={2.5}>
            <Icon as={MdErrorOutline} boxSize={5} color="red.600" />
            <Text fontSize="sm" fontWeight="600">
              {errorMessage}
            </Text>
          </HStack>
          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => setErrorMessage("")}>
            <MdClear />
          </Button>
        </Flex>
      )}

      {/* Main Split Grid: Left Details Form & Right Full Map */}
      <Grid
        templateColumns={{ base: "1fr", lg: "330px 1fr", xl: "360px 1fr" }}
        gap={{ base: 4, lg: 5 }}
        alignItems="stretch"
        minH={{ base: "auto", lg: "820px", xl: "880px" }}
      >
        {/* Left Form Column */}
        <VStack spacing={4} align="stretch">
          {/* General Info Card */}
          <Box
            bg="white"
            p={5}
            borderRadius="16px"
            border="1px solid"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <Flex align="center" gap={2} mb={4} pb={2} borderBottom="1px solid" borderColor="gray.100">
              <Icon as={MdApartment} color={BRAND} boxSize={4} />
              <Text fontSize="xs" fontWeight="700" color="gray.800" textTransform="uppercase" letterSpacing="0.5px">
                District General Details
              </Text>
            </Flex>

            <VStack spacing={3.5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="teal.800" mb={1.5}>
                  Official Tamil Nadu Revenue District
                </FormLabel>
                <Select
                  size="md"
                  h="42px"
                  value={districtTnName}
                  onChange={(e) => handleSelectTnDistrict(e.target.value)}
                  borderRadius="10px"
                  fontWeight="600"
                  borderColor="teal.400"
                  bg="white"
                  fontSize="sm"
                  _hover={{ borderColor: "teal.600" }}
                  _focus={{ borderColor: "teal.600", boxShadow: "0 0 0 2px rgba(0, 128, 128, 0.2)" }}
                  cursor="pointer"
                >
                  <option value="">-- Select from 38 TN Districts --</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      📍 {d.name} ({d.code || "TN"})
                    </option>
                  ))}
                </Select>
                <Text fontSize="2xs" color="gray.500" mt={1.5} lineHeight="short">
                  Selecting a district auto-loads the official Survey of India GeoJSON boundary.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                  Operational District Name
                </FormLabel>
                <Input
                  size="sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tiruppur Operational Range"
                  borderRadius="8px"
                  fontWeight="600"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                  Default City / Hub
                </FormLabel>
                <Input
                  size="sm"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Tiruppur"
                  borderRadius="8px"
                />
              </FormControl>

              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    District Code
                  </FormLabel>
                  <Input
                    size="sm"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. TPR"
                    borderRadius="8px"
                    textTransform="uppercase"
                    fontWeight="700"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    State
                  </FormLabel>
                  <Input
                    size="sm"
                    value={formData.state}
                    isReadOnly
                    borderRadius="8px"
                    bg="gray.50"
                  />
                </FormControl>
              </Grid>
            </VStack>
          </Box>

          {/* Operational Controls Card */}
          <Box
            bg="white"
            p={5}
            borderRadius="16px"
            border="1px solid"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <Text fontSize="xs" fontWeight="700" color="gray.700" mb={3} textTransform="uppercase" letterSpacing="0.5px">
              Operational Governance
            </Text>

            <Flex justify="space-between" align="center" p={3} bg="gray.50" borderRadius="10px">
              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.800">
                  District Active
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Enables technician dispatches and bookings in this district
                </Text>
              </Box>
              <Switch
                isChecked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                colorScheme="teal"
                size="md"
              />
            </Flex>
          </Box>

          {/* Boundary Status Banner */}
          <Box
            p={4}
            borderRadius="14px"
            bg={formData.polygonCoordinates ? "teal.50" : "orange.50"}
            border="1px solid"
            borderColor={formData.polygonCoordinates ? "teal.300" : "orange.300"}
          >
            <HStack spacing={2.5} align="center" mb={1}>
              <Icon
                as={formData.polygonCoordinates ? MdCheckCircle : MdWarning}
                color={formData.polygonCoordinates ? "teal.600" : "orange.600"}
                boxSize={5}
              />
              <Text fontSize="sm" fontWeight="bold" color={formData.polygonCoordinates ? "teal.900" : "orange.900"}>
                {formData.polygonCoordinates ? "Official SOI Boundary Active" : "Boundary Missing"}
              </Text>
            </HStack>
            <Text fontSize="xs" color={formData.polygonCoordinates ? "teal.800" : "orange.800"}>
              {formData.polygonCoordinates
                ? "Official Survey of India revenue boundary geofence is loaded and ready for dispatch."
                : "Select a Tamil Nadu district from the dropdown or click on the map to load its official boundary."}
            </Text>
          </Box>
        </VStack>

        {/* Right Map Column */}
        <Box
          bg="#0b111e"
          borderRadius="16px"
          border="1px solid"
          borderColor="rgba(6, 182, 212, 0.3)"
          boxShadow="lg"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          minH={{ base: "560px", lg: "820px", xl: "880px" }}
          h={{ base: "560px", lg: "820px", xl: "880px" }}
          p={2}
        >
          <ZoneMap
            viewMode="state"
            districtName={districtTnName || "Tamil Nadu"}
            selectedDistrictName={districtTnName || ""}
            polygonCoordinates={formData.polygonCoordinates}
            height="100%"
            mode="view"
            showSearch={false}
            showDrawTools={false}
            allowRadiusSelect={false}
            showToolbar={true}
            showNavControls={false}
            districts={existingDistricts}
            allDistricts={existingDistricts}
            onlyTamilNadu={true}
            onSelectDistrict={(dist) => {
              handleSelectTnDistrict(dist.name || dist.city);
            }}
          />
        </Box>
      </Grid>
    </Box>
  );
}
