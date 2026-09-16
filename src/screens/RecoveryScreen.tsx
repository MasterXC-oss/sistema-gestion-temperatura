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
import {
  requestResetCode,
  resetPassword,
  validateEmail,
  verifyResetCode,
} from '../database';
import { commonStyles } from '../styles/common';
import type { Notice, NotifyFn } from '../types';

type Props = {
  notice: Notice;
  onNotice: NotifyFn;
  onBack: () => void;
  onReset: () => void;
};

type Step = 1 | 2 | 3;

export function RecoveryScreen({ notice, onNotice, onBack, onReset }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<Step>(1);
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
    <AuthLayout>
      <Logo lock />
      <Text style={commonStyles.title}>Recuperar contraseña</Text>
      <Text style={commonStyles.subtitle}>Te ayudaremos a volver a entrar</Text>
      <Field
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        placeholder="Ingresa tu correo"
        keyboardType="email-address"
      />
      {step === 1 && (
        <ActionButton title="ENVIAR CÓDIGO" onPress={sendCode} disabled={busy} />
      )}
      {step === 2 && (
        <>
          <Field
            label="Código de recuperación"
            value={code}
            onChangeText={setCode}
            placeholder="Código de 6 dígitos"
            keyboardType="numeric"
            secureTextEntry
          />
          <ActionButton title="CONTINUAR" onPress={continueWithCode} disabled={busy} />
        </>
      )}
      {step === 3 && (
        <>
          <Field
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Nueva contraseña segura"
            secureTextEntry
          />
          <ActionButton title="GUARDAR CONTRASEÑA" onPress={changePassword} disabled={busy} />
        </>
      )}
      <LinkButton title="Volver al inicio de sesión" onPress={onBack} />
      <NoticeView notice={notice} />
    </AuthLayout>
  );
}
