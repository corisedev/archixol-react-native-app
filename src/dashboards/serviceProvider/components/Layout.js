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
  console.log('Layout Props:', {
    showHeader,
    showBottomNav,
    active,
    childrenType: children?.type?.name,
  });

  const flatListScreens = [
    'JobsScreen',
    'MessagesScreen',
    'OrdersScreen',
    'ProfileScreen',
    'PortfolioTemplatesScreen',
    'ServicesScreen',
    'ManageCertificatesScreen',
    'ManageProjectsScreen',
  ];

  const childName = children?.type?.name || children?.props?.screenName;
  const isFlatListScreen =
    flatListScreens.includes(childName) ||
    children?.type?.displayName === 'FlatList' ||
    children?.props?.ListHeaderComponent !== undefined ||
    !scrollable;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.wrapper}>
        {showHeader && <Header />}

        {isFlatListScreen ? (
          <View
            style={[
              styles.contentContainer,
              !contentPadding && styles.noPadding,
            ]}>
            {children}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always">
            <View
              style={[
                styles.contentContainer,
                !contentPadding && styles.noPadding,
              ]}>
              {children}
            </View>
          </ScrollView>
        )}

        {/* Force show bottom nav for debugging */}
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
    paddingBottom: 100, // Bottom nav ke liye space
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Bottom nav ke liye space
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 100, // Bottom nav ke liye space maintain karo
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default Layout;
