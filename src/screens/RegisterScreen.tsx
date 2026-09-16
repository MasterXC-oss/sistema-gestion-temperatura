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
import { createUser, validateEmail } from '../database';
import { commonStyles } from '../styles/common';
import type { Notice, NotifyFn } from '../types';

type Props = {
  notice: Notice;
  onNotice: NotifyFn;
  onBack: () => void;
  onCreated: () => void;
};

export function RegisterScreen({ notice, onNotice, onBack, onCreated }: Props) {
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
    <AuthLayout>
      <Logo />
      <Text style={commonStyles.title}>Crear cuenta</Text>
      <Text style={commonStyles.subtitle}>Completa tus datos para comenzar</Text>
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ingresa tu nombre" />
      <Field
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        placeholder="Ingresa tu correo"
        keyboardType="email-address"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 12 caracteres"
        secureTextEntry
      />
      <ActionButton
        title={busy ? 'GUARDANDO...' : 'CREAR CUENTA'}
        onPress={register}
        disabled={busy}
      />
      <LinkButton title="Volver al inicio de sesión" onPress={onBack} />
      <NoticeView notice={notice} />
    </AuthLayout>
  );
}
