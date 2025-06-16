import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {useNavigation, useRoute} from '@react-navigation/native';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {order} = route.params;

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    'Accepted',
    'Started',
    'In Progress',
    'Completed',
    'Cancelled',
  ];

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderOrderStatusIndicator = timeline => (
    <View style={styles.statusIndicatorContainer}>
      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusDot,
            timeline.accepted ? styles.statusCompleted : styles.statusPending,
          ]}
        />
        <Text style={styles.statusStepText}>Accepted</Text>
      </View>

      <View style={styles.statusLine} />

      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusDot,
            timeline.started ? styles.statusCompleted : styles.statusPending,
          ]}
        />
        <Text style={styles.statusStepText}>Started</Text>
      </View>

      <View style={styles.statusLine} />

      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusDot,
            timeline.inProgress ? styles.statusCompleted : styles.statusPending,
          ]}
        />
        <Text style={styles.statusStepText}>In Progress</Text>
      </View>

      <View style={styles.statusLine} />

      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusDot,
            timeline.completed ? styles.statusCompleted : styles.statusPending,
          ]}
        />
        <Text style={styles.statusStepText}>Completed</Text>
      </View>
    </View>
  );

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

  const handleUpdateStatus = () => {
    console.log(`Order ${order.id} status updated to ${selectedStatus}`);
    setShowStatusModal(false);
    navigation.goBack();
  };

  const handleMessageCustomer = () => {
    navigation.navigate('Conversation', {
      customer: order.customer,
      orderId: order.id,
    });
  };

  const handleGenerateInvoice = () => {
    console.log('Generating invoice for order:', order.id);
    setShowActionsModal(false);
  };

  const handleCallCustomer = () => {
    console.log('Calling customer:', order.customer.phone);
    setShowActionsModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Order #{order.id}
        </Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowActionsModal(true)}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.orderAmount}>{order.amount}</Text>
            <View
              style={[
                styles.statusTag,
                {backgroundColor: getStatusStyle(order.status).backgroundColor},
              ]}>
              <Text
                style={[
                  styles.statusTagText,
                  {color: getStatusStyle(order.status).color},
                ]}>
                {order.status}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceTitle}>{order.service}</Text>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📅</Text>
              <View>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>
                  {order.dates.startDate} - {order.dates.endDate}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>💳</Text>
              <View>
                <Text style={styles.summaryLabel}>Payment</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    order.paymentStatus === 'Paid'
                      ? {color: colors.splashGreen}
                      : {},
                  ]}>
                  {order.paymentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.customerCard}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <Image source={order.customer.image} style={styles.customerImage} />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.customer.name}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.customerLocation}>
                  {order.customer.location}
                </Text>
              </View>
              {order.customer.phone && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📞</Text>
                  <Text style={styles.customerLocation}>
                    {order.customer.phone}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleMessageCustomer}>
              <Text style={styles.contactButtonText}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card */}
        <View style={styles.serviceCard}>
          <Text style={styles.sectionTitle}>Service Details</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>{order.service}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Order Amount</Text>
              <Text style={styles.detailValue}>{order.amount}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{order.dates.startDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{order.dates.endDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <Text
                style={[
                  styles.detailValue,
                  order.paymentStatus === 'Paid'
                    ? {color: colors.splashGreen}
                    : {color: '#FFC107'},
                ]}>
                {order.paymentStatus}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>#{order.id}</Text>
            </View>
          </View>
        </View>

        {/* Order Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          {renderOrderStatusIndicator(order.timeline)}
        </View>

        {/* Order Notes Card */}
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Order Notes</Text>
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>
              Customer has requested that work be done during weekday mornings.
              Please ensure all work is completed by May 8, 2023 as requested.
            </Text>
            <Text style={styles.noteDate}>Added on May 5, 2023</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {order.status !== 'Completed' && order.status !== 'Cancelled' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowStatusModal(true)}>
            <Text style={styles.primaryButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleMessageCustomer}>
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {statusOptions.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && styles.statusOptionActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}>
                  <Text style={styles.statusOptionText}>{status}</Text>
                  {selectedStatus === status && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleUpdateStatus}>
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionsModal(false);
                setShowStatusModal(true);
              }}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionsModal(false);
                handleMessageCustomer();
              }}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Message Customer</Text>
            </TouchableOpacity>

            {order.customer.phone && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={handleCallCustomer}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>Call Customer</Text>
              </TouchableOpacity>
            )}

            {order.status === 'Completed' && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={handleGenerateInvoice}>
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.actionText}>Generate Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Sticky Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: colors.splashGreen,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: colors.text,
    transform: [{rotate: '90deg'}],
  },

  scrollView: {
    flex: 1,
  },

  // Cards
  summaryCard: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  customerCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notesCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Summary Card
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    fontSize: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },

  // Customer Section
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E1E1E1',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  customerLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 18,
  },

  // Service Details
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    width: '47%',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  // Timeline
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statusStep: {
    alignItems: 'center',
    width: 60,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusCompleted: {
    backgroundColor: colors.splashGreen,
  },
  statusPending: {
    backgroundColor: '#E0E0E0',
  },
  statusStepText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },

  // Notes
  noteItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.splashGreen,
  },
  noteText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Modals
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
    maxHeight: '70%',
  },
  actionsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.textSecondary,
  },

  // Status Options
  statusOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusOptionActive: {
    backgroundColor: '#F8F9FA',
  },
  statusOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  checkmark: {
    fontSize: 18,
    color: colors.splashGreen,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },

  // Action Options
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    color: colors.text,
  },
});

export default OrderDetailsScreen;
