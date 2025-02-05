// components/ExerciseTracker.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const ExerciseTracker = () => {
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const handleSave = () => {
    // Logic to save exercise data
    console.log(`Exercise: ${exercise}, Sets: ${sets}, Reps: ${reps}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Exercise Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter exercise"
        value={exercise}
        onChangeText={setExercise}
      />
      <Text style={styles.label}>Sets</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter number of sets"
        value={sets}
        onChangeText={setSets}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Reps</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter number of reps"
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
});

export default ExerciseTracker;