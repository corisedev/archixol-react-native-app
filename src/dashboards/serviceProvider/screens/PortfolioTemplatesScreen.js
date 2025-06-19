import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  FlatList,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Star,
  Grid3X3,
  List,
  Download,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {selectProfile} from '../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';

const PortfolioTemplatesScreen = () => {
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all_category');
  const [activeType, setActiveType] = useState('all_types');
  const [activePlan, setActivePlan] = useState('all_plans');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentUserTemplate, setCurrentUserTemplate] =
    useState('DefaultTemplate'); // Mock current template
  const [selectLoading, setSelectLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const navigation = useNavigation();

  // Mock portfolio templates data
  const portfolioTemplates = React.useMemo(
    () => [
      {
        id: 3,
        img: 'https://dummyimage.com/600x400/22c55e/FFF&text=Default+Portfolio',
        title: 'Default Portfolio',
        description:
          'Elegant template designed for Simple to display their best shots with a minimalist layout.',
        views: 890,
        plan: 'Free',
        rating: 4.2,
        category: 'home_renovation',
        template_name: 'DefaultTemplate',
      },
      {
        id: 2,
        img: 'https://dummyimage.com/600x400/22c55e/FFF&text=Web+Design+Portfolio',
        title: 'Modern Web Design Template',
        description:
          'A sleek and responsive portfolio template perfect for showcasing web design projects with a modern aesthetic.',
        views: 1250,
        plan: 'Premium',
        rating: 4.8,
        category: 'construction',
        template_name: 'ModernTemplate',
      },
      {
        id: 4,
        img: 'https://dummyimage.com/600x400/3b82f6/FFF&text=Professional+Template',
        title: 'Professional Business Template',
        description:
          'Clean and professional template ideal for business portfolios and corporate presentations.',
        views: 2100,
        plan: 'Pro',
        rating: 4.9,
        category: 'electrical',
        template_name: 'ProfessionalTemplate',
      },
      {
        id: 5,
        img: 'https://dummyimage.com/600x400/8b5cf6/FFF&text=Creative+Portfolio',
        title: 'Creative Artist Portfolio',
        description:
          'Vibrant and creative template designed for artists and creative professionals to showcase their work.',
        views: 1800,
        plan: 'Premium',
        rating: 4.6,
        category: 'plumbing',
        template_name: 'CreativeTemplate',
      },
      {
        id: 6,
        img: 'https://dummyimage.com/600x400/ef4444/FFF&text=Minimal+Template',
        title: 'Minimal Clean Template',
        description:
          'Ultra-minimal template focusing on content with clean lines and plenty of white space.',
        views: 950,
        plan: 'Free',
        rating: 4.3,
        category: 'home_renovation',
        template_name: 'MinimalTemplate',
      },
    ],
    [],
  );

  const categories = [
    {value: 'all_category', label: 'All Category'},
    {value: 'construction', label: 'Construction'},
    {value: 'electrical', label: 'Electrical'},
    {value: 'plumbing', label: 'Plumbing'},
    {value: 'home_renovation', label: 'Home Renovation'},
  ];

  const types = [
    {value: 'all_types', label: 'All Types'},
    {value: 'trending', label: 'Trending'},
    {value: 'most_used', label: 'Most Used'},
    {value: 'top_rated', label: 'Top Rated'},
  ];

  const plans = [
    {value: 'all_plans', label: 'All Plans'},
    {value: 'free', label: 'Free'},
    {value: 'premium', label: 'Premium'},
    {value: 'pro', label: 'Pro'},
  ];

  // Initialize templates
  useEffect(() => {
    setTemplates(portfolioTemplates);
    setFilteredTemplates(portfolioTemplates);
  }, [portfolioTemplates]);

  // Filter templates
  const filterTemplates = useCallback(() => {
    let filtered = [...templates];

    // Filter by search term
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        template =>
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by category
    if (activeCategory !== 'all_category') {
      filtered = filtered.filter(
        template =>
          template.category.toLowerCase() === activeCategory.toLowerCase(),
      );
    }

    // Filter by plan
    if (activePlan !== 'all_plans') {
      filtered = filtered.filter(
        template => template.plan.toLowerCase() === activePlan.toLowerCase(),
      );
    }

    // Sort by type
    switch (activeType) {
      case 'trending':
      case 'most_used':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'top_rated':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, activeCategory, activePlan, activeType]);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Handle template selection
  const handleSelectTemplate = async templateName => {
    try {
      setSelectLoading(true);

      // Call API to select template
      const response = await selectProfile(templateName);

      if (response.data) {
        setCurrentUserTemplate(templateName);
        Alert.alert('Success', 'Template applied successfully!');
      }
    } catch (error) {
      console.error('Failed to select template:', error);
      Alert.alert('Error', 'Failed to apply template. Please try again.');
    } finally {
      setSelectLoading(false);
    }
  };

  // Handle preview template
  const handlePreviewTemplate = template => {
    // Navigate to preview screen or show preview modal
    Alert.alert(
      'Preview',
      `Preview for ${template.title} - Feature coming soon!`,
    );
  };

  // Format number for views
  const formatNumber = num => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Render rating stars
  const renderRating = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i < fullStars ? '#FFD700' : colors.textSecondary}
          fill={i < fullStars ? '#FFD700' : 'transparent'}
        />,
      );
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>{stars}</View>
        <Text style={styles.ratingText}>
          {rating ? rating.toFixed(1) : '0.0'}
        </Text>
      </View>
    );
  };

  // Render plan badge
  const renderPlanBadge = plan => {
    const badgeColors = {
      Free: '#10B981',
      Premium: '#F59E0B',
      Pro: '#8B5CF6',
    };

    return (
      <View
        style={[styles.planBadge, {backgroundColor: badgeColors[plan] + '20'}]}>
        <Text style={[styles.planText, {color: badgeColors[plan]}]}>
          {plan}
        </Text>
      </View>
    );
  };

  // Render template item for grid view
  const renderTemplateGridItem = ({item}) => {
    const isSelected = currentUserTemplate === item.template_name;

    return (
      <View style={styles.gridCard}>
        <View style={styles.gridImageContainer}>
          <Image
            source={{uri: item.img}}
            style={styles.gridImage}
            resizeMode="cover"
          />
          {isSelected && (
            <View style={styles.selectedBadge}>
              <CheckCircle
                color={colors.background}
                size={20}
                fill={colors.splashGreen}
              />
            </View>
          )}
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.gridDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.gridMeta}>
            {renderRating(item.rating)}
            <View style={styles.viewsContainer}>
              <Eye color={colors.textSecondary} size={12} />
              <Text style={styles.viewsText}>{formatNumber(item.views)}</Text>
            </View>
            {renderPlanBadge(item.plan)}
          </View>

          <View style={styles.gridActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => handlePreviewTemplate(item)}>
              <Eye color={colors.splashGreen} size={16} />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>

            {isSelected ? (
              <View style={styles.selectedButton}>
                <CheckCircle color={colors.background} size={16} />
                <Text style={styles.selectedButtonText}>Selected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectTemplate(item.template_name)}
                disabled={selectLoading}>
                {selectLoading ? (
                  <Loader2 color={colors.background} size={16} />
                ) : (
                  <Download color={colors.background} size={16} />
                )}
                <Text style={styles.selectButtonText}>
                  {selectLoading ? 'Applying...' : 'Select'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render template item for list view
  const renderTemplateListItem = ({item}) => {
    const isSelected = currentUserTemplate === item.template_name;

    return (
      <View style={styles.listCard}>
        <View style={styles.listImageContainer}>
          <Image
            source={{uri: item.img}}
            style={styles.listImage}
            resizeMode="cover"
          />
          {isSelected && (
            <View style={styles.selectedBadgeList}>
              <CheckCircle
                color={colors.background}
                size={16}
                fill={colors.splashGreen}
              />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {renderPlanBadge(item.plan)}
          </View>

          <Text style={styles.listDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.listMeta}>
            {renderRating(item.rating)}
            <View style={styles.viewsContainer}>
              <Eye color={colors.textSecondary} size={12} />
              <Text style={styles.viewsText}>{formatNumber(item.views)}</Text>
            </View>
          </View>

          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.previewButtonSmall}
              onPress={() => handlePreviewTemplate(item)}>
              <Eye color={colors.splashGreen} size={14} />
            </TouchableOpacity>

            {isSelected ? (
              <View style={styles.selectedButtonSmall}>
                <CheckCircle color={colors.background} size={14} />
                <Text style={styles.selectedButtonSmallText}>Selected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButtonSmall}
                onPress={() => handleSelectTemplate(item.template_name)}
                disabled={selectLoading}>
                {selectLoading ? (
                  <Loader2 color={colors.background} size={14} />
                ) : (
                  <Download color={colors.background} size={14} />
                )}
                <Text style={styles.selectButtonSmallText}>Select</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Templates</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.filterOption,
                      activeCategory === category.value &&
                        styles.activeFilterOption,
                    ]}
                    onPress={() => setActiveCategory(category.value)}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        activeCategory === category.value &&
                          styles.activeFilterOptionText,
                      ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              <View style={styles.filterOptions}>
                {types.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.filterOption,
                      activeType === type.value && styles.activeFilterOption,
                    ]}
                    onPress={() => setActiveType(type.value)}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        activeType === type.value &&
                          styles.activeFilterOptionText,
                      ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Plan Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Plan</Text>
              <View style={styles.filterOptions}>
                {plans.map(plan => (
                  <TouchableOpacity
                    key={plan.value}
                    style={[
                      styles.filterOption,
                      activePlan === plan.value && styles.activeFilterOption,
                    ]}
                    onPress={() => setActivePlan(plan.value)}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        activePlan === plan.value &&
                          styles.activeFilterOptionText,
                      ]}>
                      {plan.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setActiveCategory('all_category');
                setActiveType('all_types');
                setActivePlan('all_plans');
              }}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Portfolio Templates</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? (
              <List color={colors.text} size={20} />
            ) : (
              <Grid3X3 color={colors.text} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Templates List/Grid */}
      {filteredTemplates.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Grid3X3 color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Templates Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No templates available at the moment'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={
            viewMode === 'grid'
              ? renderTemplateGridItem
              : renderTemplateListItem
          }
          keyExtractor={item => item.id?.toString()}
          numColumns={1} // 👈 Only one card per row
          key={viewMode}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
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
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List Container
  listContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },

  // Grid View Styles
  gridCard: {
    width: '100%', // Add this

    backgroundColor: colors.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    padding: 16,
  },
  gridTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  gridDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  gridActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // List View Styles
  listCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 16,
    overflow: 'hidden',
  },
  listImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadgeList: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  listDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Views
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Plan Badge
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Buttons
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  previewButtonText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
  previewButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  selectButtonText: {
    fontSize: fontSizes.sm,
    color: colors.background,
    fontFamily: fonts.semiBold,
  },
  selectButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  selectButtonSmallText: {
    fontSize: fontSizes.xs,
    color: colors.background,
    fontFamily: fonts.semiBold,
  },
  selectedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  selectedButtonText: {
    fontSize: fontSizes.sm,
    color: colors.background,
    fontFamily: fonts.semiBold,
  },
  selectedButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  selectedButtonSmallText: {
    fontSize: fontSizes.xs,
    color: colors.background,
    fontFamily: fonts.semiBold,
  },

  // Empty State
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    fontFamily: fonts.regular,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activeFilterOption: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  filterOptionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  activeFilterOptionText: {
    color: colors.background,
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  resetButtonText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: fontSizes.base,
    color: colors.background,
    fontFamily: fonts.semiBold,
  },
});

export default PortfolioTemplatesScreen;
