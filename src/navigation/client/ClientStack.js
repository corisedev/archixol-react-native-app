import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import withLayout from './withLayout';

// Client Main Tab Screens
import HomeScreen from '../../dashboards/client/screens/HomeScreen';
import JobsScreen from '../../dashboards/client/screens/JobsScreen';
import OrdersScreen from '../../dashboards/client/screens/OrdersScreen';
import MessagesScreen from '../../dashboards/client/screens/MessagesScreen';
import ProfileScreen from '../../dashboards/client/screens/ProfileScreen';
import MyProjectsScreen from '../../dashboards/client/screens/MyProjectsScreen';
import ProductsScreen from '../../dashboards/client/screens/ProductsScreen';
import ServicesScreen from '../../dashboards/client/screens/ServicesScreen';

// Detail Screens (without layout)
import NotificationsScreen from '../../dashboards/client/screens/NotificationsScreen';
import PostJobScreen from '../../dashboards/client/screens/PostJobScreen';
import CreateProjectScreen from '../../dashboards/client/screens/CreateProjectScreen';
import JobDetailScreen from '../../dashboards/client/screens/JobDetailScreen';
import ServiceDetailsScreen from '../../dashboards/client/screens/ServiceDetailsScreen';
import ProductDetailsScreen from '../../dashboards/client/screens/ProductDetailsScreen';
import CreateJobScreen from '../../dashboards/client/screens/CreateJobScreen';
import OrderDetailScreen from '../../dashboards/client/screens/OrderDetailScreen';

const Stack = createStackNavigator();

const ClientStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ClientDashboard"
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: '#F8F9FA'},
        cardStyleInterpolator: ({current, layouts}) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}>
      {/* ===== MAIN TAB SCREENS (Bottom Navigation) ===== */}
      <Stack.Screen
        name="ClientDashboard"
        component={withLayout(HomeScreen, {
          defaultTab: 'Home',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="JobsScreen"
        component={withLayout(JobsScreen, {
          defaultTab: 'Jobs',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="MyProjectsScreen"
        component={withLayout(MyProjectsScreen, {
          defaultTab: 'Projects',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="OrdersScreen"
        component={withLayout(OrdersScreen, {
          defaultTab: 'Orders',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="MessagesScreen"
        component={withLayout(MessagesScreen, {
          defaultTab: 'Messages',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ProfileScreen"
        component={withLayout(ProfileScreen, {
          defaultTab: 'Profile',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ProductsScreen"
        component={withLayout(ProductsScreen, {
          defaultTab: 'Products',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ServicesScreen"
        component={withLayout(ServicesScreen, {
          defaultTab: 'Services',
          navigation: true,
          showBottomNav: true,
        })}
      />

      {/* ===== DETAIL SCREENS (No Bottom Navigation) ===== */}

      {/* Notification Screens */}
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
      />

      {/* Job Related Screens */}
      <Stack.Screen name="PostJobScreen" component={PostJobScreen} />
      <Stack.Screen name="CreateJobScreen" component={CreateJobScreen} />
      <Stack.Screen name="JobDetailScreen" component={JobDetailScreen} />

      <Stack.Screen name="OrderDetailScreen" component={OrderDetailScreen} />

      {/* Project Related Screens */}
      <Stack.Screen
        name="CreateProjectScreen"
        component={CreateProjectScreen}
      />

      {/* Service Related Screens */}
      <Stack.Screen
        name="ServiceDetailsScreen"
        component={ServiceDetailsScreen}
      />

      {/* Product Related Screens */}
      <Stack.Screen
        name="ProductDetailsScreen"
        component={ProductDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default ClientStack;
