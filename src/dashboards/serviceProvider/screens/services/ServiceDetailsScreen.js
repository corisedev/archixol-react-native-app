import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  StatusBar,
  FlatList,
} from 'react-native';
import {colors} from '../../../../utils/colors';
import {useNavigation, useRoute} from '@react-navigation/native';

const ServiceDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {service} = route.params || {};
  const [activeTab, setActiveTab] = useState('overview');

  const handleEditService = () => {
    navigation.navigate('AddEditService', {service, isEdit: true});
  };

  const createSectionsData = () => [
    {id: 'tabs', type: 'tabs'},
    {id: 'content', type: 'content'},
  ];

  const renderStickyHeader = () => {
    const statusInfo = getStatusInfo(service.service_status);

    return (
      <View style={styles.stickyHeader}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareService}>
              <Text style={styles.actionButtonText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editActionButton}
              onPress={handleEditService}>
              <Text style={styles.editActionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.serviceTitleContainer}>
            <Text style={styles.serviceTitle}>{service.service_title}</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>🏷️</Text>
              <Text style={styles.serviceCategory}>
                {service.service_category}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {backgroundColor: statusInfo.backgroundColor},
            ]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <Text style={[styles.statusText, {color: statusInfo.textColor}]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'tabs':
        return renderTabs();
      case 'content':
        return renderContent();
      default:
        return null;
    }
  };

  const handleShareService = async () => {
    try {
      const shareMessage =
        `Check out my service: ${service.service_title}\n\nCategory: ${service.service_category}\n\nDescription: ${service.service_description}`.substring(
          0,
          500,
        );

      await Share.share({
        message: shareMessage,
        title: service.service_title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share service');
    }
  };

  const getStatusInfo = status => {
    if (status) {
      return {
        text: 'Active',
        backgroundColor: '#E8F5E9',
        textColor: colors.splashGreen,
        icon: '✅',
      };
    } else {
      return {
        text: 'Inactive',
        backgroundColor: '#FFEBEE',
        textColor: '#F44336',
        icon: '⏸️',
      };
    }
  };

  const renderTabs = () => {
    const tabs = [
      {key: 'overview', label: 'Overview', icon: '📋'},
      {key: 'process', label: 'Process', icon: '🔄'},
      {key: 'features', label: 'Features', icon: '⭐'},
      {key: 'faqs', label: 'FAQs', icon: '❓'},
    ];

    return (
      <View style={styles.tabsContainer}>
        <View style={styles.tabsGrid}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderOverview = () => (
    <View style={styles.contentSection}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>📊 Service Overview</Text>

        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>🏷️</Text>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Category</Text>
              <Text style={styles.overviewValue}>
                {service.service_category || 'General'}
              </Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>📅</Text>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Created</Text>
              <Text style={styles.overviewValue}>
                {service.created_at
                  ? new Date(service.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>📈</Text>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Status</Text>
              <Text
                style={[
                  styles.overviewValue,
                  {
                    color: service.service_status
                      ? colors.splashGreen
                      : '#F44336',
                  },
                ]}>
                {service.service_status ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <Text style={styles.overviewIcon}>🏪</Text>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Tags</Text>
              <Text style={styles.overviewValue}>
                {service.service_tags?.length || 0} tags
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>📝 Description</Text>
        <Text style={styles.description}>
          {service.service_description || 'No description provided'}
        </Text>
      </View>

      {service.service_tags && service.service_tags.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>🏪 Service Tags</Text>
          <View style={styles.tagsContainer}>
            {service.service_tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderProcess = () => (
    <View style={styles.contentSection}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>🔄 Service Process</Text>
        <Text style={styles.cardDescription}>
          Step-by-step process of how this service is delivered
        </Text>
        {service.service_process && service.service_process.length > 0 ? (
          <View style={styles.processContainer}>
            {service.service_process.map((process, index) => (
              <View key={index} style={styles.processStep}>
                <View style={styles.stepIndicator}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  {index < service.service_process.length - 1 && (
                    <View style={styles.stepLine} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Step {index + 1}</Text>
                  <Text style={styles.stepText}>{process.step}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyText}>No process steps defined</Text>
            <Text style={styles.emptySubtext}>
              Add process steps to help clients understand your workflow
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.contentSection}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>⭐ Service Features</Text>
        <Text style={styles.cardDescription}>
          Key features and benefits of this service
        </Text>
        {service.service_feature && service.service_feature.length > 0 ? (
          <View style={styles.featuresGrid}>
            {service.service_feature.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>✓</Text>
                </View>
                <Text style={styles.featureText}>{feature.feature}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No features defined</Text>
            <Text style={styles.emptySubtext}>
              Highlight your service features to attract more clients
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFAQs = () => (
    <View style={styles.contentSection}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>❓ Frequently Asked Questions</Text>
        <Text style={styles.cardDescription}>
          Common questions and answers about this service
        </Text>
        {service.service_faqs && service.service_faqs.length > 0 ? (
          <View style={styles.faqsContainer}>
            {service.service_faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqIcon}>Q</Text>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </View>
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswerLabel}>A</Text>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❓</Text>
            <Text style={styles.emptyText}>No FAQs defined</Text>
            <Text style={styles.emptySubtext}>
              Add FAQs to address common client questions
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'process':
        return renderProcess();
      case 'features':
        return renderFeatures();
      case 'faqs':
        return renderFAQs();
      default:
        return renderOverview();
    }
  };

  if (!service) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>🔍</Text>
        <Text style={styles.errorText}>Service not found</Text>
        <Text style={styles.errorSubtext}>
          The requested service could not be loaded
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderStickyHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    gap: 8,
  },

  // Replace pageHeader with:
  stickyHeader: {
    backgroundColor: colors.background,
    paddingTop: 50, // Status bar space
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

  // Update headerTop to include proper padding:
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pageHeader: {
    backgroundColor: colors.background,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  editActionButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editActionButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  serviceCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  activeTab: {
    borderBottomColor: colors.splashGreen,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.splashGreen,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  overviewGrid: {
    gap: 12,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  overviewIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  overviewContent: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  processContainer: {
    gap: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureIconText: {
    fontSize: 12,
    color: colors.splashGreen,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  faqsContainer: {
    gap: 16,
  },
  faqItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  faqIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.splashGreen,
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqAnswerLabel: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqAnswer: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiceDetailsScreen;
