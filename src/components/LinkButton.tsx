import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  align?: 'center' | 'right';
};

export function LinkButton({ title, onPress, align = 'center' }: Props) {
  return (
    <Pressable
      style={[styles.linkButton, align === 'right' && styles.linkRight]}
      onPress={onPress}
    >
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkRight: { alignItems: 'flex-end', paddingRight: 2, marginBottom: 8 },
  linkText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
