import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SessionsStackParamList, TranscriptSegment, SOAPNote } from '../../types';
import { getTranscriptApi } from '../../api/transcript.api';
import { getSOAPNoteApi } from '../../api/transcript.api';
import { TranscriptFeed } from '../../components/transcript/TranscriptFeed';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';

type Props = {
  route: RouteProp<SessionsStackParamList, 'SessionDetail'>;
  navigation: NativeStackNavigationProp<SessionsStackParamList, 'SessionDetail'>;
};

export default function SessionDetailScreen({ route }: Props) {
  const { sessionId } = route.params;
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTranscriptApi(sessionId), getSOAPNoteApi(sessionId)]).then(([t, s]) => {
      setTranscript(t);
      setSoap(s);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Transcript</Text>
      <View style={styles.feedBox}>
        <TranscriptFeed segments={transcript} />
      </View>

      {soap && (
        <>
          <Text style={styles.section}>SOAP Note</Text>
          <ScrollView contentContainerStyle={styles.soapScroll}>
            {(['subjective', 'objective', 'assessment', 'plan'] as const).map((key) => (
              <Card key={key} style={styles.soapCard}>
                <Text style={styles.soapKey}>{key.toUpperCase()}</Text>
                <Text style={styles.soapVal}>{soap[key]}</Text>
              </Card>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  section: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 8 },
  feedBox: { height: 300, backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  soapScroll: { paddingBottom: 40 },
  soapCard: {},
  soapKey: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 4, letterSpacing: 1 },
  soapVal: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
});
