import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface CompletedExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
  date: string;
}

const HomeScreen = () => {
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchCompletedExercises = async () => {
        try {
          const data = await AsyncStorage.getItem('completedExercises');
          if (data) {
            setCompletedExercises(JSON.parse(data));
          }
        } catch (error) {
          console.error('Failed to load completed exercises:', error);
        }
      };

      fetchCompletedExercises();
    }, [])
  );

  const deleteExercise = async (index: number) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const updatedExercises = completedExercises.filter((_, i) => i !== index);
              setCompletedExercises(updatedExercises);
              await AsyncStorage.setItem('completedExercises', JSON.stringify(updatedExercises));
            } catch (error) {
              console.error('Failed to delete exercise:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.logo}>Titan Track</Text>
      <Text style={styles.title}>Completed Exercises</Text>
      {completedExercises.map((exercise, index) => (
        <View key={index} style={styles.exerciseContainer}>
          <Text style={styles.exerciseTitle}>{exercise.exercise}</Text>
          <Text>Date: {new Date(exercise.date).toLocaleDateString()}</Text>
          {exercise.completedSets.map((set, setIndex) => (
            <Text key={setIndex}>
              Set {setIndex + 1}: {set.reps} reps, {set.weight} kg
            </Text>
          ))}
          <Button title="Delete" onPress={() => deleteExercise(index)} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  exerciseContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default HomeScreen;