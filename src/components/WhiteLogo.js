// components/Logo.tsx
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import ArchiXolLogo from '../assets/images/ArchiXolLogo_White.png';

const Logo = ({size = 120}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      <Image
        source={ArchiXolLogo}
        style={{
          width: size * 0.8,
          height: size * 0.8,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
     alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
