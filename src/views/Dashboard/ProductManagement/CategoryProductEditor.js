import React from "react";
import PropTypes from "prop-types";
import {
  Flex,
  Box,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Image,
  IconButton,
  Select,
  Text,
  SimpleGrid,
  Grid,
  Skeleton,
  Switch,
  HStack,
  VStack,
  Badge,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import Card from "components/Card/Card";
import CardHeader from "components/Card/CardHeader";
import CardBody from "components/Card/CardBody";
import {
  FaArrowLeft,
  FaPlus,
  FaPlusCircle,
  FaTimes,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
} from "react-icons/fa";

export default function CategoryProductEditor(props) {
  const {
    currentView,
    customColor,
    globalScrollbarStyles,
    handleBack,
    selectedProduct,
    newCategory,
    setNewCategory,
    handleCategoryImageUpload,
    handleRemoveCategoryImg,
    handleResetCategory,
    handleSubmitCategory,
    handleUpdateCategory,
    isSubmitting,
    newProduct,
    setNewProduct,
    categories,
    selectedCategory,
    setSelectedCategory,
    statusOptions,
    handleImageUpload,
    handleRemoveImage,
    handleResetProduct,
    handleSubmitProduct,
  } = props;

  return (
      <Flex
        flexDirection="column"
        pt={0}
        minH="100%"
        w="100%"
        css={globalScrollbarStyles}
      >
        <Card
          bg="white"
          shadow="xl"
          display="flex"
          flexDirection="column"
          height="100%"
          overflow="hidden"
        >
          <CardHeader bg="white" flexShrink={0}>
            <Flex align="center" mb={4}>
              <Button
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                onClick={handleBack}
                mr={4}
                color={customColor}
                _hover={{ bg: `${customColor}10` }}
                _active={{ bg: `${customColor}20` }}
                size="sm"
              >
                Back
              </Button>
              <Heading size="md" color="gray.700">
                {currentView === "addCategory" && "Add New Category"}
                {currentView === "editCategory" && "Edit Category"}
                {currentView === "addProduct" && (selectedProduct ? "Edit Product" : "Add New Product")}
              </Heading>
            </Flex>
          </CardHeader>
          <CardBody
            bg="white"
            flex="1"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            p={0}
          >
            {/* Category Form */}
            {(currentView === "addCategory" || currentView === "editCategory") && (
              <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                <Box
                  flex="1"
                  overflowY="auto"
                  p={4}
                  css={globalScrollbarStyles}
                >
                  <FormControl mb="20px" isRequired>
                    <FormLabel htmlFor="name" color="gray.700" fontSize="sm">Name</FormLabel>
                    <Input
                      id="name"
                      placeholder="Enter category name"
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      value={newCategory.name}
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      size="sm"
                    />
                  </FormControl>

                  <FormControl mb="20px" isRequired>
                    <FormLabel htmlFor="description" color="gray.700" fontSize="sm">Description</FormLabel>
                    <Textarea
                      id="description"
                      placeholder="Enter category description"
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      value={newCategory.description}
                      borderColor={`${customColor}50`}
                      _hover={{ borderColor: customColor }}
                      _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                      bg="white"
                      rows={3}
                      size="sm"
                    />
                  </FormControl>

                  <FormControl mb="20px" isRequired>
                    <FormLabel color="gray.700" fontSize="sm">Category Image</FormLabel>
                    <Flex direction="column" gap={3}>
                      {newCategory.image && (
                        <Box
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={2}
                          width="fit-content"
                          position="relative"
                        >
                          <Image
                            src={newCategory.image}
                            alt="Category Preview"
                            boxSize="100px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          <IconButton
                            icon={<FaTrash />}
                            size="xs"
                            colorScheme="red"
                            position="absolute"
                            top={-2}
                            right={-2}
                            borderRadius="full"
                            onClick={handleRemoveCategoryImg}
                            aria-label="Remove image"
                          />
                        </Box>
                      )}
                      <Box
                        border="1px dashed"
                        borderColor={customColor}
                        borderRadius="md"
                        p={4}
                        textAlign="center"
                        cursor="pointer"
                        _hover={{ bg: `${customColor}05` }}
                        position="relative"
                      >
                        {isSubmitting ? (
                          <Skeleton h="20px" w="20px" borderRadius="full" />
                        ) : (
                          <>
                            <Input
                              type="file"
                              accept="image/*"
                              height="100%"
                              width="100%"
                              position="absolute"
                              top="0"
                              left="0"
                              opacity="0"
                              cursor="pointer"
                              onChange={handleCategoryImageUpload}
                              disabled={isSubmitting}
                            />
                            <Flex direction="column" align="center" justify="center" gap={2}>
                              <Icon as={FaPlusCircle} w={6} h={6} color={customColor} />
                              <Text fontSize="sm" color="gray.500">
                                Click to upload category image
                              </Text>
                            </Flex>
                          </>
                        )}
                      </Box>
                    </Flex>
                  </FormControl>
                </Box>

                <Box
                  p={4}
                  borderTop="1px solid"
                  borderColor="gray.100"
                  bg="white"
                  flexShrink={0}
                >
                  <Flex justify="flex-end" gap={4}>
                    <Button
                      variant="outline"
                      onClick={handleResetCategory}
                      borderColor="gray.300"
                      color="gray.600"
                      size="md"
                      px={8}
                      borderRadius="lg"
                      _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                      _active={{ bg: "gray.100", borderColor: "gray.500" }}
                    >
                      Reset
                    </Button>
                    <Button
                      bg={customColor}
                      _hover={{ bg: "#006666", transform: "translateY(-1px)", boxShadow: "lg" }}
                      _active={{ bg: "#004d4d", transform: "translateY(0)" }}
                      color="white"
                      onClick={currentView === "addCategory" ? handleSubmitCategory : handleUpdateCategory}
                      isLoading={isSubmitting}
                      size="md"
                      px={10}
                      borderRadius="lg"
                      leftIcon={<FaPlusCircle />}
                      transition="all 0.2s"
                    >
                      {currentView === "addCategory" ? "Create Category" : "Update Category"}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Product Form */}
            {currentView === "addProduct" && (
              <Box
                flex="1"
                display="flex"
                flexDirection="column"
                overflow="hidden"
                bg="transparent"
              >
                <Box
                  flex="1"
                  overflowY="auto"
                  css={globalScrollbarStyles}
                  pr={2}
                >
                  <Box p={4}>
                    <FormControl mb="20px" isRequired>
                      <FormLabel htmlFor="category" color="gray.700" fontSize="sm">Category</FormLabel>
                      <Select
                        id="category"
                        placeholder="Select category"
                        value={
                          (typeof selectedCategory === 'object' ? selectedCategory?._id : selectedCategory) || ""
                        }
                        onChange={(e) => {
                          const category = categories.find(c => c._id === e.target.value);
                          setSelectedCategory(category || { _id: e.target.value });
                        }}
                        borderColor={`${customColor}50`}
                        _hover={{ borderColor: customColor }}
                        _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                        bg="white"
                        size="sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.category || cat.name}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Product Name</FormLabel>
                        <Input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="Enter product name"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Status</FormLabel>
                        <Select
                          value={newProduct.status}
                          onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        >
                          {statusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Estimated Price From (₹)</FormLabel>
                        <Input
                          type="number"
                          value={newProduct.estimatedPriceFrom}
                          onChange={(e) => setNewProduct({ ...newProduct, estimatedPriceFrom: e.target.value })}
                          placeholder="e.g. 2500"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="gray.700" fontSize="sm">Estimated Price To (₹)</FormLabel>
                        <Input
                          type="number"
                          value={newProduct.estimatedPriceTo}
                          onChange={(e) => setNewProduct({ ...newProduct, estimatedPriceTo: e.target.value })}
                          placeholder="e.g. 3500"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          size="sm"
                        />
                      </FormControl>
                    </Grid>

                    <Grid templateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr"]} gap={4} mb={4}>
                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Product Type</FormLabel>
                        <Select
                          value={newProduct.productType}
                          onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        >
                          <option value="Hardware">Hardware</option>
                          <option value="Service">Service</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Pricing Model</FormLabel>
                        <Select
                          value={newProduct.pricingModel}
                          onChange={(e) => setNewProduct({ ...newProduct, pricingModel: e.target.value })}
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="quote">Quote</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Usage Type</FormLabel>
                        <Select
                          value={newProduct.usageType}
                          onChange={(e) => setNewProduct({ ...newProduct, usageType: e.target.value })}
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Industrial">Industrial</option>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Installation Duration</FormLabel>
                        <Input
                          value={newProduct.installationDuration}
                          onChange={(e) => setNewProduct({ ...newProduct, installationDuration: e.target.value })}
                          placeholder="e.g. 2-3 hours"
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">Warranty Period</FormLabel>
                        <Input
                          value={newProduct.warrantyPeriod}
                          onChange={(e) => setNewProduct({ ...newProduct, warrantyPeriod: e.target.value })}
                          placeholder="e.g. 2 years"
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                        />
                      </FormControl>
                    </Grid>

                    <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={4}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="site-inspection" mb="0" fontSize="sm" color="gray.700">
                          Site Inspection?
                        </FormLabel>
                        <Switch
                          id="site-inspection"
                          isChecked={newProduct.siteInspectionRequired}
                          onChange={(e) => setNewProduct({ ...newProduct, siteInspectionRequired: e.target.checked })}
                          colorScheme="teal"
                          size="sm"
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="amc-available" mb="0" fontSize="sm" color="gray.700">
                          AMC Available?
                        </FormLabel>
                        <Switch
                          id="amc-available"
                          isChecked={newProduct.amcAvailable}
                          onChange={(e) => setNewProduct({ ...newProduct, amcAvailable: e.target.checked })}
                          colorScheme="teal"
                          size="sm"
                        />
                      </FormControl>

                      {newProduct.amcAvailable && (
                        <FormControl>
                          <FormLabel fontSize="sm" color="gray.700">AMC Price / Year</FormLabel>
                          <Input
                            type="number"
                            value={newProduct.amcPricePerYear}
                            onChange={(e) => setNewProduct({ ...newProduct, amcPricePerYear: e.target.value })}
                            size="sm"
                            borderColor={`${customColor}50`}
                            _hover={{ borderColor: customColor }}
                            _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                            bg="white"
                          />
                        </FormControl>
                      )}
                    </SimpleGrid>

                    <Grid templateColumns={["1fr", "1fr 1fr"]} gap={4} mb={4}>
                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">What's Included</FormLabel>
                        <Textarea
                          value={Array.isArray(newProduct.whatIncluded) ? newProduct.whatIncluded.join('\n') : ''}
                          onChange={(e) => setNewProduct({ ...newProduct, whatIncluded: e.target.value.split('\n').filter(item => item.trim()) })}
                          placeholder="Enter each item on a new line"
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          rows={3}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.700" fontSize="sm">What's Not Included</FormLabel>
                        <Textarea
                          value={Array.isArray(newProduct.whatNotIncluded) ? newProduct.whatNotIncluded.join('\n') : ''}
                          onChange={(e) => setNewProduct({ ...newProduct, whatNotIncluded: e.target.value.split('\n').filter(item => item.trim()) })}
                          placeholder="Enter each item on a new line"
                          size="sm"
                          borderColor={`${customColor}50`}
                          _hover={{ borderColor: customColor }}
                          _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                          bg="white"
                          rows={3}
                        />
                      </FormControl>
                    </Grid>

                    <FormControl mb="20px">
                      <FormLabel color="gray.700" fontSize="sm">Description</FormLabel>
                      <Textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                        borderColor={`${customColor}50`}
                        _hover={{ borderColor: customColor }}
                        _focus={{ borderColor: customColor, boxShadow: `0 0 0 1px ${customColor}` }}
                        bg="white"
                        size="sm"
                      />
                    </FormControl>

                    {/* FAQ Questions Section */}
                    <Box borderTop="1px solid" borderColor={`${customColor}20`} pt={4} mt={4} mb={6}>
                      <Flex align="center" justify="space-between" mb={3}>
                        <HStack spacing={2}>
                          <Icon as={FaQuestionCircle} color={customColor} />
                          <Heading size="xs" color="gray.700">Product FAQs (Frequently Asked Questions)</Heading>
                        </HStack>
                        <Button
                          size="xs"
                          leftIcon={<FaPlus />}
                          colorScheme="teal"
                          variant="outline"
                          onClick={() => {
                            const currentFaqs = Array.isArray(newProduct.faqs) ? [...newProduct.faqs] : [];
                            setNewProduct({
                              ...newProduct,
                              faqs: [...currentFaqs, { question: "", answer: "" }],
                            });
                          }}
                        >
                          Add FAQ
                        </Button>
                      </Flex>

                      {(!newProduct.faqs || newProduct.faqs.length === 0) ? (
                        <Text fontSize="xs" color="gray.500" fontStyle="italic" mb={2}>
                          No FAQ questions added yet. Click "Add FAQ" to add product-specific FAQs.
                        </Text>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {newProduct.faqs.map((faq, idx) => (
                            <Box key={idx} p={3} border="1px solid" borderColor={`${customColor}30`} borderRadius="md" bg="gray.50">
                              <Flex align="center" justify="space-between" mb={2}>
                                <Text fontSize="xs" fontWeight="bold" color={customColor}>
                                  FAQ #{idx + 1}
                                </Text>
                                <IconButton
                                  aria-label="Remove FAQ"
                                  icon={<FaTrash />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => {
                                    const updated = newProduct.faqs.filter((_, i) => i !== idx);
                                    setNewProduct({ ...newProduct, faqs: updated });
                                  }}
                                />
                              </Flex>
                              <FormControl mb={2}>
                                <FormLabel fontSize="2xs" color="gray.600" mb={1}>Question</FormLabel>
                                <Input
                                  size="sm"
                                  placeholder="e.g. Is installation included?"
                                  value={faq.question || ""}
                                  onChange={(e) => {
                                    const updated = [...newProduct.faqs];
                                    updated[idx] = { ...updated[idx], question: e.target.value };
                                    setNewProduct({ ...newProduct, faqs: updated });
                                  }}
                                  bg="white"
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="2xs" color="gray.600" mb={1}>Answer</FormLabel>
                                <Textarea
                                  size="sm"
                                  rows={2}
                                  placeholder="e.g. Yes, basic installation is included in the quote."
                                  value={faq.answer || ""}
                                  onChange={(e) => {
                                    const updated = [...newProduct.faqs];
                                    updated[idx] = { ...updated[idx], answer: e.target.value };
                                    setNewProduct({ ...newProduct, faqs: updated });
                                  }}
                                  bg="white"
                                />
                              </FormControl>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>

                    <FormControl mb="20px">
                      <FormLabel color="gray.700" fontSize="sm">Product Images</FormLabel>
                      <Flex direction="column" gap={3}>
                        {newProduct.images && newProduct.images.length > 0 && (
                          <Flex wrap="wrap" gap={3}>
                            {newProduct.images.map((img, index) => (
                              <Box
                                key={img.public_id || img.publicId || index}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={2}
                                width="fit-content"
                                position="relative"
                              >
                                <Image
                                  src={img.url || img.preview || img}
                                  alt={`Product image ${index + 1}`}
                                  boxSize="80px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                                <IconButton
                                  icon={<FaTrash />}
                                  size="xs"
                                  colorScheme="red"
                                  position="absolute"
                                  top={-2}
                                  right={-2}
                                  borderRadius="full"
                                  onClick={() => handleRemoveImage(img, index)}
                                  aria-label="Remove image"
                                />
                              </Box>
                            ))}
                          </Flex>
                        )}
                        <Box
                          border="1px dashed"
                          borderColor={customColor}
                          borderRadius="md"
                          p={4}
                          textAlign="center"
                          cursor="pointer"
                          _hover={{ bg: `${customColor}05` }}
                          position="relative"
                        >
                          {isSubmitting ? (
                            <Skeleton h="20px" w="20px" borderRadius="full" />
                          ) : (
                            <>
                              <Input
                                type="file"
                                multiple
                                accept="image/*"
                                height="100%"
                                width="100%"
                                position="absolute"
                                top="0"
                                left="0"
                                opacity="0"
                                cursor="pointer"
                                onChange={handleImageUpload}
                                disabled={isSubmitting}
                              />
                              <Flex direction="column" align="center" justify="center" gap={2}>
                                <Icon as={FaPlusCircle} w={6} h={6} color={customColor} />
                                <Text fontSize="sm" color="gray.500">
                                  Click to upload product images
                                </Text>
                              </Flex>
                            </>
                          )}
                        </Box>
                      </Flex>
                    </FormControl>
                  </Box>
                </Box>

                <Box
                  p={6}
                  borderTop="1px solid"
                  borderColor={`${customColor}20`}
                  bg="white"
                  boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.05)"
                  flexShrink={0}
                >
                  <Flex justify="flex-end" gap={4}>
                    <Button
                      variant="outline"
                      onClick={handleResetProduct}
                      borderColor="gray.300"
                      color="gray.600"
                      size="md"
                      px={8}
                      borderRadius="lg"
                      _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                      _active={{ bg: "gray.100", borderColor: "gray.500" }}
                    >
                      Reset
                    </Button>
                    <Button
                      bg={customColor}
                      _hover={{ bg: "#006666", transform: "translateY(-1px)", boxShadow: "lg" }}
                      _active={{ bg: "#004d4d", transform: "translateY(0)" }}
                      color="white"
                      onClick={handleSubmitProduct}
                      isLoading={isSubmitting}
                      size="md"
                      px={10}
                      borderRadius="lg"
                      leftIcon={selectedProduct ? <FaEdit /> : <FaPlusCircle />}
                      transition="all 0.2s"
                    >
                      {selectedProduct ? "Update Product" : "Create Product"}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            )}
          </CardBody>
        </Card>
      </Flex>
    );

}

CategoryProductEditor.propTypes = {
  currentView: PropTypes.string.isRequired,
  customColor: PropTypes.string,
  globalScrollbarStyles: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  selectedProduct: PropTypes.object,
  newCategory: PropTypes.object,
  setNewCategory: PropTypes.func,
  handleCategoryImageUpload: PropTypes.func,
  handleRemoveCategoryImg: PropTypes.func,
  handleResetCategory: PropTypes.func,
  handleSubmitCategory: PropTypes.func,
  handleUpdateCategory: PropTypes.func,
  isSubmitting: PropTypes.bool,
  newProduct: PropTypes.object,
  setNewProduct: PropTypes.func,
  categories: PropTypes.array,
  selectedCategory: PropTypes.object,
  setSelectedCategory: PropTypes.func,
  statusOptions: PropTypes.array,
  handleImageUpload: PropTypes.func,
  handleRemoveImage: PropTypes.func,
  handleResetProduct: PropTypes.func,
  handleSubmitProduct: PropTypes.func,
};
