import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Auth & Intro Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// Modular Dashboards
import ServiceProviderStack from '../navigation/serviceProvider/ServiceProviderStack'; // adjust path if needed
import SupplierStack from '../navigation/supplier/SupplierStack'; // Importing the SupplierStack we created
import ClientStack from './client/ClientStack';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        {/* Intro / Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Dashboards - Direct to Home Pages */}
        <Stack.Screen name="ClientDashboard" component={ClientStack} />
        <Stack.Screen
          name="ServiceProviderHome"
          component={ServiceProviderStack}
        />
        <Stack.Screen
          name="SupplierHome" // Changed from SupplierDashboard to SupplierHome
          component={SupplierStack}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
