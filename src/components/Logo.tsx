import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  lock?: boolean;
};

export function Logo({ lock = false }: Props) {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoText}>{lock ? '🔐' : '🌡'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    marginBottom: 28,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  logoText: { fontSize: 34 },
});
