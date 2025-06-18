import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import withLayout from './withLayout';

// Service Provider Main Tab Screens
import HomeScreen from '../../dashboards/serviceProvider/screens/HomeScreen';
import JobsScreen from '../../dashboards/serviceProvider/screens/JobsScreen';
import OrdersScreen from '../../dashboards/serviceProvider/screens/OrdersScreen';
import MessagesScreen from '../../dashboards/serviceProvider/screens/MessagesScreen';
import ProfileScreen from '../../dashboards/serviceProvider/screens/profile/ProfileScreen';

// Detail Screens (without layout)
import ApplyOnJobScreen from '../../dashboards/serviceProvider/screens/ApplyOnJobScreen';
import ApplyJobScreen from '../../dashboards/serviceProvider/screens/ApplyJobScreen';
import MyApplicationsScreen from '../../dashboards/serviceProvider/screens/MyApplicationsScreen';
import ConversationScreen from '../../dashboards/serviceProvider/screens/ConversationScreen';
import OrderDetailsScreen from '../../dashboards/serviceProvider/screens/OrderDetailsScreen';
import SettingsScreen from '../../dashboards/serviceProvider/screens/SettingsScreen';
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

const Stack = createStackNavigator();

const ServiceProviderStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ServiceProviderDashboard"
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
        name="ServiceProviderDashboard"
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

      {/* ===== DETAIL SCREENS (No Bottom Navigation) ===== */}
      {/* FIXED: Remove withLayout wrapper from MyApplicationsScreen */}
      <Stack.Screen
        name="MyApplicationsScreen"
        component={MyApplicationsScreen}
      />

      <Stack.Screen name="ApplyOnJobScreen" component={ApplyOnJobScreen} />
      <Stack.Screen name="ApplyJobScreen" component={ApplyJobScreen} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="OrderDetailsScreen" component={OrderDetailsScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />

      {/* Certificate Screens */}
      <Stack.Screen
        name="ManageCertificatesScreen"
        component={ManageCertificatesScreen}
      />
      <Stack.Screen
        name="AddEditCertificateScreen"
        component={AddEditCertificateScreen}
      />

      {/* Project Screens */}
      <Stack.Screen
        name="ManageProjectsScreen"
        component={ManageProjectsScreen}
      />
      <Stack.Screen
        name="AddEditProjectScreen"
        component={AddEditProjectScreen}
      />

      {/* Company Screens */}
      <Stack.Screen
        name="CompanyProfileScreen"
        component={CompanyProfileScreen}
      />
      <Stack.Screen name="EditCompanyScreen" component={EditCompanyScreen} />
      <Stack.Screen
        name="ManageCompanyDocsScreen"
        component={ManageCompanyDocsScreen}
      />
      <Stack.Screen
        name="AddEditCompanyDocScreen"
        component={AddEditCompanyDocScreen}
      />

      {/* Service Screens */}
      <Stack.Screen name="ServicesScreen" component={ServicesScreen} />
      <Stack.Screen
        name="AddEditServiceScreen"
        component={AddEditServiceScreen}
      />
      <Stack.Screen
        name="ServiceDetailsScreen"
        component={ServiceDetailsScreen}
      />

      {/* Other Screens */}
      <Stack.Screen
        name="PortfolioTemplatesScreen"
        component={PortfolioTemplatesScreen}
      />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default ServiceProviderStack;
