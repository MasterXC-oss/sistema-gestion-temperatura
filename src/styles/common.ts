import { StyleSheet } from 'react-native';

import { colors } from '../theme';

export const commonStyles = StyleSheet.create({
  title: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 35,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    marginTop: 22,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  homeText: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 19,
    textAlign: 'center',
  },
});
