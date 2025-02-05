// components/ExercisesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

const exercises = {
  Chest: ['Bench Press', 'Push Ups', 'Chest Fly'],
  Biceps: ['Bicep Curls', 'Hammer Curls', 'Concentration Curls'],
  Triceps: ['Tricep Dips', 'Tricep Extensions', 'Skull Crushers'],
  Shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises'],
  Back: ['Pull Ups', 'Deadlifts', 'Bent Over Rows'],
  Legs: ['Squats', 'Lunges', 'Leg Press'],
};

const exerciseDetails = {
    'Bench Press': 'A compound exercise for chest development, primarily targeting the pectoral muscles.',
    'Push Ups': 'A bodyweight exercise that targets the chest, triceps, and shoulders.',
    'Chest Fly': 'An isolation exercise that focuses on the chest muscles, performed with dumbbells or cables.',
    'Bicep Curls': 'An isolation exercise for the biceps, typically performed with dumbbells or a barbell.',
    'Hammer Curls': 'A variation of bicep curls that targets the brachialis and forearm muscles.',
    'Concentration Curls': 'An exercise that isolates the biceps for maximum contraction and growth.',
    'Tricep Dips': 'A bodyweight exercise that targets the triceps, performed on parallel bars or a bench.',
    'Tricep Extensions': 'An isolation exercise for the triceps, performed with dumbbells or a cable machine.',
    'Skull Crushers': 'An exercise that targets the triceps, performed lying down with a barbell or dumbbells.',
    'Shoulder Press': 'A compound exercise for the shoulders, performed with dumbbells or a barbell.',
    'Lateral Raises': 'An isolation exercise for the lateral deltoids, performed with dumbbells.',
    'Front Raises': 'An exercise that targets the front deltoids, performed with dumbbells or a barbell.',
    'Pull Ups': 'A bodyweight exercise that targets the back, biceps, and shoulders.',
    'Deadlifts': 'A compound exercise that targets the entire posterior chain, including the back and legs.',
    'Bent Over Rows': 'An exercise that targets the back muscles, performed with a barbell or dumbbells.',
    'Squats': 'A compound exercise that targets the legs, glutes, and core.',
    'Lunges': 'An exercise that targets the legs and glutes, performed with bodyweight or added resistance.',
    'Leg Press': 'A machine-based exercise that targets the quadriceps, hamstrings, and glutes.',
  };

const ExercisesScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const handleExercisePress = (exercise: string) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  return (
    <ScrollView style={styles.container}>
      {Object.keys(exercises).map((muscleGroup) => (
        <View key={muscleGroup} style={styles.groupContainer}>
          <Text style={styles.groupTitle}>{muscleGroup}</Text>
          {exercises[muscleGroup].map((exercise) => (
            <TouchableOpacity key={exercise} onPress={() => handleExercisePress(exercise)}>
              <Text style={styles.exercise}>{exercise}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Modal isVisible={!!selectedExercise} onSwipeComplete={closeModal} swipeDirection="down">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedExercise}</Text>
          <Text style={styles.modalText}>
            {selectedExercise ? exerciseDetails[selectedExercise] : ''}
          </Text>
          <TouchableOpacity onPress={closeModal}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exercise: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
    color: 'blue',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 18,
    color: 'red',
  },
});

export default ExercisesScreen;