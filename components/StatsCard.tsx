import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { StyleSheet } from 'react-native';

// Stats card component for displaying counts
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.statsCard}>
      <View style={styles.statsIconContainer}>
        <Ionicons name={icon} size={24} color={Colors.primaryBlue} />
      </View>
      <View style={styles.statsTextContainer}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

const styles = StyleSheet.create({
    statsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      statsIconContainer: {
        marginBottom: 8,
      },
      statsTextContainer: {
        justifyContent: 'center',
      },
      statsValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
      },
      statsTitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
      },
});

export default StatsCard;