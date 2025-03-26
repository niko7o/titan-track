import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseDetails, ExercisesStore, createCustomExercise } from '@/constants/exercises';

const CUSTOM_EXERCISES_KEY = 'custom_exercises';

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

// Delete a custom exercise
export const deleteCustomExercise = async (name: string): Promise<boolean> => {
  try {
    const customExercises = await getCustomExercises();
    
    if (customExercises[name]) {
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

// Get merged exercises (built-in + custom)
export const getMergedExercises = async (builtInExercises: ExercisesStore): Promise<ExercisesStore> => {
  const customExercises = await getCustomExercises();
  return {
    ...builtInExercises,
    ...customExercises
  };
}; 