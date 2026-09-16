import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  authenticate,
  createUser,
  initializeDatabase,
  requestResetCode,
  resetPassword,
  User,
  validateEmail,
  verifyResetCode,
} from './src/database';

type Screen = 'login' | 'register' | 'recovery' | 'home';
type Notice = { text: string; error?: boolean } | null;

const colors = {
  background: '#e9faff',
  text: '#164e63',
  muted: '#64748b',
  accent: '#0891b2',
  border: '#d8edf3',
  mint: '#2dd4bf',
  blue: '#38bdf8',
};

function Logo({ lock = false }: { lock?: boolean }) {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoText}>{lock ? '🔐' : '🌡'}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a0b6bf"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={keyboardType}
      />
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={['#38bdf8', '#2dd4bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function LinkButton({
  title,
  onPress,
  align = 'center',
}: {
  title: string;
  onPress: () => void;
  align?: 'center' | 'right';
}) {
  return (
    <Pressable style={[styles.linkButton, align === 'right' && styles.linkRight]} onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

function Layout({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const content = (
    <View style={styles.card}>
      <View pointerEvents="none" style={[styles.circle, styles.circleOne]} />
      <View pointerEvents="none" style={[styles.circle, styles.circleTwo]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
  return (
    <LinearGradient colors={['#e9faff', '#f7ffff']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={styles.container}>{content}</ScrollView>
        ) : (
          <View style={styles.container}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
        onRegister={() => {
          setNotice(null);
          setScreen('register');
        }}
        onRecovery={() => {
          setNotice(null);
          setScreen('recovery');
        }}
      />
    );
  }
  if (screen === 'register') {
    return (
      <RegisterScreen
        notice={notice}
        onNotice={showNotice}
        onBack={() => {
          setNotice(null);
          setScreen('login');
        }}
        onCreated={() => {
          setNotice({ text: 'Cuenta creada. Ya puedes iniciar sesión.' });
          setScreen('login');
        }}
      />
    );
  }
  if (screen === 'recovery') {
    return (
      <RecoveryScreen
        notice={notice}
        onNotice={showNotice}
        onBack={() => {
          setNotice(null);
          setScreen('login');
        }}
        onReset={() => {
          setNotice({ text: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
          setScreen('login');
        }}
      />
    );
  }
  return (
    <HomeScreen
      user={user}
      onLogout={() => {
        setUser(null);
        setNotice(null);
        setScreen('login');
      }}
    />
  );
}

function LoginScreen({
  notice,
  onNotice,
  onLogin,
  onRegister,
  onRecovery,
}: {
  notice: Notice;
  onNotice: (text: string, error?: boolean) => void;
  onLogin: (user: User) => void;
  onRegister: () => void;
  onRecovery: () => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (!identifier.trim() || !password) {
      onNotice('Ingresa tu usuario y contraseña.', true);
      return;
    }
    setBusy(true);
    try {
      const result = await authenticate(identifier, password);
      if (result.ok && result.user) onLogin(result.user);
      else onNotice(result.message, true);
    } catch {
      onNotice('No se pudo iniciar sesión.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <Logo />
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Ingresa para continuar</Text>
      <Field label="Usuario o correo" value={identifier} onChangeText={setIdentifier}
        placeholder="Ingresa tu usuario" />
      <Field label="Contraseña" value={password} onChangeText={setPassword}
        placeholder="Ingresa tu contraseña" secureTextEntry />
      <LinkButton title="¿Olvidaste tu contraseña?" onPress={onRecovery} align="right" />
      <ActionButton title={busy ? 'VALIDANDO...' : 'INGRESAR'} onPress={login} disabled={busy} />
      <LinkButton title="Crear una cuenta" onPress={onRegister} />
      <Notice notice={notice} />
      <Text style={styles.footer}>Una experiencia fresca y sencilla</Text>
    </Layout>
  );
}

function RegisterScreen({
  notice,
  onNotice,
  onBack,
  onCreated,
}: {
  notice: Notice;
  onNotice: (text: string, error?: boolean) => void;
  onBack: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const register = async () => {
    if (!name.trim() || !validateEmail(email)) {
      onNotice('Escribe un nombre y correo válidos.', true);
      return;
    }
    setBusy(true);
    try {
      const result = await createUser(name, email, password);
      if (result.ok) onCreated();
      else onNotice(result.message, true);
    } catch {
      onNotice('No se pudo crear la cuenta.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <Logo />
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Completa tus datos para comenzar</Text>
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ingresa tu nombre" />
      <Field label="Correo electrónico" value={email} onChangeText={setEmail}
        placeholder="Ingresa tu correo" keyboardType="email-address" />
      <Field label="Contraseña" value={password} onChangeText={setPassword}
        placeholder="Mínimo 12 caracteres" secureTextEntry />
      <ActionButton title={busy ? 'GUARDANDO...' : 'CREAR CUENTA'} onPress={register} disabled={busy} />
      <LinkButton title="Volver al inicio de sesión" onPress={onBack} />
      <Notice notice={notice} />
    </Layout>
  );
}

function RecoveryScreen({
  notice,
  onNotice,
  onBack,
  onReset,
}: {
  notice: Notice;
  onNotice: (text: string, error?: boolean) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    if (!validateEmail(email)) {
      onNotice('Escribe un correo válido.', true);
      return;
    }
    setBusy(true);
    try {
      const result = await requestResetCode(email);
      onNotice(
        result.ok ? 'Revisa tu correo e ingresa el código recibido.' : result.message,
        !result.ok,
      );
      if (result.ok) setStep(2);
    } catch {
      onNotice('No se pudo generar el código.', true);
    } finally {
      setBusy(false);
    }
  };

  const continueWithCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      onNotice('Escribe el código de 6 dígitos.', true);
      return;
    }
    setBusy(true);
    try {
      const result = await verifyResetCode(email, code);
      if (result.ok) {
        setStep(3);
        onNotice('Código correcto. Ahora crea tu nueva contraseña.');
      } else {
        onNotice(result.message, true);
      }
    } catch {
      onNotice('No se pudo verificar el código.', true);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!code.trim() || !password) {
      onNotice('Ingresa el código y la nueva contraseña.', true);
      return;
    }
    setBusy(true);
    try {
      const result = await resetPassword(email, code, password);
      if (result.ok) onReset();
      else onNotice(result.message, true);
    } catch {
      onNotice('No se pudo actualizar la contraseña.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <Logo lock />
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Te ayudaremos a volver a entrar</Text>
      <Field label="Correo electrónico" value={email} onChangeText={setEmail}
        placeholder="Ingresa tu correo" keyboardType="email-address" />
      {step === 1 && (
        <ActionButton title="ENVIAR CÓDIGO" onPress={sendCode} disabled={busy} />
      )}
      {step === 2 && (
        <>
          <Field label="Código de recuperación" value={code} onChangeText={setCode}
            placeholder="Código de 6 dígitos" keyboardType="numeric" secureTextEntry />
          <ActionButton title="CONTINUAR" onPress={continueWithCode} disabled={busy} />
        </>
      )}
      {step === 3 && (
        <>
          <Field label="Nueva contraseña" value={password} onChangeText={setPassword}
            placeholder="Nueva contraseña segura" secureTextEntry />
          <ActionButton title="GUARDAR CONTRASEÑA" onPress={changePassword} disabled={busy} />
        </>
      )}
      <LinkButton title="Volver al inicio de sesión" onPress={onBack} />
      <Notice notice={notice} />
    </Layout>
  );
}

function HomeScreen({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <Layout scroll={false}>
      <Logo />
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.homeText}>Hola, {user?.name ?? 'usuario'}.</Text>
      <Text style={styles.subtitle}>Has iniciado sesión correctamente.</Text>
      <ActionButton title="CERRAR SESIÓN" onPress={onLogout} />
    </Layout>
  );
}

function Notice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <Text style={[styles.notice, notice.error && styles.error]}>{notice.text}</Text>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.muted },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 45 },
  card: { width: '100%', maxWidth: 390, minHeight: 560, alignSelf: 'center',
    justifyContent: 'center', padding: 28, overflow: 'hidden' },
  content: { position: 'relative', zIndex: 1 },
  circle: { position: 'absolute', borderRadius: 999, zIndex: 0 },
  circleOne: { width: 180, height: 180, top: -70, right: -70, backgroundColor: '#b8f0ff', opacity: 0.7 },
  circleTwo: { width: 140, height: 140, bottom: -50, left: -50, backgroundColor: '#b9f4e9', opacity: 0.6 },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 28, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.blue,
    shadowColor: colors.mint, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25,
    shadowRadius: 15, elevation: 5 },
  logoText: { fontSize: 34 },
  title: { marginBottom: 8, color: colors.text, fontSize: 30, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginBottom: 35, color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  field: { marginBottom: 18 },
  label: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: '700' },
  input: { height: 54, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, backgroundColor: '#fff', color: colors.text, fontSize: 15,
    shadowColor: colors.text, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 1 },
  button: { height: 56, marginTop: 8, borderRadius: 17, justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden', backgroundColor: colors.mint,
    shadowColor: colors.mint, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25,
    shadowRadius: 12, elevation: 4 },
  buttonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkRight: { alignItems: 'flex-end', paddingRight: 2, marginBottom: 8 },
  linkText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  notice: { marginTop: 12, color: colors.accent, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  error: { color: '#c2410c' },
  footer: { marginTop: 22, color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  homeText: { marginBottom: 8, color: colors.text, fontSize: 19, textAlign: 'center' },
});
