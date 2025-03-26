import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { ExercisesStore, exerciseDetails as builtInExercises } from '@/constants/exercises';
import { getMergedExercises } from '@/utils/storage';

interface CompletedExercise {
  exercise: string;
  plannedSets: number;
  completedSets: { reps: number; weight: number }[];
  date: string;
  muscleGroup: string;
}

// Header component similar to NewSetScreen
const Header = ({ title }: { title: string }) => (
  <SafeAreaView style={styles.headerSafeArea}>
    <View style={styles.header}>
      <View style={styles.headerPlaceholder} />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  </SafeAreaView>
);

const AnalyticsScreen = () => {
  const [exerciseData, setExerciseData] = useState<CompletedExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [allExercises, setAllExercises] = useState<ExercisesStore>(builtInExercises);

  useFocusEffect(
    useCallback(() => {
      const fetchExerciseData = async () => {
        setLoading(true);
        try {
          // Load completed exercises
          const data = await AsyncStorage.getItem('completedExercises');
          if (data) {
            setExerciseData(JSON.parse(data));
          }
          
          // Load all exercises including custom ones
          const mergedExercises = await getMergedExercises(builtInExercises);
          setAllExercises(mergedExercises);
        } catch (error) {
          console.error('Failed to load exercise data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchExerciseData();
    }, [])
  );

  // Filter exercise names by muscle group if selected
  const exerciseNames = Array.from(
    new Set(
      exerciseData
        .filter(entry => !selectedMuscleGroup || entry.muscleGroup === selectedMuscleGroup)
        .map(entry => entry.exercise)
    )
  );

  // Get all unique muscle groups
  const muscleGroups = Array.from(
    new Set(exerciseData.map(entry => entry.muscleGroup))
  ).filter(Boolean);

  const filterDataByTimeRange = (data: CompletedExercise[]) => {
    const now = new Date();
    
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return data.filter(entry => new Date(entry.date) >= weekAgo);
    } 
    
    if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return data.filter(entry => new Date(entry.date) >= monthAgo);
    }
    
    return data; // 'all' time range
  };

  const filterDataByExercise = (exercise: string) => {
    return filterDataByTimeRange(exerciseData)
      .filter((entry) => entry.exercise === exercise)
      .map((entry) => {
        // Calculate the average weight for all sets in this exercise
        const totalWeight = entry.completedSets.reduce((sum, set) => sum + set.weight, 0);
        const avgWeight = entry.completedSets.length > 0 
          ? totalWeight / entry.completedSets.length 
          : 0;
          
        // Calculate total volume (weight * reps)
        const volume = entry.completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        
        return {
          date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: entry.completedSets.reduce((max, set) => Math.max(max, set.weight), 0),
          avgWeight: avgWeight,
          volume: volume,
          fullDate: new Date(entry.date)
        };
      })
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime()) // Sort by date
      .filter((data) => isFinite(data.weight));
  };

  const chartData = selectedExercise ? filterDataByExercise(selectedExercise) : [];
  
  const renderChartTabs = () => (
    <View style={styles.chartTabsContainer}>
      <TouchableOpacity 
        style={[styles.chartTab, selectedExercise ? {} : styles.disabledButton]} 
        disabled={!selectedExercise}
      >
        <Text style={[styles.chartTabText, styles.activeTabText]}>Max Weight</Text>
      </TouchableOpacity>
      {/* More tabs can be added here for different metrics */}
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
        onPress={() => setTimeRange('week')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>
          Week
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
        onPress={() => setTimeRange('month')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'all' && styles.activeTimeRange]}
        onPress={() => setTimeRange('all')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'all' && styles.activeTimeRangeText]}>
          All Time
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMuscleGroupFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.muscleGroupContainer}
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
          onPress={() => setSelectedMuscleGroup(selectedMuscleGroup === group ? null : group)}
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
  );

  const renderExerciseSelector = () => (
    <View style={styles.exerciseSelectorContainer}>
      <Text style={styles.sectionTitle}>Exercises</Text>
      <View style={styles.exerciseTagsContainer}>
        {exerciseNames.length > 0 ? (
          exerciseNames.map((exercise) => (
            <TouchableOpacity
              key={exercise}
              style={[
                styles.exerciseTag,
                selectedExercise === exercise && styles.selectedExerciseTag,
              ]}
              onPress={() => setSelectedExercise(selectedExercise === exercise ? null : exercise)}
            >
              <Text 
                style={[
                  styles.exerciseTagText,
                  selectedExercise === exercise && styles.selectedExerciseTagText
                ]}
              >
                {exercise}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>
            {selectedMuscleGroup 
              ? `No exercises found for ${selectedMuscleGroup}`
              : 'No workout data available yet'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderAnalyticsContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading your workout data...</Text>
        </View>
      );
    }

    return (
      <>
        {renderMuscleGroupFilter()}
        {renderExerciseSelector()}
        
        {selectedExercise && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeaderContainer}>
              <Text style={styles.exerciseTitle}>{selectedExercise}</Text>
              {allExercises && allExercises[selectedExercise]?.isCustom && (
                <Text style={styles.customExerciseBadge}>{'(Custom)'}</Text>
              )}
            </View>
            
            <View style={styles.timeRangeRow}>
              {renderTimeRangeSelector()}
            </View>
            
            {renderChartTabs()}
            
            {chartData.length > 0 ? (
              <>
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: chartData.map(data => data.date),
                      datasets: [
                        {
                          data: chartData.map(data => data.weight),
                          color: () => Colors.primaryBlue,
                          strokeWidth: 2
                        }
                      ],
                      legend: ["Max Weight (kg)"]
                    }}
                    width={Dimensions.get('window').width - 80}
                    height={220}
                    yAxisSuffix=" kg"
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundColor: 'white',
                      backgroundGradientFrom: 'white',
                      backgroundGradientTo: 'white',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(41, 98, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '6',
                        strokeWidth: '2',
                        stroke: Colors.primaryBlue
                      },
                      propsForLabels: {
                        fontSize: 12
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: "6 6",
                        strokeWidth: 1
                      }
                    }}
                    style={styles.chart}
                    bezier
                  />
                </View>
                
                {/* Summary Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {chartData.length > 0 
                        ? Math.max(...chartData.map(data => data.weight)).toFixed(1) 
                        : '0'} kg
                    </Text>
                    <Text style={styles.statLabel}>Maximum Weight</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {chartData.length > 0 
                        ? chartData[chartData.length - 1].weight.toFixed(1) 
                        : '0'} kg
                    </Text>
                    <Text style={styles.statLabel}>Latest Weight</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {chartData.length}
                    </Text>
                    <Text style={styles.statLabel}>Total Workouts</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noChartDataContainer}>
                <Text style={styles.noDataText}>No data available for this time period</Text>
              </View>
            )}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderAnalyticsContent()}
      </ScrollView>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
  },
  muscleGroupContainer: {
    marginBottom: 24,
  },
  muscleGroupContent: {
    paddingRight: 20,
  },
  muscleGroupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeMuscleGroup: {
    backgroundColor: Colors.primaryBlue,
  },
  muscleGroupText: {
    color: '#666',
    fontWeight: '500',
  },
  activeMuscleGroupText: {
    color: 'white',
  },
  exerciseSelectorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedExerciseTag: {
    backgroundColor: Colors.primaryBlue,
  },
  exerciseTagText: {
    color: '#555',
    fontWeight: '500',
  },
  selectedExerciseTagText: {
    color: 'white',
  },
  noDataText: {
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartContainer: {
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
  chartHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  customExerciseBadge: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  timeRangeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeTimeRange: {
    backgroundColor: Colors.primaryBlue,
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: 'white',
  },
  chartTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chartTab: {
    paddingVertical: 8,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryBlue,
  },
  disabledButton: {
    opacity: 0.5,
  },
  chartTabText: {
    color: '#777',
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primaryBlue,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  noChartDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryBlue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  chartWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
});

export default AnalyticsScreen;