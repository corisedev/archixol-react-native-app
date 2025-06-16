import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  Modal,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  X,
  Tag,
  Package,
  DollarSign,
  BarChart3,
  MapPin,
  Search,
  Settings,
  ImageIcon,
  Save,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getProduct,
  updateProduct,
  getSupplierGlobalData,
} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';
import {VITE_API_BASE_URL} from '@env';
import {launchImageLibrary} from 'react-native-image-picker';

const {width} = Dimensions.get('window');

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {productId} = route.params;
  const {backendUrl} = useContext(BackendContext);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Product data
  const [, setProduct] = useState(null);
  const [, setGlobalData] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    compare_at_price: '',
    cost_per_item: '',
    quantity: '',
    min_qty: '',
    weight: '',
    units: '',
    region: '',
    address: '',
    hs_code: '',
    page_title: '',
    meta_description: '',
    url_handle: '',
    status: 'draft',
    physical_product: true,
    track_quantity: true,
    continue_out_of_stock: false,
    tax: false,
    variant_option: false,
    search_tags: [],
    search_collection: [],
    search_vendor: '',
  });

  // Image states
  const [images, setImages] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);

  // Modal states
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tagInput, setTagInput] = useState('');

  // Categories options
  const categories = [
    'electronics',
    'clothing',
    'books',
    'home_garden',
    'sports',
    'toys',
    'beauty',
    'automotive',
    'electrical_components',
    'other',
  ];

  // Status options
  const statusOptions = [
    {label: 'Draft', value: 'draft'},
    {label: 'Active', value: 'active'},
    {label: 'Archived', value: 'archived'},
  ];

  // Get full image URL helper
  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch product and global data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [productResponse, globalResponse] = await Promise.all([
        getProduct({product_id: productId}),
        getSupplierGlobalData(),
      ]);

      console.log('Product Response:', productResponse);
      console.log('Global Data Response:', globalResponse);

      if (productResponse?.product) {
        const productData = productResponse.product;
        setProduct(productData);

        // Set form data
        setFormData({
          title: productData.title || '',
          description: productData.description || '',
          category: productData.category || '',
          price: productData.price?.toString() || '',
          compare_at_price: productData.compare_at_price?.toString() || '',
          cost_per_item: productData.cost_per_item?.toString() || '',
          quantity: productData.quantity?.toString() || '',
          min_qty: productData.min_qty?.toString() || '',
          weight: productData.weight || '',
          units: productData.units || '',
          region: productData.region || '',
          address: productData.address || '',
          hs_code: productData.hs_code || '',
          page_title: productData.page_title || '',
          meta_description: productData.meta_description || '',
          url_handle: productData.url_handle || '',
          status: productData.status || 'draft',
          physical_product: productData.physical_product || false,
          track_quantity: productData.track_quantity || false,
          continue_out_of_stock: productData.continue_out_of_stock || false,
          tax: productData.tax || false,
          variant_option: productData.variant_option || false,
          search_tags: productData.search_tags || [],
          search_collection: productData.search_collection || [],
          search_vendor: productData.search_vendor || '',
        });

        // Set existing images
        if (productData.media && productData.media.length > 0) {
          setExistingImageUrls(productData.media);
          setImages(productData.media.map(url => ({type: 'existing', url})));
        }
      }

      if (globalResponse) {
        setGlobalData(globalResponse);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load product data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image picker
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));

        // Add new images to state
        setNewImages(prev => [...prev, ...selectedImages]);
        setImages(prev => [
          ...prev,
          ...selectedImages.map(img => ({type: 'new', data: img})),
        ]);
      }
    });
  };

  // Remove image
  const removeImage = index => {
    const imageToRemove = images[index];

    if (imageToRemove.type === 'existing') {
      // Remove from existing images
      setExistingImageUrls(prev =>
        prev.filter(url => url !== imageToRemove.url),
      );
    } else if (imageToRemove.type === 'new') {
      // Remove from new images
      setNewImages(prev =>
        prev.filter(img => img.uri !== imageToRemove.data.uri),
      );
    }

    // Remove from main images array
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.search_tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        search_tags: [...prev.search_tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = index => {
    setFormData(prev => ({
      ...prev,
      search_tags: prev.search_tags.filter((_, i) => i !== index),
    }));
  };

  // Calculate profit and margin
  const calculateProfitAndMargin = () => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost_per_item) || 0;

    if (price > 0 && cost > 0) {
      const profit = price - cost;
      const margin = (profit / price) * 100;
      return {profit: profit.toFixed(2), margin: margin.toFixed(1)};
    }
    return {profit: '0.00', margin: '0.0'};
  };

  // Save product
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Product title is required');
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        Alert.alert('Error', 'Valid price is required');
        return;
      }

      setSaving(true);

      // Prepare update data
      const updateData = {
        product_id: productId,
        ...formData,
        price: parseFloat(formData.price) || 0,
        compare_at_price: parseFloat(formData.compare_at_price) || 0,
        cost_per_item: parseFloat(formData.cost_per_item) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
        min_qty: parseInt(formData.min_qty, 10) || 10,
      };

      // Add existing image URLs
      if (existingImageUrls.length > 0) {
        updateData.product_images_urls = existingImageUrls;
      }

      // Add new images
      if (newImages.length > 0) {
        updateData.product_images = newImages;
      }

      console.log('Update Data:', updateData);

      const response = await updateProduct(updateData);
      console.log('Update Response:', response);

      Alert.alert('Success', 'Product updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

  const {profit, margin} = calculateProfitAndMargin();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Product</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Save color={colors.background} size={16} />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Product Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Product Images</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentImageIndex(index);
                      setImageModalVisible(true);
                    }}>
                    <Image
                      source={{
                        uri:
                          image.type === 'existing'
                            ? getFullImageUrl(image.url)
                            : image.data.uri,
                      }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index)}>
                    <X color={colors.background} size={14} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={handleImagePicker}>
                <Plus color={colors.splashGreen} size={24} />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={text => handleInputChange('title', text)}
              placeholder="Enter product title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={text => handleInputChange('description', text)}
              placeholder="Enter product description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category &&
                          styles.selectedCategory,
                      ]}
                      onPress={() => handleInputChange('category', category)}>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formData.category === category &&
                            styles.selectedCategoryText,
                        ]}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusContainer}>
              {statusOptions.map(status => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    formData.status === status.value && styles.selectedStatus,
                  ]}
                  onPress={() => handleInputChange('status', status.value)}>
                  <Text
                    style={[
                      styles.statusOptionText,
                      formData.status === status.value &&
                        styles.selectedStatusText,
                    ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Pricing</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.price}
                onChangeText={text => handleInputChange('price', text)}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Compare At Price</Text>
              <TextInput
                style={styles.textInput}
                value={formData.compare_at_price}
                onChangeText={text =>
                  handleInputChange('compare_at_price', text)
                }
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Cost Per Item</Text>
              <TextInput
                style={styles.textInput}
                value={formData.cost_per_item}
                onChangeText={text => handleInputChange('cost_per_item', text)}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Tax</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={formData.tax}
                  onValueChange={value => handleSwitchChange('tax', value)}
                  trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
                  thumbColor={formData.tax ? colors.background : '#F4F3F4'}
                />
                <Text style={styles.switchLabel}>
                  {formData.tax ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>

          {/* Profit and Margin Display */}
          <View style={styles.profitContainer}>
            <View style={styles.profitItem}>
              <BarChart3 color={colors.splashGreen} size={16} />
              <View>
                <Text style={styles.profitLabel}>Profit</Text>
                <Text style={styles.profitValue}>PKR {profit}</Text>
              </View>
            </View>
            <View style={styles.profitItem}>
              <BarChart3 color={colors.splashGreen} size={16} />
              <View>
                <Text style={styles.profitLabel}>Margin</Text>
                <Text style={styles.profitValue}>{margin}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Inventory</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.textInput}
                value={formData.quantity}
                onChangeText={text => handleInputChange('quantity', text)}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Min Quantity</Text>
              <TextInput
                style={styles.textInput}
                value={formData.min_qty}
                onChangeText={text => handleInputChange('min_qty', text)}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchRowLabel}>Track Quantity</Text>
            <Switch
              value={formData.track_quantity}
              onValueChange={value =>
                handleSwitchChange('track_quantity', value)
              }
              trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
              thumbColor={
                formData.track_quantity ? colors.background : '#F4F3F4'
              }
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchRowLabel}>
              Continue when out of stock
            </Text>
            <Switch
              value={formData.continue_out_of_stock}
              onValueChange={value =>
                handleSwitchChange('continue_out_of_stock', value)
              }
              trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
              thumbColor={
                formData.continue_out_of_stock ? colors.background : '#F4F3F4'
              }
            />
          </View>
        </View>

        {/* Shipping */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Shipping</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchRowLabel}>Physical Product</Text>
            <Switch
              value={formData.physical_product}
              onValueChange={value =>
                handleSwitchChange('physical_product', value)
              }
              trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
              thumbColor={
                formData.physical_product ? colors.background : '#F4F3F4'
              }
            />
          </View>

          {formData.physical_product && (
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Weight</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.weight}
                  onChangeText={text => handleInputChange('weight', text)}
                  placeholder="0.0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Units</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.units}
                  onChangeText={text => handleInputChange('units', text)}
                  placeholder="kg, lbs, etc."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Region</Text>
            <TextInput
              style={styles.textInput}
              value={formData.region}
              onChangeText={text => handleInputChange('region', text)}
              placeholder="Enter region"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={text => handleInputChange('address', text)}
              placeholder="Enter address"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Search Tags</Text>
          </View>

          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.textInput, styles.tagInput]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
              <Plus color={colors.background} size={16} />
              <Text style={styles.addTagText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {formData.search_tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <X color={colors.splashGreen} size={14} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* SEO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Search color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>SEO & Metadata</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Page Title</Text>
            <TextInput
              style={styles.textInput}
              value={formData.page_title}
              onChangeText={text => handleInputChange('page_title', text)}
              placeholder="Enter page title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meta Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.meta_description}
              onChangeText={text => handleInputChange('meta_description', text)}
              placeholder="Enter meta description (max 160 characters)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={160}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.meta_description.length}/160 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL Handle</Text>
            <TextInput
              style={styles.textInput}
              value={formData.url_handle}
              onChangeText={text => handleInputChange('url_handle', text)}
              placeholder="product-url-handle"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>HS Code</Text>
            <TextInput
              style={styles.textInput}
              value={formData.hs_code}
              onChangeText={text => handleInputChange('hs_code', text)}
              placeholder="Enter HS code"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Variants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Product Options</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchRowLabel}>Has Variants</Text>
            <Switch
              value={formData.variant_option}
              onValueChange={value =>
                handleSwitchChange('variant_option', value)
              }
              trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
              thumbColor={
                formData.variant_option ? colors.background : '#F4F3F4'
              }
            />
          </View>

          {formData.variant_option && (
            <View style={styles.variantInfo}>
              <Text style={styles.variantInfoText}>
                Variant management will be available in the next update
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}>
            <X color={colors.background} size={20} />
          </TouchableOpacity>

          {images.length > 0 && (
            <Image
              source={{
                uri:
                  images[currentImageIndex]?.type === 'existing'
                    ? getFullImageUrl(images[currentImageIndex].url)
                    : images[currentImageIndex]?.data?.uri,
              }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
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
    borderBottomColor: '#E5E5E5',
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Form Elements
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Categories
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: colors.splashGreen + '20',
    borderColor: colors.splashGreen,
  },
  categoryOptionText: {
    fontSize: fontSizes.xs,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  selectedCategoryText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Status
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatus: {
    backgroundColor: colors.splashGreen + '20',
    borderColor: colors.splashGreen,
  },
  statusOptionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  selectedStatusText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Switches
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  switchLabel: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchRowLabel: {
    fontSize: fontSizes.base,
    color: colors.text,
    flex: 1,
    fontFamily: fonts.regular,
  },

  // Profit Display
  profitContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    gap: 20,
  },
  profitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  profitValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },

  // Images
  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 12,
  },
  imageItem: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.splashGreen,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Tags
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  addTagText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Character Count
  characterCount: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: fonts.regular,
  },

  // Variant Info
  variantInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  variantInfoText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },

  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});

export default EditProductScreen;
