import { Text } from 'react-native';

import { ActionButton, AuthLayout, Logo } from '../components';
import type { User } from '../database';
import { commonStyles } from '../styles/common';

type Props = {
  user: User | null;
  onLogout: () => void;
};

export function HomeScreen({ user, onLogout }: Props) {
  return (
    <AuthLayout scroll={false}>
      <Logo />
      <Text style={commonStyles.title}>Bienvenido</Text>
      <Text style={commonStyles.homeText}>Hola, {user?.name ?? 'usuario'}.</Text>
      <Text style={commonStyles.subtitle}>Has iniciado sesión correctamente.</Text>
      <ActionButton title="CERRAR SESIÓN" onPress={onLogout} />
    </AuthLayout>
  );
}
