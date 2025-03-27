// Define the interface for exercise details
export interface ExerciseDetails {
  description: string;
  media: any; // Changed from string to any to support both strings and require statements
  muscleGroup: string;
  isCustom?: boolean;
  isDeleted?: boolean;
}

export type ExercisesStore = Record<string, ExerciseDetails>;

// Default image for custom exercises - using local asset instead of URL
export const DEFAULT_EXERCISE_IMAGE = require('../assets/images/placeholder.jpg');

export const exerciseDetails: ExercisesStore = {
  // Chest Exercises
  'Bench Press': {
    description: 'A compound exercise for chest development, primarily targeting the pectoral muscles.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Incline Bench Press': {
    description: 'A variation of the bench press that targets the upper portion of the pectoral muscles.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Cable Crossovers': {
    description: 'An isolation exercise for the chest, performed using a cable machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Dumbbell Flyes': {
    description: 'An isolation exercise for the chest, performed with dumbbells on a flat or incline bench.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Decline Bench Press': {
    description: 'A variation of the bench press that targets the lower portion of the pectoral muscles.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  'Incline Dumbbell Press': {
    description: 'A variation of the incline press that targets the upper chest, performed with dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Chest',
  },
  // Biceps Exercises
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
  'Preacher Curls': {
    description: 'An isolation exercise for the biceps, performed on a preacher bench.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Biceps',
  },
  'Zottman Curls': {
    description: 'A bicep exercise that also targets the forearms, performed with dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Biceps',
  },
  // Triceps Exercises
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
  'Overhead Tricep Extension': {
    description: 'An exercise that targets the triceps, performed with a dumbbell or cable.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  'Tricep Kickbacks': {
    description: 'An isolation exercise for the triceps, performed with dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  'Close Grip Bench Press': {
    description: 'A compound exercise that targets the triceps, performed with a barbell.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Triceps',
  },
  // Shoulders Exercises
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
  'Arnold Press': {
    description: 'A shoulder exercise that targets all three heads of the deltoid.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  'Upright Rows': {
    description: 'An exercise that targets the shoulders and traps, performed with a barbell or dumbbells.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  'Face Pulls': {
    description: 'An exercise that targets the rear deltoids and upper back, performed on a cable machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Shoulders',
  },
  // Back Exercises
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
  'Lat Pulldowns': {
    description: 'An exercise that targets the latissimus dorsi, performed on a cable machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  'Seated Rows': {
    description: 'An exercise that targets the back muscles, performed on a cable machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  'T-Bar Rows': {
    description: 'An exercise that targets the middle back, performed with a T-bar row machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Back',
  },
  // Legs Exercises
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
  'Leg Extensions': {
    description: 'An isolation exercise for the quadriceps, performed on a leg extension machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
  'Calf Raises': {
    description: 'An exercise that targets the calf muscles, performed with bodyweight or added resistance.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
  'Leg Curls': {
    description: 'An isolation exercise for the hamstrings, performed on a leg curl machine.',
    media: require('../assets/images/placeholder.jpg'),
    muscleGroup: 'Legs',
  },
  'Bulgarian Split Squats': {
    description: 'A single-leg exercise that targets the legs and glutes, performed with bodyweight or added resistance.',
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