import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  StatusBar,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  selectPortfolioTemplate,
  getCurrentUserProfile,
} from '../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

const PortfolioTemplatesScreen = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All Category');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPlan, setSelectedPlan] = useState('All Plans');

  const categories = [
    'All Category',
    'Business',
    'Creative',
    'Portfolio',
    'Personal',
  ];
  const types = ['All Types', 'Modern', 'Classic', 'Minimal', 'Colorful'];
  const plans = ['All Plans', 'Free', 'Premium'];

  const createSectionsData = () => [
    {id: 'filters', type: 'filters'},
    {id: 'search', type: 'search'},
    {id: 'results', type: 'results'},
    {id: 'templates', type: 'templates'},
  ];

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'filters':
        return renderFilters();
      case 'search':
        return renderSearch();
      case 'results':
        return renderResultsHeader();
      case 'templates':
        return renderTemplatesGrid();
      default:
        return null;
    }
  };

  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Portfolio Templates</Text>
          <Text style={styles.pageSubtitle}>
            Choose a template that best represents your style
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterTitle}>Categories</Text>
      {renderFilterChip(categories, selectedCategory, setSelectedCategory)}

      <Text style={styles.filterTitle}>Styles</Text>
      {renderFilterChip(types, selectedType, setSelectedType)}

      <Text style={styles.filterTitle}>Plans</Text>
      {renderFilterChip(plans, selectedPlan, setSelectedPlan)}
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search templates..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.textSecondary}
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Text style={styles.clearSearch}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsCount}>
        {filteredTemplates.length} template
        {filteredTemplates.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderTemplatesGrid = () => {
    if (filteredTemplates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyText}>No templates found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your filters or search terms
          </Text>
          <TouchableOpacity
            style={styles.resetFiltersButton}
            onPress={() => {
              setSelectedCategory('All Category');
              setSelectedType('All Types');
              setSelectedPlan('All Plans');
              setSearchQuery('');
            }}>
            <Text style={styles.resetFiltersText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.templatesContainer}>
        <View style={styles.templatesGrid}>
          {filteredTemplates.map(template => renderTemplateCard(template))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    fetchTemplates();
    getCurrentTemplate();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [
    templates,
    searchQuery,
    selectedCategory,
    selectedType,
    selectedPlan,
    filterTemplates,
  ]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Since we don't have the actual API endpoint, we'll use mock data
      // Replace this with actual API call: const data = await getPortfolioTemplates();
      const mockTemplates = [
        {
          id: 1,
          name: 'Default Portfolio',
          description:
            'Elegant template designed for Simple to display their best shots with a minimalist layout.',
          category: 'Portfolio',
          type: 'Minimal',
          plan: 'Free',
          rating: 4.2,
          reviews: 0,
          views: 890,
          preview_image: null,
          is_selected: false,
        },
        {
          id: 2,
          name: 'Modern Web Design Template',
          description:
            'A sleek and responsive portfolio template perfect for showcasing web design projects with a modern aesthetic.',
          category: 'Business',
          type: 'Modern',
          plan: 'Premium',
          rating: 4.8,
          reviews: 0,
          views: 1250,
          preview_image: null,
          is_selected: false,
        },
        {
          id: 3,
          name: 'Creative Showcase',
          description:
            'Perfect for artists and designers to showcase their creative work with dynamic layouts.',
          category: 'Creative',
          type: 'Colorful',
          plan: 'Premium',
          rating: 4.5,
          reviews: 12,
          views: 680,
          preview_image: null,
          is_selected: false,
        },
        {
          id: 4,
          name: 'Business Professional',
          description:
            'Clean and professional template ideal for business professionals and consultants.',
          category: 'Business',
          type: 'Classic',
          plan: 'Free',
          rating: 4.0,
          reviews: 8,
          views: 420,
          preview_image: null,
          is_selected: false,
        },
        {
          id: 5,
          name: 'Photography Focus',
          description:
            'Showcase your photography skills with this image-focused template design.',
          category: 'Creative',
          type: 'Modern',
          plan: 'Premium',
          rating: 4.6,
          reviews: 15,
          views: 920,
          preview_image: null,
          is_selected: false,
        },
        {
          id: 6,
          name: 'Personal Brand',
          description:
            'Perfect for personal branding and individual professionals looking to stand out.',
          category: 'Personal',
          type: 'Minimal',
          plan: 'Free',
          rating: 4.1,
          reviews: 6,
          views: 340,
          preview_image: null,
          is_selected: false,
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      Alert.alert('Error', 'Failed to load portfolio templates');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTemplate = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile && profile.selected_template) {
        setSelectedTemplate(profile.selected_template);
      }
    } catch (error) {
      console.error('Failed to get current template:', error);
    }
  };

  const filterTemplates = React.useCallback(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'All Category') {
      filtered = filtered.filter(
        template => template.category === selectedCategory,
      );
    }

    // Filter by type
    if (selectedType !== 'All Types') {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    // Filter by plan
    if (selectedPlan !== 'All Plans') {
      filtered = filtered.filter(template => template.plan === selectedPlan);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query),
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedType, selectedPlan]);

  const handleSelectTemplate = async templateId => {
    try {
      setSelecting(true);
      await selectPortfolioTemplate(templateId);
      setSelectedTemplate(templateId);

      // Update local state
      setTemplates(prev =>
        prev.map(template => ({
          ...template,
          is_selected: template.id === templateId,
        })),
      );

      Alert.alert('Success', 'Portfolio template updated successfully!');
    } catch (error) {
      console.error('Failed to select template:', error);
      Alert.alert('Error', 'Failed to update portfolio template');
    } finally {
      setSelecting(false);
    }
  };

  const handlePreview = template => {
    // Navigate to preview screen or show preview modal
    Alert.alert(
      'Preview',
      `Preview for ${template.name} - This would show template preview`,
    );
  };

  const renderStars = rating => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }

    return stars.join('');
  };

  const renderFilterChip = (items, selected, onSelect) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterRow}>
      {items.map(item => (
        <TouchableOpacity
          key={item}
          style={[
            styles.filterChip,
            selected === item && styles.filterChipActive,
          ]}
          onPress={() => onSelect(item)}>
          <Text
            style={[
              styles.filterChipText,
              selected === item && styles.filterChipTextActive,
            ]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTemplateCard = template => (
    <View key={template.id} style={styles.templateCard}>
      {/* Template Preview */}
      <View style={styles.templatePreview}>
        <View
          style={[styles.templateImage, {backgroundColor: colors.splashGreen}]}>
          <Text style={styles.templateImageText}>{template.name}</Text>
        </View>
        {selectedTemplate === template.id && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Current</Text>
          </View>
        )}
      </View>

      {/* Template Info */}
      <View style={styles.templateInfo}>
        <Text style={styles.templateName} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {template.description}
        </Text>

        {/* Tags */}
        <View style={styles.templateTags}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{template.category}</Text>
          </View>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{template.type}</Text>
          </View>
        </View>

        {/* Rating and Stats */}
        <View style={styles.templateStats}>
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>{renderStars(template.rating)}</Text>
            <Text style={styles.rating}>{template.rating}</Text>
            <Text style={styles.reviews}>({template.reviews})</Text>
          </View>
          <View style={styles.viewsContainer}>
            <Text style={styles.viewsIcon}>👁</Text>
            <Text style={styles.views}>{template.views}</Text>
          </View>
          <View
            style={[
              styles.planBadge,
              {
                backgroundColor:
                  template.plan === 'Free' ? '#E8F5E9' : '#FFF3E0',
              },
            ]}>
            <Text
              style={[
                styles.planText,
                {
                  color:
                    template.plan === 'Free' ? colors.splashGreen : '#FF9800',
                },
              ]}>
              {template.plan}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => handlePreview(template)}>
            <Text style={styles.previewButtonText}>👁 Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectButton,
              selectedTemplate === template.id && styles.selectedButton,
              selecting && styles.selectButtonDisabled,
            ]}
            onPress={() => handleSelectTemplate(template.id)}
            disabled={selecting || selectedTemplate === template.id}>
            {selecting && selectedTemplate === template.id ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text
                style={[
                  styles.selectButtonText,
                  selectedTemplate === template.id && styles.selectedButtonText,
                ]}>
                {selectedTemplate === template.id
                  ? '✓ Current Template'
                  : 'Select Template'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderStickyHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backButtonText: {
    fontSize: 18,
    color: colors.text,
  },

  headerContent: {
    flex: 1,
  },

  // Add this new style:
  stickyHeader: {
    backgroundColor: colors.background,
    paddingTop: 50, // Status bar space
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },

  // Add this new style:
  flatListContent: {
    paddingBottom: 40,
  },

  // Update existing pageHeader style:
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background,
  },

  // Update existing styles to work better with FlatList:
  filtersContainer: {
    paddingVertical: 16,
    backgroundColor: colors.background,
    marginBottom: 8,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textSecondary,
    padding: 4,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  templatesContainer: {
    paddingHorizontal: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: cardWidth,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templatePreview: {
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  templateImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateImageText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '600',
  },
  templateInfo: {
    padding: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  templateTags: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '500',
  },
  typeTag: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    color: '#7B1FA2',
    fontWeight: '500',
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 10,
    marginRight: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginRight: 2,
  },
  reviews: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  views: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  planBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planText: {
    fontSize: 10,
    fontWeight: '600',
  },
  templateActions: {
    gap: 8,
  },
  previewButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  previewButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  selectButtonDisabled: {
    opacity: 0.7,
  },
  selectButtonText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: colors.splashGreen,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetFiltersButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFiltersText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PortfolioTemplatesScreen;
