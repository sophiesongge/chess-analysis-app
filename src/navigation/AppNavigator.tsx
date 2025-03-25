import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
// 如果 AnalysisScreen 使用了命名导出而不是默认导出
import { AnalysisScreen } from '../screens/AnalysisScreen';
// 或者如果文件名不同
// import AnalysisScreen from '../screens/Analysis';

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
          component={AnalysisScreen} 
          options={{ title: '局面分析' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}