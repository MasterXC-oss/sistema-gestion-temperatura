import { StyleSheet, Text } from 'react-native';

import { colors } from '../theme';
import type { Notice } from '../types';

export function NoticeView({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <Text style={[styles.notice, notice.error && styles.error]}>{notice.text}</Text>;
}

const styles = StyleSheet.create({
  notice: {
    marginTop: 12,
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  error: { color: '#c2410c' },
});
