import React, {useState, useEffect, useCallback} from 'react';
import SupplierLayout from '../../dashboards/supplier/components/Layout';
import {useNavigation, useRoute} from '@react-navigation/native';

const withSupplierLayout = (ScreenComponent, options = {}) => {
  return props => {
    const navigation = useNavigation();
    const route = useRoute();
    const [active, setActive] = useState(options.defaultTab || 'Home');

    // Route name se active tab set karo - ESLint warning fix
    useEffect(() => {
      const routeToTab = {
        SupplierDashboard: 'Home',
        ProductsScreen: 'Products',
        OrdersScreen: 'Orders',
        ProfileScreen: 'Profile',
      };

      const currentTab = routeToTab[route.name];
      if (currentTab) {
        setActive(currentTab);
      }
    }, [route.name]); // ✅

    // useCallback se optimize karo to prevent unnecessary re-renders
    const handleTabChange = useCallback(
      tab => {
        console.log('Supplier Tab changing to:', tab);
        setActive(tab);

        if (options.navigation && tab !== active) {
          const routeMap = {
            Home: 'SupplierDashboard',
            Products: 'ProductsScreen',
            Orders: 'OrdersScreen',
            Profile: 'ProfileScreen',
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
    console.log('withSupplierLayout rendering:', {
      screenName: ScreenComponent.name,
      showBottomNav: options.showBottomNav,
      active,
      routeName: route.name,
    });

    return (
      <SupplierLayout
        active={active}
        setActive={handleTabChange}
        showBottomNav={options.showBottomNav !== false}
        showHeader={options.showHeader !== false}
        scrollable={options.scrollable !== false}
        contentPadding={options.contentPadding !== false}>
        <ScreenComponent {...props} />
      </SupplierLayout>
    );
  };
};

export default withSupplierLayout;
