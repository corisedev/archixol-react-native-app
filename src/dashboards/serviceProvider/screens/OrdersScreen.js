import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import {colors} from '../../../utils/colors';
import ProfileImage1 from '../../../assets/images/profile1.jpeg';
import ProfileImage2 from '../../../assets/images/profile2.jpeg';
import {useNavigation} from '@react-navigation/native';

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('All Orders');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  
  const tabs = ['All Orders', 'In Progress', 'Completed', 'Cancelled'];

  const ordersData = [
    {
      id: 'ORD-2458',
      status: 'In Progress',
      customer: {
        name: 'Ali Hassan',
        image: ProfileImage1,
        location: 'DHA Phase 5, Lahore',
      },
      service: 'Bathroom Plumbing Repair',
      timeline: {
        accepted: true,
        started: true,
        inProgress: true,
        completed: false,
      },
      dates: {
        startDate: 'May 5, 2023',
        endDate: 'May 8, 2023',
      },
      amount: 'Rs 10,000',
      paymentStatus: 'Pending',
    },
    {
      id: 'ORD-2457',
      status: 'Completed',
      customer: {
        name: 'Samia Khan',
        image: ProfileImage2,
        location: 'Model Town, Lahore',
      },
      service: 'Kitchen Sink Installation',
      timeline: {
        accepted: true,
        started: true,
        inProgress: true,
        completed: true,
      },
      dates: {
        startDate: 'May 1, 2023',
        endDate: 'May 3, 2023',
      },
      amount: 'Rs 8,500',
      paymentStatus: 'Paid',
    },
    {
      id: 'ORD-2456',
      status: 'Pending',
      customer: {
        name: 'Zain Malik',
        image: ProfileImage1,
        location: 'Wapda Town, Lahore',
      },
      service: 'Bathroom Renovation',
      timeline: {
        accepted: true,
        started: false,
        inProgress: false,
        completed: false,
      },
      dates: {
        startDate: 'May 10, 2023',
        endDate: 'May 15, 2023',
      },
      amount: 'Rs 25,000',
      paymentStatus: 'Advance Paid',
    },
    {
      id: 'ORD-2455',
      status: 'Cancelled',
      customer: {
        name: 'Ahmed Khan',
        image: ProfileImage2,
        location: 'Johar Town, Lahore',
      },
      service: 'Electrical Repair',
      timeline: {
        accepted: true,
        started: false,
        inProgress: false,
        completed: false,
      },
      dates: {
        startDate: 'April 25, 2023',
        endDate: 'April 27, 2023',
      },
      amount: 'Rs 5,000',
      paymentStatus: 'Refunded',
    },
    {
      id: 'ORD-2454',
      status: 'In Progress',
      customer: {
        name: 'Farah Noor',
        image: ProfileImage1,
        location: 'Gulberg III, Lahore',
      },
      service: 'AC Installation',
      timeline: {
        accepted: true,
        started: true,
        inProgress: true,
        completed: false,
      },
      dates: {
        startDate: 'May 7, 2023',
        endDate: 'May 9, 2023',
      },
      amount: 'Rs 12,000',
      paymentStatus: 'Pending',
    },
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'All Orders') {
      return ordersData;
    }
    return ordersData.filter(order => order.status === activeTab);
  };

  const getStatusStyle = status => {
    switch (status) {
      case 'In Progress':
        return {
          backgroundColor: '#E3F2FD',
          color: colors.primary,
        };
      case 'Completed':
        return {
          backgroundColor: '#E8F5E9',
          color: colors.splashGreen,
        };
      case 'Cancelled':
        return {
          backgroundColor: '#FFEBEE',
          color: '#F44336',
        };
      case 'Pending':
        return {
          backgroundColor: '#FFF8E1',
          color: '#FFC107',
        };
      default:
        return {
          backgroundColor: '#E0F2F1',
          color: '#00897B',
        };
    }
  };

  const handleViewDetails = order => {
    navigation.navigate('OrderDetails', {order});
  };

  const handleMessageCustomer = order => {
    navigation.navigate('Conversation', {
      customer: order.customer,
      orderId: order.id,
    });
  };

  const renderOrderCard = ({item}) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}>
      {/* Card Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>Order {item.id}</Text>
          <View
            style={[
              styles.statusTag,
              {backgroundColor: getStatusStyle(item.status).backgroundColor},
            ]}>
            <Text
              style={[
                styles.statusTagText,
                {color: getStatusStyle(item.status).color},
              ]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderAmount}>{item.amount}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Image source={item.customer.image} style={styles.customerImage} />
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{item.customer.name}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.customerLocation}>
              {item.customer.location}
            </Text>
          </View>
        </View>
      </View>

      {/* Service Title */}
      <Text style={styles.serviceTitle}>{item.service}</Text>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Start Date</Text>
          <Text style={styles.detailValue}>{item.dates.startDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>End Date</Text>
          <Text style={styles.detailValue}>{item.dates.endDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Payment</Text>
          <Text
            style={[
              styles.detailValue,
              item.paymentStatus === 'Paid'
                ? {color: colors.splashGreen}
                : {color: '#FFC107'},
            ]}>
            {item.paymentStatus}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => handleMessageCustomer(item)}>
          <Text style={styles.messageButtonText}>💬</Text>
        </TouchableOpacity>
        
        {item.status === 'In Progress' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleViewDetails(item)}>
            <Text style={styles.updateButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'Completed' && (
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={() => console.log('Generate invoice')}>
            <Text style={styles.invoiceButtonText}>Invoice</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'Pending' && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleViewDetails(item)}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}!</Text>
            <Text style={styles.userName}>My Orders</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.filterChip,
              activeTab === tab && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                activeTab === tab && styles.filterTextActive,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Orders ({getFilteredOrders().length})
        </Text>
      </View>
    </View>
  );

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Orders will appear here when customers book your services
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  list: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Filter Section
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: colors.splashGreen,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  // Order Cards
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },

  // Customer Info
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E1E1E1',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  customerLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Service Title
  serviceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },

  // Order Details
  orderDetails: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  messageButton: {
    width: 40,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 16,
  },
  updateButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.splashGreen,
    borderRadius: 6,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  invoiceButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  invoiceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.splashGreen,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OrdersScreen;