// components/NewSetScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Modal, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allExercises } from '../constants/exercises';

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
      <Text style={styles.title}>Start a New Set</Text>
      
      {selectedExercise && (
        <Text style={styles.selectedExerciseText}>
          Selected Exercise: {selectedExercise}
        </Text>
      )}

      <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>Select Exercise</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.selectInput}
        placeholder="Enter number of sets"
        keyboardType="numeric"
        onChangeText={(text) => setPlannedSets(Number(text))}
      />

      <Button
        title="Start Exercise"
        onPress={startExercise}
        disabled={!selectedExercise || plannedSets <= 0}
      />

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

      {ongoingExercise && (
        <View style={styles.ongoingContainer}>
          <Text style={styles.ongoingTitle}>Ongoing: {ongoingExercise.exercise}</Text>
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
          <Button title="Complete Set" onPress={completeSet} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: '45%',
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
  },
  ongoingTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default NewSetScreen;