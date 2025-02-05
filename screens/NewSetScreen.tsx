// components/NewSetScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import ExerciseTracker from '@/components/ExerciseTracker';

const NewSetScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Track your new set</Text>
      <ExerciseTracker />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default NewSetScreen;