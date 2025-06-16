import {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getAllCustomers, deleteCustomer} from '../../../api/serviceSupplier';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

// Move component outside of render to fix React warning
const CustomerListEmpty = ({query, navigation}) => {
  return (
    <View style={styles.emptyContainer}>
      <Users color={colors.textSecondary} size={48} />
      <Text style={styles.emptyText}>
        {query ? 'No customers found matching your search' : 'No customers yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {query
          ? 'Try adjusting your search terms'
          : 'Add your first customer to get started'}
      </Text>
      {!query && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('AddCustomerScreen')}>
          <Text style={styles.emptyButtonText}>Add Customer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Move FilterModal component outside to fix React warning
const FilterModal = ({
  visible,
  onClose,
  selectedFilter,
  setSelectedFilter,
  sortBy,
  setSortBy,
  onApply,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter & Sort Customers</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sort By</Text>
          {[
            {label: 'Name (A-Z)', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Date Added', value: 'created_at'},
            {label: 'Amount Spent', value: 'amount_spent'},
          ].map(sort => (
            <TouchableOpacity
              key={sort.value}
              style={[
                styles.filterOption,
                sortBy === sort.value && styles.selectedFilterOption,
              ]}
              onPress={() => setSortBy(sort.value)}>
              <Text
                style={[
                  styles.filterOptionText,
                  sortBy === sort.value && styles.selectedFilterOptionText,
                ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => onApply(selectedFilter, sortBy)}>
            <Text style={styles.modalButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const CustomersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigation = useNavigation();

  // Fetch customers data
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await getAllCustomers({
        page: 1,
        limit: 100, // Get all customers
        sort_by: 'createdAt',
        sort_order: 'desc',
      });
      console.log('Customers API Response:', response);

      if (response && response.customers) {
        setCustomers(response.customers);
        setFilteredCustomers(response.customers);
      } else if (response && response.customers_list) {
        setCustomers(response.customers_list);
        setFilteredCustomers(response.customers_list);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      Alert.alert('Error', 'Unable to load customers. Please try again.');
    }
  }, []);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchCustomers();
        setLoading(false);
      };
      loadData();
    }, [fetchCustomers]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }, [fetchCustomers]);

  // Search customers
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);

      if (query.trim() === '') {
        // If search is empty, show filtered customers based on current filter
        applyFilters(customers, selectedFilter, sortBy);
        return;
      }

      // Local search
      const filtered = customers.filter(
        customer =>
          customer.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
          customer.email?.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone_number?.includes(query) ||
          customer.first_name?.toLowerCase().includes(query.toLowerCase()) ||
          customer.last_name?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredCustomers(filtered);
    },
    [customers, selectedFilter, sortBy, applyFilters],
  );

  // Apply filters and sorting
  const applyFilters = useCallback((customerList, filter, sortBy) => {
    let filtered = [...customerList];

    // Apply filter
    if (filter === 'recent') {
      // Customers created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      filtered = filtered.filter(customer => {
        const createdDate = new Date(customer.createdAt);
        return createdDate >= thirtyDaysAgo;
      });
    } else if (filter === 'with_orders') {
      filtered = filtered.filter(customer => customer.orders_count > 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = (
            a.customer_name || `${a.first_name || ''} ${a.last_name || ''}`
          ).toLowerCase();
          const nameB = (
            b.customer_name || `${b.first_name || ''} ${b.last_name || ''}`
          ).toLowerCase();
          return nameA.localeCompare(nameB);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'created_at':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'amount_spent':
          return (b.amount_spent || 0) - (a.amount_spent || 0);
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = (filter, sortBy) => {
    setSelectedFilter(filter);
    setSortBy(sortBy);
    setFilterModalVisible(false);

    if (searchQuery.trim() === '') {
      applyFilters(customers, filter, sortBy);
    }
  };

  const handleDeleteCustomer = (customerId, customerName) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setDeleteModalVisible(true);
  };

  const confirmDeleteCustomer = async () => {
    try {
      setDeleting(true);
      await deleteCustomer({customer_id: selectedCustomerId});
      setDeleteModalVisible(false);
      setSelectedCustomerId(null);
      setSelectedCustomerName('');
      await fetchCustomers(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete customer. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get customer display name
  const getCustomerName = customer => {
    if (customer.customer_name) return customer.customer_name;
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return 'Unknown Customer';
  };

  // Get customer avatar initials
  const getCustomerInitials = customer => {
    const name = getCustomerName(customer);
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Get customer status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.splashGreen;
      case 'inactive':
        return '#FF9800';
      case 'blocked':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  // Render customer item
  const renderCustomerItem = ({item: customer}) => {
    const customerName = getCustomerName(customer);
    const initials = getCustomerInitials(customer);
    const statusColor = getStatusColor(customer.status);

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() =>
          navigation.navigate('CustomerDetailScreen', {
            customerId: customer.id,
          })
        }
        activeOpacity={0.7}>
        {/* Card Header with Avatar, Status and Action Buttons */}
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            {/* Customer Avatar */}
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>{initials}</Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusColor + '20'},
              ]}>
              <Text style={[styles.statusBadgeText, {color: statusColor}]}>
                {customer.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Action Buttons - Moved to top right */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('EditCustomerScreen', {
                  customerId: customer.id,
                })
              }>
              <Edit color={colors.text} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteCustomer(customer.id, customerName)}>
              <Trash2 color="#F44336" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <View style={styles.customerHeader}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>
            {customer.orders_count > 0 && (
              <View style={styles.orderBadge}>
                <ShoppingBag color={colors.splashGreen} size={12} />
                <Text style={styles.orderBadgeText}>
                  {customer.orders_count}
                </Text>
              </View>
            )}
          </View>

          {customer.email && (
            <View style={styles.customerDetail}>
              <Mail color={colors.textSecondary} size={12} />
              <Text style={styles.detailText} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
          )}

          {customer.phone_number && (
            <View style={styles.customerDetail}>
              <Phone color={colors.textSecondary} size={12} />
              <Text style={styles.detailText} numberOfLines={1}>
                {customer.phone_number}
              </Text>
            </View>
          )}

          {customer.default_address && (
            <View style={styles.customerDetail}>
              <MapPin color={colors.textSecondary} size={12} />
              <Text style={styles.detailText} numberOfLines={2}>
                {customer.default_address}
              </Text>
            </View>
          )}

          <View style={styles.customerMeta}>
            <View style={styles.metaItem}>
              <Calendar color={colors.textSecondary} size={12} />
              <Text style={styles.customerMetaText}>
                {formatDate(customer.createdAt)}
              </Text>
            </View>

            {customer.amount_spent > 0 && (
              <View style={styles.metaItem}>
                <DollarSign color={colors.splashGreen} size={12} />
                <Text style={styles.customerSpent}>
                  {formatCurrency(customer.amount_spent)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCustomerScreen')}>
          <Plus color={colors.background} size={20} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.textSecondary} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}>
          <Filter color={colors.textSecondary} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter Summary */}
      {(selectedFilter !== 'all' || sortBy !== 'name') && (
        <View style={styles.filterSummary}>
          <Text style={styles.filterSummaryText}>
            Showing {filteredCustomers.length} customers
            {selectedFilter !== 'all' &&
              ` • ${
                selectedFilter === 'recent'
                  ? 'Recent'
                  : selectedFilter === 'with_orders'
                  ? 'With Orders'
                  : selectedFilter
              }`}
            {sortBy !== 'name' &&
              ` • Sorted by ${
                sortBy === 'created_at'
                  ? 'Date'
                  : sortBy === 'amount_spent'
                  ? 'Amount Spent'
                  : sortBy
              }`}
          </Text>
          <TouchableOpacity onPress={() => handleFilterChange('all', 'name')}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.customersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <CustomerListEmpty query={searchQuery} navigation={navigation} />
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onApply={handleFilterChange}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDeleteCustomer}
        itemType="Customer"
        itemName={selectedCustomerName}
        loading={deleting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Summary
  filterSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
  },
  filterSummaryText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  clearFiltersText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Customers List
  customersList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },

  // Card Header with Avatar, Status and Actions
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitials: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Action Buttons - Now positioned at top right
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FFD6D6',
  },

  // Customer Info
  customerInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  orderBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    flex: 1,
    fontFamily: fonts.regular,
  },
  customerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerMetaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  customerSpent: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.regular,
  },
  emptyButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: colors.splashGreen + '20',
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedFilterOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
  modalButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
});

export default CustomersScreen;
