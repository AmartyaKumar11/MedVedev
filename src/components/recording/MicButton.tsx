import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function MicButton({ isRecording, onPress }: MicButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.ring, isRecording && styles.ringActive, { transform: [{ scale: pulse }] }]} />
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonActive]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0,
  },
  ringActive: { opacity: 0.3, backgroundColor: Colors.recording },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonActive: { backgroundColor: Colors.recording },
});
