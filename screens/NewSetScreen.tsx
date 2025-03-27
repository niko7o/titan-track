import React, { useState, useRef, useEffect } from 'react';
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
  useWindowDimensions,
  TextInput,
  StatusBar,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

import { exerciseDetails as builtInExercises, ExerciseDetails, ExercisesStore } from '../constants/exercises';
import { Colors } from '@/constants/Colors';
import { getMergedExercises } from '@/utils/storage';

interface OngoingExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
}

interface ExerciseCategory {
  name: string;
  exercises: string[];
}

const Header = ({ 
  title, 
  onBack, 
  rightAction = null,
  rightLabel = '',
  inProgress = false,
  progress = 0
}: { 
  title: string; 
  onBack?: () => void; 
  rightAction?: (() => void) | null;
  rightLabel?: string;
  inProgress?: boolean;
  progress?: number;
}) => (
  <SafeAreaView style={styles.headerSafeArea}>
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      {rightAction ? (
        <TouchableOpacity style={styles.headerButton} onPress={rightAction}>
          <Text style={styles.headerActionText}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
    </View>
    {inProgress && (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    )}
  </SafeAreaView>
);

const NewSetScreen = () => {
  const [allExercises, setAllExercises] = useState<ExercisesStore>(builtInExercises);
  const [exercisesList, setExercisesList] = useState<string[]>(Object.keys(builtInExercises));
  const [loadingExercises, setLoadingExercises] = useState(true);
  
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [plannedSets, setPlannedSets] = useState<number>(3);
  const [ongoingExercise, setOngoingExercise] = useState<OngoingExercise | null>(null);
  const [isDrawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [activeSet, setActiveSet] = useState<number>(0);
  const [showCompletedSets, setShowCompletedSets] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);

  const { height } = useWindowDimensions();
  const isFocused = useIsFocused();
  
  // Drawer animations
  const drawerHeight = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Function to load all exercises including custom ones
  const loadAllExercises = async () => {
    setLoadingExercises(true);
    try {
      const mergedExercises = await getMergedExercises(builtInExercises);
      setAllExercises(mergedExercises);
      const allExerciseNames = Object.keys(mergedExercises);
      setExercisesList(allExerciseNames);
      setFilteredExercises(allExerciseNames);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoadingExercises(false);
    }
  };
  
  // Load exercises on component mount
  useEffect(() => {
    loadAllExercises();
  }, []);
  
  // Reload exercises when the screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadAllExercises();
    }
  }, [isFocused]);
  
  // Group exercises by muscle group whenever allExercises changes
  useEffect(() => {
    if (loadingExercises) return;
    
    // Group exercises by muscle group
    const muscleGroups = Object.entries(allExercises).reduce((groups: Record<string, string[]>, [name, details]) => {
      const muscleGroup = details.muscleGroup;
      if (!groups[muscleGroup]) {
        groups[muscleGroup] = [];
      }
      groups[muscleGroup].push(name);
      return groups;
    }, {});

    // Convert to array format
    const categoriesArray = Object.entries(muscleGroups).map(([name, exercises]) => ({
      name,
      exercises
    }));

    setCategories(categoriesArray);
    
    // Initialize filtered exercises
    if (searchQuery.trim() === "") {
      setFilteredExercises(exercisesList);
    } else {
      filterExercises(searchQuery);
    }
  }, [allExercises, loadingExercises]);

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
      try {
        // Reset active set to 0
        setActiveSet(0);
        
        // Initialize the exercise with planned sets
        setOngoingExercise({
          exercise: selectedExercise,
          plannedSets,
          completedSets: Array(plannedSets).fill(null).map(() => ({ reps: 0, weight: 0 })),
        });
      } catch (error) {
        console.error('Error starting exercise:', error);
        Alert.alert('Error', 'There was a problem starting your workout.');
      }
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
    if (!ongoingExercise) return;
    
    try {
      // Create a deep copy of the completed sets array
      const updatedSets = ongoingExercise.completedSets.map((set, i) => 
        i === setIndex ? { reps, weight } : { ...set }
      );
      
      // Update the state with the new array
      setOngoingExercise({
        ...ongoingExercise,
        completedSets: updatedSets
      });
    } catch (error) {
      console.error('Error updating set:', error);
      Alert.alert('Error', 'There was a problem updating your set data.');
    }
  };

  const incrementReps = (setIndex: number) => {
    if (ongoingExercise) {
      const currentReps = ongoingExercise.completedSets[setIndex].reps;
      recordSet(setIndex, currentReps + 1, ongoingExercise.completedSets[setIndex].weight);
    }
  };

  const decrementReps = (setIndex: number) => {
    if (ongoingExercise && ongoingExercise.completedSets[setIndex].reps > 0) {
      const currentReps = ongoingExercise.completedSets[setIndex].reps;
      recordSet(setIndex, currentReps - 1, ongoingExercise.completedSets[setIndex].weight);
    }
  };

  const incrementWeight = (setIndex: number) => {
    if (ongoingExercise) {
      const currentWeight = ongoingExercise.completedSets[setIndex].weight;
      recordSet(setIndex, ongoingExercise.completedSets[setIndex].reps, currentWeight + 2.5);
    }
  };

  const decrementWeight = (setIndex: number) => {
    if (ongoingExercise && ongoingExercise.completedSets[setIndex].weight >= 2.5) {
      const currentWeight = ongoingExercise.completedSets[setIndex].weight;
      recordSet(setIndex, ongoingExercise.completedSets[setIndex].reps, currentWeight - 2.5);
    }
  };

  const advanceToNextSet = () => {
    if (!ongoingExercise) return;
    
    // Create a copy of the current set data
    const currentSetReps = ongoingExercise.completedSets[activeSet].reps;
    const currentSetWeight = ongoingExercise.completedSets[activeSet].weight;
    
    if (activeSet < ongoingExercise.plannedSets - 1) {
      // Move to the next set
      setActiveSet(prevSet => prevSet + 1);
      
      // Initialize the next set with the same values for better UX
      // Only if the next set has default values (both 0)
      const nextSet = ongoingExercise.completedSets[activeSet + 1];
      if (nextSet.reps === 0 && nextSet.weight === 0) {
        const updatedSets = [...ongoingExercise.completedSets];
        updatedSets[activeSet + 1] = { reps: currentSetReps, weight: currentSetWeight };
        setOngoingExercise({
          ...ongoingExercise,
          completedSets: updatedSets
        });
      }
    } else {
      // If we're on the last set, prompt to complete the exercise
      Alert.alert(
        'Complete Exercise',
        'You have finished all sets. Would you like to complete this exercise?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Complete',
            onPress: completeSet
          }
        ]
      );
    }
  };

  const handleWeightChange = (setIndex: number, text: string) => {
    if (ongoingExercise) {
      // Remove any non-numeric characters except decimal point
      const sanitizedText = text.replace(/[^\d.]/g, '');
      // Ensure we don't have multiple decimal points
      const parts = sanitizedText.split('.');
      const validText = parts.length > 1 
        ? `${parts[0]}.${parts.slice(1).join('')}` 
        : sanitizedText;
        
      const weight = parseFloat(validText) || 0;
      recordSet(setIndex, ongoingExercise.completedSets[setIndex].reps, weight);
    }
  };

  const handleRepsChange = (setIndex: number, text: string) => {
    if (ongoingExercise) {
      const reps = parseInt(text) || 0;
      recordSet(setIndex, reps, ongoingExercise.completedSets[setIndex].weight);
    }
  };

  const completeSet = async () => {
    if (ongoingExercise) {
      const completedExercise = {
        ...ongoingExercise,
        date: new Date().toISOString(),
        muscleGroup: allExercises[ongoingExercise.exercise]?.muscleGroup || '',
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

  const cancelExercise = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: () => setOngoingExercise(null)
        }
      ]
    );
  };
  
  const renderHeader = () => {
    if (ongoingExercise) {
      const progress = activeSet / ongoingExercise.plannedSets;
      return (
        <Header 
          title={ongoingExercise.exercise}
          onBack={cancelExercise}
          rightAction={completeSet}
          rightLabel="Finish"
          inProgress={true}
          progress={progress}
        />
      );
    }
    
    return (
      <Header 
        title="Setup your workout"
      />
    );
  };

  const renderSetup = () => (
    <ScrollView contentContainerStyle={styles.setupScrollContainer}>
      <View style={styles.setupContainer}>
        {/* Exercise Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose an exercise</Text>
          <TouchableOpacity
            style={styles.exerciseSelectButton}
            onPress={openDrawer}
          >
            <Text 
              style={[
                styles.exerciseSelectText,
                !selectedExercise && styles.exerciseSelectPlaceholder
              ]}
            >
              {selectedExercise || 'Select exercise'}
            </Text>
            <Text style={[
              styles.exerciseSelectIcon,
              selectedExercise && styles.exerciseSelectIconSelected
            ]}>
              {selectedExercise ? '✓' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sets Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Number of sets</Text>
          <View style={styles.setCountContainer}>
            <TouchableOpacity 
              style={[
                styles.setCountButton,
                plannedSets <= 1 && styles.disabledButton
              ]}
              onPress={decrementSets}
              disabled={plannedSets <= 1}
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
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderOngoing = () => {
    if (!ongoingExercise) return null;
    
    return (
      <ScrollView 
        style={styles.ongoingContainer}
        contentContainerStyle={styles.ongoingContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.setProgressContainer}>
          {ongoingExercise.completedSets.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.setProgressIndicator, 
                activeSet === index && styles.activeSetIndicator,
                index < activeSet && styles.completedSetIndicator
              ]} 
            />
          ))}
        </View>
        
        <View style={styles.currentSetContainer}>
          <Text style={styles.currentSetTitle}>Set {activeSet + 1}</Text>
          
          {/* Reps Row */}
          <View style={styles.inputGroupVertical}>
            <Text style={styles.inputLabel}>Reps</Text>
            <View style={styles.setInputContainer}>
              <TouchableOpacity 
                style={styles.setInputButton}
                onPress={() => decrementReps(activeSet)}
                activeOpacity={0.8}
              >
                <Text style={styles.setInputButtonText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.setInputValue}
                value={ongoingExercise.completedSets[activeSet].reps.toString()}
                onChangeText={(text) => handleRepsChange(activeSet, text)}
                keyboardType="numeric"
              />
              
              <TouchableOpacity 
                style={styles.setInputButton}
                onPress={() => incrementReps(activeSet)}
                activeOpacity={0.8}
              >
                <Text style={styles.setInputButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Weight Row */}
          <View style={[styles.inputGroupVertical, styles.weightGroup]}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <View style={styles.setInputContainer}>
              <TouchableOpacity 
                style={styles.setInputButton}
                onPress={() => decrementWeight(activeSet)}
                activeOpacity={0.8}
              >
                <Text style={styles.setInputButtonText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={[styles.setInputValue, styles.weightInputValue]}
                value={ongoingExercise.completedSets[activeSet].weight.toFixed(2)}
                onChangeText={(text) => handleWeightChange(activeSet, text)}
                keyboardType="numeric"
                maxLength={7}
              />
              
              <TouchableOpacity 
                style={styles.setInputButton}
                onPress={() => incrementWeight(activeSet)}
                activeOpacity={0.8}
              >
                <Text style={styles.setInputButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.nextSetButton} 
            onPress={advanceToNextSet}
            activeOpacity={0.9}
          >
            <Text style={styles.nextSetButtonText}>
              {activeSet < ongoingExercise.plannedSets - 1 ? 'Next Set' : 'Complete Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showCompletedSets && activeSet > 0 && (
          <View style={styles.previousSetsContainer}>
            <View style={styles.previousSetsHeader}>
              <Text style={styles.previousSetsTitle}>Previous Sets</Text>
              <TouchableOpacity 
                onPress={() => setShowCompletedSets(!showCompletedSets)}
              >
                <Text style={styles.toggleText}>Hide</Text>
              </TouchableOpacity>
            </View>
            
            {/* Column Headers */}
            <View style={styles.previousSetHeaderRow}>
              <Text style={[styles.previousSetHeaderText, { flex: 0.8 }]}>Set</Text>
              <Text style={styles.previousSetHeaderText}>Reps</Text>
              <Text style={styles.previousSetHeaderText}>Weight</Text>
            </View>
            
            <View style={styles.previousSetsList}>
              {ongoingExercise.completedSets.slice(0, activeSet).map((set, index) => (
                <View key={index} style={styles.previousSetItem}>
                  <Text style={[styles.previousSetLabel, { flex: 0.8 }]}>Set {index + 1}</Text>
                  <Text style={styles.previousSetValue}>{set.reps}</Text>
                  <Text style={styles.previousSetValue}>{set.weight.toFixed(2)} kg</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {!showCompletedSets && activeSet > 0 && (
          <TouchableOpacity 
            style={styles.showHistoryButton}
            onPress={() => setShowCompletedSets(true)}
          >
            <Text style={styles.showHistoryText}>Show Previous Sets</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const filterExercises = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      if (selectedCategory) {
        const categoryExercises = categories.find(c => c.name === selectedCategory)?.exercises || [];
        setFilteredExercises(categoryExercises);
      } else {
        setFilteredExercises(exercisesList);
      }
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    let filtered: string[];
    
    if (selectedCategory) {
      const categoryExercises = categories.find(c => c.name === selectedCategory)?.exercises || [];
      filtered = categoryExercises.filter(exercise => 
        exercise.toLowerCase().includes(lowerQuery)
      );
    } else {
      filtered = exercisesList.filter(exercise => 
        exercise.toLowerCase().includes(lowerQuery)
      );
    }
    
    setFilteredExercises(filtered);
  };

  const selectCategory = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
    
    if (categoryName) {
      const categoryExercises = categories.find(c => c.name === categoryName)?.exercises || [];
      setFilteredExercises(categoryExercises);
    } else {
      setFilteredExercises(exercisesList);
    }
  };

  const renderExerciseDrawer = () => {
    if (loadingExercises) {
      return (
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
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        </Animated.View>
      );
    }
  
    return (
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
          
          {/* Search input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={filterExercises}
            />
            {searchQuery !== "" && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => filterExercises("")}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Muscle group categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === null && styles.categorySelected
              ]}
              onPress={() => selectCategory(null)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategory === null && styles.categorySelectedText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.name && styles.categorySelected
                ]}
                onPress={() => selectCategory(category.name)}
              >
                <Text 
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.name && styles.categorySelectedText
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Exercise list */}
        {filteredExercises.length > 0 ? (
          <FlatList
            data={filteredExercises}
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
                <View>
                  <Text 
                    style={[
                      styles.exerciseItemText,
                      selectedExercise === item && styles.selectedExerciseItemText
                    ]}
                  >
                    {item}
                    {allExercises[item]?.isCustom && (
                      <Text style={styles.customBadge}> (Custom)</Text>
                    )}
                  </Text>
                  <Text style={styles.exerciseMuscleGroup}>
                    {allExercises[item]?.muscleGroup || ''}
                  </Text>
                </View>
                {selectedExercise === item && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No exercises found</Text>
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => filterExercises("")}
            >
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[
            styles.doneButton,
            !selectedExercise && styles.doneButtonDisabled
          ]}
          onPress={closeDrawerFast}
          disabled={!selectedExercise}
        >
          <Text style={styles.doneButtonText}>
            {selectedExercise ? `Continue with ${selectedExercise}` : 'Select an exercise'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
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
      
      {/* Exercise Selection Drawer */}
      {isDrawerVisible && renderExerciseDrawer()}
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
  setupScrollContainer: {
    flexGrow: 1,
  },
  setupContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  exerciseSelectButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSelectText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseSelectPlaceholder: {
    color: '#999',
  },
  exerciseSelectIcon: {
    fontSize: 16,
    color: '#666',
  },
  exerciseSelectIconSelected: {
    color: Colors.primaryBlue,
    fontWeight: 'bold',
  },
  setCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  setCountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  setCountButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  setCountText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: Colors.primaryBlue,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
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
    height: '80%',
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
    paddingBottom: 16,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 8,
  },
  clearSearchText: {
    color: '#999',
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categorySelected: {
    backgroundColor: Colors.primaryBlue,
  },
  categoryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  categorySelectedText: {
    color: 'white',
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
    fontWeight: '500',
  },
  selectedExerciseItemText: {
    color: Colors.primaryBlue,
  },
  exerciseMuscleGroup: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  checkmark: {
    color: Colors.primaryBlue,
    fontSize: 20,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  clearFiltersText: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: Colors.primaryBlue,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#ccc',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ongoingContainer: {
    flex: 1,
  },
  ongoingContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  setProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  setProgressIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  activeSetIndicator: {
    backgroundColor: Colors.primaryBlue,
  },
  completedSetIndicator: {
    backgroundColor: '#4caf50',
  },
  currentSetContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentSetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputGroupVertical: {
    width: '100%',
    marginBottom: 24,
  },
  weightGroup: {
    marginBottom: 28,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 12,
    color: '#777',
    fontWeight: '500',
    textAlign: 'center',
  },
  setInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  setInputButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setInputButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  setInputValue: {
    width: 80,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weightInputValue: {
    width: 120,
    fontSize: 26,
  },
  nextSetButton: {
    backgroundColor: Colors.primaryBlue,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextSetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  previousSetsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previousSetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  previousSetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  toggleText: {
    color: Colors.primaryBlue,
    fontWeight: '500',
    fontSize: 16,
  },
  previousSetHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 4,
  },
  previousSetHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
  },
  previousSetsList: {
    marginTop: 4,
  },
  previousSetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previousSetLabel: {
    flex: 1,
    fontWeight: '500',
    color: '#555',
  },
  previousSetValue: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  showHistoryButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  showHistoryText: {
    color: Colors.primaryBlue,
    fontWeight: '500',
  },
  completeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#777',
    fontWeight: '500',
  },
  headerSafeArea: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
    color: Colors.primaryBlue,
  },
  headerActionText: {
    fontSize: 16,
    color: Colors.primaryBlue,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primaryBlue,
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
  customBadge: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.primaryBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
});

export default NewSetScreen;