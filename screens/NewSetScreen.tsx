import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Button, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Animated, 
  PanResponder, 
  FlatList, 
  useWindowDimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { allExercises, exerciseDetails } from '../constants/exercises';

interface OngoingExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
}

const NewSetScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [plannedSets, setPlannedSets] = useState<number>(0);
  const [ongoingExercise, setOngoingExercise] = useState<OngoingExercise | null>(null);
  const [isDrawerVisible, setDrawerVisible] = useState<boolean>(false);

  const { height } = useWindowDimensions();
  
  // Drawer animations
  const drawerHeight = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  const closeDrawerFast = () => {
    Animated.parallel([
      Animated.timing(drawerHeight, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setDrawerVisible(false);
    });
  };
  
  const openDrawer = () => {
    setDrawerVisible(true);
    drawerHeight.setValue(height); // Reset position before animating
    backdropOpacity.setValue(0); // Reset opacity before animating
    
    // Create parallel animation group
    Animated.parallel([
      // Animate drawer up
      Animated.spring(drawerHeight, {
        toValue: 0,
        useNativeDriver: true,
        friction: 12,
      }),
      // Fade in backdrop
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        // Only allow dragging down (positive dy)
        if (dy > 0) {
          drawerHeight.setValue(dy);
          const dragPercentage = Math.min(dy / (height * 0.5), 1); // calculate opacity based on drag position (1 - percentage dragged)
          backdropOpacity.setValue(1 - dragPercentage);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > height * 0.2 || vy > 0.5) {
          closeDrawerFast();
        } else {
          Animated.parallel([
            Animated.spring(drawerHeight, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

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

  const selectExercise = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    // closeDrawerFast();
  };

  const renderSetup = () => (
    <>
      <TextInput
        style={styles.selectInput}
        placeholder="Enter number of sets"
        keyboardType="numeric"
        onChangeText={(text) => setPlannedSets(Number(text))}
      />
      <TouchableOpacity onPress={openDrawer} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>Browse Exercises</Text>
      </TouchableOpacity>
      <Button
        title="Start Exercise"
        onPress={startExercise}
        disabled={!selectedExercise || plannedSets <= 0}
      />
    </>
  );

  const renderOngoing = () => (
    <>
      <ScrollView style={styles.ongoingContainer}>
        {ongoingExercise?.completedSets.map((set, index) => (
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
  );

  return (
    <View style={styles.container}>
      {selectedExercise && (
        <Text style={styles.selectedExerciseText}>
          Selected: {selectedExercise}
        </Text>
      )}

      {ongoingExercise ? renderOngoing() : renderSetup()}
      
      {/* Backdrop with fade animation - only visible when drawer is open */}
      {isDrawerVisible && (
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={closeDrawerFast}
          />
        </Animated.View>
      )}
      
      {/* Drawer - positioned absolutely */}
      {isDrawerVisible && (
        <Animated.View 
          style={[
            styles.drawerContainer,
            { transform: [{ translateY: drawerHeight }] }
          ]}
        >
          {/* Drawer Drag handle */}
          <View 
            style={styles.drawerHandleContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.drawerHandle} />
          </View>
          
          {/* Drawer Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeDrawerFast}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Choose Exercise</Text>
          </View>
          
          {/* Exercise list */}
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item}
            style={styles.exerciseList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.exerciseItem,
                  selectedExercise === item && styles.selectedExerciseItem
                ]}
                onPress={() => selectExercise(item)}
              >
                <Text 
                  style={[
                    styles.exerciseItemText,
                    selectedExercise === item && styles.selectedExerciseItemText
                  ]}
                >
                  {item}
                </Text>
                {selectedExercise === item && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
          
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={closeDrawerFast}
          >
            <Text style={styles.doneButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    padding: 20,
  },
  selectedExerciseText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#007BFF',
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
    fontSize: 16,
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
    fontSize: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 1,
  },
  backdropTouchable: {
    width: '100%',
    height: '100%',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    zIndex: 2,
    overflow: 'hidden',
  },
  drawerHandleContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    zIndex: 5,
    backgroundColor: 'white',
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
  },
  drawerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedExerciseItem: {
    backgroundColor: '#f0f8ff',
  },
  exerciseItemText: {
    fontSize: 16,
  },
  selectedExerciseItemText: {
    color: '#007BFF',
  },
  checkmark: {
    color: '#007BFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#007BFF',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  ongoingContainer: {
    marginTop: 20,
    flex: 1,
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