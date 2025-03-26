import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
import { Colors } from '@/constants/Colors';

interface OngoingExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
}

const NewSetScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [plannedSets, setPlannedSets] = useState<number>(3);
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
    } else {
      Alert.alert('Missing Information', 'Please select an exercise first.');
    }
  };

  const incrementSets = () => {
    setPlannedSets(prev => prev + 1);
  };

  const decrementSets = () => {
    if (plannedSets > 1) {
      setPlannedSets(prev => prev - 1);
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
    <View style={styles.setupContainer}>
      {/* Exercise Selection Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Choose an exercise</Text>
        <TouchableOpacity
          style={styles.exerciseSelectButton}
          onPress={openDrawer}
        >
          <Text style={styles.exerciseSelectText}>
            {selectedExercise || 'Select exercise'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sets Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amount of sets</Text>
        <View style={styles.setCountContainer}>
          <TouchableOpacity 
            style={styles.setCountButton}
            onPress={decrementSets}
          >
            <Text style={styles.setCountButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.setCountText}>{plannedSets}</Text>
          
          <TouchableOpacity 
            style={styles.setCountButton}
            onPress={incrementSets}
          >
            <Text style={styles.setCountButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity 
        style={[
          styles.startButton,
          (!selectedExercise || plannedSets <= 0) && styles.startButtonDisabled
        ]}
        onPress={startExercise}
        disabled={!selectedExercise || plannedSets <= 0}
      >
        <Text style={styles.startButtonText}>Start exercise</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOngoing = () => (
    <>
      <ScrollView style={styles.ongoingContainer}>
        {ongoingExercise?.completedSets.map((set, index) => (
          <View key={index} style={styles.setContainer}>
            <Text>Set {index + 1}:</Text>
            <View style={styles.setInputContainer}>
              <TouchableOpacity style={styles.setInputButton}>
                <Text style={styles.setInputButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.setInputValue}>{set.reps}</Text>
              <TouchableOpacity style={styles.setInputButton}>
                <Text style={styles.setInputButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.setInputContainer}>
              <TouchableOpacity style={styles.setInputButton}>
                <Text style={styles.setInputButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.setInputValue}>{set.weight}</Text>
              <TouchableOpacity style={styles.setInputButton}>
                <Text style={styles.setInputButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.startButton} onPress={completeSet}>
        <Text style={styles.startButtonText}>Complete Set</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      
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
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 18,
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  setupContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2962ff',
    marginBottom: 12,
  },
  exerciseSelectButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exerciseSelectText: {
    color: '#333',
    fontSize: 16,
  },
  setCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setCountButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setCountButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 3,
  },
  setCountText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: Colors.primaryBlue,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.gray,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
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
    color: '#2962ff',
  },
  checkmark: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#2962ff',
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
    padding: 20,
    flex: 1,
  },
  setContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  setInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setInputButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  setInputValue: {
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewSetScreen;