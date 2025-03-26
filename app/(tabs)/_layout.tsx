// app/(tabs)/_layout.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '@/screens/HomeScreen';
import ExercisesScreen from '@/screens/ExercisesScreen';
import NewSetScreen from '@/screens/NewSetScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Exercises: 'barbell-outline',
  Analytics: 'stats-chart',
  'New set': 'add-circle',
};

const Layout = () => {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const iconName = iconMap[route.name] || '';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Exercises" component={ExercisesScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="New set" component={NewSetScreen} />
      </Tab.Navigator>
  );
};

export default Layout;