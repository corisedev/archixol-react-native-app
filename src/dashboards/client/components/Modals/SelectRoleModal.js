import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors} from '../../../../utils/colors';;;

const SelectRoleModal = ({visible, onClose}) => {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleNext = () => {
    if (selectedRole) {
      // TODO: Handle selected role registration logic
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            Become a Supplier or Service Provider
          </Text>

          <View style={styles.cardContainer}>
            {['supplier', 'service_provider'].map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.card,
                  selectedRole === role && styles.cardSelected,
                ]}
                onPress={() => setSelectedRole(role)}>
                <Text style={styles.cardText}>
                  {role === 'supplier' ? 'Supplier' : 'Service Provider'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                {backgroundColor: selectedRole ? colors.success : '#ccc'},
              ]}
              disabled={!selectedRole}
              onPress={handleNext}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SelectRoleModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%'},
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cardSelected: {borderColor: colors.success, backgroundColor: '#E0F7EC'},
  cardText: {fontSize: 16, fontWeight: '500'},
  buttonRow: {flexDirection: 'row', justifyContent: 'space-between'},
  skipButton: {padding: 12},
  skipText: {color: '#888'},
  nextButton: {padding: 12, borderRadius: 8},
  nextText: {color: '#fff', fontWeight: '600'},
});
