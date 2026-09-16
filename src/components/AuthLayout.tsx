import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

export function AuthLayout({ children, scroll = true }: Props) {
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 45,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    minHeight: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 28,
    overflow: 'hidden',
  },
  content: { position: 'relative', zIndex: 1 },
  circle: { position: 'absolute', borderRadius: 999, zIndex: 0 },
  circleOne: {
    width: 180,
    height: 180,
    top: -70,
    right: -70,
    backgroundColor: '#b8f0ff',
    opacity: 0.7,
  },
  circleTwo: {
    width: 140,
    height: 140,
    bottom: -50,
    left: -50,
    backgroundColor: '#b9f4e9',
    opacity: 0.6,
  },
});
