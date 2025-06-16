import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import {colors} from '../utils/colors';
import Logo from '../components/Logo';

const WelcomeScreen = ({navigation}) => {
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);

  const userTypes = [
    {
      id: 'service_provider',
      title: 'Service Provider',
      subtitle: 'Offer your professional services',
      icon: '🔧',
      color: '#4CAF50',
      description:
        'Architects, contractors, electricians, plumbers and other professionals',
    },
    {
      id: 'supplier',
      title: 'Supplier',
      subtitle: 'Sell construction materials',
      icon: '🏪',
      color: '#2196F3',
      description:
        'Cement, tiles, paint, fittings and building materials suppliers',
    },
    {
      id: 'user',
      title: 'Home Owner',
      subtitle: 'Build or renovate your dream home',
      icon: '🏠',
      color: '#FF9800',
      description:
        'Find professionals and materials for your construction needs',
    },
  ];

  const handleUserTypeSelect = type => {
    setSelectedUserType(type);
    setShowUserTypeModal(false);
    // Navigate to appropriate dashboard based on user type
    // navigation.navigate(`${type.id}Dashboard`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo size={50} color={colors.splashGreen} />
            <Text style={styles.appName}>ArchiXol</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to ArchiXol!</Text>
          <Text style={styles.welcomeSubtitle}>
            Your one-stop platform for all construction needs
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowUserTypeModal(true)}>
            <View
              style={[
                styles.actionIcon,
                {backgroundColor: colors.splashGreen},
              ]}>
              <Text style={styles.actionIconText}>🏗️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Choose Your Role</Text>
              <Text style={styles.actionDescription}>
                Select whether you're a service provider, supplier, or home
                owner
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, {backgroundColor: '#FF9800'}]}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Browse Projects</Text>
              <Text style={styles.actionDescription}>
                Explore ongoing construction projects in your area
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, {backgroundColor: '#2196F3'}]}>
              <Text style={styles.actionIconText}>🛒</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Shop Materials</Text>
              <Text style={styles.actionDescription}>
                Browse construction materials from verified suppliers
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, {backgroundColor: '#9C27B0'}]}>
              <Text style={styles.actionIconText}>👥</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Find Professionals</Text>
              <Text style={styles.actionDescription}>
                Connect with skilled service providers for your project
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              'Architecture',
              'Interior',
              'Plumbing',
              'Electrical',
              'Painting',
            ].map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>
                  {['🏛️', '🛋️', '🔧', '💡', '🎨'][index]}
                </Text>
                <Text style={styles.categoryName}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Role</Text>
            <Text style={styles.modalSubtitle}>
              Select how you want to use ArchiXol
            </Text>

            {userTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.userTypeCard, {borderLeftColor: type.color}]}
                onPress={() => handleUserTypeSelect(type)}>
                <View
                  style={[
                    styles.userTypeIcon,
                    {backgroundColor: type.color + '20'},
                  ]}>
                  <Text style={styles.userTypeIconText}>{type.icon}</Text>
                </View>
                <View style={styles.userTypeContent}>
                  <Text style={styles.userTypeTitle}>{type.title}</Text>
                  <Text style={styles.userTypeDescription}>
                    {type.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUserTypeModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.splashGreen,
    marginLeft: 10,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  featuredSection: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    width: 100,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  userTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTypeIconText: {
    fontSize: 30,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
