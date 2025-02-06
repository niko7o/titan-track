// components/NewSetScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allExercises, exerciseDetails } from '../constants/exercises';

interface OngoingExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
}

const NewSetScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string>(allExercises[0]);
  const [plannedSets, setPlannedSets] = useState<number>(0);
  const [ongoingExercise, setOngoingExercise] = useState<OngoingExercise | null>(null);
  const [isPickerVisible, setPickerVisible] = useState<boolean>(false);

  const startExercise = () => {
    if (selectedExercise && plannedSets > 0) {
      setOngoingExercise({
        exercise: selectedExercise,
        plannedSets,
        completedSets: Array(plannedSets).fill({ reps: 0, weight: 0 }),
      });
    }
  };

  const recordSet = (setIndex: number, reps: number, weight: number) => {
    if (ongoingExercise) {
      const updatedSets = [...ongoingExercise.completedSets];
      updatedSets[setIndex] = { reps, weight };
      setOngoingExercise({ ...ongoingExercise, completedSets: updatedSets });
    }
  };

  const completeSet = async () => {
    if (ongoingExercise) {
      const completedExercise = {
        ...ongoingExercise,
        date: new Date().toISOString(),
        muscleGroup: exerciseDetails[ongoingExercise.exercise as keyof typeof exerciseDetails].muscleGroup,
      };
      try {
        const existingData = await AsyncStorage.getItem('completedExercises');
        const exercises = existingData ? JSON.parse(existingData) : [];
        exercises.push(completedExercise);
        await AsyncStorage.setItem('completedExercises', JSON.stringify(exercises));
        Alert.alert('Success', 'Exercise set completed and saved!');
        setOngoingExercise(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to save exercise set.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Configuration</Text> */}
      
      {selectedExercise && (
        <Text style={styles.selectedExerciseText}>
          Selected: {selectedExercise}
        </Text>
      )}

      {ongoingExercise ? (
        <>
        <ScrollView style={styles.ongoingContainer}>
          {ongoingExercise.completedSets.map((set, index) => (
            <View key={index} style={styles.setContainer}>
              <Text>Set {index + 1}:</Text>
              <TextInput
                style={styles.input}
                placeholder="Repetitions"
                keyboardType="numeric"
                onChangeText={(text) => recordSet(index, Number(text), set.weight)}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight"
                keyboardType="numeric"
                onChangeText={(text) => recordSet(index, set.reps, Number(text))}
              />
            </View>
          ))}
        </ScrollView>
        <Button title="Complete Set" onPress={completeSet} />
        </>
      ) : (
        <>
        <TextInput
          style={styles.selectInput}
          placeholder="Enter number of sets"
          keyboardType="numeric"
          onChangeText={(text) => setPlannedSets(Number(text))}
        />

        <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Browse Exercises</Text>
        </TouchableOpacity>

        <Button
          title="Start Exercise"
          onPress={startExercise}
          disabled={!selectedExercise || plannedSets <= 0}
        />
      </>
      )}

      <Modal visible={isPickerVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedExercise}
              onValueChange={(itemValue) => setSelectedExercise(itemValue)}
            >
              {allExercises.map((exercise) => (
                <Picker.Item key={exercise} label={exercise} value={exercise} />
              ))}
            </Picker>
            <Button title="Done" onPress={() => setPickerVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  selectedExerciseText: {
    fontSize: 16,
    marginBottom: 10,
    color: 'green',
  },
  selectButton: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 5,
    marginBottom: 20,
  },
  selectButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 10,
    flexGrow: 1,
    borderRadius: 8
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 10,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  ongoingContainer: {
    marginTop: 20,
    flex: 1,
  },
  ongoingTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    gap: 8
  },
});

export default NewSetScreen;