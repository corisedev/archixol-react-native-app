import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import {BackendProvider} from './src/context/BackendContext';
import {AuthProvider} from './src/context/AuthContext';

const App = () => {
  return (
    <BackendProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </BackendProvider>
  );
};

export default App;
