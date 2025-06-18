import {createStackNavigator} from '@react-navigation/stack';
import withSupplierLayout from './withSupplierLayout';

// Supplier Main Tab Screens
import SupplierHomeScreen from '../../dashboards/supplier/screens/HomeScreen';
import ProductsScreen from '../../dashboards/supplier/screens/ProductsScreen';
import OrdersScreen from '../../dashboards/supplier/screens/OrdersScreen';
import ProfileScreen from '../../dashboards/supplier/screens/ProfileScreen';
import CustomersScreen from '../../dashboards/supplier/screens/CustomersScreen';

// Detail Screens (without layout)
import ProductDetailScreen from '../../dashboards/supplier/screens/ProductDetailScreen';
import OrderDetailScreen from '../../dashboards/supplier/screens/OrderDetailScreen';
import EditProductScreen from '../../dashboards/supplier/screens/EditProductScreen';
import AddProductScreen from '../../dashboards/supplier/screens/AddProductScreen';
import CustomerDetailScreen from '../../dashboards/supplier/screens/CustomerDetailScreen';
import InventoryScreen from '../../dashboards/supplier/screens/InventoryScreen';
import AddCustomerScreen from '../../dashboards/supplier/screens/AddCustomerScreen';
import EditCustomerScreen from '../../dashboards/supplier/screens/EditCustomerScreen';
import EditOrderScreen from '../../dashboards/supplier/screens/EditOrderScreen';
import CollectionScreen from '../../dashboards/supplier/screens/CollectionScreen';
import EditCollectionScreen from '../../dashboards/supplier/screens/EditCollectionScreen';
import CollectionDetailScreen from '../../dashboards/supplier/screens/CollectionDetailScreen';
import CreateCollectionScreen from '../../dashboards/supplier/screens/CreateCollectionScreen';
import PurchaseOrderScreen from '../../dashboards/supplier/screens/PurchaseOrderScreen';
import CreatePurchaseOrderScreen from '../../dashboards/supplier/screens/CreatePurchaseOrderScreen';
import EditPurchaseOrderScreen from '../../dashboards/supplier/screens/EditPurchaseOrderScreen';
import PurchaseOrderDetailScreen from '../../dashboards/supplier/screens/PurchaseOrderDetailScreen';
import ChatScreen from '../../dashboards/supplier/screens/ChatScreen';
import SettingsScreen from '../../dashboards/supplier/screens/SettingsScreen';
import StoreDetailsScreen from '../../dashboards/supplier/screens/StoreDetailsScreen';
import CheckoutSettingsScreen from '../../dashboards/supplier/screens/CheckoutSettingsScreen';
import TaxDutiesScreen from '../../dashboards/supplier/screens/TaxDutiesScreen';
import PersonalProfileScreen from '../../dashboards/supplier/screens/PersonalProfileScreen';
import SecuritySettingsScreen from '../../dashboards/supplier/screens/SecuritySettingsScreen';
import VendorScreen from '../../dashboards/supplier/screens/VendorScreen';
import VendorDetailScreen from '../../dashboards/supplier/screens/VendorDetailScreen';
import EditVendorScreen from '../../dashboards/supplier/screens/EditVendorScreen';
import CreateVendorScreen from '../../dashboards/supplier/screens/CreateVendorScreen';
import DiscountScreen from '../../dashboards/supplier/screens/DiscountScreen';
import CreateDiscountScreen from '../../dashboards/supplier/screens/CreateDiscountScreen';
import ReportsAnalyticsScreen from '../../dashboards/supplier/screens/ReportsAnalyticsScreen';

const Stack = createStackNavigator();

const SupplierStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SupplierDashboard" // Set initial route
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
        name="SupplierDashboard"
        component={withSupplierLayout(SupplierHomeScreen, {
          defaultTab: 'Home',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ProductsScreen"
        component={withSupplierLayout(ProductsScreen, {
          defaultTab: 'Products',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="OrdersScreen"
        component={withSupplierLayout(OrdersScreen, {
          defaultTab: 'Orders',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="CustomersScreen"
        component={withSupplierLayout(CustomersScreen, {
          defaultTab: 'Customers',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ProfileScreen"
        component={withSupplierLayout(ProfileScreen, {
          defaultTab: 'Profile',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="InventoryScreen"
        component={withSupplierLayout(InventoryScreen, {
          defaultTab: 'Products',
          navigation: true,
          showBottomNav: true,
        })}
      />

      <Stack.Screen
        name="ProductDetailScreen"
        component={ProductDetailScreen}
      />

      <Stack.Screen name="AddCustomerScreen" component={AddCustomerScreen} />
      <Stack.Screen name="EditCustomerScreen" component={EditCustomerScreen} />
      <Stack.Screen name="OrderDetailScreen" component={OrderDetailScreen} />
      <Stack.Screen name="EditOrderScreen" component={EditOrderScreen} />
      <Stack.Screen name="CollectionScreen" component={CollectionScreen} />
      <Stack.Screen
        name="EditCollectionScreen"
        component={EditCollectionScreen}
      />
      <Stack.Screen
        name="CollectionDetailScreen"
        component={CollectionDetailScreen}
      />
      <Stack.Screen
        name="CreateCollectionScreen"
        component={CreateCollectionScreen}
      />
      <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
      <Stack.Screen name="EditProductScreen" component={EditProductScreen} />
      <Stack.Screen
        name="CustomerDetailScreen"
        component={CustomerDetailScreen}
      />

      {/* Purchase Order Screens */}
      <Stack.Screen
        name="PurchaseOrderScreen"
        component={PurchaseOrderScreen}
      />
      <Stack.Screen
        name="CreatePurchaseOrderScreen"
        component={CreatePurchaseOrderScreen}
      />
      <Stack.Screen
        name="EditPurchaseOrderScreen"
        component={EditPurchaseOrderScreen}
      />
      <Stack.Screen
        name="PurchaseOrderDetailScreen"
        component={PurchaseOrderDetailScreen}
      />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

      <Stack.Screen name="StoreDetailsScreen" component={StoreDetailsScreen} />
      <Stack.Screen
        name="CheckoutSettingsScreen"
        component={CheckoutSettingsScreen}
      />
      <Stack.Screen name="TaxDutiesScreen" component={TaxDutiesScreen} />
      <Stack.Screen
        name="PersonalProfileScreen"
        component={PersonalProfileScreen}
      />
      <Stack.Screen
        name="SecuritySettingsScreen"
        component={SecuritySettingsScreen}
      />
      <Stack.Screen name="VendorScreen" component={VendorScreen} />
      <Stack.Screen name="VendorDetailScreen" component={VendorDetailScreen} />
      <Stack.Screen name="EditVendorScreen" component={EditVendorScreen} />
      <Stack.Screen name="CreateVendorScreen" component={CreateVendorScreen} />
      <Stack.Screen name="DiscountScreen" component={DiscountScreen} />
      <Stack.Screen name="CreateDiscountScreen" component={CreateDiscountScreen} />
      <Stack.Screen name="ReportsAnalyticsScreen" component={ReportsAnalyticsScreen} />

      {/* Chat Screen */}
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default SupplierStack;
