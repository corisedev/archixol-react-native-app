import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import withLayout from './withLayout';

// Service Provider Screens
import ApplyOnJobScreen from '../../dashboards/serviceProvider/screens/ApplyOnJobScreen';
import ConversationScreen from '../../dashboards/serviceProvider/screens/ConversationScreen';
import OrderDetailsScreen from '../../dashboards/serviceProvider/screens/OrderDetailsScreen';
import SettingsScreen from '../../dashboards/serviceProvider/screens/SettingsScreen';
import ProfileScreen from '../../dashboards/serviceProvider/screens/profile/ProfileScreen';
import EditProfileScreen from '../../dashboards/serviceProvider/screens/profile/EditProfileScreen';
import ManageCertificatesScreen from '../../dashboards/serviceProvider/screens/certificates/ManageCertificatesScreen';
import AddEditCertificateScreen from '../../dashboards/serviceProvider/screens/certificates/AddEditCertificateScreen';
import ManageProjectsScreen from '../../dashboards/serviceProvider/screens/projects/ManageProjectsScreen';
import AddEditProjectScreen from '../../dashboards/serviceProvider/screens/projects/AddEditProjectScreen';
import CompanyProfileScreen from '../../dashboards/serviceProvider/screens/company/CompanyProfileScreen';
import EditCompanyScreen from '../../dashboards/serviceProvider/screens/company/EditCompanyScreen';
import ManageCompanyDocsScreen from '../../dashboards/serviceProvider/screens/company/ManageCompanyDocsScreen';
import AddEditCompanyDocScreen from '../../dashboards/serviceProvider/screens/company/AddEditCompanyDocScreen';
import PortfolioTemplatesScreen from '../../dashboards/serviceProvider/screens/PortfolioTemplatesScreen';
import ServicesScreen from '../../dashboards/serviceProvider/screens/services/ServicesScreen';
import AddEditServiceScreen from '../../dashboards/serviceProvider/screens/services/AddEditServiceScreen';
import ServiceDetailsScreen from '../../dashboards/serviceProvider/screens/services/ServiceDetailsScreen';

// 5 main tab screens
import JobsScreen from '../../dashboards/serviceProvider/screens/JobsScreen';
import OrdersScreen from '../../dashboards/serviceProvider/screens/OrdersScreen';
import MessagesScreen from '../../dashboards/serviceProvider/screens/MessagesScreen';
import HomeScreen from '../../dashboards/serviceProvider/screens/HomeScreen';

const Stack = createStackNavigator();

const ServiceProviderStack = () => {
  const screens = [
    // Bottom nav wrapped screens
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

    // Header-only / full screen modals
    {name: 'ApplyOnJob', component: ApplyOnJobScreen},
    {name: 'OrderDetails', component: OrderDetailsScreen},
    {name: 'Conversation', component: ConversationScreen},
    {name: 'EditProfile', component: EditProfileScreen},
    {name: 'AddEditCertificate', component: AddEditCertificateScreen},
    {name: 'AddEditProject', component: AddEditProjectScreen},
    {name: 'EditCompany', component: EditCompanyScreen},
    {name: 'AddEditCompanyDoc', component: AddEditCompanyDocScreen},
    {name: 'AddEditService', component: AddEditServiceScreen},
    {name: 'ServiceDetails', component: ServiceDetailsScreen},

    // Other layout-wrapped screens (Profile tab related)
    {
      name: 'Settings',
      component: withLayout(SettingsScreen, {
        defaultTab: 'Profile',
        navigation: true,
      }),
    },

    {name: 'CompanyProfile', component: CompanyProfileScreen},
    {name: 'ManageCompanyDocs', component: ManageCompanyDocsScreen},
    {name: 'ManageCertificates', component: ManageCertificatesScreen},
    {name: 'ManageProjects', component: ManageProjectsScreen},
    {name: 'Services', component: ServicesScreen},
    {name: 'PortfolioTemplates', component: PortfolioTemplatesScreen},
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

export default ServiceProviderStack;
