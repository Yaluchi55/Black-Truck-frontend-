import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import AuthScreen from './src/screens/AuthScreen';
import DriverTerminalScreen from './src/screens/DriverTerminalScreen';
import { colors } from './src/theme';

function RootController() {
  const { userRole } = useApp();

  if (userRole === 'RIDER') {
    return <RootNavigator />;
  }
  if (userRole === 'CHAUFFEUR') {
    return <DriverTerminalScreen />;
  }
  return <AuthScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.root}>
          <RootController />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
