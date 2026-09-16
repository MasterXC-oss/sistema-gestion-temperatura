import { useState } from 'react';
import { Text } from 'react-native';

import {
  ActionButton,
  AuthLayout,
  Field,
  LinkButton,
  Logo,
  NoticeView,
} from '../components';
import { authenticate, type User } from '../database';
import { commonStyles } from '../styles/common';
import type { Notice, NotifyFn } from '../types';

type Props = {
  notice: Notice;
  onNotice: NotifyFn;
  onLogin: (user: User) => void;
  onRegister: () => void;
  onRecovery: () => void;
};

export function LoginScreen({ notice, onNotice, onLogin, onRegister, onRecovery }: Props) {
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
    <AuthLayout>
      <Logo />
      <Text style={commonStyles.title}>Bienvenido</Text>
      <Text style={commonStyles.subtitle}>Ingresa para continuar</Text>
      <Field
        label="Usuario o correo"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Ingresa tu usuario"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Ingresa tu contraseña"
        secureTextEntry
      />
      <LinkButton title="¿Olvidaste tu contraseña?" onPress={onRecovery} align="right" />
      <ActionButton title={busy ? 'VALIDANDO...' : 'INGRESAR'} onPress={login} disabled={busy} />
      <LinkButton title="Crear una cuenta" onPress={onRegister} />
      <NoticeView notice={notice} />
      <Text style={commonStyles.footer}>Una experiencia fresca y sencilla</Text>
    </AuthLayout>
  );
}
