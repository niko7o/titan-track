// app/(tabs)/_layout.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '@/screens/HomeScreen';
import ExercisesScreen from '@/screens/ExercisesScreen';
import NewSetScreen from '@/screens/NewSetScreen';

const Tab = createBottomTabNavigator();

const Layout = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} />
      <Tab.Screen name="New Set" component={NewSetScreen} />
    </Tab.Navigator>
  );
};

export default Layout;