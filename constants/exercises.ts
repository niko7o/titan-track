export const exercises = {
    Chest: ['Bench Press', 'Push Ups', 'Chest Fly'],
    Biceps: ['Bicep Curls', 'Hammer Curls', 'Concentration Curls'],
    Triceps: ['Tricep Dips', 'Tricep Extensions', 'Skull Crushers'],
    Shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises'],
    Back: ['Pull Ups', 'Deadlifts', 'Bent Over Rows'],
    Legs: ['Squats', 'Lunges', 'Leg Press'],
};

export const exerciseDetails = {
    'Bench Press': 'A compound exercise for chest development, primarily targeting the pectoral muscles.',
    'Push Ups': 'A bodyweight exercise that targets the chest, triceps, and shoulders.',
    'Chest Fly': 'An isolation exercise that focuses on the chest muscles, performed with dumbbells or cables.',
    'Bicep Curls': 'An isolation exercise for the biceps, typically performed with dumbbells or a barbell.',
    'Hammer Curls': 'A variation of bicep curls that targets the brachialis and forearm muscles.',
    'Concentration Curls': 'An exercise that isolates the biceps for maximum contraction and growth.',
    'Tricep Dips': 'A bodyweight exercise that targets the triceps, performed on parallel bars or a bench.',
    'Tricep Extensions': 'An isolation exercise for the triceps, performed with dumbbells or a cable machine.',
    'Skull Crushers': 'An exercise that targets the triceps, performed lying down with a barbell or dumbbells.',
    'Shoulder Press': 'A compound exercise for the shoulders, performed with dumbbells or a barbell.',
    'Lateral Raises': 'An isolation exercise for the lateral deltoids, performed with dumbbells.',
    'Front Raises': 'An exercise that targets the front deltoids, performed with dumbbells or a barbell.',
    'Pull Ups': 'A bodyweight exercise that targets the back, biceps, and shoulders.',
    'Deadlifts': 'A compound exercise that targets the entire posterior chain, including the back and legs.',
    'Bent Over Rows': 'An exercise that targets the back muscles, performed with a barbell or dumbbells.',
    'Squats': 'A compound exercise that targets the legs, glutes, and core.',
    'Lunges': 'An exercise that targets the legs and glutes, performed with bodyweight or added resistance.',
    'Leg Press': 'A machine-based exercise that targets the quadriceps, hamstrings, and glutes.',
};

export const allExercises = Object.values(exercises).flat();