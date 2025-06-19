import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {Trash2, AlertTriangle, X} from 'lucide-react-native';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';

const {width: screenWidth} = Dimensions.get('window');

const DeleteConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  itemType = 'Item',
  itemName = '',
  loading = false,
  confirmText = 'Delete',
  icon = <AlertTriangle color="#F44336" size={32} />,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.warningIconWrapper}>{icon}</View>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Delete {itemType}</Text>

          {/* Message */}
          <Text style={styles.modalMessage}>
            Are you sure you want to delete {itemType.toLowerCase()}{' '}
            <Text style={styles.orderNumberText}>"{itemName}"</Text>?
          </Text>

          <Text style={styles.modalSubMessage}>
            This action cannot be undone and will permanently remove this{' '}
            {itemType.toLowerCase()}.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}>
              <View style={styles.deleteButtonContent}>
                <Trash2 color={colors.background} size={18} />
                <Text style={styles.deleteButtonText}>
                  {loading ? 'Deleting...' : confirmText}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: screenWidth - 40,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  warningIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFE6E6',
  },
  modalTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  orderNumberText: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  modalSubMessage: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F44336',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default DeleteConfirmationModal;
