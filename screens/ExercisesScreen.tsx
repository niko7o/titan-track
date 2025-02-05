// components/ExercisesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';

import Modal from 'react-native-modal';

import { exerciseDetails } from '@/constants/exercises';

// Dynamically extract unique muscle groups
const muscleGroups = Array.from(
  new Set(Object.values(exerciseDetails).map((detail) => detail.muscleGroup))
);

const ExercisesScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const handleExercisePress = (exercise: string) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  const toggleMuscleGroup = (muscleGroup: string) => {
    setSelectedMuscleGroup(selectedMuscleGroup === muscleGroup ? null : muscleGroup);
  };

  const filteredExercises = Object.keys(exerciseDetails).filter((exercise) => {
    const matchesSearch = exercise.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup
      ? exerciseDetails[exercise as keyof typeof exerciseDetails].muscleGroup === selectedMuscleGroup
      : true;
    return matchesSearch && matchesMuscleGroup;
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="always"
      />
      <View style={styles.tagsContainer}>
        {muscleGroups.map((group) => (
          <TouchableOpacity
            key={group}
            style={[
              styles.tag,
              selectedMuscleGroup === group && styles.selectedTag,
            ]}
            onPress={() => toggleMuscleGroup(group)}
          >
            <Text style={styles.tagText}>{group}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView>
        {filteredExercises.map((exercise) => (
          <TouchableOpacity key={exercise} onPress={() => handleExercisePress(exercise)}>
            <Text style={styles.exercise}>{exercise}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal 
        isVisible={!!selectedExercise} 
        onSwipeComplete={closeModal} 
        swipeDirection="down"
        coverScreen
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedExercise}</Text>
          {selectedExercise && (
            <>
              <Image
                source={{ uri: exerciseDetails[selectedExercise as keyof typeof exerciseDetails].media }}
                style={styles.media}
              />
              <Text style={styles.modalText}>
                {exerciseDetails[selectedExercise as keyof typeof exerciseDetails].description}
              </Text>
              <Text style={styles.modalText}>
                Muscle Group: {exerciseDetails[selectedExercise as keyof typeof exerciseDetails].muscleGroup}
              </Text>
            </>
          )}
          <TouchableOpacity onPress={closeModal}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 20,
    borderRadius: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTag: {
    backgroundColor: '#007BFF',
  },
  tagText: {
    color: 'black',
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
  media: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    fontSize: 18,
    color: 'red',
  },
});

export default ExercisesScreen;