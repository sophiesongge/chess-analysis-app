import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import { ChessProvider } from './context/ChessContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ChessProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '国际象棋' }} />
          <Stack.Screen name="Analyse" component={AnalysisScreen} options={{ title: '局面分析' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ChessProvider>
  );
}