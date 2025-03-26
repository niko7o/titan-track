import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import StatsCard from '@/components/StatsCard';

interface CompletedExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
  date: string;
}

const HomeScreen = () => {
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchCompletedExercises = async () => {
        setLoading(true);
        try {
          const data = await AsyncStorage.getItem('completedExercises');
          if (data) {
            setCompletedExercises(JSON.parse(data));
          }
        } catch (error) {
          console.error('Failed to load completed exercises:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCompletedExercises();
    }, [])
  );

  const deleteExercise = async (index: number) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const updatedExercises = completedExercises.filter((_, i) => i !== index);
              setCompletedExercises(updatedExercises);
              await AsyncStorage.setItem('completedExercises', JSON.stringify(updatedExercises));
            } catch (error) {
              console.error('Failed to delete exercise:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Group exercises by date for better organization
  const groupedExercises = completedExercises.reduce((acc, exercise) => {
    const date = new Date(exercise.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exercise);
    return acc;
  }, {} as Record<string, CompletedExercise[]>);

  // Get dates sorted by most recent first
  const dates = Object.keys(groupedExercises).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate stats for the dashboard
  const totalWorkouts = dates.length;
  const totalExercises = completedExercises.length;
  const totalSets = completedExercises.reduce(
    (sum, exercise) => sum + exercise.completedSets.length, 0
  );

  const renderDateFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.dateFilterContainer}
      contentContainerStyle={styles.dateFilterContent}
    >
      <TouchableOpacity
        style={[
          styles.dateFilterButton,
          selectedDate === null && styles.activeDateFilter
        ]}
        onPress={() => setSelectedDate(null)}
      >
        <Text 
          style={[
            styles.dateFilterText,
            selectedDate === null && styles.activeDateFilterText
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      {dates.map((date) => (
        <TouchableOpacity
          key={date}
          style={[
            styles.dateFilterButton,
            selectedDate === date && styles.activeDateFilter
          ]}
          onPress={() => setSelectedDate(selectedDate === date ? null : date)}
        >
          <Text 
            style={[
              styles.dateFilterText,
              selectedDate === date && styles.activeDateFilterText
            ]}
          >
            {date}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExerciseItem = ({ item, index }: { item: CompletedExercise; index: number }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View>
          <Text style={styles.exerciseName}>{item.exercise}</Text>
          <Text style={styles.exerciseDate}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteExercise(index)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>

      <View style={styles.setsContainer}>
        {item.completedSets.map((set, setIndex) => (
          <View key={setIndex} style={styles.setItem}>
            <View style={styles.setNumberContainer}>
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
            </View>
            <View style={styles.setDetails}>
              <Text style={styles.setReps}>{set.reps} reps</Text>
              <Text style={styles.setWeight}>{set.weight} kg</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      );
    }

    if (completedExercises.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={60} color={Colors.gray} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyText}>Your completed exercises will appear here</Text>
        </View>
      );
    }

    // Filter exercises by selected date if needed
    const filteredExercises = selectedDate 
      ? completedExercises.filter(ex => 
          new Date(ex.date).toLocaleDateString() === selectedDate
        )
      : completedExercises;

    return (
      <>
        <View style={styles.statsContainer}>
          <StatsCard 
            title="Workouts" 
            value={totalWorkouts} 
            icon="calendar-outline" 
          />
          <StatsCard 
            title="Exercises" 
            value={totalExercises} 
            icon="barbell-outline" 
          />
          <StatsCard 
            title="Sets" 
            value={totalSets} 
            icon="layers-outline" 
          />
        </View>
        
        {renderDateFilter()}
        
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>
            {selectedDate 
              ? `Exercises on ${selectedDate}` 
              : 'Recent Exercises'}
          </Text>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateFilterContainer: {
    maxHeight: 40,
    marginBottom: 20,
  },
  dateFilterContent: {
    alignItems: 'center',
    paddingRight: 20,
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeDateFilter: {
    backgroundColor: Colors.primaryBlue,
  },
  dateFilterText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  activeDateFilterText: {
    color: 'white',
  },
  exercisesContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  exercisesList: {
    flexGrow: 1,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  exerciseDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  setsContainer: {
    marginTop: 8,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setNumber: {
    fontWeight: '600',
    color: '#555',
  },
  setDetails: {
    flexDirection: 'row',
  },
  setReps: {
    fontSize: 16,
    color: '#333',
    marginRight: 16,
  },
  setWeight: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
});

export default HomeScreen;