import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';

import { initializeDatabase, type User } from './src/database';
import {
  HomeScreen,
  LoginScreen,
  RecoveryScreen,
  RegisterScreen,
} from './src/screens';
import { colors } from './src/theme';
import type { Notice, Screen } from './src/types';
console.log(process.env.EXPO_PUBLIC_API_URL)
export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    
    initializeDatabase()
      .then(() => setReady(true))
      .catch(() => setNotice({ text: 'No se pudo abrir la base de datos.', error: true }));
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
      </SafeAreaView>
    );
  }

  const showNotice = (text: string, error = false) => setNotice({ text, error });
  const goTo = (next: Screen, nextNotice: Notice = null) => {
    setNotice(nextNotice);
    setScreen(next);
  };
  const goToLogin = (nextNotice: Notice = null) => goTo('login', nextNotice);

  if (screen === 'login') {
    return (
      <LoginScreen
        notice={notice}
        onNotice={showNotice}
        onLogin={(loggedUser) => {
          setUser(loggedUser);
          setNotice(null);
          setScreen('home');
        }}
        onRegister={() => goTo('register')}
        onRecovery={() => goTo('recovery')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        notice={notice}
        onNotice={showNotice}
        onBack={() => goToLogin()}
        onCreated={() => goToLogin({ text: 'Cuenta creada. Ya puedes iniciar sesión.' })}
      />
    );
  }

  if (screen === 'recovery') {
    return (
      <RecoveryScreen
        notice={notice}
        onNotice={showNotice}
        onBack={() => goToLogin()}
        onReset={() =>
          goToLogin({ text: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
        }
      />
    );
  }

  return (
    <HomeScreen
      user={user}
      onLogout={() => {
        setUser(null);
        goToLogin();
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 12, color: colors.muted },
});
