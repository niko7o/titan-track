import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput
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
  id?: string;
  muscleGroup?: string;
}

const HomeScreen = () => {
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{index: number, exercise: CompletedExercise} | null>(null);
  const [editedSets, setEditedSets] = useState<{reps: string, weight: string}[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchCompletedExercises = async () => {
        setLoading(true);
        try {
          const data = await AsyncStorage.getItem('completedExercises');
          if (data) {
            let parsedExercises = JSON.parse(data);
            let needsUpdate = false;
            
            parsedExercises = parsedExercises.map((exercise: CompletedExercise) => {
              if (!exercise.id) {
                needsUpdate = true;
                return { ...exercise, id: generateUniqueId() };
              }
              return exercise;
            });
            
            // Sort exercises by date in descending order (newest first)
            parsedExercises.sort((a: CompletedExercise, b: CompletedExercise) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            if (needsUpdate) {
              await AsyncStorage.setItem('completedExercises', JSON.stringify(parsedExercises));
              console.log('Updated exercises with IDs');
            }
            
            setCompletedExercises(parsedExercises);
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

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const findExerciseIndex = (exerciseIdOrIndex: string | number): number => {
    if (typeof exerciseIdOrIndex === 'number') {
      return exerciseIdOrIndex;
    }
    return completedExercises.findIndex(ex => ex.id === exerciseIdOrIndex);
  };

  const deleteExercise = async (exerciseIdOrIndex: string | number) => {
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
              const index = findExerciseIndex(exerciseIdOrIndex);
              if (index === -1) return;

              const updatedExercises = [...completedExercises];
              updatedExercises.splice(index, 1);
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

  const editExercise = (exerciseIdOrIndex: string | number) => {
    const index = findExerciseIndex(exerciseIdOrIndex);
    if (index === -1) return;
    
    const exercise = completedExercises[index];
    setEditingExercise({ index, exercise });
    
    const initialSets = exercise.completedSets.map(set => ({
      reps: set.reps.toString(),
      weight: set.weight.toString()
    }));
    
    setEditedSets(initialSets);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExercise) return;
    
    try {
      const updatedSets = editedSets.map(set => ({
        reps: parseInt(set.reps, 10) || 0,
        weight: parseFloat(set.weight) || 0
      }));
      
      const updatedExercise = {
        ...editingExercise.exercise,
        completedSets: updatedSets
      };
      
      if (!updatedExercise.id) {
        updatedExercise.id = generateUniqueId();
      }
      
      const updatedExercises = [...completedExercises];
      updatedExercises[editingExercise.index] = updatedExercise;
      
      setCompletedExercises(updatedExercises);
      await AsyncStorage.setItem('completedExercises', JSON.stringify(updatedExercises));
      
      setIsEditModalVisible(false);
      setEditingExercise(null);
    } catch (error) {
      console.error('Failed to save edited exercise:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleUpdateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    const updatedSets = [...editedSets];
    
    updatedSets[index] = {
      ...updatedSets[index],
      [field]: value
    };
    
    setEditedSets(updatedSets);
  };

  const handleDeleteSet = (setIndex: number) => {
    Alert.alert(
      'Delete Set',
      `Are you sure you'd like to delete set #${setIndex + 1}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            const updatedSets = [...editedSets];
            updatedSets.splice(setIndex, 1);
            setEditedSets(updatedSets);
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddSet = () => {
    const newSet = { reps: '0', weight: '0' };
    setEditedSets([...editedSets, newSet]);
  };

  const renderEditModal = () => {
    if (!editingExercise) return null;
    
    return (
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingExercise.exercise.exercise}</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {editedSets.map((set, index) => (
                <View key={index} style={styles.editSetRow}>
                  <View style={styles.setNumberContainer}>
                    <Text style={styles.setNumber}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.editSetFields}>
                    <View style={styles.editSetField}>
                      <Text style={styles.editSetLabel}>Reps</Text>
                      <TextInput
                        style={styles.editSetInput}
                        value={set.reps}
                        onChangeText={(value) => handleUpdateSet(index, 'reps', value)}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={styles.editSetField}>
                      <Text style={styles.editSetLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.editSetInput}
                        value={set.weight}
                        onChangeText={(value) => handleUpdateSet(index, 'weight', value)}
                        keyboardType="decimal-pad"
                        maxLength={5}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.deleteSetButton}
                      onPress={() => handleDeleteSet(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.addSetContainer}>
              <TouchableOpacity 
                style={styles.addSetButton}
                onPress={handleAddSet}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primaryBlue} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const groupedExercises = completedExercises.reduce((acc, exercise) => {
    const date = new Date(exercise.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exercise);
    return acc;
  }, {} as Record<string, CompletedExercise[]>);

  const dates = Object.keys(groupedExercises).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

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

  const formatDateWithOrdinal = (date: Date) => {
    const day = date.getDate();
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                  (day % 10 === 2 && day !== 12) ? 'nd' :
                  (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    
    return `${weekday}, ${day}${suffix} ${month}`;
  };

  const renderExerciseItem = ({ item, index }: { item: CompletedExercise; index: number }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View>
          <Text style={styles.exerciseName}>{item.exercise}</Text>
          <Text style={styles.exerciseDate}>
            {formatDateWithOrdinal(new Date(item.date))}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => editExercise(item.id || index)}
          >
            <Ionicons name="pencil-outline" size={20} color={Colors.primaryBlue} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteExercise(item.id || index)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
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
            keyExtractor={(item) => item.id || item.date}
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
      
      {renderEditModal()}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  editSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editSetFields: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  editSetField: {
    flex: 1,
    marginRight: 8,
  },
  editSetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  editSetInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  deleteSetButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
  addSetContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
  },
  addSetText: {
    color: Colors.primaryBlue,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default HomeScreen;