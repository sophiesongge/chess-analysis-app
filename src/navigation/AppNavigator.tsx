import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
// 修改为默认导入
import AnalysisScreen from '../screens/AnalysisScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '国际象棋分析工具' }}
        />
        <Stack.Screen 
          name="Analyse" 
          component={AnalysisScreen as any} 
          options={{ title: '局面分析' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}