// components/ExercisesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import Modal from 'react-native-modal';

import { exercises, exerciseDetails } from '@/constants/exercises';

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
          {exercises[muscleGroup as keyof typeof exercises].map((exercise: string) => (
            <TouchableOpacity key={exercise} onPress={() => handleExercisePress(exercise)}>
              <Text style={styles.exercise}>{exercise}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Modal 
        isVisible={!!selectedExercise} 
        onSwipeComplete={closeModal} 
        swipeDirection="down"
        coverScreen
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedExercise}</Text>
          <Text style={styles.modalText}>
            {selectedExercise ? exerciseDetails[selectedExercise as keyof typeof exerciseDetails] : ''}
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