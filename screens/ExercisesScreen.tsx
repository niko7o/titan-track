// components/ExercisesScreen.tsx
import React, { useState, useRef } from 'react';
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
  useWindowDimensions
} from 'react-native';
import { exerciseDetails } from '@/constants/exercises';
import { Colors } from '@/constants/Colors';

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

// Dynamically extract unique muscle groups
const muscleGroups = Array.from(
  new Set(Object.values(exerciseDetails).map((detail) => detail.muscleGroup))
);

const ExercisesScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isDrawerVisible, setDrawerVisible] = useState<boolean>(false);

  const { height } = useWindowDimensions();
  
  // Drawer animations
  const drawerHeight = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = (exercise: string) => {
    setSelectedExercise(exercise);
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
    setSelectedMuscleGroup(selectedMuscleGroup === muscleGroup ? null : muscleGroup);
  };

  const filteredExercises = Object.keys(exerciseDetails).filter((exercise) => {
    const matchesSearch = exercise.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup
      ? exerciseDetails[exercise as keyof typeof exerciseDetails].muscleGroup === selectedMuscleGroup
      : true;
    return matchesSearch && matchesMuscleGroup;
  });

  // Group exercises by muscle group for better organization
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const muscleGroup = exerciseDetails[exercise as keyof typeof exerciseDetails].muscleGroup;
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
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => setSearchQuery('')}
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
        <Text style={styles.exerciseName}>{item}</Text>
        <Text style={styles.exerciseMuscleGroup}>
          {exerciseDetails[item as keyof typeof exerciseDetails].muscleGroup}
        </Text>
      </View>
      <Text style={styles.exerciseArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderExerciseList = () => {
    if (selectedMuscleGroup) {
      // If a muscle group is selected, only show those exercises
      return (
        <View style={styles.exerciseListContainer}>
          <Text style={styles.sectionTitle}>
            {selectedMuscleGroup} Exercises ({filteredExercises.length})
          </Text>
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item}
            renderItem={renderExerciseItem}
            style={styles.exerciseList}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      );
    }

    // If no muscle group is selected, group exercises by muscle group
    return (
      <ScrollView style={styles.exerciseListContainer}>
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
                  <Text style={styles.exerciseName}>{exercise}</Text>
                </View>
                <Text style={styles.exerciseArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderExerciseDrawer = () => {
    if (!selectedExercise) return null;
    
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
        
        <ScrollView 
          style={styles.drawerScrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedExercise}</Text>
            <Text style={styles.modalSubtitle}>
              {exerciseDetails[selectedExercise as keyof typeof exerciseDetails].muscleGroup}
            </Text>
          </View>
          
          <Image
            source={{ uri: exerciseDetails[selectedExercise as keyof typeof exerciseDetails].media }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          
          <Text style={styles.descriptionTitle}>How to perform</Text>
          <Text style={styles.modalDescription}>
            {exerciseDetails[selectedExercise as keyof typeof exerciseDetails].description}
          </Text>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.contentContainer}>
        {renderSearchBar()}
        {renderMuscleGroupFilter()}
        {renderExerciseList()}
      </View>
      
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
      
      {/* Exercise Details Drawer */}
      {isDrawerVisible && renderExerciseDrawer()}
    </View>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    zIndex: 2,
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
});

export default ExercisesScreen;