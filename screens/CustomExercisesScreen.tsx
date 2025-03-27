import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  FlatList,
  Animated,
  PanResponder,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { getCustomExercises, getMergedExercises, deleteCustomExercise, saveCustomExercise } from '@/utils/storage';
import { ExerciseDetails, ExercisesStore } from '@/constants/exercises';

const CustomExercisesScreen = () => {
  const navigation = useNavigation();
  const [customExercises, setCustomExercises] = useState<ExercisesStore>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isDrawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // Form state for editing
  const [editExerciseName, setEditExerciseName] = useState<string>('');
  const [editExerciseDescription, setEditExerciseDescription] = useState<string>('');
  const [editExerciseMuscleGroup, setEditExerciseMuscleGroup] = useState<string>('');

  const { height } = useWindowDimensions();
  
  // Drawer animations
  const drawerHeight = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Load custom exercises
  useEffect(() => {
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    setLoading(true);
    try {
      const customs = await getCustomExercises();
      setCustomExercises(customs);
    } catch (error) {
      console.error("Error loading custom exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically extract unique muscle groups
  const muscleGroups = Array.from(
    new Set(Object.values(customExercises).map((detail) => detail.muscleGroup))
  );

  const openDrawer = (exercise?: string) => {
    if (exercise) {
      setSelectedExercise(exercise);
      setIsEditMode(false);
      
      // Populate form fields if in edit mode
      const exerciseDetails = customExercises[exercise];
      setEditExerciseName(exercise);
      setEditExerciseDescription(exerciseDetails.description);
      setEditExerciseMuscleGroup(exerciseDetails.muscleGroup);
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
      setIsEditMode(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        // Only allow dragging down (positive dy)
        if (dy > 0) {
          drawerHeight.setValue(dy);
          const dragPercentage = Math.min(dy / (height * 0.5), 1);
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
    // Check if exercise exists in customExercises
    if (!customExercises[exercise]) {
      Alert.alert(
        "Exercise Not Found",
        "This exercise may have been deleted or is no longer available.",
        [{ text: "OK" }]
      );
      return;
    }
    
    openDrawer(exercise);
  };

  const handleDeleteExercise = async (exerciseName: string) => {
    Alert.alert(
      "Delete Exercise",
      `Are you sure you want to delete "${exerciseName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteCustomExercise(exerciseName);
              if (success) {
                // Close drawer if open
                if (isDrawerVisible) {
                  closeDrawerFast();
                }
                
                // Reload exercises
                await loadCustomExercises();
                
                // Show success message
                Alert.alert("Success", "Exercise deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete exercise");
              }
            } catch (error) {
              console.error("Error deleting exercise:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    if (!selectedExercise) return;
    
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExercise || !editExerciseName.trim()) return;
    
    if (!editExerciseMuscleGroup.trim()) {
      Alert.alert('Error', 'Please select a muscle group');
      return;
    }

    if (!editExerciseDescription.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    try {
      // First delete the old exercise if name changed
      if (editExerciseName !== selectedExercise) {
        await deleteCustomExercise(selectedExercise);
      }
      
      // Then save with new values
      const success = await saveCustomExercise(
        editExerciseName.trim(),
        editExerciseDescription.trim(),
        editExerciseMuscleGroup.trim()
      );

      if (success) {
        // Reload exercises list
        await loadCustomExercises();
        
        // Close drawer
        closeDrawerFast();
        
        // Show success message
        Alert.alert('Success', 'Exercise updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update exercise');
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const renderExerciseItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.exerciseItem}
      onPress={() => handleExercisePress(item)}
    >
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item}</Text>
        <Text style={styles.exerciseMuscleGroup}>
          {customExercises[item].muscleGroup}
        </Text>
      </View>
      <Text style={styles.exerciseArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderCustomExercisesList = () => {
    if (loading) {
      return (
        <View style={[styles.exerciseListContainer, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading custom exercises...</Text>
        </View>
      );
    }

    const exerciseNames = Object.keys(customExercises);

    if (exerciseNames.length === 0) {
      return (
        <View style={styles.exerciseListContainer}>
          <Text style={styles.emptyListText}>
            You haven't created any custom exercises yet.
          </Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.exerciseListContainer}>
        <Text style={styles.sectionTitle}>
          Custom Exercises ({exerciseNames.length})
        </Text>
        <FlatList
          data={exerciseNames}
          keyExtractor={(item) => item}
          renderItem={renderExerciseItem}
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderExerciseDetail = () => {
    if (!selectedExercise) return null;
    
    const exercise = customExercises[selectedExercise];
    
    // Add a safety check for when exercise might be undefined
    if (!exercise) {
      return (
        <View style={styles.drawerScrollView}>
          <Text style={styles.errorText}>Exercise not found or has been deleted.</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={closeDrawerFast}
          >
            <Text style={styles.goBackButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView 
        style={styles.drawerScrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{selectedExercise}</Text>
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

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditPress}
          >
            <Text style={styles.editButtonText}>Edit Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteExercise(selectedExercise)}
          >
            <Text style={styles.deleteButtonText}>Delete Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderEditForm = () => {
    if (!selectedExercise) return null;
    
    // Check if the exercise still exists
    if (!customExercises[selectedExercise]) {
      return (
        <View style={styles.formScrollView}>
          <Text style={styles.errorText}>Exercise not found or has been deleted.</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={closeDrawerFast}
          >
            <Text style={styles.goBackButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.formScrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Edit Exercise</Text>
          
          <Text style={styles.inputLabel}>Exercise Name</Text>
          <TextInput
            style={styles.textInput}
            value={editExerciseName}
            onChangeText={setEditExerciseName}
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
                  editExerciseMuscleGroup === group && styles.muscleGroupSelectButtonActive
                ]}
                onPress={() => setEditExerciseMuscleGroup(group)}
              >
                <Text 
                  style={[
                    styles.muscleGroupSelectText,
                    editExerciseMuscleGroup === group && styles.muscleGroupSelectTextActive
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
            value={editExerciseDescription}
            onChangeText={setEditExerciseDescription}
            placeholder="Describe how to perform this exercise..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveEdit}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
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
          
          {/* Drawer Content - either edit form or details */}
          {isEditMode ? renderEditForm() : renderExerciseDetail()}
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Custom Exercises</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
        
        <View style={styles.contentContainer}>
          {renderCustomExercisesList()}
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  exerciseListContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  goBackButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  actionButtonsContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  editButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deleteButtonText: {
    color: '#ff3b30',
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
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 20,
  },
});

export default CustomExercisesScreen; 