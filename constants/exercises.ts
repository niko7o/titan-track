// Define the interface for exercise details
export interface ExerciseDetails {
  description: string;
  media: any; // Changed from string to any to support both strings and require statements
  muscleGroup: string;
  isCustom?: boolean;
}

export type ExercisesStore = Record<string, ExerciseDetails>;

// Default image for custom exercises - using local asset instead of URL
export const DEFAULT_EXERCISE_IMAGE = require('../assets/images/placeholder.jpg');

export const exerciseDetails: ExercisesStore = {
  'Bench Press': {
    description: 'A compound exercise for chest development, primarily targeting the pectoral muscles.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Push Ups': {
    description: 'A bodyweight exercise that targets the chest, triceps, and shoulders.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Chest Fly': {
    description: 'An isolation exercise that focuses on the chest muscles, performed with dumbbells or cables.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Bicep Curls': {
    description: 'An isolation exercise for the biceps, typically performed with dumbbells or a barbell.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Biceps',
  },
  'Hammer Curls': {
    description: 'A variation of bicep curls that targets the brachialis and forearm muscles.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Biceps',
  },
  'Concentration Curls': {
    description: 'An exercise that isolates the biceps for maximum contraction and growth.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Biceps',
  },
  'Tricep Dips': {
    description: 'A bodyweight exercise that targets the triceps, performed on parallel bars or a bench.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  'Tricep Extensions': {
    description: 'An isolation exercise for the triceps, performed with dumbbells or a cable machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  'Skull Crushers': {
    description: 'An exercise that targets the triceps, performed lying down with a barbell or dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  'Shoulder Press': {
    description: 'A compound exercise for the shoulders, performed with dumbbells or a barbell.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  'Lateral Raises': {
    description: 'An isolation exercise for the lateral deltoids, performed with dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  'Front Raises': {
    description: 'An exercise that targets the front deltoids, performed with dumbbells or a barbell.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  'Pull Ups': {
    description: 'A bodyweight exercise that targets the back, biceps, and shoulders.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  'Deadlifts': {
    description: 'A compound exercise that targets the entire posterior chain, including the back and legs.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  'Bent Over Rows': {
    description: 'An exercise that targets the back muscles, performed with a barbell or dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  'Squats': {
    description: 'A compound exercise that targets the legs, glutes, and core.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
  'Lunges': {
    description: 'An exercise that targets the legs and glutes, performed with bodyweight or added resistance.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
  'Leg Press': {
    description: 'A machine-based exercise that targets the quadriceps, hamstrings, and glutes.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
};

export const allExercises = Object.keys(exerciseDetails);

// Helper function to create a custom exercise
export const createCustomExercise = (
  name: string, 
  description: string, 
  muscleGroup: string
): ExerciseDetails => ({
  description,
  media: DEFAULT_EXERCISE_IMAGE,
  muscleGroup,
  isCustom: true,
});