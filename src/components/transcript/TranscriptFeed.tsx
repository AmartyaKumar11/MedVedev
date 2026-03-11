import React, { useRef, useEffect } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { TranscriptItem } from './TranscriptItem';
import { TranscriptSegment } from '../../types';
import { Colors } from '../../constants/colors';

interface TranscriptFeedProps {
  segments: TranscriptSegment[];
  emptyMessage?: string;
}

export function TranscriptFeed({ segments, emptyMessage = 'Waiting for speech...' }: TranscriptFeedProps) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (segments.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [segments.length]);

  if (segments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={segments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TranscriptItem segment={item} />}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: Colors.textLight, fontSize: 15 },
});
