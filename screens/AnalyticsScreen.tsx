import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface CompletedExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
  date: string;
  muscleGroup: string;
}

const AnalyticsScreen = () => {
  const [exerciseData, setExerciseData] = useState<CompletedExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseData = async () => {
        try {
          const data = await AsyncStorage.getItem('completedExercises');
        if (data) {
          setExerciseData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Failed to load exercise data:', error);
      }
    };
    fetchExerciseData();
    }, [])
  );

  const exerciseNames = Array.from(
    new Set(exerciseData.map((entry) => entry.exercise))
  );

  const filterDataByExercise = (exercise: string) => {
    return exerciseData
      .filter((entry) => entry.exercise === exercise)
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString(),
        weight: entry.completedSets.reduce((max, set) => Math.max(max, set.weight), 0),
      }))
      .filter((data) => isFinite(data.weight));
  };

  const chartData = selectedExercise ? filterDataByExercise(selectedExercise) : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tagsContainer}>
        {exerciseNames.map((exercise) => (
          <TouchableOpacity
            key={exercise}
            style={[
              styles.tag,
              selectedExercise === exercise && styles.selectedTag,
            ]}
            onPress={() => setSelectedExercise(selectedExercise === exercise ? null : exercise)}
          >
            <Text style={styles.tagText}>{exercise}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {chartData.length > 0 ? (
        <LineChart
          data={{
            labels: chartData.map((data) => data.date),
            datasets: [
              {
                data: chartData.map((data) => data.weight),
              },
            ],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          yAxisSuffix="kg"
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      ) : (
        <Text>Please select an exercise to view analytics.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});

export default AnalyticsScreen;