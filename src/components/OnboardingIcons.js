import React from 'react';
import { View, StyleSheet } from 'react-native';

export const ServiceProviderIcon = ({ size = 150 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.hardHat, { width: size * 0.6, height: size * 0.3 }]} />
    <View style={[styles.person, { width: size * 0.5, height: size * 0.5 }]} />
    <View style={styles.toolsContainer}>
      <View style={[styles.tool, { width: size * 0.15, height: size * 0.3 }]} />
      <View style={[styles.tool, { width: size * 0.15, height: size * 0.3 }]} />
    </View>
  </View>
);

export const SupplierIcon = ({ size = 150 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.warehouse, { width: size * 0.8, height: size * 0.5 }]} />
    <View style={styles.itemsContainer}>
      <View style={[styles.box, { width: size * 0.2, height: size * 0.2 }]} />
      <View style={[styles.box, { width: size * 0.2, height: size * 0.2 }]} />
      <View style={[styles.box, { width: size * 0.2, height: size * 0.2 }]} />
    </View>
  </View>
);

export const UserHomeIcon = ({ size = 150 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.roof, { 
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.4,
      borderRightWidth: size * 0.4,
      borderBottomWidth: size * 0.3,
    }]} />
    <View style={[styles.houseBody, { width: size * 0.7, height: size * 0.4 }]}>
      <View style={[styles.door, { width: size * 0.15, height: size * 0.25 }]} />
      <View style={styles.windows}>
        <View style={[styles.window, { width: size * 0.1, height: size * 0.1 }]} />
        <View style={[styles.window, { width: size * 0.1, height: size * 0.1 }]} />
      </View>
    </View>
    <View style={styles.familyContainer}>
      <View style={[styles.familyMember, { width: size * 0.08, height: size * 0.08 }]} />
      <View style={[styles.familyMember, { width: size * 0.08, height: size * 0.08 }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Service Provider Styles
  hardHat: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    marginBottom: -10,
  },
  person: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 100,
  },
  toolsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  tool: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
  },
  // Supplier Styles
  warehouse: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
  },
  itemsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  box: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 5,
  },
  // User Home Styles
  roof: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.4)',
  },
  houseBody: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: -1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    bottom: 0,
  },
  windows: {
    flexDirection: 'row',
    gap: 30,
    position: 'absolute',
    top: 20,
  },
  window: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  familyContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  familyMember: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 50,
  },
});

export default { ServiceProviderIcon, SupplierIcon, UserHomeIcon };