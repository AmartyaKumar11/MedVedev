import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const bgColor =
    variant === 'primary' ? Colors.primary :
    variant === 'danger' ? Colors.danger : Colors.surface;

  const textColor = variant === 'secondary' ? Colors.primary : Colors.white;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, variant === 'secondary' && styles.outline, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
});
