// components/ExercisesScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  StatusBar,
  SafeAreaView,
  FlatList,
  Animated,
  PanResponder,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { exerciseDetails as builtInExercises, ExerciseDetails, ExercisesStore } from '@/constants/exercises';
import { Colors } from '@/constants/Colors';
import { getCustomExercises, getMergedExercises, saveCustomExercise } from '@/utils/storage';

// Header component similar to other screens
const Header = ({ title }: { title: string }) => (
  <SafeAreaView style={styles.headerSafeArea}>
    <View style={styles.header}>
      <View style={styles.headerPlaceholder} />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  </SafeAreaView>
);

const ExercisesScreen = () => {
  // State for exercises
  const [allExercises, setAllExercises] = useState<ExercisesStore>(builtInExercises);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for UI
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isDrawerVisible, setDrawerVisible] = useState<boolean>(false);
  
  // State for the form mode
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  
  // Form state
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [newExerciseDescription, setNewExerciseDescription] = useState<string>('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState<string>('');

  const { height } = useWindowDimensions();
  
  // Drawer animations
  const drawerHeight = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Dynamically extract unique muscle groups
  const muscleGroups = Array.from(
    new Set(Object.values(allExercises).map((detail) => detail.muscleGroup))
  );

  // Load custom exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      try {
        const mergedExercises = await getMergedExercises(builtInExercises);
        setAllExercises(mergedExercises);
      } catch (error) {
        console.error("Error loading exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  const openDrawer = (exercise?: string) => {
    if (exercise) {
      setSelectedExercise(exercise);
      setIsAddMode(false);
    } else {
      setSelectedExercise(null);
      setIsAddMode(true);
      // Reset form fields
      setNewExerciseName('');
      setNewExerciseDescription('');
      setNewExerciseMuscleGroup(selectedMuscleGroup || '');
    }
    
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
      setSelectedExercise(null);
    });
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

  const handleExercisePress = (exercise: string) => {
    openDrawer(exercise);
  };

  const toggleMuscleGroup = (muscleGroup: string) => {
    Keyboard.dismiss();
    setSelectedMuscleGroup(selectedMuscleGroup === muscleGroup ? null : muscleGroup);
  };

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    if (!newExerciseMuscleGroup.trim()) {
      Alert.alert('Error', 'Please select a muscle group');
      return;
    }

    if (!newExerciseDescription.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    try {
      const success = await saveCustomExercise(
        newExerciseName.trim(),
        newExerciseDescription.trim(),
        newExerciseMuscleGroup.trim()
      );

      if (success) {
        // Reload exercises list
        const mergedExercises = await getMergedExercises(builtInExercises);
        setAllExercises(mergedExercises);
        
        // Close drawer
        closeDrawerFast();
        
        // Show success message
        Alert.alert('Success', 'Custom exercise added successfully');
      } else {
        Alert.alert('Error', 'Failed to save custom exercise');
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const filteredExercises = Object.keys(allExercises).filter((exercise) => {
    const matchesSearch = exercise.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup
      ? allExercises[exercise].muscleGroup === selectedMuscleGroup
      : true;
    return matchesSearch && matchesMuscleGroup;
  });

  // Group exercises by muscle group for better organization
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const muscleGroup = allExercises[exercise].muscleGroup;
    if (!acc[muscleGroup]) {
      acc[muscleGroup] = [];
    }
    acc[muscleGroup].push(exercise);
    return acc;
  }, {} as Record<string, string[]>);

  const renderMuscleGroupFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.muscleGroupContent}
      >
        <TouchableOpacity
          style={[
            styles.muscleGroupButton,
            selectedMuscleGroup === null && styles.activeMuscleGroup
          ]}
          onPress={() => setSelectedMuscleGroup(null)}
        >
          <Text 
            style={[
              styles.muscleGroupText,
              selectedMuscleGroup === null && styles.activeMuscleGroupText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {muscleGroups.map((group) => (
          <TouchableOpacity
            key={group}
            style={[
              styles.muscleGroupButton,
              selectedMuscleGroup === group && styles.activeMuscleGroup
            ]}
            onPress={() => toggleMuscleGroup(group)}
          >
            <Text 
              style={[
                styles.muscleGroupText,
                selectedMuscleGroup === group && styles.activeMuscleGroupText
              ]}
            >
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="always"
        placeholderTextColor="#999"
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => {
            setSearchQuery('');
            Keyboard.dismiss();
          }}
        >
          <Text style={styles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderExerciseItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.exerciseItem}
      onPress={() => handleExercisePress(item)}
    >
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>
          {item}
          {allExercises[item].isCustom && <Text style={styles.customBadge}> (Custom)</Text>}
        </Text>
        <Text style={styles.exerciseMuscleGroup}>
          {allExercises[item].muscleGroup}
        </Text>
      </View>
      <Text style={styles.exerciseArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderExerciseList = () => {
    if (loading) {
      return (
        <View style={styles.exercisesAndButtonContainer}>
          <View style={[styles.exerciseListContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.addExerciseButton, styles.disabledButton]}
            disabled={true}
          >
            <Text style={styles.addExerciseButtonText}>Add Custom Exercise</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Container for the exercise list and add button
    return (
      <View style={styles.exercisesAndButtonContainer}>
        {/* Exercise list */}
        <View style={styles.exerciseListContainer}>
          {filteredExercises.length === 0 ? (
            <Text style={styles.emptyListText}>No exercises found</Text>
          ) : selectedMuscleGroup ? (
            // If a muscle group is selected, only show those exercises
            <>
              <Text style={styles.sectionTitle}>
                {selectedMuscleGroup} Exercises ({filteredExercises.length})
              </Text>
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item}
                renderItem={renderExerciseItem}
                style={styles.exerciseList}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            // If no muscle group is selected, group exercises by muscle group
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
                <View key={muscleGroup} style={styles.exerciseGroupContainer}>
                  <Text style={styles.sectionTitle}>{muscleGroup} ({exercises.length})</Text>
                  {exercises.map((exercise) => (
                    <TouchableOpacity 
                      key={exercise}
                      style={styles.exerciseItem}
                      onPress={() => handleExercisePress(exercise)}
                    >
                      <View style={styles.exerciseContent}>
                        <Text style={styles.exerciseName}>
                          {exercise}
                          {allExercises[exercise].isCustom && <Text style={styles.customBadge}> (Custom)</Text>}
                        </Text>
                        <Text style={styles.exerciseMuscleGroup}>
                          {allExercises[exercise].muscleGroup}
                        </Text>
                      </View>
                      <Text style={styles.exerciseArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 10 }} />
            </ScrollView>
          )}
        </View>
        
        {/* Add Exercise button - always visible below the list */}
        <TouchableOpacity 
          style={styles.addExerciseButton}
          onPress={() => openDrawer()}
        >
          <Text style={styles.addExerciseButtonText}>Add Custom Exercise</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderExerciseForm = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView 
        style={styles.formScrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formTitle}>Add Custom Exercise</Text>
        
        <Text style={styles.inputLabel}>Exercise Name</Text>
        <TextInput
          style={styles.textInput}
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          placeholder="e.g. Cable Crossover"
          placeholderTextColor="#999"
        />
        
        <Text style={styles.inputLabel}>Muscle Group</Text>
        <View style={styles.muscleGroupSelectContainer}>
          {muscleGroups.map((group) => (
            <TouchableOpacity
              key={group}
              style={[
                styles.muscleGroupSelectButton,
                newExerciseMuscleGroup === group && styles.muscleGroupSelectButtonActive
              ]}
              onPress={() => setNewExerciseMuscleGroup(group)}
            >
              <Text 
                style={[
                  styles.muscleGroupSelectText,
                  newExerciseMuscleGroup === group && styles.muscleGroupSelectTextActive
                ]}
              >
                {group}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textAreaInput]}
          value={newExerciseDescription}
          onChangeText={setNewExerciseDescription}
          placeholder="Describe how to perform this exercise..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleAddExercise}
        >
          <Text style={styles.saveButtonText}>Save Exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );

  const renderExerciseDetail = () => {
    if (!selectedExercise) return null;
    
    const exercise = allExercises[selectedExercise];
    
    return (
      <ScrollView 
        style={styles.drawerScrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedExercise}
            {exercise.isCustom && <Text style={styles.customBadge}> (Custom)</Text>}
          </Text>
          <Text style={styles.modalSubtitle}>
            {exercise.muscleGroup}
          </Text>
        </View>
        
        <Image
          source={typeof exercise.media === 'string' ? { uri: exercise.media } : exercise.media}
          style={styles.mediaImage}
          resizeMode="cover"
        />
        
        <Text style={styles.descriptionTitle}>How to perform</Text>
        <Text style={styles.modalDescription}>
          {exercise.description}
        </Text>
      </ScrollView>
    );
  };

  const renderExerciseDrawer = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.drawerKeyboardAvoidingView}
        pointerEvents="box-none"
      >
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
          
          {/* Drawer Content - either form or details */}
          {isAddMode ? renderExerciseForm() : renderExerciseDetail()}
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.contentContainer}>
          {renderSearchBar()}
          {renderMuscleGroupFilter()}
          {renderExerciseList()}
        </View>
        
        {/* Backdrop and Drawer positioned absolutely over the content */}
        {isDrawerVisible && (
          <>
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
            {renderExerciseDrawer()}
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerPlaceholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#999',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 20,
    height: 40, // Fixed height for the filter container
  },
  muscleGroupContent: {
    alignItems: 'center', // Center the chips vertically
    paddingRight: 20,
  },
  muscleGroupButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    height: 36, // Fixed height for the chips
  },
  activeMuscleGroup: {
    backgroundColor: Colors.primaryBlue,
  },
  muscleGroupText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  activeMuscleGroupText: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exerciseListContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16, // Add margin to separate from the button
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  exerciseGroupContainer: {
    marginBottom: 24,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customBadge: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.primaryBlue,
  },
  exerciseMuscleGroup: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  exerciseArrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 5,
  },
  backdropTouchable: {
    width: '100%',
    height: '100%',
  },
  drawerKeyboardAvoidingView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    zIndex: 10,
    overflow: 'hidden',
  },
  drawerHandleContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    zIndex: 5,
    backgroundColor: 'white',
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  drawerScrollView: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#555',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 24,
  },
  addExerciseButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 0, // Remove top margin since we have bottom margin on the container above
    marginBottom: 4, // Add a small bottom margin
  },
  addExerciseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Form styles
  formScrollView: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textAreaInput: {
    height: 120,
    padding: 16,
  },
  muscleGroupSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  muscleGroupSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  muscleGroupSelectButtonActive: {
    backgroundColor: Colors.primaryBlue,
  },
  muscleGroupSelectText: {
    color: '#666',
    fontWeight: '500',
  },
  muscleGroupSelectTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 50, // Extra space at the bottom for keyboard
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  exercisesAndButtonContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default ExercisesScreen;