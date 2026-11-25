import React, { useState, useEffect, useRef } from "react";
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
  Icon,
  useToast,
  Grid,
} from "@chakra-ui/react";
import {
  MdMap,
  MdArrowBack,
  MdCheckCircle,
  MdWarning,
  MdErrorOutline,
  MdClear,
} from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ZoneMap from "components/Map/ZoneMap";
import {
  findTnDistrict,
  getTnDistrictBoundary,
  calculatePolygonCentroid,
} from "data/tamilNaduLocations";
import {
  createZone,
  updateZone,
  getZoneById,
  getAllZones,
  getAllDistricts,
} from "views/utils/axiosInstance";
import {
  fitRadiusInDistrict,
} from "views/utils/zoneGeometryOperations";

const BRAND = "#008080";
const BRAND_HOVER = "#006666";

export default function CreateZonePage({ isEditing: isEditingProp }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const isEditing = Boolean(isEditingProp || routeId);
  const zoneId = routeId || searchParams.get("id");
  const presetDistrictId = searchParams.get("districtId") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [districts, setDistricts] = useState([]);
  const [existingZones, setExistingZones] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    operationalCityId: presetDistrictId,
    name: "",
    city: "",
    zoneCode: "",
    description: "",
    active: true,
    polygonCoordinates: "",
  });

  const zoneFitRequestRef = useRef(0);

  // Load existing districts and zones
  useEffect(() => {
    let isMounted = true;
    const fetchPrerequisites = async () => {
      try {
        const [distRes, zoneRes] = await Promise.all([
          getAllDistricts().catch(() => []),
          getAllZones().catch(() => []),
        ]);
        if (!isMounted) return;

        const distList = Array.isArray(distRes) ? distRes : distRes?.data || distRes?.result || [];
        const zoneList = Array.isArray(zoneRes) ? zoneRes : zoneRes?.data || zoneRes?.result || [];

        setDistricts(distList);
        setExistingZones(zoneList);

        if (presetDistrictId && !isEditing) {
          const parent = distList.find((d) => String(d._id) === String(presetDistrictId));
          if (parent) {
            setFormData((prev) => ({
              ...prev,
              operationalCityId: presetDistrictId,
              city: parent.city || parent.name,
            }));
          }
        }
      } catch {
        // Soft fail
      }
    };

    fetchPrerequisites();
    return () => {
      isMounted = false;
    };
  }, [presetDistrictId, isEditing]);

  // Load zone data if in edit mode
  useEffect(() => {
    if (!isEditing || !zoneId) return;

    let isMounted = true;
    const loadZone = async () => {
      try {
        setIsLoading(true);
        const res = await getZoneById(zoneId);
        const z = res?.data || res?.result || res;
        if (!z || !isMounted) return;

        const distId = z.operationalCityId?._id || z.operationalCityId || z.districtId || "";
        const polyStr = z.polygon
          ? JSON.stringify(z.polygon, null, 2)
          : z.geometry
          ? JSON.stringify(z.geometry, null, 2)
          : "";

        setFormData({
          operationalCityId: String(distId),
          name: z.name || "",
          city: z.city || "",
          zoneCode: z.zoneCode || z.code || "",
          description: z.description || "",
          active: z.active !== false,
          polygonCoordinates: polyStr,
        });
      } catch (err) {
        toast({
          title: "Failed to load zone",
          description: err.message || "Could not retrieve zone details.",
          status: "error",
          duration: 3500,
          isClosable: true,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadZone();
    return () => {
      isMounted = false;
    };
  }, [isEditing, zoneId, toast]);

  // Selected parent district record
  const selectedDistrict = districts.find(
    (d) => String(d._id) === String(formData.operationalCityId)
  );
  const districtName = selectedDistrict?.name || "";

  // Auto-fit circular zone inside district boundary on subzone select
  const handleSelectSubzonePreset = async (sz) => {
    const requestId = ++zoneFitRequestRef.current;
    setErrorMessage("");
    const distName = sz.district || districtName || "Tamil Nadu";
    const boundary = getTnDistrictBoundary(distName);

    const payload = {
      lat: sz.lat,
      lng: sz.lng,
      radiusKm: sz.radius_km || 5,
      districtGeometry: boundary,
      districtRing: null,
      requireInsideDistrict: false,
      fallbackToCircle: true,
    };

    const result = fitRadiusInDistrict(payload);
    if (requestId !== zoneFitRequestRef.current) return;

    const polygon = result.polygon || result.fallbackPolygon || null;
    const polyStr = polygon ? JSON.stringify(polygon, null, 2) : "";

    setFormData((prev) => ({
      ...prev,
      name: sz.name,
      city: sz.district || prev.city || distName,
      zoneCode: sz.id || sz.admin_code || sz.name.slice(0, 3).toUpperCase(),
      polygonCoordinates: polyStr,
    }));

    toast({
      title: `Loaded ${sz.name}`,
      description: `Positioned circle zone at ${sz.name} (${result.radiusKm || 5} km).`,
      status: "info",
      duration: 2500,
    });
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!formData.operationalCityId) {
      setErrorMessage("Please select a Parent Operational District.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage("Please enter a Micro-Zone Name.");
      return;
    }
    if (!formData.polygonCoordinates) {
      setErrorMessage("Please draw or generate a zone boundary on the map.");
      return;
    }

    let parsedPolygon = null;
    try {
      parsedPolygon = JSON.parse(formData.polygonCoordinates);
    } catch {
      setErrorMessage("Invalid polygon boundary format.");
      return;
    }

    const ring = Array.isArray(parsedPolygon?.coordinates?.[0]) ? parsedPolygon.coordinates[0] : [];
    const centroid = ring.length ? calculatePolygonCentroid(ring.slice(0, -1)) : null;
    const centerLat = centroid && Number.isFinite(centroid[0]) ? centroid[0] : null;
    const centerLng = centroid && Number.isFinite(centroid[1]) ? centroid[1] : null;

    const payload = {
      operationalCityId: formData.operationalCityId,
      districtId: formData.operationalCityId,
      name: formData.name.trim(),
      city: formData.city.trim() || formData.name.trim(),
      zoneCode: (formData.zoneCode.trim() || formData.name.slice(0, 3)).toUpperCase(),
      description: formData.description.trim(),
      active: formData.active !== false,
      polygon: parsedPolygon,
      geometry: parsedPolygon,
      officialBoundary: parsedPolygon,
      geocode: {
        type: "Point",
        coordinates: centerLng && centerLat ? [centerLng, centerLat] : [],
        latitude: centerLat,
        longitude: centerLng,
      },
    };

    try {
      setIsSubmitting(true);
      if (isEditing && zoneId) {
        await updateZone(zoneId, payload);
        toast({
          title: "Zone Updated",
          description: `"${payload.name}" updated successfully.`,
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      } else {
        await createZone(payload);
        toast({
          title: "Zone Created",
          description: `"${payload.name}" created successfully.`,
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      }
      navigate("/owner/city-zones");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save zone. Please verify fields and try again.");
      toast({
        title: "Save Failed",
        description: err.message || "An error occurred while saving the zone.",
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
      {/* Top Header & Breadcrumb */}
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
              bg="purple.50"
              color="purple.600"
              align="center"
              justify="center"
              fontSize="20px"
            >
              <MdMap />
            </Flex>
            <Box>
              <Heading size="md" color="gray.800" fontWeight="800">
                {isEditing ? "Edit City Zone" : "Create New City Zone"}
              </Heading>
              <Text fontSize="xs" color="gray.500">
                Define operational boundaries and service coverage
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
            {isEditing ? "Update Zone" : "Save Zone"}
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

      {/* Main Split Grid */}
      <Grid
        templateColumns={{ base: "1fr", lg: "330px 1fr", xl: "360px 1fr" }}
        gap={{ base: 4, lg: 5 }}
        alignItems="stretch"
        minH={{ base: "auto", lg: "820px", xl: "880px" }}
      >
        {/* Left Column: Zone Details */}
        <VStack spacing={4} align="stretch">
          <Box
            bg="white"
            p={5}
            borderRadius="16px"
            border="1px solid"
            borderColor="gray.200"
            boxShadow="sm"
          >
            <Flex align="center" gap={2} mb={4} pb={2} borderBottom="1px solid" borderColor="gray.100">
              <Icon as={MdMap} color={BRAND} boxSize={4} />
              <Text fontSize="xs" fontWeight="700" color="gray.800" textTransform="uppercase" letterSpacing="0.5px">
                Micro-Zone Configuration
              </Text>
            </Flex>

            <VStack spacing={3.5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="teal.800" mb={1.5}>
                  Parent Operational District
                </FormLabel>
                <Select
                  size="md"
                  h="42px"
                  value={formData.operationalCityId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    const parent = districts.find((d) => String(d._id) === String(chosenId));
                    setFormData((prev) => ({
                      ...prev,
                      operationalCityId: chosenId,
                      city: parent ? parent.city || parent.name : prev.city,
                    }));
                  }}
                  borderRadius="10px"
                  fontWeight="600"
                  borderColor="teal.400"
                  bg="white"
                  fontSize="sm"
                  _hover={{ borderColor: "teal.600" }}
                  _focus={{ borderColor: "teal.600", boxShadow: "0 0 0 2px rgba(0, 128, 128, 0.2)" }}
                  cursor="pointer"
                >
                  <option value="">-- Select Parent District --</option>
                  {districts.map((d) => (
                    <option key={d._id} value={d._id}>
                      📍 {d.name} ({d.city})
                    </option>
                  ))}
                </Select>
                <Text fontSize="2xs" color="gray.500" mt={1.5} lineHeight="short">
                  Micro-zones must belong to an active operational district.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                  Micro-Zone Name
                </FormLabel>
                <Input
                  size="sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tiruppur Central Zone"
                  borderRadius="8px"
                  fontWeight="600"
                />
              </FormControl>

              <Grid templateColumns="1fr 1fr" gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Zone Code
                  </FormLabel>
                  <Input
                    size="sm"
                    value={formData.zoneCode}
                    onChange={(e) => setFormData({ ...formData, zoneCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. TPR-CEN"
                    borderRadius="8px"
                    textTransform="uppercase"
                    fontWeight="700"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                    Town / Hub
                  </FormLabel>
                  <Input
                    size="sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Tiruppur"
                    borderRadius="8px"
                  />
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="gray.700" mb={1}>
                  Description
                </FormLabel>
                <Input
                  size="sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Covers commercial hub and inner city radius"
                  borderRadius="8px"
                />
              </FormControl>

              <Flex justify="space-between" align="center" p={3} bg="gray.50" borderRadius="10px">
                <Box>
                  <Text fontSize="sm" fontWeight="700" color="gray.800">
                    Zone Active
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Enable service dispatch in this zone
                  </Text>
                </Box>
                <Switch
                  isChecked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  colorScheme="teal"
                  size="md"
                />
              </Flex>
            </VStack>
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
                {formData.polygonCoordinates ? "Boundary Geocode Active" : "Boundary Not Set"}
              </Text>
            </HStack>
            <Text fontSize="xs" color={formData.polygonCoordinates ? "teal.800" : "orange.800"}>
              {formData.polygonCoordinates
                ? "Boundary polygon is active and fitted inside the parent district."
                : "Click on the map or use the radius tool to create a zone geofence."}
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
            viewMode="auto"
            cityName={formData.city || ""}
            selectedCityName={formData.city || ""}
            districtName={districtName || "Tamil Nadu"}
            selectedDistrictName={districtName || ""}
            polygonCoordinates={formData.polygonCoordinates}
            onPolygonChange={(newPoly) => setFormData((prev) => ({ ...prev, polygonCoordinates: newPoly }))}
            height="100%"
            mode="radius"
            radiusKm={5}
            showSearch={true}
            showDrawTools={true}
            showNavControls={false}
            allowRadiusSelect={true}
            showToolbar={true}
            districts={districts}
            allDistricts={districts}
            zones={existingZones}
            selectedDistrictId={formData.operationalCityId || null}
            selectedZoneId={isEditing && zoneId ? zoneId : null}
            onSelectSubzone={handleSelectSubzonePreset}
            onlyTamilNadu={true}
          />
        </Box>
      </Grid>
    </Box>
  );
}
