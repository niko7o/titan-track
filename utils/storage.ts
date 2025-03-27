import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseDetails, ExercisesStore, createCustomExercise } from '@/constants/exercises';

const CUSTOM_EXERCISES_KEY = 'custom_exercises';
const DELETED_CUSTOM_EXERCISES_KEY = 'deleted_custom_exercises';

// Get all custom exercises
export const getCustomExercises = async (): Promise<ExercisesStore> => {
  try {
    const storedExercises = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    if (storedExercises) {
      return JSON.parse(storedExercises);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom exercises:', error);
    return {};
  }
};

// Save a custom exercise
export const saveCustomExercise = async (
  name: string,
  description: string,
  muscleGroup: string
): Promise<boolean> => {
  try {
    // Get existing custom exercises
    const customExercises = await getCustomExercises();
    
    // Add new exercise
    customExercises[name] = createCustomExercise(name, description, muscleGroup);
    
    // Save to storage
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
    return true;
  } catch (error) {
    console.error('Error saving custom exercise:', error);
    return false;
  }
};

// Get list of deleted custom exercises
export const getDeletedCustomExercises = async (): Promise<Record<string, ExerciseDetails>> => {
  try {
    const deletedExercises = await AsyncStorage.getItem(DELETED_CUSTOM_EXERCISES_KEY);
    if (deletedExercises) {
      return JSON.parse(deletedExercises);
    }
    return {};
  } catch (error) {
    console.error('Error loading deleted custom exercises:', error);
    return {};
  }
};

// Delete a custom exercise
export const deleteCustomExercise = async (name: string): Promise<boolean> => {
  try {
    const customExercises = await getCustomExercises();
    
    if (customExercises[name]) {
      // Store the deleted exercise in the deleted exercises list
      const deletedExercises = await getDeletedCustomExercises();
      deletedExercises[name] = { 
        ...customExercises[name],
        isDeleted: true 
      };
      await AsyncStorage.setItem(DELETED_CUSTOM_EXERCISES_KEY, JSON.stringify(deletedExercises));
      
      // Remove from active custom exercises
      delete customExercises[name];
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    return false;
  }
};

// Get merged exercises (built-in + custom + deleted custom)
export const getMergedExercises = async (builtInExercises: ExercisesStore): Promise<ExercisesStore> => {
  const customExercises = await getCustomExercises();
  const deletedCustomExercises = await getDeletedCustomExercises();
  
  return {
    ...builtInExercises,
    ...customExercises,
    ...deletedCustomExercises
  };
}; 