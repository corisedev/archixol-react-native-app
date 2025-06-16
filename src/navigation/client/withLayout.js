import React, {useState, useEffect, useCallback} from 'react';
import Layout from '../../dashboards/client/components/Layout';
import {useNavigation, useRoute} from '@react-navigation/native';

const withLayout = (ScreenComponent, options = {}) => {
  return props => {
    const navigation = useNavigation();
    const route = useRoute();
    const [active, setActive] = useState(options.defaultTab || 'Home');

    // Route name se active tab set karo - ESLint warning fix
    useEffect(() => {
      const routeToTab = {
        DashboardMain: 'Home',
        JobsScreen: 'Jobs',
        MyProjectsScreen: 'Projects',
        OrdersScreen: 'Orders',
        MessagesScreen: 'Messages',
        Profile: 'Profile',
        NotificationsScreen: 'Home',
        FavoritesScreen: 'Profile',
        PaymentHistoryScreen: 'Orders',
        BrowseProductsScreen: 'Home',
        BrowseServicesScreen: 'Home',
        ServiceProvidersScreen: 'Home',
        SearchScreen: 'Home',
        Settings: 'Profile',
      };

      const currentTab = routeToTab[route.name];
      if (currentTab) {
        setActive(currentTab);
      }
    }, [route.name]); // ✅

    // useCallback se optimize karo to prevent unnecessary re-renders
    const handleTabChange = useCallback(
      tab => {
        console.log('Tab changing to:', tab);
        setActive(tab);

        if (options.navigation && tab !== active) {
          const routeMap = {
            Home: 'DashboardMain',
            Jobs: 'JobsScreen',
            Projects: 'MyProjectsScreen',
            Orders: 'OrdersScreen',
            Messages: 'MessagesScreen',
            Profile: 'Profile',
            Services: 'Services', // ✅ Add this line
          };

          const routeName = routeMap[tab];
          if (routeName && navigation?.navigate) {
            navigation.navigate(routeName);
          }
        }
      },
      [active, navigation],
    ); // ✅ All dependencies included

    // Debug log
    console.log('withLayout rendering:', {
      screenName: ScreenComponent.name,
      showBottomNav: options.showBottomNav,
      active,
      routeName: route.name,
    });

    return (
      <Layout
        active={active}
        setActive={handleTabChange}
        showBottomNav={options.showBottomNav !== false}
        showHeader={options.showHeader !== false}
        scrollable={options.scrollable !== false}
        contentPadding={options.contentPadding !== false}>
        <ScreenComponent {...props} />
      </Layout>
    );
  };
};

export default withLayout;
