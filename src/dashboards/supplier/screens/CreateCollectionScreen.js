import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  X,
  Camera,
  Search,
  Package,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  createCollection,
  searchProducts,
  getAllProducts,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

// Define operator options based on the document
const operatorOptions = {
  title: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'starts_with', label: 'Starts with'},
    {value: 'ends_with', label: 'Ends with'},
    {value: 'contains', label: 'Contains'},
    {value: 'does_not_contain', label: 'Does not contain'},
  ],
  category: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
  ],
  vendor: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'starts_with', label: 'Starts with'},
    {value: 'ends_with', label: 'Ends with'},
    {value: 'contains', label: 'Contains'},
    {value: 'does_not_contain', label: 'Does not contain'},
  ],
  search_tags: [{value: 'is_equal_to', label: 'Is equal to'}],
  price: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'is_greater_than', label: 'Is greater than'},
    {value: 'is_less_than', label: 'Is less than'},
  ],
  compareTo_at_price: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'is_greater_than', label: 'Is greater than'},
    {value: 'is_less_than', label: 'Is less than'},
    {value: 'is_not_empty', label: 'Is not empty'},
    {value: 'is_empty', label: 'Is empty'},
  ],
  weight: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'is_greater_than', label: 'Is greater than'},
    {value: 'is_less_than', label: 'Is less than'},
  ],
  inventory: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_greater_than', label: 'Is greater than'},
    {value: 'is_less_than', label: 'Is less than'},
  ],
  variant_title: [
    {value: 'is_equal_to', label: 'Is equal to'},
    {value: 'is_not_equal_to', label: 'Is not equal to'},
    {value: 'starts_with', label: 'Starts with'},
    {value: 'ends_with', label: 'Ends with'},
    {value: 'contains', label: 'Contains'},
    {value: 'does_not_contain', label: 'Does not contain'},
  ],
};

const fieldOptions = [
  {value: 'title', label: 'Title'},
  {value: 'category', label: 'Category'},
  {value: 'vendor', label: 'Vendor'},
  {value: 'search_tags', label: 'Search Tags'},
  {value: 'price', label: 'Price'},
  {value: 'compareTo_at_price', label: 'Compare To At Price'},
  {value: 'weight', label: 'Weight'},
  {value: 'inventory', label: 'Inventory'},
  {value: 'variant_title', label: 'Variant Title'},
];

