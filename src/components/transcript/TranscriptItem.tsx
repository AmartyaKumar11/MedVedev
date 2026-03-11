import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { TranscriptSegment } from '../../types';

interface TranscriptItemProps {
  segment: TranscriptSegment;
}

export function TranscriptItem({ segment }: TranscriptItemProps) {
  const timeLabel = `${segment.startTime.toFixed(1)}s`;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Badge label={segment.speaker} />
        <Text style={styles.time}>{timeLabel}</Text>
        <Text style={styles.confidence}>conf: {(segment.confidence * 100).toFixed(0)}%</Text>
      </View>
      <Text style={styles.text}>{segment.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  time: { fontSize: 11, color: Colors.textSecondary },
  confidence: { fontSize: 11, color: Colors.secondary, marginLeft: 'auto' },
  text: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
});
