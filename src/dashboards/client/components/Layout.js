import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
} from 'react-native';
import Header from './Header';
import BottomNav from './BottomNav';
import {colors} from '../../../utils/colors';

const Layout = ({
  children,
  setActive,
  active,
  showHeader = true,
  showBottomNav = true,
  scrollable = true,
  contentPadding = true,
}) => {
  // Debug logs
  console.log('Client Layout Props:', {
    showHeader,
    showBottomNav,
    active,
    childrenType: children?.type?.name,
  });

  // Client screens that use FlatList or have custom scrolling
  const flatListScreens = [
    'HomeScreen',
    'JobsScreen',
    'MyProjectsScreen',
    'OrdersScreen',
    'MessagesScreen',
    'NotificationsScreen',
    'ProfileScreen',
    'BrowseProductsScreen',
    'BrowseServicesScreen',
    'ServiceProvidersScreen',
    'SearchScreen',
    'FavoritesScreen',
    'PaymentHistoryScreen',
    'ConversationScreen',
  ];

  // Screens that need no padding (full width content)
  const noPaddingScreens = [
    'ConversationScreen',
    'MessagesScreen',
    'SearchScreen',
    'BrowseProductsScreen',
    'BrowseServicesScreen',
  ];

  // Screens that should not be scrollable (handle their own scrolling)
  const nonScrollableScreens = [
    'ConversationScreen',
    'MessagesScreen',
    'MyProjectsScreen', // Grid layout handles its own scrolling
    'SearchScreen',
  ];

  const childName = children?.type?.name || children?.props?.screenName;

  const isFlatListScreen =
    flatListScreens.includes(childName) ||
    children?.type?.displayName === 'FlatList' ||
    children?.props?.ListHeaderComponent !== undefined ||
    nonScrollableScreens.includes(childName) ||
    !scrollable;

  const shouldRemovePadding =
    noPaddingScreens.includes(childName) || !contentPadding;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background || '#FFFFFF'}
        translucent={false}
      />
      <View style={styles.wrapper}>
        {showHeader && <Header />}

        {isFlatListScreen ? (
          <View
            style={[
              styles.contentContainer,
              shouldRemovePadding && styles.noPadding,
            ]}>
            {children}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              showBottomNav && styles.scrollContentWithBottomNav,
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
            keyboardShouldPersistTaps="handled">
            <View
              style={[
                styles.contentContainer,
                shouldRemovePadding && styles.noPadding,
                !showBottomNav && styles.contentContainerNoBottomNav,
              ]}>
              {children}
            </View>
          </ScrollView>
        )}

        {/* Bottom Navigation */}
        {showBottomNav && (
          <View style={styles.bottomNavContainer}>
            <BottomNav
              active={active || 'Home'}
              setActive={setActive || (() => {})}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#FFFFFF',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWithBottomNav: {
    paddingBottom: 110, // Extra space for 6-tab bottom nav
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0, // Let screens handle their own top padding
  },
  contentContainerNoBottomNav: {
    paddingBottom: 20, // Normal padding when no bottom nav
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default Layout;
