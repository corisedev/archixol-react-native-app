import {createStackNavigator} from '@react-navigation/stack';
import withLayout from './withLayout';

// Client Main Tab Screens
import HomeScreen from '../../dashboards/client/screens/HomeScreen';
import JobsScreen from '../../dashboards/client/screens/JobsScreen';
import OrdersScreen from '../../dashboards/client/screens/OrdersScreen';
import MessagesScreen from '../../dashboards/client/screens/MessagesScreen';
import ProfileScreen from '../../dashboards/client/screens/ProfileScreen';
import MyProjectsScreen from '../../dashboards/client/screens/MyProjectsScreen';
import NotificationsScreen from '../../dashboards/client/screens/NotificationsScreen';
import ProductsScreen from '../../dashboards/client/screens/ProductsScreen';
import ServicesScreen from '../../dashboards/client/screens/ServicesScreen';
import PostJobScreen from '../../dashboards/client/screens/PostJobScreen';
import CreateProjectScreen from '../../dashboards/client/screens/CreateProjectScreen';
import JobDetailsScreen from '../../dashboards/client/screens/JobDetailsScreen';
import ServiceDetailsScreen from '../../dashboards/client/screens/ServiceDetailsScreen';
import ProductDetailsScreen from '../../dashboards/client/screens/ProductDetailsScreen';

const Stack = createStackNavigator();

const ClientStack = () => {
  const screens = [
    // ===== MAIN TAB SCREENS (Bottom Navigation) =====
    {
      name: 'DashboardMain',
      component: withLayout(HomeScreen, {
        defaultTab: 'Home',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'JobsScreen',
      component: withLayout(JobsScreen, {
        defaultTab: 'Jobs',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'MyProjectsScreen',
      component: withLayout(MyProjectsScreen, {
        defaultTab: 'Projects',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'OrdersScreen',
      component: withLayout(OrdersScreen, {
        defaultTab: 'Orders',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'MessagesScreen',
      component: withLayout(MessagesScreen, {
        defaultTab: 'Messages',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'Profile',
      component: withLayout(ProfileScreen, {
        defaultTab: 'Profile',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'ProductsScreen',
      component: withLayout(ProductsScreen, {
        defaultTab: 'Products',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'ServicesScreen',
      component: withLayout(ServicesScreen, {
        defaultTab: 'Services',
        navigation: true,
        showBottomNav: true,
      }),
    },
    {
      name: 'PostJobScreen',
      component: PostJobScreen, // 👉 Use component directly without withLayout
    },
    {
      name: 'CreateProjectScreen',
      component: CreateProjectScreen, // 👉 Use component directly without withLayout
    },
    {
      name: 'JobDetailsScreen',
      component: JobDetailsScreen, // 👉 Use component directly without withLayout
    },
     {
      name: 'ServiceDetailsScreen',
      component: ServiceDetailsScreen, // 👉 Use component directly without withLayout
    },
     {
      name: 'ProductDetailsScreen',
      component: ProductDetailsScreen, // 👉 Use component directly without withLayout
    },

    // ===== SECONDARY TAB SCREENS (Can be accessed from main tabs) =====
    {
      name: 'NotificationsScreen',
      component: withLayout(NotificationsScreen, {
        defaultTab: 'Home',
        navigation: true,
        showBottomNav: true,
      }),
    },
  ];

  return (
    <Stack.Navigator
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
      {screens.map(({name, component}) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export default ClientStack;
