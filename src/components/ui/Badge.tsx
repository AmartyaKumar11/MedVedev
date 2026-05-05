import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  label: string;
  style?: ViewStyle;
}

export function Badge({ label }: BadgeProps) {
  const bgColor =
    label === 'DOCTOR' ? Colors.doctor :
    label === 'PATIENT' ? Colors.patient : Colors.unknown;

  return (
    <Text style={[styles.badge, { backgroundColor: bgColor }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
});
