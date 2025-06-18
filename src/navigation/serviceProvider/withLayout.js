import React, {useState, useEffect, useCallback} from 'react';
import Layout from '../../dashboards/serviceProvider/components/Layout';
import {useNavigation, useRoute} from '@react-navigation/native';

const withLayout = (ScreenComponent, options = {}) => {
  return props => {
    const navigation = useNavigation();
    const route = useRoute();
    const [active, setActive] = useState(options.defaultTab || 'Home');

    // Route name se active tab set karo - ESLint warning fix
    useEffect(() => {
      const routeToTab = {
        ServiceProviderDashboard: 'Home', // Updated route name
        JobsScreen: 'Jobs',
        OrdersScreen: 'Orders',
        MessagesScreen: 'Messages',
        ProfileScreen: 'Profile', // Updated route name
      };

      const currentTab = routeToTab[route.name];
      if (currentTab && currentTab !== active) {
        setActive(currentTab);
      }
    }, [route.name, active]); // ✅ active dependency add kiya

    // useCallback se optimize karo to prevent unnecessary re-renders
    const handleTabChange = useCallback(
      tab => {
        console.log('ServiceProvider Tab changing to:', tab);
        setActive(tab);

        if (options.navigation && tab !== active) {
          const routeMap = {
            Home: 'ServiceProviderDashboard', // Updated route name
            Jobs: 'JobsScreen',
            Orders: 'OrdersScreen',
            Messages: 'MessagesScreen',
            Profile: 'ProfileScreen', // Updated route name
          };

          const routeName = routeMap[tab];
          if (routeName && navigation?.navigate) {
            navigation.navigate(routeName);
          }
        }
      },
      [active, navigation], // Removed options.navigation dependency as per React Hook rules
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