const CreateCollectionScreen = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    collection_type: 'manual',
    collection_images: [],
    product_list: [],
    smart_operator: 'all',
    smart_conditions: [],
    page_title: '',
    meta_description: '',
    url_handle: '',
  });

  // Modal states
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [productSearchModalVisible, setProductSearchModalVisible] =
    useState(false);
  const [browseProductsModalVisible, setBrowseProductsModalVisible] =
    useState(false);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [operatorModalVisible, setOperatorModalVisible] = useState(false);

  // Search and products
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentConditionIndex, setCurrentConditionIndex] = useState(null);

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Generate URL handle helper
  const generateUrlHandle = useCallback(title => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Update form data helper
  const updateFormData = useCallback(
    (field, value) => {
      setFormData(prev => {
        const updated = {...prev, [field]: value};

        // Auto-generate page title and URL handle when title changes
        if (field === 'title') {
          updated.page_title = value;
          updated.url_handle = generateUrlHandle(value);
        }

        // Auto-generate meta description from description
        if (field === 'description') {
          updated.meta_description = value.slice(0, 200);
        }

        return updated;
      });
    },
    [generateUrlHandle],
  );

  // Get full image URL helper
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Load all products for browsing
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const response = await getAllProducts();
        if (response && response.products) {
          setAllProducts(response.products);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadAllProducts();
  }, []);

  // Search products
  const handleProductSearch = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchProducts(query);
      if (response && response.products) {
        setSearchResults(response.products);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.collection_type === 'manual') {
        handleProductSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, formData.collection_type]);

  // Handle image selection
  const handleImageSelection = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.error) return;

      const asset = response.assets[0];
      const imageFile = {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'collection_image.jpg',
      };

      updateFormData('collection_images', [imageFile]);
      setImageModalVisible(false);
    });
  };

  // Handle product selection
  const handleProductSelection = product => {
    const currentList = formData.product_list;
    if (!currentList.some(p => p.id === product.id)) {
      updateFormData('product_list', [...currentList, product]);
    }
    setProductSearchModalVisible(false);
    setBrowseProductsModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle product removal
  const handleProductRemoval = productId => {
    const filteredList = formData.product_list.filter(p => p.id !== productId);
    updateFormData('product_list', filteredList);
  };

  // Handle smart condition changes
  const addSmartCondition = useCallback(() => {
    const newCondition = {field: '', operator: '', value: ''};
    updateFormData('smart_conditions', [
      ...formData.smart_conditions,
      newCondition,
    ]);
  }, [formData.smart_conditions, updateFormData]);

  const removeSmartCondition = index => {
    const filtered = formData.smart_conditions.filter((_, i) => i !== index);
    updateFormData('smart_conditions', filtered);
  };

  const updateSmartCondition = (index, field, value) => {
    const updated = formData.smart_conditions.map((condition, i) => {
      if (i === index) {
        const newCondition = {...condition, [field]: value};
        // Reset operator when field changes
        if (field === 'field') {
          newCondition.operator = '';
        }
        return newCondition;
      }
      return condition;
    });
    updateFormData('smart_conditions', updated);
  };

  // Initialize smart collection with one condition
  useEffect(() => {
    if (
      formData.collection_type === 'smart' &&
      formData.smart_conditions.length === 0
    ) {
      addSmartCondition();
    }
  }, [
    formData.collection_type,
    formData.smart_conditions.length,
    addSmartCondition,
  ]);

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a collection title');
      return;
    }

    if (
      formData.collection_type === 'manual' &&
      formData.product_list.length === 0
    ) {
      Alert.alert(
        'Error',
        'Please select at least one product for manual collection',
      );
      return;
    }

    if (formData.collection_type === 'smart') {
      const hasValidConditions = formData.smart_conditions.every(
        condition => condition.field && condition.operator && condition.value,
      );
      if (!hasValidConditions) {
        Alert.alert('Error', 'Please complete all smart collection conditions');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await createCollection(formData);
      Alert.alert('Success', 'Collection created successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Create collection failed:', error);
      Alert.alert('Error', 'Failed to create collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render product item
  const renderProductItem = ({item, onPress, showRemove = false}) => {
    const productImage = item.media?.[0] || null;

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={styles.productImageContainer}>
          {productImage ? (
            <Image
              source={{uri: getFullImageUrl(productImage)}}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Package color={colors.textSecondary} size={20} />
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title || 'Untitled Product'}
          </Text>
          <Text style={styles.productPrice}>PKR {item.price || '0'}</Text>
        </View>

        {showRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={e => {
              e.stopPropagation();
              handleProductRemoval(item.id);
            }}>
            <Trash2 color="#F44336" size={16} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Collection</Text>

        <TouchableOpacity
          style={[styles.headerButton, {backgroundColor: colors.splashGreen}]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter collection title"
              value={formData.title}
              onChangeText={text => updateFormData('title', text)}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter collection description"
              value={formData.description}
              onChangeText={text => updateFormData('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Collection Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Image</Text>

          {formData.collection_images.length > 0 ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{uri: formData.collection_images[0].uri}}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.imageRemoveButton}
                onPress={() => updateFormData('collection_images', [])}>
                <X color={colors.background} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={() => setImageModalVisible(true)}>
              <Camera color={colors.textSecondary} size={24} />
              <Text style={styles.imageUploadText}>Add Collection Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Collection Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Type</Text>

          <View style={styles.radioGroup}>
            {[
              {
                value: 'manual',
                label: 'Manual',
                desc: 'Create and manage your collection manually',
              },
              {
                value: 'smart',
                label: 'Smart',
                desc: 'Automatically update your collection using rules',
              },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => updateFormData('collection_type', option.value)}>
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioButton}>
                    {formData.collection_type === option.value && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                    <Text style={styles.radioDescription}>{option.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Collection - Product Selection */}
        {formData.collection_type === 'manual' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products</Text>

            <View style={styles.productSearchContainer}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setProductSearchModalVisible(true)}>
                <Search color={colors.textSecondary} size={20} />
                <Text style={styles.searchButtonText}>
                  Search for products...
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => setBrowseProductsModalVisible(true)}>
                <Text style={styles.browseButtonText}>Browse</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Products */}
            <View style={styles.selectedProductsContainer}>
              <Text style={styles.subsectionTitle}>
                Selected Products ({formData.product_list.length})
              </Text>

              {formData.product_list.length > 0 ? (
                <FlatList
                  data={formData.product_list}
                  renderItem={({item}) =>
                    renderProductItem({
                      item,
                      onPress: () => {},
                      showRemove: true,
                    })
                  }
                  keyExtractor={item => item.id?.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Package color={colors.textSecondary} size={32} />
                  <Text style={styles.emptyStateText}>
                    No products selected
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Smart Collection - Conditions */}
        {formData.collection_type === 'smart' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Collection Rules</Text>

            {/* Operator Selection */}
            <View style={styles.operatorContainer}>
              <Text style={styles.operatorLabel}>Products must match:</Text>
              <View style={styles.operatorRadioGroup}>
                {[
                  {value: 'all', label: 'All conditions'},
                  {value: 'any', label: 'Any condition'},
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.operatorRadioOption}
                    onPress={() =>
                      updateFormData('smart_operator', option.value)
                    }>
                    <View style={styles.radioButton}>
                      {formData.smart_operator === option.value && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.operatorRadioLabel}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Conditions */}
            <View style={styles.conditionsContainer}>
              <Text style={styles.subsectionTitle}>Conditions</Text>

              {formData.smart_conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <View style={styles.conditionRow}>
                    <TouchableOpacity
                      style={[styles.conditionInput, {flex: 1}]}
                      onPress={() => {
                        setCurrentConditionIndex(index);
                        setFieldModalVisible(true);
                      }}>
                      <Text
                        style={[
                          styles.conditionInputText,
                          !condition.field && {color: colors.textSecondary},
                        ]}>
                        {condition.field
                          ? fieldOptions.find(f => f.value === condition.field)
                              ?.label
                          : 'Select field'}
                      </Text>
                      <ChevronDown color={colors.textSecondary} size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.conditionInput, {flex: 1}]}
                      onPress={() => {
                        if (condition.field) {
                          setCurrentConditionIndex(index);
                          setOperatorModalVisible(true);
                        }
                      }}
                      disabled={!condition.field}>
                      <Text
                        style={[
                          styles.conditionInputText,
                          !condition.operator && {color: colors.textSecondary},
                        ]}>
                        {condition.operator
                          ? operatorOptions[condition.field]?.find(
                              o => o.value === condition.operator,
                            )?.label
                          : 'Select operator'}
                      </Text>
                      <ChevronDown color={colors.textSecondary} size={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.conditionValueRow}>
                    <TextInput
                      style={[styles.textInput, {flex: 1}]}
                      placeholder="Enter value"
                      value={condition.value}
                      onChangeText={text =>
                        updateSmartCondition(index, 'value', text)
                      }
                      placeholderTextColor={colors.textSecondary}
                    />

                    {formData.smart_conditions.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeConditionButton}
                        onPress={() => removeSmartCondition(index)}>
                        <Trash2 color="#F44336" size={16} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addConditionButton}
                onPress={addSmartCondition}>
                <Plus color={colors.splashGreen} size={16} />
                <Text style={styles.addConditionText}>
                  Add another condition
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SEO Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Engine Listing</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Page Title</Text>
            <TextInput
              style={[styles.textInput, {backgroundColor: '#F8F9FA'}]}
              value={formData.page_title}
              editable={false}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meta Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Meta description"
              value={formData.meta_description}
              onChangeText={text =>
                updateFormData('meta_description', text.slice(0, 200))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL Handle</Text>
            <TextInput
              style={styles.textInput}
              placeholder="url-handle"
              value={formData.url_handle}
              onChangeText={text => updateFormData('url_handle', text)}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Image Selection Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imageModal}>
            <Text style={styles.modalTitle}>Add Collection Image</Text>

            <TouchableOpacity
              style={styles.imageModalOption}
              onPress={handleImageSelection}>
              <Camera color={colors.text} size={24} />
              <Text style={styles.imageModalOptionText}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageModalCancel}
              onPress={() => setImageModalVisible(false)}>
              <Text style={styles.imageModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Search Modal */}
      <Modal
        visible={productSearchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductSearchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.productModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Products</Text>
              <TouchableOpacity
                onPress={() => setProductSearchModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search color={colors.textSecondary} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {searchLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.splashGreen} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={({item}) =>
                  renderProductItem({
                    item,
                    onPress: () => handleProductSelection(item),
                  })
                }
                keyExtractor={item => item.id?.toString()}
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No products found
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Browse Products Modal */}
      <Modal
        visible={browseProductsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBrowseProductsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.productModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Browse Products</Text>
              <TouchableOpacity
                onPress={() => setBrowseProductsModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allProducts}
              renderItem={({item}) =>
                renderProductItem({
                  item,
                  onPress: () => handleProductSelection(item),
                })
              }
              keyExtractor={item => item.id?.toString()}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No products available
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Field Selection Modal */}
      <Modal
        visible={fieldModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFieldModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.optionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Field</Text>
              <TouchableOpacity onPress={() => setFieldModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={fieldOptions}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    updateSmartCondition(
                      currentConditionIndex,
                      'field',
                      item.value,
                    );
                    setFieldModalVisible(false);
                  }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value}
            />
          </View>
        </View>
      </Modal>

      {/* Operator Selection Modal */}
      <Modal
        visible={operatorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOperatorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.optionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operator</Text>
              <TouchableOpacity onPress={() => setOperatorModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                currentConditionIndex !== null &&
                formData.smart_conditions[currentConditionIndex]?.field
                  ? operatorOptions[
                      formData.smart_conditions[currentConditionIndex].field
                    ]
                  : []
              }
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    updateSmartCondition(
                      currentConditionIndex,
                      'operator',
                      item.value,
                    );
                    setOperatorModalVisible(false);
                  }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 50,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Image Upload
  imageUploadButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageUploadText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Radio Groups
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.splashGreen,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Product Search
  productSearchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  searchButtonText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  browseButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Selected Products
  selectedProductsContainer: {
    marginTop: 8,
  },

  // Product Items
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  productImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Smart Collection Operator
  operatorContainer: {
    marginBottom: 16,
  },
  operatorLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  operatorRadioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  operatorRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  operatorRadioLabel: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Smart Conditions
  conditionsContainer: {
    gap: 12,
  },
  conditionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionValueRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  conditionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  conditionInputText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  removeConditionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConditionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    gap: 8,
  },
  addConditionText: {
    color: colors.splashGreen,
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imageModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  productModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  optionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Image Modal Options
  imageModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  imageModalOptionText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  imageModalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  imageModalCancelText: {
    fontSize: fontSizes.lg,
    color: '#F44336',
    fontFamily: fonts.regular,
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Option Items
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
});

export default CreateCollectionScreen;
